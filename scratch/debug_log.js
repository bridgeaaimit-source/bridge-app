const fs = require('fs');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

for (let i = 0; i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.content && obj.content.includes('Showing lines 1 to 800')) {
      console.log(`Line ${i}: type=${obj.type}, source=${obj.source}, content length=${obj.content.length}`);
      if (obj.content.includes('page.js')) {
        console.log(`  Contains page.js!`);
      }
    }
  } catch (e) {}
}
