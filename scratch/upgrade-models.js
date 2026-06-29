const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '..', 'app', 'api'),
  path.join(__dirname, '..', 'lib')
];

const replacements = [
  { from: /claude-sonnet-4-20250514/g, to: 'claude-sonnet-4-5' },
  { from: /claude-3-5-sonnet-20241022/g, to: 'claude-sonnet-4-5' },
  { from: /claude-3-5-haiku-20241022/g, to: 'claude-haiku-4-5' },
  { from: /claude-3-5-haiku-latest/g, to: 'claude-haiku-4-5' },
  { from: /claude-3-5-sonnet-latest/g, to: 'claude-sonnet-4-5' }
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (stat.isFile() && file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      replacements.forEach(rep => {
        if (rep.from.test(content)) {
          content = content.replace(rep.from, rep.to);
          changed = true;
        }
      });
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated model names in: ${fullPath}`);
      }
    }
  });
}

targetDirs.forEach(dir => {
  console.log(`Processing directory: ${dir}`);
  processDir(dir);
});
console.log('Model upgrade complete!');
