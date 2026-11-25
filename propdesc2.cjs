const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
const i=t.indexOf('function iIe(e,t,n,i,o)');
console.log(t.slice(i, i+1200).replace(/;/g,';\n').replace(/\{/g,'{\n'));
