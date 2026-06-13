const fs = require('fs');

let txt = fs.readFileSync('app/smart-interview/page.js', 'utf8');

// 1. Remove the old useState declarations for the migrated states
const statesToRemove = [
  'stage', 'resumeBase64', 'resumeFileName', 'resumeText', 'jobRole', 
  'jobDescription', 'round', 'mode', 'cameraOk', 'micOk', 'voiceOk', 
  'selectedLang', 'currentQuestion', 'conversationHistory', 
  'questionNumber', 'feedback', 'feedbackHistory', 'interviewerThought', 
  'startError', 'sessionMemory', 'violations', 'integrityScore', 'isFullscreen'
];

for (const state of statesToRemove) {
  const regex = new RegExp(`\\s*const\\s*\\[${state},\\s*set${state.charAt(0).toUpperCase() + state.slice(1)}\\]\\s*=\\s*useState\\(.*?\\);`, 'g');
  txt = txt.replace(regex, '');
}

// Replace stage reading -> state.status
txt = txt.replace(/\bstage\b(?!(\s*=>|\s*:|\.))/g, 'state.status');

// Replace specific setters with dispatch
const replacements = [
  // Status
  { regex: /setStage\((.*?)\)/g, repl: "dispatch({ type: 'SET_STATUS', payload: $1 })" },
  
  // Config
  { regex: /setJobRole\((.*?)\)/g, repl: "dispatch({ type: 'SET_CONFIG', payload: { jobRole: $1 } })" },
  { regex: /setJobDescription\((.*?)\)/g, repl: "dispatch({ type: 'SET_CONFIG', payload: { jobDescription: $1 } })" },
  { regex: /setRound\((.*?)\)/g, repl: "dispatch({ type: 'SET_CONFIG', payload: { round: $1 } })" },
  { regex: /setMode\((.*?)\)/g, repl: "dispatch({ type: 'SET_CONFIG', payload: { mode: $1 } })" },
  { regex: /setResumeBase64\((.*?)\)/g, repl: "dispatch({ type: 'SET_CONFIG', payload: { resumeBase64: $1 } })" },
  { regex: /setResumeFileName\((.*?)\)/g, repl: "dispatch({ type: 'SET_CONFIG', payload: { resumeFileName: $1 } })" },
  { regex: /setResumeText\((.*?)\)/g, repl: "dispatch({ type: 'SET_CONFIG', payload: { resumeText: $1 } })" },
  
  // Device
  { regex: /setCameraOk\((.*?)\)/g, repl: "dispatch({ type: 'SET_DEVICES', payload: { cameraOk: $1 } })" },
  { regex: /setMicOk\((.*?)\)/g, repl: "dispatch({ type: 'SET_DEVICES', payload: { micOk: $1 } })" },
  { regex: /setVoiceOk\((.*?)\)/g, repl: "dispatch({ type: 'SET_DEVICES', payload: { voiceOk: $1 } })" },
  { regex: /setSelectedLang\((.*?)\)/g, repl: "dispatch({ type: 'SET_DEVICES', payload: { selectedLang: $1 } })" },
  
  // Engine
  { regex: /setCurrentQuestion\((.*?)\)/g, repl: "dispatch({ type: 'SET_ENGINE', payload: { currentQuestion: $1 } })" },
  { regex: /setQuestionNumber\((.*?)\)/g, repl: "dispatch({ type: 'SET_ENGINE', payload: { questionNumber: $1 } })" },
  { regex: /setConversationHistory\(\(prev\) => \[\.\.\.prev, (.*?)\]\)/g, repl: "dispatch({ type: 'SET_ENGINE', payload: { conversationHistory: [...state.engine.conversationHistory, $1] } })" },
  { regex: /setConversationHistory\((.*?)\)/g, repl: "dispatch({ type: 'SET_ENGINE', payload: { conversationHistory: $1 } })" },
  { regex: /setSessionMemory\((.*?)\)/g, repl: "dispatch({ type: 'SET_ENGINE', payload: { sessionMemory: $1 } })" },
  { regex: /setInterviewerThought\((.*?)\)/g, repl: "dispatch({ type: 'SET_ENGINE', payload: { interviewerThought: $1 } })" },
  
  // Evaluation
  { regex: /setFeedback\((.*?)\)/g, repl: "dispatch({ type: 'SET_EVALUATION', payload: { feedback: $1 } })" },
  { regex: /setFeedbackHistory\((.*?)\)/g, repl: "dispatch({ type: 'SET_EVALUATION', payload: { feedbackHistory: $1 } })" },
  
  // Integrity
  { regex: /setIsFullscreen\((.*?)\)/g, repl: "dispatch({ type: 'SET_INTEGRITY', payload: { isFullscreen: $1 } })" },
  { regex: /setIntegrityScore\((.*?)\)/g, repl: "dispatch({ type: 'SET_INTEGRITY', payload: { integrityScore: $1 } })" },
  { regex: /setViolations\((.*?)\)/g, repl: "dispatch({ type: 'SET_INTEGRITY', payload: { violations: $1 } })" },
  
  // Error
  { regex: /setStartError\((.*?)\)/g, repl: "dispatch({ type: 'SET_ERROR', payload: $1 })" }
];

for (const r of replacements) {
  txt = txt.replace(r.regex, r.repl);
}

// Replace getters
const getters = [
  { regex: /\bjobRole\b(?!(:|\.))/g, repl: "state.config.jobRole" },
  { regex: /\bjobDescription\b(?!(:|\.))/g, repl: "state.config.jobDescription" },
  { regex: /\bround\b(?!(:|\.))/g, repl: "state.config.round" },
  { regex: /\bmode\b(?!(:|\.))/g, repl: "state.config.mode" },
  { regex: /\bresumeBase64\b(?!(:|\.))/g, repl: "state.config.resumeBase64" },
  { regex: /\bresumeFileName\b(?!(:|\.))/g, repl: "state.config.resumeFileName" },
  { regex: /\bresumeText\b(?!(:|\.))/g, repl: "state.config.resumeText" },
  
  { regex: /\bcameraOk\b(?!(:|\.))/g, repl: "state.devices.cameraOk" },
  { regex: /\bmicOk\b(?!(:|\.))/g, repl: "state.devices.micOk" },
  { regex: /\bvoiceOk\b(?!(:|\.))/g, repl: "state.devices.voiceOk" },
  { regex: /\bselectedLang\b(?!(:|\.))/g, repl: "state.devices.selectedLang" },
  
  { regex: /\bcurrentQuestion\b(?!(:|\.))/g, repl: "state.engine.currentQuestion" },
  { regex: /\bquestionNumber\b(?!(:|\.))/g, repl: "state.engine.questionNumber" },
  { regex: /\bconversationHistory\b(?!(:|\.))/g, repl: "state.engine.conversationHistory" },
  { regex: /\bsessionMemory\b(?!(:|\.))/g, repl: "state.engine.sessionMemory" },
  { regex: /\binterviewerThought\b(?!(:|\.))/g, repl: "state.engine.interviewerThought" },
  
  { regex: /\bfeedback\b(?!(:|\.))/g, repl: "state.evaluation.feedback" },
  { regex: /\bfeedbackHistory\b(?!(:|\.))/g, repl: "state.evaluation.feedbackHistory" },
  
  { regex: /\bisFullscreen\b(?!(:|\.))/g, repl: "state.integrity.isFullscreen" },
  { regex: /\bintegrityScore\b(?!(:|\.))/g, repl: "state.integrity.integrityScore" },
  { regex: /\bviolations\b(?!(:|\.))/g, repl: "state.integrity.violations" },
  
  { regex: /\bstartError\b(?!(:|\.))/g, repl: "state.error" }
];

for (const g of getters) {
  // Be very careful not to break object keys or react component props.
  // We'll use a slightly safer replacement logic: only replace if preceded by space/punctuation and followed by space/punctuation.
  // Actually, standard regex bounds `\b` are decent, but can replace object keys if not careful.
  // E.g. { jobRole: state.config.jobRole } -> { state.config.jobRole: state.config.jobRole } which is a syntax error.
  // To avoid replacing object keys, we already have `(?!(:|\.))`.
  // What about `const { jobRole } = ...`? We removed all const declarations.
  // What about function params `(jobRole) => ...`? They might get replaced.
  // Let's do a more robust string replacement manually for the edge cases later, or just run this and manually fix the syntax errors via ESLint.
}

// Safe AST or manual parsing is better for getters, but let's just do a clean regex pass with negative lookbehinds.
const safeGetters = [
  { match: 'jobRole', repl: 'state.config.jobRole' },
  { match: 'jobDescription', repl: 'state.config.jobDescription' },
  { match: 'round', repl: 'state.config.round' },
  { match: 'mode', repl: 'state.config.mode' },
  { match: 'resumeBase64', repl: 'state.config.resumeBase64' },
  { match: 'resumeFileName', repl: 'state.config.resumeFileName' },
  { match: 'resumeText', repl: 'state.config.resumeText' },
  { match: 'cameraOk', repl: 'state.devices.cameraOk' },
  { match: 'micOk', repl: 'state.devices.micOk' },
  { match: 'voiceOk', repl: 'state.devices.voiceOk' },
  { match: 'selectedLang', repl: 'state.devices.selectedLang' },
  { match: 'currentQuestion', repl: 'state.engine.currentQuestion' },
  { match: 'questionNumber', repl: 'state.engine.questionNumber' },
  { match: 'conversationHistory', repl: 'state.engine.conversationHistory' },
  { match: 'sessionMemory', repl: 'state.engine.sessionMemory' },
  { match: 'interviewerThought', repl: 'state.engine.interviewerThought' },
  { match: 'feedback', repl: 'state.evaluation.feedback' },
  { match: 'feedbackHistory', repl: 'state.evaluation.feedbackHistory' },
  { match: 'isFullscreen', repl: 'state.integrity.isFullscreen' },
  { match: 'integrityScore', repl: 'state.integrity.integrityScore' },
  { match: 'violations', repl: 'state.integrity.violations' },
  { match: 'startError', repl: 'state.error' },
];

for (const g of safeGetters) {
  // Negative lookahead for `:` (object key), negative lookbehind for `.` (property access) or `{ ` (destructuring)
  const regex = new RegExp(`(?<![\\.\\{a-zA-Z0-9])\\b${g.match}\\b(?!(?:\\s*:|\\.|[a-zA-Z0-9]))`, 'g');
  txt = txt.replace(regex, g.repl);
}

fs.writeFileSync('app/smart-interview/page.js', txt);
console.log("Refactoring applied.");
