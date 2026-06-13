const fs = require('fs');
const path = require('path');

function searchAll(dir, targetName) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchAll(fullPath, targetName);
      } else if (file === targetName) {
        console.log(`Found: ${fullPath} (${stat.size} bytes)`);
      }
    }
  } catch (e) {
    // Skip unreadable dirs
  }
}

const targetDir = 'C:\\Users\\lenovo\\.gemini';
console.log('Searching in:', targetDir);
searchAll(targetDir, 'page.js');
console.log('Search completed.');
