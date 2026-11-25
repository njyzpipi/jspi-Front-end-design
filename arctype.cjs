const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
let i=-1,c=0,out=[];
while((i=t.toLowerCase().indexOf('arctype',i+1))>=0){
  const s=t.slice(Math.max(0,i-260), i+160).replace(/\n/g,' ');
  if(/polyline/i.test(s)) { out.push('--- '+i+'\n'+s); c++; }
}
console.log('matches',c);
console.log(out.slice(0,14).join('\n'));
