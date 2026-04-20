import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  const body = await request.json();
  const { action, resume_base64, profile, 
    extra_domains } = body;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  // ACTION 1: Extract full MBA profile from resume
  if (action === 'extract_mba_profile') {
    const prompt = `You are an expert MBA career advisor.
Extract complete profile from this resume for 
internship matching.

Return ONLY valid JSON, no markdown:
{
  "name": "full name",
  "mba_college": "college name",
  "mba_specialization": ["Marketing", "HR"],
  "graduation_year": "2025",
  "skills": ["Excel", "Python", "Canva"],
  "past_experience": [
    {
      "company": "company name",
      "role": "role",
      "duration": "6 months"
    }
  ],
  "projects": ["project 1", "project 2"],
  "location": "city",
  "languages": ["English", "Hindi"],
  "certifications": ["certification 1"],
  "primary_domain": "Marketing",
  "open_to_domains": ["Marketing", "HR", "Operations"],
  "target_companies": ["HUL", "P&G", "Deloitte"],
  "target_industries": ["FMCG", "Consulting", "BFSI"],
  "profile_summary": "2 line summary",
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
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

  // ACTION 2: Find and match internships
  if (action === 'find_internships') {
    // Combine profile domains + extra domains selected
    const allDomains = [
      ...(profile?.open_to_domains || []),
      ...(extra_domains || [])
    ];
    const uniqueDomains = [...new Set(allDomains)];

    // Fetch real internships from JSearch
    let realInternships = [];
    
    for (const domain of uniqueDomains.slice(0, 3)) {
      try {
        const res = await fetch(
          `https://jsearch.p.rapidapi.com/search?` +
          `query=${encodeURIComponent(
            `MBA ${domain} internship india` 
          )}&page=1&num_pages=1&` +
          `date_posted=month&employment_types=INTERN`,
          {
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
          }
        );
        const data = await res.json();
        if (data.data?.length > 0) {
          realInternships = [
            ...realInternships, 
            ...data.data.slice(0, 5)
          ];
        }
      } catch(e) {
        console.error('JSearch error:', e.message);
      }
    }

    // Claude matches internships to profile
    const internshipList = realInternships
      .slice(0, 15)
      .map((j, i) => 
        `${i+1}. ${j.job_title} at ${j.employer_name}
        Location: ${j.job_city || 'Remote'}
        Apply: ${j.job_apply_link}
        Description: ${j.job_description
          ?.substring(0, 200)}`
      ).join('\n\n');

    const matchPrompt = `You are an MBA career advisor.
Match these internships to this MBA student profile.

STUDENT PROFILE:
Name: ${profile?.name}
MBA Specialization: ${profile?.mba_specialization?.join(', ')}
Open to Domains: ${uniqueDomains.join(', ')}
Skills: ${profile?.skills?.join(', ')}
Past Experience: ${profile?.past_experience
  ?.map(e => e.role + ' at ' + e.company)
  .join(', ')}
Location: ${profile?.location}
Target Industries: ${profile?.target_industries?.join(', ')}

${realInternships.length > 0
  ? `REAL INTERNSHIPS TO MATCH:
${internshipList}
Use EXACT apply URLs from the data.`
  : `No real internships fetched.
Generate 10 realistic MBA internships for India.
Mix of domains: ${uniqueDomains.join(', ')}
Companies: HUL, P&G, Deloitte, KPMG, EY, 
  Swiggy, Zomato, HDFC, Axis Bank, ITC,
  McKinsey, BCG, Amazon, Flipkart, Reliance
For apply_url use:
https://www.linkedin.com/jobs/search/?keywords=MBA+${encodeURIComponent(uniqueDomains[0] || 'marketing')}+internship&location=India`
}

STRICT MATCHING RULES:
- HR specialization → show HR + Operations + 
  General Management internships
- Marketing → show Marketing + Brand + 
  Digital Marketing internships
- Finance → show Finance + Banking + 
  Consulting internships
- If extra_domains selected → include those too
- Match % must be realistic (not all 90%+)
- Stipend must be realistic for MBA (15k-50k)

Return ONLY valid JSON:
{
  "internships": [
    {
      "id": "unique_id",
      "title": "Internship title",
      "company": "Company name",
      "location": "City",
      "domain": "Marketing/HR/Finance/Operations",
      "stipend": "₹25,000/month",
      "duration": "2 months",
      "ppo_available": true/false,
      "match_percent": (40-95, realistic),
      "match_reasons": [
        "specific reason from profile"
      ],
      "skill_gaps": [
        "specific missing skill"
      ],
      "interview_probability": (30-80),
      "apply_url": "real working URL",
      "posted_days_ago": 1-14,
      "company_type": "MNC/Startup/FMCG/BFSI/Consulting",
      "perks": ["PPO", "Certificate", "Live Projects"],
      "description": "2-3 line description",
      "deadline": "Apply by: X days"
    }
  ],
  "search_insights": {
    "best_domain": "domain with most matches",
    "top_company_type": "most matched company type",
    "avg_match": (number),
    "total_found": (number),
    "tip": "specific tip for this profile"
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

    return Response.json(JSON.parse(matchText));
  }

  // ACTION 3: Generate cover letter
  if (action === 'cover_letter') {
    const { internship, profile } = body;

    const prompt = `Write a professional cover letter 
for this MBA student applying for this internship.

STUDENT PROFILE:
Name: ${profile?.name}
MBA: ${profile?.mba_specialization?.join('+')} 
  at ${profile?.mba_college}
Skills: ${profile?.skills?.join(', ')}
Experience: ${profile?.past_experience
  ?.map(e => `${e.role} at ${e.company}`)
  .join(', ')}
Strengths: ${profile?.strengths?.join(', ')}

INTERNSHIP:
Role: ${internship?.title}
Company: ${internship?.company}
Domain: ${internship?.domain}
Description: ${internship?.description}

Write a compelling 3-paragraph cover letter:
1. Opening: Why this company + role excites them
2. Middle: Specific experience/skills that match
3. Closing: Enthusiasm + call to action

Tone: Professional but enthusiastic
Length: 200-250 words
Make it personalized, NOT generic.

Return ONLY the cover letter text, 
no JSON, no extra formatting.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    return Response.json({
      cover_letter: message.content[0].text
    });
  }

  return Response.json(
    { error: 'Invalid action' }, 
    { status: 400 }
  );
}
