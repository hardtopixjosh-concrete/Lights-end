// Oct 17 weapon VFX overhaul: every Ranger weapon's shots, muzzles, impacts and crits render through the shader
// bridge (stub sink) and the Canvas paths (stub ctx) without errors.
import assert from 'node:assert';
import {readFileSync} from 'node:fs';
/* Oct 19: live cache tag, so the stubbed vfx engine is the instance ranger-vfx.js uses */const V='?v='+readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').match(/game\.js\?v=([^"']+)/)[1];
const {vfx}=await import('../dist/vfx-engine.js'+V);
const {createRanger,tickRanger}=await import('../dist/ranger.js'+V);
const {drawRangerVfx}=await import('../dist/ranger-vfx.js'+V);
const {drawRangerGround,drawRangerUpper}=await import('../dist/ranger-render.js'+V);
const {FAMILIES}=await import('../dist/weapon-families.js'+V);
let quads=0;Object.defineProperty(vfx,'ok',{get:()=>true,configurable:true});vfx.add=()=>{quads++;};vfx.flush=()=>{};
const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'?()=>({addColorStop(){}}):k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
for(const f of FAMILIES.filter(f=>f.classId==='ranger'))for(const path of ['archer','ninja','alchemist','gunslinger']){
 const s={classId:'ranger',path,skills:{},hp:200,maxHp:200,dead:false,level:1,world:{}},r=createRanger(s),c={targets:[...Array(6)].map((_,i)=>({id:i+1,x:1920+i*40,y:1400+(i%2?-8:8),hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0})),weapon:{primary:f.primary,damage:1,speed:1,reach:1,projectile:1,crit:.5,critDamage:1.75},skills:{},hits:0,kills:0},p={x:1800,y:1400,row:0};
 r.held=true;for(let i=0;i<45;i++){tickRanger(r,c,s,p,{x:2040,y:1400},[],1/30,{x:0,y:0});if(r.catchSpot){p.x=r.catchSpot.x;p.y=r.catchSpot.y;}
  for(const sh of [true,false]){drawRangerGround(ctx,r,i/30,p,c.targets,sh);drawRangerUpper(ctx,r,i/30,p,c.targets,()=>{},sh);}for(const pass of ['ground','upper'])assert(drawRangerVfx(ctx,{r,path},pass));}
 /* Oct 18: cone weapons show their spray (coneFx) and barrels their blasts instead of a muzzle flash. */
 assert((r.muzzles?.length??0)>0||r.coneFx||r.barrels?.length||r.lobFx?.length||r.pools?.some(q=>q.trail),f.name+' release visual');assert((r.hitFx?.length??0)>0||r.lobFx?.length||r.pools?.some(q=>q.trail),f.name+' impacts');/* Oct 19 (fx-242): the Toxic Canister leaves trail pools instead of shots */}
// Oct 18: Archer Volley renders launch, zone, per-arrow rain and aftermath through the bridge.
{const {requestRanger,MOMENTUM}=await import('../dist/ranger.js'+V);const s={classId:'ranger',path:'archer',skills:{'archer-spell-E':1},hp:200,maxHp:200,dead:false,level:5,world:{}},r=createRanger(s),c={targets:[{id:1,x:200,y:0,hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0}],weapon:{damage:1,speed:1,reach:1,projectile:1,crit:0,critDamage:1.75},skills:{},hits:0,kills:0},p={x:0,y:0,row:0};
 r.momentum=MOMENTUM.max;assert(requestRanger(r,c,s,p,{x:200,y:0},'E'),'volley casts');const kinds=new Set();let before=quads;
 for(let i=0;i<90;i++){tickRanger(r,c,s,p,{x:200,y:0},[],1/30,{x:0,y:0});for(const f of r.volleyFx??[])kinds.add(f.kind);for(const pass of ['ground','upper'])drawRangerVfx(ctx,{r,path:'archer'},pass);}
 assert(['launch','wave','after'].every(k=>kinds.has(k)),'volley phases '+[...kinds]);assert(quads-before>2000,'volley quads '+(quads-before));}
assert(quads>1000,'shader quads emitted: '+quads);console.log('ranger vfx smoke ok',quads);
