import {developmentNodes} from './developments.js?v=fx-260';
import {TALENT_NODES,SLOTS,spellId} from './talent-data.js?v=fx-260';
export const PATHS={
 mage:[{id:'pyro',name:'Pyromancer',color:'#ed9654',icon:'☀',description:'Fire-spreading fireballs, burning ground and meteor scorch.'},{id:'cryo',name:'Cryomancer',color:'#91dced',icon:'❄',description:'Ice Road, freezing control and a crushing blizzard.'},{id:'storm',name:'Stormcaller',color:'#baa5ef',icon:'ϟ',description:'Chain lightning, linked storm rods and a chasing tempest.'},{id:'blood',name:'Blood Mage',color:'#e06c83',icon:'♦',description:'Neon life drain, blooming bleeds and blood pools.'}],
 sword:[{id:'berserker',name:'Berserker',color:'#d99768',icon:'⚔',description:'Bleeding pressure, Savage Rush and ultimate aggression.'},{id:'vanguard',name:'Vanguard',color:'#c9bd89',icon:'◇',description:'Exploding parries, Sundering Cleave and the Bastion Dome.'},{id:'spellblade',name:'Spellblade',color:'#93c5ce',icon:'✧',description:'Void waves, dark-matter orbs, an exploding barrier and chaining Void Ascension.'},{id:'warlord',name:'Warlord',color:'#deaf70',icon:'♜',description:'Brutal Charge, a crushing War Cry, Earthquake and a pulling Bladestorm.'}],
 // Oct 17: Ranger (user's design). Shared Marked / Exposed statuses; Momentum from bow hits.
 ranger:[{id:'archer',name:'Archer',color:'#9be15d',icon:'➶',description:"Charged Power Shots, Fire/Frost/Poison arrows, marking Volleys and Hunter's Focus."},{id:'ninja',name:'Ninja',color:'#2f62ff',icon:'✦',description:'Bouncing shuriken, a rooted Blade Fan, Exposing Smoke Bomb and Shadow Clones that copy your attacks.'},{id:'alchemist',name:'Alchemist',color:'#b35cff',icon:'⚗',description:'Toxic clouds, reactive Catalyst Flasks, a barrier flask and the Grand Flask.'},{id:'gunslinger',name:'Gunslinger',color:'#ffc24a',icon:'✺',description:'Marking Piercing Line, ricocheting Fan the Hammer, Quickstep and Bullet Barrage.'}]
};
export const PATH_NODES=[...TALENT_NODES,...developmentNodes(Object.values(PATHS).flat().map(p=>p.id))];
export const BONUS_PICK_CAP=2;
const BY_ID=new Map(PATH_NODES.map(n=>[n.id,n])),BY_PATH=new Map(Object.values(PATHS).flat().map(p=>[p.id,PATH_NODES.filter(n=>n.path===p.id)]));
const EFFECTS=new Map();
for(const n of PATH_NODES)for(const e of n.effects){const key=n.path+'|'+e.stat;if(!EFFECTS.has(key))EFFECTS.set(key,[]);EFFECTS.get(key).push({id:n.id,...e});}
export const pathInfo=s=>(PATHS[s.classId??'sword']??[]).find(p=>p.id===s.path);
export const pathNodes=s=>BY_PATH.get(s.path)??[];
export const nodeById=id=>BY_ID.get(id);
export const rank=(s,id)=>BY_ID.get(id)?.path===s.path&&Number(s.skills?.[id]??0)>=1?1:0;
export const talentFlag=(s,id)=>rank(s,id)>0;
// Runs start with no spells: a slot works only after its spell card is picked.
export const spellOwned=(s,slot)=>slot==='SPACE'||!!rank(s,spellId(s.path,slot));
export const allocatedPoints=s=>pathNodes(s).reduce((sum,n)=>sum+rank(s,n.id),0);
export const cardStat=(s,stat)=>Number(s.cardStats?.[stat]??0);
// Card stats feed the same queries as talents: global stats always, slot stats
// (cooldown/area) only for spell slots.
const CARD_GLOBAL={movement:'move',maxHp:'maxHp',energyMax:'energyMax',energyRegen:'energyRegen'},CARD_SLOT={cooldown:'cooldown',radius:'area'};
export function talentBonus(s,stat,ability){let sum=0;for(const e of EFFECTS.get(s.path+'|'+stat)??[])if((!e.ability||e.ability===ability)&&Number(s.skills?.[e.id]??0)>=1)sum+=e.value;
 if(CARD_GLOBAL[stat])sum+=cardStat(s,CARD_GLOBAL[stat])+(stat==='maxHp'?s.buffStats?.maxHp??0:0);else if(CARD_SLOT[stat]&&ability&&ability!=='SPACE')sum+=cardStat(s,CARD_SLOT[stat]);if(stat==='cooldown'&&ability&&ability!=='SPACE')sum+=Math.max(0,(s.world?.cooldown??1)-1);return sum;}
export function choosePath(s,id){if(s.dead||s.level>1||s.pathLocked||s.clock>0||!(PATHS[s.classId??'sword']??[]).some(p=>p.id===id))return false;s.path=id;s.skills={};return true;}
export function learnReason(s,id){
 const n=pathNodes(s).find(n=>n.id===id);if(!n||!pathInfo(s))return 'Not in your chosen specialization.';
 if(s.dead)return 'Run ended.';if(rank(s,id))return 'Already learned.';
 if(n.parents.length&&!n.parents.some(p=>rank(s,p)))return 'Requires '+n.parents.map(p=>BY_ID.get(p)?.name).join(' / ')+'.';
 return '';
}
export const canLearn=(s,id)=>!learnReason(s,id);
export function learn(s,id){if(!canLearn(s,id))return false;s.skills??={};s.skills[id]=1;return true;}
// Kept for old callers: card leveling has no refundable points.
export function refundPath(){return 0;}
// Oct 16 (user, latest): spells at levels 1/5/10 and the R spell at 15 (after the other three).
// Spell augments (picked from the talent tree) at 7, 11, 14, then every 4 levels from 18 (18/22/26/30...).
// All other levels grant stat/utility cards.
export const SPELL_LEVELS=[1,5,10,15],AUGMENT_LEVELS=[7,11,14],AUGMENT_EVERY=4,AUGMENT_FROM=18;
export const pickKind=level=>SPELL_LEVELS.includes(level)?'spell':AUGMENT_LEVELS.includes(level)||level>=AUGMENT_FROM&&(level-AUGMENT_FROM)%AUGMENT_EVERY===0?'behavior':'stat';
export const nextSpellLevel=level=>{for(let l=level+1;l<=level+AUGMENT_EVERY+1;l++)if(pickKind(l)!=='stat')return l;return null;};
export function awardLevelPoints(s,events=[]){if(s.dead)return 0;const from=(s.levelPicksAwarded??0)+1;let n=0;for(let level=from;level<=(s.level??1);level++){(s.pendingPicks??=[]).push({kind:pickKind(level),level});n++;}s.levelPicksAwarded=Math.max(s.levelPicksAwarded??0,s.level??0);if(n)events.push({type:'levelPick',level:s.level,amount:n});return n;}
export function awardBonusPoint(s){if(s.dead||(s.bonusPointsEarned??0)>=BONUS_PICK_CAP)return false;s.bonusPointsEarned=(s.bonusPointsEarned??0)+1;(s.pendingPicks??=[]).push({kind:'behavior',bonus:true,level:s.level});return true;}
export {SLOTS,spellId};
