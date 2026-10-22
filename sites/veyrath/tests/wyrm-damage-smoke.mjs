// Oct 17: the Dune Wyrm must take damage (armour bar first, then health) through a whole fight.
import assert from 'node:assert';
const V='?v=fx-156';
const {createCombat,damageEnemy}=await import('../dist/combat.js'+V);
const {createSurvival}=await import('../dist/survival.js'+V);
const {createRewards}=await import('../dist/rewards.js'+V);
const {makeBoss,tickBosses}=await import('../dist/bosses.js'+V);
const {tickElitePowers}=await import('../dist/elite-powers.js'+V);
const {WORLD}=await import('../dist/simulation.js'+V);
WORLD.width=6400;WORLD.height=4800;
const c=createCombat(),s=createSurvival(c),r=createRewards(s,c);c.hazards=r.hazards;s.godMode=true;c.targets.length=0;
const p={x:3200,y:2400,row:2},b=makeBoss(s,c,3200,2150,'wyrm');b.emerge=0;b.home={x:3200,y:2300};b.homeR=700;b.pit='t';
let blocked=0,hits=0;const log=[];
for(let i=0;i<30*120;i++){const t=i/30;p.x=3200+Math.cos(t*.7)*240;p.y=2300+Math.sin(t*.7)*160;
 tickElitePowers(r,s,c,p,[],1/30);tickBosses(s,c,p,[],1/30);s.hp=s.maxHp;
 if(i%6===0){const a=b.armorHp,h=b.hp;damageEnemy(c,b,400,{x:p.x,y:p.y});hits++;if(a===b.armorHp&&h===b.hp){blocked++;if(log.length<8)log.push(`${t.toFixed(1)}s ${b.special?.kind??'-'} inv=${b.invulnerable} hidden=${b.hidden} emerge=${b.emerge}`);}}}
console.log('hits',hits,'blocked',blocked,'armor',Math.round(b.armorHp),'hp',Math.round(b.hp),'/',b.maxHp,log);
assert(b.armorBroken&&b.hp<b.maxHp,'wyrm took damage');
console.log('wyrm damage smoke ok');
// Projectile contact along the whole body: head (~200 ahead), tail (~220 behind), and a clear miss off to the side.
const {bodyHit}=await import('../dist/combat.js'+V);const w=makeBoss(s,c,1000,1000,'wyrm');w.face=0;
assert(bodyHit(w,1200,980)&&bodyHit(w,780,990),'head and tail are hittable');assert(!bodyHit(w,1000,1250),'no hit far below');
console.log('wyrm capsule ok');
