const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
let i=-1,c=0;
while((i=t.indexOf('arcType:{',i+1))>=0 && c<12){ console.log('=== @'+i); console.log(t.slice(Math.max(0,i-700), i+400).replace(/\n/g,' ')); c++; }
console.log('count',c);
