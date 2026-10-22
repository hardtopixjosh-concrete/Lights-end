// Oct 16 (#9–11): main bosses (Ashen Butcher 7:30, Hollow Prophet 15:00, Obsidian Colossus 22:30)
// and the Dune Wyrm pit titan. Each has learnable, telegraphed specials built on the shared hazard
// system (elite-powers.js), plus fair melee with punish windows. The Dune Ravager keeps its own AI in
// rewards.js. HP/damage/timings are playtest seeds.
import {blocked,directionRow,steerMove,movePlayer} from './simulation.js?v=fx-260';
import {receiveHit} from './survival.js?v=fx-260';
import {spawnRoleAt} from './enemy-roles.js?v=fx-260';
import {COLOSSUS,WYRM} from './titans.js?v=fx-260';
import {targetFor} from './party.js?v=fx-260';
import {everyone,wasHit,markHit,bossTarget,nextBossTarget} from './party.js?v=fx-260';
export const BOSS_DEFS={
 // Oct 16 (user concept): custom Blender model (tools/butcher). User: smaller (3.55 -> 3.25 -> 3.0) and a bit faster (62 -> 70).
 butcher:{name:'THE ASHEN BUTCHER',skin:'butcher',tint:null,hp:32000,scale:3.0,radius:29,speed:70,xp:400,damage:40},
 // Oct 17 (user concept sheets): Prophet, Colossus (3 phase looks) and Wyrm (armoured/exposed) use custom HD models (tools/<boss>, game.js hdLook).
 prophet:{name:'THE HOLLOW PROPHET',skin:'prophet',tint:null,hp:52000,scale:3.3,radius:30,speed:70,xp:600,damage:30},
 colossus:{name:'THE OBSIDIAN COLOSSUS',skin:'colossus1',tint:null,hp:85000,scale:4.6,radius:46,speed:34,xp:900,damage:60},
 wyrm:{name:'THE DUNE WYRM',skin:'wyrm1',tint:null,hp:45000,scale:5.3,radius:100,  // Oct 17 fix: radius 44 -> 100 + a body capsule (hitLen) so hits on its long body land
 speed:58,xp:500,damage:42,pit:true},
 final:{name:'THE CRIMSON TYRANT',skin:'demon-elite',tint:'sepia(1) saturate(6) hue-rotate(-30deg) brightness(.55) contrast(1.35)',hp:170000,scale:4.2,radius:52,speed:66,xp:0,damage:55},
 ravager:{name:'DUNE RAVAGER',skin:'golem',tint:null,hp:20000,scale:2.35,radius:28,speed:60,xp:160,damage:38,pit:true}
};
export function makeBoss(s,c,x,y,kind,{hpScale=1}={}){
 const d=BOSS_DEFS[kind],hp=Math.round(d.hp*hpScale);
 const b={...c.target,id:++s.id,enemy:true,x,y,role:'boss',bossKind:kind,name:d.name,bossSkin:d.skin,tint:d.tint,hpTier:'miniboss',hp,maxHp:hp,radius:d.radius,scale:d.scale,speed:d.speed,xp:d.xp,attackDamage:d.damage,
  age:0,clock:0,hurt:0,hurtDuration:.24,death:0,state:'alive',swing:null,cooldown:1,moving:false,emerge:1.2,row:2,special:null,specialCD:3,specialIndex:-1,pattern:0,bodyHalfWidth:30,bodyHeight:84,rangedCast:null,unparryable:false};
 b.baseSpeed=d.speed;
 if(kind==='colossus')Object.assign(b,{armored:true,exposedMul:1,stage:0});  // Oct 17: phase 1 takes 50%, 100% while kneeling (titans.js)
 if(kind==='wyrm'){b.armorHp=Math.round(hp*.35);b.armorMax=b.armorHp;b.hitLen=230;b.hitH=170;}
 c.targets.push(b);return b;
}
const TAU=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Oct 16 (user): every boss telegraph flashes only just before the hit (fast, hard, reaction-based). TELL is the
// visible warning; push() trims a batch so its first warning is TELL and later ones keep their stagger.
export const TELL=.38,FISSURE_TELL=.55,FISSURE_SPEED=600; // Oct 16 (user): Ash Fissures tell a little longer; cracks race out at 600/s.
function push(c,list){const m=Math.min(...list.map(h=>h.follow?Infinity:h.warning??0)),cut=m>TELL&&m<Infinity?m-TELL:0;if(cut)for(const h of list)if(!h.follow)h.warning-=cut;(c.hazards??=[]).push(...list);}
const inLane=(p,l,pad=0)=>{const dx=p.x-l.x,dy=p.y-l.y,along=dx*Math.cos(l.angle)+dy*Math.sin(l.angle),side=Math.abs(-dx*Math.sin(l.angle)+dy*Math.cos(l.angle));return along>=0&&along<=l.len&&side<l.width/2+pad;};
// Hollow Prophet helpers (Oct 16 rework; user tuning pass 2). CAGE: beams at .45s, closes at 1.75s (user: go off faster), 16 pillars so the
// opening is half as wide. APP: wind-up; surviving copies re-fire every APP.every s until hit. REPULSE: 1.2s wind-up.
// ECHO: marks .7s apart (Oct 17, user: more space; was .5). APP.every 2.2 (was 3.2): copies attack faster; APP.guard: copies can't be hit for .4 s after appearing. LANCE: 6 beams per set (user: twice as many), aim lines .9s then the beams grow out from the crossing point at 620/s to 380 each way (user: progressive),
// sets 1.6s apart, beams 34 wide; they cross at a random spot
// 60-170 from you, not on you (user).
// Oct 17 (user): lances longer but thinner (reach 380 -> 560, width 34 -> 22); echo marks bigger (radius 85 -> 115).
export const CAGE={beams:.45,close:1.75},APP={windup:1.1,every:2.2,guard:.4},REPULSE={windup:1.2,range:300,half:Math.PI*13/18},ECHO={gap:.7,r:115},LANCE={warn:.9,gap:1.6,n:6,width:22,reach:560,speed:760};
const segDist=(p,a,q)=>{const dx=q.x-a.x,dy=(q.y-a.y)/.65,px=p.x-a.x,py=(p.y-a.y)/.65,L=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,(px*dx+py*dy)/L));return Math.hypot(px-u*dx,py-u*dy);};
const teleports=c=>(c.teleportFx??=[]);
// Copies start clean (bug fix): they used to inherit the Prophet's bleed/burn/chill, and one damage tick killed the 1-HP copy.
const CLEAN={bleed:0,bleedPulse:0,weaponBleed:null,worldBurn:null,burn:null,bloodSoaked:0,bloodTrailClock:0,freeze:0,mageChill:0,slow:0,hurt:0,vortexHeld:0,barrier:0,stagger:0};
// False Apparitions volley: every body (real or copy) fires 3 violet bolts in a spread at the player, after TELL aim lines.
// Bolts belong to the real boss (owner b.id) so pit time-stop rules treat them like his.
// Apparition spots (user: random every time, never where the Prophet just stood): random angle and range around the
// player, at least 260 from his old spot and 200 from each other; which spot is the real one is shuffled.
function apparitionSpots(b,p){const out=[];for(let k=0;k<80&&out.length<3;k++){const a=Math.random()*TAU,r=260+Math.random()*160,q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*.65};
 if(Math.hypot(q.x-b.x,q.y-b.y)<260||out.some(o=>Math.hypot(o.x-q.x,o.y-q.y)<200))continue;out.push(q);}
 while(out.length<3){const a=Math.random()*TAU;out.push({x:p.x+Math.cos(a)*340,y:p.y+Math.sin(a)*340*.65});}
 for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function boltTells(b,c,t2,p){const a=Math.atan2(p.y-t2.y,p.x-t2.x),ls=[-.26,0,.26].map(o=>({kind:'lane',x:t2.x,y:t2.y,angle:a+o,len:260,width:24,age:0,warning:TELL,duration:.05,owner:b.id}));(c.hazards??=[]).push(...ls);return {x:t2.x,y:t2.y,a,from:t2};}
function boltFire(b,c,v){if(v.from.state!=='alive')return;for(const o of [-.26,0,.26])shoot(c,{id:b.id,x:v.x,y:v.y},v.a+o,{speed:340,damage:22,color:'#b48cff',hitR:18,life:2.4,ghost:true});}
// Oct 17 (user): each Delayed Echo leaves a Soul Mire: standing in it slows your attacks (no damage).
export const MIRE={r:.85,life:4,slow:.35};
// Surviving copies stay until you hit them and re-fire their spread every APP.every seconds (user).
function tickCopies(b,s,c,p,dt){for(const k of c.targets){if(!k.apparition||k.cloneOf!==b.id||k.state!=='alive')continue;
 if(k.guard>0){k.guard-=dt;k.invulnerable=k.guard>0?1:0;}  // brief spawn protection (user: one copy kept dying instantly)
 if(k.swing?.kind==='cast')k.swing.elapsed+=dt;k.row=directionRow(p.x-k.x,p.y-k.y);k.refire-=dt;
 if(k.volley){k.volley.t-=dt;if(k.volley.t<=0){boltFire(b,c,k.volley);k.volley=null;k.swing=null;}}
 else if(k.refire<=0){k.refire=APP.every;cast(k,TELL);k.volley={...boltTells(b,c,k,p),t:TELL};}}}
function cast(t,windup){t.swing={kind:'cast',elapsed:0,windup,angle:0,fired:true,reach:0,damage:0};}
// Spectral Scythes: two blades pass either side of you (~95 out), overshoot, then curve back inward through where you stood.
const SCY={out:.7,back:.8,delay:TELL};
function launchScythes(b,c,p,delay=0){const B0={x:b.x,y:b.y},P0={x:p.x,y:p.y},a=Math.atan2(P0.y-B0.y,P0.x-B0.x),dx=Math.cos(a),dy=Math.sin(a);
 b.scythes=[1,-1].map(side=>{const F={x:P0.x+dx*170-dy*side*95,y:P0.y+dy*170+dx*side*95};return {t:-delay,side,B0,P0,F,Co:{x:(B0.x+F.x)/2-dy*side*40,y:(B0.y+F.y)/2+dx*side*40},Cr:{x:P0.x+dy*side*60,y:P0.y-dx*side*60},x:B0.x,y:B0.y,hit:0};});
 (c.hazards??=[]).push(...b.scythes.map(q=>({kind:'lane',x:B0.x,y:B0.y,angle:Math.atan2(q.F.y-B0.y,q.F.x-B0.x),len:Math.hypot(q.F.x-B0.x,q.F.y-B0.y),width:40,age:-delay,warning:TELL,duration:.1,owner:b.id})));}
function tickScythes(b,s,c,p,props,dt,events){if(!b.scythes)return;
 for(const q of b.scythes){q.t+=dt;const k=q.t-SCY.delay;if(k<0)continue;let x,y,ph;
  if(k<SCY.out){const u=k/SCY.out,e=1-(1-u)*(1-u);x=(1-e)*(1-e)*q.B0.x+2*e*(1-e)*q.Co.x+e*e*q.F.x;y=(1-e)*(1-e)*q.B0.y+2*e*(1-e)*q.Co.y+e*e*q.F.y;ph=1;}
  else if(k<SCY.out+SCY.back){const u=(k-SCY.out)/SCY.back;x=(1-u)*(1-u)*q.F.x+2*u*(1-u)*q.Cr.x+u*u*b.x;y=(1-u)*(1-u)*q.F.y+2*u*(1-u)*q.Cr.y+u*u*b.y;ph=2;}
  else{q.done=true;continue;}
  q.ang=Math.atan2(y-q.y,x-q.x);q.x=x;q.y=y;
  for(const pl of everyone(p))if(!(pl.local?q.hit&ph:wasHit(q,pl,'h'+ph))&&Math.hypot(pl.x-x,(pl.y-y)/.65)<30&&!pl.invulnerable){if(pl.local)q.hit|=ph;else markHit(q,pl,'h'+ph);events.push(...receiveHit(s,c,pl,{...b,attackDamage:26,unparryable:true},props));}/* multiplayer: every standing player */}
 if(b.scythes.every(q=>q.done))b.scythes=null;}
function shoot(c,b,angle,{speed=260,damage=18,color='#ff8a4a',hitR=16,life=3.5,ghost=false,turn=0,big=false}={}){(c.enemyProjectiles??=[]).push({x:b.x,y:b.y,dx:Math.cos(angle),dy:Math.sin(angle),age:0,distance:0,owner:b.id,attackDamage:damage,speed,color,hitR,life,maxDist:speed*life,ghost,turn,big});}
// Melee shared by the brawler bosses: alternating sweep (parryable) and smash (unparryable).
function melee(b,s,c,p,props,dt,events,cfg){
 const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;
 if(b.swing){const a=b.swing;a.elapsed+=dt;const tracking=!a.fired&&a.elapsed<a.windup-.22;if(tracking){a.angle=Math.atan2(dy,dx);b.row=directionRow(dx,dy);}
  if(!a.fired&&a.elapsed>=a.windup){a.fired=true;const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-a.angle),Math.cos(Math.atan2(dy,dx)-a.angle));
   for(const pl of everyone(p)){const dx=pl.x-b.x,dy=pl.y-b.y,delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-a.angle),Math.cos(Math.atan2(dy,dx)-a.angle));if(Math.hypot(dx,dy/.65)<a.reach+b.radius*.4&&(a.kind==='smash'||Math.abs(delta)<1.3))events.push(...receiveHit(s,c,pl,{...b,attackDamage:a.damage,unparryable:a.kind==='smash'},props));}  // multiplayer: everyone in the arc
   events.push({type:'bossImpact',x:b.x,y:b.y,kind:a.kind});}
  if(a.elapsed>a.windup+.5){b.swing=null;b.cooldown=cfg.recover??.8;}b.moving=false;return true;}
 if(cfg.reach&&d<cfg.reach+20&&b.cooldown<=0){const kind=cfg.smashOnly||b.pattern++%2?'smash':'sweep';b.row=directionRow(dx,dy);b.swing={kind,elapsed:0,windup:Math.min(TELL+.07,(kind==='smash'?.45:.35)*(cfg.windupScale??1)),angle:Math.atan2(dy,dx),reach:kind==='smash'?cfg.reach*1.15:cfg.reach,damage:kind==='smash'?cfg.damage*1.4:cfg.damage,fired:false};return true;}
 return false;
}
function walk(b,p,props,dt,{keep=60,speedMul=1,away=false}={}){
 const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;if(!away&&d<=keep||b.hurt>.05){b.moving=false;return;}
 const dir=away?-1:1,v=b.speed*speedMul*(b.slow>0?.6:b.mageChill>0?.85:1)*dt,ox=b.x,oy=b.y;steerMove(b,dx/d*v*dir,dy/d*v*dir,props,dt);b.moving=Math.hypot(b.x-ox,b.y-oy)>.05;b.row=directionRow(dx,dy);
}
function lane(c,b,angle,len,warning,width=70){const l={kind:'lane',x:b.x,y:b.y,angle,len,width,age:0,warning,duration:4,owner:b.id};push(c,[l]);return l;}
// Runs one straight charge leg; returns true when finished.
function chargeLeg(b,s,c,p,props,dt,events,sp,{speed=1150,damage=45,fire=false}={}){
 const step=speed*dt;for(let t=0;t<step;t+=5){const nx=b.x+Math.cos(sp.angle)*5,ny=b.y+Math.sin(sp.angle)*5;if(blocked(nx,ny,props,b.radius*.6)||sp.travel>=sp.len){sp.done=true;break;}
  b.x=nx;b.y=ny;sp.travel+=5;b.moving=true;if(fire&&sp.travel%40<5)push(c,[{kind:'fire',x:b.x,y:b.y,radius:38,age:0,warning:0,duration:3.2,owner:b.id,damage:8}]);
  for(const pl of everyone(p)){if(!wasHit(sp,pl,'hit')&&Math.hypot(pl.x-b.x,(pl.y-b.y)/.65)<b.radius+30){markHit(sp,pl,'hit');events.push(...receiveHit(s,c,pl,{...b,attackDamage:damage,unparryable:true},props));const n=dist(pl,b)||1;movePlayer(pl,(pl.x-b.x)/n*45,(pl.y-b.y)/n*45,props);}}/* multiplayer: every standing player */}
 if(sp.lane)Object.assign(sp.lane,{x:b.x,y:b.y,len:Math.max(0,sp.len-sp.travel)});
 if(sp.done){const i=(c.hazards??[]).indexOf(sp.lane);if(i>=0)c.hazards.splice(i,1);events.push({type:'bossImpact',x:b.x,y:b.y,kind:'charge'});}
 return sp.done;
}
function rings(c,b,count,gaps,{speed=220,damage=26,spacing=.6}={}){const out=[];for(let i=0;i<count;i++){const g0=Math.random()*TAU;out.push({kind:'ring',x:b.x,y:b.y,age:0,warning:i*spacing,duration:2.6,speed,band:18,gaps:Array.from({length:gaps},(_,k)=>g0+k*TAU/gaps),gapHalf:.42,owner:b.id,damage});}push(c,out);}
function startSpecial(b,kind,windup,duration,extra={}){windup=Math.min(windup,TELL);b.special={kind,elapsed:0,windup,duration,fired:false,...extra};b.swing=null;}
// ---------------- per-boss specials ----------------
const SPECIALS={
 // Oct 16 (user): Ashen Butcher kit. Every tell flashes TELL seconds before the hit. Cross Chop (two cleavers thrown
 // from either side so their paths cross in an X ~300 ahead; safe gap right in front of him for melee), Boomerang Cleavers, Meat Hook (leads your movement),
 // Butcher's Mark (own attack: a brand drifts around you and erupts at a random moment), Ash Fissures (cracks race
 // outward); phase 2 (50%) adds Bloodrage (red, faster, chains two attacks) and Cleaver Storm. Values are playtest seeds.
 butcher:{list:b=>b.phase2?['crossChop','hook','storm','mark','boomerang','fissures','crossChop','storm','hook','fissures']:['crossChop','boomerang','hook','fissures','mark','crossChop','hook','fissures'],
  cd:b=>b.phase2&&(b.chain=!b.chain)?.1:b.phase2?2:2.6,
  start(b,s,c,p,kind){const angle=Math.atan2(p.y-b.y,p.x-b.x);
   if(kind==='crossChop'){const fx=Math.cos(angle),fy=Math.sin(angle),cx=b.x+fx*300,cy=b.y+fy*300,throws=[1,-1].map(side=>{const sx=b.x-fy*side*110,sy=b.y+fx*side*110;return {x:sx,y:sy,a:Math.atan2(cy-sy,cx-sx)};});
    push(c,throws.map(q=>({kind:'lane',x:q.x,y:q.y,angle:q.a,len:620,width:58,age:0,warning:TELL,duration:.1,owner:b.id})));startSpecial(b,kind,TELL,TELL+.5,{angle,throws});return;}
   if(kind==='boomerang'){const tells=[1,-1].map(side=>({kind:'lane',x:b.x,y:b.y,angle:angle+side*.9,len:220,width:46,age:0,warning:TELL,duration:.1,owner:b.id}));push(c,tells);startSpecial(b,kind,TELL,TELL+.5,{angle});return;}
   if(kind==='hook'){const lead=.45,ax=p.x+(b.pv?.x??0)*lead,ay=p.y+(b.pv?.y??0)*lead,a=Math.atan2(ay-b.y,ax-b.x),l={kind:'lane',x:b.x,y:b.y,angle:a,len:600,width:60,age:0,warning:TELL,duration:1.4,owner:b.id};push(c,[l]);startSpecial(b,kind,TELL,TELL+1.5,{angle:a,lane:l,reach:0,len:l.len});return;}
   if(kind==='fissures'){const lanes=Array.from({length:5},(_,i)=>({kind:'lane',x:b.x,y:b.y,angle:angle+(i-2)*.28,len:520,width:44,age:0,warning:FISSURE_TELL,duration:.15,owner:b.id}));(c.hazards??=[]).push(...lanes);startSpecial(b,kind,TELL,FISSURE_TELL+520/FISSURE_SPEED+.35,{lanes,front:0,patched:0});return;}
   if(kind==='mark'){const life=1.6+Math.random()*1.6,h={kind:'explosion',x:p.x,y:p.y,radius:140,age:0,warning:life,duration:.4,owner:b.id,death:false,fired:false,damage:46,lockAt:life-TELL,mark:true};(c.hazards??=[]).push(h);startSpecial(b,kind,.3,life+.35,{h,goal:{x:p.x,y:p.y},wt:.2});return;}
   if(kind==='storm'){push(c,[{kind:'explosion',x:b.x,y:b.y,radius:130,age:0,warning:TELL,duration:.3,owner:b.id,death:false,fired:false,damage:14}]);startSpecial(b,kind,TELL,TELL+3,{theta:angle,next:0});}},
  tick(b,s,c,p,props,dt,events,sp){
   const fire=!sp.fired&&sp.elapsed>=sp.windup;if(fire)sp.fired=true;
   if(sp.kind==='crossChop'&&fire){for(const q of sp.throws)shoot(c,{id:b.id,x:q.x,y:q.y},q.a,{speed:1000,damage:42,color:'#d8d0bc',hitR:28,life:.62,ghost:true,big:true});events.push({type:'bossImpact',x:b.x,y:b.y,kind:'sweep'});}
   if(sp.kind==='boomerang'&&fire){for(const side of [1,-1])shoot(c,b,sp.angle+side*.9,{speed:380,damage:30,color:'#d8d0bc',hitR:26,life:Math.PI,ghost:true,turn:-side*2,big:true});events.push({type:'bossImpact',x:b.x,y:b.y,kind:'sweep'});}
   if(sp.kind==='hook'&&sp.fired){const l=sp.lane;l.hidden=true; // the chain is drawn by butcher-vfx.js once thrown
    if(!sp.caught&&!sp.back){sp.reach=Math.min(sp.len,(sp.elapsed-sp.windup)*2200);const hx=b.x+Math.cos(sp.angle)*sp.reach,hy=b.y+Math.sin(sp.angle)*sp.reach;
     if(Math.hypot(p.x-hx,(p.y-hy)/.65)<60&&!p.invulnerable){sp.caught=true;sp.pull=0;events.push(...receiveHit(s,c,p,{...b,attackDamage:12,unparryable:true},props));}else if(sp.reach>=sp.len)sp.back=true;}
    if(sp.caught&&!sp.chopped){sp.pull+=dt;const tx=b.x+Math.cos(sp.angle)*75,ty=b.y+Math.sin(sp.angle)*75*.65,ddx=tx-p.x,ddy=ty-p.y,d=Math.hypot(ddx,ddy);if(d>8&&sp.pull<.3)movePlayer(p,ddx/d*Math.min(d,2200*dt),ddy/d*Math.min(d,2200*dt),props);sp.reach=dist(b,p);
     if(sp.pull>=.3||d<=8){sp.chopped=true;push(c,[{kind:'explosion',x:tx,y:ty,radius:95,age:0,warning:.25,duration:.3,owner:b.id,death:false,fired:false,damage:38}]);}}
    if(sp.back){sp.reach=Math.max(0,sp.reach-2600*dt);if(!sp.reach&&sp.elapsed<sp.duration-.2)sp.elapsed=sp.duration-.2;}
    Object.assign(l,{x:b.x,y:b.y,len:Math.max(1,sp.reach)});if(sp.elapsed>=sp.duration-.05){const i=c.hazards.indexOf(l);if(i>=0)c.hazards.splice(i,1);}}
   if(sp.kind==='fissures'&&sp.elapsed>=FISSURE_TELL&&sp.front<520){const was=sp.front;sp.front=Math.min(520,(sp.elapsed-FISSURE_TELL)*FISSURE_SPEED);if(!was)events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});
    for(const pl of everyone(p)){if(!wasHit(sp,pl,'hit'))for(const l of sp.lanes){const dx=pl.x-l.x,dy=pl.y-l.y,along=dx*Math.cos(l.angle)+dy*Math.sin(l.angle),side=Math.abs(-dx*Math.sin(l.angle)+dy*Math.cos(l.angle));if(along>=was-25&&along<=sp.front+10&&side<l.width/2+10){markHit(sp,pl,'hit');events.push(...receiveHit(s,c,pl,{...b,attackDamage:34,unparryable:true},props));break;}}}  // multiplayer: every standing player
    const patches=[];for(let r=70+75*sp.patched;r<=sp.front;r+=75,sp.patched++)for(const l of sp.lanes)patches.push({kind:'fire',x:l.x+Math.cos(l.angle)*r,y:l.y+Math.sin(l.angle)*r,radius:34,age:0,warning:0,duration:3,owner:b.id,damage:7});(c.hazards??=[]).push(...patches);}
   if(sp.kind==='mark'){const h=sp.h;if(h.age<h.lockAt){sp.wt-=dt;if(sp.wt<=0){sp.wt=.35+Math.random()*.4;const a=Math.random()*TAU,r=15+Math.random()*65;sp.goal={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*.65};}
    const gx=sp.goal.x-h.x,gy=sp.goal.y-h.y,d=Math.hypot(gx,gy);if(d>2){const v=Math.min(d,300*dt);h.x+=gx/d*v;h.y+=gy/d*v;}}}
   if(sp.kind==='storm'&&sp.fired){sp.next-=dt;while(sp.next<=0){sp.next+=.11;for(const off of [0,Math.PI])shoot(c,b,sp.theta+off,{speed:240,damage:20,color:'#d8d0bc',hitR:22,life:3,ghost:true,big:true});sp.theta+=.38;}}}},
 // Oct 16 (user, "Soul Caster" rework of the Hollow Prophet): Spectral Scythes, Delayed Echo, Soul Cage, False
 // Apparitions (= Possession), Soul Lances, a telegraphed cone Repulse (replaces the automatic close blast) and teleport
 // repositioning with an arrival delay (not right after a melee player reaches him). Fan, Eruptions and Guardians are
 // removed. Phase 2 (<50%): Soul Cage then Delayed Echo, Spectral Scythes during the Apparitions, two quick Lance sets.
 // At most two mechanics overlap; the cage always has an opening. Damage/timings are playtest seeds.
 prophet:{list:b=>b.phase2?['cage','lances','apparitions','scythes','lances','scythes']:['scythes','lances','echo','cage','scythes','apparitions','lances','echo']  /* Oct 17 (user): the blink (reposition) is removed completely */,
  cd:b=>b.phase2?1.8:2.3,
  start(b,s,c,p,kind){const angle=Math.atan2(p.y-b.y,p.x-b.x);
   if(kind==='reposition'&&b.meleeT>0)kind='scythes';  // a melee player just reached him: stay and fight
   if(kind==='scythes'){launchScythes(b,c,p);startSpecial(b,kind,TELL,TELL+.5);cast(b,TELL);return;}
   if(kind==='echo'){startSpecial(b,kind,.2,ECHO.gap*2+1.6,{n:0});cast(b,.5);return;}
   if(kind==='cage'){const R=210,n=16,gap=Math.floor(Math.random()*n),a0=Math.random()*TAU,pillars=Array.from({length:n},(_,i)=>{const w=TAU/n*.13,an=a0+i*TAU/n+(i===gap?-w:i===(gap+1)%n?w:0);return {x:p.x+Math.cos(an)*R,y:p.y+Math.sin(an)*R*.65};});  // exit pillars nudged apart: opening ~1.25 segments (user: a tad bigger)
    startSpecial(b,kind,TELL,CAGE.close+.35,{cage:{x:p.x,y:p.y,R,gap,pillars}});cast(b,.6);return;}
   if(kind==='apparitions'){for(const k of c.targets)if(k.apparition&&k.cloneOf===b.id&&k.state==='alive'){k.state='dead';k.death=2.2;}  // a new cast replaces old copies
    const spots=apparitionSpots(b,p);
    teleports(c).push({x:b.x,y:b.y,at:b.clock??0});b.x=spots[0].x;b.y=spots[0].y;b.crystal=1;
    const copies=spots.slice(1).map((q,i)=>{const k={...b,id:++s.id,x:q.x,y:q.y,role:'bossClone',cloneOf:b.id,apparition:true,hp:1,maxHp:1,special:null,swing:null,xp:0,crystal:0,invulnerable:1,guard:APP.guard,emerge:0,scythes:null,...CLEAN,refire:APP.windup+TELL+APP.every+i*.6};c.targets.push(k);return k;});
    startSpecial(b,kind,APP.windup,APP.windup+TELL+.35,{copies});b.special.windup=APP.windup;for(const t2 of [b,...copies])cast(t2,APP.windup);
    if(b.phase2)launchScythes(b,c,p,.35);return;}
   if(kind==='lances'){startSpecial(b,kind,.3,.3+LANCE.warn+LANCE.reach/LANCE.speed+.35+(b.phase2?LANCE.gap:0),{sets:b.phase2?2:1,done:0});cast(b,.3+LANCE.warn);return;}
   if(kind==='repulse'){startSpecial(b,kind,TELL,REPULSE.windup+.35);b.special.windup=REPULSE.windup;  // duration must outlast the wind-up (bug: it ended before firing)
   b.special.angle=angle;cast(b,REPULSE.windup);return;}
   startSpecial(b,kind,.18,.5);cast(b,.18);},  // reposition: quick blink-out (.18s)
  tick(b,s,c,p,props,dt,events,sp){
   if(b.swing?.kind==='cast')b.swing.elapsed+=dt;
   if(sp.kind==='echo'){while(sp.n<3&&sp.elapsed>=.2+sp.n*ECHO.gap){(c.hazards??=[]).push({kind:'explosion',x:p.x,y:p.y,radius:ECHO.r,age:0,warning:1.05,duration:.35,owner:b.id,death:false,fired:false,damage:28,echo:++sp.n});}return;}
   if(sp.kind==='cage'){const g=sp.cage,k=sp.elapsed;
    if(k>=CAGE.beams&&k<CAGE.close){g.tick=(g.tick??0)-dt;if(g.tick<=0){let any=false;for(const pl of everyone(p)){if(pl.invulnerable||pl.rollT>0)continue;const n=g.pillars.length;for(let i=0;i<n;i++){if(i===g.gap)continue;const a=g.pillars[i],q=g.pillars[(i+1)%n];if(segDist(pl,a,q)<20){any=true;events.push(...receiveHit(s,c,pl,{...b,attackDamage:14,unparryable:true},props));break;}}}if(any)g.tick=.35;}/* multiplayer: beams hit every player */}
    if(k>=CAGE.close&&!g.closed){g.closed=true;for(const pl of everyone(p)){if(Math.hypot(pl.x-g.x,(pl.y-g.y)/.65)<g.R*.97&&!(pl.rollT>0))  /* Oct 17 (user): rolling through the cage is safe */events.push(...receiveHit(s,c,pl,{...b,attackDamage:40,unparryable:true},props));}/* multiplayer: every standing player */events.push({type:'bossImpact',x:g.x,y:g.y,kind:'smash'});
     if(b.phase2){b.chainNext='echo';b.specialCD=0;}}
    return;}
   if(sp.kind==='apparitions'){
    if(!sp.fired&&sp.elapsed>=sp.windup){sp.fired=true;b.crystal=0;sp.volleys=[b,...sp.copies].filter(t2=>t2.state==='alive').map(t2=>boltTells(b,c,t2,p));}
    if(sp.volleys&&!sp.shot&&sp.elapsed>=sp.windup+TELL){sp.shot=true;for(const v of sp.volleys)boltFire(b,c,v);}
    return;}
   if(sp.kind==='lances'){
    while(sp.done<sp.sets&&sp.elapsed>=sp.windup+sp.done*LANCE.gap){sp.done++;const n=LANCE.n,a0=Math.random()*Math.PI,oa=Math.random()*TAU,or=60+Math.random()*110,cx=p.x+Math.cos(oa)*or,cy=p.y+Math.sin(oa)*or*.65,ls=Array.from({length:n},(_,i)=>{const a=a0+i*Math.PI/n,len=LANCE.reach*2;return {kind:'lane',x:cx-Math.cos(a)*len/2,y:cy-Math.sin(a)*len/2,angle:a,len,width:LANCE.width,age:0,warning:LANCE.warn,duration:.02,owner:b.id,lance:true};});(c.hazards??=[]).push(...ls);(sp.pending??=[]).push({at:sp.elapsed+LANCE.warn,ls,cx,cy,front:0});}
    // user: the lances burst out from the crossing point and race to the edges (progressive), hitting as the beams reach you
    for(const q of sp.pending??[]){if(sp.elapsed<q.at||q.front>=LANCE.reach&&q.fired)continue;if(!q.fired){q.fired=true;events.push({type:'bossImpact',x:q.cx,y:q.cy,kind:'charge'});}
     q.front=Math.min(LANCE.reach,(sp.elapsed-q.at)*LANCE.speed);
     for(const pl of everyone(p)){if(!wasHit(q,pl,'hit')&&!pl.invulnerable)for(const l of q.ls){const dx=pl.x-q.cx,dy=pl.y-q.cy,along=Math.abs(dx*Math.cos(l.angle)+dy*Math.sin(l.angle)),side=Math.abs(-dx*Math.sin(l.angle)+dy*Math.cos(l.angle));if(along<=q.front&&side<l.width/2+4){markHit(q,pl,'hit');events.push(...receiveHit(s,c,pl,{...b,attackDamage:28,unparryable:true},props));break;}}}/* multiplayer: every standing player */}
    return;}
   if(sp.kind==='repulse'){if(!sp.fired&&sp.elapsed>=sp.windup){sp.fired=true;for(const pl of everyone(p)){const dx=pl.x-b.x,dy=(pl.y-b.y)/.65,d=Math.hypot(dx,dy),off=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-sp.angle),Math.cos(Math.atan2(dy,dx)-sp.angle)));
     if(d<REPULSE.range&&off<REPULSE.half&&!pl.invulnerable){events.push(...receiveHit(s,c,pl,{...b,attackDamage:32,unparryable:true},props));const n=Math.hypot(pl.x-b.x,pl.y-b.y)||1;movePlayer(pl,(pl.x-b.x)/n*70,(pl.y-b.y)/n*70,props);}}/* multiplayer: every standing player */events.push({type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}return;}
   if(sp.fired||sp.elapsed<sp.windup)return;sp.fired=true;
   if(sp.kind==='reposition'){for(let k=0;k<12;k++){const a=Math.random()*TAU,x=p.x+Math.cos(a)*430,y=p.y+Math.sin(a)*430*.7;if(!blocked(x,y,props,b.radius)){teleports(c).push({x:b.x,y:b.y,at:b.clock??0});events.push({type:'bossImpact',x:b.x,y:b.y,kind:'charge'});b.x=x;b.y=y;b.invulnerable=0;b.arrive=.2;
     // user: teleport flows straight into the next ability (teleport -> cast, not teleport -> wait -> cast)
     const L=SPECIALS.prophet.list(b);let nk=L[(b.specialIndex+1)%L.length];if(nk==='reposition'){b.specialIndex++;nk=L[(b.specialIndex+1)%L.length];}b.specialIndex++;b.chainNext=nk;b.specialCD=0;sp.duration=Math.min(sp.duration,sp.elapsed+.05);break;}}}}},
 // Oct 17 (user specs): Obsidian Colossus and Dune Wyrm kits live in titans.js.
 colossus:COLOSSUS,
 wyrm:WYRM
};
const MELEE={butcher:{reach:130,damage:40,recover:.7},prophet:null};  // Oct 17: the titans' kits cover close range (Pursuit Slam, Raking Claws)
export function tickBosses(s,c,p0,props,dt){
 const events=[];if(s.dead)return events;
 // Butcher's Mark: the warning circle follows the player until TELL seconds before it lands.
 if(!s.timeStop&&!p0.unseen)for(const h of c.hazards??[])if(h.follow&&h.age<h.lockAt){h.x=p0.x;h.y=p0.y;}
 for(const k of c.targets)if(k.apparition&&k.state==='alive'&&!c.targets.some(o=>o.id===k.cloneOf&&o.state==='alive')){k.state='dead';k.death=2.2;}  // copies fade with their caster
 for(const b of c.targets){if(b.role!=='boss'||b.state!=='alive'||!SPECIALS[b.bossKind])continue;let p=bossTarget(b,p0);const lost=!!p.unseen;if(lost)p=p.lastSeen??p;  /* Oct 18: target hidden in smoke = attacks in progress aim at where it was last seen; no new attacks or chasing (below) */  // Multiplayer (Oct 17, user): bosses don't focus one player; see nextBossTarget
  if(b.emerge>0){b.emerge=Math.max(0,b.emerge-dt);b.moving=false;continue;}
  if(b.sleeping||b.leashing||s.timeStop&&!b.pit)continue;
  b.cooldown=Math.max(0,b.cooldown-dt);b.slow=Math.max(0,(b.slow??0)-dt);b.exposed=Math.max(0,(b.exposed??0)-(b.special?.kind==='kneel'?0:dt));
  const def=SPECIALS[b.bossKind];if(def.pre)def.pre(b,s,c,p,props,dt,events);
  // Phase changes: Butcher/Prophet enrage at 50%; Colossus sheds armour plates at 66% and 33%.
  if(!b.phase2&&b.hp<b.maxHp*.5&&!def.pre){b.phase2=true;b.speed*=1.3;if(b.bossKind==='butcher'){b.tint='saturate(1.5) contrast(1.15) brightness(.95)';b.bloodrage=true;}events.push({type:'worldNotice',text:b.bossKind==='butcher'?'BLOODRAGE · the Butcher chains his attacks!':b.name+' is enraged!'},{type:'bossImpact',x:b.x,y:b.y,kind:'smash'});}
  if(b.bossKind==='butcher'&&dt>0){const vx=(p.x-(b.pp?.x??p.x))/dt,vy=(p.y-(b.pp?.y??p.y))/dt;b.pv={x:(b.pv?.x??0)*.8+vx*.2,y:(b.pv?.y??0)*.8+vy*.2};b.pp={x:p.x,y:p.y};}
  if(b.bossKind==='prophet'){b.clock=(b.clock??0)+dt;tickScythes(b,s,c,p,props,dt,events);tickCopies(b,s,c,p,dt);const close=dist(b,p)<200;if(close&&!b.wasClose)b.meleeT=3;b.wasClose=close;b.meleeT=Math.max(0,(b.meleeT??0)-dt);b.arrive=Math.max(0,(b.arrive??0)-dt);b.repulseCD=Math.max(0,(b.repulseCD??0)-dt);}
  if(b.special){b.special.elapsed+=dt;b.moving=false;def.tick(b,s,c,p,props,dt,events,b.special);def.post?.(b,p);if(b.special&&b.special.elapsed>=b.special.duration){b.special=null;b.lift=0;b.cooldown=Math.max(b.cooldown,b.chain||b.chainNext?0:.5);b.hidden=false;b.invulnerable=0;if(b.bossKind==='prophet'){b.swing=null;b.crystal=0;}}continue;}
  if(lost){b.moving=false;b.swing=null;continue;}
  b.specialCD-=dt;const d=dist(b,p);
  if(b.bossKind==='prophet'&&!b.swing&&!b.arrive&&!b.repulseCD&&d<170){b.repulseCD=4;b.row=directionRow(p.x-b.x,p.y-b.y);def.start(b,s,c,p,'repulse');continue;}
  if(!b.swing&&b.specialCD<=0&&d<700&&b.cooldown<=0&&!b.arrive){if(!b.chainNext)p=nextBossTarget(b,p0);const kind=b.chainNext??(def.pick?def.pick(b,p,dist(b,p)):(L=>L[(b.specialIndex=(b.specialIndex+1))%L.length])(def.list(b)));b.chainNext=null;b.specialCD=def.cd(b);b.row=directionRow(p.x-b.x,p.y-b.y);def.start(b,s,c,p,kind);continue;}  // Oct 17 (user): every new attack goes to a random player; Oct 18 fix: pick the target first, then the attack for that target (Wyrm clawed/tailed at the wrong player in co-op)
  if(b.bossKind==='prophet'){walk(b,p,props,dt,{keep:150,speedMul:.5});continue;}  // Oct 17 (user): slowly walks toward you whenever he isn't casting (knockback can't push him far away); was: back away / hold at 420  // backs off slowly: brief melee openings
  if(MELEE[b.bossKind]&&melee(b,s,c,p,props,dt,events,MELEE[b.bossKind]))continue;
  walk(b,p,props,dt,{keep:def.keep??(MELEE[b.bossKind]?.reach??80)*.7});def.post?.(b,p);
 }
 return events;
}
// Screen-space bar for the nearest awake boss.
export function drawBossBar(ctx,c,p,width,dpr=1){
 const b=c.targets.filter(t=>t.role==='boss'&&t.state==='alive'&&!t.sleeping&&!t.emerge&&dist(t,p)<1100).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(!b)return;
 const w=Math.min(620,width*.6),x=(width-w)/2,y=18;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle='rgba(16,10,10,.82)';ctx.fillRect(x-4,y-4,w+8,26);ctx.fillStyle='#3a1414';ctx.fillRect(x,y,w,18);
 ctx.fillStyle=b.invulnerable>0?'#8a8aa0':b.exposed>0?'#ffcf5a':'#c8302a';ctx.fillRect(x,y,w*b.hp/b.maxHp,18);
 if(b.armorMax&&b.armorHp>0){const k=Math.max(0,b.armorHp)/b.armorMax;ctx.fillStyle='#e8892a';ctx.fillRect(x,y,w*k,18);ctx.fillStyle='rgba(255,220,150,.5)';ctx.fillRect(x,y,w*k,4);ctx.fillStyle='#ffd27a';ctx.fillRect(x+w*k-2,y,2,18);}  // Oct 17 (user): orange armour drawn over the red HP; it shrinks as the armour breaks, revealing the red
 ctx.font='bold 14px Cinzel, Georgia, serif';ctx.textAlign='center';ctx.fillStyle='#ffe6c0';ctx.strokeStyle='#1a0c0c';ctx.lineWidth=4;const label=b.name+(b.invulnerable>0?' · SHIELDED':b.exposed>0?' · EXPOSED':b.armorMax&&b.armorHp>0?' · ARMOUR '+Math.ceil(b.armorHp):'');ctx.strokeText(label,width/2,y+14);ctx.fillText(label,width/2,y+14);ctx.restore();
}
