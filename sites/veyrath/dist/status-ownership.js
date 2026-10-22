// Each kit simulates only its own funded damage-over-time instances. Public fields
// remain a representative view for existing renderers; they are never a second ticking copy.
const records=new WeakMap(),active=new WeakSet();
export function ownStatuses(c,keys,run){
 if(active.has(c))return run();active.add(c);
 const owner=String(c.ownerId??0),saved=[];
 for(const e of c.targets??[]){if(e.timeStopped)continue;let all=records.get(e);if(!all){all=new Map();records.set(e,all);}let mine=all.get(owner);if(!mine){mine=all.size?{}:Object.fromEntries(keys.map(k=>[k,e[k]]));all.set(owner,mine);}
  for(const key of keys){saved.push({e,key,all,mine});e[key]=mine[key]??null;}}
 try{return run();}finally{active.delete(c);for(const {e,key,all,mine}of saved){mine[key]=e[key];let representative=null;for(const source of all.values()){const v=source[key];if(v&&(!representative||(v.remaining??v)>(representative.remaining??representative)))representative=v;}e[key]=representative;}}
}
export function fieldContact(c,e,group,time,interval=.5){
 e.fieldContacts??={};const key=String(c.ownerId??0)+':'+group,last=e.fieldContacts[key]??-Infinity;if(time-last<interval-1e-6)return false;e.fieldContacts[key]=time;return true;
}
const weaknesses=new WeakMap();
export function applyWeaken(e,owner,magnitude,duration){let sources=weaknesses.get(e);if(!sources){sources=new Map();weaknesses.set(e,sources);}const old=sources.get(owner);if(old&&old.remaining>0&&old.magnitude>magnitude)return false;sources.set(owner,{magnitude,remaining:duration});resolveWeaken(e,sources);return true;}
function resolveWeaken(e,sources){let strongest=null;for(const v of sources.values())if(v.remaining>0&&(!strongest||v.magnitude>strongest.magnitude))strongest=v;e.warriorWeaken=strongest?.remaining??0;e.warriorWeakenFactor=strongest?.magnitude??0;}
export function tickEnemyConditions(e,dt){for(const key of ['warriorStaggerCD','mageChill','rMarked','rExposed'])e[key]=Math.max(0,(e[key]??0)-dt);const sources=weaknesses.get(e);if(sources){for(const [id,v]of sources){v.remaining-=dt;if(v.remaining<=0)sources.delete(id);}resolveWeaken(e,sources);}}
