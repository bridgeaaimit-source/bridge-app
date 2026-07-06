const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'analyze', 'client.html');

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  console.log('File size:', content.length, 'bytes');
  
  // Look for chartData or similar scripts
  const regex = /chartData\s*=\s*(\[[\s\S]*?\]);/i;
  const match = content.match(regex);
  if (match) {
    console.log('Found chartData regex!');
    try {
      const data = JSON.parse(match[1]);
      console.log('Num bundles in chartData:', data.length);
      data.slice(0, 5).forEach(b => {
        console.log(`Bundle: ${b.label}, Size: ${(b.statSize / 1024).toFixed(2)} KB`);
        if (b.groups) {
          console.log('  Top modules:');
          b.groups.slice(0, 5).forEach(g => {
            console.log(`    - ${g.label}: ${(g.statSize / 1024).toFixed(2)} KB`);
          });
        }
      });
    } catch (e) {
      console.log('Parsing failed:', e.message);
    }
  } else {
    console.log('chartData not found using simple regex. Checking first 1000 characters...');
    console.log(content.slice(0, 1000));
  }
} else {
  console.log('File does not exist');
}
