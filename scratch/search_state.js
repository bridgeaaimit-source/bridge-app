const fs = require('fs');
const code = fs.readFileSync('app/smart-interview/page.js', 'utf8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.match(/\bstate\b/) && !line.includes('const state') && !line.includes('useInterviewState')) {
    console.log((idx + 1) + ': ' + line.trim());
  }
});
