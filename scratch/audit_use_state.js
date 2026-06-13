const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/smart-interview/page.js');
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

console.log("=== REMAINING USESTATE DECLARATIONS ===");
lines.forEach((line, index) => {
  if (line.includes('useState(')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});

const legacySetters = [
  'setJobRole', 'setJobDescription', 'setRound', 'setMode',
  'setResumeFileName', 'setResumeBase64', 'setResumeText',
  'setCameraOk', 'setMicOk', 'setVoiceOk', 'setSelectedLang'
];

console.log("\n=== SEARCHING FOR LEGACY SETTERS ===");
legacySetters.forEach(setter => {
  const regex = new RegExp(`\\b${setter}\\b`);
  let found = false;
  lines.forEach((line, index) => {
    if (regex.test(line)) {
      console.log(`FOUND ${setter} at Line ${index + 1}: ${line.trim()}`);
      found = true;
    }
  });
  if (!found) {
    console.log(`NO references to ${setter} found.`);
  }
});
