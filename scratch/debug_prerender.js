const fs = require('fs');
const path = require('path');

function searchFile(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFile(fullPath, pattern);
    } else if (file.includes(pattern)) {
      console.log('Found chunk:', fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      // Let's search around "35660" or search for "state" usage in context.
      // S is a function name. Let's find S in the file.
      // We can also extract snippets around the matches of S or state.
      const stateMatches = [];
      const regex = /state\b/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(content.length, match.index + 100);
        stateMatches.push(content.substring(start, end).replace(/\n/g, ' '));
      }
      console.log('Sample matches around "state":', stateMatches.slice(0, 10));
    }
  }
}

const nextDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextDir)) {
  searchFile(nextDir, 'app_smart-interview_page');
} else {
  console.log('.next directory does not exist');
}
