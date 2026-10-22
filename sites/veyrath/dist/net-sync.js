// Oct 17 (user: Steam co-op, step 2): one shared run. The host's game runs the world; every other player only sends commands
// ({move,aim,press}, the same format bots use) and draws snapshots of the host's state.
// This module only packs/unpacks state. game.js decides what goes in (host) and where it lands (client).
//
// Snapshot (host → everyone, ~20 Hz, reliable): per-field *deltas* for the big lists (enemies, hazards, enemy shots, XP orbs,
// heal packs, world events) and for each player's class-kit state; player records; shared run numbers; cosmetic events.
// Oct 17 (user: "laggy right at the start and random times"): bandwidth cut — sim-only enemy timers are not sent (the client
// advances the animation ones itself) and kit state travels as per-field deltas instead of in full every tick.

// Cosmetic or heavy keys never sent (clients don't simulate; particles travel separately as `np`).
// fxTargets = the class kit's pointer to the whole enemy list (status visuals); clients point it at their own mirrored list.
// Oct 17 (user: host spamming Cryo spells made friends lag and rubber-band): it was resent with every kit delta (~37 KB).
const SKIP=new Set(['_fa','_ft','_h','particles','efx','particleClock','_tx','_ty','_new','kit','cmd','netPress','netMoves','fxTargets']);
// Per-channel keys that only the simulation needs, or that the client advances locally (enemy clock/age).
const CHANNEL_SKIP={e:new Set(['clock','age','cooldown','navT','navCheck','navBest','stuckT','steerDir','steerSide','slideSide','tgtId','tgtAt','partyHp','bleedPulse'])};
const round=v=>Number.isInteger(v)?v:Math.round(v*100)/100;
// Oct 19 (measured: late-game snapshots 10-19 KB at 20 Hz, reliable, ~300 KB/s; friend's view got choppier as crowds grew):
// world channels and kit state send large numbers (map positions, hp) as integers - < 0.5 px, absorbed by interpolation -
// so a still or slow enemy stops changing every tick. Player records keep 2 decimals (the friend's own prediction reconciles
// against them). Small values (angles, timers) keep 2 decimals.
const coarse=v=>Number.isInteger(v)?v:Math.abs(v)>=50?Math.round(v):Math.round(v*100)/100;
// Per-channel field transforms: the client only draws these, the host simulates them. burn carried the whole weapon object
// and changed every tick (~300-480 B per snapshot); now {remaining} in 0.5 s steps.
// Same for every damage-over-time status (they carry the weapon object too): bleeds, poisons, ranger burns. Poison keeps stacks.
const dot=b=>b&&typeof b==='object'?(b.stacks!=null?{remaining:Math.ceil((b.remaining??0)*2)/2,stacks:b.stacks}:{remaining:Math.ceil((b.remaining??0)*2)/2}):b;
const CHANNEL_MAP={e:{burn:dot,warriorBleed:dot,bloodBleed:dot,rBurn:dot,rPoison:dot,rBleed:dot}};

// JSON with: rounded numbers, no Map/Set/functions, other entities shrunk to a light reference, no cycles.
function serializer(light,rnd=round){const ancestors=[],active=new WeakSet();return function(k,v){
  if(typeof v==='number')return Number.isFinite(v)?rnd(v):null;
  if(v===null||typeof v!=='object')return typeof v==='function'?undefined:v;
  if(SKIP.has(k)||v instanceof Map||v instanceof Set||(typeof Node!=='undefined'&&v instanceof Node))return undefined;
  if(light.has(v)){const e=v;return {id:e.id,x:rnd(e.x),y:rnd(e.y),radius:e.radius,state:e.state};}
  // Shared spell specs are valid siblings (e.g. Alchemist double flask), not cycles.
  // Only omit references back into the current ancestor chain.
  while(ancestors.length&&ancestors.at(-1)!==this)active.delete(ancestors.pop());
  if(active.has(v))return undefined;ancestors.push(v);active.add(v);return v;};}
const ser=(v,light,rnd)=>{try{return JSON.stringify(v,serializer(light,rnd));}catch{return undefined;}};
// Shallow field delta of `o` against `last` (field → JSON). A field that disappears is sent once as null.
function fieldDelta(o,last,light,skip,rnd=round,map){let f='';
  for(const k in o){if(SKIP.has(k)||skip?.has(k))continue;const v=map?.[k]?map[k](o[k]):o[k],s=typeof v==='number'?(Number.isFinite(v)?''+rnd(v):'null'):typeof v==='string'?JSON.stringify(v):typeof v==='boolean'?(v?'true':'false'):ser(v,light,rnd);  /* Oct 18 perf: plain values skip the serializer */if(s===undefined){if(k in last){delete last[k];f+=(f?',':'')+JSON.stringify(k)+':null';}continue;}
    if(last[k]!==s){last[k]=s;f+=(f?',':'')+JSON.stringify(k)+':'+s;}}
  for(const k in last)if(!(k in o)){delete last[k];f+=(f?',':'')+JSON.stringify(k)+':null';}
  return f;}

// ---------------- host ----------------
export function createHostSync(){return {ids:new WeakMap(),next:1,last:new Map(),kitLast:new Map(),order:{},events:[],seq:0};}
const nid=(H,o)=>{let i=H.ids.get(o);if(!i){i=H.next++;H.ids.set(o,i);}return i;};
export function resetHostSync(H){H.last.clear();H.kitLast.clear();H.order={};}   // next snapshot is a full one (someone joined)
export function hostEvents(H,events,types){for(const e of events)if(types.has(e.type))H.events.push(e);if(H.events.length>200)H.events.splice(0,H.events.length-200);}

// channels: {key: array of objects}; shared: plain object; players: [{id, rec, kit}]
// lazy(key,o): true when this object may skip this tick (far from every friend); its changes go out on a later tick.
export function hostSnapshot(H,{channels,shared,players,light,lazy}){
  const parts=[],fine=!!globalThis.__netFine;  /* test switch: the pre-Oct-19 precision, for before/after measurements */
  for(const key in channels){const arr=channels[key]??[],ids=[],deltas=[],prev=H.order[key]??[],skip=CHANNEL_SKIP[key];
    for(const o of arr){const id=nid(H,o);ids.push(id);let last=H.last.get(id);const fresh=!last;if(fresh){last={};H.last.set(id,last);}
      if(!fresh&&lazy?.(key,o))continue;const f=fieldDelta(o,last,light,skip,fine?round:coarse,fine?null:CHANNEL_MAP[key]);if(f||fresh)deltas.push('['+id+',{'+f+'}]');}
    const now=new Set(ids);for(const id of prev)if(!now.has(id))H.last.delete(id);H.order[key]=ids;
    const orderChanged=ids.length!==prev.length||ids.some((id,i)=>id!==prev[i]);
    parts.push(JSON.stringify(key)+':{'+(orderChanged||!prev.length?'"o":['+ids.join(',')+'],':'')+'"d":['+deltas.join(',')+']}');}
  const ev=H.events.splice(0).map(e=>ser(e,light)).filter(Boolean);
  let particleBudget=1800; // bytes per snapshot, shared across the whole party; cosmetics must not queue movement
  const ps=players.map(({id,rec,kit})=>{let k='null';
    if(kit){const out=['"classId":'+JSON.stringify(kit.classId)];
      for(const part of ['s','c','mage','warrior','ranger','dash']){const o=kit[part];if(!o||typeof o!=='object')continue;const key=id+'.'+part;let last=H.kitLast.get(key);if(!last){last={};H.kitLast.set(key,last);}
        const f=fieldDelta(o,last,light,null,fine?round:coarse);if(f)out.push(JSON.stringify(part)+':{'+f+'}');}
      const share=Math.floor(1800/Math.max(1,players.length));let playerBudget=Math.min(share,particleBudget);
      for(const field of ['ne','np'])if(kit[field]?.length){const samples=[];let used=2;
        for(const p of kit[field]){const s=ser(p,light);if(!s||used+s.length+1>playerBudget)continue;samples.push(s);used+=s.length+1;}
        if(samples.length){out.push(JSON.stringify(field)+':['+samples.join(',')+']');particleBudget-=used;playerBudget-=used;}}
      k='{'+out.join(',')+'}';}
    return '{"r":'+(ser(rec,light)??'{}')+',"k":'+k+'}';});
  return '{"t":"snap","n":'+(++H.seq)+',"ht":'+Math.round(performance.now())+',"ch":{'+parts.join(',')+'},"s":'+(ser(shared,light)??'{}')+',"p":['+ps.join(',')+'],"ev":['+ev.join(',')+']}';
}

// ---------------- client ----------------
export function createClientSync(){return {maps:{},arrays:{},shared:{},players:[],playerStates:new Map(),events:[],n:0,offset:null,ht:0};}
// Oct 19 audit (user: co-op "doesn't run smooth"): snapshot interpolation (Gaffer on Games / Source engine style).
// Enemies and enemy shots are drawn INTERP ms in the past, blended between the two real snapshots around that time,
// instead of easing toward the newest packet (which stuttered whenever Steam delivered snapshots in bunches).
// offset = local clock minus host clock, tracked from the fastest-arriving packets so jitter doesn't shift it.
export const INTERP=110;
export function hostTimeNow(C,now=performance.now()){return C.offset==null?C.ht:now-C.offset;}
export function sample(o,ht){const h=o._h??=[];const last=h.at(-1);if(last&&last.t>=ht){last.x=o._tx;last.y=o._ty;return;}h.push({t:ht,x:o._tx,y:o._ty});if(h.length>8)h.shift();}
export function interpolate(o,rt){const h=o._h;if(!h?.length)return;if(rt<=h[0].t||h.length===1){o.x=h[0].x;o.y=h[0].y;return;}
  for(let i=h.length-1;i>0;i--){const a=h[i-1],b=h[i];if(rt>=a.t){if(rt>=b.t){o.x=b.x;o.y=b.y;}else{const k=(rt-a.t)/Math.max(1,b.t-a.t);o.x=a.x+(b.x-a.x)*k;o.y=a.y+(b.y-a.y)*k;}if(i>2)h.splice(0,i-2);return;}}}
// Positions of moving things are smoothed on the client: new x/y become targets (_tx/_ty).
const SMOOTH=new Set(['e','b']);
export function applySnapshot(C,msg){
  if(msg.n<=C.n)return false;C.n=msg.n;
  const now=performance.now(),ht=Number.isFinite(msg.ht)?msg.ht:(C.ht+50);C.ht=ht;const off=now-ht;C.offset=C.offset==null||off<C.offset?off:C.offset+(off-C.offset)*.02;
  for(const key in msg.ch){const {o,d}=msg.ch[key],map=C.maps[key]??=new Map();
    for(const [id,f] of d){let obj=map.get(id);const fresh=!obj;if(fresh){obj={};map.set(id,obj);}
      if(SMOOTH.has(key)&&!fresh&&('x' in f||'y' in f)){if('x' in f){obj._tx=f.x;delete f.x;}if('y' in f){obj._ty=f.y;delete f.y;}}
      Object.assign(obj,f);if(fresh){obj._tx=obj.x;obj._ty=obj.y;}if(SMOOTH.has(key))sample(obj,ht);}
    if(o){const keep=new Set(o);for(const id of map.keys())if(!keep.has(id))map.delete(id);
      C.arrays[key]=o.map(id=>map.get(id)).filter(Boolean);}}
  // Fold EVERY packet into retained state, even when several arrive between render frames.
  // Replacing players with only the newest delta lost initial offers, spells and combat arrays.
  C.shared=msg.s??{};const keepPlayers=new Set();
  C.players=(msg.p??[]).map(({r,k})=>{keepPlayers.add(r.id);let state=C.playerStates.get(r.id);
    if(!state){state={r,k:null};C.playerStates.set(r.id,state);}state.r=r;
    if(k){state.k??={};state.k.classId=k.classId;
      for(const part of ['s','c','mage','warrior','ranger','dash'])if(k[part])Object.assign(state.k[part]??={},k[part]);
      for(const field of ['np','ne'])if(k[field]?.length){const np=state.k[field]??=[];np.push(...k[field]);if(np.length>120)np.splice(0,np.length-120);}}
    return state;});
  for(const id of C.playerStates.keys())if(!keepPlayers.has(id))C.playerStates.delete(id);
  C.events.push(...(msg.ev??[]));return true;
}
// Per frame on the client: ease positions toward the newest values; advance the enemy timers the host no longer sends.
export function smoothArrays(C,dt){const rt=hostTimeNow(C)-INTERP;
  for(const key of SMOOTH)for(const o of C.arrays[key]??[])if(o._h)interpolate(o,rt);else if(o._tx!=null){o.x=o._tx;o.y=o._ty;}
  for(const o of C.arrays.e??[]){o.clock=(o.clock??0)+dt;o.age=(o.age??0)+dt;}}
