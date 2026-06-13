const fs = require('fs');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

// We know from find_log_details.js that:
// Log Index 1320: Showing lines 1 to 800 (1431 lines total)
// Log Index 1322: Showing lines 800 to 1431 (1431 lines total)

const obj1 = JSON.parse(lines[1320]);
const obj2 = JSON.parse(lines[1322]);

const part1 = obj1.content;
const part2 = obj2.content;

function cleanLines(partText) {
  const lines = partText.split('\n');
  const result = [];
  for (const line of lines) {
    const match = line.match(/^(\d+): (.*)$/);
    if (match) {
      result.push(match[2]);
    }
  }
  return result;
}

const lines1 = cleanLines(part1);
const lines2 = cleanLines(part2);

console.log(`Part 1 has ${lines1.length} code lines.`);
console.log(`Part 2 has ${lines2.length} code lines.`);

// Reconstruct by joining them.
// Note: line 800 is lines1[799] (0-indexed). So lines1.slice(0, 799) gets lines 1 to 799.
// lines2 starts at line 800. So we concatenate them.
const fullCode = [...lines1.slice(0, 799), ...lines2].join('\n');

const outputPath = 'c:\\Users\\lenovo\\.gemini\\antigravity-ide\\scratch\\bridge-app\\app\\smart-interview\\page.js';
fs.writeFileSync(outputPath, fullCode, 'utf8');
console.log(`Successfully restored page.js to ${outputPath}!`);
