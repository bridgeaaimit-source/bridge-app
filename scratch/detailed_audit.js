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

const fileContents = {};
sourceFiles.forEach(file => {
  const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
  fileContents[relPath] = fs.readFileSync(file, 'utf8');
});

const fileList = Object.keys(fileContents);

// Resolve imports
function resolveImportPath(importStr, currentFile) {
  if (importStr.startsWith('@/')) {
    const candidate = importStr.replace('@/', '');
    for (let ext of ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts']) {
      const p = candidate + ext;
      if (fileContents[p] !== undefined) return p;
    }
  } else if (importStr.startsWith('.')) {
    const currentDir = path.dirname(currentFile);
    const resolvedAbs = path.resolve(rootDir, currentDir, importStr);
    const resolvedRel = path.relative(rootDir, resolvedAbs).replace(/\\/g, '/');
    for (let ext of ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts']) {
      const p = resolvedRel + ext;
      if (fileContents[p] !== undefined) return p;
    }
  }
  return null;
}

// Map imports and exports
const exportsMap = {}; // file -> array of exported names
const importedMap = {}; // file -> Set of imported names
const fileImports = {}; // file -> array of { path, name }

fileList.forEach(file => {
  const content = fileContents[file];
  exportsMap[file] = [];
  importedMap[file] = new Set();
  fileImports[file] = [];

  // Export parsing: "export function name", "export const name", "export default"
  const exportFuncRegex = /export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = exportFuncRegex.exec(content)) !== null) {
    exportsMap[file].push(match[1]);
  }
  const exportConstRegex = /export\s+const\s+([a-zA-Z0-9_]+)/g;
  while ((match = exportConstRegex.exec(content)) !== null) {
    exportsMap[file].push(match[1]);
  }
  if (content.includes('export default')) {
    exportsMap[file].push('default');
  }

  // Import parsing: "import { a, b } from '...'", "import a from '...'", "import * as a from '...'"
  // also require: "const a = require('...')"
  const importRegex = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    const importItems = match[1].trim();
    const importPath = match[2];
    const resolved = resolveImportPath(importPath, file);
    if (!resolved) continue;

    if (importItems.startsWith('{')) {
      const names = importItems.replace(/[{}]/g, '').split(',').map(s => s.trim().split(/\s+as\s+/)[0]);
      names.forEach(name => {
        fileImports[file].push({ path: resolved, name });
      });
    } else if (importItems.startsWith('*')) {
      fileImports[file].push({ path: resolved, name: '*' });
    } else {
      // Default import
      fileImports[file].push({ path: resolved, name: 'default' });
    }
  }
});

// Calculate usage of exports
const exportUsage = {};
fileList.forEach(file => {
  exportsMap[file].forEach(exp => {
    exportUsage[`${file}:${exp}`] = [];
  });
});

fileList.forEach(file => {
  (fileImports[file] || []).forEach(imp => {
    const key = `${imp.path}:${imp.name}`;
    if (exportUsage[key]) {
      exportUsage[key].push(file);
    }
  });
});

console.log('\n=== UNUSED EXPORTED UTILITY FUNCTIONS/VARIABLES IN LIB/ ===');
fileList.filter(f => f.startsWith('lib/')).forEach(file => {
  exportsMap[file].forEach(exp => {
    const key = `${file}:${exp}`;
    const usages = exportUsage[key] || [];
    if (usages.length === 0) {
      console.log(`Unused export in ${file}: ${exp}`);
    }
  });
});

// Let's check for unused imports in each file
console.log('\n=== UNUSED IMPORTS WITHIN FILES ===');
fileList.forEach(file => {
  const content = fileContents[file];
  // Find all import statements and the names they bind
  // e.g. import X from 'y', import { A, B } from 'c'
  const importStatementRegex = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importStatementRegex.exec(content)) !== null) {
    const importItems = match[1].trim();
    let importedNames = [];
    if (importItems.startsWith('{')) {
      importedNames = importItems.replace(/[{}]/g, '').split(',').map(s => {
        const parts = s.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });
    } else if (importItems.includes('*')) {
      const m = importItems.match(/\*\s+as\s+([a-zA-Z0-9_]+)/);
      if (m) importedNames = [m[1]];
    } else {
      importedNames = [importItems.split(',')[0].trim()];
    }

    importedNames.forEach(name => {
      if (!name || name === 'React') return;
      // Search for references in the rest of the file
      // A simple regex word boundary search
      const wordRegex = new RegExp(`\\b${name}\\b`, 'g');
      let occurrences = 0;
      let wordMatch;
      while ((wordMatch = wordRegex.exec(content)) !== null) {
        occurrences++;
      }
      // The import statement itself contains the name once (or twice if { name as name }).
      // Let's count how many times it's in the import statement
      const importCount = (match[0].match(new RegExp(`\\b${name}\\b`, 'g')) || []).length;
      if (occurrences <= importCount) {
        console.log(`Unused Import in ${file}: ${name}`);
      }
    });
  }
});

// Let's find duplicate functions/blocks
console.log('\n=== DUPLICATE FUNCTIONS / BLOCKS OF CODE ===');
const functions = []; // array of { file, name, body }
fileList.forEach(file => {
  const content = fileContents[file];
  // Regex to extract function body: function name(...) { ... } or const name = (...) => { ... }
  // We can look for named function declarations
  const funcRegex = /(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const name = match[1];
    const params = match[2];
    const body = match[3].trim().replace(/\s+/g, ' '); // normalize whitespace
    if (body.length > 50) { // ignore very small helper functions
      functions.push({ file, name, body, full: match[0] });
    }
  }
});

// Compare bodies
const duplicates = [];
for (let i = 0; i < functions.length; i++) {
  for (let j = i + 1; j < functions.length; j++) {
    const f1 = functions[i];
    const f2 = functions[j];
    if (f1.body === f2.body && f1.file !== f2.file) {
      console.log(`Exact Duplicate function: ${f1.name} in ${f1.file} AND ${f2.name} in ${f2.file}`);
    } else if (f1.name === f2.name && f1.file !== f2.file) {
      // Check if they are similar
      const lenDiff = Math.abs(f1.body.length - f2.body.length);
      if (lenDiff < 100) {
        console.log(`Potential Duplicate function (Same Name & Similar Length): ${f1.name} in ${f1.file} (${f1.body.length} chars) AND ${f2.file} (${f2.body.length} chars)`);
      }
    }
  }
}
