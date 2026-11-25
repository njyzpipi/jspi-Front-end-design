const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
let i=t.indexOf('Ch.prototype._onEntityPropertyChanged');
console.log('idx',i);
console.log(t.slice(i, i+3000).replace(/;/g,';\n').replace(/\{/g,'{\n'));
