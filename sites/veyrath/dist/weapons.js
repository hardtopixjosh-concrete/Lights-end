import {weaponPower,RANGER_FAMILIES,PATH_FAMILIES,PATH_CLASS} from './core-rules.js?v=fx-260';
import {talentBonus} from './specializations.js?v=fx-260';
import {FAMILIES} from './weapon-families.js?v=fx-260';
import {AFFIX_MAP,eligibleAffixes,compatibleAffix,behaviorModifiers,affixKind} from './affix-data.js?v=fx-260';
import {BASE_CRIT_CHANCE,BASE_CRIT_DAMAGE} from './combat-balance.js?v=fx-260';
export {FAMILIES,affixKind};
export const RARITIES=[{name:'Common',color:'#f1f1e8',min:0,max:1,slots:0,behaviors:0,salvage:10},{name:'Magic',color:'#7db6ef',min:1,max:2,slots:1,behaviors:1,salvage:25},{name:'Rare',color:'#bd8eef',min:2,max:3,slots:2,behaviors:1,salvage:60},{name:'Legendary',color:'#e6d178',min:3,max:4,slots:3,behaviors:2,salvage:150},{name:'Mythic',color:'#ed9d58',min:4,max:5,slots:4,behaviors:2,salvage:350},{name:'Ascendant',color:'#ef666d',min:5,max:6,slots:5,behaviors:2,salvage:800}];
export const FORGE={x:1500,y:1450,radius:100};
const roll=(min,max,rng)=>min+Math.min(max-min,Math.floor(rng()*(max-min+1)));
const sample=(pool,rng)=>{let n=rng()*pool.reduce((s,a)=>s+(a.weight??1),0);return pool.find(a=>(n-=a.weight??1)<0)??pool.at(-1);};
const materialize=(def,rng)=>({id:def.id,name:def.name,kind:def.kind,value:roll(def.min,def.max,rng),unit:def.unit});
export function rollAffixes(count,rng=Math.random,locked=null,classId='sword',family=classId==='mage'?5:classId==='ranger'?12:0,cap=2){
 const result=locked?[{...locked}]:[],wanted=Math.min(cap,count-result.length,roll(0,cap,rng));
 for(const kind of ['behavior','stat'])while(result.length<count&&(kind==='stat'||result.filter(a=>affixKind(a)==='behavior').length<wanted)){
   const pool=eligibleAffixes(family,kind).filter(d=>compatibleAffix(d,result));if(!pool.length)break;result.push(materialize(sample(pool,rng),rng));
 }if(result.length!==count)throw Error('No eligible affixes available');return result;
}
let sequence=0;
export function makeWeapon(level=1,rng=Math.random,rarity=null,family=null,classId=null,path=null){
 // New reds are explicitly granted only by the realm reward adapter.
 if(rarity===null){const n=rng()*100;rarity=n<55?0:n<85?1:n<98.75?2:n<99.75?3:4;}
 const wanted=classId??(family!==null?(FAMILIES[family]?.classId??'sword'):'sword'),pool=FAMILIES.map((f,i)=>({f,i})).filter(({f,i})=>!f.removed&&(f.classId??'sword')===wanted&&(!path||PATH_CLASS[path]!==wanted||PATH_FAMILIES[path].includes(i)));
 if(family!==null&&(!FAMILIES[family]||FAMILIES[family].removed))throw Error('Weapon family removed');/* Oct 18: Halberd slot */
 if(!pool.length||!RARITIES[rarity]||family!==null&&(FAMILIES[family]?.classId??'sword')!==wanted)throw Error('Weapon family does not match class');
 if(path&&PATH_CLASS[path]===wanted&&family!==null&&!PATH_FAMILIES[path].includes(family))throw Error('Weapon is not legal for this path');
 const f=family??pool[roll(0,pool.length-1,rng)].i,r=RARITIES[rarity],count=roll(r.min,r.max,rng);
 return {schema:5,id:'w-'+Date.now().toString(36)+'-'+(++sequence)+'-'+Math.floor(rng()*1e8).toString(36),family:f,rarity,name:['Worn','Tempered','Runed','Emberforged','Sunbound','Ascendant'][rarity]+' '+FAMILIES[f].name,ceiling:Math.max(1,level+roll(1,5,rng)),base:roll(96,108,rng)/100,quality:0,rerolls:0,affixCount:count,affixes:rollAffixes(count,rng,null,wanted,f,r.behaviors),locked:null,signature:null,forgeHistory:[],favorite:false,location:'armory'};
}
export function createArmory(gold=0){const w=makeWeapon(1,()=>.4,0,0);w.name='Weathered Longsword';w.base=1;w.ceiling=1;w.affixes=[];w.affixCount=0;return {version:5,revision:0,gold,weapons:[w],equipped:w.id};}
export function validateWeapon(w){
 const r=RARITIES[w?.rarity];if(!r||!FAMILIES[w.family]||FAMILIES[w.family].removed||typeof w.id!=='string'||!Number.isFinite(w.base)||w.base<=0||!Number.isInteger(w.ceiling)||w.ceiling<1||!Number.isInteger(w.quality)||w.quality<0||w.quality>5||!Number.isInteger(w.rerolls??0)||(w.rerolls??0)<0||!Array.isArray(w.affixes)||w.affixes.length<r.min||w.affixes.length>r.max||w.affixCount!==undefined&&w.affixCount!==w.affixes.length)return false;
 if(w.signature!=null)return false; // No curated signature definitions released yet; ordinary rolls cannot create one.
 if(new Set(w.affixes.map(a=>a.id)).size!==w.affixes.length||w.affixes.filter(a=>affixKind(a)==='behavior').length>r.behaviors)return false;
 return w.affixes.every(a=>{const d=AFFIX_MAP.get(a.id);return d&&Number.isFinite(a.value)&&a.value>=0&&(d.kind!=='behavior'||a.value===1)&&(!a.kind||a.kind===d.kind)&&(!d.families||d.families.includes(w.family))&&compatibleAffix(d,w.affixes.filter(b=>b!==a));})&&(!w.locked||w.affixes.some(a=>a.id===w.locked));
}
function validForgeChoice(a){
 const p=a.pendingForge;if(p==null)return true;
 const w=a.weapons.find(w=>w.id===p.weaponId);if(!w||typeof p.id!=='string'||!p.id||!Number.isInteger(p.index)||p.index<0||p.index>=w.affixes.length||!p.before||!['reforgeStat','reforgeBehavior','convert','convertStat'].includes(p.kind)||p.cost!==forgeCost(w,p.kind)||JSON.stringify(w.affixes[p.index])!==JSON.stringify(p.before)||!p.after||p.before.id===w.locked||p.before.id===p.after.id)return false;
 if(affixKind(p.before)!==(['reforgeBehavior','convertStat'].includes(p.kind)?'behavior':'stat')||affixKind(p.after)!==(['reforgeStat','convertStat'].includes(p.kind)?'stat':'behavior')||p.kind==='convert'&&w.rarity<2)return false;
 const trial={...w,affixes:w.affixes.map((aff,i)=>i===p.index?p.after:aff)};return validateWeapon(trial);
}
export function validArmory(a){return [1,2,3,4,5,6,7].includes(a?.version)&&Number.isSafeInteger(a.gold)&&a.gold>=0&&Array.isArray(a.weapons)&&a.weapons.length>0&&a.weapons.every(validateWeapon)&&new Set(a.weapons.map(w=>w.id)).size===a.weapons.length&&a.weapons.some(w=>w.id===a.equipped)&&validForgeChoice(a)&&(!a.pendingVictory||(typeof a.pendingVictory.id==='string'&&typeof a.pendingVictory.eligible==='boolean'&&Array.isArray(a.pendingVictory.offers)&&a.pendingVictory.offers.length===3&&a.pendingVictory.offers.every(w=>validateWeapon(w)&&w.rarity===4)));}
export function weaponStats(w,level,mode='normal'){
 const f=FAMILIES[w.family],power=weaponPower(w,level,mode),effective=power.effective,scale=power.normalization,aff=Object.fromEntries(w.affixes.filter(a=>affixKind(a)==='stat').map(a=>[a.id,a.value*scale])),mods=behaviorModifiers(w);
 const output={damage:(aff.damage??0)/100,attack:(aff.attack??0)/100+(aff.slam??0)/100,ability:(aff.ability??0)/100,healing:(aff.healing??0)/100,barrier:(aff.barrier??0)/100};
 return {rarity:w.rarity,effective,affixScale:scale,style:f.style??'sword',primary:f.primary??'staff',description:f.description,mods,family:w.family,power:power.power,character:power.character,output,abilityOutput:power.power*power.character*(1+output.damage+output.ability),barrierOutput:power.power*power.character*(1+output.barrier),damage:power.power*power.character*(1+output.damage+output.attack)*mods.damage,speed:Math.min(2.5,1+(aff.speed??0)/100),castSpeed:1,reach:f.reach*(1+(aff.reach??0)/100)*mods.range,arc:f.arc*mods.arc,aoe:(1+(aff.area??0)/100)*mods.area,crit:Math.min(.6,BASE_CRIT_CHANCE+(aff.crit??0)/100),critDamage:Math.min(2.5,BASE_CRIT_DAMAGE+(aff.critDamage??0)/100),elite:1+(aff.elite??0)/100,stagger:1+(aff.stagger??0)/100,projectile:1+(aff.projectile??0)/100,health:1+(aff.health??0)/100,move:1+(aff.move??0)/100,gold:1+(aff.gold??0)/100,energy:1+(aff.energy??0)/100,regen:1+(aff.regen??0)/100,delay:1-(aff.delay??0)/100,slam:1};
}
export function syncWeaponPassives(s,m,stats,fresh=false){
 const max=Math.round(((s.classId==='mage'?170:s.classId==='ranger'?200:250)+Math.max(0,s.level-1)*10)*(stats.health??1)*(1+talentBonus(s,'maxHp'))*(s.world?.maxHp??1));s.maxHp=max;s.hp=fresh?max:Math.min(s.hp,max);s.weaponPassives={move:(stats.move??1)*(1+talentBonus(s,'movement')),gold:stats.gold??1,spellRange:stats.spellRange??0};
 if(m){m.energy.max=Math.round(100*(stats.energy??1)*(1+talentBonus(s,'energyMax')));m.energy.value=fresh?m.energy.max:Math.min(m.energy.value,m.energy.max);m.energy.regen=(stats.regen??1)*(1+talentBonus(s,'energyRegen'))*(s.mods?.energyRegen??1);m.energy.delay=stats.delay??1;}
}
export const REFORGE_PRICES=[{stat:50,behavior:null},{stat:75,behavior:150},{stat:100,behavior:200},{stat:150,behavior:300},{stat:200,behavior:400},{stat:300,behavior:600}];
export function forgeCost(w,kind){const prices=REFORGE_PRICES[w.rarity];return kind==='upgrade'?([50,100,200,350,550][w.quality]??Infinity):kind==='promote'?([100,300,600,1200][w.rarity]??Infinity):kind==='lock'?250:['convert','convertStat'].includes(kind)?400:kind==='reforgeBehavior'?prices?.behavior??Infinity:['reforgeStat','reroll'].includes(kind)?prices?.stat??Infinity:0;}
export function mutateArmory(a,kind,id,options={}){
 if(kind==='resolveForge'){
   const p=a.pendingForge;if(!p)return 'No reforge choice is pending';if(!validForgeChoice(a)||options.choiceId!==p.id||id!==p.weaponId)return 'This reforge choice is no longer valid';if(!['keep','accept'].includes(options.choice))return 'Choose KEEP OLD or ACCEPT NEW';
   const target=a.weapons.find(w=>w.id===p.weaponId);if(options.choice==='accept')target.affixes[p.index]={...p.after};
   target.forgeHistory??=[];target.forgeHistory.push({action:p.kind,choice:options.choice,cost:p.cost,before:p.before,after:p.after,choiceId:p.id});delete a.pendingForge;return null;
 }
 if(a.pendingForge)return 'Choose KEEP OLD or ACCEPT NEW before another armory action';
 const w=a.weapons.find(w=>w.id===id);if(!w)return 'Weapon not found';
 if(kind==='equip'){if(options.path&&!weaponEligible(w,options.classId??weaponClass(w),options.path))return 'Weapon is not available to this path';if(options.classId&&weaponClass(w)!==options.classId)return 'Weapon is for another class';if(w.location==='pocket')return options.inRun?'Take it out of the safe pocket first':'Move it into your inventory first';if(options.inRun){if(w.location!=='run'&&a.equipped!==id)return 'During a run you can only equip weapons you carry';const old=a.weapons.find(n=>n.id===a.equipped);if(old&&old.id!==id)old.location='run';}else if(w.location==='run')return 'That weapon is not in your inventory';a.equipped=id;if(options.path&&weaponClass(w)==='ranger')(a.pathEquipped??={})[options.path]=id;if(a.classEquipped)a.classEquipped[weaponClass(w)]=id;return null;}
 if(kind==='favorite'){w.favorite=!w.favorite;return null;}
 if(kind==='pocket'){if(!options.inRun)return 'You fill the safe pocket during a run';if(a.equipped===id)return 'Your held weapon is already kept';if(w.location!=='run')return 'Only weapons in your run bag can go in the pocket';const cur=a.weapons.find(n=>n.location==='pocket');if(cur){if(!cur.pocketRun)return 'Your pocket still holds a weapon from an earlier run. Empty it from the main menu inventory.';cur.location='run';delete cur.pocketRun;}w.location='pocket';w.pocketRun=true;return null;}
 if(kind==='unpocket'){if(w.location!=='pocket')return 'That weapon is not in the safe pocket';if(!options.inRun||!w.pocketRun)return 'Move it into your inventory from the main menu';if(a.weapons.filter(n=>n.location==='run').length>=RUN_BAG)return 'Your run bag is full';w.location='run';delete w.pocketRun;return null;}
 if(kind==='stash'){if(options.inRun)return 'Empty the safe pocket from the main menu inventory';if(w.location!=='pocket')return 'That weapon is not in the safe pocket';if(a.weapons.filter(n=>n.location==='armory').length>=ARMORY_CAPACITY)return 'Armory full. Free one slot to store this item.';w.location='armory';delete w.pocketRun;return null;}
 if(kind==='salvage'){
   if(w.starterGrant)return 'Starter weapons cannot be salvaged';
   if(Object.entries(PATH_FAMILIES).some(([p,fs])=>PATH_CLASS[p]===weaponClass(w)&&fs.includes(w.family)&&!a.weapons.some(n=>n.id!==id&&fs.includes(n.family))))return 'Keep a legal weapon for each path';
   if(a.weapons.filter(n=>weaponClass(n)===weaponClass(w)).length===1)return 'Keep at least one weapon for this class';if((w.favorite||a.equipped===id)&&!options.confirmed)return 'Confirm salvaging this equipped or favorite weapon';
   a.gold+=options.away?Math.round(RARITIES[w.rarity].salvage*SALVAGE_AWAY):RARITIES[w.rarity].salvage;a.weapons=a.weapons.filter(n=>n.id!==id);const fallback=a.weapons.find(n=>weaponClass(n)===weaponClass(w));if(a.equipped===id)a.equipped=fallback.id;if(a.classEquipped?.[weaponClass(w)]===id)a.classEquipped[weaponClass(w)]=fallback.id;return null;
 }
 if(kind==='reroll')kind='reforgeStat';if(!['upgrade','promote','lock','reforgeStat','reforgeBehavior','convert','convertStat'].includes(kind))return 'Unknown forge action';
 if(kind==='upgrade'&&w.quality>=5)return 'Power is already +5';
 if(kind==='promote'){if(w.rarity>=4)return 'Orange is the highest craftable tier';if(w.affixes.length>=RARITIES[w.rarity+1].max)return 'Legacy item already fills the next tier: no gold charged';}
 const selected=w.affixes.find(a=>a.id===options.affix),index=w.affixes.indexOf(selected);let pool;
 if(kind==='lock'&&(!selected||w.locked))return 'Choose one unlocked ordinary affix';
 if(['reforgeStat','reforgeBehavior','convert','convertStat'].includes(kind)){
   if(!selected)return 'Choose an ordinary affix';if(selected.id===w.locked)return 'This affix is locked';
   if(kind==='reforgeStat'&&affixKind(selected)!=='stat'||kind==='reforgeBehavior'&&affixKind(selected)!=='behavior'||kind==='convert'&&affixKind(selected)!=='stat'||kind==='convertStat'&&affixKind(selected)!=='behavior')return 'Choose an affix of the matching type';
   if(kind==='convert'&&(w.rarity<2||w.affixes.filter(a=>affixKind(a)==='behavior').length>=RARITIES[w.rarity].behaviors))return 'Conversion requires Rare+ and an open behavior slot';
   const others=w.affixes.filter((_,i)=>i!==index),targetKind=['reforgeStat','convertStat'].includes(kind)?'stat':'behavior';pool=eligibleAffixes(w.family,targetKind).filter(d=>d.id!==selected.id&&compatibleAffix(d,others));if(!pool.length)return 'No compatible replacement affix';
 }
 const cost=forgeCost(w,kind);if(a.gold<cost)return 'Not enough gold';a.gold-=cost;const before=selected?{...selected}:null;
 if(kind==='upgrade')w.quality++;else if(kind==='promote'){const candidates=eligibleAffixes(w.family,'stat').filter(d=>compatibleAffix(d,w.affixes));if(!candidates.length)return 'No eligible added affix';w.rarity++;w.affixes.push(materialize(sample(candidates,options.rng??Math.random),options.rng??Math.random));w.affixCount=w.affixes.length;}else if(kind==='lock')w.locked=selected.id;else{
   const after=materialize(sample(pool,options.rng??Math.random),options.rng??Math.random);w.rerolls=(w.rerolls??0)+1;
   a.pendingForge={id:'forge-'+Date.now().toString(36)+'-'+(++sequence),weaponId:w.id,index,kind,cost,before,after};return null;
 }
 w.forgeHistory??=[];w.forgeHistory.push({action:kind,cost,before,after:index>=0?{...w.affixes[index]}:null});if(!validateWeapon(w))throw Error('Invalid forged weapon');return null;
}
export function transactArmory(a,kind,id,options={},persist=()=>{}){const next=JSON.parse(JSON.stringify(a));try{const error=mutateArmory(next,kind,id,options);if(error)return {error};if(!validArmory(next))return {error:'Invalid armory transaction'};next.revision=(a.revision??0)+1;persist(next);return {next};}catch{return {error:'Save failed; no gold spent or weapon changed. Reload if another tab changed your save.'};}}
export function proposeForge(a,kind,id,options={},persist=()=>{}){if(!['reforgeStat','reforgeBehavior','convert','convertStat','reroll'].includes(kind))return {error:'Choose a reforge operation'};return transactArmory(a,kind,id,options,persist);}
export function resolveForge(a,choice,choiceId,persist=()=>{}){return transactArmory(a,'resolveForge',a.pendingForge?.weaponId,{choice,choiceId},persist);}
// Oct 17 (user): run bag + safe pocket. Weapons found during a run go to the run bag (location 'run'). When a run ends
// (death, victory, abandon, restart) only the equipped weapon and the one-slot safe pocket ('pocket') are kept. The
// pocket is emptied into the global inventory from the front-end inventory ('stash'), so each run starts with it empty.
export const ARMORY_CAPACITY=50;
export const RUN_BAG=12;
// Oct 17 (user): salvaging from the Prepare Run armory (away from the forge) pays 30% less gold (user raised the cut Oct 17).
export const SALVAGE_AWAY=.7;
const globalSlot=a=>a.weapons.filter(n=>n.location==='armory').length>=ARMORY_CAPACITY?'overflow':'armory';
export function storeRunWeapon(a,w){if(!validateWeapon(w)||a.weapons.some(n=>n.id===w.id)||a.weapons.filter(n=>n.location==='run').length>=RUN_BAG)return false;w.location='run';a.weapons.push(w);return true;}
export function endRun(a,{victory=false}={}){const next=JSON.parse(JSON.stringify(a)),keep=new Set([next.equipped]);let lost=0;
 next.weapons=next.weapons.filter(w=>{if(w.location==='ground'){lost++;return false;}if(w.location!=='run')return true;if(victory||keep.has(w.id)){w.location=globalSlot(next);return true;}lost++;return false;});
 if(next.pendingForge&&!next.weapons.some(w=>w.id===next.pendingForge.weaponId)){(next.lostForgeChoices??=[]).push(next.pendingForge);delete next.pendingForge;}next.personalPickups=(next.personalPickups??[]).filter(p=>next.weapons.some(w=>w.id===p.weaponId&&w.location==='ground'));for(const w of next.weapons)delete w.pocketRun;
 for(const [cls,id]of Object.entries(next.classEquipped??{}))if(!next.weapons.some(w=>w.id===id))next.classEquipped[cls]=next.weapons.find(w=>weaponClass(w)===cls)?.id;
 return {next,lost};}
// Stable entitlement: overflow never deletes the displaced protected item.
export function pocketRealmReward(a,w,rewardId,anchor){const next=structuredClone(a);next.rewardClaims??=[];if(next.rewardClaims.includes(rewardId))return {next,duplicate:true};if(w.rarity!==5||!validateWeapon(w)||next.weapons.some(n=>n.id===w.id))return {error:'Invalid realm reward'};
 const old=next.weapons.find(n=>n.location==='pocket');if(old){delete old.pocketRun;if(next.weapons.filter(n=>n.location==='run').length<RUN_BAG)old.location='run';else{old.location='ground';(next.personalPickups??=[]).push({weaponId:old.id,...anchor});}}
 next.weapons.push({...structuredClone(w),location:'pocket',pocketRun:true});next.rewardClaims.push(rewardId);return {next};}
export function prepareVictory(a,{id,level=1,classId='sword',path,rng=Math.random,eligible=true}={}){if(a.pendingVictory||a.rewardClaims?.includes(id))return structuredClone(a);const next=endRun(a,{victory:true}).next;next.pendingVictory={id,eligible,offers:Array.from({length:3},()=>makeWeapon(level,rng,4,null,classId,path))};return next;}
export function claimVictory(a,index){const next=structuredClone(a),p=next.pendingVictory;if(!p||!p.offers[index])return {error:'Choose a victory weapon'};if(!storeWeapon(next,p.offers[index]))return {error:'Reward could not be stored'};(next.rewardClaims??=[]).push(p.id);if(p.eligible)next.victoryUnlocked=true;delete next.pendingVictory;return {next};}

export function storeWeapon(a,w){if(!validateWeapon(w)||a.weapons.some(n=>n.id===w.id))return false;w.location=a.weapons.filter(n=>n.location==='armory').length>=ARMORY_CAPACITY?'overflow':'armory';a.weapons.push(w);return true;}
export function weaponDrops(s,events,drops,rng=Math.random){for(const e of events)if(e.type==='death'&&!['anchor','boss'].includes(e.role)){const chance=e.role==='leader'?.05:.0015;if(rng()<chance){const n=rng(),rarity=e.role==='leader'?(n<.8?2:3):(n<.55?0:n<.85?1:2);drops.push({x:e.x,y:e.y,clock:0,weapon:makeWeapon(s.level,rng,rarity,null,s.classId??'sword',s.path)});}}}
export function weaponClass(w){return FAMILIES[w.family].classId??'sword';}
/* Oct 18: retired families convert in place (Bow -> Short Bow) so owned weapons survive; run before removed families are stripped. */
export function convertRetired(a){let n=0;for(const w of a?.weapons??[]){const f=FAMILIES[w?.family];/* Oct 18: renamed families (Staff -> Flame Staff) rename saved copies */if(f?.renamedFrom&&!String(w.name??'').endsWith(f.name)){w.name=String(w.name??'').replace(new RegExp('\\b'+f.renamedFrom+'$'),f.name);n++;}const to=f?.retiredTo;if(to==null)continue;w.family=to;/* Oct 18: affixes tied to the old family become a general stat of the same rarity slot so the save stays valid */for(let i=0;i<(w.affixes??[]).length;i++){const d=AFFIX_MAP.get(w.affixes[i].id);if(!d||!d.families||d.families.includes(to))continue;const sub=[...AFFIX_MAP.values()].find(x=>x.kind==='stat'&&!x.families&&!x.legacy&&!w.affixes.some(b=>b.id===x.id));if(!sub){w.affixes.splice(i--,1);continue;}if(w.locked===w.affixes[i].id)w.locked=sub.id;w.affixes[i]={id:sub.id,kind:'stat',value:Math.round((sub.min+sub.max)/2)};}if(w.affixCount!==undefined)w.affixCount=w.affixes.length;w.name=String(w.name??'').replace(new RegExp('\\b'+(f.oldName??'Bow')+'$'),FAMILIES[to].name);n++;}return n;}
export function migrateArmory(a){
 const next=JSON.parse(JSON.stringify(a));convertRetired(next);next.version=7;next.pathEquipped??={};next.starterGrants??={};
 for(const w of next.weapons){w.legacyProgression??={ceiling:w.ceiling,quality:w.quality,base:w.base};if(w.schema!==5){w.legacyAffixes??=JSON.parse(JSON.stringify(w.affixes));w.schema=5;}w.affixCount=w.affixes.length;w.signature??=null;w.forgeHistory??=[];}
 for(const cls of ['sword','mage','ranger'])if(!next.weapons.some(w=>weaponClass(w)===cls)){const family=cls==='mage'?5:cls==='ranger'?14:0,w=makeWeapon(1,()=>.4,0,family,cls);w.id='starter-'+cls+'-v1';w.base=1;w.ceiling=1;w.affixes=[];w.affixCount=0;storeWeapon(next,w);}
 // Oct 16 (user): you start with only the base weapon of each class; other families must be found. Free "Practice"
 // starters are no longer granted, and unused ones (never forged, not equipped) are removed from older saves.
 const inUse=new Set([next.equipped,...Object.values(next.classEquipped??{})]);next.weapons=next.weapons.filter(w=>!(String(w.id).startsWith('starter-affix-')&&!w.forgeHistory?.length&&!inUse.has(w.id)));next.affixFamilyStarters=true;
 next.classEquipped??={};for(const cls of ['sword','mage','ranger']){const current=next.weapons.find(w=>w.id===next.classEquipped[cls]&&weaponClass(w)===cls),equipped=next.weapons.find(w=>w.id===next.equipped&&weaponClass(w)===cls);next.classEquipped[cls]=(current??equipped??next.weapons.find(w=>weaponClass(w)===cls)).id;}
 for(const path of Object.keys(PATH_FAMILIES)){const cls=PATH_CLASS[path];
 let w=next.weapons.find(w=>w.id===next.pathEquipped[path]&&weaponEligible(w,cls,path))??next.weapons.find(w=>w.id===next.equipped&&weaponEligible(w,cls,path))??next.weapons.find(w=>weaponEligible(w,cls,path));
 const grantKey=path+'@'+PATH_FAMILIES[path][0];if(!w&&(!next.starterGrants[grantKey]||next.weapons.some(n=>n.id==='starter-path-'+path+'-v1'&&!weaponEligible(n,cls,path)))){next.starterGrants[grantKey]=true;w=makeWeapon(1,()=>.4,0,PATH_FAMILIES[path][0],cls,path);const legacyId='starter-path-'+path+'-v1';w.id=next.weapons.some(n=>n.id===legacyId)?legacyId+'-family-'+RANGER_FAMILIES[path][0]:legacyId;w.base=1;w.ceiling=1;w.affixes=[];w.affixCount=0;w.starterGrant=true;if(!storeWeapon(next,w))throw Error('Starter migration could not be stored');next.starterGrants[path]=true;}
 if(w)next.pathEquipped[path]=w.id;
 }
 for(const w of next.weapons)w.legacyProgression??={ceiling:w.ceiling,quality:w.quality,base:w.base};if(!validArmory(next))throw Error('Migration validation failed; original save preserved');return next;
}

export function describeAffix(w,a,level){const d=AFFIX_MAP.get(a.id);if(!d)return a.name;if(d.kind==='behavior')return 'Behavior · '+d.name+' — '+d.description;const scale=weaponStats(w,level).affixScale,value=Math.round(a.value*scale*10)/10;return 'Stat · '+a.name+': +'+value+d.unit+(scale<1?' (full roll '+a.value+d.unit+')':'')+(a.id==='slam'?' · preserved legacy roll, now LMB only':'');}

export function weaponEligible(w,classId,path){return !!w&&!!FAMILIES[w.family]&&!FAMILIES[w.family].removed&&weaponClass(w)===classId&&(!path||PATH_CLASS[path]!==classId||PATH_FAMILIES[path].includes(w.family));}
export function selectPathWeapon(a,path){const cls=PATH_CLASS[path]??'ranger';a.pathEquipped??={};const w=a.weapons.find(w=>w.id===a.pathEquipped?.[path]&&weaponEligible(w,cls,path))??a.weapons.find(w=>weaponEligible(w,cls,path)&&w.location!=='pocket');if(!w)return false;a.equipped=w.id;a.classEquipped[cls]=w.id;a.pathEquipped[path]=w.id;return true;}
