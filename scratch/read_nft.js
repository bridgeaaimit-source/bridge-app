const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'server', 'app', 'page.js.nft.json');
if (fs.existsSync(file)) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('Version:', content.version);
  console.log('Sample files:', content.files.slice(0, 15));
} else {
  console.log('File does not exist');
}
