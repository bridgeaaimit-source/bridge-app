const fs = require('fs');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('page.js')) {
    try {
      const obj = JSON.parse(line);
      let found = false;
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.args && JSON.stringify(tc.args).includes('page.js')) {
            console.log(`Step ${obj.step_index || i}: Tool Call "${tc.name}" targeting page.js`);
            found = true;
          }
        }
      }
      if (obj.type === 'VIEW_FILE' && obj.content && JSON.stringify(obj.tool_calls || {}).includes('page.js')) {
        console.log(`Step ${obj.step_index || i}: VIEW_FILE response of page.js (content length: ${obj.content.length})`);
        found = true;
      }
    } catch (e) {}
  }
}
