const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'build-manifest.json');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log(JSON.stringify(manifest, null, 2));
