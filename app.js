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
const layerState = {events:true,routes:true,zones:true};
const colors = {high:'#ff705f',watch:'#f3b856',normal:'#57c8f2'};
const typeNames = {security:'安全态势',infrastructure:'基础设施',humanitarian:'人道动态'};

function initGlobe(){
  if(!window.Cesium){showToast('CesiumJS 未能加载，请检查网络连接');return;}
  Cesium.Ion.defaultAccessToken = undefined;
  viewer = new Cesium.Viewer('cesiumContainer',{
    imageryProvider:new Cesium.OpenStreetMapImageryProvider({url:'https://tile.openstreetmap.org/'}),
    terrainProvider:new Cesium.EllipsoidTerrainProvider(),
    baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,
    navigationHelpButton:false,animation:false,timeline:false,fullscreenButton:false,
    infoBox:false,selectionIndicator:false,shouldAnimate:true,requestRenderMode:false,
    scene3DOnly:true
  });
  viewer.scene.globe.enableLighting=true;
  viewer.scene.globe.baseColor=Cesium.Color.fromCssColorString('#0a1724');
  viewer.scene.globe.showGroundAtmosphere=true;
  viewer.scene.skyAtmosphere.show=true;
  viewer.scene.fog.enabled=true;
  viewer.scene.fog.density=0.00008;
  viewer.scene.backgroundColor=Cesium.Color.fromCssColorString('#03070d');
  viewer.scene.screenSpaceCameraController.minimumZoomDistance=280000;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance=29000000;
  viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(27,30,18000000),orientation:{heading:0,pitch:Cesium.Math.toRadians(-14),roll:0}});
  addGrid();addReports();addFocusZones();addRoutes();
  viewer.screenSpaceEventHandler.setInputAction((movement)=>{
    const picked=viewer.scene.pick(movement.position);
    if(picked&&picked.id&&picked.id.properties&&picked.id.properties.reportId){selectReport(picked.id.properties.reportId.getValue());}
  },Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
function addGrid(){
  for(let lat=-60;lat<=60;lat+=30){const positions=[];for(let lon=-180;lon<=180;lon+=3)positions.push(lon,lat);viewer.entities.add({polyline:{positions:Cesium.Cartesian3.fromDegreesArray(positions),width:0.6,material:Cesium.Color.fromCssColorString('#70b9df').withAlpha(.17)}});}
  for(let lon=-180;lon<180;lon+=30){const positions=[];for(let lat=-85;lat<=85;lat+=3)positions.push(lon,lat);viewer.entities.add({polyline:{positions:Cesium.Cartesian3.fromDegreesArray(positions),width:.6,material:Cesium.Color.fromCssColorString('#70b9df').withAlpha(.13)}});}
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
function setLayers(){if(!viewer)return;reports.forEach(r=>{const e=entities.get(r.id);e.show=layerState.events&&(currentFilter==='all'||r.type===currentFilter);});viewer.entities.values.forEach(e=>{if(e.id&&String(e.id).startsWith('route-'))e.show=layerState.routes;});viewer.entities.values.forEach(e=>{if(e.ellipse&&!String(e.id||'').startsWith('report-'))e.show=layerState.zones;});}
function showToast(message){const toast=document.getElementById('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2100);}
function drawSparkline(){const canvas=document.getElementById('sparkline');const ctx=canvas.getContext('2d');const w=canvas.width,h=canvas.height;const values=[18,21,17,27,24,33,30,44,38,52,43,58,48,63,54,60,46,51,37,44,31,36,23,29];ctx.clearRect(0,0,w,h);const pts=values.map((v,i)=>[i*w/(values.length-1),h-4-v*.55]);const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(62,192,239,.24)');grad.addColorStop(1,'rgba(62,192,239,0)');ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle=grad;ctx.fill();ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle='#56c9ed';ctx.lineWidth=2;ctx.stroke();}
function bindUI(){
  renderList();renderDetail(reports[0]);drawSparkline();
  document.getElementById('filterButton').addEventListener('click',()=>document.getElementById('filterMenu').classList.toggle('open'));
  document.querySelectorAll('#filterMenu button').forEach(b=>b.addEventListener('click',()=>{currentFilter=b.dataset.filter;document.getElementById('filterButton').innerHTML=`${b.textContent} <span>⌄</span>`;document.querySelector('#filterMenu .active')?.classList.remove('active');b.classList.add('active');document.getElementById('filterMenu').classList.remove('open');renderList();setLayers();}));
  document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>{const layer=b.dataset.layer;layerState[layer]=!layerState[layer];b.classList.toggle('active',layerState[layer]);setLayers();}));
  document.querySelectorAll('.focus-row').forEach(b=>b.addEventListener('click',()=>{const report=reports.find(r=>r.city===b.dataset.city);if(report)selectReport(report.id,true);}));
  document.getElementById('resetCamera').addEventListener('click',()=>{if(viewer)viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(27,30,18000000),orientation:{heading:0,pitch:Cesium.Math.toRadians(-14),roll:0},duration:2});document.getElementById('locationName').textContent='全球视图';showToast('已返回全球态势视角');});
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
