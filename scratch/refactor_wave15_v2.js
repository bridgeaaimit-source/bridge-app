const fs = require('fs');

const pageFile = 'app/smart-interview/page.js';
let content = fs.readFileSync(pageFile, 'utf8');

// 1. Rename SmartInterviewPage to SmartInterviewContent
content = content.replace('export default function SmartInterviewPage() {', 'function SmartInterviewContent() {');

// 2. Add imports
if (!content.includes('InterviewProvider')) {
  content = content.replace(
    'import { useAssemblyAI as useDeepgramTranscription } from "@/hooks/useAssemblyAI";',
    'import { useAssemblyAI as useDeepgramTranscription } from "@/hooks/useAssemblyAI";\nimport { InterviewProvider, useInterviewState, useInterviewDispatch } from "@/context/InterviewContext";'
  );
}

// 3. Add useInterview inside SmartInterviewContent
if (!content.includes('const state = useInterviewState()')) {
  content = content.replace(
    'function SmartInterviewContent() {',
    'function SmartInterviewContent() {\n  const state = useInterviewState();\n  const dispatch = useInterviewDispatch();'
  );
}

// 4. Remove shadowed useStates
content = content.replace(/\s*const \[stage, setStage\] = useState\('setup'\); \/\/ 'setup' \| 'device-test' \| 'interviewing' \| 'feedback' \| 'history'/g, '');
content = content.replace(/\s*const \[conversationHistory, setConversationHistory\] = useState\(\[\]\);/g, '');
content = content.replace(/\s*const \[feedback, setFeedback\] = useState\(null\);/g, '');

// 5. Replace references to state variables
// stage -> state.status
content = content.replace(/\bstage ===/g, 'state.status ===');

// conversationHistory -> state.engine.conversationHistory
content = content.replace(/\bconversationHistory\.length/g, 'state.engine.conversationHistory.length');
content = content.replace(/\bconversationHistory\.map/g, 'state.engine.conversationHistory.map');
content = content.replace(/\bhistory: conversationHistory,/g, 'history: state.engine.conversationHistory,');
// Special replacements for mapping
content = content.replace(/buildHistory\(conversationHistory\)/g, 'buildHistory(state.engine.conversationHistory)');
content = content.replace(/conversationHistory=\{(.*?)\}/g, 'conversationHistory={state.engine.conversationHistory}');
content = content.replace(/\b\[...conversationHistory,/g, '[...state.engine.conversationHistory,');


// feedback -> state.evaluation.feedback
content = content.replace(/feedback\?/g, 'state.evaluation.feedback?');
content = content.replace(/feedback\./g, 'state.evaluation.feedback.');
content = content.replace(/feedback =/g, 'state.evaluation.feedback =');
// wait, if there are instances of `{feedback &&` it needs replacement
content = content.replace(/\{feedback &&/g, '{state.evaluation.feedback &&');
// if there are instances of `!feedback` it needs replacement
content = content.replace(/!feedback/g, '!state.evaluation.feedback');


// 6. Replace setStage
content = content.replace(/setStage\('setup'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'setup' })");
content = content.replace(/setStage\('device-test'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'device-test' })");
content = content.replace(/setStage\('interviewing'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'interviewing' })");
content = content.replace(/setStage\('feedback'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'feedback' })");
content = content.replace(/setStage\('history'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'history' })");

// 7. Replace setFeedback
content = content.replace(/setFeedback\(data\);/g, "dispatch({ type: 'RECEIVE_EVALUATION', payload: { feedback: data } });");
content = content.replace(/setFeedback\(null\);/g, "dispatch({ type: 'SET_EVALUATION', payload: { feedback: null } });");
content = content.replace(/setFeedback\(historicalData\.feedback\);/g, "dispatch({ type: 'SET_EVALUATION', payload: { feedback: historicalData.feedback } });");

// Oh wait, there is `setFeedback({ ...data, integrityScore, violations })`
const feedbackObjMatch = /setFeedback\(\{([\s\S]*?)\}\);/g;
content = content.replace(feedbackObjMatch, (match, inner) => {
  return \`dispatch({ type: 'RECEIVE_EVALUATION', payload: { feedback: { \${inner} } } });\`;
});

// 8. Handle setConversationHistory
// "setConversationHistory([])" -> handled by RESET_INTERVIEW or just START_INTERVIEW
content = content.replace(/setConversationHistory\(\[\]\);/g, ""); // we don't need this, START_INTERVIEW clears it.

// "setConversationHistory([ { role: 'interviewer', message: data.question } ])"
content = content.replace(/setConversationHistory\(\[\s*\{\s*role:\s*'interviewer',\s*message:\s*data\.question\s*\}\s*\]\);/g, "");

// "setConversationHistory(prev => [ ...prev, { role: 'interviewer', message: data.question } ])"
content = content.replace(/setConversationHistory\(prev => \[\s*\.\.\.prev,\s*\{\s*role:\s*'interviewer',\s*message:\s*data\.question\s*\}\s*\]\);/g, "");

// "setConversationHistory(prev => [ ...prev, { role: 'user', message: answer } ])"
content = content.replace(/setConversationHistory\(prev => \[\s*\.\.\.prev,\s*\{\s*role:\s*'user',\s*message:\s*answer\s*\}\s*\]\);/g, "");


// 9. Handle startInterview generic dispatches
const startInterviewBlock = `dispatch({ type: 'SET_ENGINE', payload: { currentQuestion: data.question } });
      dispatch({ type: 'SET_ENGINE', payload: { interviewerThought: data.interviewer_thought || '' } });
      
      dispatch({ type: 'SET_ENGINE', payload: { sessionMemory: data.session_memory || null } });
      dispatch({ type: 'SET_STATUS', payload: 'interviewing' });
      dispatch({ type: 'SET_ENGINE', payload: { questionNumber: 1 } });
      dispatch({ type: 'SET_ERROR', payload: '' });`;

const newStartInterviewBlock = `dispatch({ 
        type: 'START_INTERVIEW', 
        payload: {
          question: data.question,
          interviewerThought: data.interviewer_thought || '',
          sessionMemory: data.session_memory || null
        }
      });`;

// Because I already removed setConversationHistory from the string, the block looks different. Let's do it manually using regex for the chunk.
const oldStartBlockRegex = /dispatch\(\{ type: 'SET_ENGINE', payload: \{ currentQuestion: data\.question \} \}\);\s*dispatch\(\{ type: 'SET_ENGINE', payload: \{ interviewerThought: data\.interviewer_thought \|\| '' \} \}\);\s*dispatch\(\{ type: 'SET_ENGINE', payload: \{ sessionMemory: data\.session_memory \|\| null \} \}\);\s*dispatch\(\{ type: 'SET_STATUS', payload: 'interviewing' \}\);\s*dispatch\(\{ type: 'SET_ENGINE', payload: \{ questionNumber: 1 \} \}\);\s*dispatch\(\{ type: 'SET_ERROR', payload: '' \}\);/g;
content = content.replace(oldStartBlockRegex, newStartInterviewBlock);

// Wait, the original in page.js might be:
const altStartBlockRegex = /dispatch\(\{ type: 'SET_ENGINE', payload: \{ currentQuestion: data\.question \} \}\);[\s\S]*?dispatch\(\{ type: 'SET_ERROR', payload: '' \}\);/g;
// That might be too broad.
// Let's do a more precise replacement later if this fails.

// 10. Add the export default wrapper at the bottom
if (!content.includes('export default function SmartInterviewPage()')) {
  content += \`

export default function SmartInterviewPage() {
  return (
    <InterviewProvider>
      <SmartInterviewContent />
    </InterviewProvider>
  );
}
\`;
}

fs.writeFileSync(pageFile, content);
console.log('Refactor script finished.');
