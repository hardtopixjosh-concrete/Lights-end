// Oct 18: boss pits are entered along a walled path (player + enemy nav reach it), the top-left pit has no water, and the
// Falconer catch spot leads ahead of a moving player.
import assert from 'node:assert/strict';import fs from 'node:fs';
const V='?v=fx-210';
const {parseTiledMap}=await import('../dist/tiled-map.js'+V);const {WORLD,blocked,setNavGoal,steerMove}=await import('../dist/simulation.js'+V);
const {buildArenas,inArena,atEntrance}=await import('../dist/arenas.js'+V);const {createRanger,tickRanger}=await import('../dist/ranger.js'+V);
const rd=f=>JSON.parse(fs.readFileSync(new URL('../dist/'+f,import.meta.url)));const map=rd('maps/desert.tmj'),manifest=rd('assets/manifest.json');
const ext={};for(const t of map.tilesets??[])if(t.source)ext[t.source]=rd('maps/'+t.source);
const scene=parseTiledMap(map,manifest,ext);WORLD.width=scene.width;WORLD.height=scene.height;const lm=n=>scene.landmarks.find(l=>l.name===n);
const arenas=buildArenas(scene,lm('player-spawn'),lm('forge')),props=scene.props,S=16;
const key=(x,y)=>Math.round(x/S)+','+Math.round(y/S);
function reach(from,goals){const seen=new Set([key(from.x,from.y)]),q=[[Math.round(from.x/S)*S,Math.round(from.y/S)*S]],hit=new Set();
 while(q.length){const [x,y]=q.shift();goals.forEach((g,i)=>{if(Math.hypot(x-g.x,y-g.y)<S*1.5)hit.add(i);});if(hit.size===goals.length)return true;
  for(const [dx,dy] of [[S,0],[-S,0],[0,S],[0,-S]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seen.has(k)||nx<0||ny<0||nx>WORLD.width||ny>WORLD.height||blocked(nx,ny,props))continue;seen.add(k);q.push([nx,ny]);}}
 return false;}
for(const a of arenas.filter(a=>a.kind==='pit')){
 assert(a.path&&atEntrance(a,{x:a.entranceX,y:a.entranceY})&&!inArena(a,{x:a.entranceX,y:a.entranceY}),a.id+' has a path entrance outside the ring');
 assert(reach(lm('player-spawn'),[{x:a.entranceX,y:a.entranceY},{x:a.x,y:a.y}]),a.id+' entrance and centre reachable on foot');
 const e={id:1,x:a.entranceX+a.path.dx*60,y:a.entranceY+a.path.dy*60,radius:12},gx=(a.path.a.x+a.path.b.x)/2-a.path.dx*-30,gy=(a.path.a.y+a.path.b.y)/2-a.path.dy*-30;let t=0;
 for(;t<25;t+=1/60){setNavGoal(gx,gy,props,1/60);const dx=gx-e.x,dy=gy-e.y,n=Math.hypot(dx,dy);if(n<40)break;steerMove(e,dx/n*90/60,dy/n*90/60,props,1/60);}
 assert(t<25,a.id+' enemy walks up the path to the gate');console.log(a.id,'R',a.radius,'entrance',Math.round(a.entranceX),Math.round(a.entranceY),'path width',Math.round(a.path.width),'enemy',t.toFixed(1)+'s');}
const bp=arenas.find(a=>a.id==='butcher-pit');for(const l of scene.landmarks)if(/^water-/.test(l.name))assert(Math.hypot(l.x-bp.x,l.y-bp.y)>bp.radius+300,'no water by the Butcher pit: '+l.name);
const s={classId:'ranger',path:'gunslinger',skills:{},hp:200,maxHp:200,dead:false,level:1,world:{}},r=createRanger(s),c={targets:[{id:1,x:300,y:-150,hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0}],weapon:{primary:'falconer',damage:1,speed:1,reach:1,projectile:1,crit:0,critDamage:1.75},skills:{},hits:0,kills:0},p={x:2000,y:2000,row:0};c.targets[0].x+=2000;c.targets[0].y+=2000;
r.held=true;for(let i=0;i<40&&!r.catchSpot;i++)tickRanger(r,c,s,p,{x:2300,y:1700},[],1/30,{x:1,y:0});
assert(r.catchSpot&&r.catchSpot.x-p.x>90&&Math.abs(r.catchSpot.y-p.y)<70,'catch spot leads the run direction: '+JSON.stringify(r.catchSpot));console.log('hawk spot ahead',Math.round(r.catchSpot.x-p.x),Math.round(r.catchSpot.y-p.y));
