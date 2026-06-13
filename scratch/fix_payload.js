const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
let code = fs.readFileSync(pageJsPath, 'utf8');

// Replace malformed payload mappings
code = code.replace(/job_role:\s*jobRole:\s*state\.config\.jobRole/g, 'job_role: state.config.jobRole');

fs.writeFileSync(pageJsPath, code);
console.log("Syntax fixes applied successfully!");
