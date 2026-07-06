const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'react-loadable-manifest.json');
if (fs.existsSync(file)) {
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(JSON.stringify(Object.keys(manifest).slice(0, 15), null, 2));
} else {
  console.log('File does not exist');
}
