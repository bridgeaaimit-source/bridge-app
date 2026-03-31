// Comprehensive Color Update Script
// Replaces all old colors with modern theme

const fs = require('fs');
const path = require('path');

// Color mapping from old to new
const colorReplacements = {
  // Old blue colors → Modern cyan/teal
  'bg-cyan-100': 'bg-cyan-100',
  'bg-cyan-200': 'bg-cyan-200', 
  'bg-cyan-300': 'bg-cyan-300',
  'bg-cyan-400': 'bg-cyan-400',
  'bg-cyan-500': 'bg-cyan-500',
  'bg-cyan-600': 'bg-cyan-600',
  'bg-cyan-700': 'bg-cyan-700',
  'bg-cyan-800': 'bg-cyan-800',
  'bg-cyan-900': 'bg-cyan-900',
  'text-cyan-100': 'text-cyan-100',
  'text-cyan-200': 'text-cyan-200',
  'text-cyan-300': 'text-cyan-300',
  'text-cyan-400': 'text-cyan-400',
  'text-cyan-500': 'text-cyan-500',
  'text-cyan-600': 'text-cyan-600',
  'text-cyan-700': 'text-cyan-700',
  'text-cyan-800': 'text-cyan-800',
  'text-cyan-900': 'text-cyan-900',
  'border-cyan-100': 'border-cyan-100',
  'border-cyan-200': 'border-cyan-200',
  'border-cyan-300': 'border-cyan-300',
  'border-cyan-400': 'border-cyan-400',
  'border-cyan-500': 'border-cyan-500',
  'border-cyan-600': 'border-cyan-600',
  'border-cyan-700': 'border-cyan-700',
  'hover:bg-cyan-100': 'hover:bg-cyan-100',
  'hover:bg-cyan-200': 'hover:bg-cyan-200',
  'hover:bg-cyan-300': 'hover:bg-cyan-300',
  'hover:bg-cyan-400': 'hover:bg-cyan-400',
  'hover:bg-cyan-500': 'hover:bg-cyan-500',
  'hover:bg-cyan-600': 'hover:bg-cyan-600',
  'hover:bg-cyan-700': 'hover:bg-cyan-700',
  'hover:text-cyan-100': 'hover:text-cyan-100',
  'hover:text-cyan-200': 'hover:text-cyan-200',
  'hover:text-cyan-300': 'hover:text-cyan-300',
  'hover:text-cyan-400': 'hover:text-cyan-400',
  'hover:text-cyan-500': 'hover:text-cyan-500',
  'hover:text-cyan-600': 'hover:text-cyan-600',
  'hover:text-cyan-700': 'hover:text-cyan-700',
  'hover:border-cyan-100': 'hover:border-cyan-100',
  'hover:border-cyan-200': 'hover:border-cyan-200',
  'hover:border-cyan-300': 'hover:border-cyan-300',
  'hover:border-cyan-400': 'hover:border-cyan-400',
  'hover:border-cyan-500': 'hover:border-cyan-500',
  'hover:border-cyan-600': 'hover:border-cyan-600',
  'hover:border-cyan-700': 'hover:border-cyan-700',
  
  // Old purple colors → Modern purple (keep some but make consistent)
  'bg-purple-50': 'bg-purple-50',
  'bg-purple-100': 'bg-purple-50',
  'bg-purple-200': 'bg-purple-100',
  'bg-purple-300': 'bg-purple-200',
  'bg-purple-400': 'bg-purple-300',
  'bg-purple-500': 'bg-purple-400',
  'bg-purple-600': 'bg-purple-500',
  'bg-purple-700': 'bg-purple-600',
  'bg-purple-800': 'bg-purple-700',
  'text-purple-50': 'text-purple-50',
  'text-purple-100': 'text-purple-50',
  'text-purple-200': 'text-purple-100',
  'text-purple-300': 'text-purple-200',
  'text-purple-400': 'text-purple-300',
  'text-purple-500': 'text-purple-400',
  'text-purple-600': 'text-purple-500',
  'text-purple-700': 'text-purple-600',
  'text-purple-800': 'text-purple-700',
  'border-purple-50': 'border-purple-50',
  'border-purple-100': 'border-purple-50',
  'border-purple-200': 'border-purple-100',
  'border-purple-300': 'border-purple-200',
  'border-purple-400': 'border-purple-300',
  'border-purple-500': 'border-purple-400',
  'border-purple-600': 'border-purple-500',
  'hover:bg-purple-50': 'hover:bg-purple-50',
  'hover:bg-purple-50': 'hover:bg-purple-50',
  'hover:bg-purple-100': 'hover:bg-purple-50',
  'hover:bg-purple-200': 'hover:bg-purple-100',
  'hover:bg-purple-300': 'hover:bg-purple-200',
  'hover:bg-purple-400': 'hover:bg-purple-300',
  'hover:bg-purple-500': 'hover:bg-purple-400',
  'hover:text-purple-50': 'hover:text-purple-50',
  'hover:text-purple-50': 'hover:text-purple-50',
  'hover:text-purple-100': 'hover:text-purple-50',
  'hover:text-purple-200': 'hover:text-purple-100',
  'hover:text-purple-300': 'hover:text-purple-200',
  'hover:text-purple-400': 'hover:text-purple-300',
  'hover:text-purple-500': 'hover:text-purple-400',
  'hover:border-purple-50': 'hover:border-purple-50',
  'hover:border-purple-50': 'hover:border-purple-50',
  'hover:border-purple-100': 'hover:border-purple-50',
  'hover:border-purple-200': 'hover:border-purple-100',
  'hover:border-purple-300': 'hover:border-purple-200',
  'hover:border-purple-400': 'hover:border-purple-300',
  'hover:border-purple-500': 'hover:border-purple-400',
  
  // Old indigo colors → Modern purple
  'bg-purple-50': 'bg-purple-50',
  'bg-purple-100': 'bg-purple-50',
  'bg-purple-200': 'bg-purple-100',
  'bg-purple-300': 'bg-purple-200',
  'bg-purple-400': 'bg-purple-300',
  'bg-purple-500': 'bg-purple-400',
  'bg-purple-600': 'bg-purple-500',
  'bg-purple-700': 'bg-purple-600',
  'bg-purple-800': 'bg-purple-700',
  'text-purple-50': 'text-purple-50',
  'text-purple-100': 'text-purple-50',
  'text-purple-200': 'text-purple-100',
  'text-purple-300': 'text-purple-200',
  'text-purple-400': 'text-purple-300',
  'text-purple-500': 'text-purple-400',
  'text-purple-600': 'text-purple-500',
  'text-purple-700': 'text-purple-600',
  'text-purple-800': 'text-purple-700',
  'border-purple-50': 'border-purple-50',
  'border-purple-100': 'border-purple-50',
  'border-purple-200': 'border-purple-100',
  'border-purple-300': 'border-purple-200',
  'border-purple-400': 'border-purple-300',
  'border-purple-500': 'border-purple-400',
  'border-purple-600': 'border-purple-500',
  'hover:bg-purple-50': 'hover:bg-purple-50',
  'hover:bg-purple-100': 'hover:bg-purple-50',
  'hover:bg-purple-200': 'hover:bg-purple-50',
  'hover:bg-purple-300': 'hover:bg-purple-100',
  'hover:bg-purple-400': 'hover:bg-purple-200',
  'hover:bg-purple-500': 'hover:bg-purple-300',
  'hover:bg-purple-600': 'hover:bg-purple-400',
  'hover:text-purple-50': 'hover:text-purple-50',
  'hover:text-purple-100': 'hover:text-purple-50',
  'hover:text-purple-200': 'hover:text-purple-50',
  'hover:text-purple-300': 'hover:text-purple-100',
  'hover:text-purple-400': 'hover:text-purple-200',
  'hover:text-purple-500': 'hover:text-purple-300',
  'hover:text-purple-600': 'hover:text-purple-400',
  'hover:border-purple-50': 'hover:border-purple-50',
  'hover:border-purple-100': 'hover:border-purple-50',
  'hover:border-purple-200': 'hover:border-purple-50',
  'hover:border-purple-300': 'hover:border-purple-100',
  'hover:border-purple-400': 'hover:border-purple-200',
  'hover:border-purple-500': 'hover:border-purple-300',
  'hover:border-purple-600': 'hover:border-purple-400'
};

// Function to update colors in a file
function updateColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Apply all color replacements
    Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
      const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldColor)) {
        content = content.replace(regex, newColor);
        changed = true;
        console.log(`  ✓ Replaced ${oldColor} → ${newColor}`);
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

// Function to recursively find and update files
function updateDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalUpdated = 0;
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        totalUpdated += updateDirectory(filePath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (updateColorsInFile(filePath)) {
        totalUpdated++;
      }
    }
  });
  
  return totalUpdated;
}

// Main execution
console.log('🎨 Starting comprehensive color update...');
console.log('🔄 Replacing old colors with modern theme...\n');

const projectRoot = process.cwd();
const updatedCount = updateDirectory(projectRoot);

console.log(`\n✨ Color update complete!`);
console.log(`📊 Updated ${updatedCount} files`);
console.log('🎯 All old colors have been replaced with modern theme colors!');
