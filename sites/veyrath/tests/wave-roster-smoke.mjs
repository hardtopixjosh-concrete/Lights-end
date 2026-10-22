// Oct 18: wave roster smoke. Schedule shape, one variant per category per run, every one of the 17 wave types
// fights a strafing player without throwing and uses its mechanic, elites map 6 powers to 6 models.
import assert from 'node:assert';
const V='?v=fx-230';
const {createCombat}=await import('../dist/combat.js'+V);
const {createSurvival,tickSurvival,spawn}=await import('../dist/survival.js'+V);
const {createRewards,summonElite}=await import('../dist/rewards.js'+V);
const {tickElitePowers,ELITE_MODIFIERS}=await import('../dist/elite-powers.js'+V);
const {WAVE_TYPES,WAVE_SCHEDULE,waveWeights,ELITE_MODELS}=await import('../dist/wave-roster.js'+V);
const {makeWaveEnemy}=await import('../dist/wave-mechanics.js'+V);
const {WORLD}=await import('../dist/simulation.js'+V);
WORLD.width=6400;WORLD.height=4800;
const view={width:1600,height:900,zoom:1};
// Schedule: nothing before its start, ramps after, older ones fade to the floor.
for(const [i,w] of WAVE_SCHEDULE.entries()){if(w.start>0)assert.equal(waveWeights(w.start-1)[i],0,w.cat+' early');assert(waveWeights(w.start+200)[i]>.9,w.cat+' peak');}
assert(waveWeights(1500)[0]<=.21&&waveWeights(1500)[4]===1,'late mix');
// Spawned mix per run uses only the rolled variant of each category.
{const c=createCombat(),s=createSurvival(c);createRewards(s,c);const p={x:3200,y:2400,row:2};const seen={};
 for(const t of [60,400,700,1000,1300,1700]){s.clock=t;c.targets.length=0;for(let i=0;i<200;i++){const e=spawn(s,c,p,[],view);if(e){seen[e.waveCat]??=new Set();seen[e.waveCat].add(e.waveType);e.state='dead';}}}
 for(const cat in WAVE_TYPES){assert(seen[cat],'category never spawned: '+cat);assert.equal(seen[cat].size,1,'more than one variant of '+cat);assert.equal([...seen[cat]][0],s.roster[cat]);}
 console.log('roster',JSON.stringify(s.roster),'spawned',Object.fromEntries(Object.entries(seen).map(([k,v])=>[k,[...v][0]])));}
// Every type fights.
for(const cat in WAVE_TYPES)for(const type of WAVE_TYPES[cat]){
 const c=createCombat(),s=createSurvival(c),r=createRewards(s,c);c.hazards=r.hazards;s.noSpawn=true;s.clock=600;c.targets.length=0;
 const p={x:3200,y:2400,row:2};const e=makeWaveEnemy(s,cat,type,3200,2150);c.targets.push(e);
 let hits=0,haz=0,shots=0,charges=0,swings=0,maxCombo=0,maxFrenzy=0;
 for(let i=0;i<30*40;i++){const a=cat==='ranged'?0:i/30*.6;p.x=3200+Math.cos(a)*140;p.y=2400+Math.sin(a)*90;p.invulnerable=0;s.grace=0;
  const hp0=s.hp;tickSurvival(s,c,p,[],view,1/30);tickElitePowers(r,s,c,p,[],1/30);if(s.hp<hp0)hits++;s.hp=s.maxHp;s.dead=false;
  haz=Math.max(haz,r.hazards.length);shots=Math.max(shots,c.enemyProjectiles?.length??0);if(e.charge?.stage==='go')charges++;if(e.swing&&e.swing.elapsed<1/29)swings++;
  maxCombo=Math.max(maxCombo,(e.combo??1)-(e.comboLeft??0));maxFrenzy=Math.max(maxFrenzy,e.frenzyStacks??0);
  if(i%300===150){e.x=p.x+(cat==='ranged'?330:220);e.y=p.y;}}
 assert(hits>0,type.id+' never hurt the player');
 if(type.mech==='pound'||type.shot==='lob')assert(haz>0,type.id+' no hazard');
 if(type.shot==='fan')assert(shots>=3,type.id+' no fan');
 if(type.charge)assert(charges>0,type.id+' never charged');
 if(type.combo)assert(maxCombo>=3,type.id+' no combo');
 if(type.frenzy)assert(maxFrenzy>=3,type.id+' no frenzy');
 console.log(cat.padEnd(6),type.id.padEnd(12),'hits',hits,'swings',swings,'haz',haz,'shots',shots,'charge',charges,'hp',e.maxHp);
}
// Elites: the bag hands out all six powers, each on its own model.
{const c=createCombat(),s=createSurvival(c),r=createRewards(s,c);const p={x:3200,y:2400,row:2};const got=new Map();
 for(let i=0;i<6;i++){c.targets.length=0;s.clock=100+i;const l=summonElite(r,s,c,p,[],view);assert(l,'no elite');got.set(l.modifier,l.skin);assert.equal(l.waveCat,'imp');assert(!l.shot&&!l.mech);}
 assert.equal(got.size,6);assert.equal(ELITE_MODIFIERS.length,6);for(const [m,skin] of got)assert.equal(skin,ELITE_MODELS[m]);assert.equal(new Set(got.values()).size,6);
 console.log('elites',JSON.stringify(Object.fromEntries(got)));}
console.log('wave roster smoke passed');
