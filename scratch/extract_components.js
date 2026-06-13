const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
let pageJsCode = fs.readFileSync(pageJsPath, 'utf8');

// The boundaries of components.
// I will find them using indexOf.
let setupStart = pageJsCode.indexOf("if (state.status === 'setup') {");
let deviceTestStart = pageJsCode.indexOf("if (state.status === 'device-test') {");
let feedbackStart = pageJsCode.indexOf("if (state.status === 'feedback') {");
let historyStart = pageJsCode.indexOf("if (state.status === 'history') {");

console.log('setupStart: ', setupStart);
console.log('deviceTestStart: ', deviceTestStart);
console.log('feedbackStart: ', feedbackStart);
console.log('historyStart: ', historyStart);

const setupCode = pageJsCode.substring(setupStart, deviceTestStart);
const feedbackCode = pageJsCode.substring(feedbackStart, historyStart);

fs.writeFileSync(path.join(__dirname, 'setupCode.txt'), setupCode);
fs.writeFileSync(path.join(__dirname, 'feedbackCode.txt'), feedbackCode);
