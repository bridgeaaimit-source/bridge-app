const fs = require('fs');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.content && obj.content.includes('page.js')) {
      const match = obj.content.match(/Showing lines \d+ to \d+/);
      if (match) {
        console.log(`Found range: ${match[0]} (Type: ${obj.type}, Source: ${obj.source}, Content length: ${obj.content.length})`);
      }
    }
  } catch (e) {}
}
