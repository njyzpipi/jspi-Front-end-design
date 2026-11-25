const fs=require('fs');
const gj=JSON.parse(fs.readFileSync('assets/world/ne_10m_admin_0_countries.geojson','utf8'));
gj.features.forEach((f,fi)=>{
  const g=f.geometry; if(!g) return;
  const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
  polys.forEach((poly,pi)=>poly.forEach((ring,ri)=>{
    for(let i=1;i<ring.length;i++){
      const p=ring[i],q=ring[i-1];
      if(p[0]===q[0]&&p[1]===q[1]){
        console.log(JSON.stringify({featureIndex:fi,batchStart:Math.floor(fi/12)*12,admin:f.properties.ADMIN,ring:ri,idx:i,total:ring.length,prev:ring[i-2],p,q,next:ring[i+1],closed:ring[0][0]===ring[ring.length-1][0]&&ring[0][1]===ring[ring.length-1][1]}));
      }
    }
  }));
});
