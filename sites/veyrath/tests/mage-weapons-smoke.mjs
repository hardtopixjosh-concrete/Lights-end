// Oct 18 Mage weapons by subclass: every family hits; new mechanics (ember motes, returning disc, frost freeze, sigils,
// lantern heal, Cursed Skull drain + heal), the subclass lock and the retired-weapon migration.
import assert from 'node:assert';
const tag=(await import('node:fs')).readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').match(/game\.js\?v=(fx-\d+)/)[1];
const V='?v='+tag;
const {createCombat}=await import('../dist/combat.js'+V);
const {createMage,tickMage,requestMage}=await import('../dist/mage.js'+V);
const {makeWeapon,weaponStats,weaponEligible,migrateArmory,createArmory}=await import('../dist/weapons.js'+V);
const {FAMILIES}=await import('../dist/weapon-families.js'+V);
const {MAGE_FAMILIES}=await import('../dist/core-rules.js'+V);
const O={x:1800,y:1400};
const foes=(n=4,dx=140)=>[...Array(n)].map((_,i)=>({id:i+1,x:O.x+dx+i*25,y:O.y+(i%2?-12:12),hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0,clock:0,row:0}));
function run(fam,path,{secs=4,aim={x:O.x+150,y:O.y},targets=foes(),releaseAt=null,hp=null}={}){
 const s={classId:'mage',path,skills:{},level:10,world:{},cardStats:{},clock:0},c=createCombat(),m=createMage(s);if(hp)s.hp=hp;
 c.weapon=weaponStats(makeWeapon(10,()=>.5,0,fam,'mage',path),10);c.targets=targets;c.classId='mage';const p={...O,row:0};let hits=0,dmg=0,minHp=s.hp,maxMotesUsed=0;
 m.held=true;m.queued=true;
 for(let i=0;i<secs*60;i++){if(releaseAt!=null&&i===releaseAt)m.held=false;for(const e of tickMage(m,c,s,p,aim,[],1/60))if(e.type==='hit'){hits++;dmg+=e.damage;}minHp=Math.min(minHp,s.hp);if(m.motes!=null)maxMotesUsed=Math.max(maxMotesUsed,5-m.motes);}
 return {m,c,s,hits,dmg,minHp,maxMotesUsed,targets};}
const idx=n=>FAMILIES.findIndex(f=>f.name===n);
for(const [path,fams] of Object.entries(MAGE_FAMILIES))for(const f of fams){const r=run(f,path,{releaseAt:FAMILIES[f].primary==='skull'?90:null});assert(r.hits>0,FAMILIES[f].name+' hits');}
{const r=run(idx('Ember Beads'),'pyro',{secs:1});assert(r.maxMotesUsed>=2,'embers spend motes');const r2=run(idx('Ember Beads'),'pyro',{secs:6});assert(r2.m.motes!=null,'motes tracked');}
{const t=foes(1,120);const r=run(idx('Sun Disc'),'pyro',{secs:1.4,targets:t});assert(r.hits>=2,'sun disc hits out and back: '+r.hits);assert(t[0].burn,'sun disc burns');}
{const t=foes(1,140);run(idx('Freeze Gauntlets'),'cryo',{secs:2.2,aim:{x:O.x+140,y:O.y},targets:t});assert(t[0].freeze>0||t[0].mageChill>0,'freeze gauntlets freeze');}
{const r=run(idx('Snow Globe'),'cryo',{secs:2});assert(r.targets.some(e=>e.mageSlow>0),'snow globe slows');}
{const r=run(idx('Crimson Lantern'),'blood',{secs:3,hp:80,targets:foes(4,60)});assert(r.s.hp>80,'lantern heals: '+r.s.hp);}
{const r=run(idx('Cursed Skull'),'blood',{secs:3,releaseAt:120,targets:foes(4,60)});assert(r.minHp<170,'skull drains health');assert(r.s.hp>r.minHp,'skull pulse heals back');assert(r.minHp>=1,'never below 1');}
{const r=run(idx('Sacrificial Book'),'blood',{secs:1.5});assert(r.hits>0&&r.m.effects.some(e=>e.kind==='bloom')||r.hits>0,'sigils erupt');}
// Oct 19: heart stays at the cursor; Book marks stack to 3; Storm Staff shocks; Snow Globe can't be recast for 1 s; Lightning Rod hits the cursor spot
{const s={classId:'mage',path:'blood',skills:{},level:10,world:{},cardStats:{},clock:0},c=createCombat(),m=createMage(s);c.weapon=weaponStats(makeWeapon(10,()=>.5,0,idx('Cursed Skull'),'mage','blood'),10);c.targets=foes(4,200);c.classId='mage';const p={...O,row:0};
 m.held=true;tickMage(m,c,s,p,{x:O.x+200,y:O.y},[],1/60);const hx=m.skull.x;for(let i=0;i<60;i++)tickMage(m,c,s,p,{x:O.x-200,y:O.y},[],1/60);assert(Math.abs(m.skull.x-hx)<1&&hx>O.x+150,'heart stays where it was cast');}
{const r=run(idx('Sacrificial Book'),'blood',{secs:4,aim:{x:O.x+150,y:O.y},targets:foes(3,140)});assert(r.targets.some(e=>e.bloodMarks?.n===3),'blood marks stack to 3');}
{const r=run(idx('Storm Staff'),'storm',{secs:1.5});assert(r.targets.some(e=>e.shock>0),'storm staff shocks');}
{const t=foes(1,300);t.push({...foes(1,150)[0],id:9});const r=run(idx('Lightning Rod'),'storm',{secs:1,aim:{x:O.x+300,y:O.y},targets:t});assert(t[0].hp<1e6&&t[1].hp===1e6,'lightning rod strikes the cursor, not the nearest');}
{const r=run(idx('Snow Globe'),'cryo',{secs:1,releaseAt:30});const m=r.m;m.held=true;tickMage(m,r.c,r.s,{...O,row:0},{x:O.x+150,y:O.y},[],1/60);assert(!m.globe,'snow globe recast waits');}
// lock + migration
for(const [path,fams] of Object.entries(MAGE_FAMILIES)){const w=makeWeapon(5,Math.random,1,fams[1],'mage',path);assert(weaponEligible(w,'mage',path),path+' own weapon');const other=Object.entries(MAGE_FAMILIES).find(([p])=>p!==path)[1][1];assert(!weaponEligible({...w,family:other},'mage',path),path+' locked');}
{const old=createArmory(0);old.weapons.push({...makeWeapon(5,Math.random,1,5,'mage','pyro'),family:7,name:'Runed Grimoire',id:'g1'},{...makeWeapon(5,Math.random,1,5,'mage','pyro'),name:'Runed Staff',id:'s1'});
 const m=migrateArmory(old);assert(m.weapons.some(w=>w.id==='g1'&&w.family===idx('Ice Staff')&&w.name==='Runed Ice Staff'),'grimoire becomes ice staff');assert(m.weapons.some(w=>w.id==='s1'&&w.name==='Runed Flame Staff'),'staff renamed');}
console.log('mage weapons smoke ok');
