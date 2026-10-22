// Oct 17: False Apparitions copies are briefly unhittable when they appear, then die to any hit.
import assert from 'node:assert';
const V='?v=fx-156';
const {createCombat,damageEnemy}=await import('../dist/combat.js'+V);const {createSurvival}=await import('../dist/survival.js'+V);
const {createRewards}=await import('../dist/rewards.js'+V);const {makeBoss,tickBosses}=await import('../dist/bosses.js'+V);
const {tickElitePowers}=await import('../dist/elite-powers.js'+V);
const {WORLD}=await import('../dist/simulation.js'+V);WORLD.width=6400;WORLD.height=4800;
const c=createCombat(),s=createSurvival(c),r=createRewards(s,c);c.hazards=r.hazards;s.godMode=true;c.targets.length=0;
const p={x:3200,y:2400,row:2},b=makeBoss(s,c,3500,2300,'prophet');b.emerge=0;b.chainNext='apparitions';b.specialCD=0;b.cooldown=0;
tickBosses(s,c,p,[],1/30);const copies=c.targets.filter(t=>t.apparition);assert.equal(copies.length,2);
damageEnemy(c,copies[0],999,p);assert.equal(copies[0].state,'alive','guarded right after spawning');
for(let i=0;i<15;i++)tickBosses(s,c,p,[],1/30);damageEnemy(c,copies[0],10,p);assert(copies[0].hp<=0,'dies to a hit after .5 s');
// Walks toward you when not casting
for(const k of c.targets)if(k.apparition){k.state='dead';}b.special=null;b.swing=null;b.chainNext=null;b.specialCD=99;b.cooldown=99;b.x=3800;b.y=2400;const d0=Math.hypot(b.x-p.x,b.y-p.y);
for(let i=0;i<60;i++)tickBosses(s,c,p,[],1/30);assert(Math.hypot(b.x-p.x,b.y-p.y)<d0-20,'prophet approaches');
// Delayed Echo leaves a Soul Mire that slows attacks while you stand in it
c.hazards.length=0;b.specialCD=0;b.cooldown=0;b.chainNext='echo';b.x=3500;let mire=null;
for(let i=0;i<90&&!mire;i++){tickBosses(s,c,p,[],1/30);tickElitePowers(r,s,c,p,[],1/30);mire=c.hazards.find(h=>h.kind==='soulmire');}
if(!mire)console.log('dbg',b.special?.kind,b.specialCD,b.cooldown,b.chainNext,Math.round(Math.hypot(b.x-p.x,b.y-p.y)),c.hazards.map(h=>h.kind+(h.echo?'E':'')+h.age.toFixed(2)).join(' '));assert(mire,'echo left a soul mire');p.x=mire.x;p.y=mire.y;tickElitePowers(r,s,c,p,[],1/30);assert.equal(s.fieldAtkSlow,.35);
p.x+=400;tickElitePowers(r,s,c,p,[],1/30);assert.equal(s.fieldAtkSlow,0);
// Rolling through the Soul Cage takes no damage
c.hazards.length=0;b.special=null;b.swing=null;b.chainNext='cage';b.specialCD=0;b.cooldown=0;s.godMode=false;s.hp=s.maxHp;p.x=3200;p.y=2400;tickBosses(s,c,p,[],1/30);
const g=b.special.cage,q=g.pillars[(g.gap+4)%g.pillars.length],q2=g.pillars[(g.gap+5)%g.pillars.length];p.x=(q.x+q2.x)/2;p.y=(q.y+q2.y)/2;p.rollT=1;
for(let i=0;i<70;i++){tickBosses(s,c,p,[],1/30);p.rollT=1;}assert.equal(s.hp,s.maxHp,'no cage damage while rolling');
console.log('prophet clone smoke ok');
