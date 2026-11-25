const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
const s=t.slice(3621800, 3623500);
console.log(s.replace(/;/g,';\n').replace(/\{/g,'{\n'));
