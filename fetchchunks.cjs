const fs=require('fs');
const files=['chunk-GJI4ZBKE.js','chunk-RNF7TLFF.js','chunk-S4VBGY2U.js','chunk-G75U3WZT.js','chunk-LH3SUUXG.js','chunk-K2M3OJ7Z.js'];
(async()=>{for(const f of files){try{const r=await fetch('https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Workers/'+f);const t=await r.text();fs.writeFileSync(f,t);console.log(f,r.status,t.length, (t.match(/normalized result is not a number/g)||[]).length?'HAS_MSG':'')}catch(e){console.log(f,'ERR',e.message)}}})();
