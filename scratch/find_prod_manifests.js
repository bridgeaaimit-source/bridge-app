const fs = require('fs');
const path = require('path');

const nextServerDir = path.join(__dirname, '..', '.next', 'server');
const manifests = [];

function search(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'dev') search(full); // exclude dev folder
    } else if (file.endsWith('manifest.json')) {
      manifests.push(path.relative(nextServerDir, full));
    }
  });
}
search(nextServerDir);
console.log('Production server manifests:', manifests);
