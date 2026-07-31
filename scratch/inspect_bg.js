const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

const brainDir = 'C:\\Users\\lenovo\\.gemini\\antigravity-ide\\brain\\9941cce8-8319-468b-8de3-ae8b17b99100';

function inspect(fileName, backupName) {
  const filePath = path.join(brainDir, backupName);
  try {
    const jpegBuffer = fs.readFileSync(filePath);
    const rawImageData = jpeg.decode(jpegBuffer, { useTArray: true });
    const data = rawImageData.data;
    const width = rawImageData.width;
    
    console.log(`\n--- Inspecting ${fileName} ---`);
    // Print colors of the top-left corner 5x5 pixels
    for (let y = 0; y < 5; y++) {
      let row = [];
      for (let x = 0; x < 5; x++) {
        const idx = (y * width + x) * 4;
        row.push(`(${data[idx]},${data[idx+1]},${data[idx+2]})`);
      }
      console.log(`Row ${y}:`, row.join(' '));
    }
  } catch (err) {
    console.error(`Failed to inspect ${fileName}:`, err.message);
  }
}

inspect('house.png', 'house_icon_1783168778952.png');
inspect('pencil-circle.png', 'pencil_circle_icon_1783168842220.png');
