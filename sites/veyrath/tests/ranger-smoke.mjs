// Oct 17 Ranger smoke: bow LMB builds Momentum, every spec's four skills and all 64 behaviors run without errors and deal damage.
import assert from 'node:assert';
const V='?v=fx-148';
const {createRanger,tickRanger,requestRanger,releaseRanger,rangerAbility,MOMENTUM}=await import('../dist/ranger.js'+V);
const {TALENT_NODES}=await import('../dist/talent-data.js'+V);
const {PATHS}=await import('../dist/specializations.js'+V);
const {migrateArmory,createArmory,weaponClass,weaponStats,makeWeapon}=await import('../dist/weapons.js'+V);
assert.equal(PATHS.ranger.length,4);
const arm=migrateArmory(createArmory(0)),bow=arm.weapons.find(w=>weaponClass(w)==='ranger');assert(bow&&arm.classEquipped.ranger===bow.id,'ranger starter bow');
assert.equal(weaponStats(bow,1).primary,'shortbow');for(let i=0;i<20;i++)makeWeapon(10,Math.random,3,null,'ranger');
const enemies=()=>[...Array(8)].map((_,i)=>({id:i+1,x:90+(i%4)*40,y:(i%2?-8:8),hp:1e6,maxHp:1e6,radius:14,state:'alive',role:i===0?'leader':'swarm',hurt:0}));
for(const spec of ['archer','ninja','alchemist','gunslinger']){
 for(const behaviors of [false,true]){
  const skills={};for(const n of TALENT_NODES)if(n.path===spec&&(n.type==='spell'||behaviors))skills[n.id]=1;
  const s={classId:'ranger',path:spec,skills,hp:200,maxHp:200,dead:false,level:20,world:{}},r=createRanger(s),c={targets:enemies(),weapon:{damage:1,speed:1,reach:1,projectile:1,crit:.05,critDamage:1.75},skills:{},hits:0,kills:0},p={x:0,y:0,row:0},aim={x:220,y:0};
  assert(!requestRanger(r,c,s,p,aim,'E'),'no momentum, no cast');
  r.held=true;let dealt=0,seen=false;const count=ev=>{for(const e of ev)if(e.type==='hit')dealt+=e.damage;if(c.targets.some(e=>e.rMarked>0||e.rExposed>0||e.rPoison||e.rBurn||e.slow>0))seen=true;};
  for(let i=0;i<60;i++)count(tickRanger(r,c,s,p,aim,[],1/30,{x:0,y:0}));
  assert(r.momentum>0,spec+': bow hits build momentum');assert(dealt>0,spec+': bow deals damage');
  for(const key of ['RMB','Q','E','R']){r.momentum=MOMENTUM.max;for(const k in r.cooldowns)r.cooldowns[k]=0;const before=dealt;
   assert(requestRanger(r,c,s,p,aim,key),spec+' '+key+' casts');if(rangerAbility(s,key).kind==='power'){for(let i=0;i<20;i++)count(tickRanger(r,c,s,p,aim,[],1/30,{x:0,y:0}));assert(releaseRanger(r,c,s,p,aim,'RMB'));}
   for(let i=0;i<120;i++)count(tickRanger(r,c,s,p,aim,[],1/30,{x:1,y:0}));
   if(key!=='Q'||spec==='alchemist')assert(dealt>before,spec+' '+key+' ('+rangerAbility(s,key).name+') deals damage');}
  // Combos: catalyst into the toxic cloud, fan into Marked enemies.
  if(spec==='alchemist'){r.momentum=100;r.cooldowns.RMB=0;requestRanger(r,c,s,p,aim,'RMB');for(let i=0;i<20;i++)count(tickRanger(r,c,s,p,aim,[],1/30,{x:0,y:0}));}
  assert(seen,spec+': statuses applied');
 }}
// Every Ranger weapon family fires its own LMB and hits (whole-model hitbox).
const {FAMILIES}=await import('../dist/weapon-families.js'+V);
for(const f of FAMILIES.filter(f=>f.classId==='ranger')){const s={classId:'ranger',path:'gunslinger',skills:{},hp:200,maxHp:200,dead:false,level:1,world:{}},r=createRanger(s),c={targets:enemies().map(e=>({...e,x:e.x+1800,y:e.y+1400})),weapon:{primary:f.primary,damage:1,speed:1,reach:1,projectile:1,crit:0,critDamage:1.75},skills:{},hits:0,kills:0},p={x:1800,y:1400,row:0};
 if(f.primary==='canister')Object.assign(c.targets[0],{x:1800,y:1400});/* Oct 19: the canister drops pools behind you */
 r.held=true;let hits=0;for(let i=0;i<90;i++)for(const e of tickRanger(r,c,s,p,{x:2020,y:1400},[],1/30,{x:0,y:0}))if(e.type==='hit')hits++;assert(hits>0,f.name+' LMB hits');}
// Pistols (Oct 19): each gun takes a different enemy inside the 60 deg cone in front; nobody to the side or behind.
{const s={classId:'ranger',path:'gunslinger',skills:{},hp:200,maxHp:200,dead:false,level:1,world:{}},r=createRanger(s),c={targets:[{id:1,x:1900,y:1400,hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0},{id:2,x:1950,y:1325,hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0},{id:3,x:1800,y:1490,hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0}],weapon:{primary:'pistols',damage:1,speed:1,reach:1,projectile:1,crit:0,critDamage:1.75},skills:{},hits:0,kills:0},p={x:1800,y:1400,row:0},hit=new Set();
 r.held=true;for(let i=0;i<60;i++)for(const e of tickRanger(r,c,s,p,{x:2300,y:1400},[],1/30,{x:0,y:0}))if(e.type==='hit')hit.add(e.targetId);assert(hit.has(1)&&hit.has(2)&&!hit.has(3),'pistols hit the two in the cone: '+[...hit]);}
// Shotgun: one blast registers at most 3 pellets on one enemy. Chakram: hits on the way out and back. Hawk: catch looses 3 follow-ups.
const mk=(primary,targets)=>{const s={classId:'ranger',path:'gunslinger',skills:{},hp:200,maxHp:200,dead:false,level:1,world:{}};return {s,r:createRanger(s),c:{targets,weapon:{primary,damage:1,speed:1,reach:1,projectile:1,crit:0,critDamage:1.75},skills:{},hits:0,kills:0},p:{x:0,y:0,row:0}};};
const foe=(id,x,y=0)=>({id,x,y,hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0});
{const {s,r,c,p}=mk('shotgun',[foe(1,60)]);r.held=true;let n=0;for(let i=0;i<10;i++)for(const e of tickRanger(r,c,s,p,{x:200,y:0},[],1/30,{x:0,y:0}))if(e.type==='hit')n++;assert(n>=1&&n<=3,'shotgun cap 3 per enemy, got '+n);}
{const {s,r,c,p}=mk('chakram',[foe(1,200)]);r.held=true;let n=0;for(let i=0;i<8;i++)for(const e of tickRanger(r,c,s,p,{x:450,y:0},[],1/30,{x:0,y:0}))if(e.type==='hit')n++;r.held=false;for(let i=0;i<60;i++)for(const e of tickRanger(r,c,s,p,{x:450,y:0},[],1/30,{x:0,y:0}))if(e.type==='hit')n++;assert(r.shots.filter(b=>b.chakram).length===0,'chakrams return');assert(n>=2,'chakram hits out and back, got '+n);}
{const {s,r,c,p}=mk('falconer',[foe(1,300),foe(2,150,100),foe(3,-200,0),foe(4,0,-200)]);r.held=true;let caught=false;
 for(let i=0;i<60&&!caught;i++){tickRanger(r,c,s,p,{x:400,y:0},[],1/30,{x:0,y:0});if(r.catchSpot){p.x=r.catchSpot.x;p.y=r.catchSpot.y;}if(r.hawkFollow?.length)caught=true;}
 assert(caught&&r.hawkFollow.length===3,'hawk catch looses 3 hawks');let n=0;for(let i=0;i<30;i++)for(const e of tickRanger(r,c,s,p,{x:400,y:0},[],1/30,{x:0,y:0}))if(e.type==='hit')n++;assert(n>0,'follow-up hawks hit');}
{const {s,r,c}=mk('falconer',[foe(1,2100,1400)]),p={x:1800,y:1400,row:0};/* Oct 19: off the map corner (every catch spot was blocked there, so the spot fell back onto the player) */r.held=true;for(let i=0;i<40;i++)tickRanger(r,c,s,p,{x:2200,y:1400},[],1/30,{x:0,y:0});assert(!r.hawkFollow?.length,'missed catch: no follow-up');}
// Oct 18 Ninja: E channels while held until Momentum runs out (cost per wave); standing in your own Smoke Bomb hides you (per player).
{const s={classId:'ranger',path:'ninja',skills:{'ninja-spell-E':1,'ninja-spell-Q':1},hp:200,maxHp:200,dead:false,level:5,world:{}},r=createRanger(s),c={targets:[foe(1,200)],weapon:{damage:1,speed:1,reach:1,projectile:1,crit:0,critDamage:1.75},skills:{},hits:0,kills:0},p={x:0,y:0,row:0};
 r.momentum=100;assert(requestRanger(r,c,s,p,{x:200,y:0},'E'));let waves=0,was=r.momentum;for(let i=0;i<120;i++){tickRanger(r,c,s,p,{x:200,y:0},[],1/30,{x:0,y:0});if(r.momentum<was-1)waves++;was=r.momentum;}
 assert(!r.blades&&r.momentum<12,'channel runs until Momentum is spent: '+r.momentum);assert(waves>=6,'held channel fires many waves: '+waves);
 r.momentum=100;r.cooldowns.E=0;assert(requestRanger(r,c,s,p,{x:200,y:0},'E'));for(let i=0;i<10;i++)tickRanger(r,c,s,p,{x:200,y:0},[],1/30,{x:0,y:0});releaseRanger(r,c,s,p,null,'E');for(let i=0;i<20;i++)tickRanger(r,c,s,p,{x:200,y:0},[],1/30,{x:0,y:0});assert(!r.blades&&r.momentum>50,'release ends the channel');
 r.momentum=100;r.cooldowns.Q=0;assert(requestRanger(r,c,s,p,{x:200,y:0},'Q'));tickRanger(r,c,s,p,null,[],1/30,{x:0,y:0});assert(p.unseen&&p.lastSeen,'hidden in own smoke');p.x=600;tickRanger(r,c,s,p,null,[],1/30,{x:0,y:0});assert(!p.unseen,'visible outside the smoke');
 const {targetFor,party}=await import('../dist/party.js'+V);const a={id:0,x:0,y:0,unseen:true},b={id:1,x:300,y:0};party.players=[a,b];assert(targetFor({x:10,y:0},a)===b,'enemies skip the hidden player');party.players=[];}
// Oct 18 regrouped weapons: Bow -> Short Bow migration, Alchemist starter, Crossbow single shot + reload, bombs skip, barrels chain, potions, canister trail.
{const {RANGER_FAMILIES}=await import('../dist/core-rules.js'+V);const old=createArmory(0);old.weapons.push({...makeWeapon(5,Math.random,1,14,'ranger','archer'),family:12,name:'Runed Bow'});const m=migrateArmory(old);
 assert(!m.weapons.some(w=>w.family===12)&&m.weapons.some(w=>w.name==='Runed Short Bow'),'saved Bow becomes a Short Bow');assert(m.weapons.some(w=>w.family===RANGER_FAMILIES.alchemist[0]),'alchemist gets a Potion Satchel starter');
 const at=(x,y=1400)=>foe(1000+x,1800+x,y),O={x:1800,y:1400,row:0};
 {const {s,r,c}=mk('crossbow',[at(150),at(220)]);const p={...O};r.held=true;const ids=new Set();let first=null;for(let i=0;i<30;i++)for(const e of tickRanger(r,c,s,p,{x:2100,y:1400},[],1/30,{x:0,y:0}))if(e.type==='hit'){ids.add(e.targetId);first??=i;}assert(ids.size===1,'crossbow bolt stops at the first enemy');assert(r.reload||r.fireT>0,'crossbow reloads');}
 {const {s,r,c}=mk('bombbag',[at(120),at(200),at(280)]);const p={...O};r.held=true;const kinds=new Set();for(let i=0;i<60;i++){tickRanger(r,c,s,p,{x:1920,y:1400},[],1/30,{x:0,y:0});for(const f of r.lobFx??[])kinds.add(f.kind);}assert(kinds.has('bombHop')&&kinds.has('bombBig'),'bomb skips then blasts');}
 {const {s,r,c}=mk('potion',[at(150)]);const p={...O};r.held=true;const els=new Set();for(let i=0;i<150;i++){tickRanger(r,c,s,p,{x:1950,y:1400},[],1/30,{x:0,y:0});for(const f of r.flasks)if(f.el)els.add(f.el);}assert(els.size>=2,'every 4th potion is elemental: '+[...els]);}
 {const {s,r,c}=mk('canister',[at(100)]);const p={...O};r.held=true;for(let i=0;i<30;i++){p.x+=4;tickRanger(r,c,s,p,{x:p.x+200,y:1400},[],1/30,{x:1,y:0});}assert(r.pools.filter(q=>q.trail).length>=2,'toxic trail while moving');}
 {const {s,r,c}=mk('barrel',[at(160),at(330)]);const p={...O};r.held=true;let hits=new Set();
  for(const aimX of [1960,2130,1960]){r.fireT=0;for(let i=0;i<3;i++)for(const e of tickRanger(r,c,s,p,{x:aimX,y:1400},[],1/30,{x:0,y:0}))if(e.type==='hit')hits.add(e.targetId);r.held=true;}
  for(let i=0;i<20;i++)for(const e of tickRanger(r,c,s,p,{x:1960,y:1400},[],1/30,{x:0,y:0}))if(e.type==='hit')hits.add(e.targetId);r.held=false;for(let i=0;i<20;i++)for(const e of tickRanger(r,c,s,p,null,[],1/30,{x:0,y:0}))if(e.type==='hit')hits.add(e.targetId);
  assert(hits.size===2,'lit barrel chains to the second barrel: '+[...hits]);assert(r.pools.some(q=>q.kind==='sludge'),'blast leaves sludge');}}
console.log('ranger smoke ok');
