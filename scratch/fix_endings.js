const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/    \);\n  }\n  \);\n}/, '    );\n}');
  fs.writeFileSync(file, content);
}

fixFile('components/smart-interview/SetupForm.js');
fixFile('components/smart-interview/FeedbackReport.js');
console.log('Fixed endings');
