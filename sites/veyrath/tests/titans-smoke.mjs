// Oct 17: Obsidian Colossus + Dune Wyrm kit smoke: run each boss against a strafing player through every phase,
// checking every special starts and ends, armour breaks fire once, and nothing throws.
import assert from 'node:assert';
const V='?v=fx-143';
const {createCombat}=await import('../dist/combat.js'+V);
const {createSurvival,tickSurvival}=await import('../dist/survival.js'+V);
const {createRewards}=await import('../dist/rewards.js'+V);
const {makeBoss,tickBosses}=await import('../dist/bosses.js'+V);
const {tickElitePowers}=await import('../dist/elite-powers.js'+V);
const {tickBossFx,BFX}=await import('../dist/boss-fx.js'+V);let peak=0;
const {WORLD}=await import('../dist/simulation.js'+V);
WORLD.width=6400;WORLD.height=4800;
function run(kind,setup){
 const c=createCombat(),s=createSurvival(c);const r=createRewards(s,c);c.hazards=r.hazards;s.godMode=true;s.noSpawn=true;s.clock=1400;
 c.targets.length=0;const p={x:3200,y:2400,row:2};const b=makeBoss(s,c,3200,2100,kind);b.emerge=0;setup?.(b);
 const seen={},phases=[];let peak=0;let t=0,hits=0,last=null;
 for(let i=0;i<30*240;i++){t+=1/30;const a=t*.7;p.x=3200+Math.cos(a)*260;p.y=2300+Math.sin(a)*180;p.invulnerable=0;
  const hp0=s.hp;tickSurvival(s,c,p,[],{width:1600,height:900,zoom:1},1/30);tickElitePowers(r,s,c,p,[],1/30);tickBosses(s,c,p,[],1/30);tickBossFx(c,1/30);if(s.hp<hp0)hits++;s.hp=s.maxHp;
  if(i%300===150&&!b.special){b.x=p.x+520;b.y=p.y;}  // force some long-range picks
  peak=Math.max(peak,BFX.efx.length);
  const k=b.special?.kind;if(k&&k!==last)seen[k]=(seen[k]??0)+1;last=k;
  if(k&&b.special.elapsed>12)throw new Error(kind+' special stuck: '+k);
  if(i%600===599&&b.hp>b.maxHp*.12){b.hp-=b.maxHp*.12;if(b.armorHp>0)b.armorHp=Math.max(0,b.armorHp-b.armorMax*.5);}
  const ph=kind==='colossus'?b.stage:b.armorBroken?1:0;if(phases.at(-1)!==ph)phases.push(ph);}
 console.log(kind,'peakFx',peak,JSON.stringify(seen),'phases',phases.join('>'),'hits',hits,'hp',Math.round(b.hp/b.maxHp*100)+'%');
 return {seen,phases,b};
}
const col=run('colossus');
for(const k of ['pursuit','hurl','fault','stomp','overload','shed'])assert(col.seen[k],'colossus used '+k);
assert.deepEqual(col.phases,[0,1,2]);assert.equal(col.seen.shed,2);assert.equal(col.b.exposedMul,1.5);assert.equal(col.b.armored,false);
const wy=run('wyrm',b=>{b.home={x:3200,y:2300};b.homeR=700;b.pit='test';});
for(const k of ['breath','burrow','tail','charge','claws','spit','shed'])assert(wy.seen[k],'wyrm used '+k);
assert.deepEqual(wy.phases,[0,1]);assert(wy.b.phase2);
for(const k of ['prophet','butcher']){const r=run(k);assert(Object.keys(r.seen).length>=4,k+' specials');}
assert(BFX.efx.length>0,'boss particles spawned');console.log('particles',BFX.efx.length,'lights',BFX.lights.length);
console.log('titans smoke ok');
