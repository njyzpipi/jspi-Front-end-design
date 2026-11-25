const fs=require('fs');
const t=fs.readFileSync('chunk-S4VBGY2U.js','utf8');
const idx=t.indexOf('normalized result is not a number');
console.log(t.slice(idx-700,idx+300));
