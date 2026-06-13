const fs = require('fs');
const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
const part1 = JSON.parse(lines[1320]).content;
const split1 = part1.split('\n');
console.log("Split 1 length:", split1.length);
for (let i = 0; i < 20; i++) {
  console.log(`Index ${i}: [${split1[i]}]`);
}
