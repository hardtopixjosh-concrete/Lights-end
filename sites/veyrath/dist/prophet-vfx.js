// Hollow Prophet attack visuals (Oct 16 "Soul Caster" rework). Visual only; reads boss/clone/hazard state from
// bosses.js. Spectral violet palette over the war.* recipes; Canvas draws the scythes, cage pillars/beams, echo
// numbers, the chest crystal (lit only on the real caster during False Apparitions) and the Repulse cone.
// Depth: ground shadows under scythes, squashed ground rings/decals, tell -> impact -> lingering motes.
import {vfx} from './vfx-engine.js?v=fx-260';
import {emitFx} from './vfx-recipes.js?v=fx-260';
import {LANCE} from './bosses.js?v=fx-260';
const TAU=Math.PI*2;
const PAL={main:['#1a0a3a','#9b6cff','#e8dcff'],core:['#a07aff','#efe6ff','#ffffff'],spark:['#7a4cff','#c8b0ff','#ffffff'],smoke:['#0c0818','#2e2450','#8a7ab0'],dark:['#06030f','#2a1458','#9b6cff']};
const shots=[],seen=new WeakSet();
function once(key,list,time){if(seen.has(key))return;seen.add(key);for(const s of list)shots.push({...s,born:time});if(shots.length>60)shots.splice(0,shots.length-60);}
const owner=(c,id)=>c.targets.find(t=>t.id===id&&t.bossKind==='prophet');
export function drawProphetVfx(ctx,{c,time},pass){
 if(!vfx.ok)return false;
 for(const b of c.targets){if(b.bossKind!=='prophet'||b.state!=='alive'||b.sleeping)continue;const sp=b.special;
  for(const q of b.scythes??[])if(q.t>.38&&!q.done)emitFx('war.axe',{x:q.x,y:q.y+14,R:30,angle:q.ang??0,age:time,pal:PAL,seed:41},pass);
  if(!sp||b.role!=='boss')continue;
  if(sp.kind==='cage'){const g=sp.cage;if(g.closed)once(g,[{name:'war.burst',o:{x:g.x,y:g.y,R:g.R,pal:PAL,seed:43}},{name:'war.quake',o:{x:g.x,y:g.y,R:g.R,pal:PAL,seed:44}}],time);}
  if(sp.kind==='repulse'&&sp.fired)once(sp,[{name:'war.cry',o:{x:b.x,y:b.y,R:300,pal:PAL,seed:45}},{name:'war.burst',o:{x:b.x,y:b.y,R:120,pal:PAL,seed:46}}],time);
  if(sp.kind==='apparitions'&&sp.shot)once(sp,[{name:'war.burst',o:{x:b.x,y:b.y,R:60,pal:PAL,seed:47}}],time);
 }
 for(const tp of c.teleportFx??[])once(tp,[{name:'war.burst',o:{x:tp.x,y:tp.y,R:70,pal:PAL,seed:48},dur:.8}],time);
 if((c.teleportFx?.length??0)>8)c.teleportFx.splice(0,c.teleportFx.length-8);
 for(const h of c.hazards??[])if(h.echo&&owner(c,h.owner)){if(h.age<h.warning)emitFx('butcher.mark',{x:h.x,y:h.y,R:h.radius,age:time,alpha:.6+.4*h.age/h.warning,pal:PAL,seed:h.echo},pass);else once(h,[{name:'war.burst',o:{x:h.x,y:h.y,R:h.radius,pal:PAL,seed:50+h.echo}}],time);}
 for(let i=shots.length-1;i>=0;i--){const s=shots[i],age=time-s.born;if(age>(s.dur??1.2)){shots.splice(i,1);continue;}emitFx(s.name,{...s.o,age},pass);}
 vfx.flush(ctx,pass);return true;
}
function shadow(ctx,x,y,rx,a){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y,rx,rx*.42,0,0,TAU);ctx.fill();ctx.restore();}
function glow(ctx,x,y,r,col,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(155,108,255,0)');ctx.save();ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
function scythe(ctx,x,y,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalCompositeOperation='lighter';
 for(const [w,col,a] of [[16,'#5a2fe0',.35],[7,'#b89aff',.8],[2.5,'#ffffff',.95]]){ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,26,-Math.PI*.95,Math.PI*.15);ctx.stroke();}
 ctx.restore();}
export function drawProphetCanvas(ctx,c,time){
 for(const t of c.targets){if(t.bossKind!=='prophet'||t.state!=='alive'||t.sleeping)continue;
  for(const q of t.scythes??[])if(q.t>.38&&!q.done){shadow(ctx,q.x,q.y,20,.25);scythe(ctx,q.x,q.y-40,time*22*q.side);}
  // chest crystal: dim on every Prophet body, blazing only on the real caster during False Apparitions
  const cx=t.x,cy=t.y-43*t.scale,/* Oct 17: chest gem on the HD model */lit=t.crystal?1:0,pulse=lit?.8+.2*Math.sin(time*18):.35;
  if(lit)glow(ctx,cx,cy,46,'rgba(214,190,255,.95)',pulse);
  ctx.save();ctx.translate(cx,cy);ctx.fillStyle=lit?'#f2eaff':'#6a54a0';ctx.strokeStyle=lit?'#ffffff':'#2a1d48';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,0);ctx.lineTo(0,9);ctx.lineTo(-6,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  const sp=t.role==='boss'?t.special:null;if(!sp)continue;
  if(sp.kind==='cage'){const g=sp.cage,k=sp.elapsed,n=g.pillars.length,rise=Math.min(1,k/.38);
   if(k>=.45&&!g.closed){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<n;i++){if(i===g.gap)continue;const a=g.pillars[i],b=g.pillars[(i+1)%n];for(const [w,col,al] of [[14,'#5a2fe0',.35],[5,'#c8b0ff',.85],[1.5,'#ffffff',.9]]){ctx.globalAlpha=al*(.8+.2*Math.sin(time*25+i));ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a.x,a.y-18);ctx.lineTo(b.x,b.y-18);ctx.stroke();}}ctx.restore();
    // the opening: a soft green glow between the two gap pillars so the exit reads at a glance
    const a=g.pillars[g.gap],b=g.pillars[(g.gap+1)%n];glow(ctx,(a.x+b.x)/2,(a.y+b.y)/2,60,'rgba(140,255,170,.55)',.5+.3*Math.sin(time*10));}
   g.pillars.forEach((q,i)=>{const exit=i===g.gap||i===(g.gap+1)%n;shadow(ctx,q.x,q.y,14,.3);const H=70*rise;ctx.save();ctx.fillStyle=exit?'#0f4a24':'#2a1458';ctx.strokeStyle=exit?'#9dffc0':'#c8b0ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x-9,q.y);ctx.lineTo(q.x-6,q.y-H);ctx.lineTo(q.x,q.y-H-14*rise);ctx.lineTo(q.x+6,q.y-H);ctx.lineTo(q.x+9,q.y);ctx.closePath();ctx.globalAlpha=.85;ctx.fill();ctx.stroke();ctx.restore();glow(ctx,q.x,q.y-H*.6,exit?32:26,exit?'rgba(120,255,160,.9)':'rgba(180,150,255,.8)',exit?.8:.6);});}  // exit pillars green (user)
  if(sp.kind==='lances')for(const q of sp.pending??[]){if(!q.fired)continue;const fade=q.front>=LANCE.reach?Math.max(0,1-(sp.elapsed-q.at-LANCE.reach/LANCE.speed)/.25):1;if(fade<=0)continue;
   ctx.save();ctx.globalCompositeOperation='lighter';for(const l of q.ls){const ex=Math.cos(l.angle)*q.front,ey=Math.sin(l.angle)*q.front;
    for(const [w,col,al] of [[l.width*1.4,'#5a2fe0',.35],[l.width*.55,'#c8b0ff',.85],[3,'#ffffff',1]]){ctx.globalAlpha=al*fade;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(q.cx-ex,q.cy-ey-20);ctx.lineTo(q.cx+ex,q.cy+ey-20);ctx.stroke();}
    if(q.front<LANCE.reach)for(const sgn of [1,-1])glow(ctx,q.cx+ex*sgn,q.cy+ey*sgn-20,22,'rgba(230,215,255,.95)',fade);}
   ctx.restore();glow(ctx,q.cx,q.cy-20,40,'rgba(200,170,255,.9)',.7*fade);}
  if(sp.kind==='repulse'&&!sp.fired){const k=Math.min(1,sp.elapsed/sp.windup),R=300,half=Math.PI*13/18;ctx.save();ctx.translate(t.x,t.y);ctx.scale(1,.65);
   ctx.globalAlpha=.18+.22*k;ctx.fillStyle='#b04aff';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,sp.angle-half,sp.angle+half);ctx.closePath();ctx.fill();
   ctx.globalAlpha=.35+.45*k;ctx.fillStyle='#e8c0ff';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R*k,sp.angle-half,sp.angle+half);ctx.closePath();ctx.fill();
   ctx.globalAlpha=.9;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,R,sp.angle-half,sp.angle+half);ctx.stroke();ctx.restore();}}
 // Delayed Echo (Oct 17, user: "bigger... not very cool looking"): a big glowing numeral hangs over each mark, a column
 // of soul light gathers from the sky over the last moments and slams down on detonation.
 for(const h of c.hazards??[]){if(!h.echo||!owner(c,h.owner))continue;const k=Math.min(1,h.age/h.warning),life=h.age-h.warning;
  if(h.age<h.warning){const late=Math.max(0,(k-.55)/.45),H=420;
   ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(h.x,h.y-H,h.x,h.y);g.addColorStop(0,'rgba(155,108,255,0)');g.addColorStop(.7,`rgba(180,140,255,${.22*late})`);g.addColorStop(1,`rgba(240,230,255,${.55*late})`);
   ctx.fillStyle=g;const w=h.radius*(.18+.5*late);ctx.beginPath();ctx.moveTo(h.x-w*.4,h.y-H);ctx.lineTo(h.x+w*.4,h.y-H);ctx.lineTo(h.x+w,h.y);ctx.lineTo(h.x-w,h.y);ctx.closePath();ctx.fill();ctx.restore();
   const bob=Math.sin(h.age*5+h.echo)*5,ny=h.y-70-26*k+bob,sc=1+.25*k;glow(ctx,h.x,ny,60*sc,'rgba(200,170,255,.9)',.55+.35*k);
   ctx.save();ctx.translate(h.x,ny);ctx.scale(sc,sc);ctx.font='900 48px Cinzel, Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=9;ctx.strokeStyle='#160a30';ctx.strokeText(String(h.echo),0,0);
   ctx.shadowColor='#b48cff';ctx.shadowBlur=18;ctx.fillStyle='#f2eaff';ctx.fillText(String(h.echo),0,0);ctx.shadowBlur=0;ctx.lineWidth=2;ctx.strokeStyle='#ffffff';ctx.strokeText(String(h.echo),0,0);ctx.restore();}
  else if(life<.45){const f=1-life/.45,H=520;ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(h.x,h.y-H,h.x,h.y);g.addColorStop(0,'rgba(155,108,255,0)');g.addColorStop(.6,`rgba(200,170,255,${.6*f})`);g.addColorStop(1,`rgba(255,255,255,${.95*f})`);
   ctx.fillStyle=g;const w=h.radius*.55*(1+.4*(1-f));ctx.fillRect(h.x-w,h.y-H,w*2,H);ctx.restore();glow(ctx,h.x,h.y,h.radius*1.4,'rgba(230,215,255,.95)',f);}}
}

// Ground pass: the Delayed Echo sigil (rotating rune rings + inner star, fills as the countdown runs out).
export function drawProphetGround(ctx,c,time){
 // Soul Mire (Oct 17): violet pool left by each Delayed Echo; slows your attacks while you stand in it.
 for(const h of c.hazards??[]){if(h.kind!=='soulmire')continue;const f=Math.min(1,h.age/.25)*Math.min(1,(h.duration-h.age)/.6),R=h.radius;if(f<=0)continue;
  ctx.save();ctx.translate(h.x,h.y);ctx.scale(1,.65);const g=ctx.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,`rgba(40,16,80,${.55*f})`);g.addColorStop(.7,`rgba(70,36,140,${.4*f})`);g.addColorStop(1,'rgba(90,47,224,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='lighter';ctx.lineCap='round';for(let i=0;i<4;i++){const r0=R*(.25+i*.17),a0=time*(i%2?-1.2:.9)+i*1.7;ctx.strokeStyle=i%2?'#9b6cff':'#c8b0ff';ctx.globalAlpha=.45*f;ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,r0,a0,a0+2.6);ctx.stroke();}
  ctx.globalAlpha=.5*f;ctx.strokeStyle='#e8dcff';ctx.lineWidth=1.5;ctx.setLineDash([6,8]);ctx.lineDashOffset=-time*20;ctx.beginPath();ctx.arc(0,0,R*.97,0,TAU);ctx.stroke();ctx.restore();}
 for(const h of c.hazards??[]){if(!h.echo||h.age>=h.warning||!owner(c,h.owner))continue;const k=Math.min(1,h.age/h.warning),R=h.radius;
  ctx.save();ctx.translate(h.x,h.y);ctx.scale(1,.65);
  const g=ctx.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,`rgba(120,80,220,${.12+.3*k})`);g.addColorStop(.75,`rgba(90,47,224,${.08+.2*k})`);g.addColorStop(1,'rgba(90,47,224,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='lighter';
  for(const [r,w,col,dir,ticks] of [[R,3,'#c8b0ff',1,24],[R*.82,2,'#9b6cff',-1,12]]){ctx.save();ctx.rotate(time*.9*dir+h.echo);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.globalAlpha=.6+.4*k;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
   for(let i=0;i<ticks;i++){const a=i/ticks*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r-(i%3?6:13)),Math.sin(a)*(r-(i%3?6:13)));ctx.stroke();}ctx.restore();}
  ctx.save();ctx.rotate(-time*1.4);ctx.strokeStyle='#e8dcff';ctx.lineWidth=2;ctx.globalAlpha=.5+.5*k;ctx.beginPath();for(let i=0;i<=5;i++){const a=i*2/5*TAU-Math.PI/2;const x=Math.cos(a)*R*.62,y=Math.sin(a)*R*.62;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.restore();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(0,0,R*.96,-Math.PI/2,-Math.PI/2+TAU*k);ctx.stroke();   // countdown sweep
  ctx.restore();}
}
