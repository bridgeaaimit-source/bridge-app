const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
const code = fs.readFileSync(pageJsPath, 'utf8');
const lines = code.split('\n');

console.log("=== Conversation History References ===");
lines.forEach((line, idx) => {
  if (line.includes('conversationHistory') || line.includes('setConversationHistory')) {
    console.log(`LINE ${idx + 1}: ${line.trim()}`);
    // Surrounding context (2 lines before and after)
    const start = Math.max(0, idx - 2);
    const end = Math.min(lines.length - 1, idx + 2);
    for (let i = start; i <= end; i++) {
      console.log(`  [${i + 1}] ${lines[i]}`);
    }
    console.log("----------------------------------------");
  }
});

// Check other removed state variables:
// From Wave 1.9 Audit:
// - currentQuestion
// - questionNumber
// - sessionMemory
// - interviewerThought
// - integrityScore
// - violations
// - feedbackHistory
// - startError
// - isFullscreen
// - stage
// - feedback
const removedStates = [
  'currentQuestion',
  'questionNumber',
  'sessionMemory',
  'interviewerThought',
  'integrityScore',
  'violations',
  'feedbackHistory',
  'startError',
  'isFullscreen',
  'stage',
  'feedback'
];

console.log("\n=== Other Removed State References Check ===");
removedStates.forEach(stateVar => {
  let count = 0;
  lines.forEach((line, idx) => {
    // Match exact word but ignore when it is prefixed by 'state.' or 'payload.' or is in a comment or is part of a type name.
    // E.g. 'state.engine.currentQuestion' is fine, but bare 'currentQuestion' is not.
    // Regex matches the word not preceded by 'state.config.', 'state.engine.', 'state.integrity.', 'state.evaluation.', 'state.', 'payload.', etc.
    const regex = new RegExp(`(?<!state\\.|payload\\.|state\\.config\\.|state\\.engine\\.|state\\.integrity\\.|state\\.evaluation\\.)\\b${stateVar}\\b`, 'g');
    // Ignore declarations or other properties
    const matches = line.match(regex) || [];
    // Filter out comment lines
    if (matches.length > 0 && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
      count += matches.length;
      console.log(`LINE ${idx + 1} (${stateVar}): ${line.trim()}`);
    }
  });
  console.log(`Total bare references for "${stateVar}": ${count}`);
});
