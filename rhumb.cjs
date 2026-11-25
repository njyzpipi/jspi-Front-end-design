const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
let i=-1,c=0;
while((i=t.indexOf('RHUMB',i+1))>=0 && c<20){console.log('===',i);console.log(t.slice(Math.max(0,i-400),i+200).replace(/\n/g,' '));c++;}
console.log('total', (t.match(/RHUMB/g)||[]).length);
