const fs = require('fs');
let code = fs.readFileSync('app/smart-interview/page.js', 'utf8');
code = code.replace(/job_role: jobRole: state\.config\.jobRole,/g, 'job_role: state.config.jobRole,');
fs.writeFileSync('app/smart-interview/page.js', code);
console.log('Fixed job_role');
