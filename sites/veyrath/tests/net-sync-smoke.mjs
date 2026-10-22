// Oct 17 online co-op step 2: host snapshot → client mirror round trip (deltas, removals, light refs, no Map/Set, smoothing).
import assert from 'node:assert';
const V='?v=fx-205';
const {createHostSync,hostSnapshot,hostEvents,createClientSync,applySnapshot,smoothArrays,resetHostSync}=await import('../dist/net-sync.js'+V);
const H=createHostSync(),C=createClientSync();
const boss={id:1,x:100,y:200,hp:500,maxHp:500,role:'boss',special:{kind:'hook',elapsed:.2,lane:{kind:'lane',x:1,y:2}},seen:new Set([1]),particles:[1,2,3]};
const imp={id:2,x:50,y:60,hp:10,maxHp:10,role:'swarmer'};
const hazard={kind:'explosion',x:5,y:6,owner:1,target:boss};
const me={id:0,x:10,y:20};
const snap=()=>JSON.parse(hostSnapshot(H,{channels:{e:[boss,imp],h:[hazard]},shared:{clock:12.345678,level:3},players:[{rec:{id:0,x:me.x,y:me.y},kit:{classId:'mage',mage:{energy:{value:50},particles:[9,9]}}}],light:new Set([boss,imp,me])}));
let s1=snap();assert(applySnapshot(C,s1));
const cb=C.arrays.e.find(e=>e.id===1);assert.equal(cb.hp,500);assert.equal(cb.special.kind,'hook');assert(!('seen' in cb),'Set dropped');assert(!('particles' in cb),'particles skipped');
assert.equal(C.arrays.h[0].target.id,1);assert(!('hp' in C.arrays.h[0].target),'entity refs shrink to a light reference');
assert.equal(C.shared.clock,12.35,'numbers rounded');assert.equal(C.players[0].k.mage.particles,undefined);
// delta: only changed fields travel; positions become smoothing targets
boss.x=140;boss.hp=480;const s2=snap();const d=s2.ch.e.d;assert.equal(d.length,1,'only the boss changed');assert.deepEqual(Object.keys(d[0][1]).sort(),['hp','x']);
applySnapshot(C,s2);assert.equal(cb.hp,480);assert.equal(cb.x,100);assert.equal(cb._tx,140);C.offset=performance.now()-C.ht-200;smoothArrays(C,1);  /* Oct 19: interpolation renders INTERP ms in the past; jump the clock past the newest sample */assert(Math.abs(cb.x-140)<1,'smoothed toward target');
// removal + stale snapshot ignored
const s3=JSON.parse(hostSnapshot(H,{channels:{e:[boss],h:[]},shared:{},players:[],light:new Set()}));applySnapshot(C,s3);assert.equal(C.arrays.e.length,1);assert.equal(C.arrays.h.length,0);
assert.equal(applySnapshot(C,s2),false,'older snapshot ignored');
// events + full resync
hostEvents(H,[{type:'hit',x:1,y:2,damage:5,target:boss},{type:'secret'}],new Set(['hit']));resetHostSync(H);
const s4=JSON.parse(hostSnapshot(H,{channels:{e:[boss]},shared:{},players:[],light:new Set([boss])}));assert.equal(s4.ev.length,1);assert.equal(s4.ev[0].target.id,1);assert(Object.keys(s4.ch.e.d[0][1]).length>3,'full resend after reset');
console.log('net-sync smoke OK',JSON.stringify(s1).length+' bytes first snapshot');

// Several reliable packets can arrive before one render: retain all kit deltas, consume FX once.
const B=createClientSync();
const packet=(n,k)=>({n,ch:{},s:{levelPause:{left:20}},p:[{r:{id:7,steam:'friend'},k}],ev:[]});
applySnapshot(B,packet(1,{classId:'mage',s:{pendingPicks:['spell'],offer:{options:['Ice Road']}},c:{projectiles:[]},mage:{energy:{value:100}},ne:[{life:1}]}));
applySnapshot(B,packet(2,{classId:'mage',mage:{energy:{value:90}}}));
applySnapshot(B,packet(3,{classId:'mage'}));
assert.equal(B.players[0].k.s.offer.options[0],'Ice Road','initial offer survives burst delivery');
assert.equal(B.players[0].k.s.pendingPicks.length,1);
assert.deepEqual(B.players[0].k.c.projectiles,[]);
assert.equal(B.players[0].k.mage.energy.value,90);
assert.equal(B.players[0].k.ne.splice(0).length,1);
applySnapshot(B,packet(4,{classId:'mage',s:{offer:null,pendingPicks:[]}}));
assert.equal(B.players[0].k.ne.length,0,'cosmetics are not replayed');
assert.equal(B.players[0].k.s.offer,null,'explicit clear survives');
applySnapshot(B,{n:5,ch:{},p:[],s:{}});assert.equal(B.playerStates.size,0);

// Real mage FX-shaped particles used to resend the entire pool on each movement tick.
const pool=Array.from({length:400},(_,i)=>({kind:'flake',x:i,y:i,z:30,vx:20,vy:10,vz:40,g:120,drag:2.2,grow:0,rot:1,vr:2,life:.6,max:.8,size:2,color:'#e6f6ff'}));
const P=createHostSync();
const stress=()=>hostSnapshot(P,{channels:{},shared:{},players:Array.from({length:5},(_,id)=>({id,rec:{id},kit:{classId:'mage',mage:{efx:pool,fxTargets:[boss]},ne:pool,np:pool}})),light:new Set()});
stress();for(const p of pool){p.x+=1;p.life-=.05;}
const stressJSON=stress(),stressMsg=JSON.parse(stressJSON);
assert(stressJSON.length<2500,'five-player cosmetic traffic stays bounded');
for(const p of stressMsg.p){assert(!p.k.mage?.efx);assert(!p.k.mage?.fxTargets);}
console.log('burst/card + five-player spell FX regression OK:',stressJSON.length,'bytes vs',JSON.stringify(pool).length*5,'bytes of old efx pools alone');

// Drive the actual Ice Road cast/FX simulation while snapshots arrive in bursts.
const {createCombat}=await import('../dist/combat.js'+V);
const {createSurvival}=await import('../dist/survival.js'+V);
const {createMage,requestMage,tickMage}=await import('../dist/mage.js'+V);
const {spellId}=await import('../dist/specializations.js'+V);
const {ageEFx}=await import('../dist/mage-e-fx.js'+V);
const combat=createCombat(),survival=createSurvival(combat),mage=createMage(survival);
survival.path='cryo';survival.skills={[spellId('cryo','RMB')]:1};
const caster={x:1800,y:1400,row:0},aim={x:2100,y:1400};
combat.targets=[];
const realH=createHostSync(),realC=createClientSync(),sent=new WeakSet();let maxFX=0,maxWire=0,casts=0;
const remote={efx:[]};
for(let frame=0;frame<300;frame++){
  if(frame%36===0){mage.energy.value=100;if(requestMage(mage,combat,survival,caster,aim,'fireball',[]))casts++;}
  tickMage(mage,combat,survival,caster,aim,[],1/60);
  maxFX=Math.max(maxFX,mage.efx?.length??0);
  if(frame%3===0){const ne=(mage.efx??[]).filter(p=>{if(sent.has(p))return false;sent.add(p);return true;});
    const wire=hostSnapshot(realH,{channels:{},shared:{},players:[{id:0,rec:{id:0},kit:{classId:'mage',mage,ne}}],light:new Set()});
    maxWire=Math.max(maxWire,wire.length);applySnapshot(realC,JSON.parse(wire));}
  if(frame%12===0){const k=realC.players[0]?.k;if(k?.ne)remote.efx.push(...k.ne.splice(0));}
  ageEFx(remote,1/60);
}
assert(casts>=7,'repeated real Ice Road casts fired');assert(maxFX>30,'real efx pool was exercised');
assert(maxWire<16000,'Ice Road snapshots no longer contain the growing full FX pool');
for(let i=0;i<180;i++)ageEFx(remote,1/60);
assert.equal(remote.efx.length,0,'remote particles expire locally');
console.log('Real Ice Road integration OK:',{casts,maxFX,maxSnapshotBytes:maxWire});
