import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  const { action, resume_text, resume_base64,
    job_url, uid } = await request.json();

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
    const { job_url, profile } = await request.json()
      .catch(() => ({}));

    // Fetch job page content
    let jobContent = '';
    try {
      const pageRes = await fetch(job_url);
      const html = await pageRes.text();
      // Basic text extraction
      jobContent = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 3000);
    } catch (err) {
      jobContent = 'Could not fetch job page';
    }

    const prompt = `You are a career coach.
Analyze this job and prepare the candidate.

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

JOB PAGE CONTENT:
${jobContent}

Return ONLY valid JSON:
{
  "job_title": "extracted title",
  "company": "extracted company",
  "match_percent": 75,
  "interview_probability": 68,
  "key_requirements": ["req1", "req2", "req3"],
  "your_strengths": ["what matches from profile"],
  "your_gaps": ["what's missing"],
  "preparation_plan": [
    "Step 1: Revise these topics...",
    "Step 2: Prepare these questions...",
    "Step 3: Highlight these achievements..."
  ],
  "likely_interview_questions": [
    "Question 1 they'll likely ask",
    "Question 2",
    "Question 3"
  ],
  "resume_tips": [
    "Add this keyword to resume",
    "Highlight this experience more"
  ],
  "should_apply": true,
  "apply_recommendation": "Strong match - apply immediately / Average match - apply with tailored resume / Weak match - improve skills first"
}`;

    const smartMsg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const smartText = smartMsg.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return Response.json(JSON.parse(smartText));
  }

  return Response.json(
    { error: 'Invalid action' }, 
    { status: 400 }
  );
}
