const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/smart-interview/page.js');
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

const identifiers = [
  'jobRole', 'jobDescription', 'round', 'mode',
  'cameraOk', 'micOk', 'voiceOk', 'selectedLang'
];

console.log("=== POST-MIGRATION SEARCH FOR TARGET IDENTIFIERS ===");
identifiers.forEach(id => {
  const regex = new RegExp(`\\b${id}\\b`);
  console.log(`\n--- Matches for: ${id} ---`);
  let matches = 0;
  lines.forEach((line, index) => {
    if (regex.test(line)) {
      // Exclude references to state.config.* or state.devices.* or item.* or historicalData.*
      const cleanLine = line.trim();
      const isMigrated = cleanLine.includes(`state.config.${id}`) || cleanLine.includes(`state.devices.${id}`);
      const isHistorical = cleanLine.includes(`historicalData.${id}`);
      const isItem = cleanLine.includes(`item.${id}`);
      const isDoc = cleanLine.includes(`doc.round`);
      const isMath = cleanLine.includes(`Math.round`);
      const isVoiceTestParam = cleanLine.includes(`function VoiceTest`) || (id === 'selectedLang' && cleanLine.includes('r.lang = selectedLang'));
      
      const category = isMigrated ? "[MIGRATED]" :
                       isHistorical ? "[HISTORICAL]" :
                       isItem ? "[ITEM]" :
                       isDoc ? "[DOC]" :
                       isMath ? "[MATH.ROUND]" :
                       isVoiceTestParam ? "[VOICETEST PROP]" : "[STALE/UNEXPECTED]";
                       
      console.log(`Line ${index + 1} ${category}: ${cleanLine}`);
      matches++;
    }
  });
  if (matches === 0) {
    console.log("No matches found.");
  }
});
