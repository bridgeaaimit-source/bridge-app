const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'analyze', 'client.html');

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /chartData\s*=\s*(\[[\s\S]*?\]);/i;
  const match = content.match(regex);
  if (match) {
    const data = JSON.parse(match[1]);
    
    const moduleSizes = {};
    function processGroup(group) {
      if (group.groups) {
        group.groups.forEach(sub => processGroup(sub));
      } else {
        const label = group.label;
        const size = group.statSize || 0;
        // Parse module name (e.g. node_modules/react/index.js -> react)
        let name = label;
        if (label.includes('node_modules/')) {
          const match = label.match(/node_modules\/([^\/]+)/);
          name = match ? match[1] : label;
        } else if (label.includes('node_modules\\')) {
          const match = label.match(/node_modules\\([^\\]+)/);
          name = match ? match[1] : label;
        } else if (label.startsWith('components/')) {
          name = 'components';
        } else if (label.startsWith('app/')) {
          name = 'app';
        }
        
        moduleSizes[name] = (moduleSizes[name] || 0) + size;
      }
    }
    
    data.forEach(bundle => {
      if (bundle.groups) {
        bundle.groups.forEach(processGroup);
      }
    });
    
    console.log('=== MODULE LEVEL ORIGINAL STAT SIZE BREAKDOWN ===');
    const sorted = Object.keys(moduleSizes).sort((a, b) => moduleSizes[b] - moduleSizes[a]);
    sorted.slice(0, 25).forEach(mod => {
      console.log(`${mod}: ${(moduleSizes[mod] / 1024).toFixed(2)} KB`);
    });
  }
}
