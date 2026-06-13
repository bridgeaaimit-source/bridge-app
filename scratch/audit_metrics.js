const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
const pageJsBakPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js.bak');

const code = fs.readFileSync(pageJsPath, 'utf8');
const codeBak = fs.readFileSync(pageJsBakPath, 'utf8');

// 1. Line counts
const linesAfter = code.split('\n').length;
const linesBefore = codeBak.split('\n').length;

// 2. Sizes
const sizeAfter = fs.statSync(pageJsPath).size;
const sizeBefore = fs.statSync(pageJsBakPath).size;

// 3. Count useState and useRef
const useStateMatches = code.match(/useState\(/g) || [];
const useRefMatches = code.match(/useRef\(/g) || [];

// 4. Duplicate declaration audit
const duplicates = [];
const componentNames = ['CameraTest', 'MicTest', 'VoiceTest', 'SetupForm', 'FeedbackReport'];
componentNames.forEach(comp => {
  // Look for "function Comp"
  if (code.includes(`function ${comp}`)) {
    duplicates.push(`function ${comp}`);
  }
  // Look for "const Comp"
  if (code.includes(`const ${comp}`)) {
    duplicates.push(`const ${comp}`);
  }
});

// 5. Duplicate JSX audit
const duplicateJSX = [];
// Check for specific JSX classes or texts unique to SetupForm, DeviceTestPanel, FeedbackReport
if (code.includes('Base Material') && code.includes('Upload your Resume')) {
  duplicateJSX.push('SetupForm JSX');
}
if (code.includes('Verify Your Setup') && code.includes('Camera Verification')) {
  duplicateJSX.push('DeviceTestPanel/CameraTest JSX');
}
if (code.includes('Performance Summary') && code.includes('Placement Chance')) {
  duplicateJSX.push('FeedbackReport JSX');
}

console.log(JSON.stringify({
  linesBefore,
  linesAfter,
  sizeBefore,
  sizeAfter,
  useStateCount: useStateMatches.length,
  useRefCount: useRefMatches.length,
  duplicates,
  duplicateJSX
}, null, 2));
