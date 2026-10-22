import {ownStatuses,fieldContact,applyWeaken} from './status-ownership.js?v=fx-260';
import {boundedHeal,outputAmount,grantBarrier,refundCast,boundedBurst,beginAction} from './core-rules.js?v=fx-260';
import {blocked,directionRow,movePlayer,clamp} from './simulation.js?v=fx-260';
import {clearAttackInput,damageEnemy,strikeConnects} from './combat.js?v=fx-260';
import {shieldBlocksAttack} from './forge-shield.js?v=fx-260';
import {talentBonus,rank,spellOwned} from './specializations.js?v=fx-260';

// Oct 15 user decision: Warlord R Conqueror's Wrath replaced by Bladestorm, reusing the previously approved
// Swordsman Blade Storm values (3s, .28s pulses, 145 radius, 32 base x old global 2 = 64 absolute).
// Oct 15 user redesign (playtest values): Berserker Q longer/stronger + R enrage buff; Vanguard cone RMB,
// exploding parry, Bastion Dome R; Spellblade rebuilt around void (waves, exploding barrier dome, dark-matter orbs,
// chaining ascension); Warlord stronger cry, Earthquake E and pulling Bladestorm.
// PDF values are prototype targets. Unspecified footprints, counter/bleed and
// ultimate proc coefficients below are implementation defaults, not balance locks.
export const WARRIOR_KITS={
 berserker:{RMB:{name:'Savage Rush',cooldown:1,damage:400,kind:'rush',duration:.3},Q:{name:'Bloodletting',cooldown:3,kind:'bloodlust',duration:7,damage:80},E:{name:'Carnage',cooldown:1.5,damage:180,kind:'carnage',radius:145},R:{name:'Unchained Wrath',cooldown:14,kind:'wrath',duration:8}},
 vanguard:{RMB:{name:'Sundering Cleave',cooldown:1,damage:520,kind:'sunder',range:230},Q:{name:'Perfect Guard',cooldown:1.5,kind:'guard',duration:.25},E:{name:'Seismic Stomp',cooldown:1.5,damage:300,kind:'stomp',radius:170},R:{name:'Bastion Dome',cooldown:10,kind:'bastion',duration:8,radius:170}},
 spellblade:{RMB:{name:'Void Waves',cooldown:1,rage:16,damage:275,kind:'crescent',range:480},Q:{name:'Void Barrier',cooldown:4,kind:'barrier',duration:4},E:{name:'Dark Matter',cooldown:5,damage:160,kind:'darkmatter',radius:150,duration:5},R:{name:'Void Ascension',cooldown:10,kind:'overload',duration:8}},
 warlord:{RMB:{name:'Brutal Charge',cooldown:1,damage:400,kind:'charge',duration:.3},Q:{name:'War Cry',cooldown:4,kind:'cry',duration:7,radius:300,damage:120},E:{name:'Earthquake',cooldown:1.5,damage:220,kind:'earthbreaker',radius:290},R:{name:'Bladestorm',cooldown:8,damage:64,kind:'bladestorm',radius:145,duration:3}}
};
const buff=(s,stat,key)=>1+talentBonus(s,stat,key);
// Oct 15: Rage replaces long cooldowns. Built by landing basic hits and taking
// damage, decays out of combat. Values are playtest seeds.
export const RAGE={max:100,cost:{RMB:20,Q:25,E:30,R:50},perHit:4,perDamage:.5,decayDelay:4,decay:6};
export const rageCost=(key,s)=>Math.ceil((WARRIOR_KITS[s?.path]?.[key]?.rage??RAGE.cost[key]??0)*(s?Math.max(.6,1-talentBonus(s,'cost',key)):1));
function gainRage(w,amount){if(amount<=0)return;w.rage=Math.min(RAGE.max,(w.rage??0)+amount);w.rageIdle=0;}
export function warriorAbility(s,key){const path=s.specialization??s.path??'berserker',base=WARRIOR_KITS[path]?.[key]??WARRIOR_KITS.berserker[key];return base?{...base,key,cooldown:base.cooldown*Math.max(.6,1-talentBonus(s,'cooldown',key)),damage:(base.damage??0)*buff(s,'damage',key),radius:(base.radius??145)*buff(s,'radius',key),range:(base.range??330)*buff(s,'range',key)+(base.kind==='crescent'?s.weaponPassives?.spellRange??0:0),duration:(base.duration??.5)*buff(s,'duration',key)}:null;}
export function createWarrior(s){const w={rage:0,rageIdle:0,cooldowns:{RMB:0,Q:0,E:0,R:0},cast:null,buffs:{},projectiles:[],runes:[],effects:[],particles:[],pending:[],hitCount:0,manualCount:0,recentActions:new Set()};if(s)s.warrior=w;return w;}
function flair(w,kind,p,radius=145,angle=0){w.effects.push({kind,x:p.x,y:p.y,radius,angle,age:0,duration:kind==='rune'?.8:.6});if(w.effects.length>48)w.effects.shift();for(let i=0;i<18;i++){const a=i*Math.PI*2/18,v=55+(i%5)*25;w.particles.push({x:p.x,y:p.y-10,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.65-50,life:.55+(i%3)*.1,max:.75,size:2+i%3,color:['crescent','rune','barrier','overload','darkmatter'].includes(kind)?'#9b5cff':kind==='bloodlust'||kind==='wrath'?'#dd745b':'#d4b487'});}w.particles=w.particles.slice(-220);}
function bossStagger(e,amount){if(e.role!=='boss'||e.state!=='alive'||e.warriorStaggerCD>0)return;e.warriorStagger=Math.min(3,(e.warriorStagger??0)+amount);if(e.warriorStagger>=3){e.warriorStagger=0;e.warriorStaggerCD=3;e.swing=null;e.unparryable=false;e.cooldown=Math.max(e.cooldown??0,1.2);e.hurt=Math.max(e.hurt,1.2);}}
function hit(w,c,s,p,e,damage,props,opts={}){c.forgeShield=s.forgeShield;const events=damageEnemy(c,e,damage*rageMult(w,s)*(opts.ability==='RMB'&&s.path==='berserker'&&rank(s,'execution')&&e.hp/e.maxHp<.3?1.2:1),p,{weapon:w.cast?.weapon??c.weapon,props,...opts});if(events.some(v=>v.type==='hit')&&(opts.heavy||opts.counter))bossStagger(e,opts.stagger??.4);lifesteal(w,c,s,events);return events;}
function rageMult(w,s){return w.buffs.wrath>0?1.35*buff(s,'damage','R'):1;}
// Bloodletting (Oct 15): stacks of blood on enemies; the payoff burst deals damage x stacks.
const BLOOD_MAX=5;
function addBlood(e,n){if(e.state!=='alive')return;e.bloodStacks=Math.min(BLOOD_MAX,(e.bloodStacks??0)+n);e.bloodTick=e.bloodTick??.5;}
function bloodBurst(w,c,s,p,props){const events=[];for(const e of c.targets){const n=e.bloodStacks??0;if(!n)continue;e.bloodStacks=0;if(e.state!=='alive')continue;w.effects.push({kind:'bloodBurst',x:e.x,y:e.y,radius:40+n*12,angle:0,age:0,duration:.55,stacks:n});events.push(...hit(w,c,s,p,e,w.bloodSpec.damage*n*buff(s,'power','Q'),props,{stagger:.2*n,push:4+n*3}));
  // Behaviors (Oct 16): Blood Leap splashes stacks onto a neighbour; Blood Feast heals per burst.
  if(rank(s,'bloodFeed'))boundedHeal(c,s,outputAmount(s.maxHp*.03,c.weapon,'healing')*(s.world?.healing??1));
  if(rank(s,'bloodLeap')){const near=c.targets.find(t=>t!==e&&t.state==='alive'&&!(t.bloodStacks>0)&&Math.hypot(t.x-e.x,t.y-e.y)<180);if(near){addBlood(near,2);w.effects.push({kind:'bloodBurst',x:near.x,y:near.y,radius:30,angle:0,age:0,duration:.4,stacks:1});}}}w.bloodSpec=null;return events;}
// Unchained Wrath: 15% of all damage dealt returns as health.
function lifesteal(w,c,s,events){if(!(w.buffs.wrath>0))return;let d=0;for(const v of events)if(v.type==='hit')d+=v.actualDamage??v.damage??0;if(d>0)boundedHeal(c,s,d*.15*(s.world?.healing??1));}
function cone(w,c,s,p,angle,radius,halfArc,damage,props,opts={}){const events=[];for(const e of c.targets)if(strikeConnects(p,e,angle,{reach:radius,halfArc},props)&&!shieldBlocksAttack(s.forgeShield,p,e))events.push(...hit(w,c,s,p,e,damage,props,opts));return events;}
function area(w,c,s,p,radius,damage,props,opts={}){const events=[];for(const e of c.targets)if(strikeConnects(p,e,0,{reach:radius,halfArc:Math.PI},props)&&!shieldBlocksAttack(s.forgeShield,p,e))events.push(...hit(w,c,s,p,e,damage,props,opts));return events;}
function line(w,c,s,p,angle,range,width,damage,props,opts={}){const events=[];for(const e of c.targets)if(strikeConnects(p,e,angle,{reach:range,shape:'line',halfWidth:width},props))events.push(...hit(w,c,s,p,e,damage,props,opts));return events;}
// Supplied Knight poses per ability (Oct 15): sprint-slash for dashes, overhead slam for ground strikes,
// sword raise for shouts/rage buffs, spell gesture for runic abilities, shield for guards.
const WARRIOR_POSES={rush:'knight-MeleeRun',charge:'knight-MeleeRun',carnage:'knight-MeleeSpin',sunder:'knight-Special1',stomp:'knight-Special1',earthbreaker:'knight-Special1',cry:'knight-Special2',bloodlust:'knight-Special2',wrath:'knight-Special2',conqueror:'knight-Special2',bastion:'knight-ShieldBlockStart',overload:'knight-CastSpell',rune:'knight-CastSpell',darkmatter:'knight-CastSpell',guard:'knight-ShieldBlockMid',barrier:'knight-ShieldBlockMid',crescent:'knight-Melee',bladestorm:'knight-Melee2'};
function requestWarriorOwned(w,c,s,p,aim,key,props=[]){
 if(key==='Q'&&w.buffs.bloodlust>0&&w.bloodSpec&&!s.dead){w.buffs.bloodlust=0;w.pending.push(...bloodBurst(w,c,s,p,props));return true;}
 if(!spellOwned(s,key)||s.dead||w.cast||s.cast||(c.attack&&c.attack.elapsed<c.attack.definition.duration*c.attack.definition.hitEnd)||w.cooldowns[key]>0||(w.rage??0)<rageCost(key,s))return false;
 const a=warriorAbility(s,key);if(!a)return false;a.weapon={...c.weapon};a.actionId=beginAction(c,a.duration??.42,a.weapon,'ability').id;a.paid=rageCost(key,s);w.rage-=a.paid;w.rageIdle=0;c.buffer=0;c.attack=null;c.chainTimer=0;c.nextCombo=0;
 const angle=aim?Math.atan2(aim.y-p.y,aim.x-p.x):p.row*Math.PI/4;
 w.cooldowns[key]=a.cooldown;w.cast={...a,angle,row:directionRow(Math.cos(angle),Math.sin(angle)),elapsed:0,duration:['rush','charge','bladestorm'].includes(a.kind)?a.duration:a.kind==='carnage'?.75:.42,sheet:WARRIOR_POSES[a.kind]??'knight-Melee',frameStart:['rush','charge'].includes(a.kind)?4:0,spin:a.kind==='bladestorm',fired:false,pulses:0,hit:new Set(),origin:{x:p.x,y:p.y}};
 const cast=w.cast;
 if(['bloodlust','wrath','bastion','overload','conqueror','darkmatter'].includes(a.kind)){w.buffs[a.kind]=a.duration;w.hitCount=0;flair(w,a.kind,p,a.kind==='bastion'?a.radius:110);}
 if(a.kind==='bastion')w.bastionRadius=a.radius;
 if(a.kind==='bloodlust')w.bloodSpec=a;
 if(a.kind==='darkmatter'){w.darkMatter={spec:a,pulse:.25};}
 if(a.kind==='guard'){
   s.parry=a.duration+.04*rank(s,'parrytime');s.parryAngle=angle;
   s.warriorGuardCounter=(enemy)=>{s.parry=0;if(rank(s,'healing'))boundedHeal(c,s,outputAmount(10*buff(s,'healing','Q'),c.weapon,'healing')*(s.world?.healing??1));if(rank(s,'guard'))s.guard=2;flair(w,'guard',p,100);const ang=Math.atan2(enemy.y-p.y,enemy.x-p.x),boost=w.buffs.bastion>0?1.5*buff(s,'damage','R'):1;
     // Successful parry: counter the attacker, then a forward blast (cone) and a short speed burst.
     w.buffs.guardHaste=2;w.effects.push({kind:'guardBlast',x:p.x,y:p.y,radius:210,angle:ang,age:0,duration:.45});
     const shards=rank(s,'guardShards')?c.targets.filter(t=>t.state==='alive'&&t!==enemy&&Math.hypot(t.x-p.x,t.y-p.y)<320).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,5).flatMap(t=>{w.effects.push({kind:'thornHit',x:t.x,y:t.y,radius:30,angle:Math.atan2(t.y-p.y,t.x-p.x),age:0,duration:.35});return hit(w,c,s,p,t,120*buff(s,'damage','Q'),props,{stagger:.3,push:10});}):[];
     return [...hit(w,c,s,p,enemy,150*buff(s,'damage','Q')*boost,props,{counter:true,stagger:1,push:24}),...cone(w,c,s,p,ang,210,.7,320*buff(s,'damage','Q')*boost,props,{heavy:true,stagger:.8,push:34}),...shards];};
 }
 if(a.kind==='barrier'&&grantBarrier(s,outputAmount(200*buff(s,'barrier','Q'),a.weapon,'barrier'),a.duration)){s.warriorBarrierBurst=()=>{const r=200*buff(s,'radius','Q');w.effects.push({kind:'voidDome',x:p.x,y:p.y,radius:r,angle:0,age:0,duration:.75});if(rank(s,'barrierRefund'))gainRage(w,refundCast(a,15));if(rank(s,'barrierPull'))for(const e of c.targets)if(e.state==='alive'&&e.role!=='boss'){const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy)||1;if(n<r*1.6&&n>30)movePlayer(e,dx/n*Math.min(110,n-30),dy/n*Math.min(110,n-30),props);}return area(w,c,s,p,r,300*buff(s,'damage','Q'),props,{weapon:a.weapon,heavy:true,stagger:.6,push:70});};}
 if(a.kind==='cry'){if(rank(s,'cryEcho'))(w.echoes??=[]).push({delay:2,spec:a});for(const e of c.targets)if(strikeConnects(p,e,0,{reach:a.radius,halfArc:Math.PI},props)&&!shieldBlocksAttack(s.forgeShield,p,e)){if(rank(s,'cryFear')&&e.role!=='boss')e.feared=2;applyWeaken(e,c.ownerId??0,Math.min(.6,.35+talentBonus(s,'weakening','Q')),a.duration);if(e.role!=='boss'){e.swing=null;e.hurt=Math.max(e.hurt,e.role==='leader'?.6:1.2);}}w.pending.push(...area(w,c,s,p,a.radius,a.damage,props,{stagger:.4,push:30}));flair(w,'cry',p,a.radius);}
 if(a.kind==='rune'){const dx=(aim?.x??p.x)-p.x,dy=(aim?.y??p.y)-p.y,n=Math.hypot(dx,dy)||1,d=Math.min(360,n);let x=p.x,y=p.y;for(let t=4;t<=d;t+=4){const nx=p.x+dx/n*t,ny=p.y+dy/n*t;if(blocked(nx,ny,props,6,true)||shieldBlocksAttack(s.forgeShield,p,{x:nx,y:ny}))break;x=nx;y=ny;}w.runes.push({x,y,age:0,delay:.8,spec:a,origin:{...p}});}
 if(a.kind==='crescent')for(const off of rank(s,'wavesFive')?[-.5,-.25,0,.25,.5]:[-.28,0,.28])w.projectiles.push({x:p.x,y:p.y,angle:angle+off,remaining:a.range,spec:a,hit:new Set(),wave:true});
 return true;
}
import {tickWarriorFx} from './warrior-fx.js?v=fx-260';
function tickWarriorOwned(w,c,s,p,aim,props,dt){
 const events=w.pending.splice(0);w.position={x:p.x,y:p.y};if(s.dead){cancelWarrior(w,s);return events;}
 w.rageIdle=(w.rageIdle??0)+dt;if(w.rageIdle>RAGE.decayDelay)w.rage=Math.max(0,(w.rage??0)-RAGE.decay*dt);
 for(const k of Object.keys(w.cooldowns))w.cooldowns[k]=Math.max(0,w.cooldowns[k]-dt);
 for(const k of Object.keys(w.buffs))w.buffs[k]=Math.max(0,w.buffs[k]-dt);
 s.weaponGuard=c.weaponGuard??0;s.damageReduction=w.buffs.bastion>0?boundedBurst(c,'mitigation',.6+talentBonus(s,'damageReduction','R'),.65,.8):0;s.staggerResist=w.buffs.bastion>0?.85:0;
 c.warriorBasicSpeed=w.buffs.wrath>0?1.4:1;c.warriorBasicDamage=w.buffs.wrath>0?1.35*buff(s,'damage','R'):1;
 // Bloodletting: stacks bleed 10 per stack every .5s; when the buff ends every marked enemy bursts.
 for(const e of c.targets){if(e.timeStopped)continue;if(!(e.bloodStacks>0))continue;if(e.state!=='alive'){e.bloodStacks=0;continue;}e.bloodTick-=dt;if(e.bloodTick<=0){e.bloodTick+=.5;events.push(...hit(w,c,s,p,e,10*e.bloodStacks*buff(s,'speed','Q'),props,{dot:true,push:0,stagger:0}));}}
 if(w.bloodSpec&&!(w.buffs.bloodlust>0))events.push(...bloodBurst(w,c,s,p,props));
 s.warriorMove=(w.buffs.wrath>0?1.3:1)*(w.buffs.guardHaste>0?1.3:1);
 // Bastion Dome: the shield travels with the warrior (allies inside share it in multiplayer); ordinary enemies are shoved out.
 for(const echo of w.echoes??[]){echo.delay-=dt;if(echo.delay<=0){const a=echo.spec;flair(w,'cry',p,a.radius);for(const e of c.targets)if(e.state==='alive'&&strikeConnects(p,e,0,{reach:a.radius,halfArc:Math.PI},props)){applyWeaken(e,c.ownerId??0,Math.min(.6,.35+talentBonus(s,'weakening','Q')),a.duration);if(rank(s,'cryFear')&&e.role!=='boss')e.feared=2;}events.push(...area(w,c,s,p,a.radius,a.damage*.6,props,{stagger:.3,push:20}));}}if(w.echoes)w.echoes=w.echoes.filter(e=>e.delay>0);
 if(w.buffs.bastion>0&&rank(s,'bastionReflect')&&c.enemyProjectiles){const R=w.bastionRadius??170;c.enemyProjectiles=c.enemyProjectiles.filter(b=>{const inside=Math.hypot(b.x-p.x,(b.y-p.y)/.65)<R;if(inside)w.effects.push({kind:'thornHit',x:b.x,y:b.y,radius:20,angle:0,age:0,duration:.25});return !inside;});}
 if(w.buffs.bastion>0){const R=w.bastionRadius??170;for(const e of c.targets){if(e.state!=='alive'||e.role==='boss')continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy/.65);if(d<R&&d>1){const push=Math.min(R-d,220*dt);movePlayer(e,dx/d*push,dy/d*push*.65,props);}}}
 // Dark Matter: three orbs circle the warrior and pulse void damage around him.
 if(w.buffs.darkmatter>0){const dm=w.darkMatter;if(dm){dm.pulse-=dt;if(dm.pulse<=0){dm.pulse+=.5;w.effects.push({kind:'dmPulse',x:p.x,y:p.y,radius:dm.spec.radius,angle:0,age:0,duration:.4});const hits=area(w,c,s,p,dm.spec.radius,dm.spec.damage,props,{weapon:dm.spec.weapon,stagger:.1,push:4});if(rank(s,'matterOrbs')){const t=c.targets.filter(e=>e.state==='alive'&&Math.hypot(e.x-p.x,e.y-p.y)<350).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(t){w.effects.push({kind:'voidChain',x:p.x,y:p.y-30,pts:[{x:p.x,y:p.y},{x:t.x,y:t.y}],radius:40,angle:0,age:0,duration:.3});hits.push(...hit(w,c,s,p,t,80,props,{weapon:dm.spec.weapon,stagger:.15,push:6}));}}if(rank(s,'frost'))for(const h of hits)if(h.type==='hit'){const e=c.targets.find(t=>t.id===h.targetId);if(e)e.slow=1;}events.push(...hits);}}}else{if(w.darkMatter&&rank(s,'matterCollapse')){const dm=w.darkMatter,R=dm.spec.radius*1.4;for(const e of c.targets)if(e.state==='alive'&&e.role!=='boss'){const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy)||1;if(n<R*1.5&&n>30)movePlayer(e,dx/n*Math.min(90,n-30),dy/n*Math.min(90,n-30),props);}w.effects.push({kind:'voidDome',x:p.x,y:p.y,radius:R,angle:0,age:0,duration:.6});events.push(...area(w,c,s,p,R,dm.spec.damage*3,props,{weapon:dm.spec.weapon,heavy:true,stagger:.5,push:-10}));}w.darkMatter=null;}
 // Earthquake: rumble waves rolling outward from where the warrior stood.
 for(const q of w.quakes??[]){q.delay-=dt;if(q.delay<=0){flair(w,'stomp',q.origin,q.radius);const hits=area(w,c,s,q.origin,q.radius,q.damage,props,{weapon:q.weapon,heavy:true,stagger:.5,push:16});events.push(...hits);if(q.stun)for(const h of hits)if(h.type==='hit'){const e=c.targets.find(t=>t.id===h.targetId);if(e&&e.role!=='boss'&&e.state==='alive'){e.hurt=Math.max(e.hurt,q.stun);e.hurtDuration=Math.max(e.hurtDuration??.24,q.stun);}}}}if(w.quakes)w.quakes=w.quakes.filter(q=>q.delay>0);
 if(w.buffs.overload>0&&rank(s,'pull'))for(const e of c.targets)if(strikeConnects(p,e,0,{reach:190*buff(s,'radius','R'),halfArc:Math.PI},props)&&e.role!=='boss'&&!shieldBlocksAttack(s.forgeShield,p,e)){const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy)||1;movePlayer(e,dx/n*Math.min(80*dt,n),dy/n*Math.min(80*dt,n),props);}
 for(const e of c.targets){if(e.timeStopped)continue;if(e.warriorBleed){const b=e.warriorBleed;b.remaining-=dt;b.pulse-=dt;if(b.pulse<=0&&b.remaining>=0){b.pulse+=.5;events.push(...hit(w,c,s,b.origin,e,b.damage,props,{weapon:b.weapon,dot:true,push:0,stagger:0}));}if(b.remaining<=0)e.warriorBleed=null;}}
 if(w.buffs.wrath>0&&rank(s,'wrathFeed')){const kills=events.filter(v=>v.type==='death').length;if(kills&&(w.wrathBonus??0)<4){const add=Math.min(4-(w.wrathBonus??0),.5*kills);w.wrathBonus=(w.wrathBonus??0)+add;w.buffs.wrath+=add;}}else if(!(w.buffs.wrath>0))w.wrathBonus=0;
 for(const f of w.effects)f.age+=dt;w.effects=w.effects.filter(f=>f.age<f.duration);
 for(const v of w.particles){v.life-=dt;v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=110*dt;}w.particles=w.particles.filter(v=>v.life>0);
 for(const rune of w.runes){rune.age+=dt;if(rune.age>=rune.delay){flair(w,'rune',rune,rune.spec.radius);const hits=area(w,c,s,rune,rune.spec.radius,rune.spec.damage,props,{weapon:rune.spec.weapon,heavy:true,stagger:.6,push:20});if(rank(s,'frost'))for(const h of hits)if(h.type==='hit'){const e=c.targets.find(t=>t.id===h.targetId);if(e)e.slow=2;}events.push(...hits);}}w.runes=w.runes.filter(r=>r.age<r.delay);
 for(const b of w.projectiles){const travel=Math.min(b.remaining,640*dt);for(let t=0;t<travel;t+=5){const step=Math.min(5,travel-t),nx=b.x+Math.cos(b.angle)*step,ny=b.y+Math.sin(b.angle)*step;if(blocked(nx,ny,props,3,true)||shieldBlocksAttack(s.forgeShield,b,{x:nx,y:ny})){b.remaining=0;break;}b.x=nx;b.y=ny;b.remaining-=step;for(const e of c.targets)if(!b.hit.has(e.id)&&e.state==='alive'&&Math.hypot(e.x-b.x,(e.y-b.y)/.65)<38*buff(s,'radius','RMB')+e.radius){b.hit.add(e.id);events.push(...hit(w,c,s,b,e,b.spec.damage*(b.returned?.55:1),props,{weapon:b.spec.weapon,attackId:b.spec.actionId,targetCap:1,pass:b.returned?1:0,stagger:.35,push:12}));}}}for(const b of w.projectiles)if(b.remaining<=0&&b.wave&&!b.ended){if(rank(s,'wavesBurst')){flair(w,'rune',b,90);events.push(...area(w,c,s,b,90,b.spec.damage*.6,props,{stagger:.3,push:10}));}if(rank(s,'wavesReturn')&&!b.returned){b.returned=true;b.angle+=Math.PI;b.remaining=b.spec.range;b.hit=new Set();}else b.ended=true;}
 w.projectiles=w.projectiles.filter(b=>b.remaining>0);
 // Talents: Earthsplitter second fissure, Thorn Lash ring of thorns.
 for(const f of w.fissures??[]){f.delay-=dt;if(f.delay<=0){flair(w,'earthbreaker',f.origin,f.range,f.angle);events.push(...line(w,c,s,f.origin,f.angle,f.range,f.width,f.damage,props,{heavy:true,stagger:.6,push:12}));}}if(w.fissures)w.fissures=w.fissures.filter(f=>f.delay>0);
 if(w.buffs.wrath>0&&rank(s,'thornLash')){w.thornTick=(w.thornTick??.5)-dt;if(w.thornTick<=0){w.thornTick=.5;for(const e of c.targets){if(e.state!=='alive')continue;const d=Math.hypot(e.x-p.x,(e.y-p.y)/.45);if(d<110&&!shieldBlocksAttack(s.forgeShield,p,e)){events.push(...hit(w,c,s,p,e,30,props,{stagger:.1,push:4}));w.effects.push({kind:'thornHit',x:e.x,y:e.y,radius:30,angle:Math.atan2(e.y-p.y,e.x-p.x),age:0,duration:.35});}}}}
 w.fx={sandstorm:w.cast?.kind==='bladestorm'&&rank(s,'sandstorm')>0,parry:s.parry>0?s.parryAngle:null,barrier:s.barrier>0&&!!s.warriorBarrierBurst};w.fxTargets=c.targets;tickWarriorFx(w,dt);
 const a=w.cast;if(!a)return events;a.elapsed+=dt;
 if(['rush','charge'].includes(a.kind)){
   const travel=a.range/a.duration*Math.min(dt,Math.max(0,a.duration-a.elapsed+dt));
   for(let t=0;t<travel;t+=5){const step=Math.min(5,travel-t),dx=Math.cos(a.angle)*step,dy=Math.sin(a.angle)*step,nx=p.x+dx,ny=p.y+dy;
     if(blocked(nx,ny,props,13)||shieldBlocksAttack(s.forgeShield,p,{x:nx,y:ny})){a.elapsed=a.duration;break;}
     let stop=false;for(const e of c.targets)if(e.state==='alive'&&Math.hypot(e.x-nx,(e.y-ny)/.65)<e.radius+28*buff(s,'radius','RMB')&&!a.hit.has(e.id)){
       a.hit.add(e.id);if(a.kind==='charge'&&rank(s,'chargeRage'))gainRage(w,refundCast(a,4));events.push(...hit(w,c,s,p,e,a.damage*(a.ricochet?.7:1),props,{ability:'RMB',heavy:a.kind==='charge',stagger:a.kind==='charge'?1:.3,push:a.kind==='charge'?(w.buffs.conqueror>0?65:38):0}));
       if(a.kind==='rush'&&w.buffs.bloodlust>0)addBlood(e,2);if(a.kind==='rush')e.warriorBleed={remaining:3*buff(s,'bleedDuration','RMB'),pulse:.5,damage:20*buff(s,'damage','RMB')*(rank(s,'bleed')?1.15:1),origin:{...p},weapon:a.weapon};
       if(e.role==='boss'||a.kind==='charge'&&e.role==='leader'){stop=true;flair(w,'charge',e,120);}}
     if(stop){a.elapsed=a.duration;break;}movePlayer(p,dx,dy,props);
   }if(!a.fired){a.fired=true;flair(w,a.kind,p,90,a.angle);}
 }else if(a.kind==='bladestorm'){
   // Bladestorm always drags enemies in (Oct 15); the Sandstorm talent widens and strengthens the pull. Bosses resist.
   {const PR=rank(s,'sandstorm')?340:240,PS=rank(s,'sandstorm')?150:95;for(const e of c.targets)if(e.state==='alive'&&e.role!=='boss'&&Math.hypot(e.x-p.x,(e.y-p.y)/.65)<PR){const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy)||1;if(n>40)movePlayer(e,dx/n*Math.min(PS*dt,n-40),dy/n*Math.min(PS*dt,n-40),props);}}
   if(rank(s,'stormBlades')){a.blade=(a.blade??1)-dt;if(a.blade<=0){a.blade=1;const t=c.targets.filter(e=>e.state==='alive'&&Math.hypot(e.x-p.x,e.y-p.y)<350).sort((x,y)=>Math.hypot(x.x-p.x,x.y-p.y)-Math.hypot(y.x-p.x,y.y-p.y))[0];if(t)w.projectiles.push({x:p.x,y:p.y,angle:Math.atan2(t.y-p.y,t.x-p.x),remaining:380,spec:{damage:a.damage*2.5,range:380},hit:new Set()});}}
   a.pulse=(a.pulse??0)-dt;if(a.pulse<=0){a.pulse+=.28;flair(w,'bladestorm',p,a.radius);events.push(...area(w,c,s,p,a.radius,a.damage,props,{ability:'R',stagger:.12,push:2}));}
 }else if(a.kind==='carnage'){
   while(a.pulses<3&&a.elapsed>=.1+a.pulses*.22){a.pulses++;flair(w,'carnage',p,a.radius);
     if(rank(s,'carnagePull'))for(const e of c.targets)if(e.state==='alive'&&e.role!=='boss'){const dx=p.x-e.x,dy=p.y-e.y,n=Math.hypot(dx,dy)||1;if(n<a.radius*1.8&&n>36)movePlayer(e,dx/n*Math.min(45,n-36),dy/n*Math.min(45,n-36),props);}
     const hits=area(w,c,s,p,a.radius,a.damage,props,{stagger:.22,push:6});events.push(...hits);
     if(rank(s,'carnageBleed'))for(const h of hits)if(h.type==='hit'){const e=c.targets.find(t=>t.id===h.targetId);if(e)e.warriorBleed={remaining:3,pulse:.5,damage:20*buff(s,'damage','E'),origin:{...p},weapon:a.weapon};}
     if(a.pulses===3&&rank(s,'carnageBlades'))for(let i=0;i<6;i++)w.projectiles.push({x:p.x,y:p.y,angle:i*Math.PI/3+a.angle,remaining:300,spec:{damage:a.damage*.6,range:300},hit:new Set()});}
 }else if(!a.fired&&a.elapsed>=.18){a.fired=true;
   if(a.kind==='sunder'){flair(w,'sunder',p,a.range,a.angle);const hits=cone(w,c,s,p,a.angle,a.range,.8*buff(s,'radius','RMB'),a.damage,props,{heavy:true,stagger:1.2,push:26});events.push(...hits);
     if(rank(s,'sunderFissure'))(w.fissures??=[]).push({delay:.8,origin:{x:p.x,y:p.y},angle:a.angle,range:a.range,width:46,damage:a.damage*.5});
     if(rank(s,'sunderShatter'))for(const d of hits)if(d.type==='death'){flair(w,'stomp',d,90);events.push(...area(w,c,s,d,90,120,props,{secondary:true,stagger:.3,push:14}));}}
   if(a.kind==='stomp'){if(rank(s,'slamguard')){s.barrier=15*buff(s,'barrier','E');s.barrierTime=3;}flair(w,'stomp',p,a.radius);events.push(...area(w,c,s,p,a.radius,a.damage,props,{heavy:true,stagger:1,push:22}));
     if(rank(s,'stompAftershock'))(w.quakes??=[]).push({weapon:a.weapon,delay:.7,origin:{x:p.x,y:p.y},radius:a.radius,damage:a.damage*.6});
     if(rank(s,'stompPillars')&&c.hazards){const g=Math.random()*1e6;for(let i=0;i<6;i++){const ang=i*Math.PI/3,x=p.x+Math.cos(ang)*(a.radius*.85),y=p.y+Math.sin(ang)*(a.radius*.85)*.65;if(!blocked(x,y,props,20))c.hazards.push({kind:'wall',x,y,age:0,warning:.15,duration:3,owner:-1,death:true,solid:false,group:g,idx:i});}}}
   if(a.kind==='earthbreaker'){const o={x:p.x,y:p.y};(w.quakes??=[]).push(...[[0,.5],[.35,.75],[.7,1]].map(([d,f])=>({weapon:a.weapon,delay:d,origin:o,radius:a.radius*f,damage:a.damage})));if(rank(s,'earthsplitter'))w.quakes.push({weapon:a.weapon,delay:1.5,origin:o,radius:a.radius*1.1,damage:a.damage*.5});if(rank(s,'quakeStun'))w.quakes[w.quakes.length-(rank(s,'earthsplitter')?2:1)].stun=1.5;if(rank(s,'quakeStar'))for(let i=0;i<3;i++)(w.fissures??=[]).push({delay:.2,origin:o,angle:a.angle+i*Math.PI*2/3,range:320,width:34,damage:a.damage*.7});}
 }
 if(a.elapsed>=a.duration){w.cast=null;
   if(a.kind==='rush'&&rank(s,'rushRicochet')&&!a.ricochet){const t=c.targets.filter(e=>e.state==='alive'&&!a.hit.has(e.id)&&Math.hypot(e.x-p.x,e.y-p.y)<300).sort((x,y)=>Math.hypot(x.x-p.x,x.y-p.y)-Math.hypot(y.x-p.x,y.y-p.y))[0];if(t){const ang=Math.atan2(t.y-p.y,t.x-p.x);w.cast={...a,angle:ang,row:directionRow(Math.cos(ang),Math.sin(ang)),range:a.range*.6,duration:a.duration*.6,elapsed:0,fired:false,hit:new Set(),ricochet:true};}}
   if(a.kind==='charge'&&rank(s,'chargeShock')){flair(w,'stomp',p,150);events.push(...area(w,c,s,p,150,a.damage*.6,props,{heavy:true,stagger:.6,push:24}));}
   if(a.kind==='bladestorm'&&rank(s,'stormFinale')){flair(w,'stomp',p,a.radius*1.4);events.push(...area(w,c,s,p,a.radius*1.4,a.damage*3,props,{heavy:true,stagger:.5,push:30}));}}
 return events;
}
// Trigger only from primary manual contact events. Secondary hits never recurse.
function handleWarriorHitsOwned(w,c,s,p,events,props=[]){const out=[];let spectralFired=false;for(const e of events)if(e.type==='hit'&&e.basic&&!e.secondary){
 gainRage(w,e.resource??0);
 w.recentActions??=new Set();const uniqueAction=e.attackId==null||!w.recentActions.has(e.attackId);
 if(e.attackId!=null&&uniqueAction){w.recentActions.add(e.attackId);if(w.recentActions.size>128)w.recentActions.delete(w.recentActions.values().next().value);}
 const struck=c.targets.find(t=>t.id===(e.targetId??e.id));
 if(w.buffs.bloodlust>0&&struck&&e.statusCredit)addBlood(struck,1);
 if(w.buffs.wrath>0){boundedHeal(c,s,(e.actualDamage??0)*.15*(s.world?.healing??1));
  // Unchained Wrath: every connecting swing also sends a blood cleave forward (once per swing).
  if(uniqueAction&&struck){const ang=Math.atan2(struck.y-p.y,struck.x-p.x),r=200*buff(s,'radius','R');w.effects.push({kind:'wrathCleave',x:p.x,y:p.y,radius:r,angle:ang,age:0,duration:.3});out.push(...cone(w,c,s,p,ang,r,.9,70*buff(s,'damage','R'),props,{secondary:true,stagger:.15,push:8}));}}
 // Void Ascension: each connecting basic attack chains void from the struck enemy through up to 4 more nearby enemies.
 if(w.buffs.overload>0&&uniqueAction){let cur=c.targets.find(t=>t.id===(e.targetId??e.id));const done=new Set(cur?[cur.id]:[]),pts=cur?[{x:cur.x,y:cur.y}]:[];const jump=230*buff(s,'radius','R');
  for(let j=0;j<(rank(s,'ascensionChain')?7:4)&&cur;j++){let best=null,bd=jump;for(const t of c.targets){if(t.state!=='alive'||done.has(t.id))continue;const d=Math.hypot(t.x-cur.x,(t.y-cur.y)/.65);if(d<bd){bd=d;best=t;}}if(!best)break;done.add(best.id);pts.push({x:best.x,y:best.y});out.push(...hit(w,c,s,p,best,110*buff(s,'damage','R'),props,{secondary:true,stagger:.15,push:4}));if(rank(s,'arcCascade'))out.push(...area(w,c,s,best,70,30,props,{secondary:true,stagger:.1,push:4}));cur=best;}
  if(pts.length>1)w.effects.push({kind:'voidChain',x:pts[0].x,y:pts[0].y,pts,radius:60,angle:0,age:0,duration:.35});}
 if(w.buffs.conqueror>0){const target=c.targets.find(t=>t.id===(e.targetId??e.id));if(target&&target.state==='alive'){target.hurt=Math.max(target.hurt,.45);bossStagger(target,.45);if(target.role!=='boss'){const dx=target.x-p.x,dy=target.y-p.y,n=Math.hypot(dx,dy)||1;movePlayer(target,dx/n*16,dy/n*16,props);}}}
 }return out;}
export function cancelWarrior(w,s){w.cast=null;w.projectiles=[];w.runes=[];w.buffs={};if(s){s.warriorGuardCounter=null;s.warriorBarrierBurst=null;s.damageReduction=0;s.staggerResist=0;s.warriorMove=1;}w.darkMatter=null;w.quakes=[];w.bloodSpec=null;}

export function tickWarrior(w,c,s,p,aim,props,dt){return ownStatuses(c,["bloodStacks", "bloodTick", "warriorBleed"],()=>tickWarriorOwned(w,c,s,p,aim,props,dt));}

export function handleWarriorHits(w,c,s,p,events,props=[]){return ownStatuses(c,["bloodStacks","bloodTick","warriorBleed"],()=>handleWarriorHitsOwned(w,c,s,p,events,props));}

export function requestWarrior(w,c,s,p,aim,key,props=[]){return ownStatuses(c,["bloodStacks", "bloodTick", "warriorBleed"],()=>requestWarriorOwned(w,c,s,p,aim,key,props));}
