const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const appDir = path.join(srcDir, 'app');
const compDir = path.join(srcDir, 'components');

const clientComponents = [];
const useEffects = [];
const images = [];
const cssEffects = {
  backdropFilter: [],
  blur: [],
  boxShadow: [],
  gradients: []
};

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walk(full);
      }
    } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx')) {
      analyzeFile(full);
    }
  });
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(srcDir, filePath).replace(/\\/g, '/');

  // Check if Client Component
  if (content.includes('"use client"') || content.includes("'use client'")) {
    clientComponents.push(relPath);
  }

  // Count useEffects
  let useEffectRegex = /useEffect\s*\(\s*(.*?)\s*,\s*\[(.*?)\]\s*\)/g;
  let match;
  while ((match = useEffectRegex.exec(content)) !== null) {
    useEffects.push({
      file: relPath,
      dependencies: match[2].trim(),
      hasCleanup: match[0].includes('return')
    });
  }

  // Check for images
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g;
  while ((match = imgRegex.exec(content)) !== null) {
    images.push({
      file: relPath,
      src: match[1],
      isNextImage: false
    });
  }
  
  const nextImgRegex = /<Image\s+[^>]*src=["']([^"']+)["'][^>]*>/g;
  while ((match = nextImgRegex.exec(content)) !== null) {
    images.push({
      file: relPath,
      src: match[1],
      isNextImage: true
    });
  }

  // CSS backdrop filter & filters checks
  if (content.includes('backdrop-blur') || content.includes('backdrop-filter')) {
    cssEffects.backdropFilter.push(relPath);
  }
  if (content.includes('blur-')) {
    cssEffects.blur.push(relPath);
  }
  if (content.includes('shadow-')) {
    cssEffects.boxShadow.push(relPath);
  }
  if (content.includes('bg-gradient-')) {
    cssEffects.gradients.push(relPath);
  }
}

walk(appDir);
walk(compDir);

console.log('=== CLIENT COMPONENTS ===');
console.log(JSON.stringify(clientComponents, null, 2));

console.log('\n=== USE EFFECTS ===');
console.log(JSON.stringify(useEffects.slice(0, 15), null, 2));

console.log('\n=== IMAGES ===');
console.log(JSON.stringify(images.slice(0, 15), null, 2));

console.log('\n=== CSS EFFECTS COUNT ===');
console.log({
  backdropFilter: cssEffects.backdropFilter.length,
  blur: cssEffects.blur.length,
  boxShadow: cssEffects.boxShadow.length,
  gradients: cssEffects.gradients.length
});
