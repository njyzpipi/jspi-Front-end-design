const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
let i=t.indexOf('function Kv(');
console.log('idx',i);
if(i>0) console.log(t.slice(i, i+2600).replace(/\n/g,' '));
