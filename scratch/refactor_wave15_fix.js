const fs = require('fs');

const pageFile = 'app/smart-interview/page.js';
let content = fs.readFileSync(pageFile, 'utf8');

content = content.replace(/stage !==/g, 'state.status !==');
content = content.replace(/,\s*stage\s*,/g, ', state.status,');
content = content.replace(/\[\s*stage\s*\]/g, '[state.status]');

fs.writeFileSync(pageFile, content);
console.log('Fixed stage references');
