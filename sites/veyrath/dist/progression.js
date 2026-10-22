// October 18 progression handoff. Content and prices are provisional tuning values.
export const RUNE_SLOT_PRICES=[100,400,800];
export const GAMEPLAY_RUNES=[
 {id:'attack',name:'Rune of Striking',desc:'+8% attack damage.',price:200,stat:'attack',value:.08},
 {id:'ability',name:'Rune of Invocation',desc:'+8% ability damage.',price:200,stat:'ability',value:.08},
 {id:'barrier',name:'Rune of Protection',desc:'+15% barriers and +5% maximum health.',price:200,stat:'barrier',value:.15},
 {id:'healing',name:'Rune of Restoration',desc:'+15% healing and +5% maximum health. Existing healing caps apply.',price:200,stat:'healing',value:.15},
 {id:'vitality',name:'Rune of Vitality',desc:'+10% maximum health.',price:200,stat:'health',value:.1},
 {id:'reach',name:'Rune of Reach',desc:'+20 world units of basic melee reach. Warrior weapons only.',price:200,classId:'sword',stat:'meleeReach',value:20},
 {id:'spellReach',name:'Rune of Far Casting',desc:'+20 world units of ranged ability travel or targeting range. Does not enlarge areas.',price:200,stat:'spellRange',value:20}
];
export const SPELL_COLORS=[{id:'tyrant',name:'Tyrant’s Gold',filter:'sepia(.8) saturate(1.8) hue-rotate(355deg)',description:'Earned by defeating the Crimson Tyrant in Normal or Endless. Cosmetic only.'}];
export function runeEligible(r,classId){return !r.classId||r.classId===classId;}
export function normalizeProgression(m){return {...m,gameplaySlots:Math.max(0,Math.min(3,m.gameplaySlots??0)),gameplayRunes:[...new Set(m.gameplayRunes??[])].filter(id=>GAMEPLAY_RUNES.some(r=>r.id===id)),gameplayLoadout:[...new Set(m.gameplayLoadout??[])].filter(id=>(m.gameplayRunes??[]).includes(id)).slice(0,m.gameplaySlots??0)};}
export function equipGameplayRune(m,id,classId){const r=GAMEPLAY_RUNES.find(r=>r.id===id);if(!r||!m.gameplayRunes.includes(id)||!runeEligible(r,classId))return {error:'Rune unavailable for this class'};const next=structuredClone(m),i=next.gameplayLoadout.indexOf(id);if(i>=0)next.gameplayLoadout.splice(i,1);else{if(next.gameplayLoadout.length>=next.gameplaySlots)return {error:'All purchased rune slots are occupied'};next.gameplayLoadout.push(id);}return {next};}
export function runRuneLoadout(m,classId){return (m.gameplayLoadout??[]).slice(0,m.gameplaySlots??0).filter(id=>{const r=GAMEPLAY_RUNES.find(r=>r.id===id);return r&&m.gameplayRunes.includes(id)&&runeEligible(r,classId);});}
export function applyGameplayRunes(w,s){const out={...w,output:{...w.output}};for(const id of new Set(s.gameplayLoadout??[])){const r=GAMEPLAY_RUNES.find(r=>r.id===id);if(!r||!runeEligible(r,s.classId))continue;if(['attack','ability','healing','barrier'].includes(r.stat)){out.output[r.stat]=(out.output[r.stat]??0)+r.value;if(['healing','barrier'].includes(r.stat))out.health=(out.health??1)+.05;}else if(r.stat==='health')out.health=(out.health??1)+r.value;else out[r.stat]=(out[r.stat]??0)+r.value;}return out;}

// Oct 19 (user): live; the realm boss is the Crimson Tyrant (realm.js) and the pull happens every run.
export function createRealmSchedule(rng=Math.random){return {enabled:true,eligibleAt:300,occurs:true,at:300+rng()*1200,state:'waiting',id:'realm-'+Math.floor(rng()*1e9)};}
export function realmReady(r,s){return !!r.enabled&&r.occurs&&r.state==='waiting'&&s.clock>=r.at&&!s.timeStop&&!s.finalPhase&&!s.dead;}
export function beginRealm(r,s,roster,anchor){if(!realmReady(r,s))return false;r.state='active';r.roster=[...new Set(roster.map(String))];r.anchor={...anchor};return true;}
export function finishRealm(r,won){if(r.state!=='active')return false;r.state=won?'won':'failed';return true;}

// A write-ahead record makes gold + account unlocks recover together after an interrupted save.
const JOURNAL='veyrath-account-transaction-v1';
export function recoverAccount(storage){const raw=storage.getItem(JOURNAL);if(!raw)return;const p=JSON.parse(raw);if(!p.armory||!p.meta)throw Error('Invalid account transaction; original records preserved');storage.setItem('veyrath-armory-v1',JSON.stringify(p.armory));storage.setItem('veyrath-meta-v1',JSON.stringify(p.meta));storage.removeItem(JOURNAL);}
export function prepareMetaSave(storage,meta){
 if(storage.getItem(JOURNAL))throw Error('Interrupted purchase; reload to recover');
 const raw=storage.getItem('veyrath-meta-v1'),current=raw?JSON.parse(raw):null;
 if(current&&![1,2].includes(current.version))throw Error('Unsupported menu save');
 if((current?.revision??0)!==(meta.revision??0))throw Error('Menu progress changed in another tab; reload');
 return {...meta,revision:(meta.revision??0)+1};
}
export function saveAccountPair(storage,armory,meta){const nextMeta=prepareMetaSave(storage,meta);storage.setItem(JOURNAL,JSON.stringify({armory,meta:nextMeta}));recoverAccount(storage);return nextMeta;}
