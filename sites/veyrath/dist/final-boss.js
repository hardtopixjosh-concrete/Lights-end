// THE CRIMSON TYRANT, the 30:00 final boss. Oct 19 rework (user: "his entire kit is weird and his attacks are easy to beat ...
// he needs to be super punishing"; full redesign approved, keep the idea of shedding armour, keep his look and the 30:00 arrival).
// Replaces the Oct 16 six-mechanic kit (pylon shield phases removed).
//
// Armour: he arrives fully armoured (takes 55% damage). At 70% HP he SHEDS his outer plates (shrapnel ring, burning plates
// crash around every player) and becomes faster (80% damage taken). At 35% he sheds the rest: MOLTEN CORE (100% taken,
// 1.6x speed, a ring of fire closes the arena for good, near-zero downtime). At 10% he casts LAST LIGHT once.
// From phase 2 meteors keep falling on every player even while other attacks run (overlapping patterns).
// Kit: three-hit melee combo, Hellfire Charge (re-aims every leg), Brimstone Rain, Hell Spiral, Cataclysm (safe zones erupt
// afterwards from phase 2), Chains of Damnation (hook + slam), Infernal Walls (rows of fire with a moving gap),
// Crimson Clones, Molten Nova (expanding rings you must dash through) and an anti-kite leap.
// Big hits deal a share of the player's max HP (`frac`) so the fight stays lethal at any level. Values are playtest seeds.
import {blocked,directionRow,steerMove,movePlayer} from './simulation.js?v=fx-260';
import {receiveHit} from './survival.js?v=fx-260';
import {everyone,wasHit,markHit,bossTarget,nextBossTarget} from './party.js?v=fx-260';
import {embers,sparks,smoke,debris,light,shock,impact} from './boss-fx.js?v=fx-260';
const TAU=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),R=(a,b)=>a+Math.random()*(b-a),TELL=.38;
const HELL={spark:['#fff6d0','#ffd27a','#ff6a2a'],ember:['#ff3a1a','#ff7a2a','#ffc050'],debris:['#2a0e0a','#4a1a10','#5a1a14'],smoke:'#1e0a08',dust:'#4a2a20',light:'255,70,30'};
// Per phase: damage taken, move speed multiplier, pause between specials, melee windup multiplier.
const PH={1:{armor:.55,speed:1,gap:2.4,wind:1},2:{armor:.8,speed:1.3,gap:1.5,wind:.85},3:{armor:1,speed:1.6,gap:.8,wind:.72}};
const POOL={1:['charge','meteor','spiral','cataclysm','chains'],2:['charge','meteor','spiral','cataclysm','chains','clones','walls'],3:['charge','spiral','cataclysm','chains','walls','nova','clones']};
const phaseOf=b=>b.hp>b.maxHp*.7?1:b.hp>b.maxHp*.35?2:3;
const hpOf=(pl,s)=>pl?.kit?.s?.maxHp??pl?.maxHp??s.maxHp;
function push(c,list){(c.hazards??=[]).push(...list);}
function shoot(c,b,angle,o={}){const speed=o.speed??200,life=o.life??4.5;(c.enemyProjectiles??=[]).push({x:b.x,y:b.y,dx:Math.cos(angle),dy:Math.sin(angle),age:0,distance:0,owner:o.owner??b.id,attackDamage:o.damage??22,speed,color:o.color??'#ff4a2a',hitR:o.hitR??14,life,maxDist:speed*life,ghost:true});}
// A hit worth `frac` of the player's max HP. ignoreIframes: the answer is position (Cataclysm), not Dash/Blink.
function fracHit(s,c,pl,b,props,frac,{parry=false,ignoreIframes=false}={}){const dmg=Math.max(1,Math.round(hpOf(pl,s)*frac/2)),hit={...b,attackDamage:dmg,unparryable:!parry};
 if(!ignoreIframes)return receiveHit(s,c,pl,hit,props);
 const inv=pl.invulnerable;pl.invulnerable=false;if(pl.kit)pl.kit.s.grace=0;else s.grace=0;const out=receiveHit(s,c,pl,hit,props);pl.invulnerable=inv;return out;}
function openSpot(x,y,props,r=40){if(!blocked(x,y,props,r))return {x,y};for(let k=1;k<8;k++)for(let i=0;i<8;i++){const a=i/8*TAU,q={x:x+Math.cos(a)*k*30,y:y+Math.sin(a)*k*30};if(!blocked(q.x,q.y,props,r))return q;}return {x,y};}
// Player velocity (for leading meteors); bosses read it per tick.
const vel=new WeakMap();
function track(players,dt){for(const pl of players){const v=vel.get(pl);if(!v){vel.set(pl,{x:pl.x,y:pl.y,vx:0,vy:0});continue;}if(dt>0){const k=Math.min(1,dt*8);v.vx+=((pl.x-v.x)/dt-v.vx)*k;v.vy+=((pl.y-v.y)/dt-v.vy)*k;}v.x=pl.x;v.y=pl.y;}}
const lead=(pl,t)=>{const v=vel.get(pl)??{vx:0,vy:0};const cap=t*240,mx=Math.max(-cap,Math.min(cap,v.vx*t)),my=Math.max(-cap,Math.min(cap,v.vy*t));return {x:pl.x+mx,y:pl.y+my};};
const boom=(x,y,radius,warning,frac,owner,extra={})=>({kind:'explosion',x,y,radius,age:0,warning,duration:.4,owner,fired:false,frac,...extra});
function meteors(c,b,props,targets,n,warning,frac){const list=[];for(const pl of targets){const L=lead(pl,warning*.9);const spots=[{x:pl.x,y:pl.y},L];for(let i=2;i<n;i++){const a=Math.random()*TAU,r=R(60,170);spots.push({x:L.x+Math.cos(a)*r,y:L.y+Math.sin(a)*r*.72});}
 for(const q of spots){const o=openSpot(q.x,q.y,props,20);list.push(boom(o.x,o.y,88,warning+R(0,.12),frac,b.id,{meteor:true}));}}push(c,list);}
function ring(c,b,x,y,{speed=520,max=900,thick=34,frac=.2,warning=0}={}){push(c,[{kind:'tyring',x,y,r:0,speed,max,thick,frac,age:0,warning,duration:max/speed+.1,owner:b.id}]);}

function begin(b,s,c,p,props,kind){
 const ph=b.phase??1,sp={kind,elapsed:0};b.special=sp;b.swing=null;b.lastSpecial=kind;b.sinceCataclysm=kind==='cataclysm'?0:(b.sinceCataclysm??0)+1;
 if(kind==='shed'){sp.duration=2.4;sp.burst=1.25;b.invulnerable=1;}
 if(kind==='charge'){sp.legs=ph+1+(b.enraged?1:0);sp.leg=-1;sp.wait=0;sp.duration=99;}
 if(kind==='meteor'){sp.waves=ph===3?4:3;sp.next=0;sp.wave=0;sp.duration=sp.waves*.5+.9;}
 if(kind==='spiral'){sp.duration=ph===3?6.5:5.5;sp.next=.45;sp.base=Math.random()*TAU;sp.dir=Math.random()<.5?1:-1;}
 if(kind==='cataclysm'){sp.strike=ph===3?.9:1.05;sp.duration=sp.strike+(ph>=2?1.2:.8);b.invulnerable=1;sp.zones=zonesFor(b,c,p,props,ph===3?1:2);push(c,[...sp.zones,{kind:'cataclysm',x:b.x,y:b.y,age:0,warning:sp.strike,duration:.9,owner:b.id}]);}
 if(kind==='chains'){sp.duration=1.9;sp.lanes=everyone(p).map(pl=>{const a=Math.atan2(pl.y-b.y,pl.x-b.x),len=Math.min(900,dist(pl,b)+140);return {kind:'lane',x:b.x,y:b.y,angle:a,len,width:54,age:0,warning:.45,duration:.1,owner:b.id,chain:true};});push(c,sp.lanes);sp.hooked=[];sp.chainTo=[];}
 if(kind==='walls'){const a=Math.atan2(p.y-b.y,p.x-b.x),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,rows=8,list=[];let gap=Math.floor(R(3,12));
  for(let i=0;i<rows;i++){const cx=b.x+dx*(140+i*130),cy=b.y+dy*(140+i*130)*.85;gap=Math.max(1,Math.min(13,gap+(Math.random()<.5?-1:1)*Math.floor(R(1,3))));
   for(let j=0;j<15;j++){if(j===gap||j===gap+1)continue;const o=(j-7)*80;list.push(boom(cx+nx*o,cy+ny*o*.85,54,.55+i*.28,.26,b.id,{wall:true}));}}
  push(c,list);sp.duration=.55+rows*.28+.6;}
 if(kind==='clones'){sp.duration=9;sp.startHp=b.hp;const t0=Math.random()*TAU,spots=[0,1,2].map(i=>openSpot(p.x+Math.cos(t0+i*TAU/3)*300,p.y+Math.sin(t0+i*TAU/3)*300*.72,props,b.radius*.6)),real=Math.floor(Math.random()*3);
  b.x=spots[real].x;b.y=spots[real].y;sp.clones=spots.filter((_,i)=>i!==real).map(q=>{const k={...b,id:++s.id,x:q.x,y:q.y,role:'bossClone',cloneOf:b.id,special:null,swing:null,xp:0,shot:.5+Math.random()*.6,exploded:false,invulnerable:0};c.targets.push(k);return k;});}
 if(kind==='nova'){sp.duration=2.6;sp.stomps=[.45,1.05,1.65];sp.done=0;}
 if(kind==='leap'){sp.duration=1.35;sp.air=.95;b.invulnerable=1;const L=lead(p,.9);sp.to=openSpot(L.x,L.y,props,b.radius*.6);sp.from={x:b.x,y:b.y};sp.tell=boom(sp.to.x,sp.to.y,175,sp.air,.3,b.id,{leap:true});push(c,[sp.tell]);}
 if(kind==='lastlight'){sp.duration=5;b.invulnerable=1;const home=openSpot(b.arena.x,b.arena.y,props,b.radius*.6);b.x=home.x;b.y=home.y;sp.waves=[.3,1.75,3.2];sp.wave=0;sp.next=.6;sp.base=0;}
 return sp;
}
function zonesFor(b,c,p,props,per){const zones=[];for(const pl of everyone(p)){const mine=[];
  for(let tries=0;mine.length<per&&tries<80;tries++){const a=Math.random()*TAU,r=R(150,240),q={x:pl.x+Math.cos(a)*r,y:pl.y+Math.sin(a)*r*.72};if(blocked(q.x,q.y,props,60)||[...zones,...mine].some(z=>dist(z,q)<190))continue;mine.push(q);}
  if(!mine.length)mine.push(openSpot(pl.x+170,pl.y,props,60));zones.push(...mine);}
 return zones.map(z=>({kind:'safezone',x:z.x,y:z.y,radius:88,age:0,warning:0,duration:1.8,owner:b.id}));}
function endSpecial(b,c){const sp=b.special;b.special=null;b.invulnerable=0;b.lift=0;b.cooldown=Math.max(b.cooldown,PH[b.phase??1].gap*.5);b.specialCD=PH[b.phase??1].gap*(b.enraged?.6:1);
 if(sp?.clones)for(const k of sp.clones)if(k.state==='alive'){k.state='dead';k.death=2.2;}}

export function tickFinalBoss(s,c,p0,props,dt){
 const events=[];if(s.dead)return events;
 for(const b of c.targets){if(b.bossKind!=='final'||b.role!=='boss'||b.state!=='alive')continue;
  let p=bossTarget(b,p0);const lost=!!p.unseen;if(lost)p=p.lastSeen??p;  /* hidden target (Smoke Bomb) */
  const all=everyone(p);track(all,dt);
  b.arena??={x:b.x,y:b.y};b.baseSpeed??=b.speed;b.phase??=1;b.armorMul??=PH[1].armor;
  if(b.emerge>0){b.emerge=Math.max(0,b.emerge-dt);b.moving=false;continue;}
  b.fightT=(b.fightT??0)+dt;if(!b.enraged&&b.fightT>300){b.enraged=true;events.push({type:'worldNotice',text:'The light fades · the Tyrant grows relentless'});}
  b.cooldown=Math.max(0,(b.cooldown??0)-dt);b.leapCD=Math.max(0,(b.leapCD??6)-dt);
  tickRings(s,c,b,all,props,dt,events);
  // Armour shed on phase change (never interrupts another shed or Last Light).
  const want=phaseOf(b);
  if(want>b.phase&&!['shed','lastlight'].includes(b.special?.kind)){b.phase=want;endSpecial(b,c);begin(b,s,c,p,props,'shed');events.push({type:'worldNotice',text:want===2?'The Tyrant tears off its armour!':'MOLTEN CORE · the Tyrant sheds its last plates!'},{type:'bossImpact',x:b.x,y:b.y,kind:'shed'});continue;}
  if(!b.lastLight&&b.phase===3&&b.hp<b.maxHp*.1&&b.special?.kind!=='shed'){b.lastLight=true;endSpecial(b,c);begin(b,s,c,p,props,'lastlight');events.push({type:'worldNotice',text:'LAST LIGHT · find the safe ground!'},{type:'bossImpact',x:b.x,y:b.y,kind:'smash'});continue;}
  // Overlay: from phase 2 meteors keep falling on everyone, even during other attacks.
  if(b.phase>=2&&!['shed','lastlight'].includes(b.special?.kind)){b.overlay=(b.overlay??2)-dt;if(b.overlay<=0){b.overlay=(b.phase===3?2.8:4.4)*(b.enraged?.6:1);meteors(c,b,props,all,3,.72,.14);}}
  const sp=b.special;
  if(sp){sp.elapsed+=dt;b.moving=false;tickSpecial(b,s,c,p,all,props,dt,sp,events);if(b.special===sp&&sp.elapsed>=sp.duration)endSpecial(b,c);continue;}
  if(lost){b.moving=false;b.swing=null;continue;}
  b.specialCD=(b.specialCD??2.5)-dt;  /* ticks during melee combos too, so hugging him still brings specials */
  const ph=PH[b.phase],d=dist(b,p);b.speed=b.baseSpeed*ph.speed*(b.enraged?1.15:1);
  // Melee combo: sweep, sweep, smash (phase 3 adds a second smash that sends out a ring).
  if(b.swing){const a=b.swing;a.elapsed+=dt;const dx=p.x-b.x,dy=p.y-b.y;if(!a.fired&&a.elapsed<a.windup-TELL){a.angle=Math.atan2(dy,dx);b.row=directionRow(dx,dy);}
   if(!a.fired&&a.elapsed>=a.windup){a.fired=true;
    for(const pl of all){const ex=pl.x-b.x,ey=pl.y-b.y,delta=Math.atan2(Math.sin(Math.atan2(ey,ex)-a.angle),Math.cos(Math.atan2(ey,ex)-a.angle));
     if(a.kind==='smash'){const cx=b.x+Math.cos(a.angle)*120,cy=b.y+Math.sin(a.angle)*120*.72;if(Math.hypot(pl.x-cx,(pl.y-cy)/.65)<165)events.push(...fracHit(s,c,pl,b,props,.3));}
     else if(Math.hypot(ex,ey/.65)<a.reach&&Math.abs(delta)<1.2)events.push(...fracHit(s,c,pl,b,props,.2,{parry:true}));}
    if(a.kind==='smash'){const cx=b.x+Math.cos(a.angle)*120,cy=b.y+Math.sin(a.angle)*120*.72;events.push({type:'bossImpact',x:cx,y:cy,kind:'smash'});if(a.ring)ring(c,b,cx,cy,{speed:480,max:700,frac:.16});}
    else events.push({type:'bossImpact',x:b.x,y:b.y,kind:'sweep'});}
   if(a.elapsed>a.windup+.28){b.swing=null;b.combo=(b.combo??0)+1;const len=b.phase===3?4:3;if(b.combo>=len){b.combo=0;b.cooldown=ph.gap*.6;}else b.cooldown=.05;}
   b.moving=false;continue;}
  // Specials.
  if(b.specialCD<=0&&b.cooldown<=0){p=nextBossTarget(b,p0);const pool=POOL[b.phase].filter(k=>k!==b.lastSpecial),kind=(b.sinceCataclysm??0)>=5?'cataclysm':pool[Math.floor(Math.random()*pool.length)];b.combo=0;begin(b,s,c,p,props,kind);continue;}
  // Anti-kite leap.
  if(d>480&&b.leapCD<=0&&b.cooldown<=0){b.leapCD=b.phase===3?4.5:7;begin(b,s,c,p,props,'leap');continue;}
  if(d<210&&b.cooldown<=0){const seq=b.phase===3?['sweep','sweep','smash','smash']:['sweep','sweep','smash'],kind=seq[(b.combo??0)%seq.length];
   b.swing={kind,elapsed:0,windup:(kind==='smash'?.68:.5)*ph.wind,angle:Math.atan2(p.y-b.y,p.x-b.x),reach:235,fired:false,ring:kind==='smash'&&b.phase===3&&(b.combo??0)===3};continue;}
  if(d>140){const ox=b.x,oy=b.y,v=b.speed*(b.slow>0?.7:1)*dt;steerMove(b,(p.x-b.x)/d*v,(p.y-b.y)/d*v,props,dt);b.moving=Math.hypot(b.x-ox,b.y-oy)>.05;b.row=directionRow(p.x-b.x,p.y-b.y);}else b.moving=false;
 }
 return events;
}
function walkToward(b,p,props,dt,k){const d=dist(b,p);if(d<150)return;const ox=b.x,oy=b.y,v=(b.speed??66)*k*dt;steerMove(b,(p.x-b.x)/d*v,(p.y-b.y)/d*v,props,dt);b.moving=Math.hypot(b.x-ox,b.y-oy)>.05;b.row=directionRow(p.x-b.x,p.y-b.y);}
function tickSpecial(b,s,c,p,all,props,dt,sp,events){
 const ph=b.phase;
 if(sp.kind==='shed'&&!sp.burst0&&sp.elapsed>=sp.burst){sp.burst0=true;const P=PH[ph];b.armorMul=P.armor;b.speed=b.baseSpeed*P.speed;b.shed=ph-1;b.tint=ph===2?'sepia(1) saturate(7) hue-rotate(-25deg) brightness(.78) contrast(1.3)':'sepia(1) saturate(9) hue-rotate(-12deg) brightness(1.05) contrast(1.25)';
  const n=ph===3?40:28;for(let i=0;i<n;i++)shoot(c,b,i/n*TAU+Math.random()*.05,{speed:ph===3?330:290,damage:24,hitR:16,color:'#ff8a3a'});
  if(ph===3)for(let i=0;i<n;i++)shoot(c,b,(i+.5)/n*TAU,{speed:210,damage:24,hitR:16,color:'#ff5a2a'});
  const list=[];for(const pl of all)for(let i=0;i<4;i++){const a=Math.random()*TAU,r=i?R(70,200):0,q=openSpot(pl.x+Math.cos(a)*r,pl.y+Math.sin(a)*r*.72,props,20);list.push(boom(q.x,q.y,92,.5+i*.1,.18,b.id,{plate:true}));}
  for(let i=0;i<6;i++){const a=i/6*TAU,q=openSpot(b.x+Math.cos(a)*150,b.y+Math.sin(a)*110,props,20);list.push({kind:'fire',x:q.x,y:q.y,radius:52,age:0,warning:0,duration:6,owner:b.id,frac:.035});}
  push(c,list);events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'},{type:'cataclysm'});
  if(ph===3)push(c,[{kind:'firering',x:b.arena.x,y:b.arena.y,r0:1150,r1:620,r:1150,close:6,hold:99999,open:1,age:0,warning:TELL,duration:99999,owner:b.id,frac:.06}]);}
 if(sp.kind==='charge'){sp.wait-=dt;if(sp.wait>0)return;
  if(sp.leg<0||sp.cur?.done){sp.leg++;if(sp.leg>=sp.legs){sp.duration=0;return;}const t=nextBossTarget(b,p),a=Math.atan2(t.y-b.y,t.x-b.x),len=Math.min(950,dist(t,b)+260);
   sp.cur={angle:a,len,travel:0,lane:{kind:'lane',x:b.x,y:b.y,angle:a,len,width:90,age:0,warning:ph===3?.34:TELL,duration:6,owner:b.id},done:false};push(c,[sp.cur.lane]);sp.wait=sp.cur.lane.warning;b.row=directionRow(Math.cos(a),Math.sin(a));return;}
  const cur=sp.cur,step=(ph===3?1650:1400)*dt;
  for(let t=0;t<step;t+=5){const nx=b.x+Math.cos(cur.angle)*5,ny=b.y+Math.sin(cur.angle)*5;if(cur.travel>=cur.len||blocked(nx,ny,props,b.radius*.5)){cur.done=true;break;}b.x=nx;b.y=ny;cur.travel+=5;b.moving=true;
   if(cur.travel%45<5)push(c,[{kind:'fire',x:b.x,y:b.y,radius:44,age:0,warning:0,duration:ph===3?5:3.5,owner:b.id,frac:.035}]);
   for(const pl of all)if(!wasHit(cur,pl,'hit')&&Math.hypot(pl.x-b.x,(pl.y-b.y)/.65)<b.radius+36){markHit(cur,pl,'hit');events.push(...fracHit(s,c,pl,b,props,.28));const n=dist(pl,b)||1;movePlayer(pl,(pl.x-b.x)/n*70,(pl.y-b.y)/n*70,props);}}
  Object.assign(cur.lane,{x:b.x,y:b.y,len:Math.max(0,cur.len-cur.travel)});
  if(cur.done){const i=c.hazards.indexOf(cur.lane);if(i>=0)c.hazards.splice(i,1);events.push({type:'bossImpact',x:b.x,y:b.y,kind:'charge'});sp.wait=.16;}return;}
 if(sp.kind==='meteor'){walkToward(b,p,props,dt,.5);sp.next-=dt;if(sp.wave<sp.waves&&sp.next<=0){sp.next=.5;sp.wave++;meteors(c,b,props,all,5,sp.wave===1?.62:.5,.2);}return;}
 if(sp.kind==='spiral'){walkToward(b,p,props,dt,.35);sp.next-=dt;while(sp.next<=0&&(c.enemyProjectiles?.length??0)<320){sp.next+=.1;const arms=ph===3?5:ph===2?4:3;sp.base+=sp.dir*.19;
   for(let i=0;i<arms;i++)shoot(c,b,sp.base+i*TAU/arms,{speed:190,damage:22});
   if(ph===3&&Math.round(sp.elapsed*10)%2===0)for(let i=0;i<2;i++)shoot(c,b,-sp.base*1.3+i*Math.PI,{speed:150,damage:22,color:'#ffb04a'});}return;}
 if(sp.kind==='cataclysm'){if(!sp.struck&&sp.elapsed>=sp.strike){sp.struck=true;b.invulnerable=0;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'},{type:'cataclysm'});
   for(const pl of all)if(!sp.zones.some(z=>Math.hypot(pl.x-z.x,(pl.y-z.y)/.65)<z.radius))events.push(...fracHit(s,c,pl,b,props,.7,{ignoreIframes:true}));
   if(ph>=2)push(c,sp.zones.map(z=>boom(z.x,z.y,96,.5,.25,b.id,{erupt:true})));}return;}
 if(sp.kind==='chains'){
  if(!sp.cast&&sp.elapsed>=.45){sp.cast=true;for(const pl of all){if(pl.invulnerable||pl.unseen)continue;const l=sp.lanes.find(l=>Math.abs(Math.atan2(Math.sin(Math.atan2(pl.y-l.y,pl.x-l.x)-l.angle),Math.cos(Math.atan2(pl.y-l.y,pl.x-l.x)-l.angle)))<.6&&dist(pl,l)<l.len+20);
    if(!l)continue;const dx=pl.x-l.x,dy=pl.y-l.y,along=dx*Math.cos(l.angle)+dy*Math.sin(l.angle),side=Math.abs(-dx*Math.sin(l.angle)+dy*Math.cos(l.angle));if(along<0||along>l.len||side>l.width*.6)continue;
    sp.hooked.push(pl);events.push(...fracHit(s,c,pl,b,props,.1));}
   events.push({type:'bossImpact',x:b.x,y:b.y,kind:'sweep'});}
  if(sp.cast&&sp.elapsed<.85){const k=Math.min(1,dt*9);for(const pl of sp.hooked){const a=Math.atan2(pl.y-b.y,pl.x-b.x),tx=b.x+Math.cos(a)*95,ty=b.y+Math.sin(a)*95*.72;movePlayer(pl,(tx-pl.x)*k,(ty-pl.y)*k,props);}}
  sp.chainTo=sp.cast&&sp.elapsed<.95?sp.hooked.map(pl=>({x:Math.round(pl.x),y:Math.round(pl.y)})):[];
  if(sp.cast&&!sp.slam&&sp.elapsed>=.85){sp.slam=true;push(c,[boom(b.x,b.y,245,TELL,.35,b.id,{slam:true})]);}return;}
 if(sp.kind==='clones'){
  for(const k of sp.clones){if(k.state!=='alive'){if(!k.exploded){k.exploded=true;push(c,[{...boom(k.x,k.y,140,.35,.2,b.id),death:true}]);}continue;}
   k.hp=b.hp;k.maxHp=b.maxHp;k.clock+=dt;k.shot-=dt;const dx=p.x-k.x,dy=p.y-k.y,d=Math.hypot(dx,dy)||1;k.row=directionRow(dx,dy);
   if(d>160){const ox=k.x,oy=k.y;steerMove(k,dx/d*70*dt,dy/d*70*dt,props,dt);k.moving=Math.hypot(k.x-ox,k.y-oy)>.05;}else k.moving=false;
   if(k.shot<=0){k.shot=1.1;const a=Math.atan2(dy,dx);for(const o of ph===3?[-.22,0,.22]:[0])shoot(c,k,a+o,{speed:270,damage:24,owner:b.id});}}
  b.shot=(b.shot??1)-dt;if(b.shot<=0){b.shot=1.1;const a=Math.atan2(p.y-b.y,p.x-b.x);for(const o of ph===3?[-.22,0,.22]:[0])shoot(c,b,a+o,{speed:270,damage:24});}
  walkToward(b,p,props,dt,.85);
  if(sp.startHp-b.hp>=b.maxHp*.025){events.push({type:'worldNotice',text:'You found the real Tyrant!'});sp.duration=0;return;}
  if(sp.elapsed>=sp.duration-.05&&!sp.blown){sp.blown=true;push(c,sp.clones.filter(k=>k.state==='alive').map(k=>({...boom(k.x,k.y,170,.5,.3,b.id),death:true})));b.hp=Math.min(b.maxHp,b.hp+b.maxHp*.03);events.push({type:'worldNotice',text:'The clones detonate · the Tyrant feeds on the flames'});}
  return;}
 if(sp.kind==='nova'){while(sp.done<sp.stomps.length&&sp.elapsed>=sp.stomps[sp.done]){sp.done++;push(c,[boom(b.x,b.y,160,TELL*.6,.25,b.id,{stomp:true})]);ring(c,b,b.x,b.y,{speed:500,max:950,frac:.22,warning:TELL*.6});events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}return;}
 if(sp.kind==='leap'){const t=Math.min(1,sp.elapsed/sp.air);
  if(sp.elapsed<sp.air-TELL){const L=lead(p,sp.air-sp.elapsed),q=openSpot(L.x,L.y,props,b.radius*.6);sp.to=q;sp.tell.x=q.x;sp.tell.y=q.y;}
  b.x=sp.from.x+(sp.to.x-sp.from.x)*t;b.y=sp.from.y+(sp.to.y-sp.from.y)*t;b.lift=Math.sin(t*Math.PI)*220;b.moving=false;b.row=directionRow(sp.to.x-sp.from.x,sp.to.y-sp.from.y);
  if(t>=1&&!sp.landed){sp.landed=true;b.lift=0;b.invulnerable=0;ring(c,b,b.x,b.y,{speed:520,max:620,frac:.15});events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}return;}
 if(sp.kind==='lastlight'){walkToward(b,p,props,dt,0);
  while(sp.wave<sp.waves.length&&sp.elapsed>=sp.waves[sp.wave]){sp.wave++;const zones=zonesFor(b,c,p,props,1);sp.zones=zones;push(c,[...zones,{kind:'cataclysm',x:b.x,y:b.y,age:0,warning:1,duration:.9,owner:b.id}]);sp.strikeAt=sp.elapsed+1;}
  if(sp.strikeAt&&sp.elapsed>=sp.strikeAt){sp.strikeAt=0;events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'},{type:'cataclysm'});for(const pl of all)if(!sp.zones.some(z=>Math.hypot(pl.x-z.x,(pl.y-z.y)/.65)<z.radius))events.push(...fracHit(s,c,pl,b,props,.55,{ignoreIframes:true}));}
  sp.next-=dt;while(sp.next<=0){sp.next+=.32;sp.base+=.35;for(let i=0;i<6;i++)shoot(c,b,sp.base+i*TAU/6,{speed:150,damage:20});}
  if(sp.elapsed>=sp.duration-.05)b.invulnerable=0;return;}
}
// Expanding rings (Molten Nova, leap landings, phase-3 smash): dash through them; one hit per ring per player.
function tickRings(s,c,b,all,props,dt,events){for(const h of c.hazards??[]){if(h.kind!=='tyring'||h.owner!==b.id||h.age<h.warning)continue;h.r=Math.min(h.max,(h.age-h.warning)*h.speed);
 for(const pl of all){if(wasHit(h,pl,'ring'))continue;const d=Math.hypot(pl.x-h.x,(pl.y-h.y)/.72);if(Math.abs(d-h.r)<h.thick){markHit(h,pl,'ring');events.push(...fracHit(s,c,pl,b,props,h.frac));}}}}

// ---------- drawing (host and friends; everything is read from mirrored state) ----------
const fxDone=new WeakSet();
function arcTell(ctx,b,a,time){const k=Math.min(1,Math.max(0,(a.elapsed-(a.windup-TELL))/TELL));ctx.save();ctx.globalCompositeOperation='lighter';
 if(a.kind==='smash'){const cx=b.x+Math.cos(a.angle)*120,cy=b.y+Math.sin(a.angle)*120*.72;ctx.fillStyle=`rgba(255,60,30,${.12+.25*k})`;ctx.strokeStyle=`rgba(255,200,140,${.5+.5*k})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(cx,cy,165,165*.65,0,0,TAU);ctx.fill();ctx.stroke();
  ctx.fillStyle=`rgba(255,230,180,${.35*k})`;ctx.beginPath();ctx.ellipse(cx,cy,165*k,165*.65*k,0,0,TAU);ctx.fill();}
 else{ctx.fillStyle=`rgba(255,70,30,${.1+.22*k})`;ctx.strokeStyle=`rgba(255,190,120,${.45+.5*k})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x,b.y);for(let i=0;i<=20;i++){const t=a.angle-1.2+2.4*i/20;ctx.lineTo(b.x+Math.cos(t)*a.reach,b.y+Math.sin(t)*a.reach*.65);}ctx.closePath();ctx.fill();ctx.stroke();}
 ctx.restore();}
export function drawFinalBossFx(ctx,c,time){
 for(const h of c.hazards??[]){if(h.kind!=='tyring'||h.age<h.warning||!h.r)continue;const fade=1-Math.min(1,h.r/h.max)*.6;ctx.save();ctx.globalCompositeOperation='lighter';
  for(const [w,a,col] of [[h.thick*2.2,.18,'255,60,20'],[h.thick,.55,'255,120,40'],[6,.9,'255,235,190']]){ctx.strokeStyle=`rgba(${col},${a*fade})`;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(h.x,h.y,h.r,h.r*.72,0,0,TAU);ctx.stroke();}ctx.restore();
  if(Math.random()<.6){const a=Math.random()*TAU;embers(h.x+Math.cos(a)*h.r,h.y+Math.sin(a)*h.r*.72,6,2,HELL.ember,{spread:8,up:[60,180]});}
  if(!fxDone.has(h)){fxDone.add(h);light(h.x,h.y,260,HELL.light,.5,1);shock(h.x,h.y,'stomp');}}
 for(const b of c.targets){if(b.bossKind!=='final'||b.state!=='alive')continue;const sp=b.special,ph=b.phase??1;
  if(b.role==='boss'){ctx.save();ctx.globalAlpha=.55;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(b.x,b.y+4,b.radius*1.6*(1-(b.lift??0)/500),b.radius*.55*(1-(b.lift??0)/500),0,0,TAU);ctx.fill();ctx.restore();}
  // Armour state glow: dull iron red while plated, cracks of fire after the first shed, a molten core in phase 3.
  if(b.role==='boss'){const pulse=.5+.5*Math.sin(time*(ph===3?9:5)),y=b.y-110-(b.lift??0);ctx.save();ctx.globalCompositeOperation='lighter';
   const g=ctx.createRadialGradient(b.x,y,4,b.x,y,ph===3?170:ph===2?120:80);g.addColorStop(0,`rgba(255,${ph===3?220:150},${ph===3?140:80},${(ph===3?.55:ph===2?.32:.16)*(.7+.3*pulse)})`);g.addColorStop(.5,`rgba(255,60,20,${ph===3?.25:.12})`);g.addColorStop(1,'rgba(120,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,y,ph===3?170:ph===2?120:80,0,TAU);ctx.fill();ctx.restore();
   if(ph>=2&&Math.random()<(ph===3?.7:.3))embers(b.x+R(-40,40),b.y,R(60,190),1,HELL.ember,{spread:30,up:[40,140]});
   if(ph===3&&Math.random()<.25)smoke(b.x+R(-30,30),b.y,1,HELL.smoke,{spread:30,z:150,up:[40,90],size:[18,30]});}
  if(b.role==='boss'&&b.swing&&!b.swing.fired&&b.swing.elapsed>=b.swing.windup-TELL)arcTell(ctx,b,b.swing,time);
  if(!sp||b.role!=='boss')continue;
  if(sp.kind==='shed'){const k=Math.min(1,sp.elapsed/(sp.burst??1.25));ctx.save();ctx.globalCompositeOperation='lighter';const y=b.y-120,r=60+220*k*k;const g=ctx.createRadialGradient(b.x,y,6,b.x,y,r);g.addColorStop(0,`rgba(255,240,200,${.4+.5*k})`);g.addColorStop(.35,`rgba(255,90,30,${.35*k})`);g.addColorStop(1,'rgba(90,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,y,r,0,TAU);ctx.fill();ctx.restore();
   if(k<1&&Math.random()<.8)sparks(b.x+R(-50,50),b.y,R(60,200),3,HELL.spark,{speed:[60,200]});
   if(sp.elapsed>=(sp.burst??1.25)&&!fxDone.has(sp)){fxDone.add(sp);impact(b.x,b.y,200,HELL,{heavy:true});debris(b.x,b.y,30,HELL.debris,{speed:[200,520],up:[300,620],size:[6,16],spread:40});embers(b.x,b.y,90,40,HELL.ember,{spread:90,up:[120,360]});}}
  if(sp.kind==='cataclysm'||sp.kind==='lastlight'){const k=sp.kind==='cataclysm'?Math.min(1,sp.elapsed/sp.strike):.6+.4*Math.sin(time*6);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(b.x,b.y-150,10,b.x,b.y-150,120+220*k);g.addColorStop(0,'rgba(255,220,160,.9)');g.addColorStop(.4,'rgba(255,60,30,.5)');g.addColorStop(1,'rgba(120,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y-150,120+220*k,0,TAU);ctx.fill();ctx.restore();}
  if(sp.kind==='lastlight'){ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#000';ctx.beginPath();ctx.rect(b.x-3000,b.y-2400,6000,4800);for(const z of sp.zones??[])ctx.ellipse(z.x,z.y,z.radius*1.4,z.radius*1.4*.65,0,0,TAU,true);ctx.fill('evenodd');ctx.restore();}
  if(sp.kind==='chains'&&sp.chainTo?.length){ctx.save();for(const q of sp.chainTo){const n=Math.max(1,Math.floor(dist(q,b)/18)),a=Math.atan2(q.y-(b.y-70),q.x-b.x);ctx.strokeStyle='#2a1410';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(b.x,b.y-70);ctx.lineTo(q.x,q.y-40);ctx.stroke();
    ctx.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const t=i/n,x=b.x+(q.x-b.x)*t,y=b.y-70+(q.y-40-b.y+70)*t;ctx.strokeStyle=`rgba(255,${90+60*Math.sin(time*20+i)},40,.85)`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,7,4,a+(i%2?Math.PI/2:0),0,TAU);ctx.stroke();}ctx.restore();
    if(Math.random()<.5)sparks(q.x,q.y,40,2,HELL.spark,{speed:[60,160]});}}
  if(sp.kind==='leap'&&(b.lift??0)>10&&Math.random()<.6)embers(b.x,b.y,b.lift+60,2,HELL.ember,{spread:40,up:[-60,40]});
  if(sp.kind==='leap'&&sp.landed&&!fxDone.has(sp)){fxDone.add(sp);impact(b.x,b.y,180,HELL,{heavy:true});}
 }
}
