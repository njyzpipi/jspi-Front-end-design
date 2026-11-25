const fs=require('fs');
const t=fs.readFileSync('Cesium.js','utf8');
for (const key of ['function ue(','ue=function','function Xo(','function Yt(']) {
  const i=t.indexOf(key); console.log('=== '+key+' @'+i);
  if(i>0) console.log(t.slice(i, i+700).replace(/;/g,';\n'));
}
