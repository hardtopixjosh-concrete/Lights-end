// Oct 17 (user: "a bunch of VFX and particles... smokes or bloom... so the attacks look beautiful", ALL bosses).
// One shared, visual-only layer for every boss: a simulation-time particle pool (smoke, dust, embers, sparks, glowing
// motes, rock debris; drawn by mage-e-fx's particle renderer), short-lived ground lights with white-hot cores (the
// post-fx bloom threshold picks those up) and post-fx shockwave records on heavy impacts. It reads boss/hazard/
// projectile state each tick and emits on events (a hazard landing, a special firing, a boss impact) plus ambient
// auras, so the per-boss modules (butcher-vfx, prophet-vfx, titan-vfx, final-boss, elite-fx) keep their own shapes.
// Depth: everything spawns with height (z), falls with gravity or rises with heat, and casts its light on the ground.
import {emit,tickEFx,drawParticles,radialGlow} from './mage-e-fx.js?v=fx-260';
const TAU=Math.PI*2,R=(a,b)=>a+Math.random()*(b-a),pick=l=>l[(Math.random()*l.length)|0];
export const BFX={effects:[],efx:[],lights:[]};   // effects = post-fx shock records only
// Palettes: spark/ember = hot particles, mote = glowing wisps, debris = rock chips, smoke/dust = soft clouds.
const PAL={
 ember:{spark:['#fff2c0','#ffd27a','#ff9a3a'],ember:['#ff7a1a','#ffb040','#ff5a10'],mote:['#ffd8a0','#ff9a40'],debris:['#2a2626','#3a3434','#1e1c1e'],smoke:'#2e2826',dust:'#5a4e46',light:'255,140,50'},
 sand:{spark:['#fff4d8','#f0d6a0','#e0bc80'],ember:['#e8c690','#d6a86a'],mote:['#fff0c8','#e8cf9a'],debris:['#c99a5e','#a87a46','#dcb47a','#8a6038'],smoke:'#a88a62',dust:'#c9a674',light:'255,220,160'},
 violet:{spark:['#ffffff','#e8dcff','#c8b0ff'],ember:['#b48cff','#d8c4ff'],mote:['#e8dcff','#b48cff','#9b6cff'],debris:['#3a2a5a','#5a3a8a'],smoke:'#2e2448',dust:'#4a3a6a',light:'180,140,255'},
 ash:{spark:['#fff0c0','#ffb060','#ff6a1a'],ember:['#ff5a1a','#ff8a30','#ffb050'],mote:['#ffb070','#ff7a3a'],debris:['#3a2a20','#48423f','#2a201a'],smoke:'#241c1a',dust:'#4a3a30',light:'255,110,40'},
 rage:{spark:['#fff0e0','#ff8a6a','#ff3a2a'],ember:['#ff2a1a','#ff5a3a','#c01818'],mote:['#ff8a7a','#ff3a2a'],debris:['#3a1010','#5a1a14'],smoke:'#2a0e0c',dust:'#4a2420',light:'255,60,40'},
 hell:{spark:['#fff6d0','#ffd27a','#ff6a2a'],ember:['#ff3a1a','#ff7a2a','#ffc050'],mote:['#ffb070','#ff4a2a'],debris:['#2a0e0a','#4a1a10'],smoke:'#1e0a08',dust:'#4a2a20',light:'255,70,30'}
};
const palFor=b=>!b?PAL.sand:b.bossKind==='colossus'?PAL.ember:b.bossKind==='wyrm'||b.bossKind==='ravager'?PAL.sand:b.bossKind==='prophet'?PAL.violet:b.bossKind==='butcher'?(b.bloodrage?PAL.rage:PAL.ash):b.bossKind==='final'?PAL.hell:PAL.sand;
// ---------- emitters ----------
export function smoke(x,y,n,col,{spread=20,size=[16,30],up=[20,50],speed=[10,40],life=[.9,1.6],z=8,grow=28}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=R(...speed),r=spread*Math.sqrt(Math.random());emit(BFX,{kind:'smoke',x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.65,z:z+R(0,14),vx:Math.cos(a)*s,vy:Math.sin(a)*s*.6,vz:R(...up),drag:1.6,life:R(...life),size:R(...size),grow,color:col});}}
export function dustRing(x,y,rad,n,col,{speed=[120,260],size=[14,24],life=[.6,1.1]}={}){for(let i=0;i<n;i++){const a=i/n*TAU+R(-.2,.2),s=R(...speed);emit(BFX,{kind:'smoke',x:x+Math.cos(a)*rad*.4,y:y+Math.sin(a)*rad*.26,z:4,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.6,vz:R(10,40),drag:2.6,life:R(...life),size:R(...size),grow:34,color:col});}}
export function sparks(x,y,z,n,cols,{speed=[160,420],up=[40,260],life=[.2,.5],size=[1.4,3],g=500,spread=0}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=R(...speed),r=spread*Math.sqrt(Math.random());emit(BFX,{kind:'spark',x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.65,z,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.62,vz:R(...up),g,drag:1.6,life:R(...life),size:R(...size),color:pick(cols)});}}
export function embers(x,y,z,n,cols,{spread=30,up=[60,200],speed=[10,60],life=[.7,1.4],size=[1.6,3.4],g=-30}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=R(...speed),r=spread*Math.sqrt(Math.random());emit(BFX,{kind:'ember',x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.65,z:z+R(0,10),vx:Math.cos(a)*s,vy:Math.sin(a)*s*.6,vz:R(...up),g,drag:1.2,life:R(...life),size:R(...size),color:pick(cols)});}}
export function motes(x,y,z,n,cols,{spread=30,up=[20,80],speed=[10,50],life=[.6,1.3],size=[1.6,3],g=-10}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=R(...speed),r=spread*Math.sqrt(Math.random());emit(BFX,{kind:'mote',x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.65,z:z+R(0,10),vx:Math.cos(a)*s,vy:Math.sin(a)*s*.6,vz:R(...up),g,drag:1.4,life:R(...life),size:R(...size),color:pick(cols),rot:Math.random()*TAU,vr:R(-6,6)});}}
export function debris(x,y,n,cols,{speed=[80,280],up=[180,420],size=[3,8],spread=10,life=[.8,1.4]}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=R(...speed),r=spread*Math.sqrt(Math.random());emit(BFX,{kind:'shard',x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.65,z:R(4,16),vx:Math.cos(a)*s,vy:Math.sin(a)*s*.6,vz:R(...up),g:900,drag:.6,life:R(...life),size:R(...size),color:pick(cols),rot:Math.random()*TAU,vr:R(-14,14)});}}
export function light(x,y,rad,rgb,life=.45,k=1){BFX.lights.push({x,y,rad,rgb,life,max:life,k});if(BFX.lights.length>40)BFX.lights.shift();}
export function shock(x,y,kind,extra={}){BFX.effects.push({kind,x,y,age:0,...extra});}
// A full heavy impact: light flash, dust ring, debris, sparks, lingering smoke, screen shockwave.
export function impact(x,y,rad,pal,{heavy=false,shockKind=heavy?'stomp':'charge',rocks=true}={}){
 light(x,y,rad*(heavy?2.2:1.6),pal.light,heavy?.6:.4,heavy?1:.8);
 dustRing(x,y,rad,heavy?22:12,pal.dust,{speed:heavy?[180,360]:[110,240]});
 if(rocks)debris(x,y,heavy?18:9,pal.debris,{spread:rad*.4,size:heavy?[4,10]:[3,7]});
 sparks(x,y,10,heavy?26:12,pal.spark,{spread:rad*.2});
 smoke(x,y,heavy?8:4,pal.smoke,{spread:rad*.5,life:[1.1,1.9]});
 shock(x,y,shockKind);
}
// ---------- per-tick driver ----------
const bossOf=(c,id)=>c.targets.find(t=>t.id===id&&(t.role==='boss'||t.role==='bossClone'));
export function tickBossFx(c,dt){
 if(dt<=0)return;
 for(let i=BFX.effects.length-1;i>=0;i--){const e=BFX.effects[i];e.age+=dt;if(e.age>1)BFX.effects.splice(i,1);}
 for(let i=BFX.lights.length-1;i>=0;i--){const l=BFX.lights[i];l.life-=dt;if(l.life<=0)BFX.lights.splice(i,1);}
 // per-frame probability, frame-rate independent; ambient/continuous emitters stop at ~45% of the pool so impact
 // bursts (which bypass this) always have room and the frame cost stays bounded
 const room=BFX.efx.length<400,P=x=>room&&Math.random()<x*dt*60;
 const owners=new Map();for(const t of c.targets)if((t.role==='boss'||t.role==='bossClone')&&t.state==='alive')owners.set(t.id,t);
 for(const h of c.hazards??[]){const b=owners.get(h.owner);if(!b)continue;const pal=palFor(b),warn=h.age<h.warning;
  if(warn){
   // anticipation
   if(h.echo&&P(.9))motes(h.x+R(-1,1)*h.radius*.6,h.y+R(-1,1)*h.radius*.4,R(140,260),1,pal.mote,{up:[-260,-160],g:0,life:[.5,.8],size:[2,3.5]});   // soul light raining onto the mark
   if(h.rumble){if(P(.5))debris(h.x+R(-1,1)*h.radius*.6,h.y+R(-1,1)*h.radius*.4,1,pal.debris,{up:[60,140],speed:[10,40],size:[2,4]});if(P(.25))smoke(h.x,h.y,1,pal.dust,{spread:h.radius*.6,size:[10,18],up:[10,30],life:[.5,.8]});}
   if(h.overload&&P(1.2)){const a=Math.random()*TAU,d=h.radius*R(.5,1);emit(BFX,{kind:'spark',x:h.x+Math.cos(a)*d,y:h.y+Math.sin(a)*d*.65,z:10,vx:-Math.cos(a)*d*1.6,vy:-Math.sin(a)*d*1.04,vz:R(60,140),g:0,drag:0,life:.55,size:R(1.6,2.8),color:pick(pal.spark)});}  // power drawn into the core
   if(h.burrow&&!h.track&&P(.6))debris(h.x+R(-1,1)*h.radius*.5,h.y+R(-1,1)*h.radius*.3,1,pal.debris,{up:[80,180],speed:[20,60]});
   if(h.punch&&!h.track&&P(.4))embers(h.x,h.y,4,1,pal.ember,{spread:h.radius*.6,up:[30,90]});
   if(h.mark&&P(.5))embers(h.x,h.y,4,1,pal.ember,{spread:h.radius*.6,up:[40,120]});
   if(h.kind==='quicksand'||h.kind==='safezone')continue;
  } else if(!h._bfx){h._bfx=1;land(h,b,pal);}
  // lingering
  if(!warn){
   if(h.kind==='fire'&&P(.25)){embers(h.x,h.y,4,1,pal.ember,{spread:h.radius*.7});if(P(.08))smoke(h.x,h.y,1,pal.smoke,{spread:h.radius*.5,size:[14,24]});}
   if(h.kind==='soulmire'&&P(.35))motes(h.x+R(-1,1)*h.radius*.6,h.y+R(-1,1)*h.radius*.4,4,1,PAL.violet.mote,{spread:6,up:[20,60],life:[.6,1.1]});
   if(h.kind==='quicksand'&&P(.25))smoke(h.x,h.y,1,PAL.sand.dust,{spread:h.radius*.7,size:[8,14],up:[6,18],speed:[4,14],life:[.5,.9]});
   if(h.kind==='firering'&&h.r)for(let k=0;k<3;k++)if(P(1)){const a=Math.random()*TAU;embers(h.x+Math.cos(a)*h.r,h.y+Math.sin(a)*h.r*.72,6,1,PAL.hell.ember,{spread:6,up:[80,200]});}
   if(h.fault&&h.front>0&&h.front<h.len&&P(1.5)){const x=h.x+Math.cos(h.angle)*h.front,y=h.y+Math.sin(h.angle)*h.front;debris(x,y,2,pal.debris,{up:[160,320]});if(P(.5))embers(x,y,6,2,pal.ember,{spread:12,up:[80,200]});if(P(.4))smoke(x,y,1,pal.dust,{spread:14,size:[12,20]});}
   // Oct 19 (user): smoke, embers and grit all along the Colossus obsidian walls (Stomp arcs between the gaps, Fault wall behind its front).
   if(h.obsidian&&h.fault&&h.front>0&&h.front<h.len)for(let k=0;k<2;k++)if(P(.7)){const t=Math.max(10,h.front-Math.random()*220),x=h.x+Math.cos(h.angle)*t,y=h.y+Math.sin(h.angle)*t;smoke(x,y,1,pal.smoke??pal.dust,{spread:16,size:[16,30],up:[20,50]});if(P(.6))embers(x,y,20,2,pal.ember,{spread:14,up:[60,180]});if(P(.4))debris(x,y,1,pal.debris,{up:[120,260],speed:[30,90]});}
   if(h.obsidian&&h.kind==='ring'&&h.r>20){const gs=h.gaps??[h.gap];for(let k=0;k<4;k++)if(P(.8)){const a=Math.random()*TAU;if(gs.some(g=>Math.abs(Math.atan2(Math.sin(a-g),Math.cos(a-g)))<h.gapHalf))continue;const x=h.x+Math.cos(a)*h.r,y=h.y+Math.sin(a)*h.r*.65;smoke(x,y,1,pal.smoke??pal.dust,{spread:14,size:[16,28],up:[20,50]});if(P(.6))embers(x,y,18,2,pal.ember,{spread:12,up:[60,180]});if(P(.35))debris(x,y,1,pal.debris,{up:[120,240],speed:[30,90]});}}
   if(h.kind==='ring'&&h.r>10&&P(.6)){const a=Math.random()*TAU;debris(h.x+Math.cos(a)*h.r,h.y+Math.sin(a)*h.r*.65,1,pal.debris,{up:[120,240],speed:[30,90]});}
  }
 }
 for(const b of owners.values()){if(b.sleeping||b.hidden)continue;const pal=palFor(b),sp=b.role==='boss'?b.special:null,S=b.scale??3;
  // ambient auras (subtle, always on)
  if(b.bossKind==='prophet'){if(P(.35))motes(b.x+R(-1,1)*30,b.y+R(-1,1)*12,R(20,40*S),1,pal.mote,{spread:6,up:[30,70],life:[.8,1.4]});
   if(b.apparition&&!b._bfx){b._bfx=1;smoke(b.x,b.y,8,pal.smoke,{spread:40,size:[20,34]});motes(b.x,b.y,40,14,pal.mote,{spread:30,up:[60,180]});light(b.x,b.y,140,pal.light,.5);}}
  if(b.bossKind==='colossus'&&P(.3)){const a=Math.random()*TAU;embers(b.x+Math.cos(a)*14*S,b.y+Math.sin(a)*6*S,R(12,36)*S,1,pal.ember,{spread:4,up:[40,110]});}
  if(b.bossKind==='butcher'&&P(b.bloodrage?.6:.2))embers(b.x,b.y,R(10,30)*S,1,pal.ember,{spread:12*S,up:[50,140]});
  if(b.bossKind==='final'&&P(.5)){embers(b.x,b.y,R(10,40)*S,1,PAL.hell.ember,{spread:14*S,up:[60,170]});if(P(.05))smoke(b.x,b.y-20*S,1,PAL.hell.smoke,{spread:10*S,size:[20,30],up:[30,60]});}
  if((b.bossKind==='wyrm'||b.bossKind==='ravager'||b.bossKind==='colossus')&&b.moving&&!sp&&P(.25))smoke(b.x,b.y,1,PAL.sand.dust,{spread:14*S,size:[12,22],up:[8,24],life:[.5,.9]});
  if(!sp)continue;const e=sp.elapsed;
  // special-driven
  if(sp.kind==='overload'&&!sp.fired&&P(1))embers(b.x,b.y,30*S,1,pal.ember,{spread:20*S,up:[60,160]});
  if(sp.kind==='shed'&&b.bossKind==='colossus'&&!sp.fired&&P(1.2))sparks(b.x+R(-1,1)*20*S,b.y,R(10,40)*S,1,pal.spark,{speed:[40,140],up:[40,120]});
  if(sp.kind==='shed'&&b.bossKind==='colossus'&&sp.fired&&!sp._bfx){sp._bfx=1;impact(b.x,b.y,200,pal,{heavy:true});embers(b.x,b.y,30*S,50,pal.ember,{spread:30*S,up:[120,360],speed:[60,200]});}
  if(sp.kind==='shed'&&b.bossKind==='wyrm'&&sp.popped&&!sp._bfx){sp._bfx=1;dustRing(b.x,b.y,160,24,pal.dust);debris(b.x,b.y,22,pal.debris,{spread:80,up:[260,520],size:[5,11]});shock(b.x,b.y,'stomp');}
  if(sp.kind==='breath'&&sp.on){const mx=b.x+Math.cos(b.face??0)*200,my=b.y+Math.sin(b.face??0)*130;for(let k=0;k<4;k++){const a=sp.beam+R(-.38,.38),s=R(380,620);emit(BFX,{kind:k%2?'spark':'smoke',x:mx,y:my,z:R(30,60),vx:Math.cos(a)*s,vy:Math.sin(a)*s*.62,vz:R(-20,20),g:0,drag:k%2?.4:1.2,life:R(.55,.95),size:k%2?R(1.6,3):R(14,24),grow:k%2?0:40,color:k%2?pick(pal.spark):pal.dust});}}
  if(sp.kind==='burrow'&&sp.st==='trail'&&sp.head&&P(1.2)){debris(sp.head.x,sp.head.y,1,pal.debris,{up:[160,300],speed:[40,120]});if(P(.5))smoke(sp.head.x,sp.head.y,1,pal.dust,{spread:20,size:[14,24],up:[20,50]});}
  if(sp.kind==='burrow'&&sp.st==='dig'&&P(1))debris(b.x+Math.cos(b.face??0)*90,b.y+Math.sin(b.face??0)*60,1,pal.debris,{up:[200,360]});
  if(sp.kind==='charge'&&b.moving&&P(1)){smoke(b.x,b.y,1,pal.dust,{spread:20*S*.5,size:[16,28],up:[10,30]});if(P(.4))debris(b.x,b.y,1,pal.debris,{up:[120,240]});}
  if(sp.kind==='claws')for(const q of sp.arcs??[])if(q.done&&!q._bfx){q._bfx=1;const x=q.x+Math.cos(q.angle)*q.r*.6,y=q.y+Math.sin(q.angle)*q.r*.4;debris(x,y,10,pal.debris,{spread:40});smoke(x,y,4,pal.dust,{spread:40});sparks(x,y,14,10,pal.spark);}
  if(sp.kind==='pursuit'&&sp.st==='lodge'&&!sp._bfxL){sp._bfxL=1;embers(b.x,b.y,10,24,pal.ember,{spread:60,up:[80,220]});}
  if(sp.kind==='repulse'&&sp.fired&&!sp._bfx){sp._bfx=1;for(let k=0;k<40;k++){const a=sp.angle+R(-1,1)*Math.PI*13/18,s=R(260,520);emit(BFX,{kind:'mote',x:b.x,y:b.y,z:R(20,60),vx:Math.cos(a)*s,vy:Math.sin(a)*s*.62,vz:R(0,40),g:0,drag:2.2,life:R(.5,.9),size:R(2,3.5),color:pick(pal.mote),rot:0,vr:0});}light(b.x,b.y,260,pal.light,.4);shock(b.x,b.y,'cry');}
  if(sp.kind==='cage'&&sp.cage){const g=sp.cage;if(e>.45&&!g.closed&&P(.6)){const q=pick(g.pillars);motes(q.x,q.y,R(10,70),1,pal.mote,{spread:6,up:[40,120]});}
   if(g.closed&&!g._bfx){g._bfx=1;for(const q of g.pillars)sparks(q.x,q.y,40,3,pal.spark,{speed:[60,200]});motes(g.x,g.y,30,30,pal.mote,{spread:g.R*.6,up:[60,200]});light(g.x,g.y,g.R*1.3,pal.light,.5);shock(g.x,g.y,'qnova');}}
  if(sp.kind==='lances')for(const q of sp.pending??[])if(q.fired&&q.front<(q.reach??560)&&P(1.5))for(const l of q.ls){const sgn=Math.random()<.5?1:-1;motes(q.cx+Math.cos(l.angle)*q.front*sgn,q.cy+Math.sin(l.angle)*q.front*sgn,20,1,pal.mote,{spread:4,up:[10,40],life:[.3,.6]});}
  if(sp.kind==='storm'&&sp.fired&&P(1))sparks(b.x,b.y,50,2,pal.spark,{speed:[200,400]});
  if(sp.kind==='cataclysm'&&P(1.5))embers(b.x+R(-1,1)*200,b.y+R(-1,1)*130,10,1,PAL.hell.ember,{up:[160,360],spread:20});
 }
 // projectile trails
 for(const q of c.enemyProjectiles??[]){const b=owners.get(q.owner);if(!b)continue;const pal=palFor(b);
  if(q.frag==='armor'){if(P(.8))embers(q.x,q.y,20,1,PAL.ember.ember,{spread:6,up:[20,60]});continue;}
  if(b.bossKind==='prophet'&&P(.7))motes(q.x,q.y,26,1,pal.mote,{spread:5,up:[0,20],life:[.3,.6],speed:[0,10]});
  else if(b.bossKind==='butcher'&&q.big&&P(.8))embers(q.x,q.y,36,1,pal.ember,{spread:10,up:[20,60]});
  else if(b.bossKind==='final'&&P(.15))embers(q.x,q.y,28,1,PAL.hell.ember,{spread:4,up:[10,40],life:[.3,.6]});}
 for(const b of owners.values())if(b.bossKind==='prophet'&&b.scythes)for(const s of b.scythes)if(s.t>.38&&!s.done&&P(1.2))motes(s.x,s.y,40,1,PAL.violet.mote,{spread:8,up:[0,20],life:[.3,.6]});
 tickEFx(BFX,dt);
}
// Something just landed / fired.
function land(h,b,pal){const k=b.bossKind;
 if(h.kind==='explosion'){
  if(h.punch)return impact(h.x,h.y,h.radius,pal,{heavy:!!h.final,shockKind:h.final?'stomp':'charge'});
  if(h.overload){impact(h.x,h.y,h.radius*.7,pal,{heavy:true});embers(h.x,h.y,10,40,pal.ember,{spread:h.radius*.7,up:[100,320]});return;}
  if(h.hurl)return impact(h.x,h.y,h.radius,pal,{shockKind:'boulder'});
  if(h.burrow){debris(h.x,h.y,24,pal.debris,{spread:h.radius*.4,up:[300,620],size:[4,10]});dustRing(h.x,h.y,h.radius,18,pal.dust);smoke(h.x,h.y,8,pal.smoke,{spread:h.radius*.5,up:[60,140],size:[22,36]});light(h.x,h.y,h.radius*1.4,pal.light,.4,.7);shock(h.x,h.y,'stomp');return;}
  if(h.rumble){debris(h.x,h.y,12,pal.debris,{spread:h.radius*.4,up:[260,480],size:[4,9]});smoke(h.x,h.y,5,pal.dust,{spread:h.radius*.6,up:[40,100]});sparks(h.x,h.y,8,6,pal.spark);shock(h.x,h.y,'boulder');return;}
  if(h.tail){dustRing(h.x,h.y,h.radius,24,pal.dust,{speed:[220,380]});shock(h.x,h.y,'cry');return;}
  if(h.echo){motes(h.x,h.y,10,26,pal.mote,{spread:h.radius*.6,up:[120,320],speed:[40,160]});sparks(h.x,h.y,20,14,pal.spark,{spread:h.radius*.3});smoke(h.x,h.y,4,pal.smoke,{spread:h.radius*.5});light(h.x,h.y,h.radius*1.8,pal.light,.5,1);shock(h.x,h.y,'zap');return;}
  if(h.mark){embers(h.x,h.y,10,50,pal.ember,{spread:h.radius*.5,up:[220,520],speed:[20,90]});sparks(h.x,h.y,20,20,pal.spark,{spread:h.radius*.3});smoke(h.x,h.y,8,pal.smoke,{spread:h.radius*.6,up:[60,140],size:[24,40]});light(h.x,h.y,h.radius*2,pal.light,.55,1);shock(h.x,h.y,'surge');return;}
  if(k==='final'){embers(h.x,h.y,10,30,PAL.hell.ember,{spread:h.radius*.5,up:[160,380]});smoke(h.x,h.y,6,PAL.hell.smoke,{spread:h.radius*.5});light(h.x,h.y,h.radius*1.8,PAL.hell.light,.5);shock(h.x,h.y,'surge');return;}
  return impact(h.x,h.y,h.radius,pal,{rocks:k!=='prophet'});}
 if(h.kind==='boulder')return impact(h.x,h.y,h.radius,PAL.sand,{shockKind:'boulder'});
 if(h.kind==='ring'){dustRing(h.x,h.y,60,16,pal.dust,{speed:[200,340]});light(h.x,h.y,180,pal.light,.35,.7);shock(h.x,h.y,'stomp');return;}
 if(h.kind==='quicksand'){debris(h.x,h.y,8,PAL.sand.debris,{spread:h.radius*.4,up:[100,220],size:[3,6]});smoke(h.x,h.y,4,PAL.sand.dust,{spread:h.radius*.5});return;}
 if(h.kind==='cataclysm'){light(h.x,h.y,1400,PAL.hell.light,1,1);shock(h.x,h.y,'surge',{big:true});for(let i=0;i<10;i++)embers(h.x+R(-1,1)*700,h.y+R(-1,1)*450,10,8,PAL.hell.ember,{spread:80,up:[200,500]});return;}
 if(h.kind==='firering'){shock(h.x,h.y,'cry');return;}
}
// Boss impact events (melee swings, slams, charge stops) from bosses.js / titans.js / rewards.js.
export function bossFxImpact(c,ev){const b=c.targets.find(t=>t.role==='boss'&&t.state==='alive'&&Math.hypot(t.x-ev.x,t.y-ev.y)<400),pal=palFor(b);
 if(ev.kind==='smash'){dustRing(ev.x,ev.y,90,14,pal.dust);debris(ev.x,ev.y,8,pal.debris,{spread:30});light(ev.x,ev.y,170,pal.light,.35,.7);}
 else if(ev.kind==='charge'){smoke(ev.x,ev.y,5,pal.dust,{spread:40});debris(ev.x,ev.y,5,pal.debris,{spread:20});}
 else sparks(ev.x,ev.y,40,10,pal.spark,{spread:30});}
// ---------- drawing ----------
// Ground lights: additive pools of light with a white-hot core (bloom catches the core).
export function drawBossLights(ctx,c,time=0){ctx.save();ctx.globalCompositeOperation='lighter';
 // ambient boss light: a soft coloured pool under each boss (red pulse when enraged, brighter while powering up)
 for(const b of c?.targets??[]){if(b.role!=='boss'&&b.role!=='bossClone'||b.state!=='alive'||b.sleeping||b.hidden||b.emerge>0)continue;const pal=palFor(b),S=b.scale??3,sp=b.special,
  rage=b.phase2||b.bloodrage||(b.bossKind==='colossus'&&b.stage>=2),boost=sp&&(sp.kind==='overload'||sp.kind==='shed'||sp.kind==='cataclysm')?.35:0,a=(.16+boost+(rage?.08*(1+Math.sin(time*6)):0))*(b.role==='bossClone'?.6:1);
  radialGlow(ctx,b.x,b.y,34*S,[[0,`rgba(${rage?'255,70,40':pal.light},${a})`],[1,`rgba(${pal.light},0)`]],1,.6);}
 for(const l of BFX.lights){const f=l.life/l.max,a=f*f*l.k;radialGlow(ctx,l.x,l.y,l.rad,[[0,`rgba(255,250,235,${.85*a})`],[.18,`rgba(${l.rgb},${.6*a})`],[.6,`rgba(${l.rgb},${.18*a})`],[1,`rgba(${l.rgb},0)`]],1,.65);}
 ctx.restore();}
export function drawBossParticles(ctx){drawParticles(ctx,BFX);}

