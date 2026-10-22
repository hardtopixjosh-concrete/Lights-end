import {prepareMetaSave,normalizeProgression,GAMEPLAY_RUNES,RUNE_SLOT_PRICES} from './progression.js?v=fx-260';
// Main-menu batch (Oct 16, docs/main-menu-plan.md): modes, the gold Unlocks shop, colour runes and best runs.
// Saved per browser (not the approved permanent save system). Prices and values are PROPOSALS for user review.
const KEY='veyrath-meta-v1';
export const MODES=[
 {id:'normal',name:'Normal',desc:'The full 30-minute run. Beat the Crimson Tyrant to win.'},
 {id:'endless',name:'Endless',desc:'The run continues after the Tyrant. Bosses return and the horde keeps getting stronger until you fall.'},
 {id:'modified',name:'Modified run',desc:'Turn on any mix of modifiers below. No extra rewards.'}
];
// User's modifier list (Oct 16). The 30% / 50% / x2 / half values are the user's; regen and enemy speed amounts are proposals.
export const MODIFIERS=[
 {id:'haste',name:'Quickened',desc:'Cooldowns 30% faster and more regen (HP regen x1.5, energy regen x1.25), but enemies move 15% faster.',mods:{cooldown:1.3,regen:1.5,energyRegen:1.25,enemySpeed:1.15}},
 {id:'horde',name:'Horde',desc:'50% more enemies spawn.',mods:{spawn:1.5}},
 {id:'glass',name:'Glass cannon',desc:'You deal double damage but have half HP.',mods:{damage:2,maxHp:.5}}
];
export const RUNES=[
 {id:'gold',name:'Gold Rune',color:'#ffc94a',element:'gold'},
 {id:'crimson',name:'Crimson Rune',color:'#e2475f',element:'blood'},
 {id:'frost',name:'Frost Rune',color:'#9fdcf0',element:'cryo'},
 {id:'ember',name:'Ember Rune',color:'#ff8a2a',element:'pyro'},
 {id:'storm',name:'Storm Rune',color:'#a98bff',element:'storm'},
 {id:'void',name:'Void Rune',color:'#9b5cff',element:'void'},
 {id:'verdant',name:'Verdant Rune',color:'#7be38a',element:'verdant'}
];
export const RUNE_PRICE=250;
export const COLOUR_RUNES_AVAILABLE=false;
// Oct 16 (user): each class starts with only its first path (Mage: Pyromancer, Warrior: Berserker); the other
// three are bought here with gold. The price is a PROPOSAL.
export const PATH_PRICE=600;
// Tiered shop upgrades. prices[i] buys tier i+1.
export const UPGRADES=[
 {id:'reroll',section:'helpers',name:'Reroll charge',tag:'LEVEL-UP',desc:'Each run starts with one more Reroll: swap all three level-up cards for new ones.',prices:[600]},
 {id:'banish',section:'helpers',name:'Banish charge',tag:'LEVEL-UP',desc:'Each run starts with one more Banish: remove a card so it never shows again that run.',prices:[800]},
 {id:'moveCharge',section:'move',name:'Extra charge',tag:'BLINK / DASH',desc:'Store a second Blink / Dash. Charges refill one at a time.',prices:[600]},
 {id:'moveRate',section:'move',name:'Quick step',tag:'BLINK / DASH',desc:'Blink / Dash recharges 10% faster per tier.',prices:[150,300,450]},
 {id:'moveReach',section:'move',name:'Long step',tag:'BLINK / DASH',desc:'Blink / Dash travels 15% further per tier.',prices:[150,300]},
 {id:'moveEmber',section:'move',name:'Ember step',tag:'BLINK / DASH',desc:'Arriving from a Blink / Dash releases a burst that deals 45 damage to nearby enemies.',prices:[500]}
];
export const COMING_LATER=[

 {name:'Skill evolutions',desc:'New evolutions for your skills and spells. Designed in a later session.'}
];
export function createMeta(){return {version:2,gameplaySlots:0,gameplayRunes:[],gameplayLoadout:[],spellColor:null,upgrades:{},runes:[],paths:[],found:[],runeOn:{},best:{},totals:{runs:0,kills:0},last:{mode:'normal',mods:[],paths:{}}};}
export function loadMeta(){const raw=localStorage.getItem(KEY);if(!raw)return createMeta();const m=JSON.parse(raw);if(![1,2].includes(m?.version))throw Error('Unsupported menu save; original preserved');if(m.version===1)localStorage.setItem('veyrath-meta-before-progression-v2',localStorage.getItem('veyrath-meta-before-progression-v2')??raw);return normalizeProgression({...createMeta(),...m,version:2,last:{...createMeta().last,...m.last}});}
export function saveMeta(m){try{const next=prepareMetaSave(localStorage,m);localStorage.setItem(KEY,JSON.stringify(next));m.revision=next.revision;return true;}catch{return false;}}
export const tier=(m,id)=>m.upgrades[id]??0;
export function upgradePrice(m,id){const u=UPGRADES.find(u=>u.id===id);return u?.prices[tier(m,id)]??null;}
// Pure purchase step: returns {next,price} or {error}. The caller spends the gold first, then saves `next`.
export function buyItem(m,kind,id,gold){
 if(kind==='gameplaySlot'){const price=RUNE_SLOT_PRICES[m.gameplaySlots??0];if(price==null)return {error:'All three slots owned'};if(gold<price)return {error:'Not enough gold'};return {price,next:{...m,gameplaySlots:(m.gameplaySlots??0)+1}};}
 if(kind==='gameplayRune'){const r=GAMEPLAY_RUNES.find(r=>r.id===id);if(!r)return {error:'Unknown rune'};if(m.gameplayRunes.includes(id))return {error:'Already owned'};if(gold<r.price)return {error:'Not enough gold'};return {price:r.price,next:{...m,gameplayRunes:[...m.gameplayRunes,id]}};}
 if(kind==='path'){if((m.paths??[]).includes(id))return {error:'Already unlocked'};if(gold<PATH_PRICE)return {error:'Not enough gold'};return {price:PATH_PRICE,next:{...m,paths:[...(m.paths??[]),id]}};}
 if(kind==='rune'){if(!RUNES.some(r=>r.id===id))return {error:'Unknown rune'};if(m.runes.includes(id))return {error:'Already owned'};if(!COLOUR_RUNES_AVAILABLE)return {error:'Colour runes are coming soon'};if(gold<RUNE_PRICE)return {error:'Not enough gold'};return {price:RUNE_PRICE,next:{...m,runes:[...m.runes,id]}};}
 const price=upgradePrice(m,id);if(price==null)return {error:'Maxed'};if(gold<price)return {error:'Not enough gold'};return {price,next:{...m,upgrades:{...m.upgrades,[id]:tier(m,id)+1}}};
}
export function setRune(m,weaponId,runeId){const runeOn={...m.runeOn};if(runeId&&m.runes.includes(runeId))runeOn[weaponId]=runeId;else delete runeOn[weaponId];return {...m,runeOn};}
export const runeFor=(m,weaponId)=>RUNES.find(r=>r.id===m.runeOn[weaponId])??null;
// Everything a run needs from the menu: mode, multipliers and permanent shop bonuses.
export function runMods(m,mode,modIds){
 const mods={cooldown:1,regen:1,energyRegen:1,enemySpeed:1,spawn:1,damage:1,maxHp:1};
 if(mode==='modified')for(const id of modIds){const def=MODIFIERS.find(d=>d.id===id);if(def)for(const [k,v] of Object.entries(def.mods))mods[k]*=v;}
 return {...mods,mode,modIds:mode==='modified'?[...modIds]:[],dashRate:1+.1*tier(m,'moveRate'),reach:1+.15*tier(m,'moveReach'),charges:1+tier(m,'moveCharge'),ember:tier(m,'moveEmber')>0,reroll:2+tier(m,'reroll'),banish:1+tier(m,'banish')};
}
const better=(a,b)=>!b||(a.victory?1:0)-(b.victory?1:0)||a.time-b.time||a.kills-b.kills;
// Records the run; returns {next,isBest}. Best runs are kept per class and per mode.
export function recordRun(m,r){
 const key=r.classId+'|'+r.mode,old=m.best[key],isBest=!old||better(r,old)>0;
 return {isBest,next:{...m,recentRuns:[...(m.recentRuns??[]),r].slice(-20),best:isBest?{...m.best,[key]:r}:m.best,totals:{runs:(m.totals.runs??0)+1,kills:(m.totals.kills??0)+r.kills}}};
}
// Paths owned: the first path of each class is always free.
export const pathUnlocked=(m,paths,id)=>paths.indexOf(paths.find(p=>p.id===id))===0||(m.paths??[]).includes(id);
// Weapon codex (Oct 16, user): families stay hidden until a weapon of that family is found. Returns a new meta or null.
export function markFound(m,families){const add=[...new Set(families)].filter(f=>f!=null&&!(m.found??[]).includes(f));return add.length?{...m,found:[...(m.found??[]),...add]}:null;}
