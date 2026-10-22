// Oct 16: shrines/camps sit in tucked-away enclosures; the trial lives in the sealed colosseum.
import assert from 'node:assert/strict';import fs from 'node:fs';
/* Oct 19: live cache tag so WORLD is the instance world-events.js/arenas.js use */const V='?v='+fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').match(/game\.js\?v=([^"']+)/)[1];
const {parseTiledMap}=await import('../dist/tiled-map.js'+V);const {WORLD,blocked}=await import('../dist/simulation.js'+V);
const {buildArenas,inArena,gateWalls}=await import('../dist/arenas.js'+V);const {createWorldEvents,sealTrialArena}=await import('../dist/world-events.js'+V);
const rd=f=>JSON.parse(fs.readFileSync(new URL('../dist/'+f,import.meta.url)));const map=rd('maps/desert.tmj'),manifest=rd('assets/manifest.json');
const ext={};for(const t of map.tilesets??[])if(t.source)ext[t.source]=rd('maps/'+t.source);
const scene=parseTiledMap(map,manifest,ext);WORLD.width=scene.width;WORLD.height=scene.height;const lm=n=>scene.landmarks.find(l=>l.name===n);
const arenas=buildArenas(scene,lm('player-spawn'),lm('forge')),w=createWorldEvents(scene.props,()=>.3,scene.landmarks);
const col=arenas.find(a=>a.kind==='colosseum');console.log('colosseum',Math.round(col.x),Math.round(col.y),'R',col.radius);
for(const e of w.events)if(['shrine','camp','trial'].includes(e.kind)){const want=lm(e.kind+'-'+(w.events.filter(x=>x.kind===e.kind).indexOf(e)+1));const shift=Math.round(Math.hypot(e.x-want.x,e.y-want.y));
 let walls=0;for(let k=0;k<16;k++){const a=k/16*Math.PI*2;for(let r=60;r<=420;r+=20)if(blocked(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.6,scene.props,10)){walls++;break;}}
 console.log(e.kind.padEnd(6),Math.round(e.x),Math.round(e.y),'shift',shift,'enclosed dirs',walls+'/16');}
const trial=w.events.find(e=>e.kind==='trial');assert(inArena(col,trial,0),'trial inside colosseum');
// seal: outsider pushed out + frozen flag set; trial enemy kept in.
const s={clock:100,dead:false},c={targets:[{id:1,state:'alive',x:col.x+100,y:col.y},{id:2,state:'alive',x:col.x+50,y:col.y,worldEvent:trial.key}],hazards:[]};
trial.status='active';trial.trial='survival';const p={x:col.x,y:col.y};sealTrialArena(w,arenas,s,c,p);
assert(!inArena(col,c.targets[0],0),'outsider pushed out');assert(inArena(col,c.targets[1],0)&&c.targets[1].pit===col.id,'trial enemy inside, unfrozen');assert(s.timeStop?.owners.has(2),'time stopped outside');
const ev=sealTrialArena(w,arenas,s,c,{x:col.x+col.radius+50,y:col.y});assert(trial.status!=='active'&&ev.some(e=>/left/.test(e.text??'')),'leaving fails trial');
console.log('world placement ok');
// Reachability: 16px flood fill from the spawn (player radius 13) must get within 100px of every shrine/camp/trial.
{const G=16,cols=Math.ceil(WORLD.width/G),rows=Math.ceil(WORLD.height/G),seen=new Uint8Array(cols*rows),sp=lm('player-spawn'),q=[Math.floor(sp.y/G)*cols+Math.floor(sp.x/G)];seen[q[0]]=1;
 while(q.length){const i=q.pop(),x=i%cols,y=(i/cols)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,j=ny*cols+nx;if(nx<0||ny<0||nx>=cols||ny>=rows||seen[j])continue;seen[j]=1;if(!blocked(nx*G+8,ny*G+8,scene.props,13))q.push(j);else seen[j]=2;}}
 for(const e of w.events.filter(e=>['shrine','camp','trial'].includes(e.kind))){let ok=false;for(let dy=-100;dy<=100&&!ok;dy+=G)for(let dx=-100;dx<=100&&!ok;dx+=G){const j=Math.floor((e.y+dy)/G)*cols+Math.floor((e.x+dx)/G);if(seen[j]===1&&Math.hypot(dx,dy)<100)ok=true;}assert(ok,e.kind+' at '+Math.round(e.x)+','+Math.round(e.y)+' unreachable');}
 console.log('all world spots reachable');}
// Gate: with the trial gate shut, the colosseum interior is sealed (no 16px path from centre to outside).
{const props=[...scene.props,...gateWalls(col)],G=16,seen=new Set(),q=[[Math.round(col.x/G),Math.round(col.y/G)]];let escaped=false;seen.add(q[0]+'');
 while(q.length&&!escaped){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k))continue;seen.add(k);if(blocked(nx*G,ny*G,props,13))continue;if(!inArena(col,{x:nx*G,y:ny*G},-40)){escaped=true;break;}q.push([nx,ny]);}}
 assert(!escaped,'gate seals the colosseum');
 const open=new Set(),q2=[[Math.round(col.x/G),Math.round(col.y/G)]];let out=false;while(q2.length&&!out){const [x,y]=q2.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(open.has(k))continue;open.add(k);if(blocked(nx*G,ny*G,scene.props,13))continue;if(!inArena(col,{x:nx*G,y:ny*G},-40)){out=true;break;}q2.push([nx,ny]);}}
 assert(out,'open gate lets you out');console.log('colosseum gate seals/opens ok');}
