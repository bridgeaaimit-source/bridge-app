import Anthropic from '@anthropic-ai/sdk';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const resumeFile = formData.get('resume');
    const resumeTextInput = formData.get('resumeText');
    const jobRole = formData.get('jobRole');
    const jobDescription = formData.get('jobDescription');

    if ((!resumeFile && !resumeTextInput) || !jobRole || !jobDescription) {
      return Response.json(
        { error: 'Resume (file or text), job role, and job description are required' },
        { status: 400 }
      );
    }

    console.log('Processing career intelligence request...');
    console.log('Job Role:', jobRole);
    
    let resumeText = '';
    
    // If text input provided, use it directly
    if (resumeTextInput) {
      resumeText = resumeTextInput;
      console.log('Using provided resume text, length:', resumeText.length);
    } 
    // Otherwise, parse PDF file
    else if (resumeFile) {
      console.log('Resume file:', resumeFile.name);
      
      try {
        // Convert resume file to buffer and extract text
        const bytes = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Use pdf-parse with proper error handling
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        resumeText = pdfData.text;
        console.log('Extracted resume text length:', resumeText.length);
        
        if (!resumeText || resumeText.trim().length < 50) {
          throw new Error('PDF appears to be empty or contains very little text');
        }
      } catch (error) {
        console.error('PDF parsing error:', error);
        
        return Response.json(
          { 
            error: 'Failed to parse PDF resume. The PDF might be image-based or encrypted. Please try using the "Text" option to paste your resume directly.',
            details: error.message 
          },
          { status: 400 }
        );
      }
    }
    
    // Validate we have resume text
    if (!resumeText || resumeText.trim().length < 50) {
      return Response.json(
        { error: 'Resume text is too short. Please provide a complete resume.' },
        { status: 400 }
      );
    }

    // Use Claude to analyze career gap
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `You are the world's best career coach, technical recruiter, and skills gap analyst. You have deep knowledge of every industry certification, online course, job market demand, and hiring pattern. When analyzing, be brutally honest but constructive. Always provide REAL, working URLs — never make up URLs.

CANDIDATE'S RESUME:
${resumeText}

TARGET JOB ROLE:
${jobRole}

JOB DESCRIPTION:
${jobDescription}

Analyze the gap between the candidate's current profile and the target role. Provide a comprehensive intelligence report.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "matchScore": (0-100, be realistic),
  "scoreBreakdown": {
    "skills": (0-100),
    "experience": (0-100),
    "education": (0-100)
  },
  "summary": "3-sentence honest assessment of their readiness",
  "biggestBlocker": "The #1 thing holding them back from getting this role",
  "estimatedPrepTime": "e.g. 3-6 months",
  "missingSkills": {
    "technical": [
      {
        "skill": "skill name",
        "currentLevel": (0-100),
        "requiredLevel": (0-100),
        "howToLearn": "specific actionable advice"
      }
    ],
    "soft": [],
    "tools": [],
    "domain": []
  },
  "certifications": [
    {
      "name": "Full certification name",
      "issuingBody": "e.g. AWS, Google, Microsoft",
      "logoAbbr": "e.g. AWS, GCP, PMI",
      "logoColor": "#hex color for the brand",
      "priority": "critical|recommended|bonus",
      "whyItGetsYouHired": "One powerful sentence",
      "duration": "e.g. 3-6 months",
      "cost": "e.g. $300 or Free",
      "demandLevel": "Very High|High|Medium",
      "validity": "e.g. 3 years",
      "whatYoullLearn": ["bullet 1", "bullet 2", "bullet 3"],
      "certificationUrl": "REAL official certification URL",
      "prepCourseUrl": "REAL course URL (Coursera/Udemy/etc)",
      "prepCoursePlatform": "platform name",
      "prepCourseName": "course name"
    }
  ],
  "courses": [
    {
      "name": "Course name",
      "platform": "Coursera|Udemy|YouTube|freeCodeCamp|edX",
      "instructor": "instructor name",
      "duration": "e.g. 40 hours",
      "rating": (4.0-5.0),
      "cost": "Free or $XX",
      "skillTaught": "main skill",
      "level": "Beginner|Intermediate|Advanced",
      "directUrl": "REAL working course URL"
    }
  ],
  "roadmap": [
    {
      "week": 1,
      "tasks": [
        {
          "title": "task description",
          "type": "learning|certification|project|apply",
          "timeEstimate": "e.g. 5 hours",
          "priority": "high|medium|low",
          "url": "URL or null"
        }
      ]
    }
  ],
  "resumeTips": [
    {
      "original": "weak bullet point from their resume or typical weak version",
      "improved": "stronger, more impactful version",
      "reason": "why the improved version is better"
    }
  ]
}

IMPORTANT:
- Provide 3-5 certifications maximum, prioritized by impact
- Provide 6-10 courses across different platforms
- Roadmap should span 12 weeks (3 months)
- Resume tips should be 5 specific improvements
- All URLs must be real and working
- Be specific to the role and industry`;

    console.log('Calling Claude API...');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    console.log('Claude response received, parsing JSON...');

    const result = JSON.parse(responseText);

    console.log('Career intelligence analysis complete');
    console.log('Match score:', result.matchScore);
    console.log('Missing skills:', Object.values(result.missingSkills).flat().length);
    console.log('Certifications:', result.certifications.length);
    console.log('Courses:', result.courses.length);

    return Response.json(result);

  } catch (error) {
    console.error('Career intelligence error:', error);
    return Response.json(
      { 
        error: 'Failed to analyze career intelligence',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
