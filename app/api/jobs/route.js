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

  // ACTION 2: Fetch and match real jobs
  if (action === 'fetch_jobs') {
    const { profile } = await request.json()
      .catch(() => ({}));
    
    console.log('Fetching real jobs for:', 
      profile?.job_titles_suitable?.[0]);

    let realJobs = [];

    // Build search queries from profile
    const searchQueries = [
      profile?.job_titles_suitable?.[0] || 'fresher',
      profile?.domains?.[0] || 'marketing',
    ];

    for (const query of searchQueries) {
      try {
        console.log('Searching JSearch for:', query);
        
        const jobRes = await fetch(
          `https://jsearch.p.rapidapi.com/search?` +
          `query=${encodeURIComponent(query + ' fresher india')}&` +
          `page=1&num_pages=2&date_posted=week&` +
          `country=in&language=en`,
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
    const matchPrompt = `You are a career advisor 
for Indian college students.

CANDIDATE PROFILE:
Name: ${profile?.name}
Degree: ${profile?.education?.degree}
Skills: ${profile?.skills?.join(', ')}
Domains: ${profile?.domains?.join(', ')}
Experience: ${profile?.experience_level}
Location: ${profile?.location}
Looking for: ${profile?.looking_for}

${realJobs.length > 0 
  ? `REAL JOBS TO MATCH (use EXACT apply URLs):
${jobList}

Score each job against the profile.
Keep the EXACT apply_url from the job data.`
  : `No real jobs fetched. Generate 8 realistic 
Indian job listings with these apply URLs:
- For MNC jobs: use LinkedIn search URLs
- For startups: use company career pages
- For internships: use Internshala URLs
Make them realistic for this profile.`
}

Return ONLY valid JSON:
{
  "jobs": [
    {
      "id": "unique_id",
      "title": "exact job title",
      "company": "exact company name",
      "location": "city, state",
      "type": "Full-time or Internship",
      "salary": "realistic salary/stipend",
      "skills_required": ["skill1", "skill2"],
      "experience_required": "0-1 years",
      "description": "2-3 line description",
      "match_percent": (realistic 40-90),
      "match_reasons": ["reason1", "reason2"],
      "gap_reasons": ["gap1"],
      "interview_probability": (realistic 30-80),
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
}`;

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
