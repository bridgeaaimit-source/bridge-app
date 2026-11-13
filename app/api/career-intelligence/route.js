import Anthropic from '@anthropic-ai/sdk';
import { trackTokensServer } from '@/lib/tokenTrackerServer';
import { extractJson } from '@/lib/extractJson';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume');
    const resumeTextInput = formData.get('resumeText');
    const jobRole = formData.get('jobRole');
    const jobDescription = formData.get('jobDescription');
    const userId = formData.get('userId') || formData.get('uid');

    if ((!resumeFile && !resumeTextInput) || !jobRole || !jobDescription) {
      return Response.json(
        { error: 'Resume (file or text), job role, and job description are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      return Response.json(
        { error: 'Career analysis is unavailable right now. Please try again in a minute.' },
        { status: 503 }
      );
    }

    const client = new Anthropic({ apiKey });

    const commonContext = `You are an expert career coach and campus recruiter for Indian students. Be honest but constructive.

TARGET JOB ROLE: ${jobRole}

JOB DESCRIPTION:
${jobDescription}

Analyze the gap between the candidate's resume and this role.
FACT RULES: only recommend certifications, courses and platforms you are certain exist today.
If you are not sure a certificate or course exists, leave it out. Never invent URLs; use null when unsure.
Return ONLY valid JSON (no markdown, no code blocks) with exactly the structure below.`;

    const partA = `${commonContext}
{
  "matchScore": (0-100, be realistic),
  "scoreBreakdown": { "skills": (0-100), "experience": (0-100), "education": (0-100) },
  "summary": "3-sentence honest assessment of their readiness",
  "biggestBlocker": "The #1 thing holding them back from getting this role",
  "estimatedPrepTime": "e.g. 3-6 months",
  "missingSkills": {
    "technical": [ { "skill": "skill name", "currentLevel": (0-100), "requiredLevel": (0-100), "howToLearn": "specific actionable advice" } ],
    "soft": [], "tools": [], "domain": []
  },
  "resumeTips": [ { "original": "weak bullet from their resume", "improved": "stronger version", "reason": "why it is better" } ]
}
Give at most 4 skills per category and exactly 5 resume tips.`;

    const partB = `${commonContext}
{
  "certifications": [
    {
      "name": "Full certification name", "issuingBody": "e.g. AWS, Google, Microsoft", "logoAbbr": "e.g. AWS",
      "logoColor": "#hex", "priority": "critical|recommended|bonus", "whyItGetsYouHired": "One sentence",
      "duration": "e.g. 3-6 months", "cost": "e.g. $300 or Free", "demandLevel": "Very High|High|Medium",
      "validity": "e.g. 3 years", "whatYoullLearn": ["bullet 1", "bullet 2", "bullet 3"],
      "certificationUrl": "official URL or null", "prepCourseUrl": "URL or null",
      "prepCoursePlatform": "platform name", "prepCourseName": "course name"
    }
  ],
  "courses": [
    {
      "name": "Course name", "platform": "Coursera|Udemy|YouTube|freeCodeCamp|edX|NPTEL|SWAYAM",
      "instructor": "instructor or institution", "duration": "e.g. 40 hours", "rating": (4.0-5.0),
      "cost": "Free or price", "skillTaught": "main skill", "level": "Beginner|Intermediate|Advanced",
      "directUrl": "URL or null"
    }
  ]
}
Give 3-4 certifications prioritized by impact and 6 courses across platforms.`;

    const partC = `${commonContext}
{
  "roadmap": [
    { "week": 1, "tasks": [ { "title": "task description", "type": "learning|certification|project|apply", "timeEstimate": "e.g. 5 hours", "priority": "high|medium|low", "url": null } ] }
  ]
}
The roadmap spans 12 weeks with 2-3 short tasks per week.`;

    let resumeBlock;
    if (resumeFile) {
      const bytes = await resumeFile.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      resumeBlock = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };
    } else {
      if (!resumeTextInput || resumeTextInput.trim().length < 50) {
        return Response.json({ error: 'Resume text is too short. Please provide your full resume.' }, { status: 400 });
      }
      resumeBlock = { type: 'text', text: `CANDIDATE RESUME:\n${resumeTextInput}` };
    }

    // Three smaller calls in parallel instead of one 8,000-token call
    // (that took ~112 s end to end in testing). One retry per part.
    const runPart = async (instruction, maxTokens, label) => {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const message = await client.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: [resumeBlock, { type: 'text', text: instruction }] }],
          });
          trackTokensServer(userId || 'anonymous', 'career-intelligence', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-sonnet-4-5').catch(() => {});
          return extractJson(message.content[0].text);
        } catch (err) {
          console.error(`Career intelligence part ${label} attempt ${attempt} failed:`, err.message);
          if (attempt === 2) throw err;
        }
      }
    };

    const [a, b, c] = await Promise.all([
      runPart(partA, 3000, 'A'),
      runPart(partB, 3500, 'B'),
      runPart(partC, 2500, 'C'),
    ]);

    const result = {
      ...a,
      missingSkills: { technical: [], soft: [], tools: [], domain: [], ...(a?.missingSkills || {}) },
      certifications: Array.isArray(b?.certifications) ? b.certifications : [],
      courses: Array.isArray(b?.courses) ? b.courses : [],
      roadmap: Array.isArray(c?.roadmap) ? c.roadmap : [],
      resumeTips: Array.isArray(a?.resumeTips) ? a.resumeTips : [],
    };

    return Response.json(result);

  } catch (error) {
    console.error('Career intelligence error:', error.message);
    return Response.json(
      { error: 'We could not complete your career analysis. Please try again.' },
      { status: 502 }
    );
  }
}
