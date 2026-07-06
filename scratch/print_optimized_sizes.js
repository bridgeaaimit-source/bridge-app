const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const serverAppDir = path.join(nextDir, 'server', 'app');

const manifests = [];
function findManifests(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      findManifests(full);
    } else if (file === 'page_client-reference-manifest.js') {
      manifests.push(full);
    }
  });
}
findManifests(serverAppDir);

const routeMapping = {};
manifests.forEach(manifestPath => {
  const relativeDir = path.relative(serverAppDir, path.dirname(manifestPath));
  let routeName = '/' + relativeDir.replace(/\\/g, '/');
  if (routeName === '//') routeName = '/';
  if (routeName.endsWith('/')) routeName = routeName.slice(0, -1);
  if (routeName === '') routeName = '/';

  const content = fs.readFileSync(manifestPath, 'utf8');
  const chunkRegex = /static\/chunks\/[a-zA-Z0-9\-_~]+\.js/g;
  const matchSet = new Set(content.match(chunkRegex) || []);
  
  let routeSize = 0;
  matchSet.forEach(chunk => {
    const resolvedPath = path.join(nextDir, chunk);
    if (fs.existsSync(resolvedPath)) {
      routeSize += fs.statSync(resolvedPath).size;
    }
  });

  routeMapping[routeName] = routeSize;
});

const targets = ['/', '/dashboard', '/career-intelligence', '/about', '/students'];
console.log('=== OPTIMIZED BUNDLE SIZES ===');
targets.forEach(t => {
  const bytes = routeMapping[t] || 0;
  console.log(`Route: ${t} -> ${(bytes / 1024).toFixed(2)} KB`);
});
