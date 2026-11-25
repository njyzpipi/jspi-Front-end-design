const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
console.log(t.slice(3623400, 3625000).replace(/;/g,';\n').replace(/\{/g,'{\n'));
