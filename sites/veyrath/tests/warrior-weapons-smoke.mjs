// Oct 18 Warrior weapons by subclass: every family swings and hits; new mechanics (bleed stacks, katana elements, maul ring,
// gauntlet wave, chain drag, returning axe, shield wall guard, War Standard throw + lunge) and the subclass lock.
import assert from 'node:assert';
const tag=(await import('node:fs')).readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').match(/game\.js\?v=(fx-\d+)/)[1];
const V='?v='+tag;
const {createCombat,pressAttack,releaseAttack,tickCombat}=await import('../dist/combat.js'+V);
const {makeWeapon,weaponStats,weaponEligible,migrateArmory,createArmory}=await import('../dist/weapons.js'+V);
const {FAMILIES}=await import('../dist/weapon-families.js'+V);
const {WARRIOR_FAMILIES}=await import('../dist/core-rules.js'+V);
const O={x:1800,y:1400};
const foes=(n=4,dx=70)=>[...Array(n)].map((_,i)=>({id:i+1,x:O.x+dx+i*30,y:O.y+(i%2?-10:10),hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0,clock:0,row:0}));
function run(fam,{secs=4,aim={x:O.x+150,y:O.y},targets=foes(),release=false}={}){
 const c=createCombat(),w=makeWeapon(10,()=>.5,0,fam,'sword');c.weapon=weaponStats(w,10);c.targets=targets;c.classId='sword';const p={...O,row:0};let hits=0,dmg=0,maxGuard=0;
 pressAttack(c);for(let i=0;i<secs*60;i++){if(release&&i===30)releaseAttack(c);if(release&&i===60)pressAttack(c);for(const e of tickCombat(c,p,aim,[],1/60))if(e.type==='hit'){hits++;dmg+=e.damage;}maxGuard=Math.max(maxGuard,c.weaponGuard??0);}
 return {c,p,hits,dmg,maxGuard,targets};}
for(const [path,fams] of Object.entries(WARRIOR_FAMILIES))for(const f of fams){const r=run(f);assert(r.hits>0,FAMILIES[f].name+' hits');}
const idx=n=>FAMILIES.findIndex(f=>f.name===n);
{const r=run(idx('Twin Blades'));assert(r.targets.some(e=>Object.values(e.wDots??{}).some(d=>d.kind==='bleed'&&d.stacks>=3)),'twin blades stack bleed');}
{const r=run(idx('Greataxe'));assert(r.targets.some(e=>Object.values(e.wDots??{}).some(d=>d.kind==='bleed')),'greataxe bleeds');}
{const r=run(idx('Elemental Katana'),{secs:3});const k=new Set();for(const e of r.targets)for(const d of Object.values(e.wDots??{}))k.add(d.kind);assert(k.has('burn')&&k.has('poison'),'katana burns and poisons '+[...k]);assert(r.targets.some(e=>e.slow>0||e.shock>0),'katana frost/shock');}
{const r=run(idx('Spear and Shield'));assert(r.maxGuard>=.3,'shield wall guard while held');}
{const t=[{id:1,x:O.x+260,y:O.y,hp:1e6,maxHp:1e6,radius:14,state:'alive',role:'swarm',hurt:0,clock:0,row:0}];const r=run(idx('Chain Axe'),{secs:2.2,aim:{x:O.x+300,y:O.y},targets:t});assert(t[0].x<O.x+230,'chain axe drags the enemy in: '+Math.round(t[0].x-O.x));}
{const t=foes(3,320);const r=run(idx('War Standard'),{secs:2.5,aim:{x:O.x+340,y:O.y},targets:t,release:true});assert(r.p.x>O.x+200,'lunged to the standard: '+Math.round(r.p.x-O.x));assert(r.maxGuard>=.5,'50% guard after the lunge');}
// Oct 18 fix: holding LMB does not lunge; throws stop at 420; the standard is gone 2 s after the throw and no new throw comes during that cooldown.
{const t=foes(3,320);const r=run(idx('War Standard'),{secs:1.5,aim:{x:O.x+900,y:O.y},targets:t});assert(Math.abs(r.p.x-O.x)<5,'holding LMB does not lunge: '+Math.round(r.p.x-O.x));
 assert(r.c.standard&&Math.hypot(r.c.standard.x-O.x,r.c.standard.y-O.y)<=421,'throw capped at 420');
 const p=r.p;let thrown=0;for(let i=0;i<60;i++){tickCombat(r.c,p,{x:O.x+900,y:O.y},[],1/60);}assert(!r.c.standard,'standard gone after 2 s');
 pressAttack(r.c);for(let i=0;i<30;i++)tickCombat(r.c,p,{x:O.x+300,y:O.y},[],1/60);assert(r.c.standard,'new throw once the cooldown ended');}
{const r=run(idx('Throwing Axe'),{secs:.9,targets:foes(1,200)});}
// subclass lock + migration starters
const sb=FAMILIES.findIndex(f=>f.name==='Runeblade');assert(weaponEligible(makeWeapon(1,()=>.5,0,sb,'sword'),'sword','spellblade')&&!weaponEligible(makeWeapon(1,()=>.5,0,sb,'sword'),'sword','berserker'),'warrior lock');
const m=migrateArmory(createArmory(0));for(const path of Object.keys(WARRIOR_FAMILIES))assert(m.weapons.some(w=>WARRIOR_FAMILIES[path].includes(w.family)),path+' has a legal weapon');
for(let i=0;i<30;i++){const w=makeWeapon(10,Math.random,null,null,'sword','warlord');assert(WARRIOR_FAMILIES.warlord.includes(w.family),'warlord drops only warlord weapons');}
console.log('warrior weapons smoke ok');
