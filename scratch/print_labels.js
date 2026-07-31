const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'analyze', 'client.html');

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /chartData\s*=\s*(\[[\s\S]*?\]);/i;
  const match = content.match(regex);
  if (match) {
    const data = JSON.parse(match[1]);
    const labels = [];
    function collect(group) {
      if (group.groups) {
        group.groups.forEach(collect);
      } else {
        labels.push(group.label);
      }
    }
    data.forEach(bundle => {
      if (bundle.groups) {
        bundle.groups.forEach(collect);
      }
    });
    console.log('Sample Labels (first 100):', labels.slice(0, 100));
  }
}
