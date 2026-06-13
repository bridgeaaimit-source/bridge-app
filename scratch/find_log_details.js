const fs = require('fs');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

for (let i = 0; i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('app/smart-interview/page.js')) {
      const totalLinesMatch = obj.content.match(/Total Lines: (\d+)/);
      const showingLinesMatch = obj.content.match(/Showing lines (\d+) to (\d+)/);
      console.log(`Log Index ${i}: Total Lines=${totalLinesMatch ? totalLinesMatch[1] : 'unknown'}, Showing=${showingLinesMatch ? showingLinesMatch[0] : 'unknown'}, Length=${obj.content.length}`);
    }
  } catch (e) {}
}
