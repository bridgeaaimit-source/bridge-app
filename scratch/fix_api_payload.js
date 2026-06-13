const fs = require('fs');

let txt = fs.readFileSync('app/smart-interview/page.js', 'utf8');

// Replace `conversation_history: updatedHistory` with `conversation_history: updatedHistory.slice(-6)`
txt = txt.replace(/conversation_history:\s*updatedHistory,/g, 'conversation_history: updatedHistory.slice(-6),');

// Replace `conversation_history: historyToUse` with `conversation_history: historyToUse.slice(-6)`
txt = txt.replace(/conversation_history:\s*historyToUse,/g, 'conversation_history: historyToUse.slice(-6),');

// Fix the syntax error from earlier replacement: `state.config.round,` -> `round: state.config.round,`
txt = txt.replace(/state\.config\.round,/g, 'round: state.config.round,');
txt = txt.replace(/state\.config\.mode,/g, 'mode: state.config.mode,');

fs.writeFileSync('app/smart-interview/page.js', txt);
console.log("Payload fix applied.");
