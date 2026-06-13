const fs = require('fs');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\aaff0481-6dab-44a8-b8af-85e0b3bc88aa\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

let part1 = null;
let part2 = null;

// Search backwards for the latest view_file tool output for lines 1 to 800 and 800 to 1431
for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i];
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'VIEW_FILE' && obj.content && 
        obj.content.includes('app/smart-interview/page.js') && 
        !obj.content.includes('restore_page_from_log.js') && 
        !obj.content.includes('find_ranges.js')) {
      if (!part1 && obj.content.includes('Showing lines 1 to 800')) {
        part1 = obj.content;
      }
      if (!part2 && obj.content.includes('Showing lines 800 to 1431')) {
        part2 = obj.content;
      }
    }
  } catch (e) {}
}

if (!part1 || !part2) {
  console.log('Failed to find both parts in log!');
  console.log(`Part 1 found: ${!!part1}`);
  console.log(`Part 2 found: ${!!part2}`);
  process.exit(1);
}

// Clean helper to strip line number prefixes e.g. "12: import ..."
function cleanLines(partText) {
  const lines = partText.split('\n');
  const result = [];
  for (const line of lines) {
    // Check if line matches "<number>: <code_content>"
    const match = line.match(/^(\d+): (.*)$/);
    if (match) {
      result.push(match[2]);
    }
  }
  return result;
}

const lines1 = cleanLines(part1);
const lines2 = cleanLines(part2);

// Merge them. Since part1 is lines 1 to 800, and part2 is lines 800 to 1431 (line 800 is shared/overlapping).
// Let's verify line numbers.
console.log(`Part 1 has ${lines1.length} code lines.`);
console.log(`Part 2 has ${lines2.length} code lines.`);

// Reconstruct by joining them without duplicating line 800
const fullCode = [...lines1.slice(0, 799), ...lines2].join('\n');

const outputPath = 'c:\\Users\\lenovo\\.gemini\\antigravity-ide\\scratch\\bridge-app\\app\\smart-interview\\page.js';
fs.writeFileSync(outputPath, fullCode, 'utf8');
console.log(`Successfully restored page.js to ${outputPath}!`);
