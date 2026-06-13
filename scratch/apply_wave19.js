const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Remove useState declarations
code = code.replace(/const \[currentQuestion, setCurrentQuestion\] = useState\(''\);\n/g, '');
code = code.replace(/const \[questionNumber, setQuestionNumber\] = useState\(1\);\n/g, '');
code = code.replace(/const \[sessionMemory, setSessionMemory\] = useState\(null\);\n/g, '');
code = code.replace(/const \[interviewerThought, setInterviewerThought\] = useState\(''\);\n/g, '');
code = code.replace(/const \[integrityScore, setIntegrityScore\] = useState\(100\);\n/g, '');
code = code.replace(/const \[violations, setViolations\] = useState\(\[\]\);\n/g, '');
code = code.replace(/const \[feedbackHistory, setFeedbackHistory\] = useState\(\[\]\);\n/g, '');
code = code.replace(/const \[startError, setStartError\] = useState\(''\);\n/g, '');
code = code.replace(/const \[isFullscreen, setIsFullscreen\] = useState\(false\);\n/g, '');

// 2. Replace writes (Setters)
// startError
code = code.replace(/setStartError\((.*?)\)/g, "dispatch({ type: 'SET_ERROR', payload: $1 })");
// isFullscreen
code = code.replace(/setIsFullscreen\((.*?)\)/g, "dispatch({ type: 'SET_INTEGRITY', payload: { isFullscreen: $1 } })");
// feedbackHistory
code = code.replace(/setFeedbackHistory\((.*?)\)/g, "dispatch({ type: 'SET_EVALUATION', payload: { feedbackHistory: $1 } })");

// The engine setters (currentQuestion, sessionMemory, interviewerThought, questionNumber)
code = code.replace(/setCurrentQuestion\((.*?)\)/g, "dispatch({ type: 'SET_ENGINE', payload: { currentQuestion: $1 } })");
code = code.replace(/setSessionMemory\((.*?)\)/g, "dispatch({ type: 'SET_ENGINE', payload: { sessionMemory: $1 } })");
code = code.replace(/setInterviewerThought\((.*?)\)/g, "dispatch({ type: 'SET_ENGINE', payload: { interviewerThought: $1 } })");
code = code.replace(/setQuestionNumber\((.*?)\)/g, "dispatch({ type: 'SET_ENGINE', payload: { questionNumber: $1 } })");

// Integrity setters
code = code.replace(/setIntegrityScore\((.*?)\)/g, "dispatch({ type: 'SET_INTEGRITY', payload: { integrityScore: $1 } })");
code = code.replace(/setViolations\((.*?)\)/g, "dispatch({ type: 'SET_INTEGRITY', payload: { violations: $1 } })");

// 3. Fix Property Shorthands
code = code.replace(/integrityScore,/g, "integrityScore: state.integrity.integrityScore,");
code = code.replace(/violations\n/g, "violations: state.integrity.violations\n");
// In mockHistory.unshift...
code = code.replace(/violations\s*\n/g, "violations: state.integrity.violations\n");

// 4. Replace reads
const replacements = {
  'currentQuestion': 'state.engine.currentQuestion',
  'questionNumber': 'state.engine.questionNumber',
  'sessionMemory': 'state.engine.sessionMemory',
  'interviewerThought': 'state.engine.interviewerThought',
  'integrityScore': 'state.integrity.integrityScore',
  'violations': 'state.integrity.violations',
  'feedbackHistory': 'state.evaluation.feedbackHistory',
  'startError': 'state.error',
  'isFullscreen': 'state.integrity.isFullscreen'
};

for (const [key, val] of Object.entries(replacements)) {
  // Replace bare occurrences that are not already part of an object path like `state.engine.currentQuestion`
  // We use a negative lookbehind and negative lookahead.
  const regex = new RegExp(`(?<!\\.)\\b${key}\\b(?!\\s*:)`, 'g');
  code = code.replace(regex, val);
}

// 5. Cleanup redundant resets in resetInterview
// In resetInterview, START_INTERVIEW or RESET_INTERVIEW already handles resetting many things.
// However, the replacements above will just safely dispatch them. 
// Let's remove the extra dispatches from resetInterview since RESET_INTERVIEW already clears them.
// Wait, `resetInterview` calls `dispatch({ type: 'SET_STATUS', payload: 'setup' })`
// Let's just leave the generated dispatches, it won't hurt to dispatch twice for now to avoid breaking anything.

fs.writeFileSync(filePath, code);
console.log("Migration script applied.");
