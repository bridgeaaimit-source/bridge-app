const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
const code = fs.readFileSync(pageJsPath, 'utf8');

console.log("=== Remaining useState declarations ===");
code.split('\n').forEach((line, idx) => {
  if (line.includes('useState(')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

console.log("\n=== Remaining useRef declarations ===");
code.split('\n').forEach((line, idx) => {
  if (line.includes('useRef(')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
