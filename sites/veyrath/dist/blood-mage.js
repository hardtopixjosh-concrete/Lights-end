import {boundedHeal,grantBarrier,outputAmount} from './core-rules.js?v=fx-260';
import {blocked,directionRow} from './simulation.js?v=fx-260';
import {damageEnemy} from './combat.js?v=fx-260';
import {shieldBlocksAttack} from './forge-shield.js?v=fx-260';
import {projectileHitsBody} from './projectile-contact.js?v=fx-260';
import {talentBonus,talentFlag} from './specializations.js?v=fx-260';
const flag=(s,id)=>talentFlag(s,id),bonus=(s,stat,key)=>talentBonus(s,stat,key);
// Oct 15 user decision: Sanguine Drain moves to RMB; E becomes Crimson Bloom (cursor AoE, replaces Blood Lance).
// Oct 15 talent pass: talent keys now follow the slot again (Drain = RMB tree branch, Bloom = E branch).
const BLOOD_SLOTS={fireball:'drain',chain:'bloom',nova:'veil',meteor:'eclipse',blink:'blink'},BLOOD_KEYS={drain:'RMB',bloom:'E',veil:'Q',eclipse:'R',blink:'SPACE'};
export function bloodAbility(s,kind){const spell=BLOOD_SLOTS[kind],key=BLOOD_KEYS[spell],factor=stat=>1+bonus(s,stat,key);
 const base={bloom:{name:'Crimson Bloom',cost:28,cooldown:1,damage:220,radius:140,range:460,duration:.4},veil:{name:'Crimson Veil',cost:25,cooldown:3,barrier:50,wardTime:3,duration:.35},drain:{name:'Sanguine Drain',cost:25,cooldown:1.5,damage:120,range:460,life:2,duration:2},eclipse:{name:'Blood Eclipse',cost:60,cooldown:10,damage:100,radius:175,life:5,duration:.5},blink:{name:'Blink',cost:0,cooldown:3,duration:.2}}[spell];
 if(!base)return null;
 return {...base,kind,spell,element:'blood',key,cost:base.cost*Math.max(.6,1-bonus(s,'cost',key)),cooldown:base.cooldown*Math.max(.6,1-bonus(s,'cooldown',key)),damage:(base.damage??0)*factor('damage'),range:(base.range??0)*factor('range')+(base.range?(s.weaponPassives?.spellRange??0):0),radius:(base.radius??0)*factor('radius'),speed:(base.speed??0)*factor('speed'),pierce:(base.pierce??1)+bonus(s,'pierce',key),barrier:(base.barrier??0)*factor('barrier'),width:18*factor('radius'),contactRadius:12*factor('radius'),wardTime:(base.wardTime??0)*factor('duration'),life:(base.life??0)*factor('duration')};
}
const living=c=>c.targets.filter(e=>e.state==='alive'&&!(e.emerge>0)&&!(e.invulnerable>0));
function clear(a,b,props,shield){if(shieldBlocksAttack(shield,a,b))return false;const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,props,0,true))return false;return true;}
function targetAt(c,p,angle,range,props,width=18){
 let result=null,best=Infinity;for(const e of living(c)){if(e.noDrain)continue;const dx=e.x-p.x,dy=e.y-p.y,along=dx*Math.cos(angle)+dy*Math.sin(angle),side=Math.abs(dx*Math.sin(angle)-dy*Math.cos(angle));if(along>=0&&along<=range&&side<=width+(e.radius??12)&&along<best&&clear(p,e,props,c.forgeShield)){result=e;best=along;}}return result;
}
const angleAt=(p,aim)=>aim?Math.atan2(aim.y+30-p.y,aim.x-p.x):p.row*Math.PI/4;
function effect(m,kind,p,radius=120){m.effects.push({kind,element:'blood',x:p.x,y:p.y,radius,age:0,duration:.65});}
export function stopDrain(m){if(m.pending?.bloodChannel)m.pending=null;m.drain=null;if(m.channel?.kind==='drain')m.channel=null;m.drainHeld=false;}
export function requestBlood(m,c,s,p,aim,kind,props=[]){
 const spec=bloodAbility(s,kind);if(!spec||s.dead||s.stun>0||m.cast||m.drain||m.blinkTime>0||c.hitstop>0||m.cooldowns[kind]>0||m.energy.value<spec.cost)return false;
 spec.weapon={...c.weapon};(m.bloodEvents??=[]).push({type:'mageCast',kind,x:p.x,y:p.y});m.energy.value-=spec.cost;m.energy.since=0;m.cooldowns[kind]=spec.cooldown;m.queued=false;m.beam=null;
 const angle=angleAt(p,aim);m.bloodProjectiles??=[];m.bloodZones??=[];m.bloodRepeats??=[];
 if(spec.spell==='drain'){m.drainHeld=true;m.drain={elapsed:0,next:.5,ticks:0,success:0,healed:0,spec,angle,targetId:null};m.channel={kind:'drain',row:directionRow(Math.cos(angle),Math.sin(angle)),elapsed:0,duration:2};return true;}
 m.cast={kind,spec,elapsed:0,duration:spec.duration,row:directionRow(Math.cos(angle),Math.sin(angle)),fired:true,angle};m.castOrigin={x:p.x,y:p.y-38};
 if(spec.spell==='veil'){m.bloodVeil={remaining:spec.wardTime,x:p.x,y:p.y};grantBarrier(s,outputAmount(spec.barrier,c.weapon,'barrier'),spec.wardTime);effect(m,'nova',p,90);}
 if(spec.spell==='bloom'){
  // Crimson Bloom: a blood pool forms at the cursor (range-capped, terrain/dome checked), then erupts.
  const power=m.hungryLance?1.3:1;m.hungryLance=false;const dx=(aim?.x??p.x)-p.x,dy=(aim?.y??p.y)-p.y,n=Math.hypot(dx,dy)||1,dist=Math.min(n,spec.range);let x=p.x,y=p.y;
  for(let t=4;t<=dist;t+=4){const nx=p.x+dx/n*t,ny=p.y+dy/n*t;if(!clear(p,{x:nx,y:ny},props,c.forgeShield))break;x=nx;y=ny;}
  (m.bloodBlooms??=[]).push({x,y,origin:{...p},age:0,delay:.35,spec:{...spec,damage:spec.damage*power},done:false});
 }
 if(spec.spell==='eclipse'){const dx=(aim?.x??p.x)-p.x,dy=(aim?.y??p.y)-p.y,n=Math.hypot(dx,dy)||1,dist=Math.min(n,480);const center={x:p.x+dx/n*dist,y:p.y+dy/n*dist};if(clear(p,center,props,c.forgeShield))m.bloodZones.push({...center,origin:{...p},spec,age:0,next:1.5,ticks:0,consumed:new Set()});effect(m,'nova',center,spec.radius);}
 return true;
}
function launch(m,p,angle,spec,secondary=false){if((m.bloodProjectiles??=[]).length<32)m.bloodProjectiles.push({x:p.x,y:p.y,origin:{...p},angle,spec,remaining:spec.range,hit:new Set(),secondary});}
function hit(c,s,e,damage,p,props,key,secondary=false,weapon=null,dot=false){return damageEnemy(c,e,damage*(e.bloodBleed?1+bonus(s,'vsBleeding',key):1)*(e.bloodMarks?1+.15*e.bloodMarks.n:1)/* Oct 19 Sacrificial Book blood marks */,p,{weapon:weapon??c.weapon,dot,props,push:0,stagger:.08,source:'blood',secondary});}
function heal(m,c,s,d,amount){
 // Oct 15: heals from blood-marked targets (bleeding or Eclipse-soaked) are 60% stronger with a 50% higher cap.
 const efficiency=1+bonus(s,'healing','RMB'),cap=Math.min(d.marked?216:144,96*efficiency*(flag(s,'bloodFeast')?1.25:1)*(d.marked?1.5:1)),allowed=Math.max(0,Math.min(amount*(s.world?.healing??1),cap-d.healed)),missing=Math.max(0,s.maxHp-s.hp),actual=boundedHeal(c,s,Math.min(missing,allowed)*(1+(c.weapon?.output?.healing??0)));d.healed+=allowed;
 if(flag(s,'livingVeil')&&allowed>actual){const ward=Math.min(40,(allowed-actual)*.25);grantBarrier(s,ward,3);}
 return actual;
}
export function tickBlood(m,c,s,p,aim,props,dt){
 const events=(m.bloodEvents??=[]).splice(0);if(m.bloodVeil){Object.assign(m.bloodVeil,{x:p.x,y:p.y,remaining:m.bloodVeil.remaining-dt});if(m.bloodVeil.remaining<=0||s.barrier<=0)m.bloodVeil=null;}if(s.dead||s.stun>0){stopDrain(m);return events;}
 for(const e of c.targets)if(e.bloodBleed&&!e.timeStopped&&e.state==='alive'){const b=e.bloodBleed;b.remaining-=dt;b.pulse-=dt;if(b.pulse<=0&&b.remaining>=0){b.pulse+=.5;if(!shieldBlocksAttack(c.forgeShield,e,e))events.push(...hit(c,s,e,b.damage,p,props,'RMB',true,b.weapon,true));}if(b.remaining<=0)e.bloodBleed=null;}
 for(const b of m.bloodRepeats??[])b.delay-=dt;
 for(const b of (m.bloodRepeats??[]).filter(b=>b.delay<=0))launch(m,b.origin,b.angle,b.spec,true);
 m.bloodRepeats=(m.bloodRepeats??[]).filter(b=>b.delay>0);
 for(const b of m.bloodProjectiles??[]){const travel=Math.min(b.remaining,b.spec.speed*dt),steps=Math.max(1,Math.ceil(travel/4));
  for(let i=0;i<steps&&b.remaining>0;i++){const next={x:b.x+Math.cos(b.angle)*travel/steps,y:b.y+Math.sin(b.angle)*travel/steps};if(!clear(b,next,props,c.forgeShield)){b.remaining=0;break;}Object.assign(b,next);b.remaining-=travel/steps;
   for(const e of living(c))if(!b.hit.has(e.id)&&projectileHitsBody({...b,contactRadius:b.spec.contactRadius},e)&&clear(b.origin,e,props,c.forgeShield)){b.hit.add(e.id);const hits=hit(c,s,e,b.spec.damage,b.origin,props,'RMB',b.secondary);events.push(...hits);if(hits.some(x=>x.type==='hit')){if(flag(s,'hemorrhage')&&e.state==='alive')e.bloodBleed={weapon:b.spec.weapon,remaining:4*(1+bonus(s,'bleedDuration','RMB')),pulse:.5,damage:20};effect(m,'bolt',e,60);}if(b.hit.size>=b.spec.pierce){b.remaining=0;break;}}
  }
 }m.bloodProjectiles=(m.bloodProjectiles??[]).filter(b=>b.remaining>0);
 const d=m.drain;
 if(d){
  if(!m.drainHeld){stopDrain(m);return events;}d.elapsed=Math.min(2,d.elapsed+dt);d.angle=angleAt(p,aim);m.energy.since=0;
  const primary=targetAt(c,p,d.angle,d.spec.range,props,d.spec.width);if(d.targetId!==null&&!primary){stopDrain(m);return events;}d.targetId=primary?.id??null;
  m.channel={kind:'drain',row:directionRow(Math.cos(d.angle),Math.sin(d.angle)),elapsed:d.elapsed,duration:2};m.drainLine=primary?{x:p.x,y:p.y,toX:primary.x,toY:primary.y}:{x:p.x,y:p.y,toX:p.x+Math.cos(d.angle)*d.spec.range,toY:p.y+Math.sin(d.angle)*d.spec.range};
  while(d.elapsed+1e-8>=d.next&&d.ticks<4){d.ticks++;d.next+=.5;let recovered=0;
   if(primary&&primary.state==='alive'){const before=primary.hp,bleeding=!!primary.bloodBleed,marked=bleeding||primary.bloodSoaked>0,hits=hit(c,s,primary,d.spec.damage,p,props,'RMB',false,d.spec.weapon);events.push(...hits);const actual=before-primary.hp;
    if(actual>0){d.success++;const efficiency=1+bonus(s,'healing','RMB'),feast=bleeding&&flag(s,'bloodFeast')?1.25:1,mark=marked?1.6:1;if(marked)d.marked=true;recovered+=heal(m,c,s,d,Math.min(24*efficiency*feast*mark,actual*.2*efficiency*feast*mark));
     if(flag(s,'crimsonTorrent')){const second=living(c).find(e=>e!==primary&&Math.hypot(e.x-primary.x,e.y-primary.y)<150&&clear(p,e,props,c.forgeShield));if(second){const old=second.hp;events.push(...hit(c,s,second,d.spec.damage*.5,p,props,'RMB',true,d.spec.weapon));recovered+=heal(m,c,s,d,Math.min(6*efficiency,(old-second.hp)*.2*.25*efficiency));}}
    }
   }
   if(recovered)events.push({type:'mageHeal',amount:Math.round(recovered*10)/10});
  }
  if(d.ticks>=4){if(d.success===4&&flag(s,'eternalHunger'))m.hungryLance=true;stopDrain(m);}
 }
 for(const b of m.bloodBlooms??[]){b.age+=dt;if(b.done||b.age<b.delay)continue;b.done=true;let healed=0;if(!b.echo)events.push({type:'spellImpact',sound:'blood-chain-impact',x:b.x,y:b.y});
  for(const e of living(c))if(Math.hypot(e.x-b.x,(e.y-b.y)/.65)<b.spec.radius+(e.radius??12)&&clear(b,e,props,c.forgeShield)){const wasBleeding=!!e.bloodBleed,marked=wasBleeding||e.bloodSoaked>0,hits=hit(c,s,e,b.spec.damage,b,props,'E',!!b.echo,b.spec.weapon);events.push(...hits);if(hits.some(x=>x.type==='hit')){if(e.state==='alive')e.bloodBleed={weapon:b.spec.weapon,remaining:4*(1+bonus(s,'bleedDuration','E')),pulse:.5,damage:wasBleeding&&flag(s,'hemorrhage')?40:20};if(wasBleeding&&flag(s,'hemorrhage'))m.effects.push({kind:'hemoBurst',element:'blood',x:e.x,y:e.y,age:0,duration:.6});healed+=marked?8:4;}}
  const amount=Math.min(40,healed)*(s.world?.healing??1),actual=Math.min(amount,Math.max(0,s.maxHp-s.hp));if(actual>0){boundedHeal(c,s,actual);events.push({type:'mageHeal',amount:Math.round(actual)});}
  m.effects.push({kind:'bloom',element:'blood',x:b.x,y:b.y,radius:b.spec.radius,age:0,duration:1});
  if(!b.echo&&flag(s,'secondBloom'))(m.bloodBloomEchoes??=[]).push({...b,age:0,delay:.6,done:false,echo:true,spec:{...b.spec,damage:b.spec.damage*.5}});}
 if(m.bloodBloomEchoes?.length){(m.bloodBlooms??=[]).push(...m.bloodBloomEchoes);m.bloodBloomEchoes=[];}
 m.bloodBlooms=(m.bloodBlooms??[]).filter(b=>!b.done||b.age<b.delay+.1);
 // Eclipse blood: enemies that walk through the pool get soaked and leave a 5s blood trail that hurts enemies.
 for(const e of c.targets)if(e.bloodSoaked>0){e.bloodSoaked-=dt;if(e.state!=='alive')continue;e.bloodTrailClock=(e.bloodTrailClock??0)-dt;if(e.bloodTrailClock<=0){e.bloodTrailClock=.1;(m.bloodTrail??=[]).push({x:e.x,y:e.y,age:0,id:e.id});if(m.bloodTrail.length>400)m.bloodTrail.shift();}}
 for(const t of m.bloodTrail??[])t.age+=dt;if(m.bloodTrail)m.bloodTrail=m.bloodTrail.filter(t=>t.age<5);
 m.bloodTrailTick=(m.bloodTrailTick??.5)-dt;if(m.bloodTrailTick<=0&&m.bloodTrail?.length){m.bloodTrailTick=.5;for(const e of living(c))if(m.bloodTrail.some(t=>Math.hypot(e.x-t.x,(e.y-t.y)/.65)<30+(e.radius??12)))events.push(...hit(c,s,e,8,e,props,'R',true));}
 for(const z of m.bloodZones??[]){z.age+=dt;for(const e of living(c))if(z.age<z.spec.life&&Math.hypot(e.x-z.x,(e.y-z.y)/.65)<z.spec.radius+(e.radius??12))e.bloodSoaked=4;while(z.age+1e-8>=z.next&&z.ticks<Math.ceil(z.spec.life)){const fraction=Math.min(1,z.spec.life-z.ticks);z.ticks++;z.next=Math.min(z.spec.life+.5,z.ticks+1.5);
   for(const e of living(c))if(Math.hypot(e.x-z.x,(e.y-z.y)/.65)<z.spec.radius+(e.radius??12)&&(blocked(z.x,z.y,props,0,true)||clear(z,e,props,c.forgeShield))){
    // Reaction (Oct 16): BLOOD GEYSER — Eclipse erupts once from every bleeding enemy under it.
    if(e.bloodBleed&&!(z.geysers??=new Set()).has(e.id)){z.geysers.add(e.id);effect(m,'bolt',e,80);events.push({type:'reaction',name:'BLOOD GEYSER',x:e.x,y:e.y});for(const o of living(c))if(Math.hypot(o.x-e.x,(o.y-e.y)/.65)<80+(o.radius??12))events.push(...hit(c,s,o,60,e,props,'R'));}
    if(flag(s,'bloodDominion')&&e.bloodBleed&&!z.consumed.has(e.id)){z.consumed.add(e.id);const burst=Math.min(120,e.bloodBleed.damage*Math.floor(e.bloodBleed.remaining/.5));e.bloodBleed=null;events.push(...hit(c,s,e,burst,z.origin,props,'R',true));}
    const zh=hit(c,s,e,z.spec.damage*fraction,z.origin,props,'R',false,z.spec.weapon);events.push(...zh);effect(m,'bolt',e,55);if(flag(s,'eclipseHarvest')&&zh.some(v=>v.type==='death'))boundedHeal(c,s,s.maxHp*.02*(s.world?.healing??1));
   }
  }
 }m.bloodZones=(m.bloodZones??[]).filter(z=>z.age<z.spec.life+.5);
 return events;
}
export function drawBlood(ctx,m,ground=false){
 const colors=['#e6a2b1','#9c294b','#f2c0c6'];
 // Eclipse zones, Veil and Lance visuals moved to mage-spell-fx.js; only the Drain beam stays here.
 if(ground)return;
 // Drain beam is drawn by mage-spell-fx.js (thick neon beam, Oct 15).
}
