const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
console.log('Root directory:', rootDir);

// 1. Gather all files
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

console.log(`Found ${sourceFiles.length} source files.`);

// Let's store file contents
const fileContents = {};
sourceFiles.forEach(file => {
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  fileContents[relPath] = fs.readFileSync(file, 'utf8');
});

const fileList = Object.keys(fileContents);

// Let's analyze imports
const importsMap = {}; // relPath -> list of resolved relative paths/names imported
const exportsMap = {}; // relPath -> list of exports
const importedBy = {}; // relPath -> set of files that import this file

fileList.forEach(file => {
  importedBy[file] = new Set();
});

// Helper to resolve alias '@/' to root
function resolveImportPath(importStr, currentFile) {
  if (importStr.startsWith('@/')) {
    const candidate = importStr.replace('@/', '');
    // Try extensions
    for (let ext of ['', '.js', '.jsx', '.ts', '.tsx', '/page.js', '/route.js']) {
      const p = candidate + ext;
      if (fileContents[p] !== undefined) return p;
    }
  } else if (importStr.startsWith('.')) {
    const currentDir = path.dirname(currentFile);
    const resolvedAbs = path.resolve(rootDir, currentDir, importStr);
    const resolvedRel = path.relative(rootDir, resolvedAbs).replace(/\\/g, '/');
    for (let ext of ['', '.js', '.jsx', '.ts', '.tsx', '/page.js', '/route.js']) {
      const p = resolvedRel + ext;
      if (fileContents[p] !== undefined) return p;
    }
  }
  return null;
}

// 2. Parse imports and references
fileList.forEach(file => {
  const content = fileContents[file];
  // Simple regex for ES imports and require statements
  const importRegex = /(?:import|from|require)\s*\(?\s*['"]([^'"]+)['"]/g;
  let match;
  const fileImports = [];
  while ((match = importRegex.exec(content)) !== null) {
    const importStr = match[1];
    const resolved = resolveImportPath(importStr, file);
    if (resolved) {
      fileImports.push(resolved);
      importedBy[resolved].add(file);
    }
  }
  importsMap[file] = fileImports;
});

console.log('\n--- UNUSED FILES / ZERO DIRECT IMPORTS ---');
fileList.forEach(file => {
  // Exclude page.js, route.js, layout.tsx, next.config.ts, tailwind.config.js, next-env.d.ts which are entry points
  const isEntryPoint = file.endsWith('page.js') || 
                       file.endsWith('route.js') || 
                       file.endsWith('layout.tsx') || 
                       file.includes('next.config') || 
                       file.includes('tailwind.config') ||
                       file.includes('next-env.d.ts');
  
  if (!isEntryPoint && importedBy[file].size === 0) {
    console.log(`Unused File: ${file} (0 imports)`);
  }
});

// Let's also check for navigation links or fetch calls to pages/routes
console.log('\n--- ANALYSIS OF ROUTE / API CALLS ---');
const pageRoutes = fileList.filter(f => f.startsWith('app/') && f.endsWith('page.js'));
const apiRoutes = fileList.filter(f => f.startsWith('app/api/') && f.endsWith('route.js'));

const linksInCode = new Set();
const fetchesInCode = new Set();

fileList.forEach(file => {
  const content = fileContents[file];
  // Find href="/..." or push("/...") or push(`/...`)
  const linkRegex = /(?:href|push|pathname|url|to)\s*[=:]\s*['"`]\/([^'"`]+)['"`]/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    linksInCode.add(match[1]);
  }
  // Find fetches /api/...
  const fetchRegex = /(?:\/api\/[a-zA-Z0-9\-\_\/]+)/g;
  while ((match = fetchRegex.exec(content)) !== null) {
    fetchesInCode.add(match[0]);
  }
});

console.log('Detected pages referenced in links/code (partial matching):');
linksInCode.forEach(l => console.log(` - /${l}`));

console.log('Detected API endpoints referenced in fetches:');
fetchesInCode.forEach(f => console.log(` - ${f}`));

console.log('\nChecking which pages have no links in code:');
pageRoutes.forEach(page => {
  const routePath = page.replace('app/', '').replace('/page.js', '').replace('page.js', '');
  if (routePath === '') return; // root page
  // Check if routePath matches or is a prefix in linksInCode
  let found = false;
  linksInCode.forEach(link => {
    if (link.startsWith(routePath) || routePath.startsWith(link)) {
      found = true;
    }
  });
  if (!found) {
    console.log(`Unlinked page route: ${page} (Route: /${routePath})`);
  }
});

console.log('\nChecking which API routes have no fetches in code:');
apiRoutes.forEach(api => {
  const routePath = api.replace('app', '').replace('/route.js', '');
  let found = false;
  fetchesInCode.forEach(fetchStr => {
    if (fetchStr.startsWith(routePath) || routePath.startsWith(fetchStr)) {
      found = true;
    }
  });
  if (!found) {
    console.log(`Unused API route: ${api} (Route: ${routePath})`);
  }
});

// Commented out code blocks larger than 20 lines
console.log('\n--- COMMENTED OUT CODE BLOCKS (> 20 lines) ---');
fileList.forEach(file => {
  const content = fileContents[file];
  const lines = content.split('\n');
  
  // Single-line comments sequence
  let commentStreak = 0;
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('//')) {
      if (commentStreak === 0) {
        startIdx = i;
      }
      commentStreak++;
    } else {
      if (commentStreak > 20) {
        console.log(`File: ${file}, lines ${startIdx + 1}-${i} (${commentStreak} lines of commented out code)`);
      }
      commentStreak = 0;
    }
  }
  if (commentStreak > 20) {
    console.log(`File: ${file}, lines ${startIdx + 1}-${lines.length} (${commentStreak} lines of commented out code)`);
  }
  
  // Multi-line comment blocks
  const multiLineRegex = /\/\*([\s\S]*?)\*\//g;
  let match;
  while ((match = multiLineRegex.exec(content)) !== null) {
    const block = match[1];
    const blockLines = block.split('\n');
    if (blockLines.length > 20) {
      const matchIndex = match.index;
      const lineNum = content.substring(0, matchIndex).split('\n').length;
      console.log(`File: ${file}, lines ${lineNum}-${lineNum + blockLines.length - 1} (${blockLines.length} lines inside /* */)`);
    }
  }
});
