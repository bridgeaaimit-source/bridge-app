const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';

const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

console.log(`Total log lines: ${lines.length}`);

// We want to find a tool call or response that contains page.js content.
// Specifically, let's look for "view_file" or "write_to_file" or "replace_file_content" that has lines of page.js.
// Since the file has 1431 lines, let's search for JSON entries that mention "SmartInterviewContent".

for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i];
  if (line.includes('SmartInterviewContent') && line.includes('page.js')) {
    console.log(`Found candidate at line index ${i}`);
    try {
      const obj = JSON.parse(line);
      console.log(`Type: ${obj.type}, Source: ${obj.source}`);
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content') {
            console.log(`Tool call: ${tc.name}`);
            console.log(JSON.stringify(tc.args).substring(0, 500));
          }
        }
      }
      if (obj.content && obj.content.includes('SmartInterviewContent')) {
        console.log(`Content length: ${obj.content.length}`);
        console.log(obj.content.substring(0, 500));
      }
    } catch (e) {
      console.log(`Error parsing line: ${e.message}`);
    }
  }
}
