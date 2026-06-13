const fs = require('fs');
let code = fs.readFileSync('app/smart-interview/page.js', 'utf8');
code = code.replace(/'state\.evaluation\.feedback'/g, "'feedback'");
fs.writeFileSync('app/smart-interview/page.js', code);
console.log('Fixed feedback string');
