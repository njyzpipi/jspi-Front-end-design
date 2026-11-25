const fs=require('fs');
const gj=JSON.parse(fs.readFileSync('assets/world/ne_10m_admin_0_countries.geojson','utf8'));
let rings=0, dupAdj=0, shortRings=0, badCoord=0, closed=0, minPts=999, features=0;
const examples=[];
for(const f of gj.features){
  features++;
  const g=f.geometry; if(!g) continue;
  let polys = g.type==='Polygon'?[g.coordinates]: g.type==='MultiPolygon'?g.coordinates:[];
  for(const poly of polys){ for(const ring of poly){
    rings++;
    if(ring.length<3) { shortRings++; if(examples.length<5) examples.push({name:f.properties.ADMIN,len:ring.length}); }
    minPts=Math.min(minPts,ring.length);
    for(let i=0;i<ring.length;i++){
      const p=ring[i];
      if(!Number.isFinite(p[0])||!Number.isFinite(p[1])||!Number.isFinite(p[2]??0)) badCoord++;
      if(i>0){const q=ring[i-1]; if(p[0]===q[0]&&p[1]===q[1]) {dupAdj++; if(examples.length<10) examples.push({name:f.properties.ADMIN,dup:p});}}
    }
    if(ring.length>2){const a=ring[0],b=ring[ring.length-1]; if(a[0]===b[0]&&a[1]===b[1])closed++;}
  }}
}
console.log(JSON.stringify({features,rings,dupAdj,shortRings,badCoord,closed,minPts,examples},null,1));
