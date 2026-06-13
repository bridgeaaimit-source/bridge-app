const fs = require('fs');

function fixFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const index = content.lastIndexOf('</AppShell>');
  if (index !== -1) {
    const fixed = content.substring(0, index + '</AppShell>'.length) + '\n    );\n}\n';
    fs.writeFileSync(file, fixed);
    console.log('Fixed ' + file);
  }
}

fixFile('components/smart-interview/SetupForm.js');
fixFile('components/smart-interview/FeedbackReport.js');
