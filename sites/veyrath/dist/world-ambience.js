// World ambience (Oct 15 user request): wind gusts, wandering dust devils, rolling dust balls (tumbleweeds)
// and ground puffs around the camera. Visual only, no collision or gameplay. Ticked in game time from
// game.js (frozen while paused) and gated by the Menu "Drifting dust" toggle.
import {TAU,rng,radialGlow} from './mage-e-fx.js?v=fx-260';
const SAND=['#d8bd86','#c9a46a','#e6d2a4','#b89868'];
export function createAmbience(){return {t:0,wind:{angle:.25,target:.25,next:10},gusts:[],devils:[],balls:[],puffs:[],nextGust:2.5,nextDevil:5,nextBall:1.5};}
const rnd=(a,b)=>a+Math.random()*(b-a);
function puff(a,x,y,size=12,life=.8){if(a.puffs.length<60)a.puffs.push({x,y,age:0,life,size,vx:Math.cos(a.wind.angle)*20,vy:Math.sin(a.wind.angle)*8});}
export function tickAmbience(a,dt,view){
 a.t+=dt;const w=a.wind;w.next-=dt;if(w.next<=0){w.next=rnd(9,16);w.target=.25+rnd(-.6,.6);}w.angle+=(w.target-w.angle)*Math.min(1,dt*.3);
 const wx=Math.cos(w.angle),wy=Math.sin(w.angle)*.6,margin=160,inView=(x,y,m=margin)=>x>view.x-m&&x<view.x+view.w+m&&y>view.y-m&&y<view.y+view.h+m;
 // Gusts: a band of fast sand streaks sweeping across the view.
 a.nextGust-=dt;if(a.nextGust<=0){a.nextGust=rnd(5,10);const lines=[];for(let i=0;i<26;i++)lines.push({x:view.x+rnd(-200,view.w),y:view.y+rnd(0,view.h),len:rnd(40,120),speed:rnd(650,950),phase:rnd(0,.5),c:SAND[i%4]});a.gusts.push({age:0,life:rnd(1.4,2.2),lines});for(let i=0;i<6;i++)puff(a,view.x+rnd(0,view.w),view.y+rnd(0,view.h),rnd(14,22),1.2);}
 for(const g of a.gusts){g.age+=dt;for(const l of g.lines){l.x+=wx*l.speed*dt;l.y+=wy*l.speed*dt;}}a.gusts=a.gusts.filter(g=>g.age<g.life);
 // Dust devils: small whirling columns wandering with the wind.
 a.nextDevil-=dt;if(a.nextDevil<=0){a.nextDevil=rnd(9,16);if(a.devils.length<2)a.devils.push({x:view.x+rnd(.1,.9)*view.w,y:view.y+rnd(.2,.9)*view.h,age:0,life:rnd(7,11),r:rnd(24,38),h:rnd(110,170),seed:(Math.random()*1e9)|0,dir:Math.random()*TAU});}
 for(const d of a.devils){d.age+=dt;d.dir+=rnd(-1,1)*dt;d.x+=(wx*35+Math.cos(d.dir)*20)*dt;d.y+=(wy*35+Math.sin(d.dir)*12)*dt;if(Math.random()<dt*8)puff(a,d.x+rnd(-d.r,d.r),d.y+rnd(-6,6),rnd(10,16),.9);}a.devils=a.devils.filter(d=>d.age<d.life&&inView(d.x,d.y,400));
 // Dust balls: tumbleweed-like clumps rolling downwind in hops, puffing dust when they land.
 a.nextBall-=dt;if(a.nextBall<=0){a.nextBall=rnd(3,7);if(a.balls.length<3){const fromLeft=wx>=0,x=fromLeft?view.x-60:view.x+view.w+60;a.balls.push({x,y:view.y+rnd(.15,.9)*view.h,z:0,vz:0,r:rnd(9,15),spin:0,speed:rnd(90,160),age:0,seed:(Math.random()*1e9)|0});}}
 for(const b of a.balls){b.age+=dt;const sp=b.speed*(a.gusts.length?1.6:1);b.x+=wx*sp*dt;b.y+=wy*sp*dt+Math.sin(b.age*1.3+b.seed)*6*dt;b.spin+=sp*dt/b.r;b.vz-=520*dt;b.z+=b.vz*dt;if(b.z<=0){b.z=0;if(b.vz<-60)puff(a,b.x,b.y,b.r*1.1,.6);b.vz=rnd(90,190);}}
 a.balls=a.balls.filter(b=>b.age<16&&inView(b.x,b.y,240));
 for(const p of a.puffs){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}a.puffs=a.puffs.filter(p=>p.age<p.life);
}
export function drawAmbienceGround(ctx,a){
 for(const p of a.puffs){const f=p.age/p.life;radialGlow(ctx,p.x,p.y-4-f*10,p.size*(1+f*1.4),[[0,'#c9a46aaa'],[.6,'#c9a46a55'],[1,'#c9a46a00']],(1-f)*.6,.7);}
 for(const b of a.balls){const s=1/(1+b.z/60);ctx.save();ctx.globalAlpha=.25*s;ctx.fillStyle='#3a2a1a';ctx.beginPath();ctx.ellipse(b.x,b.y+2,b.r*s,b.r*.4*s,0,0,TAU);ctx.fill();ctx.restore();}
 for(const d of a.devils){const f=Math.min(1,d.age/1)*Math.min(1,(d.life-d.age)/1.2);ctx.save();ctx.translate(d.x,d.y);ctx.scale(1,.5);ctx.rotate(-a.t*6);ctx.strokeStyle='#b89868';ctx.lineCap='round';for(let i=0;i<3;i++){ctx.globalAlpha=f*(.45-i*.1);ctx.lineWidth=3-i*.6;ctx.beginPath();ctx.arc(0,0,d.r*(1+i*.45),i*2,i*2+2.4);ctx.stroke();}ctx.restore();}
}
export function drawAmbienceUpper(ctx,a){
 // Dust devils: stacked spinning sand bands narrowing toward the ground, translucent.
 for(const d of a.devils){const f=Math.min(1,d.age/1)*Math.min(1,(d.life-d.age)/1.2);if(f<=0)continue;ctx.save();ctx.lineCap='round';
  for(let i=0;i<9;i++){const q=i/8,y=d.y-4-q*d.h,rw=d.r*(.35+q*q*1.4),sway=Math.sin(a.t*1.7+q*3+d.seed)*8*q,rot=-a.t*(7-q*3)+i;ctx.globalAlpha=f*(.42-q*.22);ctx.strokeStyle=i%2?'#e6d2a4':'#b89868';ctx.lineWidth=3.2-q*1.4;ctx.beginPath();ctx.ellipse(d.x+sway,y,rw,rw*.32,0,rot,rot+2.3);ctx.stroke();}
  const g=ctx.createLinearGradient(d.x,d.y,d.x,d.y-d.h);g.addColorStop(0,'#c9a46a44');g.addColorStop(1,'#c9a46a00');ctx.globalAlpha=f;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(d.x-d.r*.4,d.y-2);ctx.quadraticCurveTo(d.x-d.r*.6,d.y-d.h*.5,d.x-d.r*1.7,d.y-d.h);ctx.lineTo(d.x+d.r*1.7,d.y-d.h);ctx.quadraticCurveTo(d.x+d.r*.6,d.y-d.h*.5,d.x+d.r*.4,d.y-2);ctx.closePath();ctx.fill();ctx.restore();}
 // Dust balls: rolling clumps of dry scrub, drawn as rotating tangled arcs.
 for(const b of a.balls){const r=rng(b.seed),y=b.y-b.r-b.z;ctx.save();ctx.translate(b.x,y);ctx.rotate(b.spin);ctx.globalAlpha=.85;ctx.fillStyle='#8a6a42aa';ctx.beginPath();ctx.arc(0,0,b.r*.75,0,TAU);ctx.fill();ctx.strokeStyle='#5a4028';ctx.lineWidth=1.3;for(let i=0;i<9;i++){const a0=r()*TAU,rr=b.r*(.4+.6*r());ctx.beginPath();ctx.arc((r()-.5)*b.r*.4,(r()-.5)*b.r*.4,rr,a0,a0+1.5+r()*2);ctx.stroke();}ctx.strokeStyle='#b89868';ctx.lineWidth=1;for(let i=0;i<4;i++){const a0=r()*TAU;ctx.beginPath();ctx.arc(0,0,b.r*(.6+.4*r()),a0,a0+1.2);ctx.stroke();}ctx.restore();}
 // Gust streaks: thin sand lines with fading tails, strongest mid-gust.
 for(const g of a.gusts){const f=Math.sin(Math.PI*Math.min(1,g.age/g.life));ctx.save();ctx.lineCap='round';for(const l of g.lines){const tail=l.len,dx=Math.cos(a.wind.angle),dy=Math.sin(a.wind.angle)*.6,y=l.y-12-((l.x*7)%30);ctx.globalAlpha=f*.45;ctx.strokeStyle=l.c;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(l.x,y);ctx.lineTo(l.x-dx*tail,y-dy*tail);ctx.stroke();}ctx.restore();}
}
