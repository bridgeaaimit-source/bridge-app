const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const manifests = [];

function search(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'dev') search(full); // exclude dev folder
    } else if (file.endsWith('manifest.json')) {
      manifests.push(path.relative(nextDir, full));
    }
  });
}
search(nextDir);
console.log('Production Manifests:', manifests);
