const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
let code = fs.readFileSync(pageJsPath, 'utf8');

code = code.replace("const fileInputRef = useRef(null);", "");

fs.writeFileSync(pageJsPath, code);
console.log("fileInputRef removed successfully!");
