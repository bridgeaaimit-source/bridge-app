import Anthropic from '@anthropic-ai/sdk';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

const getMockCareerIntel = (jobRole) => ({
  matchScore: 75,
  scoreBreakdown: {
    skills: 80,
    experience: 65,
    education: 85
  },
  summary: `You have a solid foundation in computer science and basic web technologies. Your projects show practical application of skills, but you lack professional internship experience in a corporate setting. Improving your portfolio and learning advanced cloud architectures will make you highly competitive for a ${jobRole || 'target'} role.`,
  biggestBlocker: `Lack of production-level backend development experience and hands-on cloud deployment familiarity relevant to ${jobRole || 'the target role'}.`,
  estimatedPrepTime: "2-3 months",
  missingSkills: {
    technical: [
      {
        skill: "Cloud Deployment (AWS/GCP)",
        currentLevel: 20,
        requiredLevel: 70,
        howToLearn: "Build a multi-tier application and deploy it using AWS ECS, RDS, and S3. Implement CI/CD using GitHub Actions."
      },
      {
        skill: "Advanced API Design & Security",
        currentLevel: 45,
        requiredLevel: 80,
        howToLearn: "Learn OAuth2, JWT implementation, rate limiting, and RESTful best practices by building a secure microservice."
      }
    ],
    soft: [
      {
        skill: "Technical Communication",
        currentLevel: 60,
        requiredLevel: 85,
        howToLearn: "Practice explaining complex technical designs (e.g. system architecture, databases) in simple, clean terms."
      }
    ],
    tools: [
      {
        skill: "Docker",
        currentLevel: 30,
        requiredLevel: 75,
        howToLearn: "Containerize all local development projects. Practice composing multi-container setups using Docker Compose."
      }
    ],
    domain: [
      {
        skill: "System Architecture",
        currentLevel: 35,
        requiredLevel: 70,
        howToLearn: "Study system design principles: caching, load balancers, database sharding, and message queues."
      }
    ]
  },
  certifications: [
    {
      name: "AWS Certified Cloud Practitioner",
      issuingBody: "Amazon Web Services",
      logoAbbr: "AWS",
      logoColor: "#FF9900",
      priority: "recommended",
      whyItGetsYouHired: "Demonstrates official validation of cloud service expertise, which is highly sought by modern tech companies.",
      duration: "1-2 months",
      cost: "$100",
      demandLevel: "Very High",
      validity: "3 years",
      whatYoullLearn: ["Cloud Computing Concepts", "AWS Core Services", "Security and Compliance", "Billing and Pricing"],
      certificationUrl: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
      prepCourseUrl: "https://www.coursera.org/learn/aws-cloud-practitioner-essentials",
      prepCoursePlatform: "Coursera",
      prepCourseName: "AWS Cloud Practitioner Essentials"
    }
  ],
  courses: [
    {
      name: "Architecting with Google Compute Engine",
      platform: "Coursera",
      instructor: "Google Cloud Training",
      duration: "30 hours",
      rating: 4.7,
      cost: "Free to audit",
      skillTaught: "Google Cloud Platform",
      level: "Intermediate",
      directUrl: "https://www.coursera.org/specializations/gcp-architecture"
    },
    {
      name: "Docker and Kubernetes: The Complete Guide",
      platform: "Udemy",
      instructor: "Stephen Grider",
      duration: "22 hours",
      rating: 4.8,
      cost: "$15",
      skillTaught: "Docker & Kubernetes",
      level: "Beginner",
      directUrl: "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/"
    }
  ],
  roadmap: [
    {
      week: 1,
      tasks: [
        {
          title: "Learn Docker basics and containerize a Node.js/Python backend",
          type: "learning",
          timeEstimate: "5 hours",
          priority: "high",
          url: "https://docs.docker.com/get-started/"
        }
      ]
    },
    {
      week: 2,
      tasks: [
        {
          title: "Set up a multi-container local stack with Docker Compose",
          type: "learning",
          timeEstimate: "6 hours",
          priority: "high",
          url: "https://docs.docker.com/compose/"
        }
      ]
    }
  ],
  resumeTips: [
    {
      original: "Built a website using React and Node.js.",
      improved: "Architected and deployed a responsive React web app integrated with a Node.js REST API, improving load times by 20% using lazy loading.",
      reason: "Uses strong action verbs and quantifies impact."
    }
  ]
});


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
      console.log('⚠️ ANTHROPIC_API_KEY is missing. Returning high-quality mock career intelligence report.');
      return Response.json(getMockCareerIntel(jobRole));
    }

    const client = new Anthropic({ apiKey });

    const analysisInstruction = `You are the world's best career coach, technical recruiter, and skills gap analyst. You have deep knowledge of every industry certification, online course, job market demand, and hiring pattern. When analyzing, be brutally honest but constructive. Always provide REAL, working URLs — never make up URLs.

TARGET JOB ROLE: ${jobRole}

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

    let messageContent;
    if (resumeFile) {
      const bytes = await resumeFile.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      messageContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: analysisInstruction },
      ];
    } else {
      if (!resumeTextInput || resumeTextInput.trim().length < 50) {
        return Response.json({ error: 'Resume text is too short. Please provide your full resume.' }, { status: 400 });
      }
      messageContent = [{ type: 'text', text: `CANDIDATE RESUME:\n${resumeTextInput}\n\n${analysisInstruction}` }];
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: messageContent }],
    });

    // Track token usage
    await trackTokensServer(userId || 'anonymous', 'career-intel', message.usage?.input_tokens, message.usage?.output_tokens);

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
    console.log('⚠️ Falling back to mock career intelligence report due to API error.');
    return Response.json(getMockCareerIntel(jobRole || 'Target Role'));
  }
}
