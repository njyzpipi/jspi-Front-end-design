const fs=require('fs');
const urls=[
 'https://raw.githubusercontent.com/CesiumGS/cesium/1.124/packages/engine/Source/DataSources/GeoJsonDataSource.js',
 'https://unpkg.com/cesium@1.124.0/Source/DataSources/GeoJsonDataSource.js',
 'https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Cesium.js'
];
(async()=>{for(const u of urls){try{const r=await fetch(u);console.log(u,r.status);if(!r.ok)continue;const t=await r.text();console.log('len',t.length);if(u.endsWith('Cesium.js')){fs.writeFileSync('Cesium.js',t);}else{fs.writeFileSync('GeoJsonDataSource.js',t);t.split(/\r?\n/).forEach((l,i)=>{if(/arcType|ArcType/.test(l))console.log(i+1,l.trim())});}break}catch(e){console.log(u,'ERR',e.message)}}})();
