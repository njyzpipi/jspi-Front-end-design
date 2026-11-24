const reports = [
  {id:'RPT-0428',title:'北部走廊出现多源交通中断报告',place:'NERAVA · NORTH CORRIDOR',time:'14:26Z',type:'security',tag:'HIGH',severity:'high',city:'Nerava',coords:[31.4,35.2],description:'多个公开信息源报告北部交通走廊通行受限。当前信息仍在交叉核验，建议持续关注后续更新。',confidence:'72%',source:'公开通报 · 3 个来源'},
  {id:'RPT-0425',title:'维拉沿岸通信服务间歇异常',place:'VEYRA · EASTERN COAST',time:'13:58Z',type:'infrastructure',tag:'WATCH',severity:'watch',city:'Veyra',coords:[39.1,27.3],description:'沿岸通信服务出现间歇性中断报告，影响范围尚未确认。相关基础设施状态仍在评估。',confidence:'64%',source:'基础设施监测 · 2 个来源'},
  {id:'RPT-0421',title:'索雷尔城区临时安置点启用',place:'SORELL · SOUTH DISTRICT',time:'13:12Z',type:'humanitarian',tag:'INFO',severity:'normal',city:'Sorell',coords:[24.4,31.2],description:'地方机构公告新增临时安置能力，服务范围和开放时段以当地公开信息为准。',confidence:'88%',source:'地方公告 · 4 个来源'},
  {id:'RPT-0419',title:'沿海港区作业效率下降',place:'VEYRA · PORT ZONE',time:'12:45Z',type:'infrastructure',tag:'WATCH',severity:'watch',city:'Veyra',coords:[36.7,28.6],description:'港口公开运营指标较周平均值有所下降，可能与天气和物流拥堵相关。因果关系未确认。',confidence:'59%',source:'公开运营数据 · 2 个来源'},
  {id:'RPT-0416',title:'区域边境口岸排队时间增加',place:'NERAVA · BORDER GATE',time:'11:32Z',type:'security',tag:'INFO',severity:'normal',city:'Nerava',coords:[33.8,37.7],description:'口岸公开信息显示等待时间上升。数据为模拟训练样例，不代表真实地点或实时状态。',confidence:'81%',source:'公开公告 · 3 个来源'},
  {id:'RPT-0412',title:'南部区域强风天气预警发布',place:'SORELL · SOUTH DISTRICT',time:'10:54Z',type:'humanitarian',tag:'WATCH',severity:'watch',city:'Sorell',coords:[22.8,29.4],description:'气象机构发布强风预警，可能影响道路、航空及户外活动。请以官方预报为准。',confidence:'91%',source:'环境监测 · 5 个来源'},
  {id:'RPT-0408',title:'跨区能源供应波动报告',place:'CENTRAL · GRID 04',time:'09:38Z',type:'infrastructure',tag:'INFO',severity:'normal',city:'Nerava',coords:[29.6,32.3],description:'模拟能源运行数据出现短时波动，正在与需求变化和天气数据进行关联分析。',confidence:'68%',source:'模拟遥测 · 2 个来源'},
  {id:'RPT-0404',title:'区域医疗物资需求上升',place:'SORELL · CENTRAL CLINIC',time:'08:16Z',type:'humanitarian',tag:'INFO',severity:'normal',city:'Sorell',coords:[25.8,30.5],description:'模拟公共服务数据提示部分医疗物资需求增加，当前供给状态待进一步核实。',confidence:'76%',source:'公共服务简报 · 2 个来源'}
];

let viewer;
let selectedId = reports[0].id;
let currentFilter = 'all';
const entities = new Map();
const layerState = {events:true,routes:true,zones:true,borders:true,terrain:true};
const mapLayers = {countryBorders:[],terrain:null};
const colors = {high:'#ff705f',watch:'#f3b856',normal:'#57c8f2'};
const typeNames = {security:'安全态势',infrastructure:'基础设施',humanitarian:'人道动态'};

async function initGlobe(){
  if(!window.Cesium){showToast('CesiumJS 未能加载，请检查网络连接');return;}
  Cesium.Ion.defaultAccessToken = undefined;
  viewer = new Cesium.Viewer('cesiumContainer',{
    imageryProvider:new Cesium.SingleTileImageryProvider({url:createWorldTexture(),rectangle:Cesium.Rectangle.MAX_VALUE}),
    terrainProvider:new Cesium.EllipsoidTerrainProvider(),
    baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,
    navigationHelpButton:false,animation:false,timeline:false,fullscreenButton:false,
    infoBox:false,selectionIndicator:false,shouldAnimate:true,requestRenderMode:false,
    scene3DOnly:true
  });
  viewer.scene.globe.enableLighting=false;
  viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString('#0a1724');
  viewer.scene.globe.showGroundAtmosphere=true;
  viewer.scene.skyAtmosphere.show=true;
  viewer.scene.fog.enabled=true;
  viewer.scene.fog.density=0.00008;
  viewer.scene.backgroundColor=Cesium.Color.fromCssColorString('#03070d');
  viewer.scene.screenSpaceCameraController.minimumZoomDistance=280000;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance=29000000;
  viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(27,30,18000000),orientation:{heading:0,pitch:Cesium.Math.toRadians(-90),roll:0}});
  addGrid();addCountryLabels();addReports();addFocusZones();addRoutes();
  loadCountryBoundaries();
  loadDetailedMap();
  viewer.screenSpaceEventHandler.setInputAction((movement)=>{
    const picked=viewer.scene.pick(movement.position);
    if(picked&&picked.id&&picked.id.properties&&picked.id.properties.reportId){selectReport(picked.id.properties.reportId.getValue());}
  },Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
async function loadDetailedMap(){
  const status=document.getElementById('mapStatus');
  status.textContent='本地国界已启用 · 正在加载在线影像';
  try{
    const imagery=await Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer');
    viewer.imageryLayers.remove(viewer.imageryLayers.get(0),true);
    viewer.imageryLayers.addImageryProvider(imagery,0);
    const terrain=await Cesium.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer');
    mapLayers.terrain=viewer.imageryLayers.addImageryProvider(terrain);
    mapLayers.terrain.alpha=.3;
    status.textContent='卫星影像 · 本地国家边界 · 地形阴影';
  }catch(error){
    console.warn('Detailed map layers could not be loaded.',error);
    status.textContent='在线影像服务不可用 · 已使用本地国家边界';
  }
}
async function loadCountryBoundaries(){
  const status=document.getElementById('mapStatus');
  try{
    const features=window.ORBIT_COUNTRY_BOUNDARIES.features;
    const batchSize=12;
    for(let start=0;start<features.length;start+=batchSize){
      const lines=features.slice(start,start+batchSize).map(feature=>({
        type:'Feature',
        properties:{name:feature.properties.ADMIN},
        geometry:{type:'MultiLineString',coordinates:countryRings(feature.geometry)}
      }));
      const dataSource=await Cesium.GeoJsonDataSource.load({type:'FeatureCollection',features:lines},{
        stroke:Cesium.Color.fromCssColorString('#a4e2f1').withAlpha(.82),
        strokeWidth:1.15,
        clampToGround:false
      });
      dataSource.entities.values.forEach(entity=>{
        if(entity.polyline)entity.polyline.arcType=Cesium.ArcType.NONE;
      });
      dataSource.show=layerState.borders;
      await viewer.dataSources.add(dataSource);
      mapLayers.countryBorders.push(dataSource);
      status.textContent=`正在加载完整国家边界 · ${Math.min(start+batchSize,features.length)} / ${features.length}`;
    }
    status.textContent=`完整精度国家边界已加载 · ${features.length} 个国家/地区`;
  }catch(error){
    console.error('Local country boundaries could not be loaded.',error);
    status.textContent='本地国家边界加载失败';
  }
}
function countryRings(geometry){
  if(geometry.type==='Polygon')return geometry.coordinates;
  if(geometry.type==='MultiPolygon')return geometry.coordinates.flat();
  return [];
}
function createWorldTexture(){
  const canvas=document.createElement('canvas');canvas.width=3072;canvas.height=1536;const ctx=canvas.getContext('2d');
  const ocean=ctx.createLinearGradient(0,0,0,canvas.height);ocean.addColorStop(0,'#061522');ocean.addColorStop(.48,'#10293a');ocean.addColorStop(1,'#071722');ctx.fillStyle=ocean;ctx.fillRect(0,0,canvas.width,canvas.height);
  const project=(coords)=>coords.map(([lon,lat])=>[(lon+180)/360*canvas.width,(90-lat)/180*canvas.height]);
  const land=[
    [[-168,70],[-150,72],[-135,62],[-126,54],[-124,42],[-117,32],[-108,29],[-98,20],[-91,18],[-84,25],[-80,32],[-74,40],[-67,45],[-60,52],[-79,58],[-93,66],[-111,72],[-130,70],[-148,72]],
    [[-53,82],[-37,78],[-25,70],[-40,59],[-52,61],[-61,70]],
    [[-81,12],[-70,8],[-61,-4],[-51,-2],[-45,-10],[-39,-21],[-48,-31],[-53,-45],[-66,-56],[-72,-42],[-76,-25],[-79,-7]],
    [[-11,36],[-8,44],[-4,50],[4,55],[15,57],[24,63],[35,70],[48,67],[63,72],[84,75],[101,70],[119,63],[138,55],[151,48],[161,57],[174,53],[178,45],[164,38],[145,43],[132,35],[121,26],[113,19],[107,9],[100,2],[91,6],[83,18],[74,22],[65,25],[56,26],[49,18],[43,12],[40,4],[33,-3],[28,-10],[20,-18],[12,-23],[13,-34],[20,-35],[31,-30],[34,-20],[40,-12],[48,-16],[50,-25],[42,-34],[32,-35],[20,-34],[14,-27],[9,-16],[3,-5],[-2,5],[-7,12],[-13,21],[-16,29]],
    [[-10,36],[-5,35],[2,37],[10,34],[19,31],[28,31],[34,24],[42,12],[50,0],[48,-12],[43,-21],[38,-30],[27,-35],[18,-34],[12,-27],[8,-17],[3,-6],[-1,5],[-7,12],[-12,21],[-16,29]],
    [[112,-11],[130,-12],[146,-17],[153,-27],[147,-39],[132,-44],[118,-34],[113,-23]],
    [[47,-13],[50,-17],[49,-25],[45,-24]],
    [[130,33],[137,35],[142,42],[145,44],[141,35]],
    [[95,5],[107,3],[119,-3],[127,-8],[120,-9],[110,-5],[102,-1]],
    [[-8,58],[-3,59],[0,55],[-4,51],[-7,54]],
    [[-180,-72],[-120,-74],[-60,-73],[0,-75],[60,-73],[120,-74],[180,-72],[180,-90],[-180,-90]]
  ];
  land[3]=[[-11,36],[-8,44],[-4,50],[4,55],[15,57],[24,63],[35,70],[48,67],[63,72],[84,75],[101,70],[119,63],[138,55],[151,48],[161,57],[174,53],[178,45],[164,38],[145,43],[132,35],[121,26],[113,19],[107,9],[100,2],[91,6],[83,18],[74,22],[65,25],[56,26],[49,18],[43,12],[40,4],[33,-3],[28,-10],[20,-18],[13,-23],[12,-34],[20,-35],[31,-30],[34,-20],[40,-12],[48,-16],[50,-25],[42,-34],[32,-35],[20,-34],[14,-27],[9,-16],[3,-5],[-2,5],[-7,12],[-13,21],[-16,29]];
  land.forEach((coords,index)=>{const points=project(coords);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();const fill=ctx.createLinearGradient(0,Math.min(...points.map(p=>p[1])),0,Math.max(...points.map(p=>p[1])));fill.addColorStop(0,index===10?'#102332':'#315061');fill.addColorStop(1,index===10?'#0c1d2b':'#1b3a4b');ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='rgba(111,193,222,.62)';ctx.lineWidth=2;ctx.stroke();});
  const drawLine=(coords,color,width,dash=[])=>{const points=project(coords);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);};
  const borders=[
    [[-125,49],[-110,49],[-102,49],[-95,49],[-89,47],[-82,45]], [[-117,32],[-111,31],[-106,31],[-103,29],[-97,26]],
    [[-103,28],[-102,23],[-98,20],[-95,18]], [[-79,9],[-75,5],[-72,-3],[-68,-7],[-64,-10]],
    [[-72,-18],[-68,-22],[-64,-24],[-58,-27],[-54,-30]], [[-58,-8],[-54,-13],[-51,-19],[-48,-23]],
    [[-8,55],[-5,51],[-2,50],[1,48],[3,46],[7,44],[9,42],[13,42],[17,40],[20,39],[23,38],[27,40],[29,45],[24,48],[20,50],[17,54],[14,55],[10,54],[7,52],[4,51]],
    [[-1,43],[2,42],[4,41],[7,43],[10,44]], [[5,46],[7,45],[8,43]], [[8,47],[11,47],[13,45],[16,46]],
    [[17,54],[22,55],[28,54],[30,51],[28,48]], [[24,48],[27,47],[29,45]], [[29,41],[33,42],[37,41]],
    [[30,36],[35,35],[39,37],[42,40]], [[35,32],[38,30],[43,29],[48,30]], [[48,30],[51,27],[55,26],[57,24]],
    [[60,35],[65,35],[70,33],[74,32],[78,30],[82,28],[86,27],[89,25]], [[68,24],[72,22],[76,20],[79,18]],
    [[73,35],[77,34],[80,31]], [[79,30],[83,29],[87,28],[91,27]], [[91,27],[96,28],[99,25],[103,23]],
    [[96,22],[100,21],[104,19],[108,18]], [[105,40],[109,40],[112,39],[116,38],[120,38]],
    [[110,35],[114,34],[117,32],[120,30]], [[119,43],[123,42],[127,41],[130,42]], [[127,40],[130,38],[132,35]],
    [[106,31],[109,30],[112,28]], [[121,23],[116,22],[112,21]], [[124,40],[126,37],[128,35]],
    [[140,46],[138,42],[140,39],[138,36]], [[-8,31],[-2,31],[4,30],[10,30],[15,28],[20,25]],
    [[12,15],[17,14],[22,13],[26,10]], [[20,-3],[25,-4],[30,-5],[34,-8]], [[26,-12],[30,-14],[33,-17]],
    [[29,-22],[32,-25],[28,-29],[25,-31]], [[20,-34],[24,-29],[25,-24]], [[112,-22],[121,-23],[130,-25],[139,-25]],
    [[121,-15],[130,-15],[138,-17]], [[129,-35],[134,-34],[139,-35],[143,-38]]
  ];
  borders.forEach(line=>drawLine(line,'rgba(133,204,222,.48)',1.5,[7,5]));
  const relief=[[[-125,50],[-119,45],[-114,40],[-109,35],[-105,32]],[[-75,-5],[-72,-12],[-70,-20],[-68,-28],[-70,-38]],[[-2,44],[4,45],[8,44],[12,46],[16,47],[20,46]],[[72,35],[78,32],[83,30],[88,28],[92,29]],[[80,31],[85,32],[89,30],[94,29]],[[35,41],[38,39],[42,38],[46,39]],[[27,-27],[30,-29],[33,-28],[35,-26]]];
  relief.forEach(line=>drawLine(line,'rgba(213,236,205,.22)',7));
  const labels=[['CANADA',-103,58],['UNITED STATES',-100,39],['MEXICO',-102,22],['BRAZIL',-52,-11],['ARGENTINA',-65,-37],['UNITED KINGDOM',-3,54],['FRANCE',2,47],['GERMANY',10,51],['SPAIN',-4,40],['RUSSIA',93,60],['EGYPT',30,27],['INDIA',79,23],['CHINA',104,36],['JAPAN',138,37],['AUSTRALIA',134,-25]];
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 17px Arial, sans-serif';
  labels.forEach(([name,lon,lat])=>{const [x,y]=project([[lon,lat]])[0];ctx.fillStyle='rgba(226,242,247,.82)';ctx.shadowColor='#0b1c27';ctx.shadowBlur=6;ctx.fillText(name,x,y);ctx.shadowBlur=0;});
  ctx.strokeStyle='rgba(104,181,213,.16)';ctx.lineWidth=1;
  for(let lat=-60;lat<=60;lat+=30){const y=(90-lat)/180*canvas.height;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  for(let lon=-150;lon<180;lon+=30){const x=(lon+180)/360*canvas.width;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  const lights=[[-74,40],[-118,34],[-99,19],[-46,-23],[-3,52],[2,49],[13,52],[29,41],[31,30],[37,55],[55,25],[77,29],[103,1],[116,40],[121,31],[127,37],[139,36],[151,-34],[18,-34]];
  lights.forEach(([lon,lat],i)=>{const [x,y]=project([[lon,lat]])[0];ctx.beginPath();ctx.arc(x,y,i%4===0?3:2,0,Math.PI*2);ctx.fillStyle='rgba(119,222,255,.78)';ctx.shadowBlur=12;ctx.shadowColor='#55c9fb';ctx.fill();ctx.shadowBlur=0;});
  return canvas.toDataURL('image/png');
}
function addGrid(){
  for(let lat=-60;lat<=60;lat+=30){const positions=[];for(let lon=-180;lon<=180;lon+=3)positions.push(lon,lat);viewer.entities.add({polyline:{positions:Cesium.Cartesian3.fromDegreesArray(positions),width:0.6,material:Cesium.Color.fromCssColorString('#70b9df').withAlpha(.17)}});}
  for(let lon=-180;lon<180;lon+=30){const positions=[];for(let lat=-85;lat<=85;lat+=3)positions.push(lon,lat);viewer.entities.add({polyline:{positions:Cesium.Cartesian3.fromDegreesArray(positions),width:.6,material:Cesium.Color.fromCssColorString('#70b9df').withAlpha(.13)}});}
}
function addCountryLabels(){
  const labels=[['CANADA',-103,58],['UNITED STATES',-100,39],['MEXICO',-102,22],['BRAZIL',-52,-11],['ARGENTINA',-65,-37],['UNITED KINGDOM',-3,54],['FRANCE',2,47],['GERMANY',10,51],['SPAIN',-4,40],['RUSSIA',93,60],['EGYPT',30,27],['INDIA',79,23],['CHINA',104,36],['JAPAN',138,37],['AUSTRALIA',134,-25]];
  labels.forEach(([name,longitude,latitude])=>viewer.entities.add({id:`country-label-${name}`,position:Cesium.Cartesian3.fromDegrees(longitude,latitude,2000),label:{text:name,font:'11px IBM Plex Mono, monospace',fillColor:Cesium.Color.fromCssColorString('#d7eaf2').withAlpha(.82),outlineColor:Cesium.Color.fromCssColorString('#06111b'),outlineWidth:3,style:Cesium.LabelStyle.FILL_AND_OUTLINE,verticalOrigin:Cesium.VerticalOrigin.CENTER,distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,15500000),disableDepthTestDistance:Number.POSITIVE_INFINITY}}));
}
function addReports(){
  reports.forEach((report,index)=>{
    const color=Cesium.Color.fromCssColorString(colors[report.severity]);
    const position=Cesium.Cartesian3.fromDegrees(report.coords[0],report.coords[1],0);
    const entity=viewer.entities.add({id:`report-${report.id}`,position,properties:{reportId:report.id},point:{pixelSize:12,outlineWidth:2,outlineColor:color.withAlpha(.55),color:color.withAlpha(.93),disableDepthTestDistance:Number.POSITIVE_INFINITY},label:{text:report.city.toUpperCase(),font:'10px IBM Plex Mono',fillColor:Cesium.Color.WHITE,outlineColor:Cesium.Color.BLACK,outlineWidth:3,style:Cesium.LabelStyle.FILL_AND_OUTLINE,verticalOrigin:Cesium.VerticalOrigin.BOTTOM,pixelOffset:new Cesium.Cartesian2(0,-10),distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,8500000),disableDepthTestDistance:Number.POSITIVE_INFINITY},ellipse:{semiMajorAxis:85000+index*8500,semiMinorAxis:85000+index*8500,height:50,material:color.withAlpha(.08),outline:true,outlineColor:color.withAlpha(.33),outlineWidth:1}});
    entities.set(report.id,entity);
  });
}
function addFocusZones(){
  const zones=[{name:'NERAVA',lon:31.4,lat:35.2,r:180000,color:'#ff705f'},{name:'VEYRA',lon:38,lat:28,r:220000,color:'#f3b856'},{name:'SORELL',lon:24.5,lat:30.3,r:190000,color:'#53bff0'}];
  zones.forEach(z=>viewer.entities.add({name:z.name,position:Cesium.Cartesian3.fromDegrees(z.lon,z.lat),ellipse:{semiMajorAxis:z.r,semiMinorAxis:z.r*.72,material:Cesium.Color.fromCssColorString(z.color).withAlpha(.075),outline:true,outlineColor:Cesium.Color.fromCssColorString(z.color).withAlpha(.43),outlineWidth:1}}));
}
function addRoutes(){
  const routes=[[31.4,35.2,38,28],[38,28,24.5,30.3],[31.4,35.2,24.5,30.3],[36.7,28.6,29.6,32.3]];
  routes.forEach((r,i)=>{
    const positions=[];const start=Cesium.Cartesian3.fromDegrees(r[0],r[1],1000);const end=Cesium.Cartesian3.fromDegrees(r[2],r[3],1000);const geodesic=new Cesium.EllipsoidGeodesic(Cesium.Cartographic.fromDegrees(r[0],r[1]),Cesium.Cartographic.fromDegrees(r[2],r[3]));
    for(let n=0;n<=80;n++){const p=geodesic.interpolateUsingFraction(n/80);const h=Cesium.Cartesian3.fromRadians(p.longitude,p.latitude,15000+Math.sin(Math.PI*n/80)*180000);positions.push(h);}
    viewer.entities.add({id:`route-${i}`,polyline:{positions,width:1.5,arcType:Cesium.ArcType.NONE,material:new Cesium.PolylineGlowMaterialProperty({glowPower:.14,color:Cesium.Color.fromCssColorString('#43bce9').withAlpha(.56)})}});
  });
}
function renderList(){
  const list=document.getElementById('reportList');const filtered=reports.filter(r=>currentFilter==='all'||r.type===currentFilter);
  list.innerHTML=filtered.map(r=>`<button class="report-row sev-${r.severity} ${r.id===selectedId?'selected':''}" data-report="${r.id}"><i class="report-dot"></i><span class="report-main"><b>${r.title}</b><small>${r.id} · ${r.time} · ${r.place}</small></span><span class="report-tag">${r.tag}</span></button>`).join('');
  list.querySelectorAll('[data-report]').forEach(el=>el.addEventListener('click',()=>selectReport(el.dataset.report,true)));
  document.getElementById('eventCount').textContent=String(filtered.length).padStart(2,'0');
}
function renderDetail(report){
  const c=document.getElementById('detailContent');c.innerHTML=`<div class="detail-kicker"><i></i>${typeNames[report.type].toUpperCase()} <span>·</span> ${report.tag}</div><h3>${report.title}</h3><p>${report.description}</p><div class="detail-meta"><div><span>可信度评估</span><b>${report.confidence}</b></div><div><span>最近更新</span><b>${report.time}</b></div></div><div class="source-line">来源：<b>${report.source}</b></div>`;
  document.getElementById('locationName').textContent=report.city+' · '+report.place.split('·')[1].trim();
  document.getElementById('locationCoords').textContent=`${Math.abs(report.coords[1]).toFixed(1)}° ${report.coords[1]>=0?'N':'S'}  ·  ${Math.abs(report.coords[0]).toFixed(1)}° ${report.coords[0]>=0?'E':'W'}`;
}
function selectReport(id,fly=false){
  const report=reports.find(r=>r.id===id);if(!report)return;selectedId=id;renderList();renderDetail(report);
  if(viewer){const entity=entities.get(id);viewer.selectedEntity=entity;if(fly)viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(report.coords[0],report.coords[1],1700000),orientation:{heading:0,pitch:Cesium.Math.toRadians(-48),roll:0},duration:2.1});}
}
function setLayers(){if(!viewer)return;reports.forEach(r=>{const e=entities.get(r.id);e.show=layerState.events&&(currentFilter==='all'||r.type===currentFilter);});viewer.entities.values.forEach(e=>{if(e.id&&String(e.id).startsWith('route-'))e.show=layerState.routes;});viewer.entities.values.forEach(e=>{if(e.ellipse&&!String(e.id||'').startsWith('report-'))e.show=layerState.zones;});mapLayers.countryBorders.forEach(layer=>{layer.show=layerState.borders;});if(mapLayers.terrain)mapLayers.terrain.show=layerState.terrain;}
function showToast(message){const toast=document.getElementById('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2100);}
function drawSparkline(){const canvas=document.getElementById('sparkline');const ctx=canvas.getContext('2d');const w=canvas.width,h=canvas.height;const values=[18,21,17,27,24,33,30,44,38,52,43,58,48,63,54,60,46,51,37,44,31,36,23,29];ctx.clearRect(0,0,w,h);const pts=values.map((v,i)=>[i*w/(values.length-1),h-4-v*.55]);const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(62,192,239,.24)');grad.addColorStop(1,'rgba(62,192,239,0)');ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle=grad;ctx.fill();ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle='#56c9ed';ctx.lineWidth=2;ctx.stroke();}
function bindUI(){
  renderList();renderDetail(reports[0]);drawSparkline();
  document.getElementById('filterButton').addEventListener('click',()=>document.getElementById('filterMenu').classList.toggle('open'));
  document.querySelectorAll('#filterMenu button').forEach(b=>b.addEventListener('click',()=>{currentFilter=b.dataset.filter;document.getElementById('filterButton').innerHTML=`${b.textContent} <span>⌄</span>`;document.querySelector('#filterMenu .active')?.classList.remove('active');b.classList.add('active');document.getElementById('filterMenu').classList.remove('open');renderList();setLayers();}));
  document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>{const layer=b.dataset.layer;layerState[layer]=!layerState[layer];b.classList.toggle('active',layerState[layer]);setLayers();}));
  document.querySelectorAll('.focus-row').forEach(b=>b.addEventListener('click',()=>{const report=reports.find(r=>r.city===b.dataset.city);if(report)selectReport(report.id,true);}));
  document.getElementById('resetCamera').addEventListener('click',()=>{if(viewer)viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(27,30,18000000),orientation:{heading:0,pitch:Cesium.Math.toRadians(-90),roll:0},duration:2});document.getElementById('locationName').textContent='全球视图';showToast('已返回全球态势视角');});
  document.getElementById('timeSlider').addEventListener('input',e=>{document.getElementById('timelineProgress').style.width=e.target.value+'%';const hour=Math.round(Number(e.target.value)*.24);document.getElementById('timelineLabel').textContent=`${String(hour).padStart(2,'0')}:00 UTC`;});
  document.getElementById('playTimeline').addEventListener('click',e=>{const input=document.getElementById('timeSlider');let playing=e.currentTarget.dataset.playing==='true';playing=!playing;e.currentTarget.dataset.playing=playing;e.currentTarget.textContent=playing?'Ⅱ':'▶';if(playing){window.timelineTimer=setInterval(()=>{input.value=(Number(input.value)+1)%101;input.dispatchEvent(new Event('input'));},130);showToast('正在回放模拟态势');}else{clearInterval(window.timelineTimer);}});
  document.querySelectorAll('.range-chip').forEach(b=>b.addEventListener('click',()=>{document.querySelector('.range-chip.active')?.classList.remove('active');b.classList.add('active');document.getElementById('timelineLabel').textContent=b.textContent==='CUSTOM'?'自定义时间范围':`近 ${b.textContent}`;}));
  document.getElementById('fullscreenButton').addEventListener('click',()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.());
  document.getElementById('searchButton').addEventListener('click',()=>{const name=window.prompt('搜索城市或事件名称');if(!name)return;const r=reports.find(x=>x.city.toLowerCase().includes(name.toLowerCase())||x.title.includes(name));if(r)selectReport(r.id,true);else showToast('未找到匹配的模拟情报');});
  document.getElementById('refreshButton').addEventListener('click',()=>{selectReport(selectedId);showToast('模拟态势数据已刷新');});
  document.getElementById('showAllButton').addEventListener('click',()=>{currentFilter='all';document.getElementById('filterButton').innerHTML='全部类型 <span>⌄</span>';renderList();setLayers();});
  document.getElementById('expandNetwork').addEventListener('click',()=>showToast('关联分析视图已就绪'));
  document.querySelectorAll('.network-node').forEach(n=>n.addEventListener('click',()=>showToast(`已选中关联实体：${n.dataset.node}`)));
  setInterval(()=>{const now=new Date();document.getElementById('clockTime').textContent=now.toISOString().slice(11,19);},1000);
}
window.addEventListener('load',()=>{initGlobe();bindUI();});
