const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const serverAppDir = path.join(nextDir, 'server', 'app');

if (!fs.existsSync(serverAppDir)) {
  console.log('Production server/app directory not found.');
  process.exit(1);
}

// Find all page_client-reference-manifest.js files
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

console.log(`Found ${manifests.length} client reference manifests.`);

const routeMapping = {};

manifests.forEach(manifestPath => {
  // Reconstruct route name from directory path relative to server/app
  const relativeDir = path.relative(serverAppDir, path.dirname(manifestPath));
  let routeName = '/' + relativeDir.replace(/\\/g, '/');
  if (routeName === '//') routeName = '/';
  if (routeName.endsWith('/')) routeName = routeName.slice(0, -1);
  if (routeName === '') routeName = '/';

  // Read client-reference-manifest.js content
  const content = fs.readFileSync(manifestPath, 'utf8');
  
  // We can extract clientModule chunk names by searching for static/chunks/... in the manifest text
  const chunkRegex = /static\/chunks\/[a-zA-Z0-9\-_~]+\.js/g;
  const matchSet = new Set(content.match(chunkRegex) || []);
  
  let routeSize = 0;
  const chunkSizes = [];
  matchSet.forEach(chunk => {
    const resolvedPath = path.join(nextDir, chunk);
    if (fs.existsSync(resolvedPath)) {
      const size = fs.statSync(resolvedPath).size;
      routeSize += size;
      chunkSizes.push({ name: chunk, size });
    }
  });

  routeMapping[routeName] = {
    totalSize: routeSize,
    chunks: chunkSizes
  };
});

// Print route table
console.log('\n=== Client-Side Bundle Sizes by Route ===');
const sortedRoutes = Object.keys(routeMapping).sort((a, b) => routeMapping[b].totalSize - routeMapping[a].totalSize);
sortedRoutes.forEach(r => {
  const info = routeMapping[r];
  console.log(`\nRoute: ${r}`);
  console.log(`Total JS Size: ${(info.totalSize / 1024).toFixed(2)} KB`);
  console.log('Client chunks loaded:');
  info.chunks.forEach(c => {
    console.log(`  - ${c.name}: ${(c.size / 1024).toFixed(2)} KB`);
  });
});
