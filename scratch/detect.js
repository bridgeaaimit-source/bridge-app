const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'public', 'images', '3d-icons', 'house.png');
const buf = fs.readFileSync(file).slice(0, 12);
console.log('Hex signature:', buf.toString('hex'));
console.log('ASCII representation:', buf.toString('ascii'));
