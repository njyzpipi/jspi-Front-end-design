const fs=require('fs');
for(const f of fs.readdirSync('.').filter(x=>x.startsWith('chunk-')||x.startsWith('worker_'))){
 const t=fs.readFileSync(f,'utf8');
 const lines=t.split(/\r?\n/);
 if(lines.length>3){ // minified line
   const s=lines.find(l=>l.length>500)||'';
   let idx=-1,c=0;
   while((idx=s.indexOf('normalize(',idx+1))>=0 && c<6){console.log(f,'@',idx,':',s.slice(Math.max(0,idx-120),idx+120));c++;}
 }
}
