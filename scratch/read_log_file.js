const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let step = 0;

rl.on('line', (line) => {
  step++;
  if (step === 148 || step === 154 || step === 176) {
    console.log(`=== Step ${step} ===`);
    try {
      const obj = JSON.parse(line);
      console.log('Type:', obj.type);
      console.log('Tool Calls:', JSON.stringify(obj.tool_calls, null, 2));
    } catch (e) {
      console.error(e);
    }
  }
});
