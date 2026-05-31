const fetch = require('node-fetch');

async function testApi() {
  try {
    const payload = {
      action: 'continue',
      job_role: 'Software Engineer',
      jd: 'Requires React and Node.js experience.',
      round: 'Technical Round',
      conversation_history: [
        { role: 'interviewer', message: 'Can you tell me about yourself?' },
        { role: 'user', message: 'I am a backend engineer.' }
      ],
      last_question: 'Can you tell me about yourself?',
      last_answer: 'I am a backend engineer.',
      session_memory: {
        interview_summary: 'Candidate introduced themselves as backend engineer.',
        competencies: {
          communication: { score: 8, covered: true, question_count: 1 },
          technical_knowledge: { score: 0, covered: false, question_count: 0 }
        },
        current_competency: 'technical_knowledge',
        asked_questions: ['Can you tell me about yourself?']
      },
      resume_base64: 'JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPUM1Qo5ypUMFAwALJMLYGsEiBrcZ5aAFO/BfIKZW5kc3RyZWFtCmVuZG9iago=',
      user_id: 'test-agent'
    };

    const res = await fetch('http://localhost:3000/api/smart-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testApi();
