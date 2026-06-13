const fs = require('fs');
let txt = fs.readFileSync('app/smart-interview/page.js', 'utf8');
txt = txt.replace(/payload:\s*'state\.evaluation\.feedback'/g, "payload: 'feedback'");
fs.writeFileSync('app/smart-interview/page.js', txt);
console.log("Fixed payload.");
