const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
for (const key of ['createPolylineGeometry','PolylineGeometry']) {
  let i=-1,c=0;
  while((i=t.indexOf(key,i+1))>=0 && c<6){ console.log('=== '+key+' @'+i); console.log(t.slice(Math.max(0,i-500), i+300).replace(/\n/g,' ')); c++; }
}
