import {makeWeapon} from './weapons.js?v=fx-260';
export const CORNER_BOSSES=['ravager','wyrm','butcher','prophet'];
export function createBossChoices(){return {next:0,pending:[],seen:new Set(),claimed:new Set(),completed:new Set(),blessings:{},buff:null};}
export function queueBossChoices(q,s,events){for(const e of events){if(e.type!=='death'||!CORNER_BOSSES.includes(e.bossKind)||q.seen.has(e.id))continue;q.seen.add(e.id);if(e.eligibleOwners&&!e.eligibleOwners.includes(String(s.rewardOwner??0)))continue;if(q.completed.has(e.bossKind)||q.pending.some(r=>r.kind===e.bossKind))continue;
 const n=Math.random(),weapon=makeWeapon(s.level,Math.random,n<.55?2:n<.95?3:4,null,s.classId??'sword',s.path);q.pending.push({id:'corner-'+e.bossKind,bossId:e.id,kind:e.bossKind,weapon,anchor:e.rewardAnchor??{x:e.x,y:e.y}});}}
export function bossOptions(q,s){if(!q.pending.length)return [];return [{id:'offense',name:'Offensive blessing',description:'+3 percentage points to all damage for this run. Boss Soul raises it to +5.'},{id:'protection',name:'Protective blessing',description:'+5% maximum health for this run. Boss Soul raises it to +8%.'},{id:'sustain',name:'Restorative blessing',description:'+6% healing and barriers for this run. Boss Soul raises it to +10%. Existing caps apply.'}];}
export function claimBossChoice(q,s,id,choice,commit=()=>true){const r=q.pending[0];if(!r||r.id!==id||q.claimed.has(id)||!bossOptions(q,s).some(o=>o.id===choice))return false;if(commit(0,r)!==true)return false;q.claimed.add(id);q.completed.add(r.kind);q.blessings[r.kind]=choice;s.blessings={...q.blessings};q.pending.shift();return true;}
export function blessingStats(s){const values=Object.values(s.blessings??{}),soul=CORNER_BOSSES.every(k=>s.blessings?.[k]);return {soul,damage:values.filter(v=>v==='offense').length*(soul?.05:.03),maxHp:values.filter(v=>v==='protection').length*(soul?.08:.05),support:values.filter(v=>v==='sustain').length*(soul?.10:.06)};}
export function tickBossBuff(q,c,s,dt){const b=blessingStats(s);c.blessingDamage=b.damage;c.blessingSupport=b.support;s.blessingHealth=b.maxHp;c.rewardDamage=1+(s.buffStats?.damage??0);s.rewardReduction=0;}

// Proposed time bands from the change order; the existing mechanical boss kit stays intact.
export function miniBossHealth(seconds){
 if(seconds<300)return 15000;
 if(seconds<600)return Math.round(17000+(seconds-300)/300*5000);
 if(seconds<1200)return Math.round(25000+(seconds-600)/600*15000);
 if(seconds<1800)return Math.round(40000+(seconds-1200)/600*20000);
 return Math.round(60000*(1+(seconds-1800)/1800*.5));
}
