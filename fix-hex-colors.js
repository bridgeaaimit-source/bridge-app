// Fix hardcoded hex colors
const fs = require('fs');
const path = require('path');

// Hex color replacements
const hexReplacements = {
  'text-cyan-600': 'text-cyan-600',
  'text-cyan-700': 'text-cyan-700', 
  'text-cyan-500': 'text-cyan-500',
  'bg-cyan-50': 'bg-cyan-50',
  'text-orange-500': 'text-orange-500'
};

function updateHexColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    Object.entries(hexReplacements).forEach(([hexColor, tailwindClass]) => {
      const regex = new RegExp(hexColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(hexColor)) {
        content = content.replace(regex, tailwindClass);
        changed = true;
        console.log(`  ✓ Replaced ${hexColor} → ${tailwindClass}`);
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
    }
    
    return changed;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function updateDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalUpdated = 0;
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== 'out') {
        totalUpdated += updateDirectory(filePath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (updateHexColorsInFile(filePath)) {
        totalUpdated++;
      }
    }
  });
  
  return totalUpdated;
}

console.log('🎨 Fixing hardcoded hex colors...\n');

const projectRoot = process.cwd();
const updatedCount = updateDirectory(projectRoot);

console.log(`\n✨ Hex color fix complete!`);
console.log(`📊 Updated ${updatedCount} files`);
