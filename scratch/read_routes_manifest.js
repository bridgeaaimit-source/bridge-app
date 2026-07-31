const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'app-path-routes-manifest.json');
if (fs.existsSync(file)) {
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(JSON.stringify(manifest, null, 2));
} else {
  console.log('File does not exist');
}
