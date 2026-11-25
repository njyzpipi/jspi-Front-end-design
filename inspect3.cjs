const fs=require('fs');
const t=fs.readFileSync('worker_polyline.js','utf8').split(/\r?\n/)[25];
for(const pos of [4190,5953,4888]){ console.log('=== '+pos+' ==='); console.log(t.slice(pos-300,pos+120)); }
