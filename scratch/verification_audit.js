const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

// 1. page.js metrics
const code = fs.readFileSync(pageJsPath, 'utf8');
const lines = code.split('\n');
console.log("=== 1. page.js metrics ===");
console.log(`Line count: ${lines.length}`);
console.log(`File size: ${fs.statSync(pageJsPath).size} bytes`);

// 2. Component existence
const filesToCheck = [
  'components/smart-interview/CameraTest.js',
  'components/smart-interview/MicTest.js',
  'components/smart-interview/VoiceTest.js',
  'components/smart-interview/DeviceTestPanel.js',
  'components/smart-interview/SetupForm.js',
  'components/smart-interview/FeedbackReport.js'
];
console.log("\n=== 2. Component existence ===");
filesToCheck.forEach(f => {
  const p = path.join(__dirname, '..', f);
  console.log(`${f}: ${fileExists(p) ? "EXISTS" : "MISSING"}`);
});

// 3. Device extraction verification
const searchTerms = [
  'function CameraTest',
  'function MicTest',
  'function VoiceTest',
  'const CameraTest',
  'const MicTest',
  'const VoiceTest'
];
console.log("\n=== 3. Device extraction verification ===");
searchTerms.forEach(term => {
  const count = (code.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  console.log(`"${term}": ${count} matches`);
});

// 4. Rendering verification
const renderTerms = [
  '<DeviceTestPanel',
  '<SetupForm',
  '<FeedbackReport'
];
console.log("\n=== 4. Rendering verification ===");
renderTerms.forEach(term => {
  console.log(`Line numbers containing "${term}":`);
  lines.forEach((line, idx) => {
    if (line.includes(term)) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
  });
});

// 5. Context verification
const contextTerms = [
  'const state = useInterviewState()',
  'const dispatch = useInterviewDispatch()'
];
console.log("\n=== 5. Context verification ===");
contextTerms.forEach(term => {
  // Normalize spacing to check
  const termNormalized = term.replace(/\s+/g, '');
  let found = false;
  lines.forEach((line, idx) => {
    const lineNormalized = line.replace(/\s+/g, '');
    if (lineNormalized.includes(termNormalized)) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
      found = true;
    }
  });
  if (!found) {
    console.log(`  "${term}" NOT found!`);
  }
});

// 6. Hook audit
console.log("\n=== 6. Hook audit ===");
console.log("--- useState declarations ---");
lines.forEach((line, idx) => {
  if (line.includes('useState(')) {
    console.log(`  Line ${idx + 1}: ${line.trim()}`);
  }
});
console.log("--- useRef declarations ---");
lines.forEach((line, idx) => {
  if (line.includes('useRef(')) {
    console.log(`  Line ${idx + 1}: ${line.trim()}`);
  }
});

// 9. DeviceTestPanel verification
const panelPath = path.join(__dirname, '..', 'components', 'smart-interview', 'DeviceTestPanel.js');
console.log("\n=== 9. DeviceTestPanel verification ===");
if (fileExists(panelPath)) {
  const panelCode = fs.readFileSync(panelPath, 'utf8');
  console.log("Imports from panel:");
  panelCode.split('\n').forEach((line, idx) => {
    if (line.includes('import')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
  });
  console.log("Hooks consumed in panel:");
  panelCode.split('\n').forEach((line, idx) => {
    if (line.includes('useInterviewState') || line.includes('useInterviewDispatch')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("DeviceTestPanel.js not found!");
}

// 10. Voice safety verification
const voicePath = path.join(__dirname, '..', 'components', 'smart-interview', 'VoiceTest.js');
console.log("\n=== 10. Voice safety verification ===");
if (fileExists(voicePath)) {
  const voiceCode = fs.readFileSync(voicePath, 'utf8');
  const voiceLines = voiceCode.split('\n');
  console.log(`isMountedRef exists: ${voiceCode.includes('isMountedRef')}`);
  
  // Print guards
  console.log("onstart guard check:");
  voiceLines.forEach((line, idx) => {
    if (line.includes('onstart')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
      console.log(`  Guard near line (Line ${idx + 2}): ${voiceLines[idx + 1].trim()}`);
    }
  });

  console.log("onresult guard check:");
  voiceLines.forEach((line, idx) => {
    if (line.includes('onresult')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
      console.log(`  Guard near line (Line ${idx + 2}): ${voiceLines[idx + 1].trim()}`);
    }
  });

  console.log("onerror guard check:");
  voiceLines.forEach((line, idx) => {
    if (line.includes('onerror')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
      console.log(`  Guard near line (Line ${idx + 2}): ${voiceLines[idx + 1].trim()}`);
    }
  });

  console.log("onend guard check:");
  voiceLines.forEach((line, idx) => {
    if (line.includes('onend')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
      console.log(`  Guard near line (Line ${idx + 2}): ${voiceLines[idx + 1].trim()}`);
    }
  });

  console.log("calcAccuracy guard check:");
  voiceLines.forEach((line, idx) => {
    if (line.includes('calcAccuracy')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
      console.log(`  Guard near line (Line ${idx + 2}): ${voiceLines[idx + 1].trim()}`);
    }
  });
} else {
  console.log("VoiceTest.js not found!");
}
