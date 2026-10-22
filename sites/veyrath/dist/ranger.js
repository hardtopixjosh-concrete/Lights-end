import {ownStatuses,fieldContact} from './status-ownership.js?v=fx-260';
import {boundedBurst,advanceActor,beginAction,outputAmount,grantBarrier,boundedHeal,refundCast} from './core-rules.js?v=fx-260';
import {blocked,directionRow,movePlayer} from './simulation.js?v=fx-260';
import {damageEnemy,bodyHit} from './combat.js?v=fx-260';
import {shieldBlocksAttack} from './forge-shield.js?v=fx-260';
import {talentBonus,rank,spellOwned} from './specializations.js?v=fx-260';
import {BASIC_ATTACKS} from './combat-balance.js?v=fx-260';
import {heroAnchor} from './hero-anchor.js?v=fx-260';

// Oct 17: Ranger class (user's design: Archer / Ninja / Alchemist / Gunslinger). LMB is the Bow weapon family for
// every spec for now (user). Momentum is built by basic-attack hits and decays out of combat (user). Marked and
// Exposed are shared class statuses (user). Every number below is a Claude PROPOSAL / playtest seed.
export const RANGER_COLORS={archer:'#9be15d',ninja:'#2f62ff',alchemist:'#b35cff',gunslinger:'#ffc24a'};
export const ARROW_COLORS={plain:'#e9f6ff',fire:'#ff8a3d',frost:'#8fe3ff',poison:'#a4ff5a'};
export const MOMENTUM={max:100,perHit:5,decayDelay:4,decay:6};
export const MARK_BONUS=.15,EXPOSE_BONUS=.25;
export const RANGER_KITS={
 archer:{RMB:{name:'Power Shot',kind:'power',cost:15,cooldown:1,damage:110,maxDamage:350,range:950,width:30,charge:1},
  Q:{name:'Arrow Type',kind:'arrows',cost:0,cooldown:.35},
  E:{name:'Volley',kind:'volley',cost:25,cooldown:1.5,damage:55,radius:150,duration:1.8,range:650},
  R:{name:"Hunter's Focus",kind:'focus',cost:50,cooldown:10,duration:6}},
 /* Oct 18 (user: Ninja too much AoE, the 10 hits do less): Shuriken Throw 30 -> 25 per hit. */
 ninja:{RMB:{name:'Shuriken Throw',kind:'shuriken',cost:8,cooldown:.3,damage:25,range:560,bounces:9},
  Q:{name:'Smoke Bomb',kind:'smoke',cost:20,cooldown:4,radius:120,duration:4},/* Oct 19 (user): 170 -> 120 */
  /* Oct 18 (user): E = Blade Fan, a rooted channel of 3 fan waves of piercing shuriken that follow the cursor; R = Shadow Clones that stand beside you,
     face the cursor and copy every attack and ability (copy = damage fraction; user chose 35% with a 20 s cooldown). Old RMB Cyclone removed; its upgrades moved to Blade Fan. */
  /* Oct 18 (user): E channels while held until Momentum runs out, at a higher cost. Cost = Momentum per wave (Claude proposal 12, was 20 per 3 waves); cooldown starts when the channel ends. */
  E:{name:'Blade Fan',kind:'bladefan',cost:12,cooldown:1,damage:15,range:480,count:5,spread:1,gap:.25,channel:true},
  R:{name:'Shadow Clones',kind:'shadow',cost:50,cooldown:20,duration:5,damage:120,copy:.35}},
 alchemist:{RMB:{name:'Catalyst Flask',kind:'catalyst',cost:6,cooldown:.25,damage:60,radius:75,range:560},
  Q:{name:'Reactive Flask',kind:'reactive',cost:20,cooldown:4,damage:80,radius:180,duration:4},
  E:{name:'Volatile Mixture',kind:'volatile',cost:25,cooldown:1.5,damage:24,radius:160,duration:5,range:600},
  /* Oct 19 (user): R = a huge potion lobbed at the cursor; E pools it touches detonate for 3x the E impact. Replaces Grand Experiment. */
  R:{name:'Grand Flask',kind:'grand',cost:50,cooldown:10,damage:300,radius:220,range:620,duration:6}},
 gunslinger:{RMB:{name:'Fan the Hammer',kind:'fan',cost:15,cooldown:1,damage:45,range:620,count:6},
  Q:{name:'Quickstep',kind:'quickstep',cost:10,cooldown:4,range:190,duration:.18},
  E:{name:'Piercing Line',kind:'line',cost:20,cooldown:1.2,damage:350,range:900,width:26,duration:4},
  R:{name:'Bullet Barrage',kind:'barrage',cost:50,cooldown:10,damage:45,duration:4}}
};
export const BOW={name:'Quick Shot',speed:950,range:720,contact:10};
// Oct 17 (user list): Ranger LMB per weapon family. look = projectile art; pierce = enemies hit; fan = every Nth shot throws 3; alternate = left/right guns.
export const RANGER_PRIMARIES={bow:{name:'Quick Shot',speed:950,range:720,contact:10,pierce:1,look:'arrow'},longbow:{name:'Long Shot',speed:1150,range:1000,contact:11,pierce:1,look:'longArrow',draw:.3},shortbow:{name:'Rapid Shot',speed:900,range:480,contact:9,pierce:1,look:'arrow'},shuriken:{name:'Star Throw',speed:700,range:520,contact:11,pierce:1,look:'star',fan:3},crossbow:{name:'Heavy Bolt',speed:1500,range:850,contact:13,pierce:1,look:'bolt',reload:1.2},kunai:{name:'Kunai Throw',speed:1050,range:560,contact:10,pierce:3,look:'kunai'},pistols:{name:'Twin Shots',speed:1400,range:560,contact:9,pierce:3,look:'bullet',alternate:true,autoTarget:true},falconer:{name:'Hunting Hawk',speed:0,range:650,contact:16,pierce:99,look:'hawk',hawk:true},shotgun:{name:'Buckshot',speed:1300,range:320,contact:8,pierce:1,look:'pellet',pellets:5,spread:.52,pelletCap:3,reload:1.1},chakram:{name:'Chakram',speed:640,range:420,contact:16,pierce:99,look:'chakram',chakram:true,maxOut:1},
 /* Oct 18 (user list): new families. cone = held spray ticked at the weapon interval; lob = arcing throw landing at the cursor; barrel = placed charges. */
 daggers:{name:'Dagger Flurry',speed:1050,range:400,contact:9,pierce:3,look:'dagger',alternate:true,spread3:true,bleed:true},rifle:{name:'Rifle Shot',speed:2400,range:1000,contact:6,pierce:99,look:'rifle',reload:1},
 flamethrower:{name:'Flame Jet',range:220,cone:{range:220,half:.34,el:'fire',look:'flame'}},canister:{name:'Toxic Trail',range:0,trailPools:true,poolR:58},
 potion:{name:'Potion Toss',lob:'potion',range:520,radius:62,dur:.46,height:130},bombbag:{name:'Bouncing Bomb',lob:'bomb',range:470,radius:70,dur:.6,height:95,skips:2},barrel:{name:'Sludge Barrel',barrel:true,range:450,max:3,blast:130}};
/* Lob position at time f.t (shared by the Canvas and shader visuals). */
export function flaskPos(f){const t=Math.min(1,f.t/f.dur),h=f.hop?(f.kind==='bomb'?58:34):f.height??(f.kind==='volatile'?120:70);return {x:f.x0+(f.x-f.x0)*t,y:f.y0+(f.y-f.y0)*t-Math.sin(Math.PI*t)*h,t};}
export const rangerPrimary=c=>RANGER_PRIMARIES[c.weapon?.primary]??RANGER_PRIMARIES.bow;
const POSE={power:'Attack1',arrows:'CastSpell',volley:'Special1',focus:'Special2',cyclone:'Attack2',smoke:'CastSpell',shuriken:'Attack2',shadow:'Special2',catalyst:'Attack2',reactive:'CastSpell',volatile:'Special1',grand:'Special2',fan:'QuickShot',quickstep:'Rolling',line:'Attack1',barrage:'Special1'};
const buff=(s,stat,key)=>1+talentBonus(s,stat,key);
const iso=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)/.65);
const alive=e=>e.state==='alive'&&!e.timeStopped&&!e.hidden&&e.role!=='anchor';
export const rangerSpec=s=>RANGER_KITS[s.path]?s.path:'archer';
export function rangerAbility(s,key){const base=RANGER_KITS[rangerSpec(s)][key];if(!base)return null;
 return {...base,key,cost:base.cost*Math.max(.6,1-talentBonus(s,'cost',key)),cooldown:base.cooldown*Math.max(.6,1-talentBonus(s,'cooldown',key)),damage:(base.damage??0)*buff(s,'damage',key),maxDamage:(base.maxDamage??0)*buff(s,'damage',key),radius:(base.radius??0)*buff(s,'radius',key),range:(base.range??0)*buff(s,'range',key)+(base.range&&base.kind!=='quickstep'?s.weaponPassives?.spellRange??0:0),duration:(base.duration??0)*buff(s,'duration',key)};}
export function createRanger(s){const r={momentum:0,idle:0,cooldowns:{RMB:0,Q:0,E:0,R:0},held:false,fireT:0,shotCount:0,arrow:'fire',surge:0,buffs:{},shots:[],flasks:[],pools:[],volleys:[],smokes:[],clones:[],queue:[],pending:[],blasts:new Map(),fx:[],particles:[],charge:null,fan:null,step:null,invulnerable:0,shake:0,shakeT:0,pose:null,aimHold:0,lastAim:0};if(s)s.ranger=r;return r;}
export const rangerElement=(r,s)=>rangerSpec(s)==='archer'&&spellOwned(s,'Q')?r.arrow:'plain';
function gain(r,n){if(n<=0)return;r.momentum=Math.min(MOMENTUM.max,r.momentum+n);r.idle=0;}
function fx(r,kind,o){r.fx.push({kind,age:0,duration:.5,...o});if(r.fx.length>160)r.fx.shift();}
function sparks(r,x,y,color,n=8,v=160){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=v*(.4+Math.random()*.8);r.particles.push({x,y,z:8+Math.random()*14,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.6,vz:60+Math.random()*120,life:.3+Math.random()*.35,max:.65,size:1.5+Math.random()*2.2,color});}if(r.particles.length>320)r.particles.splice(0,r.particles.length-320);}
function shake(r,a){r.shake=Math.max(r.shake,a);}
// Shared statuses: Marked (+15% damage from the Ranger) and Exposed (+25%).
export const statusMult=(s,e)=>1+Math.min(.5,(e.rMarked>0?MARK_BONUS:0)+(e.rExposed>0?EXPOSE_BONUS:0)+(rank(s,'volatileWeaken')&&e.rPoison?.15:0));
const hasStatus=e=>e.rMarked>0||e.rExposed>0||!!e.rBurn||!!e.rPoison||e.slow>0;
function mark(e,t){if(e.state==='alive')e.rMarked=Math.max(e.rMarked??0,t);}
function expose(e,t){if(e.state==='alive')e.rExposed=Math.max(e.rExposed??0,t);}
function burn(s,e,t=3,dmg=14){if(e.state!=='alive')return;e.rBurn={remaining:t,pulse:e.rBurn?.pulse??.5,weapon:s.outputWeapon,damage:dmg*(rank(s,'emberTips')?1.3:1)};}
function poison(s,e,n=1){if(e.state!=='alive')return;const max=rank(s,'virulent')?8:5;e.rPoison={weapon:s.outputWeapon,stacks:Math.min(max,(e.rPoison?.stacks??0)+n),remaining:4,pulse:e.rPoison?.pulse??.5};}
function chill(s,e,t=1.5){if(e.state!=='alive')return;e.slow=Math.max(e.slow??0,t);if(rank(s,'deepFrost')&&e.role!=='boss'){e.rFrost=(e.rFrost??0)+1;if(e.rFrost>=3){e.rFrost=0;e.hurt=Math.max(e.hurt,1);e.hurtDuration=Math.max(e.hurtDuration??.24,1);}}}
function element(s,e,el){if(el==='fire')burn(s,e);else if(el==='frost')chill(s,e);else if(el==='poison')poison(s,e);}
function hit(r,c,s,origin,e,amount,props,opts={}){
 c.forgeShield=s.forgeShield;let mult=statusMult(s,e);if(r.ambush&&!opts.dot){mult*=2;r.ambush=false;}
 const events=damageEnemy(c,e,amount*mult,origin,{absolute:!opts.basic,props,stagger:.12,push:4,...opts});
 if(events.some(v=>v.type==='hit')){if(opts.basic&&!opts.secondary)gain(r,events.reduce((n,e)=>n+(e.resource??0),0));if(opts.el&&events.some(e=>e.statusCredit))element(s,e,opts.el);
  if(!opts.dot&&!opts.noFx){const v=events.find(v=>v.type==='hit'),crit=!!v.critical;(r.hitFx??=[]).push({x:e.x,y:e.y-24,angle:opts.fxAngle??Math.atan2(e.y-origin.y,e.x-origin.x),crit,power:Math.min(1,v.damage/160),pierce:!!opts.pierceFx,el:opts.el,seed:(Math.random()*1e4)|0,born:r.shakeT});if(r.hitFx.length>36)r.hitFx.shift();if(crit)shake(r,1.6);}}
 if(r.buffs.focus>0&&rank(s,'focusRefund'))gain(r,refundCast(r.focusSpec??{paid:0},5*events.filter(v=>v.type==='death').length));
 return events;}
function area(r,c,s,o,R,dmg,props,opts={},each){const out=[];for(const e of c.targets)if(alive(e)&&iso(e,o)<R+(e.radius??14)&&!shieldBlocksAttack(s.forgeShield,o,e)){const ev=hit(r,c,s,o,e,dmg,props,opts);out.push(...ev);if(each&&ev.some(v=>v.type==='hit'))each(e);}return out;}
function nearest(c,o,R,skip){let best=null,bd=R;for(const e of c.targets){if(!alive(e)||skip?.has(e.id))continue;const d=iso(e,o);if(d<bd){bd=d;best=e;}}return best;}
function aimAngle(p,aim){return aim?Math.atan2(aim.y-p.y,aim.x-p.x):p.row*Math.PI/4;}
function aimPoint(p,aim,max){const a=aimAngle(p,aim),d=aim?Math.min(max,Math.hypot(aim.x-p.x,aim.y-p.y)):max*.6;return {x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d};}
/* Oct 18 Volley VFX: launch / wave / aftermath records for ranger-vfx.js (visual only, pruned after 1.7s). */
function volleyFx(r,o){const T=r.shakeT;(r.volleyFx??=[]).push({...o,born:T});r.volleyFx=r.volleyFx.filter(f=>T-f.born<1.7);if(r.volleyFx.length>40)r.volleyFx.shift();}
function shot(r,o){const b={weapon:r.currentWeapon,hit:new Set(),pierce:1,bounces:0,traveled:0,spin:0,seed:(Math.random()*1e4)|0,...o};r.shots.push(b);if(r.shots.length>260)r.shots.shift();
 /* Oct 18: visual start = the live 3D weapon tip (left pistol for side 'l'); simulation path unchanged */
 const A=!o.ghost&&!o.ricocheted&&!o.cyclone&&heroAnchor(r),T=A&&(o.side==='l'&&A.l||A);if(T&&Math.hypot(T.x-o.x,T.y-o.y)<90){b.tipX=T.x-o.x;b.tipY=T.y-o.y;}
 if(o.ricocheted||o.cyclone||o.noMuzzle||o.blast&&o.blast===r.lastBlastFx)return;if(o.blast)r.lastBlastFx=o.blast;
 const look=o.kind==='power'?'power':o.kind==='bullet'?'bullet':o.look,name=look==='pellet'?'rgr.blast':look==='bullet'||look==='rifle'||look==='power'?'rgr.muzzle':'rgr.snap',scale=look==='power'?1.2+.4*(o.size??1):look==='rifle'?1.5:look==='bolt'?1.3:look==='longArrow'?1.15:look==='bullet'?.9:.8;
 (r.muzzles??=[]).push({name,side:o.side,x:o.x+Math.cos(o.angle)*16,y:o.y+Math.sin(o.angle)*11,angle:o.angle,el:o.el,scale:o.ghost?scale*.6:scale,seed:(Math.random()*1e4)|0,born:r.shakeT});if(r.muzzles.length>30)r.muzzles.shift();}
function setPose(r,kind,angle,dur=.38){r.pose={sheet:POSE[kind]??'Attack1',kind,/* Oct 18: kind lets the 3D Ranger pick a per-skill body motion */row:directionRow(Math.cos(angle),Math.sin(angle)),t:0,dur};}
/* Shadow Clones copy attacks while active; each aims from its own spot at the cursor. */
function mirrorClones(r){return r.buffs.shadow>0?r.clones:[];}
function cloneAim(cl,aim,fallback){return aim?Math.atan2(aim.y-cl.y,aim.x-cl.x):fallback;}
function poolAt(r,pt,kind){return r.pools.find(q=>(!kind||q.kind===kind)&&iso(q,pt)<q.R);}

export function rangerCanCast(r,s,key){if(!spellOwned(s,key))return 'locked';if(s.dead)return 'dead';if(r.cooldowns[key]>0)return 'cooldown';const a=rangerAbility(s,key);if(r.momentum<a.cost)return 'momentum';return '';}
// Press a slot. Power Shot (Archer RMB) charges while held and fires on releaseRanger.
function requestRangerOwned(r,c,s,p,aim,key,props=[]){
 if(r.charge||r.fan||r.blades||r.step||r.buffs.barrage>0||rangerCanCast(r,s,key))return false;const a=rangerAbility(s,key),spec=rangerSpec(s),angle=aimAngle(p,aim);
 a.weapon={...c.weapon};a.actionId=beginAction(c,a.duration??.4,a.weapon,'ability').id;r.currentWeapon=a.weapon;a.paid=a.cost;r.momentum-=a.cost;r.idle=0;r.cooldowns[key]=a.cooldown;setPose(r,a.kind,angle);
 // Gunslinger: using another ability trims Quickstep's cooldown (Rhythm: by 1s).
 if(spec==='gunslinger'&&key!=='Q')r.cooldowns.Q=Math.max(0,r.cooldowns.Q-(rank(s,'quickCdr')?1:.5));
 const k=a.kind;
 if(k==='power'){r.charge={t:0,spec:a,angle,need:a.charge*(rank(s,'quickDraw')?.6:1)};r.cooldowns[key]=0;r.pose=null;return true;}
 if(k==='arrows'){const order=['fire','frost','poison'];r.arrow=order[(order.indexOf(r.arrow)+1)%3];if(rank(s,'elementalSurge'))r.surge=3;fx(r,'swap',{x:p.x,y:p.y,color:ARROW_COLORS[r.arrow],duration:.45});return true;}
 if(k==='volley'){const t=aimPoint(p,aim,a.range),waves=6;r.volleys.push({x:t.x,y:t.y,R:a.radius,spec:a,waves,done:0,t:0,gap:a.duration/waves,el:rangerElement(r,s),focus:false,born:r.shakeT,seed:(Math.random()*1e4)|0});fx(r,'volleyLaunch',{x:p.x,y:p.y,angle,duration:.35});volleyFx(r,{kind:'launch',x:p.x,y:p.y,el:rangerElement(r,s)});return true;}
 if(k==='focus'){r.buffs.focus=a.duration;r.focusSpec=a;r.focusShots=0;fx(r,'focus',{x:p.x,y:p.y,duration:.7});shake(r,3);return true;}
 if(k==='smoke'){for(const o of [p,...mirrorClones(r)])r.smokes.push({x:o.x,y:o.y,R:a.radius,remaining:a.duration,max:a.duration});r.invulnerable=Math.max(r.invulnerable,1.5);r.buffs.haste=3;r.smokeAmbush=rank(s,'smokeAmbush')>0;fx(r,'smokePop',{x:p.x,y:p.y,radius:a.radius,duration:.6});return true;}
 if(k==='shuriken'){const offs=rank(s,'shurikenTwin')?[-.09,.09]:[0];for(const o of [p,...mirrorClones(r)]){const base=o===p?angle:cloneAim(o,aim,angle);for(const off of offs)shot(r,{kind:'shuriken',x:o.x,y:o.y-22,angle:base+off,speed:1000,range:a.range,damage:a.damage,weapon:a.weapon,contact:12,bounces:(a.bounces??2)+(rank(s,'shurikenBounce')?2:0),clone:o!==p,color:RANGER_COLORS.ninja});if(o!==p)o.act=.3;}return true;}
 if(k==='bladefan'){r.blades={spec:a,t:0,first:true};r.bladeHeld=true;r.cooldowns.E=0;return true;}
 if(k==='shadow'){const n=rank(s,'shadowFive')?5:3;r.buffs.shadow=a.duration;const bp=BASIC_ATTACKS[c.weapon?.primary]??BASIC_ATTACKS.shuriken;r.shadowDps=bp.damage/bp.interval*(c.weapon?.primary==='chakram'?2:1)*(c.weapon?.speed??1);r.shadowWeapon={...c.weapon};r.shadowSpec=a;r.clones=[...Array(n)].map((_,i)=>{const ang=i*Math.PI*2/n-Math.PI/2,ox=Math.cos(ang)*140,oy=Math.sin(ang)*95;/* Oct 19 (user): spread further out (was 72/48) */return {ox,oy,x:p.x,y:p.y,fx:p.x,fy:p.y,tx:p.x+ox,ty:p.y+oy,t:0,act:0,row:p.row??2,target:null};});fx(r,'shadowBurst',{x:p.x,y:p.y,duration:.6});shake(r,3);return true;}
 if(k==='catalyst'){const t=aimPoint(p,aim,a.range),offs=rank(s,'catalystDouble')?[-26,26]:[0];for(const o of offs){const nx=-Math.sin(angle)*o,ny=Math.cos(angle)*o*.65;r.flasks.push({kind:'catalyst',x0:p.x,y0:p.y-20,x:t.x+nx,y:t.y+ny,t:0,dur:.32,spec:a});}return true;}
 if(k==='volatile'){const t=aimPoint(p,aim,a.range);r.flasks.push({kind:'volatile',x0:p.x,y0:p.y-20,x:t.x,y:t.y,t:0,dur:.5,spec:a});return true;}
 if(k==='reactive'){reactive(r,c,s,p,a,props);if(rank(s,'reactiveRepeat'))r.queue.push({delay:1,run:()=>r.pending.push(...knock(r,c,s,r.pos??p,a,props,.6))});return true;}
 if(k==='grand'){const t=aimPoint(p,aim,a.range);r.flasks.push({kind:'grandflask',x0:p.x,y0:p.y-60,x:t.x,y:t.y,t:0,dur:.75,height:220,spec:a,seed:(Math.random()*1e4)|0});return true;}
 if(k==='fan'){r.fan={left:a.count+(rank(s,'fanMore')?3:0),t:0,spec:a,n:0};return true;}
 if(k==='quickstep'){const v=r.moveVector&&Math.hypot(r.moveVector.x,r.moveVector.y)>.1?Math.atan2(r.moveVector.y,r.moveVector.x):angle;r.step={angle:v,left:a.range,speed:a.range/a.duration};r.invulnerable=Math.max(r.invulnerable,.5);fx(r,'step',{x:p.x,y:p.y,angle:v,duration:.3});
  if(rank(s,'quickShots'))for(const t of c.targets.filter(alive).sort((x,y)=>iso(x,p)-iso(y,p)).slice(0,3))shot(r,{kind:'bullet',x:p.x,y:p.y-24,angle:Math.atan2(t.y-p.y,t.x-p.x),speed:1400,range:620,damage:70*buff(s,'damage','RMB'),contact:8,color:RANGER_COLORS.gunslinger});
  if(rank(s,'quickReload'))gain(r,refundCast(a,10));return true;}
 if(k==='line'){r.pending.push(...pierceLine(r,c,s,p,angle,a,1,props));if(rank(s,'lineTwin'))r.queue.push({delay:.2,run:()=>r.pending.push(...pierceLine(r,c,s,r.pos??p,r.lastAim??angle,a,.6,props))});shake(r,4);return true;}
 if(k==='barrage'){r.buffs.barrage=a.duration;r.barrageSpec=a;r.barrageT=0;shake(r,2);return true;}
 return false;}
export function releaseRanger(r,c,s,p,aim,key){
 if(key==='E'){const on=!!r.blades;r.bladeHeld=false;return on;}
 if(key!=='RMB'||!r.charge)return false;const ch=r.charge,a=ch.spec,f=Math.min(1,ch.t/(a.charge*(rank(s,'quickDraw')?.6:1))),angle=aimAngle(p,aim),dmg=a.damage+(a.maxDamage-a.damage)*f;r.charge=null;r.cooldowns.RMB=a.cooldown;setPose(r,'power',angle,.3);
 const el=rangerElement(r,s);shot(r,{kind:'power',x:p.x,y:p.y-26,angle,speed:1500,range:a.range,damage:dmg,contact:a.width*(.7+.3*f),pierce:99,el,mark:rank(s,'markingShot')>0,color:el!=='plain'?ARROW_COLORS[el]:RANGER_COLORS.archer,size:1+f});
 if(rank(s,'splitShot'))for(const o of [-.14,.14])shot(r,{kind:'arrow',x:p.x,y:p.y-26,angle:angle+o,speed:1300,range:a.range*.8,damage:dmg*.4,weapon:a.weapon,contact:12,pierce:3,el,color:ARROW_COLORS[el]});
 shake(r,2+3*f);fx(r,'powerMuzzle',{x:p.x,y:p.y-26,angle,power:f,color:ARROW_COLORS[el],duration:.3});return true;}
function knock(r,c,s,p,a,props,f=1){const R=a.radius;fx(r,'reactiveRing',{x:p.x,y:p.y,radius:R,duration:.5});shake(r,3);
 for(const e of c.targets)if(alive(e)&&e.role!=='boss'){const d=iso(e,p);if(d<R*1.3&&d>1){const dx=e.x-p.x,dy=e.y-p.y,n=Math.hypot(dx,dy)||1,push=130*f*(1-d/(R*1.6));movePlayer(e,dx/n*push,dy/n*push,props);}}
 return area(r,c,s,p,R,a.damage*f,props,{heavy:true,stagger:.5,push:10});}
function reactive(r,c,s,p,a,props){grantBarrier(s,outputAmount(120*buff(s,'barrier','Q'),c.weapon,'barrier'),a.duration);if(rank(s,'reactiveHeal'))boundedHeal(c,s,outputAmount(s.maxHp*.08,c.weapon,'healing')*(s.world?.healing??1));
 r.pools.push({x:p.x,y:p.y,R:140,kind:'frost',remaining:a.duration,max:a.duration,tick:0});r.pending.push(...knock(r,c,s,p,a,props));fx(r,'glass',{x:p.x,y:p.y,duration:.5,color:'#9ff4ff'});}
// Catalyst reactions read what the flask lands in: burning -> Explosion, poisoned/toxic -> Poison Burst,
// slowed/frost -> Shatter, otherwise Ignite. Grand Experiment's enhanced window boosts every reaction.
function catalyst(r,c,s,pt,a,props,f=1,chain=true){
 const enh=r.buffs.enhanced>0,R=a.radius*(enh?1.5:1),dmg=a.damage*f*(enh?1.6:1),near=c.targets.filter(e=>alive(e)&&iso(e,pt)<R+(e.radius??14));
 const kind=near.some(e=>e.rBurn)||poolAt(r,pt,'fire')?'explode':near.some(e=>e.rPoison)||poolAt(r,pt,'toxic')?'burst':near.some(e=>e.slow>0)||poolAt(r,pt,'frost')?'shatter':'ignite';
 const out=[];
 if(kind==='explode'||enh&&kind!=='burst'){out.push(...area(r,c,s,pt,R*1.6,dmg*2.5,props,{weapon:a.weapon,attackId:a.actionId,targetCap:1,heavy:true,stagger:.4,push:18},e=>burn(s,e)));fx(r,'explode',{x:pt.x,y:pt.y,radius:R*1.6,duration:.55});shake(r,3);}
 if(kind==='burst'||enh&&kind!=='explode'){for(const e of c.targets)if(alive(e)&&iso(e,pt)<R*1.5+(e.radius??14)){const st=e.rPoison?.stacks??0;e.rPoison=null;out.push(...hit(r,c,s,pt,e,dmg+25*st*(enh?1.6:1),props,{weapon:a.weapon,attackId:a.actionId,targetCap:1,stagger:.2,push:6}));poison(s,e,2);}fx(r,'poisonBurst',{x:pt.x,y:pt.y,radius:R*1.5,duration:.55});}
 if(kind==='shatter'){out.push(...area(r,c,s,pt,R*1.2,dmg*2,props,{weapon:a.weapon,attackId:a.actionId,targetCap:1,stagger:.6,push:8},e=>{e.slow=Math.max(e.slow??0,2);if(e.role!=='boss')e.hurt=Math.max(e.hurt,.4);}));fx(r,'shatter',{x:pt.x,y:pt.y,radius:R*1.2,duration:.5});}
 if(kind==='ignite'&&!enh){out.push(...area(r,c,s,pt,R,dmg,props,{weapon:a.weapon,attackId:a.actionId,targetCap:1,stagger:.15,push:4},e=>burn(s,e)));fx(r,'splash',{x:pt.x,y:pt.y,radius:R,duration:.4,color:'#ff9a3d'});if(rank(s,'catalystPuddle'))r.pools.push({x:pt.x,y:pt.y,R:60,kind:'fire',remaining:2,max:2,tick:0});}
 if(chain&&rank(s,'catalystChain')){const t=nearest(c,pt,240,new Set(near.map(e=>e.id)));if(t)out.push(...catalyst(r,c,s,t,a,props,f*.6,false));}
 return out;}
/* Oct 19 (user): Grand Flask lands: a huge blast; every E (Volatile Mixture) pool it touches detonates for 3x the E impact and is used up. */
function grand(r,c,s,pt,a,props){const out=[],pow=rank(s,'grandPower')?1.3:1,E=rangerAbility(s,'E'),poolHit=(E?.damage??24)*3*3*pow;fx(r,'grandFlash',{x:pt.x,y:pt.y,duration:.8});shake(r,8);
 out.push(...area(r,c,s,pt,a.radius,a.damage*pow,props,{heavy:true,stagger:.6,push:18},e=>poison(s,e,2)));(r.lobFx??=[]).push({kind:'grand',x:pt.x,y:pt.y,R:a.radius,born:r.shakeT,seed:(Math.random()*1e4)|0});
 for(const q of r.pools){if(q.kind!=='toxic'||iso(q,pt)>a.radius+q.R)continue;q.remaining=0;const R=q.R*1.2;out.push(...area(r,c,s,q,R,poolHit,props,{heavy:true,stagger:.5,push:14},e=>poison(s,e,3)));(r.lobFx??=[]).push({kind:'poolBlast',x:q.x,y:q.y,R,born:r.shakeT+.08,seed:(Math.random()*1e4)|0});if(rank(s,'grandRefund'))gain(r,refundCast(a,5));}
 r.pools=r.pools.filter(q=>q.remaining>0);if(rank(s,'grandSpawn'))r.pools.push({x:pt.x,y:pt.y,R:150,kind:'toxic',remaining:5,max:5,tick:0});return out;}
function pierceLine(r,c,s,p,angle,a,f,props){const out=[],cos=Math.cos(angle),sin=Math.sin(angle);let len=a.range;for(let t=0;t<a.range;t+=8){if(blocked(p.x+cos*t,p.y+sin*t,props,3,true)){len=t;break;}}
 for(const e of c.targets){if(!alive(e))continue;const dx=e.x-p.x,dy=e.y-p.y,along=dx*cos+dy*sin,perp=Math.abs(-dx*sin+dy*cos);if(along>0&&along<len&&perp<a.width+(e.radius??14)){out.push(...hit(r,c,s,p,e,a.damage*f,props,{heavy:true,stagger:.5,push:12}));mark(e,a.duration+(rank(s,'lineLong')?3:0));}}
 const end={x:p.x+cos*len,y:p.y+sin*len};fx(r,'line',{x:p.x,y:p.y-24,x2:end.x,y2:end.y-24,duration:.4,width:a.width});
 if(rank(s,'lineExplode')){out.push(...area(r,c,s,end,100,a.damage*.5*f,props,{stagger:.3,push:10}));fx(r,'explode',{x:end.x,y:end.y,radius:100,duration:.5,color:'#ffc24a'});}return out;}
function fireBasic(r,c,s,p,angle,origin,secondary){const el=rangerElement(r,s),focus=r.buffs.focus>0,w=(secondary?r.shadowWeapon:c.weapon)??{},surge=r.surge>0&&!secondary;if(surge)r.surge--;
 const pr=rangerPrimary({weapon:w}),fam=w.primary&&BASIC_ATTACKS[w.primary]?w.primary:'bow',dmg=BASIC_ATTACKS[fam].damage*(surge?1.5:1)*(secondary?(r.shadowSpec?.copy??1):1);
 if(!secondary){r.lmbCount=(r.lmbCount??0)+1;r.basicAction=beginAction(c,(pr.hawk?1:BASIC_ATTACKS[fam].interval)/boundedBurst(c,'attackSpeed',(w.speed??1)*(focus?2.2:1),2.5,3.5),{...w});}
 // Pistols alternate guns: each shot leaves from its own side. Shuriken: every 3rd throw fans out 3.
 let ox=0,oy=0;if(pr.alternate){const side=(r.lmbCount%2?1:-1)*12;ox=-Math.sin(angle)*side;oy=Math.cos(angle)*side*.65;}
 /* Oct 18 new families: cones (Flamethrower / Toxic Canister), lobs (Potion Satchel / Bomb Bag) and barrels (Sludge Barrel). */
 if(pr.cone){if(!secondary)coneBasic(r,c,s,origin,angle,pr,dmg,w);return;}
 if(pr.lob){const t=aimPoint(origin,r.aimPoint,pr.range*(w.reach??1)),every=s.skills?.[rangerSpec(s)+'-attack-rhythm2']?2:s.skills?.[rangerSpec(s)+'-attack-rhythm1']?3:4,pel=pr.lob==='potion'&&r.lmbCount%every===0?['fire','frost','poison'][(r.potionEl=(r.potionEl??-1)+1)%3]:null;/* Oct 19 (user): every 4th, 3rd with Rhythm 1, 2nd with Rhythm 2 */
  r.flasks.push({kind:pr.lob,x0:origin.x,y0:origin.y-(pr.lob==='potion'?58:20),x:t.x,y:t.y,t:0,dur:pr.dur,height:pr.height,angle,skips:pr.skips??0,spec:{damage:dmg,radius:pr.radius*(w.aoe??1)},basic:true,secondary,attackId:r.basicAction?.id,weapon:secondary?r.shadowWeapon:r.basicAction?.weapon,el:pel,seed:(Math.random()*1e4)|0});
  if(!secondary)(r.muzzles??=[]).push({name:'rgr.snap',x:origin.x+Math.cos(angle)*16,y:origin.y-24+Math.sin(angle)*11,angle,el:pel,scale:.9,seed:(Math.random()*1e4)|0,born:r.shakeT});return;}
 if(pr.barrel){if(!secondary)barrelPress(r,c,s,p,pr,dmg,w);return;}
 /* Oct 19 (user): Toxic Canister leaves round poison pools behind you as you move (no forward spray); standing still drops one under you now and then. */
 if(pr.trailPools){if(secondary)return;const L=r.trailAt,mv=r.moveVector&&Math.hypot(r.moveVector.x,r.moveVector.y)>.1,moved=L?Math.hypot(origin.x-L.x,origin.y-L.y):1e9,T=r.shakeT;if(moved>36||!L||!mv&&T-(L.t??0)>.7){const back=mv?Math.atan2(r.moveVector.y,r.moveVector.x)+Math.PI:0,d=mv?24:0;r.trailAt={x:origin.x,y:origin.y,t:T};r.pools.push({x:origin.x+Math.cos(back)*d,y:origin.y+Math.sin(back)*d*.65,R:pr.poolR*(w.aoe??1),kind:'toxictrail',remaining:3,max:3,tick:0,trail:true,dmg,weapon:{...w},seed:(Math.random()*1e4)|0});}return;}
 if(pr.hawk){if(!secondary)launchHawk(r,c,s,p,angle,dmg,el,r.aimPoint,boundedBurst(c,'attackSpeed',(w.speed??1)*(focus?2.2:1),2.5,3.5));return;}
 const angles=pr.pellets?[...Array(pr.pellets)].map((_,i)=>(-pr.spread/2+pr.spread*i/(pr.pellets-1))*(w.mods?.spread??1)):pr.fan&&r.lmbCount%pr.fan===0?[-.2,0,.2]:[0],blast=pr.pellets?(r.blastId=(r.blastId??0)+1):0;
 for(const o of angles)shot(r,{kind:'arrow',targetCap:pr.fan?1:null,attackId:r.basicAction?.id,weapon:secondary?r.shadowWeapon:r.basicAction?.weapon,look:pr.look,blast,cap:pr.pelletCap,bleed:!!pr.bleed,chakram:!!pr.chakram,returns:!!pr.chakram,basic:true,secondary,x:origin.x+ox,y:origin.y-24+oy,side:pr.alternate&&r.lmbCount%2===0?'l':'r',angle:angle+o,speed:pr.speed*(w.projectile??1),range:pr.range*(w.reach??1),damage:dmg,contact:pr.contact*(w.mods?.contact??1),pierce:pr.pierce+(w.mods?.pierce??0)+(focus?2:0)+(focus&&rank(s,'focusPierce')?3:0),el,color:el!=='plain'?ARROW_COLORS[el]:RANGER_COLORS[rangerSpec(s)],ghost:secondary});}
// Falconer: one hawk at a time (and a short wait after a missed catch). Chakram: at most 2 of yours in the air.
function coneBasic(r,c,s,o,angle,pr,dmg,w){const C=pr.cone,R=C.range*(w.reach??1)*(w.aoe??1),half=C.half*(w.mods?.arc??1),props=r.props??[];r.coneTick=(r.coneTick??0)+1;
 for(const e of c.targets){if(!alive(e))continue;const dx=e.x-o.x,dy=e.y-o.y,d=Math.hypot(dx,dy/.65),rad=e.radius??14;if(d>R+rad)continue;const da=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));if(Math.abs(da)>half+rad/Math.max(40,d))continue;
  r.pending.push(...hit(r,c,s,o,e,dmg,props,{basic:true,weapon:r.basicAction?.weapon,attackId:r.basicAction?.id,el:C.el,stagger:.05,push:1,fxAngle:angle,noFx:r.coneTick%3!==0}));}
 r.coneFx={x:o.x,y:o.y,angle,range:R,half,look:C.look,until:r.shakeT+.16,born:r.coneFx&&r.coneFx.until>r.shakeT?r.coneFx.born:r.shakeT};
 /* Toxic Canister: a poison patch every ~45 px you walk while spraying. */
 if(pr.trail){const L=r.trailAt;if(!L||Math.hypot(o.x-L.x,o.y-L.y)>45){r.trailAt={x:o.x,y:o.y};r.pools.push({x:o.x,y:o.y,R:46,kind:'toxic',remaining:2.5,max:2.5,tick:0,trail:true});}}}
/* Sludge Barrel: a press near one of your barrels (70 px) lights it; otherwise places a new barrel (max 3; with 3 out it lights the nearest). */
function barrelPress(r,c,s,p,pr,dmg,w){const t=aimPoint(p,r.aimPoint,pr.range*(w.reach??1));r.barrels??=[];let near=null,bd=110;/* Oct 19: barrels are twice the size; easier to click (70 -> 110) */
 for(const b of r.barrels){if(b.fuse!=null)continue;const d=Math.hypot(b.x-t.x,(b.y-t.y)/.65);if(d<bd){bd=d;near=b;}}
 if(!near&&r.barrels.filter(b=>b.fuse==null).length>=pr.max)near=r.barrels.filter(b=>b.fuse==null).sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0];
 if(near){near.fuse=0;near.attackId=r.basicAction?.id;near.weapon=r.basicAction?.weapon;near.damage=dmg;near.R=pr.blast*(w.aoe??1);return;}
 if(blocked(t.x,t.y,r.props??[],14))return;r.barrels.push({x:t.x,y:t.y,age:0,life:10,fuse:null,R:pr.blast*(w.aoe??1),damage:dmg,seed:(Math.random()*1e4)|0,born:r.shakeT});fx(r,'barrelDrop',{x:t.x,y:t.y,duration:.35});}
function tickBarrels(r,c,s,props,dt,events){if(!r.barrels?.length)return;
 for(const b of r.barrels){b.age+=dt;if(b.fuse==null){if(b.age>b.life)b.gone=true;continue;}b.fuse-=dt;if(b.fuse>0||b.gone)continue;b.gone=true;
  events.push(...area(r,c,s,b,b.R,b.damage,props,{basic:true,weapon:b.weapon,attackId:b.attackId,heavy:true,stagger:.5,push:16}));
  r.pools.push({x:b.x,y:b.y,R:b.R*.85,kind:'sludge',remaining:3,max:3,tick:0});(r.lobFx??=[]).push({kind:'barrel',x:b.x,y:b.y,R:b.R,born:r.shakeT,seed:b.seed});shake(r,4);
  /* chain: other barrels within 230 go off .15s later with the same attack */
  for(const o of r.barrels)if(o!==b&&!o.gone&&o.fuse==null&&Math.hypot(o.x-b.x,(o.y-b.y)/.65)<340)/* Oct 19 (user: hard to chain): 230 -> 340 */{o.fuse=.15;o.attackId=b.attackId;o.weapon=b.weapon;o.damage=b.damage;}}
 r.barrels=r.barrels.filter(b=>!b.gone);r.lobFx=(r.lobFx??[]).filter(f=>r.shakeT-f.born<1.2);}
function lmbReady(r,pr){if(pr.hawk)return !r.hawk&&!(r.hawkCD>0);if(pr.maxOut)return r.shots.filter(b=>b.chakram&&!b.secondary).length<pr.maxOut;return true;}
// Falconer's Glove (Oct 17, user): out through enemies to the cursor, back along a curve to a marked spot near you.
// Standing on the spot (Draven-style catch) when it lands looses hawks at the 3 nearest enemies for +50%.
/* Oct 18 (user): range 600 -> 650; while moving the spot leads ahead of you along your run direction (lead/leadJitter). */
const HAWK={out:.45,back:.65,catchR:45,spotMin:70,spotMax:130,lead:140,leadJitter:.35,missWait:.6,follow:.8,followRange:700,range:650};
function hawkFlash(r,x,y,angle,el,scale){(r.muzzles??=[]).push({name:'rgr.snap',x,y,angle,el,scale,seed:(Math.random()*1e4)|0,born:r.shakeT});if(r.muzzles.length>30)r.muzzles.shift();}
function launchHawk(r,c,s,p,angle,dmg,el,aim,sp){const d=aim?Math.min(HAWK.range*(c.weapon?.reach??1),Math.hypot(aim.x-p.x,aim.y-p.y)):400;
 hawkFlash(r,p.x,p.y-34,angle,el,1.2);
 r.hawk={attackId:r.basicAction?.id,weapon:r.basicAction?.weapon,phase:'out',x:p.x,y:p.y-34,ax:p.x,ay:p.y-34,bx:p.x+Math.cos(angle)*d,by:p.y-34+Math.sin(angle)*d,t:0,dur:HAWK.out/sp,sp,hit:new Set(),damage:dmg,el,angle};}
function hawkHits(r,c,s,h,x0,y0,x1,y1,props,events,opts={}){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/8));for(let i=1;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;
 for(const e of c.targets){if(h.hit.has(e.id)||!alive(e)||!bodyHit(e,x,y,16*(h.weapon?.mods?.contact??1)))continue;h.hit.add(e.id);events.push(...hit(r,c,s,{x,y:y+34},e,h.damage,props,{basic:true,attackId:h.attackId,weapon:h.weapon,secondary:!!h.follow,stagger:.15,push:5,el:h.el,...opts}));sparks(r,x,y,'#ffcf7a',6,150);}}}
function tickHawk(r,c,s,p,props,dt,events,move){r.hawkCD=Math.max(0,(r.hawkCD??0)-dt);
 for(const f of r.hawkFollow??[]){f.t+=dt;const k=Math.min(1,f.t/f.dur),ox=f.x,oy=f.y;f.x=f.ax+(f.bx-f.ax)*k;f.y=f.ay+(f.by-f.ay)*k;f.angle=Math.atan2(f.by-f.ay,f.bx-f.ax);hawkHits(r,c,s,f,ox,oy,f.x,f.y,props,events);}
 if(r.hawkFollow)r.hawkFollow=r.hawkFollow.filter(f=>f.t<f.dur);
 const h=r.hawk;if(!h)return;h.t+=dt;const k=Math.min(1,h.t/h.dur),ox=h.x,oy=h.y;
 if(h.phase==='out'){h.x=h.ax+(h.bx-h.ax)*k;h.y=h.ay+(h.by-h.ay)*k;h.angle=Math.atan2(h.by-h.ay,h.bx-h.ax);hawkHits(r,c,s,h,ox,oy,h.x,h.y,props,events);
  if(k>=1){let spot=null;const mv=move&&Math.hypot(move.x,move.y)>.1?Math.atan2(move.y,move.x):null;
   if(mv!==null)for(let i=0;i<8&&!spot;i++){const a=mv+(Math.random()*2-1)*HAWK.leadJitter*(1+i*.25),d=HAWK.lead*(1-i*.08),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;if(!blocked(x,y,props,12))spot={x,y};}
   for(let i=0;i<8&&!spot;i++){const a=Math.random()*Math.PI*2,d=HAWK.spotMin+Math.random()*(HAWK.spotMax-HAWK.spotMin),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d*.65;if(!blocked(x,y,props,12))spot={x,y};}spot??={x:p.x,y:p.y};
   const mx=(h.x+spot.x)/2,my=(h.y+spot.y-34)/2,dx=spot.x-h.x,dy=spot.y-34-h.y,n=Math.hypot(dx,dy)||1,side=Math.random()<.5?-1:1;
   Object.assign(h,{phase:'back',ax:h.x,ay:h.y,cx:mx-dy/n*160*side,cy:my+dx/n*110*side,bx:spot.x,by:spot.y-34,t:0,dur:HAWK.back/h.sp,hit:new Set()});r.catchSpot={x:spot.x,y:spot.y,R:HAWK.catchR,t:0,dur:h.dur};}}
 else{const u=1-k;h.x=u*u*h.ax+2*u*k*h.cx+k*k*h.bx;h.y=u*u*h.ay+2*u*k*h.cy+k*k*h.by;h.angle=Math.atan2(h.y-oy,h.x-ox);hawkHits(r,c,s,h,ox,oy,h.x,h.y,props,events);if(r.catchSpot)r.catchSpot.t=h.t;
  if(k>=1){const spot=r.catchSpot;r.hawk=null;r.catchSpot=null;
   if(spot&&iso(p,spot)<HAWK.catchR){fx(r,'hawkCatch',{x:spot.x,y:spot.y,duration:.45});shake(r,2);
    for(const t of c.targets.filter(e=>alive(e)&&iso(e,p)<HAWK.followRange).sort((a,b)=>iso(a,p)-iso(b,p)).slice(0,3)){const a=Math.atan2(t.y-20-(p.y-34),t.x-p.x),d=Math.hypot(t.x-p.x,t.y-20-(p.y-34))+120;hawkFlash(r,p.x,p.y-34,a,h.el,.9);(r.hawkFollow??=[]).push({x:p.x,y:p.y-34,ax:p.x,ay:p.y-34,bx:p.x+Math.cos(a)*d,by:p.y-34+Math.sin(a)*d,t:0,dur:Math.max(.2,d/1400),hit:new Set(),damage:h.damage*HAWK.follow,weapon:h.weapon,attackId:h.attackId,el:h.el,angle:a,follow:true});}}
   else{fx(r,'hawkMiss',{x:spot?.x??p.x,y:spot?.y??p.y,duration:.5});r.hawkCD=HAWK.missWait;}}}}
function tickRangerOwned(r,c,s,p,aim,props,dt,move){
 c.classId='ranger';r.currentWeapon=c.weapon;s.outputWeapon=c.weapon;advanceActor(c,dt);r.props=props;const events=(r.pending??=[]).splice(0);r.pos={x:p.x,y:p.y};r.moveVector=move;r.aimPoint=aim;if(aim)r.lastAim=aimAngle(p,aim);
 if(s.dead){cancelRanger(r,s,p);return events;}
 const spec=rangerSpec(s),cdRate=dt;
 r.idle+=dt;if(r.idle>MOMENTUM.decayDelay)r.momentum=Math.max(0,r.momentum-MOMENTUM.decay*dt);
 for(const k in r.cooldowns)r.cooldowns[k]=Math.max(0,r.cooldowns[k]-cdRate);for(const k in r.buffs)r.buffs[k]=Math.max(0,r.buffs[k]-dt);
 const wasInv=r.invulnerable>0;r.invulnerable=Math.max(0,r.invulnerable-dt);if(wasInv&&r.invulnerable<=0&&r.smokeAmbush){r.ambush=true;r.smokeAmbush=false;}
 r.shakeT+=dt;r.shake=Math.max(0,r.shake-dt*18);r.aimHold=Math.max(0,r.aimHold-dt);if(r.pose){r.pose.t+=dt;if(r.pose.t>=r.pose.dur)r.pose=null;}
 c.rangerCrit=r.buffs.focus>0?.25+(rank(s,'focusPierce')?.1:0):0;
 for(const q of r.queue){q.delay-=dt;if(q.delay<=0)q.run();}r.queue=r.queue.filter(q=>q.delay>0);
 // Bow LMB (Quick Shot): hold to fire. Hunter's Focus: much faster, piercing, auto-targets Marked enemies.
 r.fireT-=dt;const w=c.weapon??{},pr=rangerPrimary(c);
 // Long Bow (Oct 17, user): a short visible draw before each shot; letting go of LMB cancels it.
 if(r.lmbDraw&&(!r.held||r.charge||r.step))r.lmbDraw=null;
 if(r.held&&!r.charge&&!r.fan&&!r.blades&&!(r.buffs.barrage>0)&&r.fireT<=0&&!r.step&&lmbReady(r,pr)){const speed=boundedBurst(c,'attackSpeed',(w.speed??1)*(r.buffs.focus>0?2.2:1),2.5,3.5),draw=(pr.draw??0)/speed;
  if(draw>0&&!r.lmbDraw)r.lmbDraw={t:0,dur:draw};if(r.lmbDraw){r.lmbDraw.t+=dt;r.lmbDraw.angle=aimAngle(p,aim);r.aimHold=.6;}
  if(!r.lmbDraw||r.lmbDraw.t>=r.lmbDraw.dur){r.lmbDraw=null;let angle=aimAngle(p,aim);
  // Pistols (Oct 17, user): each gun shoots a different enemy, the nearest ones; the cursor only aims when nobody is in range.
  if(pr.autoTarget){const aimA=angle,near=c.targets.filter(e=>alive(e)&&iso(e,p)<pr.range*(w.reach??1)&&Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-p.y,e.x-p.x)-aimA),Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-aimA)))<=Math.PI/6).sort((x,y)=>iso(x,p)-iso(y,p)).slice(0,2),t=near[((r.lmbCount??0)+1)%2?0:1]??near[0];if(t)angle=Math.atan2(t.y-p.y,t.x-p.x);}
  if(pr.spread3){const near=c.targets.filter(e=>alive(e)&&iso(e,p)<pr.range*(w.reach??1)).sort((x,y)=>iso(x,p)-iso(y,p)).slice(0,3);const t=near[(r.lmbCount??0)%Math.max(1,near.length)];if(t)angle=Math.atan2(t.y-p.y,t.x-p.x);}
  if(r.buffs.focus>0){const t=c.targets.filter(e=>alive(e)&&e.rMarked>0&&iso(e,p)<750).sort((x,y)=>iso(x,p)-iso(y,p))[0];if(t)angle=Math.atan2(t.y-p.y,t.x-p.x);
   r.focusShots=(r.focusShots??0)+1;if(rank(s,'focusVolley')&&r.focusShots%4===0&&t)r.volleys.push({x:t.x,y:t.y,R:70,spec:{damage:60},waves:1,done:0,t:0,gap:.25,el:rangerElement(r,s),focus:true,born:r.shakeT,seed:(Math.random()*1e4)|0});}
  r.fireT=(BASIC_ATTACKS[w.primary]??BASIC_ATTACKS.bow).interval/speed-draw;fireBasic(r,c,s,p,angle,p,false);if(pr.reload)r.reload={t:0,dur:pr.reload/speed};if(!pr.trailPools){/* Oct 19: the canister just leaves pools behind you, no aim pose */r.aimHold=.6;r.pose={sheet:'QuickShot',row:directionRow(Math.cos(angle),Math.sin(angle)),t:0,dur:Math.max(.18,Math.min(pr.lob==='potion'?.46:.4,r.fireT))};}
  if(r.buffs.shadow>0)for(const cl of r.clones){fireBasic(r,c,s,p,cloneAim(cl,aim,angle),cl,true);cl.act=.3;}}}
 if(r.charge){r.charge.t+=dt;r.charge.angle=aimAngle(p,aim);r.aimHold=.6;}
 // Gunslinger: Fan the Hammer burst, Bullet Barrage stream, Quickstep movement.
 if(r.fan){r.fan.t-=dt;while(r.fan&&r.fan.t<=0){r.fan.t+=.08;r.fan.n++;const a=r.fan.spec;shot(r,{kind:'bullet',x:p.x,y:p.y-24,angle:aimAngle(p,aim)+(Math.random()-.5)*.12,speed:1400,range:a.range,damage:a.damage,weapon:a.weapon,contact:8,pierce:rank(s,'fanPierce')?2:1,fan:true,markShot:rank(s,'fanMark')&&r.fan.n%3===0,color:RANGER_COLORS.gunslinger});r.aimHold=.6;if(--r.fan.left<=0)r.fan=null;}}
 // Ninja Blade Fan (Oct 18): rooted channel, one fan wave every gap toward the cursor (clones throw their own fans).
 if(r.blades){r.blades.t-=dt;while(r.blades&&r.blades.t<=0){const a=r.blades.spec,n=a.count+(rank(s,'bladeMore')?3:0),main=aimAngle(p,aim),waveCost=a.cost*(rank(s,'fanWave')?.75:1);
  /* Channel: the first wave was paid on cast; each later wave needs E still held and enough Momentum, else the channel ends and the cooldown starts. */
  if(!r.blades.first){if(!r.bladeHeld||r.momentum<waveCost){r.blades=null;r.cooldowns.E=a.cooldown;break;}r.momentum-=waveCost;}r.blades.first=false;r.blades.t+=a.gap;
  for(const o of [p,...mirrorClones(r)]){const base=o===p?main:cloneAim(o,aim,main);for(let i=0;i<n;i++)shot(r,{kind:'shuriken',x:o.x,y:o.y-22,angle:base+(n>1?(i/(n-1)-.5)*a.spread:0),speed:900,range:a.range,damage:a.damage,weapon:a.weapon,contact:12,pierce:99,cyclone:true,returns:rank(s,'fanReturn')>0,clone:o!==p,color:RANGER_COLORS.ninja});if(o!==p)o.act=.3;}
  setPose(r,'shuriken',main,.22);r.aimHold=.6;shake(r,1);}}
 if(r.buffs.barrage>0){r.barrageT-=dt;const wide=rank(s,'barrageWide'),gap=wide?.04:.06;while(r.barrageT<=0){r.barrageT+=gap;const a=r.barrageSpec;shot(r,{kind:'bullet',x:p.x,y:p.y-24,angle:aimAngle(p,aim)+(Math.random()-.5)*(wide?.3:.15),speed:1500,range:640,damage:a.damage,weapon:a.weapon,contact:7,barrage:true,color:RANGER_COLORS.gunslinger});}r.aimHold=.6;}
 if(r.step){const d=Math.min(r.step.left,r.step.speed*dt);for(let t=0;t<d;t+=5){const st=Math.min(5,d-t),nx=p.x+Math.cos(r.step.angle)*st,ny=p.y+Math.sin(r.step.angle)*st;if(blocked(nx,ny,props,13)){r.step.left=0;break;}movePlayer(p,Math.cos(r.step.angle)*st,Math.sin(r.step.angle)*st,props);}r.step.left-=d;if(r.step.left<=0)r.step=null;}
 // Damage over time: burn 14 every .5s; poison 6 per stack every .5s.
 for(const e of c.targets){if(e.timeStopped)continue;if(e.state!=='alive'){e.rBurn=null;e.rPoison=null;e.rBleed=null;continue;}
  if(e.rBurn){const b=e.rBurn;b.remaining-=dt;b.pulse-=dt;if(b.pulse<=0){b.pulse+=.5;events.push(...hit(r,c,s,e,e,b.damage,props,{weapon:b.weapon,dot:true,push:0,stagger:0}));}if(b.remaining<=0)e.rBurn=null;}
  if(e.rBleed){const q=e.rBleed;q.remaining-=dt;q.pulse-=dt;if(q.pulse<=0){q.pulse+=.5;events.push(...hit(r,c,s,e,e,q.damage*q.stacks,props,{weapon:q.weapon,dot:true,push:0,stagger:0}));}if(q.remaining<=0)e.rBleed=null;}
  if(e.rPoison){const q=e.rPoison;q.remaining-=dt;q.pulse-=dt;if(q.pulse<=0){q.pulse+=.5;events.push(...hit(r,c,s,e,e,6*q.stacks,props,{weapon:q.weapon,dot:true,push:0,stagger:0}));}if(q.remaining<=0)e.rPoison=null;}}
 // Volleys: waves of arrows rain down on the target circle and Mark everything they hit.
 for(const v of r.volleys){v.t-=dt;while(v.done<v.waves&&v.t<=0){v.t+=v.gap;v.done++;const last=v.done===v.waves&&!v.focus&&rank(s,'volleyFinale');volleyFx(r,{kind:'wave',x:v.x,y:v.y,R:v.R,el:v.el,n:v.focus?4:9,last,seed:v.seed+v.done*97});shake(r,last?3.5:v.focus?.8:1.4);if(v.done===v.waves&&!v.focus)volleyFx(r,{kind:'after',x:v.x,y:v.y,R:v.R,el:v.el,seed:v.seed});fx(r,'volleyWave',{x:v.x,y:v.y,radius:v.R,duration:.35,color:ARROW_COLORS[v.el]});
   for(const e of c.targets)if(alive(e)&&iso(e,v)<v.R+(e.radius??14)){const m=(rank(s,'volleyMarkBurst')&&e.rMarked>0?1.25:1)*(last?3:1);events.push(...hit(r,c,s,v,e,v.spec.damage*m,props,{weapon:v.spec.weapon,stagger:.1,push:2,el:v.el}));mark(e,4);}}}
 r.volleys=r.volleys.filter(v=>v.done<v.waves);
 // Smoke: enemies inside are Exposed (Blinding Smoke also slows them).
 /* Oct 18 (user): enemies can't see a Ninja standing in his own smoke (area attacks still hit). Per player: flag on this hero's record. */
 {const hid=rangerSpec(s)==='ninja'&&r.smokes.some(sm=>sm.remaining>0&&iso(sm,p)<sm.R);if(hid&&!p.unseen)p.lastSeen={x:p.x,y:p.y};p.unseen=hid;}
 for(const sm of r.smokes){sm.remaining-=dt;for(const e of c.targets)if(alive(e)&&iso(e,sm)<sm.R){expose(e,2);if(rank(s,'smokeBlind'))e.slow=Math.max(e.slow??0,.4);}}r.smokes=r.smokes.filter(sm=>sm.remaining>0);
 // Shadow clones dash between enemies, striking (and Exposing with Shadow Marks).
 // Shadow Clones (Oct 18): stand in a ring beside the Ranger (slide out over .15s), follow, and face the cursor.
 if(r.buffs.shadow>0){for(const cl of r.clones){cl.act=Math.max(0,(cl.act??0)-dt);let gx=p.x+cl.ox,gy=p.y+cl.oy;if(blocked(gx,gy,props,13)){gx=p.x;gy=p.y;}cl.tx=gx;cl.ty=gy;
  if(cl.t<1){cl.t=Math.min(1,cl.t+dt/.15);cl.x=p.x+(gx-p.x)*cl.t;cl.y=p.y+(gy-p.y)*cl.t;}else{const k=Math.min(1,dt*10);cl.x+=(gx-cl.x)*k;cl.y+=(gy-cl.y)*k;}
  const tg=aim??r.aimPoint;if(tg)cl.row=directionRow(tg.x-cl.x,tg.y-cl.y);}}
 else if(r.clones.length){if(rank(s,'shadowFinale'))for(const cl of r.clones){events.push(...area(r,c,s,cl,110,r.shadowDps*.06*(r.shadowSpec?.duration??6)/Math.max(1,r.clones.length),props,{basic:true,secondary:true,weapon:r.shadowWeapon,stagger:.3,push:12}));fx(r,'explode',{x:cl.x,y:cl.y,radius:110,duration:.5,color:RANGER_COLORS.ninja});}for(const cl of r.clones)fx(r,'vanish',{x:cl.x,y:cl.y,duration:.4});r.clones=[];}
 // Flasks fly in an arc, then land.
 for(const f of r.flasks){f.t+=dt;if(f.t>=f.dur&&!f.landed){f.landed=true;const pt={x:f.x,y:f.y};
   if(f.kind==='potion'){events.push(...area(r,c,s,pt,f.spec.radius,f.spec.damage,props,{basic:true,secondary:f.secondary,weapon:f.weapon,attackId:f.attackId,el:f.el,stagger:.15,push:4}));(r.lobFx??=[]).push({kind:'potion',x:pt.x,y:pt.y,R:f.spec.radius,el:f.el,born:r.shakeT,seed:f.seed});shake(r,f.el?1.4:.8);}
   else if(f.kind==='bomb'){const big=!(f.skips>0),R2=f.spec.radius*(big?1.5:.8);events.push(...area(r,c,s,pt,R2,f.spec.damage*(big?1.5:.5),props,{basic:true,secondary:f.secondary,weapon:f.weapon,attackId:f.attackId,heavy:big,stagger:big?.5:.15,push:big?18:6}));(r.lobFx??=[]).push({kind:big?'bombBig':'bombHop',x:pt.x,y:pt.y,R:R2,born:r.shakeT,seed:f.seed+f.skips});shake(r,big?3.5:1.2);
    if(!big){const nx=pt.x+Math.cos(f.angle)*80,ny=pt.y+Math.sin(f.angle)*80;if(!blocked(nx,ny,props,10))r.flasks.push({...f,landed:false,x0:pt.x,y0:pt.y,x:nx,y:ny,t:0,dur:.42,skips:f.skips-1,hop:true});else r.flasks.push({...f,landed:false,x0:pt.x,y0:pt.y,x:pt.x,y:pt.y,t:0,dur:.1,skips:0,hop:true});}}
   else if(f.kind==='catalyst')events.push(...catalyst(r,c,s,pt,f.spec,props));
   else if(f.kind==='grandflask')events.push(...grand(r,c,s,pt,f.spec,props));
   else{const a=f.spec;r.pools.push({x:pt.x,y:pt.y,R:a.radius,kind:'toxic',remaining:a.duration,max:a.duration,tick:0,ignite:rank(s,'volatileIgnite')>0});events.push(...area(r,c,s,pt,a.radius,a.damage*3,props,{stagger:.2,push:4},e=>poison(s,e,2)));fx(r,'splash',{x:pt.x,y:pt.y,radius:a.radius,duration:.5,color:'#7dff5a'});shake(r,2);}}}
 r.flasks=r.flasks.filter(f=>!f.landed);
 // Chemical pools: toxic poisons and slows, fire burns, frost slows. Ticks every .5s.
 for(const q of r.pools){q.remaining-=dt;q.tick-=dt;if(q.tick>0)continue;q.tick=.5;for(const e of c.targets)if(alive(e)&&iso(e,q)<q.R&&fieldContact(c,e,'pool:'+q.kind,r.shakeT,.5)){if(q.kind==='sludge'){e.slow=Math.max(e.slow??0,.8);}else if(q.kind==='toxic'){poison(s,e,1);e.slow=Math.max(e.slow??0,.6);if(q.ignite)burn(s,e,1.5);}else if(q.kind==='toxictrail'){events.push(...hit(r,c,s,q,e,q.dmg,props,{basic:true,weapon:q.weapon,stagger:.04,push:0,noFx:true}));poison(s,e,1);e.slow=Math.max(e.slow??0,.5);}else if(q.kind==='fire')burn(s,e,1.5);else chill(s,e,.8);}}
 r.pools=r.pools.filter(q=>q.remaining>0);if(r.pools.length>24)r.pools.splice(0,r.pools.length-24);
 // Projectiles.
 tickHawk(r,c,s,p,props,dt,events,move);tickBarrels(r,c,s,props,dt,events);if(r.reload){r.reload.t+=dt;if(r.reload.t>=r.reload.dur)r.reload=null;}
 for(const b of r.shots){b.spin+=dt*24;const travel=Math.min(b.range-b.traveled,b.speed*dt);let moved=0;
  while(moved<travel&&!b.dead){if(b.homeTo){b.angle=Math.atan2(p.y-24-b.y,p.x-b.x);if(Math.hypot(p.x-b.x,p.y-24-b.y)<26){b.dead=true;break;}}const st=Math.min(6,travel-moved),nx=b.x+Math.cos(b.angle)*st,ny=b.y+Math.sin(b.angle)*st;moved+=st;b.traveled+=st;
   if(blocked(nx,ny+24,props,3,true)||shieldBlocksAttack(s.forgeShield,b,{x:nx,y:ny})){b.dead=true;sparks(r,nx,ny,b.color,5,90);break;}b.x=nx;b.y=ny;
   for(const e of c.targets){if(b.hit.has(e.id)||!alive(e)||!bodyHit(e,b.x,b.y,b.contact))continue;if(b.blast){const m=r.blasts.get(b.blast)??new Map();if((m.get(e.id)??0)>=b.cap)continue;m.set(e.id,(m.get(e.id)??0)+1);r.blasts.set(b.blast,m);if(r.blasts.size>24)r.blasts.delete(r.blasts.keys().next().value);}b.hit.add(e.id);const exposed=e.rExposed>0,marked=e.rMarked>0,statused=hasStatus(e);
    let dmg=b.damage;if(b.kind==='shuriken'&&exposed)dmg*=1.3;if(b.fan&&marked)dmg*=1.5;
    events.push(...hit(r,c,s,{x:b.x,y:b.y+20},e,dmg,props,{basic:!!b.basic,weapon:b.weapon,attackId:b.attackId,targetCap:b.targetCap,pass:b.returned?1:0,secondary:!!b.secondary,stagger:b.kind==='power'?.4:.12,push:b.kind==='power'?10:3,el:b.el,heavy:b.kind==='power',fxAngle:b.angle,pierceFx:b.pierce>1}));
    if(b.bleed&&e.state==='alive')e.rBleed={weapon:b.weapon,damage:b.damage*.1,stacks:Math.min(3,(e.rBleed?.stacks??0)+1),remaining:3,pulse:e.rBleed?.pulse??.5};/* Oct 19 (user): Daggers bleed (10% of the hit every .5 s per stack, up to 3) */
    if(b.mark||b.markShot)mark(e,4);if(b.kind==='shuriken'&&rank(s,'shurikenExpose')&&!b.cyclone)expose(e,2);if((b.secondary||b.clone)&&rank(s,'shadowExpose'))expose(e,3);
    sparks(r,b.x,b.y,b.color,b.kind==='power'?10:5,b.kind==='power'?220:140);
    // Shuriken bounce; Cyclone blades and Gunslinger shots ricochet from statused enemies.
    let next=null;if(b.kind==='shuriken'&&!b.cyclone&&b.bounces>0){next=nearest(c,e,220,b.hit);if(next)b.bounces--;}
    else if(b.cyclone&&exposed&&b.ricochet>0){next=nearest(c,e,260,b.hit);if(next)b.ricochet--;}
    else if(b.fan&&(marked||statused)&&!b.ricocheted){const t=nearest(c,e,260,b.hit);if(t)shot(r,{kind:'bullet',x:b.x,y:b.y,angle:Math.atan2(t.y-20-b.y,t.x-b.x),speed:1400,range:300,damage:b.damage*.5,contact:8,ricocheted:true,hit:new Set([e.id]),color:b.color});}
    else if(b.barrage&&marked&&rank(s,'barrageRicochet')&&!b.ricocheted){const t=nearest(c,e,240,b.hit);if(t)shot(r,{kind:'bullet',x:b.x,y:b.y,angle:Math.atan2(t.y-20-b.y,t.x-b.x),speed:1400,range:280,damage:b.damage*.6,contact:7,ricocheted:true,hit:new Set([e.id]),color:b.color});}
    if(next){b.angle=Math.atan2(next.y-20-b.y,next.x-b.x);b.traveled=Math.max(0,b.range-280);b.pierce++;}
    if(--b.pierce<=0){b.dead=true;break;}}}
  if(!b.dead&&b.traveled>=b.range){if(b.returns&&!b.returned){b.returned=true;b.angle+=Math.PI;b.traveled=0;b.hit=new Set();if(b.chakram){b.homeTo=true;b.range*=3;}}else b.dead=true;}}
 r.shots=r.shots.filter(b=>!b.dead);if(r.lobFx?.length)r.lobFx=r.lobFx.filter(f=>r.shakeT-f.born<1.2);
 for(const f of r.fx)f.age+=dt;r.fx=r.fx.filter(f=>f.age<f.duration);
 for(const v of r.particles){v.life-=dt;v.x+=v.vx*dt;v.y+=v.vy*dt;v.z=Math.max(0,v.z+v.vz*dt);v.vz-=420*dt;v.vx*=.96;v.vy*=.96;}r.particles=r.particles.filter(v=>v.life>0);
 return events;}
// Movement: smoke haste, Barrage and drawing Power Shot slow you; holding the bow slows slightly.
export function rangerMove(r,s){return (r.buffs.haste>0?1.4:1)*(r.buffs.barrage>0&&!rank(s,'barrageMove')?.7:1)*(r.charge?.6:1)*(r.held?.88:1)*(r.blades?0:1);}
export function clearRangerInput(r){if(!r)return;r.held=false;}
export function cancelRanger(r,s,p){r.barrels=[];r.lobFx=[];r.coneFx=null;r.reload=null;if(p)p.unseen=false;r.bladeHeld=false;r.held=false;r.hitFx=[];r.muzzles=[];r.lmbDraw=null;r.hawk=null;r.hawkFollow=[];r.catchSpot=null;r.charge=null;r.fan=null;r.blades=null;r.step=null;r.shots=[];r.flasks=[];r.volleys=[];r.queue=[];r.buffs={};r.clones=[];r.invulnerable=0;}

export function tickRanger(r,c,s,p,aim,props,dt,move){return ownStatuses(c,["rBurn", "rPoison", "rBleed"],()=>tickRangerOwned(r,c,s,p,aim,props,dt,move));}

export function requestRanger(r,c,s,p,aim,key,props=[]){return ownStatuses(c,["rBurn", "rPoison", "rBleed"],()=>requestRangerOwned(r,c,s,p,aim,key,props));}
