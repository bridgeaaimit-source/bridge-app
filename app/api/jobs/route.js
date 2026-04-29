import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch(e) {
    return Response.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }

  const { action, resume_base64, profile, 
    job_url, job_description,
    company, job_title, uid } = body;

  console.log('=== API RECEIVED ===');
  console.log('Action:', action);
  console.log('Has profile:', !!profile);
  console.log('Profile name:', profile?.name);
  console.log('Has JD:', !!job_description);
  console.log('JD length:', job_description?.length);
  console.log('Has URL:', !!job_url);

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  // ACTION 1: Extract profile from resume
  if (action === 'extract_profile') {
    const prompt = `Extract key information from 
this resume for job matching.

Return ONLY valid JSON:
{
  "name": "full name",
  "email": "email if found",
  "location": "city, state",
  "education": {
    "degree": "B.Tech/MBA/BBA etc",
    "college": "college name",
    "year": "graduation year",
    "gpa": "if mentioned"
  },
  "experience_level": "Fresher/0-1 years/1-3 years",
  "domains": ["Marketing", "Finance", "Tech"],
  "skills": ["skill1", "skill2", "skill3"],
  "looking_for": "Full-time/Internship/Both",
  "languages": ["English", "Hindi"],
  "key_achievements": ["achievement1", "achievement2"],
  "profile_summary": "2 line professional summary",
  "job_titles_suitable": [
    "Marketing Executive",
    "Business Analyst",
    "Sales Manager"
  ],
  "companies_suitable": [
    "TCS", "Infosys", "startup"
  ],
  "salary_expectation": "3-5 LPA (based on profile)"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: resume_base64
            }
          },
          { type: 'text', text: prompt }
        ]
      }]
    });

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return Response.json(JSON.parse(text));
  }

  // ACTION: Score resume quality → initial Bridge Score
  if (action === 'score_resume') {
    const scorePrompt = `You are evaluating a student resume for quality and career readiness.

Score this resume across these dimensions and return ONLY valid JSON (no extra text):
{
  "overall_score": <integer 0-100>,
  "bridge_score": <integer 0-200, calculated as overall_score * 2>,
  "breakdown": {
    "completeness": <0-25, does it have contact, education, skills, experience/projects>,
    "clarity": <0-25, is it well-structured, readable, no typos>,
    "relevance": <0-25, does it show job-ready skills and achievements>,
    "impact": <0-25, does it show quantified results, internships, projects>
  },
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "verdict": "Brief 1-line verdict on this resume"
}

Be honest and fair. A blank or minimal resume should score 10-30. A strong MBA/engineering resume with projects and internships should score 70-90.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: resume_base64 }
          },
          { type: 'text', text: scorePrompt }
        ]
      }]
    });

    const scoreText = message.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    return Response.json(JSON.parse(scoreText));
  }

  // ACTION 2: Fetch and match real jobs
  if (action === 'fetch_jobs') {
    const { profile } = await request.json()
      .catch(() => ({}));

    console.log('=== FETCH JOBS API ===');
    console.log('Profile received:', !!profile);
    console.log('Profile name:', profile?.name);
    console.log('Profile has job titles:', !!profile?.job_titles_suitable);
    console.log('Profile has domains:', !!profile?.domains);
    console.log('Profile has skills:', !!profile?.skills);

    if (!profile) {
      return Response.json(
        { error: 'No profile provided. Please upload resume first.' },
        { status: 400 }
      );
    }

    console.log('Fetching real jobs for:',
      profile?.job_titles_suitable?.[0]);

    let realJobs = [];

    // Build more specific search queries from profile
    const experienceLevel = profile?.experience_level || 'Fresher';
    const location = profile?.location || 'India';
    const lookingFor = profile?.looking_for || 'Full-time';

    // Create multiple specific search queries
    const searchQueries = [];

    // Query 1: Specific job title + experience
    if (profile?.job_titles_suitable?.[0]) {
      searchQueries.push(`${profile.job_titles_suitable[0]} ${experienceLevel}`);
    }

    // Query 2: Domain + experience
    if (profile?.domains?.[0]) {
      searchQueries.push(`${profile.domains[0]} ${experienceLevel}`);
    }

    // Query 3: Top skills
    if (profile?.skills?.length > 0) {
      searchQueries.push(`${profile.skills.slice(0, 2).join(' ')} ${experienceLevel}`);
    }

    // Query 4: Job type specific
    if (lookingFor !== 'Both') {
      searchQueries.push(`${lookingFor} ${experienceLevel}`);
    }

    // Fallback query if none above
    if (searchQueries.length === 0) {
      searchQueries.push(`${experienceLevel} jobs`);
    }

    // Remove duplicates and limit to 4 queries
    const uniqueQueries = [...new Set(searchQueries)].slice(0, 4);

    for (const query of uniqueQueries) {
      try {
        console.log('Searching JSearch for:', query);

        const jobRes = await fetch(
          `https://jsearch.p.rapidapi.com/search?` +
          `query=${encodeURIComponent(query)}&` +
          `page=1&num_pages=1&date_posted=week&` +
          `country=in&language=en&` +
          `employment_types=${lookingFor === 'Internship' ? 'INTERN' : lookingFor === 'Full-time' ? 'FULLTIME' : 'PARTTIME'}`,
          {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
          }
        );

        const jobData = await jobRes.json();
        console.log('JSearch status:', jobData.status);
        console.log('Jobs found:', jobData.data?.length);

        if (jobData.data?.length > 0) {
          realJobs = [...realJobs, ...jobData.data];
        }
      } catch (err) {
        console.error('JSearch error:', err.message);
      }
    }

    console.log('Total real jobs fetched:', realJobs.length);

    // Format real jobs for Claude to match
    const jobList = realJobs.slice(0, 15).map((j, i) => 
      `${i+1}. 
      Title: ${j.job_title}
      Company: ${j.employer_name}
      Location: ${j.job_city || j.job_country || 'Remote'}
      Type: ${j.job_employment_type}
      Apply URL: ${j.job_apply_link}
      Posted: ${j.job_posted_at_datetime_utc}
      Description: ${j.job_description
        ?.substring(0, 300)}`
    ).join('\n\n');

    // Claude matches and scores
    const matchPrompt = `You are a STRICT career advisor for Indian college students.

CANDIDATE PROFILE:
Name: ${profile?.name}
Degree: ${profile?.education?.degree}
College: ${profile?.education?.college}
Skills: ${profile?.skills?.join(', ')}
Domains: ${profile?.domains?.join(', ')}
Experience: ${profile?.experience_level}
Location: ${profile?.location}
Looking for: ${profile?.looking_for}
Job Titles Suitable: ${profile?.job_titles_suitable?.join(', ') || 'Not specified'}

${realJobs.length > 0
  ? `REAL JOBS TO MATCH (use EXACT apply URLs):
${jobList}

STRICT MATCHING CRITERIA:
1. Match score MUST be based on actual skills overlap
2. Jobs with < 40% match should NOT be included
3. Experience level MUST match (Fresher should NOT see Senior roles)
4. Location preference should be considered
5. Job type (Full-time/Internship) MUST match "Looking for" preference
6. Domain relevance is CRITICAL - filter out unrelated domains
7. Only include jobs that have at least 2-3 skills from the candidate's profile

Keep the EXACT apply_url from the job data.`
  : `No real jobs fetched. Generate 6-8 HIGHLY SPECIFIC 
Indian job listings that match this exact profile.
- Use actual company names that hire this profile
- Make job titles match profile's suitable job titles
- Use skills from the candidate's skill list
- Match the experience level (${profile?.experience_level})
- Match the job type preference (${profile?.looking_for})
- Use realistic apply URLs (LinkedIn, company sites)`
}

Return ONLY valid JSON with STRICT filtering:
{
  "jobs": [
    {
      "id": "unique_id",
      "title": "exact job title (MUST match profile)",
      "company": "exact company name",
      "location": "city, state",
      "type": "Full-time or Internship (MUST match preference)",
      "salary": "realistic salary/stipend",
      "skills_required": ["skill1", "skill2", "skill3"],
      "experience_required": "0-1 years (MUST match profile)",
      "description": "2-3 line description specific to profile",
      "match_percent": (MUST be realistic 40-95 based on actual skill overlap),
      "match_reasons": ["specific reason why this matches", "another reason"],
      "gap_reasons": ["if any gaps exist"],
      "interview_probability": (realistic 30-85),
      "apply_url": "EXACT real URL from job data",
      "posted_days_ago": (number),
      "is_easy_apply": true/false,
      "company_size": "Startup/Mid-size/MNC",
      "perks": ["perk1", "perk2"],
      "source": "LinkedIn/Indeed/Naukri"
    }
  ],
  "profile_insights": {
    "strongest_match": "best role type for profile",
    "improvement_tip": "one specific tip",
    "market_demand": "High/Medium/Low",
    "avg_match_score": (number),
    "total_jobs_found": ${realJobs.length}
  }
}

IMPORTANT: 
- Only return jobs with match_percent >= 40
- If no jobs meet the criteria, return empty jobs array
- Do NOT include generic/template jobs
- Every job must be personalized to this specific candidate profile`;

    const matchMsg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: matchPrompt }]
    });

    const matchText = matchMsg.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const result = JSON.parse(matchText);
    
    // Double check apply URLs are real
    result.jobs = result.jobs.map(job => ({
      ...job,
      apply_url: job.apply_url?.startsWith('http') 
        ? job.apply_url 
        : `https://www.linkedin.com/jobs/search/?keywords=${
            encodeURIComponent(job.title)
          }&location=India`
    }));

    return Response.json(result);
  }

  // ACTION 3: Smart Apply - analyze job URL
  if (action === 'smart_apply') {
    
    // Validate inputs
    if (!profile) {
      return Response.json({
        error: 'No profile provided. Upload resume first.'
      }, { status: 400 });
    }

    if (!job_description && !job_url) {
      return Response.json({
        error: 'No job description or URL provided.'
      }, { status: 400 });
    }

    let jobContent = job_description || '';

    // Try to fetch URL content if URL provided
    if (job_url && !jobContent) {
      try {
        const pageRes = await fetch(job_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html',
          }
        });
        const html = await pageRes.text();
        jobContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 4000);
        console.log('Fetched URL content, length:', 
          jobContent.length);
      } catch(err) {
        console.error('URL fetch failed:', err.message);
        return Response.json({
          error: 'Could not fetch job URL. Please paste the JD instead.'
        }, { status: 400 });
      }
    }

    console.log('Job content length:', jobContent.length);
    console.log('Profile domains:', profile.domains);

    const prompt = `You are a strict career coach 
for Indian college students.

CANDIDATE PROFILE (use this for matching):
Name: ${profile.name || 'Candidate'}
Degree: ${profile.education?.degree || 'Not specified'}
College: ${profile.education?.college || 'Not specified'}
Skills: ${profile.skills?.join(', ') || 'Not specified'}
Domains: ${profile.domains?.join(', ') || 'Not specified'}
Experience: ${profile.experience_level || 'Fresher'}
Location: ${profile.location || 'India'}
Achievements: ${profile.key_achievements?.join(', ') || 'None listed'}

JOB DESCRIPTION TO ANALYZE:
${jobContent}

Analyze this job against the candidate profile.
Be strict and realistic. 

Return ONLY valid JSON, no markdown:
{
  "job_title": "title from JD",
  "company": "company from JD",
  "location": "location from JD",
  "job_type": "Full-time or Internship",
  "salary": "salary if mentioned",
  "key_requirements": ["req1","req2","req3","req4","req5"],
  "match_percent": (strict 0-100 based on actual profile vs JD),
  "interview_probability": (strict 0-100),
  "your_strengths": ["specific strength from profile"],
  "your_gaps": ["specific gap vs JD requirements"],
  "should_apply": true or false,
  "apply_recommendation": "one line honest recommendation",
  "preparation_plan": ["Step 1","Step 2","Step 3"],
  "likely_interview_questions": ["Q1","Q2","Q3","Q4","Q5"],
  "resume_keywords": ["keyword1","keyword2","keyword3"],
  "salary_negotiation": "expected range",
  "preparation_time": "X weeks",
  "red_flags": "any concerns or null"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    console.log('Claude response:', text.substring(0, 200));

    const result = JSON.parse(text);
    result.apply_url = job_url || '#';
    return Response.json(result);
  }

  return Response.json(
    { error: 'Invalid action' }, 
    { status: 400 }
  );
}
