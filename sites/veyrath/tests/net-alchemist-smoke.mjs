import assert from 'node:assert/strict';
const V='?v=fx-205';
const {createRanger,requestRanger,tickRanger}=await import('../dist/ranger.js'+V);
const {spellId}=await import('../dist/specializations.js'+V);
const {drawRangerGround,drawRangerUpper}=await import('../dist/ranger-render.js'+V);
const {createHostSync,hostSnapshot,createClientSync,applySnapshot}=await import('../dist/net-sync.js'+V);
const s={classId:'ranger',path:'alchemist',skills:{[spellId('alchemist','RMB')]:1,catalystDouble:1},level:10,world:{}};
const r=createRanger(s),p={x:100,y:100,row:0},aim={x:300,y:100},c={targets:[],weapon:{damage:1},kills:0};
const H=createHostSync(),C=createClientSync();let draws=0;
const ctx=new Proxy({},{get:(t,k)=>k==='createRadialGradient'?()=>({addColorStop(){}}):k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
for(let cast=0;cast<8;cast++){
 r.momentum=100;r.cooldowns.RMB=0;
 assert(requestRanger(r,c,s,p,aim,'RMB'));
 assert.equal(r.flasks.length,2);assert.equal(r.flasks[0].spec,r.flasks[1].spec,'real cast shares its spec');
 for(let frame=0;frame<24;frame++){
  const wire=hostSnapshot(H,{channels:{},shared:{},players:[{id:1,rec:{id:1},kit:{classId:'ranger',ranger:r}}],light:new Set()});
  applySnapshot(C,JSON.parse(wire));
  const mirror=Object.assign(createRanger(),C.players[0].k.ranger);
  for(const f of mirror.flasks)assert.equal(f.spec.radius,75,'both flask specs survive serialization');
  for(const shaders of [false,true]){drawRangerGround(ctx,mirror,frame/60,p,[],shaders);drawRangerUpper(ctx,mirror,frame/60,p,[],()=>{},shaders);draws++;}
  tickRanger(r,c,s,p,aim,[],1/60,{x:0,y:0});
 }
}
const common={radius:75},a={spec:common},b={spec:common};a.self=a;
const cyc=JSON.parse(hostSnapshot(createHostSync(),{channels:{},shared:{nested:[a,b],again:common},players:[],light:new Set()}));
assert.equal(cyc.s.nested[0].self,undefined,'real cycle omitted');
assert.deepEqual(cyc.s.nested[0].spec,cyc.s.nested[1].spec);assert.equal(cyc.s.again.radius,75);
console.log('Alchemist network/render integration passed:',8,'double casts,',draws,'Canvas/shader render passes; shared references and cycles correct.');
