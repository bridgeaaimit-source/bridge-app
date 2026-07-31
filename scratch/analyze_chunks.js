const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const buildManifestPath = path.join(nextDir, 'build-manifest.json');

if (!fs.existsSync(buildManifestPath)) {
  console.error('Build manifest not found. Run next build first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
const pages = manifest.pages;

console.log('=== Next.js Webpack Page Chunk Analysis ===');
const routeSizes = [];

Object.keys(pages).forEach(route => {
  const files = pages[route];
  let totalSize = 0;
  const fileDetails = [];
  
  files.forEach(file => {
    const filePath = path.join(nextDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      fileDetails.push({ name: file, size: stats.size });
    }
  });
  
  routeSizes.push({ route, totalSize, files: fileDetails });
});

// Sort by size descending
routeSizes.sort((a, b) => b.totalSize - a.totalSize);

routeSizes.forEach(item => {
  console.log(`\nRoute: ${item.route}`);
  console.log(`Total Size: ${(item.totalSize / 1024).toFixed(2)} KB`);
  console.log('Files:');
  item.files.forEach(f => {
    console.log(`  - ${f.name}: ${(f.size / 1024).toFixed(2)} KB`);
  });
});

console.log('\n=== Top Chunks in .next/static/chunks/ ===');
const staticChunksDir = path.join(nextDir, 'static', 'chunks');
if (fs.existsSync(staticChunksDir)) {
  const allFiles = [];
  function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (file.endsWith('.js')) {
        allFiles.push(full);
      }
    });
  }
  walk(staticChunksDir);
  
  const chunkSizes = allFiles.map(filePath => {
    const stats = fs.statSync(filePath);
    return {
      path: path.relative(nextDir, filePath),
      size: stats.size
    };
  });
  
  chunkSizes.sort((a, b) => b.size - a.size);
  chunkSizes.slice(0, 15).forEach(chunk => {
    console.log(`${(chunk.size / 1024).toFixed(2)} KB  -  ${chunk.path}`);
  });
}
