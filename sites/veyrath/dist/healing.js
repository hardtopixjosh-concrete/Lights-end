// Oct 15 healing batch: low passive regen, random HP pack drops and one
// rechargeable healing pool. All values are playtest seeds.
import {blocked} from './simulation.js?v=fx-260';
export const HEALING={regen:.8,regenDelay:3,packHeal:.20,packLife:30,pickup:42,magnet:90,
 // Oct 16 (user): HP orbs halved for ordinary mobs (swarmer .03, bruiser .08 before); elites and bosses unchanged.
 dropChance:{swarmer:.015,bruiser:.04,leader:.30,boss:1},
 pool:{radius:72,capacity:.9,rate:.18,refill:75}};
// Pool sits ~700 units from spawn, away from the forge, on open ground.
function poolSpot(spawn,forge,props){
 for(let i=0;i<24;i++){const a=i*Math.PI*2/24+.4,d=650+(i%3)*120,x=spawn.x+Math.cos(a)*d,y=spawn.y+Math.sin(a)*d;
  if(Math.hypot(x-forge.x,y-forge.y)>450&&!blocked(x,y,props,80))return {x,y};}
 return {x:spawn.x+600,y:spawn.y};
}
export function createHealing(spawn,forge,props=[]){return {packs:[],pool:{...poolSpot(spawn,forge,props),charge:1,refillIn:0,healing:false},clock:0};}
// Oct 18 (user: "friend cant pick up hp potions"): every living party member regens, picks up packs and uses the pool.
// mates = [{p,s,by}] for teammates (their kit survival); the local player stays (s,p) and its events carry no `by`.
export function tickHealing(h,s,p,events,dt,rng=Math.random,mates=[]){
 const out=[];h.clock+=dt;
 for(const e of events)if(e.type==='death'&&rng()<(HEALING.dropChance[e.role]??HEALING.dropChance.swarmer))h.packs.push({x:e.x+(rng()-.5)*20,y:e.y+(rng()-.5)*20,age:0,magnet:false});
 const all=[{p,s,by:null},...mates].filter(m=>m.s&&!m.s.dead&&!m.s.downed),hurt=m=>m.s.hp<m.s.maxHp;
 const heal=(m,amount)=>{const before=m.s.hp;m.s.hp=Math.min(m.s.maxHp,m.s.hp+amount);return m.s.hp-before;};
 const tag=(m,e)=>{if(m.by!=null)e.by=m.by;return e;};
 // Passive regen pauses briefly after taking damage.
 for(const m of all){if(m.s.hurt>0)m.s.lastHurtAt=h.clock;if(h.clock-(m.s.lastHurtAt??-99)>=HEALING.regenDelay)heal(m,(HEALING.regen+(m.s.buffStats?.regen??0))*(m.s.mods?.regen??1)*dt);}
 for(let i=h.packs.length-1;i>=0;i--){const k=h.packs[i];k.age+=dt;
  if(k.age>HEALING.packLife){h.packs.splice(i,1);continue;}
  let m=null,d=Infinity;for(const q of all){if(!hurt(q))continue;const dq=Math.hypot(q.p.x-k.x,q.p.y-k.y);if(dq<d){d=dq;m=q;}}
  if(!m)continue;if(d<=HEALING.magnet)k.magnet=true;
  if(k.magnet){const dx=m.p.x-k.x,dy=m.p.y-k.y,step=Math.min(d,600*dt);k.x+=dx/(d||1)*step;k.y+=dy/(d||1)*step;}
  if(d<=HEALING.pickup){const amount=heal(m,m.s.maxHp*HEALING.packHeal);h.packs.splice(i,1);out.push(tag(m,{type:'healPack',amount:Math.round(amount)}));}
 }
 // Pool: heals whoever stands in it and drains its charge; refills when empty.
 const pool=h.pool;pool.healing=false;
 if(pool.charge<=0){pool.refillIn=Math.max(0,pool.refillIn-dt);if(!pool.refillIn){pool.charge=1;out.push({type:'worldNotice',text:'The healing pool has refilled'});}}
 else for(const m of all){if(pool.charge<=0||!hurt(m)||Math.hypot(m.p.x-pool.x,m.p.y-pool.y)>HEALING.pool.radius)continue;
  const want=m.s.maxHp*HEALING.pool.rate*dt,budget=pool.charge*m.s.maxHp*HEALING.pool.capacity,amount=heal(m,Math.min(want,budget));pool.charge=Math.max(0,pool.charge-amount/(m.s.maxHp*HEALING.pool.capacity));pool.healing=pool.healing||amount>0;
  if(pool.charge<=1e-4){pool.charge=0;pool.refillIn=HEALING.pool.refill;out.push({type:'worldNotice',text:'The healing pool is dry · refills in '+HEALING.pool.refill+'s'});}}
 return out;
}
export const healingMarkers=h=>[{key:'heal-pool',kind:'healPool',x:h.pool.x,y:h.pool.y,status:h.pool.charge>0?'ready':'cooldown',active:true}];
export function drawHealing(ctx,h,heart,visible){
 const pool=h.pool,R=HEALING.pool.radius;
 if(visible(pool.x,pool.y,R+20)){ctx.save();ctx.translate(pool.x,pool.y);ctx.scale(1,.55);
  ctx.fillStyle='#3b2f22';ctx.beginPath();ctx.arc(0,0,R+8,0,Math.PI*2);ctx.fill();
  const g=ctx.createRadialGradient(0,0,4,0,0,R);const full=pool.charge>0;g.addColorStop(0,full?'#ff9fb0':'#5a4a40');g.addColorStop(.6,full?'#d0344f':'#4a3a32');g.addColorStop(1,full?'#7a1428':'#3a2e28');
  ctx.globalAlpha=full?.55+.45*pool.charge:.9;ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*(full?.55+.45*pool.charge:.9),0,Math.PI*2);ctx.fill();
  if(full){ctx.globalAlpha=.25+.15*Math.sin(h.clock*3);ctx.strokeStyle='#ffd0d8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,R*(.7+.1*Math.sin(h.clock*2)),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
  if(full&&pool.healing){ctx.save();ctx.fillStyle='#ffb3c1';for(let i=0;i<5;i++){const t=(h.clock*.8+i/5)%1;ctx.globalAlpha=1-t;ctx.fillRect(pool.x+Math.sin(i*2.3)*R*.5-2,pool.y-t*60,4,4);}ctx.restore();}
  if(!full){ctx.save();ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillStyle='#d8cbb8';ctx.fillText(Math.ceil(pool.refillIn)+'s',pool.x,pool.y-R*.6-6);ctx.restore();}}
 for(const k of h.packs){if(!visible(k.x,k.y,30))continue;const fade=k.age>HEALING.packLife-5?(Math.sin(k.age*14)>0?1:.35):1,bob=Math.sin(k.age*4)*3;ctx.save();ctx.globalAlpha=fade;ctx.imageSmoothingEnabled=false;ctx.shadowColor='#ff5d73';ctx.shadowBlur=10;
  if(heart?.complete&&heart.naturalWidth){/* Oct 18 (user): hot sauce bottle sprite, square cells */const cell=heart.naturalHeight,frames=Math.max(1,Math.round(heart.naturalWidth/cell)),f=Math.floor(k.age*10)%frames;ctx.drawImage(heart,f*cell,0,cell,cell,k.x-17,k.y-36+bob,34,34);}
  else{ctx.fillStyle='#e8344f';ctx.fillRect(k.x-8,k.y-24+bob,16,16);}
  ctx.restore();}
}
