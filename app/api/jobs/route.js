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

    // Fetch real jobs from JSearch API
    const domains = profile?.domains?.join(' OR ') 
      || 'marketing finance technology';
    const location = profile?.location || 'India';
    const experience = profile?.experience_level 
      || 'fresher';

    let realJobs = [];

    try {
      // Try JSearch (RapidAPI)
      const jobRes = await fetch(
        `https://jsearch.p.rapidapi.com/search?` +
        `query=${encodeURIComponent(
          profile?.job_titles_suitable?.[0] || 'fresher'
        )} in ${location}&` +
        `page=1&num_pages=1&date_posted=week`,
        {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          }
        }
      );
      const jobData = await jobRes.json();
      realJobs = jobData.data || [];
    } catch (err) {
      console.error('Job fetch error:', err);
    }

    // Use Claude to match and score jobs
    const jobList = realJobs.slice(0, 20).map((j, i) => 
      `${i+1}. ${j.job_title} at ${j.employer_name}
      Location: ${j.job_city || 'Remote'}
      Type: ${j.job_employment_type}
      Description: ${j.job_description?.substring(0, 200)}`
    ).join('\n\n');

    const matchPrompt = `You are a career advisor.
Match these jobs with the candidate profile.

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

AVAILABLE JOBS:
${jobList || 'No jobs fetched, generate 8 realistic mock jobs'}

For each job (real or mock), calculate:
- Profile match percentage (be realistic, not generous)
- Why it matches or doesn't
- Probability of getting interview call
- Red flags if any

If no real jobs available, generate 8 realistic 
Indian job listings for this profile.

Return ONLY valid JSON:
{
  "jobs": [
    {
      "id": "unique_id",
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "type": "Full-time/Internship",
      "salary": "3-5 LPA or ₹15,000/month stipend",
      "skills_required": ["skill1", "skill2"],
      "experience_required": "0-1 years/Fresher",
      "description": "2-3 line job description",
      "match_percent": 78,
      "match_reasons": [
        "Your MBA matches their requirement",
        "Marketing skills align well"
      ],
      "gap_reasons": [
        "They want 1 year experience"
      ],
      "interview_probability": 65,
      "apply_url": "https://linkedin.com/jobs or #",
      "posted_days_ago": 2,
      "is_easy_apply": true,
      "company_size": "Startup/Mid-size/MNC",
      "perks": ["Remote", "Health Insurance"]
    }
  ],
  "profile_insights": {
    "strongest_match": "Marketing roles at startups",
    "improvement_tip": "Add Python to skills for better matches",
    "market_demand": "High/Medium/Low for your profile",
    "avg_match_score": 72
  }
}`;

    const matchMsg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ 
        role: 'user', 
        content: matchPrompt 
      }]
    });

    const matchText = matchMsg.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return Response.json(JSON.parse(matchText));
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
