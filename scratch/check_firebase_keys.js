const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  if (line.includes('FIREBASE')) {
    const parts = line.split('=');
    console.log(parts[0].trim(), ':', parts[1] ? 'has value (length ' + parts[1].trim().length + ')' : 'empty');
  }
});
