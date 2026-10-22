// Ashen Butcher attack visuals (Oct 16, user: "proper visuals for his attacks"). Visual only; reads boss/hazard/
// projectile state from bosses.js. Shader layers reuse the war.* recipes in an ash-and-ember palette (deep red in
// Bloodrage) plus 'butcher.mark'; the thrown cleavers and the hook chain are drawn on the Canvas.
// Depth pass: ground shadows under thrown/falling cleavers, ground-squashed rings/decals, anticipation (telegraph +
// brand) -> impact (flash, crater, quake cracks, sparks, shake via bossImpact) -> follow-through (dust, embers, scars).
import {vfx} from './vfx-engine.js?v=fx-260';
import {emitFx} from './vfx-recipes.js?v=fx-260';
const TAU=Math.PI*2,sq=a=>Math.atan2(Math.sin(a)/.65,Math.cos(a));
const PAL={main:['#3a0c04','#ff5a1a','#ffc070'],core:['#ff6a1a','#ffd0a0','#ffffff'],spark:['#ff4a10','#ffa050','#fff0c0'],smoke:['#120c0a','#4a3c34','#a08a76'],dark:['#0d0705','#3a1408','#ff5a1a']};
const RAGE={main:['#3a0204','#e8202a','#ffb0a0'],core:['#ff2a2a','#ffb0a0','#ffffff'],spark:['#c01818','#ff5a3a','#ffe0c0'],smoke:['#140606','#4a1a18','#9a5a50'],dark:['#0a0202','#4a0a08','#e8202a']};
// One-shot impacts outlive the special/hazard that caused them, so they're kept here (game time, pause-safe).
const shots=[],seen=new WeakSet();
function once(key,list,time){if(seen.has(key))return;seen.add(key);for(const s of list)shots.push({...s,born:time});if(shots.length>60)shots.splice(0,shots.length-60);}
const isButcher=(c,id)=>c.targets.some(t=>t.id===id&&t.bossKind==='butcher');
export function drawButcherVfx(ctx,{c,time},pass){
 if(!vfx.ok)return false;
 for(const b of c.targets){if(b.bossKind!=='butcher'||b.state!=='alive'||b.sleeping)continue;const pal=b.bloodrage?RAGE:PAL,sp=b.special;
  if(b.bloodrage)emitFx('war.aura',{x:b.x,y:b.y,R:120,age:time,alpha:.95,pal:RAGE,seed:b.id},pass);
  const a=b.swing;if(a){const f=(a.elapsed-a.windup)/.22;if(f>=0&&f<=1)emitFx('war.cone',{x:b.x,y:b.y-70,R:a.reach*1.15,t:f,p:[a.kind==='smash'?1.5:1.15,.11,.85,sq(a.angle)],pal,age:f*.22,seed:b.id},pass);}
  if(!sp)continue;
  if(sp.kind==='crossChop'&&sp.fired)once(sp,[{name:'war.burst',o:{x:b.x,y:b.y,R:80,pal,seed:3}}],time);
  if(sp.kind==='fissures'&&sp.front>0)once(sp,[{name:'war.swingSpark',o:{x:b.x,y:b.y-10,R:50,pal,seed:5},dur:.5}],time);  // Ash Fissures are drawn as racing hook-chains (Canvas)
  if(sp.kind==='boomerang'&&sp.fired)once(sp,[{name:'war.burst',o:{x:b.x,y:b.y,R:70,pal,seed:6}}],time);
  if(sp.kind==='storm'&&sp.fired){const k=sp.elapsed-sp.windup;for(const off of [0,Math.PI])emitFx('war.spin',{x:b.x,y:b.y-55,R:150,t:.55,p:[1.3,.07,.85,sp.theta*1.6+off],age:k,pal,seed:13},pass);}
  if(sp.kind==='hook'&&sp.chopped)once(sp,[{name:'war.slam',o:{x:b.x+Math.cos(sp.angle)*75,y:b.y+Math.sin(sp.angle)*49,R:95,pal,seed:8},delay:.25}],time);
 }
 for(const h of c.hazards??[]){
  if(h.mark){const k=Math.min(1,h.age/h.warning),locked=h.age>=h.lockAt;
   if(h.age<h.warning)emitFx('butcher.mark',{x:h.x,y:h.y,R:h.radius,age:time*(locked?2.4:1),alpha:.55+.45*k,pal:locked?RAGE:PAL,seed:9},pass);
   else once(h,[{name:'pyro.explosion',o:{x:h.x,y:h.y,R:h.radius,seed:12},dur:1.6},{name:'war.quake',o:{x:h.x,y:h.y,R:h.radius*1.4,pal:PAL,seed:14}},{name:'war.motes',o:{x:h.x,y:h.y-20,R:70,pal:PAL,seed:15}}],time);}  // ground eruption (user: no falling cleaver)
  else if(h.kind==='fire'&&h.age>=h.warning&&isButcher(c,h.owner))emitFx('war.motes',{x:h.x,y:h.y-10,R:36,age:(time+h.x*.013)%1.1,pal:PAL,seed:(h.x|0)&255},pass);
 }
 for(const q of c.enemyProjectiles??[])if(q.big&&!q.frag)emitFx('war.axe',{x:q.x,y:q.y+12,R:30,angle:Math.atan2(q.dy,q.dx),age:time,pal:PAL,seed:17},pass);
 for(let i=shots.length-1;i>=0;i--){const s=shots[i],age=time-s.born-(s.delay??0);if(age>(s.dur??1.3)){shots.splice(i,1);continue;}if(age>=0)emitFx(s.name,{...s.o,age},pass);}
 vfx.flush(ctx,pass);return true;
}
// ---- Canvas pieces: spinning cleavers, hook chain, the Mark's falling giant cleaver ----
function cleaver(ctx,x,y,size,rot,alpha=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(size,size);ctx.globalAlpha*=alpha;
 ctx.fillStyle='#3a2a20';ctx.fillRect(-26,-3,16,6);                                   // handle
 ctx.fillStyle='#48423f';ctx.beginPath();ctx.moveTo(-12,-14);ctx.lineTo(22,-14);ctx.lineTo(24,14);ctx.lineTo(-10,15);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#c2b59c';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(22,-14);ctx.lineTo(24,14);ctx.lineTo(-10,15);ctx.stroke();  // pale bevelled edge
 ctx.fillStyle='#5a5450';ctx.beginPath();ctx.arc(-4,-5,2.4,0,TAU);ctx.arc(-4,4,2.4,0,TAU);ctx.fill();
 ctx.strokeStyle='#1e1410';ctx.lineWidth=1.4;ctx.strokeRect(-12,-14,34,29);ctx.restore();
}
function chain(ctx,hx,hy,tx,ty,ang,sag,scale,hot=false){const d=Math.hypot(tx-hx,ty-hy),n=Math.max(2,Math.floor(d/(13*scale)));
 ctx.save();shadow(ctx,tx,ty+(hot?6:30),12*scale,.3);ctx.lineCap='round';
 if(hot){ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,110,30,.35)';ctx.lineWidth=10*scale;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();ctx.globalCompositeOperation='source-over';}
 for(let i=0;i<n;i++){const u=(i+.5)/n,x=hx+(tx-hx)*u,y=hy+(ty-hy)*u+Math.sin(u*Math.PI)*sag;ctx.strokeStyle=hot?(i%2?'#ff8a3a':'#7a3a20'):(i%2?'#5a5450':'#3a3532');ctx.lineWidth=(i%2?3:5)*scale;ctx.beginPath();ctx.ellipse(x,y,5*scale,3*scale,ang+(i%2?Math.PI/2:0),0,TAU);ctx.stroke();}
 ctx.translate(tx,ty);ctx.rotate(ang);ctx.scale(scale,scale);ctx.strokeStyle='#2a2422';ctx.lineWidth=6;ctx.beginPath();ctx.arc(6,0,12,-Math.PI*.8,Math.PI*.55);ctx.stroke();ctx.strokeStyle=hot?'#ffb060':'#c2b59c';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(6,0,12,-Math.PI*.8,Math.PI*.55);ctx.stroke();
 ctx.fillStyle=hot?'#ffb060':'#c2b59c';ctx.beginPath();ctx.moveTo(16,-8);ctx.lineTo(24,-15);ctx.lineTo(19,-4);ctx.fill();ctx.restore();}
function shadow(ctx,x,y,rx,a){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y,rx,rx*.42,0,0,TAU);ctx.fill();ctx.restore();}
export function drawButcherCanvas(ctx,c,time){
 for(const q of c.enemyProjectiles??[])if(q.big&&!q.frag){const H=38;shadow(ctx,q.x,q.y,22,.3);cleaver(ctx,q.x,q.y-H,1.25,q.age*17*(q.turn<0?-1:1)+q.x*.01);}
 for(const b of c.targets){if(b.bossKind!=='butcher'||b.state!=='alive')continue;const sp=b.special;
  if(sp?.kind==='hook'&&sp.fired&&sp.reach>4&&!sp.chopped)chain(ctx,b.x+Math.cos(sp.angle)*28,b.y-78+Math.sin(sp.angle)*18,b.x+Math.cos(sp.angle)*sp.reach,b.y+Math.sin(sp.angle)*sp.reach-30,sp.angle,8,1);
  // Ash Fissures (user): hook-chains race out along each crack, glowing hot, then snap back.
  if(sp?.kind==='fissures'&&sp.front>0){const tFull=.55+520/600,back=sp.front>=520?Math.max(0,1-(sp.elapsed-tFull)/.3):1,L=sp.front*back;
   if(L>4)for(const l of sp.lanes)chain(ctx,l.x+Math.cos(l.angle)*30,l.y+Math.sin(l.angle)*20-18,l.x+Math.cos(l.angle)*L,l.y+Math.sin(l.angle)*L-6,l.angle,2,.85,true);}}
}
