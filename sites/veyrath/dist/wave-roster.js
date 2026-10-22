// Oct 18 (user): monster waves. Each run rolls ONE variant per category (imp, tank, ranged, fast, attack-speed);
// categories start at set times (imp 0:00, tank 5:00, ranged 10:00, fast 15:00, attack-speed 20:00), ramp up to a
// peak a little later, while the older categories phase out to a floor. Elites (6 models = 6 powers) roll throughout.
// Numbers (ramp, fade, floor, caps, stats) are playtest seeds, not approved balance.
export const WAVE_SCHEDULE=[{cat:'imp',start:0},{cat:'tank',start:300},{cat:'ranged',start:600},{cat:'fast',start:900},{cat:'speed',start:1200}];
export const WAVE_TUNING={ramp:150,entry:.15,fade:300,floor:.2,caps:{tank:[8,12],ranged:[4,7]}};
// Models (Oct 18, user's annotated contact sheet; list order = the user's numbers): imps Imp 5/9/3/1; tanks Spawn 13/12/4, Beast 3;
// ranged Spawn 10/8/11/7; attack-speed Beast 1/2, Spawn 5; fast Spawn 3/9; elites Elite 1-6.
// base: AI role reused by survival.js; hp: enemyHealth tier; mech: extra behaviour (enemy-ranged.js / wave-mechanics.js).
export const WAVE_TYPES={
 imp:[
  {id:'imp1',skin:'dm-imp5',name:'Dune Imp'},{id:'imp2',skin:'dm-imp9',name:'Dune Imp'},
  {id:'imp3',skin:'demon-imp3',name:'Dune Imp'},{id:'imp4',skin:'imp',name:'Dune Imp'}],
 tank:[
  {id:'brute',skin:'dm-spawn13',name:'Ashbound Brute',base:'bruiser',hp:'medium',scale:1.9,xp:40,attackDamage:30,bodyHalfWidth:24,bodyHeight:72},
  {id:'guardian',skin:'dm-spawn12',name:'Bastion Guardian',base:'guardian',hp:'heavy',hpMul:1.2,scale:2,xp:55},
  {id:'behemoth',skin:'demon-melee',name:'Sand Behemoth',base:'bruiser',mech:'pound',hp:'heavy',scale:2,speed:44,xp:55,attackDamage:30,radius:20,bodyHalfWidth:28,bodyHeight:80,pound:{range:115,radius:125,warning:.9,damage:32,cd:4.5}},
  {id:'juggernaut',skin:'dm-beast3',name:'Horned Juggernaut',base:'charger',hp:'heavy',scale:1.9,speed:48,xp:55,attackDamage:30,radius:20,bodyHalfWidth:28,bodyHeight:80,charge:{wind:1,speed:560,max:420,damage:34,rest:1.3,cd:[4.5,6],min:110,range:360}}],
 ranged:[
  {id:'hexer',skin:'dm-spawn10',name:'Ash Archer',shot:'bolt',scale:1.55,xp:25,attackDamage:10},
  {id:'lobber',skin:'demon-caster',name:'Cinder Lobber',shot:'lob',scale:1.55,xp:25,attackDamage:16},
  {id:'fanner',skin:'dm-spawn11',name:'Void Fanner',shot:'fan',scale:1.55,xp:25,attackDamage:8},
  {id:'sniper',skin:'dm-spawn7',name:'Shade Sniper',shot:'snipe',scale:1.55,xp:25,attackDamage:22}],
 fast:[
  {id:'runner',skin:'dm-spawn3',name:'Dune Runner',base:'swarmer',hp:'swarmer',hpMul:.75,speed:150,scale:1.4,xp:15,attackDamage:10},
  {id:'pouncer',skin:'dm-spawn9',name:'Sand Pouncer',base:'charger',hp:'swarmer',speed:118,scale:1.4,xp:18,attackDamage:12,charge:{wind:.45,speed:620,max:300,damage:16,rest:.5,cd:[2.6,3.4],min:100,range:270,lane:30}}],
 speed:[
  {id:'clawfiend',skin:'dm-beast1',name:'Claw Fiend',base:'swarmer',hp:'standard',scale:1.3,xp:28,attackDamage:8,windup:.3,recover:.6,combo:3,comboWindup:.16},
  {id:'bladedancer',skin:'dm-beast2',name:'Blade Dancer',base:'swarmer',hp:'standard',scale:1.3,xp:28,attackDamage:9,windup:.2,recover:.18},
  {id:'lancer',skin:'dm-spawn5',name:'Frenzied Lancer',base:'swarmer',hp:'standard',scale:1.5,xp:28,attackDamage:11,reach:66,windup:.42,recover:.5,frenzy:{per:.12,max:5,decay:2.5}}]
};
// User decision Oct 18: Warding dropped; each of the six elite models carries one power.
export const ELITE_MODELS={frostbound:'dm-elite1',waller:'dm-elite2',explosive:'demon-elite',vampiric:'dm-elite4',shielded:'dm-elite5',berserker:'dm-elite6'};
// Draw fallback while a lazily loaded sheet is still downloading.
export const SKIN_FALLBACK={'dm-imp5':'imp','dm-imp9':'imp','dm-spawn10':'demon-caster','dm-spawn11':'demon-caster','dm-spawn7':'demon-caster',
 'dm-spawn13':'demon-melee','dm-spawn12':'demon-melee','dm-beast3':'demon-rift','dm-beast1':'demon-rift','dm-beast2':'demon-rift','dm-spawn5':'demon-melee','dm-spawn3':'imp','dm-spawn9':'imp',
 'dm-elite1':'demon-elite','dm-elite2':'demon-elite','dm-elite4':'demon-elite','dm-elite5':'demon-elite','dm-elite6':'demon-elite'};
const pick=(list,rng)=>list[Math.min(list.length-1,Math.floor(rng()*list.length))];
export function rollRoster(rng=Math.random){const out={};for(const cat in WAVE_TYPES)out[cat]=pick(WAVE_TYPES[cat],rng).id;return out;}
export const typeOf=(cat,id)=>WAVE_TYPES[cat].find(t=>t.id===id)??WAVE_TYPES[cat][0];
export function rosterSkins(roster){return Object.entries(roster).map(([cat,id])=>typeOf(cat,id).skin).concat(Object.values(ELITE_MODELS));}
export function waveWeight(i,t){
 const w=WAVE_SCHEDULE[i],next=WAVE_SCHEDULE[i+1],T=WAVE_TUNING;if(t<w.start)return 0;
 const rise=w.start===0?1:T.entry+(1-T.entry)*Math.min(1,(t-w.start)/T.ramp);
 const fade=next&&t>next.start?Math.max(T.floor,1-(t-next.start)/T.fade*(1-T.floor)):1;
 return rise*fade;
}
export function waveWeights(t){return WAVE_SCHEDULE.map((_,i)=>waveWeight(i,t));}
// Picks a category; capped categories (too many tanks / casters alive) fall through to the others.
export function waveCategory(t,alive={},rng=Math.random){
 const w=waveWeights(t).map((v,i)=>{const cat=WAVE_SCHEDULE[i].cat,cap=WAVE_TUNING.caps[cat];return cap&&(alive[cat]??0)>=(t>=900?cap[1]:cap[0])?0:v;});
 const sum=w.reduce((a,b)=>a+b,0);if(!sum)return 'imp';let r=rng()*sum;for(let i=0;i<w.length;i++){if(r<w[i])return WAVE_SCHEDULE[i].cat;r-=w[i];}return 'imp';
}
// Elites: random gap through the whole run; a shuffled bag so every one of the six shows up before repeats.
export const ELITE_GAP=[60,120];
export function nextEliteGap(rng=Math.random){return ELITE_GAP[0]+rng()*(ELITE_GAP[1]-ELITE_GAP[0]);}
export function eliteBag(rng=Math.random){const b=Object.keys(ELITE_MODELS);for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
