const fs=require('fs');
const t=fs.readFileSync('worker_polyline.js','utf8');
let i=0, n=0;
while((i=t.indexOf('normal',i))>=0 && n<40){ console.log('---',i); console.log(t.slice(Math.max(0,i-260),i+260).replace(/\n/g,' ')); i+=6; n++; }
console.log('count normalize', (t.match(/normalize/g)||[]).length);
