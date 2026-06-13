const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/smart-interview/page.js');
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

const variables = [
  'resumeBase64', 'resumeFileName', 'resumeText', 'jobRole', 'jobDescription', 'round', 'mode',
  'cameraOk', 'micOk', 'voiceOk', 'selectedLang'
];

const results = {};
variables.forEach(v => {
  results[v] = { reads: [], writes: [] };
});

const setterRegexes = variables.reduce((acc, v) => {
  const setterName = 'set' + v.charAt(0).toUpperCase() + v.slice(1);
  acc[v] = new RegExp(`\\b${setterName}\\b`);
  return acc;
}, {});

const readRegexes = variables.reduce((acc, v) => {
  acc[v] = new RegExp(`\\b${v}\\b`);
  return acc;
}, {});

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Skip imports, function parameters declaration if any, or state declaration line itself
  if (lineNum >= 326 && lineNum <= 340) {
    return;
  }
  
  variables.forEach(v => {
    // Check write
    if (setterRegexes[v].test(line)) {
      results[v].writes.push({ lineNum, content: line.trim() });
    } else if (readRegexes[v].test(line)) {
      // It's a read. Ensure it's not key name in object shorthand, though we'll verify manually
      results[v].reads.push({ lineNum, content: line.trim() });
    }
  });
});

console.log(JSON.stringify(results, null, 2));
