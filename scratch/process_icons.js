const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const PNG = require('pngjs').PNG;

const iconsDir = path.join(__dirname, '..', 'public', 'images', '3d-icons');
const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));

console.log(`Converting and processing ${files.length} JPEG files to transparent PNG...`);

files.forEach(file => {
  const filePath = path.join(iconsDir, file);
  try {
    const jpegBuffer = fs.readFileSync(filePath);
    const rawImageData = jpeg.decode(jpegBuffer, { useTArray: true });
    
    const width = rawImageData.width;
    const height = rawImageData.height;
    const data = rawImageData.data; // RGBA Uint8Array

    // Visited array for BFS
    const visited = new Uint8Array(width * height);
    const queue = [];

    // Check if pixel is white-ish
    function isWhiteish(x, y) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Threshold of 220 for white-ish background
      return r > 220 && g > 220 && b > 220;
    }

    // Add border pixels as starting points for flood fill
    for (let x = 0; x < width; x++) {
      if (isWhiteish(x, 0)) {
        queue.push([x, 0]);
        visited[0 * width + x] = 1;
      }
      if (isWhiteish(x, height - 1)) {
        queue.push([x, height - 1]);
        visited[(height - 1) * width + x] = 1;
      }
    }
    for (let y = 0; y < height; y++) {
      if (isWhiteish(0, y)) {
        queue.push([0, y]);
        visited[y * width + 0] = 1;
      }
      if (isWhiteish(width - 1, y)) {
        queue.push([width - 1, y]);
        visited[y * width + (width - 1)] = 1;
      }
    }

    // BFS flood fill
    let head = 0;
    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      
      // Make this background pixel transparent
      const idx = (cy * width + cx) * 4;
      data[idx + 3] = 0; // Alpha = 0

      // Neighbors (4-connectivity)
      const dirs = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (const [nx, ny] of dirs) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const vIdx = ny * width + nx;
          if (!visited[vIdx] && isWhiteish(nx, ny)) {
            visited[vIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }

    // Write to a new PNG
    const png = new PNG({ width, height });
    png.data = Buffer.from(data);

    const outputBuffer = PNG.sync.write(png);
    fs.writeFileSync(filePath, outputBuffer);
    console.log(`✓ Converted to PNG and made background transparent for ${file}`);
  } catch (err) {
    console.error(`Failed to process ${file}:`, err);
  }
});
