import Anthropic from '@anthropic-ai/sdk';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackTokensServer } from '@/lib/tokenTrackerServer';





export async function POST(request) {
  try {
    console.log('ANTHROPIC KEY:', process.env.ANTHROPIC_API_KEY?.substring(0, 15));
    
    const body = await request.json();
    const { question, answer, domain, count, uid, sessionId } = body;
    
    console.log('=== API ROUTE HIT ===');
    console.log('Body:', { question, answer, domain, count });
    console.log('Has API key:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));
    console.log('Raw env var:', process.env.ANTHROPIC_API_KEY);
    console.log('NewsAPI key exists:', !!process.env.NEWS_API_KEY);

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
for ${domain} role at Indian companies like TCS, Infosys, Wipro.
Mix HR and technical questions for freshers.

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
        await trackTokensServer(uid || 'anonymous', 'interview', message.usage?.input_tokens, message.usage?.output_tokens);

        const text = message.content[0].text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        console.log('Questions response:', text);
        
        try {
          const parsed = JSON.parse(text);
          return Response.json(parsed);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Raw text:', text);
          
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
  "weak_language": (find in actual answer),
  "strong_language": (find in actual answer),
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
    150 words, professional, Indian fresher context"
}`;

      let analysis;
      try {
        if (!client) {
          throw new Error('Anthropic client is not initialized (missing API key)');
        }
        const message = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        });

        // Track token usage
        await trackTokensServer(uid || 'anonymous', 'interview', message.usage?.input_tokens, message.usage?.output_tokens);

        const text = message.content[0].text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        console.log('Analysis response:', text);
        
        try {
          analysis = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON parse error for analysis:', parseError);
          console.error('Raw text:', text);
          
          // Fallback: create a basic analysis object
          analysis = {
            score: 5,
            confidence: 5,
            content: 5,
            clarity: 5,
            overall_feedback: "AI analysis temporarily unavailable. Please try again.",
            strengths: ["Answer provided"],
            improvements: ["Try again with more details"],
            filler_words: { found: foundFillers, count: foundFillers.length, examples: foundFillers.join(', ') },
            filler_feedback: "No filler analysis available",
            structure_feedback: "No structure analysis available",
            better_answer: "A comprehensive answer would include specific examples and details."
          };
        }
      } catch (claudeError) {
        console.warn('⚠️ interview analysis Claude API failed, using mock evaluation fallback:', claudeError.message);
        analysis = {
          score: wordCount < 15 ? 4 : 7,
          confidence: foundFillers.length > 3 ? 5 : 7,
          content: wordCount < 20 ? 4 : 7,
          clarity: 7,
          communication: 7,
          word_count: wordCount,
          filler_words: {
            found: foundFillers,
            count: foundFillers.length,
            examples: foundFillers.join(', ')
          },
          structure: {
            has_opening: wordCount > 10,
            has_examples: wordCount > 25,
            has_conclusion: wordCount > 40,
            rating: wordCount < 20 ? "Poor" : "Good"
          },
          weak_language: foundFillers.slice(0, 2).join(', ') || 'none',
          strong_language: 'relevant terms',
          strengths: ["Communicated ideas clearly", "Provided a prompt response"],
          improvements: ["Use specific STAR examples", "Provide more depth in answers"],
          filler_feedback: foundFillers.length > 0 ? `Try to reduce the use of filler words like ${foundFillers.slice(0, 2).join(', ')}.` : "Great job avoiding filler words!",
          structure_feedback: wordCount < 20 ? "Your answer is short. Try using the STAR method to structure it." : "Good basic structure, keep practicing to detail your points.",
          better_answer: `A stronger response for this question would be: "When faced with ${question.substring(0, 20)}..., I structured my approach by first understanding the situation, defining my role, taking specific actions, and analyzing the final positive results. This allowed me to achieve the goal efficiently."`
        };
      }

      // Save interview results to Firestore if uid provided
      if (uid && sessionId) {
        try {
          // Save session data
          const sessionRef = doc(db, 'interviews', uid, 'sessions', sessionId);
          await setDoc(sessionRef, {
            domain,
            score: analysis.score,
            date: new Date().toISOString(),
            questionsCount: 1,
            fillerWords: analysis.filler_words ? analysis.filler_words.count : 0,
            feedback: analysis.better_answer
          });
          
          // Update user document
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const scoreIncrease = analysis.score * 10;
            const newBridgeScore = Math.min(1000, 
              Math.max(0, 
                (userData.bridgeScore || 500) + scoreIncrease
              )
            );
            const newInterviewsDone = (userData.interviewsDone || 0) + 1;
            const newAvgScore = ((userData.avgScore || 0) * (userData.interviewsDone || 0) + analysis.score) / newInterviewsDone;
            
            await updateDoc(userRef, {
              bridgeScore: Math.round(newBridgeScore),
              interviewsDone: newInterviewsDone,
              avgScore: newAvgScore,
              streak: (userData.streak || 0) + 1
            });
          }
        } catch (firestoreError) {
          console.error('Error saving to Firestore:', firestoreError);
          // Don't fail the API response if Firestore fails
        }
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
