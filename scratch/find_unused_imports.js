const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\de0c4f45-cb24-4ec2-b9d2-1c20d3c2c045\\.system_generated\\tasks\\task-488.log';
const logContent = fs.readFileSync(logPath, 'utf8');

const lines = logContent.split('\n');
let currentFile = null;
const results = {};

for (let line of lines) {
  line = line.trim();
  if (line.startsWith('C:\\Users\\')) {
    currentFile = line;
    results[currentFile] = [];
  } else if (currentFile && line) {
    const match = line.match(/^(\d+):(\d+)\s+(warning|error)\s+(.*)$/);
    if (match) {
      const lineNum = parseInt(match[1]);
      const colNum = parseInt(match[2]);
      const severity = match[3];
      const message = match[4];
      
      if (message.includes('defined but never used') || message.includes('assigned a value but never used')) {
        try {
          const fileLines = fs.readFileSync(currentFile, 'utf8').split('\n');
          const originalLine = fileLines[lineNum - 1] || '';
          const isImport = originalLine.trim().startsWith('import') || 
                           originalLine.trim().startsWith('const') && originalLine.includes('require(');
          
          results[currentFile].push({
            line: lineNum,
            col: colNum,
            message,
            content: originalLine.trim(),
            isImport
          });
        } catch (e) {
          results[currentFile].push({
            line: lineNum,
            col: colNum,
            message,
            content: '(could not read)',
            isImport: false
          });
        }
      }
    }
  }
}

let outputText = '';
for (const [file, items] of Object.entries(results)) {
  const importItems = items.filter(item => item.isImport);
  if (importItems.length > 0) {
    const relativePath = path.relative('c:\\Users\\lenovo\\.gemini\\antigravity-ide\\scratch\\bridge-app', file);
    outputText += `=== File: ${relativePath} ===\n`;
    for (const item of importItems) {
      outputText += `  Line ${item.line}: ${item.message}\n`;
      outputText += `    Line Content: ${item.content}\n`;
    }
  }
}

fs.writeFileSync('scratch/unused_imports.txt', outputText, 'utf8');
console.log('Saved report to scratch/unused_imports.txt');
