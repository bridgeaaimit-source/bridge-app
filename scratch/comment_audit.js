const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function getFiles(dir, filterFn) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'scratch'].includes(file)) {
        results = results.concat(getFiles(fullPath, filterFn));
      }
    } else {
      if (filterFn(fullPath)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const sourceFiles = getFiles(rootDir, filePath => {
  const ext = path.extname(filePath);
  return ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
});

sourceFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  const lines = content.split('\n');

  let commentStreak = 0;
  let startIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Match line comments like // or JSX comments like {/* ... */}
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('{/*') || trimmed.startsWith('*/}') || (trimmed.startsWith('*') && !trimmed.startsWith('*/') && startIdx !== -1 && lines[startIdx].trim().startsWith('/*'));
    
    if (isComment) {
      if (commentStreak === 0) {
        startIdx = i;
      }
      commentStreak++;
    } else {
      if (commentStreak > 20) {
        // Let's verify if the block looks like code or just text documentation
        const block = lines.slice(startIdx, i).join('\n');
        const hasCodeSigns = /[{};=()\[\]]/.test(block);
        if (hasCodeSigns) {
          console.log(`COMMENTED CODE BLOCK (>20 lines) in ${relPath}: lines ${startIdx + 1}-${i} (${commentStreak} lines)`);
        }
      }
      commentStreak = 0;
      startIdx = -1;
    }
  }
  if (commentStreak > 20) {
    const block = lines.slice(startIdx).join('\n');
    const hasCodeSigns = /[{};=()\[\]]/.test(block);
    if (hasCodeSigns) {
      console.log(`COMMENTED CODE BLOCK (>20 lines) in ${relPath}: lines ${startIdx + 1}-${lines.length} (${commentStreak} lines)`);
    }
  }
});
