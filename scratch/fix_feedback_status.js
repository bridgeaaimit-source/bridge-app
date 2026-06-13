const fs = require('fs');
let txt = fs.readFileSync('app/smart-interview/page.js', 'utf8');
txt = txt.replace(/state\.status === 'state\.evaluation\.feedback'/g, "state.status === 'feedback'");
fs.writeFileSync('app/smart-interview/page.js', txt);
