const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const serverAppDir = path.join(nextDir, 'server', 'app');

if (!fs.existsSync(serverAppDir)) {
  console.log('Production server/app directory not found.');
  process.exit(1);
}

const nftFiles = [];
function findNfts(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      findNfts(full);
    } else if (file.endsWith('.js.nft.json')) {
      nftFiles.push(full);
    }
  });
}
findNfts(serverAppDir);

console.log(`Found ${nftFiles.length} page/route entrypoints in build.`);

const routeMapping = {};

nftFiles.forEach(nftPath => {
  const content = JSON.parse(fs.readFileSync(nftPath, 'utf8'));
  const relativePagePath = path.relative(serverAppDir, nftPath);
  // Reconstruct route name from file path
  // e.g. "dashboard/page.js.nft.json" -> "/dashboard"
  // "page.js.nft.json" -> "/"
  let routeName = '/' + relativePagePath.replace(/\\/g, '/').replace(/\/page\.js\.nft\.json$/, '').replace(/^page\.js\.nft\.json$/, '');
  if (routeName === '//') routeName = '/';
  if (routeName.endsWith('/')) routeName = routeName.slice(0, -1);
  if (routeName === '') routeName = '/';

  // Filter client chunks (files starting with 'static/chunks/')
  const clientChunks = content.files.filter(f => f.startsWith('../../static/chunks/') || f.includes('static/chunks/'));
  
  let routeSize = 0;
  const chunkSizes = [];
  clientChunks.forEach(chunk => {
    // Resolve relative path to .next/
    // f is like "../../static/chunks/..." relative to server/app/page.js
    const resolvedPath = path.resolve(path.dirname(nftPath), chunk);
    if (fs.existsSync(resolvedPath)) {
      const size = fs.statSync(resolvedPath).size;
      routeSize += size;
      chunkSizes.push({ name: path.basename(resolvedPath), size });
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
  if (r.startsWith('/api') || r.includes('icon.png')) return; // skip APIs
  const info = routeMapping[r];
  console.log(`\nRoute: ${r}`);
  console.log(`Total JS Size: ${(info.totalSize / 1024).toFixed(2)} KB`);
  console.log('Client chunks loaded:');
  info.chunks.forEach(c => {
    console.log(`  - ${c.name}: ${(c.size / 1024).toFixed(2)} KB`);
  });
});
