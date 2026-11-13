import Anthropic from '@anthropic-ai/sdk';
import { trackTokensServer } from '@/lib/tokenTrackerServer';
import { normalizeEvaluation } from '@/lib/interviewEval';

// Results are saved by the interview page once the whole interview is finished
// (signed-in user, users/{uid}/interview_feedback). This route only generates
// questions and evaluates answers.
export async function POST(request) {
  try {
    const body = await request.json();
    const { question, answer, domain, count, uid } = body;

    let client = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
      } catch (e) {
        console.warn('Failed to initialize Anthropic client:', e.message);
      }
    }

    // Generate questions
    if (count && domain && !answer) {
      const prompt = `Generate ${count} realistic interview questions
for a fresher ${domain} role at Indian companies.
Mix HR and domain questions for freshers.
Do not name any specific company in the questions; say "our company" instead.

IMPORTANT: Return ONLY valid JSON format. No markdown, no extra text.
Format exactly like this:
{"questions": ["question1", "question2", "question3", "question4", "question5"]}

Examples of good questions:
- "Tell me about yourself"
- "What are your strengths and weaknesses?"
- "Why do you want to work for our company?"
- "Describe a challenging situation you faced"
- "Where do you see yourself in 5 years?"

Now generate the questions:`;

      try {
        if (!client) {
          throw new Error('Anthropic client is not initialized (missing API key)');
        }
        const message = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        });

        // Track token usage
        await trackTokensServer(uid || 'anonymous', 'interview', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-haiku-4-5-20251001');

        const text = message.content[0].text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        try {
          const parsed = JSON.parse(text);
          return Response.json(parsed);
        } catch (parseError) {
          console.error('Question JSON parse error:', parseError.message);

          // Fallback: try to extract questions manually
          const questionMatch = text.match(/"questions":\s*\[(.*?)\]/s);
          if (questionMatch) {
            try {
              const questionsText = questionMatch[1];
              const questions = questionsText
                .split('"')
                .filter(q => q.trim() && !q.includes(','))
                .map(q => q.trim().replace(/^,|,$/g, ''))
                .filter(q => q.length > 0);
              
              return Response.json({ questions });
            } catch (fallbackError) {
              console.error('Fallback parsing failed:', fallbackError);
            }
          }
          throw parseError;
        }
      } catch (claudeError) {
        console.warn('⚠️ interview generation Claude API failed, using mock fallback questions:', claudeError.message);
        const fallbacks = {
          "Software Engineer": [
            "Tell me about a challenging technical project you worked on and how you resolved the obstacles.",
            "Explain the difference between a process and a thread, and when you would use each.",
            "How do you ensure code quality and handle code reviews in a team project?",
            "Describe how you would design a simple URL shortening service like Bitly.",
            "Why do you want to join our company as a Software Engineer?"
          ],
          "Data Analyst": [
            "Walk me through a data analysis project you did. What insights did you uncover?",
            "What is the difference between inner join, left join, and outer join in SQL?",
            "How do you handle missing or corrupt data in a dataset before analysis?",
            "Explain the difference between correlation and causation with an example.",
            "How would you explain a complex data dashboard to a non-technical stakeholder?"
          ],
          "Marketing": [
            "Describe a successful marketing campaign you ran or studied. What made it effective?",
            "How do you measure the ROI of a digital marketing campaign?",
            "How would you market a new B2B SaaS product to small businesses?",
            "Tell me about a time you had to deal with a PR crisis or negative customer feedback.",
            "What marketing channels do you think are most effective for reaching Gen Z?"
          ],
          "Finance": [
            "What is the difference between the income statement, balance sheet, and cash flow statement?",
            "How do you calculate the cost of capital (WACC) for a company?",
            "Describe a financial model or analysis you built to support a business decision.",
            "How do you assess the credit risk of a potential corporate borrower?",
            "Why are you interested in corporate finance rather than investment banking?"
          ],
          "Operations": [
            "How do you identify bottlenecks in a supply chain or process flow?",
            "Describe a time you optimized an existing workflow to improve efficiency.",
            "How do you manage inventory levels to minimize carrying costs while preventing stockouts?",
            "What metrics would you track to measure the performance of a logistics team?",
            "How do you handle a supplier who consistently delivers orders late?"
          ],
          "MBA General": [
            "Tell me about a time you led a team to achieve a difficult business goal.",
            "How do you handle conflict or differing opinions among team members?",
            "Describe a strategic decision you had to make. What factors did you analyze?",
            "How do you prioritize competing projects or demands on your time?",
            "Where do you see yourself in 5 years, and how does this role fit your career goals?"
          ]
        };
        const selectedQuestions = fallbacks[domain] || fallbacks["Software Engineer"];
        return Response.json({ questions: selectedQuestions });
      }
    }

    // Analyze answer
    if (question && answer) {
      // Count fillers in code
      const fillerList = ['so', 'basically', 'you know', 
        'like', 'umm', 'uhh', 'actually', 'i think', 
        'maybe', 'i guess', "i don't know", 'kind of',
        'sort of', 'i mean', 'right', 'literally'];
      
      const answerLower = answer.toLowerCase();
      const foundFillers = fillerList.filter(f => 
        answerLower.includes(f));
      const wordCount = answer.trim().split(/\s+/).length;

      const prompt = `You are a strict interview coach for Indian students.
Analyze this EXACT answer honestly.

Question: ${question}
Domain: ${domain}
Student Answer: "${answer}"
Word Count: ${wordCount}
Filler words found by system: ${foundFillers.join(', ') || 'none'}

STRICT SCORING RULES:
- Under 20 words: max score 3/10
- No examples: content max 5/10
- Says "I don't know": max score 2/10
- Full of fillers: confidence max 4/10
- Generic answer: content max 5/10

You MUST reference the ACTUAL answer in feedback.
Do NOT give generic feedback.
Do NOT praise bad answers.

Return ONLY valid JSON, no markdown, no extra text:
{
  "score": (be strict and honest),
  "clarity": (1-10),
  "confidence": (1-10),
  "content": (1-10),
  "communication": (1-10),
  "word_count": ${wordCount},
  "filler_words": {
    "found": ${JSON.stringify(foundFillers)},
    "count": ${foundFillers.length},
    "examples": "${foundFillers.join(', ')}"
  },
  "structure": {
    "has_opening": (true/false based on actual answer),
    "has_examples": (true/false based on actual answer),
    "has_conclusion": (true/false based on actual answer),
    "rating": "Poor/Average/Good/Excellent"
  },
  "weak_language": ["weak phrase quoted from the actual answer"],
  "strong_language": ["strong phrase quoted from the actual answer"],
  "strengths": [
    "specific strength quoting actual answer words"
  ],
  "improvements": [
    "specific improvement referencing actual answer",
    "specific improvement referencing actual answer",
    "specific improvement referencing actual answer"
  ],
  "filler_feedback": "specific filler feedback for this answer",
  "structure_feedback": "specific structure feedback",
  "better_answer": "model answer for ${question} in ${domain} context,
    120 words, professional, Indian fresher context"
}

Rules for better_answer: never invent company names, numbers, percentages,
money amounts or certificates. Where the student's own details belong, write
placeholders such as [your company], [your project] or [a number from your work].
Use an empty list [] when nothing applies; never write "NONE FOUND".`;

      if (!client) {
        return Response.json(
          { error: 'Answer evaluation is unavailable right now. Please try again in a minute.' },
          { status: 503 }
        );
      }

      // Up to two attempts; never invent a score if the AI fails.
      let analysis = null;
      for (let attempt = 1; attempt <= 2 && !analysis; attempt++) {
        try {
          const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          });

          await trackTokensServer(uid || 'anonymous', 'interview', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-haiku-4-5-20251001');

          const text = message.content[0].text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
          analysis = normalizeEvaluation(JSON.parse(jsonText), { detectedFillers: foundFillers, wordCount });
        } catch (err) {
          console.error(`Interview evaluation attempt ${attempt} failed:`, err.message);
        }
      }

      if (!analysis) {
        return Response.json(
          { error: 'We could not evaluate this answer. Please try again.' },
          { status: 502 }
        );
      }

      return Response.json(analysis);
    }

    return Response.json({ error: 'Invalid request' }, 
      { status: 400 });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
