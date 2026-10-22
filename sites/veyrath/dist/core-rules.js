// October 18 redesign. These are prototype tuning inputs, not final balance.
export const CORE={characterGrowth:.03,qualityGrowth:.08,
 caps:{speed:2.5,burstSpeed:3.5,crit:.6,burstCrit:.75,critDamage:2.5,cooldown:.4,burstCooldown:.5,cost:.4,refund:.3,move:.4,reduction:.65,burstReduction:.8},
 resource:{sword:8,ranger:10,maxRateMultiplier:1.5},selfHealPerSecond:.06};
/* Oct 18 (user, regrouped by subclass): first entry = path starter. 12 (Bow) removed; 22 Daggers, 23 Potion Satchel, 24 Bomb Bag, 25 Toxic Canister, 26 Sludge Barrel, 27 Rifle, 28 Flamethrower. */
export const RANGER_FAMILIES={archer:[14,13,16,19],alchemist:[23,24,25,26],ninja:[15,17,22,21],gunslinger:[18,27,20,28]};
/* Oct 18 (user): Warrior weapons locked by subclass too. Berserker Longsword / Twin Blades / Throwing Axe / Maul; Vanguard Greatsword / Warhammer /
   Greataxe / Spear and Shield; Spellblade Runeblade / Runed Gauntlets / Elemental Katana / Enchanted Spear; Warlord War Standard / Great Lance / Chain Axe / Royal Glaive. */
export const WARRIOR_FAMILIES={berserker:[0,2,3,29],vanguard:[1,11,30,31],spellblade:[32,33,34,35],warlord:[36,37,38,39]};
/* Oct 18 (user): Mage weapons locked by subclass. Pyromancer Flame Staff / Ember Beads / Sun Disc / Flame Gauntlets; Cryomancer Ice Staff / Wand /
   Snow Globe / Freeze Gauntlets; Stormcaller Storm Staff / Lightning Rod / Thunder Drum / Tesla Scepter; Blood Mage Blood Orb / Sacrificial Book /
   Crimson Lantern / Cursed Skull. */
export const MAGE_FAMILIES={pyro:[5,42,43,44],cryo:[40,6,45,46],storm:[41,47,48,49],blood:[50,51,52,53]};
export const PATH_FAMILIES={...RANGER_FAMILIES,...WARRIOR_FAMILIES,...MAGE_FAMILIES};
export const PATH_CLASS=Object.fromEntries([...Object.keys(RANGER_FAMILIES).map(p=>[p,'ranger']),...Object.keys(WARRIOR_FAMILIES).map(p=>[p,'sword']),...Object.keys(MAGE_FAMILIES).map(p=>[p,'mage'])]);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function weaponPower(w,level=1,mode='normal'){
 const L=Math.max(1,Number(level)||1),normalization=.4+.6*clamp((L-1)/19,0,1),effective=L;
 // One character curve; discovery ceilings remain archived save data, never a second growth multiplier.
 return {effective,normalization,character:1+CORE.characterGrowth*(L-1),power:(1+(w.base-1)*normalization)*(1+CORE.qualityGrowth*w.quality*normalization)};
}
export function outputAmount(amount,w={},scope='ability',options={}){
 if(options.basis==='final')return amount;
 if(options.basis==='preDefense')return amount;
 const a=w.output??{},bonus=(scope==='attack'||scope==='ability'?a.damage??0:0)+(a[scope]??0)+(options.element?a[options.element]??0:0);
 return amount*(w.character??1)*(w.power??1)*(1+bonus)*(scope==='attack'?w.mods?.damage??1:1);
}
const actors=new WeakMap();
export function actor(c){let a=actors.get(c);if(!a){a={time:0,serial:0,actions:new Map(),credits:[],heals:[]};actors.set(c,a);}return a;}
export function advanceActor(c,dt){const a=actor(c);a.time+=dt;for(const [id,v]of a.actions)if(a.time-v.start>30)a.actions.delete(id);a.credits=a.credits.filter(v=>a.time-v.time<3-1e-6);a.heals=a.heals.filter(v=>a.time-v.time<1);}
export function beginAction(c,duration,weapon=c.weapon,kind='attack'){
 const a=actor(c),id=String(c.ownerId??'local')+':'+(++a.serial),v={id,start:a.time,duration:Math.max(.01,duration),weapon,kind,credit:0,targets:new Map()};a.actions.set(id,v);if(kind==='attack')a.readyAt=Math.max(a.readyAt??0,a.time+v.duration);return v;
}
export function resourceCredit(c,id,classId,secondary=false){
 if(secondary||!id)return 0;const a=actor(c),v=a.actions.get(id);if(!v)return 0;
 const rate=CORE.resource[classId]??0,budget=rate*v.duration*Math.min(CORE.resource.maxRateMultiplier,v.weapon?.speed??1),spent=a.credits.reduce((n,v)=>n+v.value,0);
 // The first successful contact funds the cycle once; attack recovery and the owner rate window prevent cancellation farming.
 const matured=budget,value=Math.max(0,Math.min(matured-v.credit,rate*CORE.resource.maxRateMultiplier*3-spent));
 v.credit+=value;if(value)a.credits.push({time:a.time,value});return value;
}
export function boundedHeal(c,s,amount,{ally=false}={}){const a=actor(c),budget=s.maxHp*CORE.selfHealPerSecond,paid=ally?amount:Math.min(amount,Math.max(0,budget-a.heals.reduce((n,v)=>n+v.value,0))),actual=Math.max(0,Math.min(paid,s.maxHp-s.hp));s.hp+=actual;if(!ally&&actual)a.heals.push({time:a.time,value:actual});return actual;}
export function grantBarrier(s,amount,duration){if(amount<=(s.barrier??0))return false;s.barrier=amount;s.barrierTime=duration;return true;}
export function damageReduction(values,burst=false){return Math.min(burst?CORE.caps.burstReduction:CORE.caps.reduction,1-values.reduce((remaining,v)=>remaining*(1-clamp(v??0,0,1)),1));}
export function refundCast(cast,requested){const n=Math.max(0,Math.min(requested,(cast.paid??0)*CORE.caps.refund-(cast.refunded??0)));cast.refunded=(cast.refunded??0)+n;return n;}

export const attackReady=c=>actor(c).time>=(actor(c).readyAt??0)-1e-6;

// Exceptional windows belong to the recipient/category, so source rotation cannot renew them.
export function boundedBurst(c,category,requested,ordinary,maximum,duration=4,recovery=8){const a=actor(c);a.bursts??={};let b=a.bursts[category];if(requested<=ordinary)return requested;if(!b||a.time>=b.ready){b=a.bursts[category]={until:a.time+duration,ready:a.time+duration+recovery};}return Math.min(requested,a.time<b.until?maximum:ordinary);}
export function grantSourceBuff(store,source,bonus,duration){const old=store[source];if(old&&old.remaining>0&&old.bonus>bonus)return false;store[source]={bonus,remaining:duration};return true;}
export function tickSourceBuffs(store,dt){let strongest=0;for(const [id,b]of Object.entries(store)){b.remaining=Math.max(0,b.remaining-dt);if(!b.remaining)delete store[id];else strongest=Math.max(strongest,b.bonus);}return strongest;}
export const allyEmpowerment=(base,weapon,strength=0)=>base*(weapon?.power??1)*(1+strength);
