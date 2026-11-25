const fs=require('fs');
const url='https://cdn.jsdelivr.net/npm/cesium@1.124.0/Source/DataSources/GeoJsonDataSource.js';
fetch(url).then(r=>{console.log('status',r.status);return r.text()}).then(t=>{fs.writeFileSync('GeoJsonDataSource.js',t);console.log('len',t.length);t.split(/\r?\n/).forEach((l,i)=>{if(/arcType|ArcType/.test(l))console.log(i+1,l.trim())})}).catch(e=>console.log('ERR',e.message));
