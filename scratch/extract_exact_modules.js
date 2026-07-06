const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.next', 'analyze', 'client.html');

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /chartData\s*=\s*(\[[\s\S]*?\]);/i;
  const match = content.match(regex);
  if (match) {
    const data = JSON.parse(match[1]);
    
    const targets = {
      firebase: 0,
      framerMotion: 0,
      lucide: 0,
      recharts: 0,
      supportWidget: 0,
      navbar: 0,
      hero: 0,
      animatedBackground: 0,
      others: 0
    };

    function processGroup(group) {
      if (group.groups) {
        group.groups.forEach(sub => processGroup(sub));
      } else {
        const label = group.label.toLowerCase();
        const size = group.statSize || 0;
        
        if (label.includes('firebase')) {
          targets.firebase += size;
        } else if (label.includes('framer-motion')) {
          targets.framerMotion += size;
        } else if (label.includes('lucide')) {
          targets.lucide += size;
        } else if (label.includes('recharts') || label.includes('d3')) {
          targets.recharts += size;
        } else if (label.includes('supportwidget')) {
          targets.supportWidget += size;
        } else if (label.includes('navbar')) {
          targets.navbar += size;
        } else if (label.includes('hero')) {
          targets.hero += size;
        } else if (label.includes('animatedbackground')) {
          targets.animatedBackground += size;
        } else {
          targets.others += size;
        }
      }
    }
    
    data.forEach(bundle => {
      if (bundle.groups) {
        bundle.groups.forEach(processGroup);
      }
    });
    
    console.log('=== TARGET PACKAGE ORIGINAL FOOTPRINTS ===');
    Object.keys(targets).forEach(k => {
      console.log(`${k}: ${(targets[k] / 1024).toFixed(2)} KB`);
    });
  }
}
