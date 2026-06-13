const fs = require('fs');
const path = require('path');

const dir = 'components/smart-interview';
fs.readdirSync(dir).forEach(file => {
  const filePath = path.join(dir, file);
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if (line.match(/\bstate\b/) && !line.includes('const state') && !line.includes('useInterviewState')) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
});
