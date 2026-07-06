const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'server', 'app', 'page', 'client-reference-manifest.json');
if (fs.existsSync(file)) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('Manifest Keys:', Object.keys(content));
  if (content.entryCSSFiles) {
    console.log('CSS Files:', content.entryCSSFiles);
  }
  if (content.entryJSFiles) {
    console.log('JS Files:', content.entryJSFiles);
  }
  if (content.clientModules) {
    console.log('Num Client Modules:', Object.keys(content.clientModules).length);
    console.log('Sample Module Chunks:', Object.values(content.clientModules).slice(0, 5));
  }
} else {
  console.log('File does not exist');
}
