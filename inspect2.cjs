const fs=require('fs');
const t=fs.readFileSync('worker_polyline.js','utf8').split(/\r?\n/)[25];
console.log('len',t.length);
for(let i=0;i<t.length;i+=1200){console.log('\n=== '+i+' ===\n'+t.slice(i,i+1200));}
