const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
let i=t.indexOf('_onEntityPropertyChanged=function',3623000);
console.log('idx',i);
console.log(t.slice(i, i+2200).replace(/;/g,';\n').replace(/\{/g,'{\n'));
