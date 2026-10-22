// Oct 17: Obsidian Colossus + Dune Wyrm attack visuals (user: "super crisp... particles and vfx"). Visual only; reads
// boss/hazard/projectile state from titans.js. Canvas draws the telegraphs (tracking vs locked target circles, ring
// gap markers, cracks, quicksand, sand trail) on the ground pass and the things with height (boulders, eruption spikes,
// sand breath, spit globs, armour plates, core glow) on the upper pass; shader one-shots reuse the war.* recipes in an
// obsidian-ember palette (Colossus) and a sandstone palette (Wyrm).
// Depth checklist: shadows under everything airborne, squashed ground ellipses, tell -> impact -> lingering dust/motes.
import {vfx} from './vfx-engine.js?v=fx-260';
import {emitFx} from './vfx-recipes.js?v=fx-260';
import {mouthOf,WY,COL} from './titans.js?v=fx-260';
const TAU=Math.PI*2,clamp01=v=>Math.max(0,Math.min(1,v));
const EMBER={main:['#2a0c02','#ff6a1a','#ffd0a0'],core:['#ff7a1a','#ffd8a0','#ffffff'],spark:['#ff5a10','#ffa050','#fff0c0'],smoke:['#0c0a0a','#2e2a2a','#6a625a'],dark:['#050404','#1e1a1a','#ff5a1a']};
const SAND={main:['#3a2410','#c9a06a','#f4e0b8'],core:['#d8b07a','#f8e8c8','#ffffff'],spark:['#a07a48','#e0c090','#fff4d8'],smoke:['#2a1e12','#7a6040','#d8c098'],dark:['#1a1008','#4a3420','#c9a06a']};
const shots=[],seen=new WeakSet();
function once(key,list,time){if(seen.has(key))return;seen.add(key);for(const s of list)shots.push({...s,born:time});if(shots.length>80)shots.splice(0,shots.length-80);}
const rnd=n=>{const x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x);};
function owners(c){const m=new Map();for(const t of c.targets)if((t.bossKind==='colossus'||t.bossKind==='wyrm')&&t.role==='boss')m.set(t.id,t);return m;}

// ---------------- shader layer ----------------
export function drawTitanVfx(ctx,{c,time},pass){
 if(!vfx.ok)return false;const own=owners(c);
 for(const b of own.values()){if(b.state!=='alive'||b.sleeping)continue;const sp=b.special,col=b.bossKind==='colossus';
  if(col&&sp?.kind==='overload'){const k=clamp01(sp.elapsed/sp.charge);if(!sp.fired)emitFx('war.aura',{x:b.x,y:b.y,R:90+80*k,age:time,alpha:.35+.6*k,pal:EMBER,seed:b.id},pass);
   else{once(sp,[{name:'war.cry',o:{x:b.x,y:b.y,R:sp.h.radius,pal:EMBER,seed:61}},{name:'war.burst',o:{x:b.x,y:b.y,R:150,pal:EMBER,seed:62}},{name:'war.quake',o:{x:b.x,y:b.y,R:sp.h.radius*1.15,pal:EMBER,seed:63},dur:1.6}],time);
    if(b.exposed>0)emitFx('war.motes',{x:b.x,y:b.y-30*b.scale,R:60,age:time%1.1,pal:EMBER,seed:64},pass);}}
  if(col&&sp?.kind==='shed'){const k=clamp01(sp.elapsed/1.3);if(!sp.fired)emitFx('war.aura',{x:b.x,y:b.y,R:80+70*k,age:time,alpha:.3+.7*k,pal:EMBER,seed:b.id+7},pass);
   else once(sp,[{name:'war.burst',o:{x:b.x,y:b.y-20,R:220,pal:EMBER,seed:65}},{name:'war.cry',o:{x:b.x,y:b.y,R:300,pal:EMBER,seed:66},delay:.45},{name:'war.quake',o:{x:b.x,y:b.y,R:260,pal:EMBER,seed:67},dur:1.6}],time);}
  if(col&&sp?.kind==='pursuit'&&sp.st==='lodge')once(sp.h,[{name:'war.motes',o:{x:b.x,y:b.y-10,R:110,pal:EMBER,seed:68},dur:1.4}],time);
  if(!col&&sp?.kind==='shed'&&sp.popped)once(sp,[{name:'war.burst',o:{x:b.x,y:b.y-30,R:170,pal:SAND,seed:71}},{name:'war.quake',o:{x:b.x,y:b.y,R:200,pal:SAND,seed:72},dur:1.5}],time);
  if(!col&&sp?.kind==='breath'&&sp.on){const a=sp.beam,m=mouthOf(b);for(let i=0;i<3;i++){const r=90+i*100;emitFx('war.motes',{x:m.x+Math.cos(a)*r,y:m.y+Math.sin(a)*r*.65-20,R:40+i*14,age:(time*1.3+i*.37)%1.1,pal:SAND,seed:73+i},pass);}}
  if(!col&&sp?.kind==='charge'&&sp.done)once(sp,[{name:'war.quake',o:{x:b.x,y:b.y,R:150,pal:SAND,seed:74}},{name:'war.burst',o:{x:b.x,y:b.y,R:90,pal:SAND,seed:75}}],time);
  if(!col&&sp?.kind==='claws')for(const q of sp.arcs??[])if(q.done)once(q,[{name:'war.swingSpark',o:{x:q.x+Math.cos(q.angle)*q.r*.6,y:q.y+Math.sin(q.angle)*q.r*.4-20,R:60,pal:SAND,seed:76},dur:.5}],time);
 }
 for(const h of c.hazards??[]){const b=own.get(h.owner);if(!b||h.age<h.warning)continue;const pal=b.bossKind==='colossus'?EMBER:SAND;
  if(h.punch)once(h,h.final?[{name:'war.slam',o:{x:h.x,y:h.y,R:h.radius,pal,seed:81}},{name:'war.burst',o:{x:h.x,y:h.y,R:h.radius*.8,pal,seed:82}},{name:'war.quake',o:{x:h.x,y:h.y,R:h.radius*1.5,pal,seed:83},dur:1.6}]
   :[{name:'war.slam',o:{x:h.x,y:h.y,R:h.radius*.85,pal,seed:84}},{name:'war.quake',o:{x:h.x,y:h.y,R:h.radius*1.2,pal,seed:85}}],time);
  else if(h.hurl)once(h,[{name:'war.burst',o:{x:h.x,y:h.y,R:h.radius*.8,pal,seed:86}},{name:'war.quake',o:{x:h.x,y:h.y,R:h.radius*1.3,pal,seed:87}},{name:'war.motes',o:{x:h.x,y:h.y-15,R:h.radius*.6,pal:SAND,seed:88},dur:1.3}],time);
  else if(h.burrow)once(h,[{name:'war.burst',o:{x:h.x,y:h.y-10,R:h.radius,pal,seed:89}},{name:'war.quake',o:{x:h.x,y:h.y,R:h.radius*1.4,pal,seed:90},dur:1.5},{name:'war.motes',o:{x:h.x,y:h.y-20,R:h.radius*.7,pal,seed:91},dur:1.4}],time);
  else if(h.tail)once(h,[{name:'war.cry',o:{x:h.x,y:h.y,R:h.radius*1.2,pal,seed:92}},{name:'war.quake',o:{x:h.x,y:h.y,R:h.radius,pal,seed:93}}],time);
  else if(h.fault&&h.front>0&&h.front<h.len){emitFx('war.motes',{x:h.x+Math.cos(h.angle)*h.front,y:h.y+Math.sin(h.angle)*h.front-12,R:46,age:(time*2)%1.1,pal,seed:94},pass);once(h,[{name:'war.swingSpark',o:{x:h.x+Math.cos(h.angle)*40,y:h.y+Math.sin(h.angle)*26,R:70,pal,seed:95},dur:.5}],time);}
  else if(h.kind==='ring'&&h.stomp)once(h,[{name:'war.quake',o:{x:h.x,y:h.y,R:170,pal,seed:96}}],time);
  else if(h.kind==='quicksand')once(h,[{name:'war.burst',o:{x:h.x,y:h.y,R:h.radius*.6,pal:SAND,seed:97}}],time);}
 for(let i=shots.length-1;i>=0;i--){const s=shots[i],age=time-s.born-(s.delay??0);if(age>(s.dur??1.3)){shots.splice(i,1);continue;}if(age>=0)emitFx(s.name,{...s.o,age},pass);}
 vfx.flush(ctx,pass);return true;
}

// ---------------- Canvas helpers ----------------
function shadow(ctx,x,y,rx,a){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y,rx,rx*.42,0,0,TAU);ctx.fill();ctx.restore();}
function glow(ctx,x,y,r,inner,a,outer='rgba(0,0,0,0)'){if(a<=0||r<=0)return;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,outer);ctx.save();ctx.globalAlpha=Math.min(1,a);ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
function ring(ctx,x,y,r,col,w,a,dash=null,rot=0){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;if(dash){ctx.setLineDash(dash);ctx.lineDashOffset=rot;}ctx.beginPath();ctx.ellipse(x,y,r,r*.65,0,0,TAU);ctx.stroke();ctx.restore();}
function disc(ctx,x,y,r,col,a){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,r,r*.65,0,0,TAU);ctx.fill();ctx.restore();}
// Faceted obsidian/sandstone rock (also used for boulders and plates).
function rock(ctx,x,y,r,rot,seed,{fill='#262222',edge='#55505a',hot=null}={}){ctx.save();ctx.translate(x,y);ctx.rotate(rot);const n=7,pts=[];for(let i=0;i<n;i++){const a=i/n*TAU,rr=r*(.78+.3*rnd(seed+i));pts.push([Math.cos(a)*rr,Math.sin(a)*rr]);}
 ctx.fillStyle=fill;ctx.beginPath();pts.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.10)';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(pts[4][0],pts[4][1]);ctx.lineTo(pts[5][0],pts[5][1]);ctx.lineTo(pts[6][0],pts[6][1]);ctx.closePath();ctx.fill();  // lit facet
 ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(pts[1][0],pts[1][1]);ctx.lineTo(pts[2][0],pts[2][1]);ctx.lineTo(pts[3][0],pts[3][1]);ctx.closePath();ctx.fill();   // shade facet
 ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.beginPath();pts.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.stroke();
 if(hot){ctx.strokeStyle=hot;ctx.lineWidth=2;ctx.globalCompositeOperation='lighter';ctx.beginPath();ctx.moveTo(pts[0][0]*.2,pts[0][1]*.2);ctx.lineTo(pts[3][0]*.6,pts[3][1]*.6);ctx.stroke();}
 ctx.restore();}
// Armour plate: dark slab with the blue-grey bevel from the concept sheet.
function plate(ctx,x,y,s,rot,a=1){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha*=a;ctx.fillStyle='#2b2b30';ctx.beginPath();ctx.moveTo(-14*s,-9*s);ctx.lineTo(12*s,-11*s);ctx.lineTo(16*s,6*s);ctx.lineTo(-10*s,11*s);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#6c7088';ctx.lineWidth=3*s;ctx.stroke();ctx.strokeStyle='#ff7a2a';ctx.lineWidth=1.4*s;ctx.globalCompositeOperation='lighter';ctx.beginPath();ctx.moveTo(-10*s,11*s);ctx.lineTo(16*s,6*s);ctx.stroke();ctx.restore();}
function sandPlate(ctx,x,y,s,rot,a=1){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha*=a;ctx.fillStyle='#d2a86e';ctx.beginPath();ctx.moveTo(-15*s,0);ctx.lineTo(-4*s,-11*s);ctx.lineTo(13*s,-6*s);ctx.lineTo(15*s,5*s);ctx.lineTo(0,10*s);ctx.closePath();ctx.fill();
 ctx.fillStyle='#e8c690';ctx.beginPath();ctx.moveTo(-4*s,-11*s);ctx.lineTo(13*s,-6*s);ctx.lineTo(2*s,-1*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#8a6038';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.moveTo(-15*s,0);ctx.lineTo(-4*s,-11*s);ctx.lineTo(13*s,-6*s);ctx.lineTo(15*s,5*s);ctx.lineTo(0,10*s);ctx.closePath();ctx.stroke();ctx.restore();}
function cracks(ctx,x,y,r,seed,k,col,w){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';for(let i=0;i<7;i++){let a=rnd(seed+i)*TAU,px=x,py=y;ctx.beginPath();ctx.moveTo(px,py);const L=r*k*(.6+.4*rnd(seed+i+20));for(let s=1;s<=4;s++){a+=(rnd(seed+i*4+s)-.5)*.9;px=x+Math.cos(a)*L*s/4;py=y+Math.sin(a)*L*s/4*.65;ctx.lineTo(px,py);}ctx.stroke();}ctx.restore();}
function arrowArc(ctx,x,y,r,a0,a1,col,w,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.translate(x,y);ctx.scale(1,.65);ctx.beginPath();ctx.arc(0,0,r,Math.min(a0,a1),Math.max(a0,a1));ctx.stroke();
 const e=a1,dir=Math.sign(a1-a0)||1,hx=Math.cos(e)*r,hy=Math.sin(e)*r,tx=-Math.sin(e)*dir,ty=Math.cos(e)*dir;ctx.beginPath();ctx.moveTo(hx+tx*16,hy+ty*16);ctx.lineTo(hx-tx*2+Math.cos(e)*10,hy-ty*2+Math.sin(e)*10);ctx.lineTo(hx-tx*2-Math.cos(e)*10,hy-ty*2-Math.sin(e)*10);ctx.closePath();ctx.fill();ctx.restore();}
// Gap marker for upcoming shock rings: dashed path + bright green gate where the safe gap will be.
/* Oct 19: marks every gap (the Colossus stomp now has 3) */function gapMarker(ctx,h,time,col){const k=clamp01(h.age/Math.max(.01,h.warning)),R=230,gs=[...h.gaps].sort((x,y)=>x-y),hw=h.gapHalf;
 ctx.save();ctx.translate(h.x,h.y);ctx.scale(1,.65);ctx.globalAlpha=.25+.45*k;ctx.strokeStyle=col;ctx.lineWidth=5;ctx.setLineDash([14,10]);ctx.lineDashOffset=-time*60;gs.forEach((g,i)=>{const nx=gs[i+1]??gs[0]+TAU;ctx.beginPath();ctx.arc(0,0,R,g+hw,nx-hw);ctx.stroke();});ctx.setLineDash([]);
 ctx.globalAlpha=.6+.4*Math.sin(time*14);ctx.strokeStyle='#9dffc0';ctx.lineWidth=7;for(const g of gs)for(const e of [g-hw,g+hw]){ctx.beginPath();ctx.moveTo(Math.cos(e)*(R-30),Math.sin(e)*(R-30));ctx.lineTo(Math.cos(e)*(R+40),Math.sin(e)*(R+40));ctx.stroke();}ctx.restore();
 for(const g of gs)glow(ctx,h.x+Math.cos(g)*R,h.y+Math.sin(g)*R*.65,70,'rgba(120,255,160,.75)',.35+.4*k);}
// Oct 19 (user): Colossus Stomp + Fault Line art = a black obsidian wall with spikes jutting out toward the player.
// pts: [{x,y,ox,oy}] along the wall base; (ox,oy) = the side facing the player (screen space, already squashed).
function obsidianWall(ctx,pts,H,f){if(pts.length<2||f<=0)return;ctx.save();ctx.globalAlpha=f;ctx.lineJoin='round';
 for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],ha=H*a.h,hb=H*b.h;ctx.fillStyle=i%2?'#0d0b0f':'#141117';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(b.x,b.y-hb);ctx.lineTo(a.x,a.y-ha);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#4a4452';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(a.x,a.y-ha);ctx.lineTo(b.x,b.y-hb);ctx.stroke();}
 ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,90,30,.75)';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y-1);for(const q of pts)ctx.lineTo(q.x,q.y-1);ctx.stroke();ctx.globalCompositeOperation='source-over';
 for(let i=0;i<pts.length;i++){const q=pts[i],h=H*q.h;if(h<6)continue;const L=(26+12*rnd(q.x*.37+i))*q.h,lo=h*.2,hi=h*.72,mid=h*(.42+.12*rnd(i+q.y));
  ctx.fillStyle='#1c1820';ctx.beginPath();ctx.moveTo(q.x,q.y-lo);ctx.lineTo(q.x,q.y-hi);ctx.lineTo(q.x+q.ox*L,q.y+q.oy*L-mid);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#7a7088';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(q.x,q.y-hi);ctx.lineTo(q.x+q.ox*L,q.y+q.oy*L-mid);ctx.stroke();
  ctx.fillStyle='rgba(255,110,40,.55)';ctx.beginPath();ctx.arc(q.x+q.ox*L,q.y+q.oy*L-mid,1.6,0,TAU);ctx.fill();}
 ctx.restore();}
function sector(ctx,x,y,r,a,half,fill,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.translate(x,y);ctx.scale(1,.65);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a-half,a+half);ctx.closePath();ctx.fill();ctx.restore();}
// Brief ground scars left by Fault Line / claws / Colossus shed plates (game-time stamped).
const scars=[];function scar(o){scars.push(o);if(scars.length>60)scars.shift();}

// ---------------- ground pass ----------------
export function drawTitanGround(ctx,c,time){
 const own=owners(c);
 for(let i=scars.length-1;i>=0;i--){const s=scars[i],age=time-s.born,f=1-clamp01((age-s.life*.6)/(s.life*.4));if(age>s.life){scars.splice(i,1);continue;}s.draw(ctx,f,age);}
 for(const h of c.hazards??[]){const b=own.get(h.owner);if(!b)continue;const warn=h.age<h.warning,k=clamp01(h.age/Math.max(.01,h.warning)),col=b.bossKind==='colossus';
  if(h.punch&&warn){const R=h.radius,lock=!h.track,beat=.6+.4*Math.sin(time*(lock?26:12));
   disc(ctx,h.x,h.y,R,lock?'#ff4a10':'#ff8a3a',lock?.12+.22*k:.08);
   if(lock){glow(ctx,h.x,h.y,R*1.1,'rgba(255,90,20,.55)',.4+.4*k);ring(ctx,h.x,h.y,R,'#ffd0a0',3.5,.95);ring(ctx,h.x,h.y,R*(1-k)+6,'#fff2d8',2.5,.9*beat);}
   else ring(ctx,h.x,h.y,R,'#ff9a5a',3,.75,[12,9],-time*80);
   ctx.save();ctx.globalAlpha=lock?.95:.55;ctx.strokeStyle=lock?'#fff0d0':'#ffb070';ctx.lineWidth=2.5;const q=R*.38;ctx.beginPath();ctx.moveTo(h.x-q,h.y);ctx.lineTo(h.x+q,h.y);ctx.moveTo(h.x,h.y-q*.65);ctx.lineTo(h.x,h.y+q*.65);ctx.stroke();ctx.restore();
   if(h.final){ring(ctx,h.x,h.y,R*1.12,lock?'#ff6a2a':'#ff9a5a',2,.6,lock?null:[6,8],time*40);if(lock)cracks(ctx,h.x,h.y,R*.9,(h.x|0)+3,k,'rgba(255,140,60,.75)',2);}}
  else if(h.overload&&warn){const R=h.radius;disc(ctx,h.x,h.y,R,'#ff3a0a',.08);disc(ctx,h.x,h.y,R*k,'#ff5a1a',.18+.18*k);glow(ctx,h.x,h.y,R*k,'rgba(255,120,40,.6)',.5*k);
   ring(ctx,h.x,h.y,R,'#ffc080',4,.6+.4*Math.sin(time*(8+k*24)));ring(ctx,h.x,h.y,R*k,'#fff0d0',2.5,.9);cracks(ctx,h.x,h.y,R*.95,(h.x|0)+11,k,'rgba(255,150,60,.8)',2.5);}
  else if(h.hurl&&warn){const R=h.radius;disc(ctx,h.x,h.y,R,'#2a0c04',.2+.2*k);ring(ctx,h.x,h.y,R,'#ff8a3a',3,.7+.3*Math.sin(time*18));ring(ctx,h.x,h.y,R*(1-k)+5,'#ffd8a0',2,.9);
   const fl=clamp01((h.age-(h.warning-h.flight))/h.flight);if(fl>0)shadow(ctx,h.x,h.y,(h.small?24:36)*(.4+.6*fl),.2+.35*fl);}
  else if(h.burrow&&warn){const R=h.radius,lock=!h.track;disc(ctx,h.x,h.y,R,'#4a2c10',.18+.25*k);cracks(ctx,h.x,h.y,R,(h.x|0)+5,lock?.5+.5*k:.35,lock?'rgba(255,190,110,.9)':'rgba(120,80,40,.8)',lock?3:2);
   ring(ctx,h.x,h.y,R,lock?'#ffcf8a':'#c9a06a',lock?3.5:2.5,lock?.95:.6,lock?null:[10,8],-time*60);if(lock)ring(ctx,h.x,h.y,R*(1-k)+5,'#fff2d0',2,.9);
   for(let i=0;i<3;i++){const q=((time*1.7+i/3)%1);disc(ctx,h.x+Math.sin(i*2.3+time)*R*.4,h.y+Math.cos(i*1.7)*R*.2,10+q*16,'#d8b07a',.35*(1-q));}}
  else if(h.rumble&&warn){const R=h.radius,jit=1.5+2.5*k;disc(ctx,h.x,h.y,R,'#4a2c10',.12+.3*k);glow(ctx,h.x,h.y,R*.9,'rgba(255,190,110,.5)',.15+.45*k*k);
   cracks(ctx,h.x,h.y,R*1.05,(h.seed|0)+7,.35+.65*k,`rgba(${k>.7?'255,200,120':'80,52,26'},.9)`,k>.7?3:2.2);ring(ctx,h.x,h.y,R,k>.7?'#fff0c8':'#e0b878',k>.7?3.5:2.5,.55+.45*Math.sin(time*(14+k*30)));
   for(let i=0;i<6;i++){const a=i/6*TAU+h.seed,d=R*(.25+.5*rnd(h.seed+i));rock(ctx,h.x+Math.cos(a)*d+Math.sin(time*70+i)*jit,h.y+Math.sin(a)*d*.65-Math.abs(Math.sin(time*45+i*2))*jit*2,4+3*rnd(i+h.seed),i,(h.seed|0)+i,{fill:'#a87a46',edge:'#5a3a1e'});}}
  else if(h.tail&&warn){const R=h.radius;disc(ctx,h.x,h.y,R,'#7a4a1a',.12+.22*k);ring(ctx,h.x,h.y,R,'#f0c890',3.5,.7+.3*Math.sin(time*16));ring(ctx,h.x,h.y,R*(1-k)+6,'#fff2d0',2,.9);
   const a0=(b.face??0)+Math.PI;arrowArc(ctx,h.x,h.y,R*.8,a0-1.2,a0+1.2,'#ffe2b0',5,.75);}
  else if(h.kind==='ring'&&warn&&(h.stomp||h.tailRing))gapMarker(ctx,h,time,col?'#ff9a5a':'#e8c690');
  else if(h.kind==='quicksand'){if(warn){const fl=clamp01((h.age-(h.warning-h.flight))/h.flight);ring(ctx,h.x,h.y,h.radius*.85,'#e0b878',2.5,.5+.4*Math.sin(time*14),[8,6],-time*40);disc(ctx,h.x,h.y,h.radius*.85*fl,'#8a6234',.25);if(fl>0)shadow(ctx,h.x,h.y,12+10*fl,.3*fl);}
   else{const life=h.age-h.warning,f=clamp01(life/.25)*clamp01((h.warning+h.duration-h.age)/.6),R=h.radius;
    const g=ctx.createRadialGradient(h.x,h.y,0,h.x,h.y,R);g.addColorStop(0,'#3a2412');g.addColorStop(.55,'#7a5430');g.addColorStop(1,'rgba(160,120,70,0)');ctx.save();ctx.globalAlpha=.85*f;ctx.translate(h.x,h.y);ctx.scale(1,.65);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
    ctx.lineCap='round';for(let i=0;i<3;i++){ctx.strokeStyle=i%2?'#c9a06a':'#e8cf9a';ctx.lineWidth=2.2;ctx.globalAlpha=.55*f;ctx.beginPath();const r0=R*(.25+i*.22),a0=-time*(1.6+i*.4)+i*2;ctx.arc(0,0,r0,a0,a0+3.4);ctx.stroke();}
    ctx.restore();ring(ctx,h.x,h.y,R*.96,'#e8cf9a',1.5,.35*f);}}
  else if(h.fault&&!warn&&h.front>0){const L=h.front,ca=Math.cos(h.angle),sa=Math.sin(h.angle),f=1-clamp01((h.age-h.warning-h.len/(h.fspeed??950))/.25);
   ctx.save();ctx.lineCap='round';for(const [w,colr,al] of [[16,'#120a06',.75],[5,'#ff6a1a',.85],[2,'#ffe0b0',.9]]){ctx.globalAlpha=al*f;ctx.strokeStyle=colr;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(h.x,h.y);for(let t=0;t<=L;t+=26){const j=(rnd((h.x|0)+t)-.5)*10;ctx.lineTo(h.x+ca*t-sa*j,h.y+sa*t+ca*j);}ctx.stroke();}ctx.restore();
   if(!h.scarred&&h.front>=h.len){h.scarred=true;const hx=h.x,hy=h.y,len=h.len;scar({born:time,life:2.2,draw:(ctx,f)=>{ctx.save();ctx.globalAlpha=.6*f;ctx.strokeStyle='#120a06';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+ca*len,hy+sa*len);ctx.stroke();ctx.globalAlpha=.5*f;ctx.strokeStyle='#ff6a1a';ctx.lineWidth=2;ctx.stroke();ctx.restore();}});}}
 }
 for(const b of own.values()){if(b.state!=='alive'||b.sleeping)continue;const sp=b.special;
  if(b.lift>0)shadow(ctx,b.x,b.y,70*(1-b.lift/300),.45);
  if(b.bossKind==='colossus'&&sp?.kind==='overload'&&sp.fired&&b.exposed>0){glow(ctx,b.x,b.y,170,'rgba(255,110,30,.5)',.5+.2*Math.sin(time*6));cracks(ctx,b.x,b.y,190,(b.id|0)+31,1,'rgba(255,140,60,.55)',2);}
  if(b.bossKind==='colossus'&&sp?.kind==='pursuit'&&sp.st==='lodge'){glow(ctx,b.x,b.y,120,'rgba(255,120,40,.45)',.5);cracks(ctx,b.x,b.y,150,(b.id|0)+41,1,'rgba(255,150,70,.6)',2.5);}
  if(b.bossKind==='wyrm'){
   if(sp?.kind==='breath'&&sp.elapsed<WYB.windup+.05){const k=clamp01(sp.elapsed/WYB.windup),a=sp.a0,lo=a-WYB.arc-WYB.half,hi=a+WYB.arc+WYB.half,m=mouthOf(b);
    ctx.save();ctx.translate(m.x,m.y);ctx.scale(1,.65);ctx.globalAlpha=.12+.16*k;ctx.fillStyle='#e0b070';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,WYB.range,lo,hi);ctx.closePath();ctx.fill();ctx.globalAlpha=.6;ctx.strokeStyle='#ffe2b0';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();
    arrowArc(ctx,m.x,m.y,WYB.range*.72,a-sp.dir*WYB.arc,a+sp.dir*WYB.arc*(-1+2*k),'#fff0d0',6,.85);}  // sweep direction, shown before firing
   if(sp?.kind==='breath'&&sp.reversing&&!sp.on){const a=sp.a0,m=mouthOf(b);arrowArc(ctx,m.x,m.y,WYB.range*.72,a+sp.dir*WYB.arc,a-sp.dir*WYB.arc*.2,'#ffffff',7,.6+.4*Math.sin(time*30));}
   if(sp?.kind==='burrow'&&sp.trail?.length){for(let i=0;i<sp.trail.length;i+=3){const q=sp.trail[i],age=sp.elapsed-q.t,f=clamp01(1-age/1.4);if(f<=0)continue;disc(ctx,q.x,q.y,26*f+6,'#6a4824',.35*f);disc(ctx,q.x,q.y-3,18*f+4,'#c9a06a',.45*f);}
    const hd=sp.trail.at(-1);if(sp.st==='trail'){shadow(ctx,hd.x,hd.y+4,34,.25);disc(ctx,hd.x,hd.y-6,30,'#b08850',.9);disc(ctx,hd.x-6,hd.y-12,16,'#e0c08a',.8);cracks(ctx,hd.x,hd.y,48,(time*8)|0,1,'rgba(90,60,30,.7)',2);}}
   if(sp?.kind==='claws')for(const q of sp.arcs??[]){if(!q.done){const k=clamp01((sp.elapsed-q.born)/(q.at-q.born));sector(ctx,q.x,q.y,q.r,q.angle,q.half,'#ff5a2a',.12+.25*k);sector(ctx,q.x,q.y,q.r*k,q.angle,q.half,'#ffb070',.22);
      ctx.save();ctx.translate(q.x,q.y);ctx.scale(1,.65);ctx.globalAlpha=.9;ctx.strokeStyle='#ffd8a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,q.r,q.angle-q.half,q.angle+q.half);ctx.stroke();ctx.restore();}
     else if(!q.scarred){q.scarred=true;const {x,y,angle,r}=q;scar({born:time,life:1.6,draw:(ctx,f)=>{ctx.save();ctx.lineCap='round';for(let i=-1;i<=1;i++){const a=angle+i*.22;ctx.globalAlpha=.7*f;ctx.strokeStyle='#3a220e';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x+Math.cos(a-.5)*r*.45,y+Math.sin(a-.5)*r*.3);ctx.quadraticCurveTo(x+Math.cos(a)*r*.95,y+Math.sin(a)*r*.62,x+Math.cos(a+.5)*r*.45,y+Math.sin(a+.5)*r*.3);ctx.stroke();ctx.globalAlpha=.5*f;ctx.strokeStyle='#e8cf9a';ctx.lineWidth=2;ctx.stroke();}ctx.restore();}});}}
   if(sp?.kind==='charge'&&sp.elapsed>=WY_CHARGE_WINDUP&&!sp.done&&b.moving&&Math.random()<.6){const bx=b.x,by=b.y,s0=rnd(time*100)*TAU;scar({born:time,life:.9,draw:(ctx,f,age)=>disc(ctx,bx+Math.cos(s0)*20,by+Math.sin(s0)*8-age*20,18+age*40,'#c9a674',.35*f)});}}
 }
}
const WYB=WY.breath,WY_CHARGE_WINDUP=WY.charge.windup;  // mirrors titans.js WY.breath / WY.charge for drawing

// ---------------- upper pass (things with height) ----------------
export function drawTitanCanvas(ctx,c,time){
 const own=owners(c);
 for(const h of c.hazards??[]){const b=own.get(h.owner);if(!b)continue;
  if(h.hurl&&h.age<h.warning){const r=h.small?20:30,held=h.age<h.warning-h.flight;
   if(held){const k=clamp01(h.age/(h.warning-h.flight)),hx=b.x,hy=b.y-(26+52*k)*b.scale;/* torn up, then held overhead */rock(ctx,hx,hy,r,Math.sin(time*3)*.1,(h.x|0)%97,{hot:'rgba(255,120,40,.7)'});
    for(let i=0;i<2;i++){const q=(time*2+i*.5)%1;disc(ctx,hx+(i?-1:1)*r*.6,hy+r+q*30,4,'#8a7a6a',.6*(1-q));}}
   else{const u=clamp01((h.age-(h.warning-h.flight))/h.flight),sx=h.fromX,sy=h.fromY-78*b.scale,x=sx+(h.x-sx)*u,y=sy+(h.y-sy)*u-Math.sin(u*Math.PI)*220;rock(ctx,x,y,r,u*7,(h.x|0)%97,{hot:'rgba(255,120,40,.6)'});
    glow(ctx,x,y,r*1.8,'rgba(255,110,40,.35)',.6);}}
  if(h.obsidian&&h.fault&&h.front>0&&h.age>=h.warning){const ca=Math.cos(h.angle),sa=Math.sin(h.angle),done=h.front>=h.len,sink=done?clamp01((h.age-h.warning-h.len/(h.fspeed??950))/.3):0,pts=[];
   for(let t=Math.max(20,h.front-240);t<=h.front;t+=24){const behind=h.front-t,rise=clamp01(1-behind/240)*(1-sink)*clamp01(t/60);pts.push({x:h.x+ca*t,y:h.y+sa*t,ox:ca,oy:sa*.65,h:rise});}
   obsidianWall(ctx,pts,62,1);continue;}
  if(h.fault&&h.front>0&&h.age>=h.warning){const ca=Math.cos(h.angle),sa=Math.sin(h.angle),done=h.front>=h.len,sink=done?clamp01((h.age-h.warning-h.len/950)/.3):0;
   for(let t=30;t<=h.front;t+=34){const behind=h.front-t,rise=clamp01(1-behind/170)*(1-sink),j=rnd((h.x|0)+t);if(rise<=.02)continue;const x=h.x+ca*t+(j-.5)*14,y=h.y+sa*t,H=(34+30*j)*rise,W=10+8*j;
    ctx.save();ctx.fillStyle=j>.5?'#1e1a1c':'#2a2428';ctx.beginPath();ctx.moveTo(x-W,y);ctx.lineTo(x-W*.2,y-H);ctx.lineTo(x+W*.35,y-H*.8);ctx.lineTo(x+W,y);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#5a5560';ctx.lineWidth=1.5;ctx.stroke();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,120,40,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-W*.5,y-2);ctx.lineTo(x-W*.15,y-H*.6);ctx.stroke();ctx.restore();}}
  if(h.kind==='quicksand'&&h.age<h.warning){const u=clamp01((h.age-(h.warning-h.flight))/h.flight);if(u>0&&u<1){const sx=h.fromX,sy=h.fromY-12*b.scale,x=sx+(h.x-sx)*u,y=sy+(h.y-sy)*u-Math.sin(u*Math.PI)*160;disc(ctx,x,y,13,'#9a7040',1);disc(ctx,x-3,y-3,7,'#e0c08a',.9);
    for(let i=1;i<4;i++){const v=u-i*.05;if(v<0)continue;disc(ctx,sx+(h.x-sx)*v,sy+(h.y-sy)*v-Math.sin(v*Math.PI)*160,9-i*2,'#c9a06a',.5-i*.12);}}}
 }
 // Colossus Stomp: each wave front is an obsidian wall arc between the gaps, spikes pointing outward (toward the player).
 for(const h of c.hazards??[]){if(!h.obsidian||h.kind!=='ring'||h.age<h.warning||!(h.r>8)||!own.has(h.owner))continue;const R=h.r,fade=1-clamp01((h.age-h.warning-h.duration*.8)/(h.duration*.2)),gs=[...h.gaps].sort((x,y)=>x-y),grow=clamp01(R/90);
  gs.forEach((g,i)=>{const a0=g+h.gapHalf,a1=(gs[i+1]??gs[0]+TAU)-h.gapHalf,n=Math.max(2,Math.ceil((a1-a0)*R/22)),pts=[];for(let j=0;j<=n;j++){const a=a0+(a1-a0)*j/n,end=Math.min(j,n-j);pts.push({x:h.x+Math.cos(a)*R,y:h.y+Math.sin(a)*R*.65,ox:Math.cos(a),oy:Math.sin(a)*.65,h:grow*(end<1?.55:1)});}
   obsidianWall(ctx,pts,54,fade);});}
 // Wyrm rumble spots erupt: a cluster of sandstone spikes punches up, then sinks back into the sand.
 for(const h of c.hazards??[]){if(!h.rumble||h.age<h.warning||!own.has(h.owner))continue;const life=h.age-h.warning,up=Math.min(1,life/.1),sink=Math.max(0,(life-.45)/.3);if(sink>=1)continue;
  for(let i=0;i<7;i++){const a=i/7*TAU+h.seed,d=i?h.radius*(.3+.4*rnd(h.seed+i*3)):0,x=h.x+Math.cos(a)*d,y=h.y+Math.sin(a)*d*.65,H=(i?34:58)*(.7+.5*rnd(i+h.seed))*up*(1-sink),W=(i?9:14);if(H<1)continue;
   ctx.save();ctx.fillStyle=i%2?'#c99a5e':'#b88a52';ctx.beginPath();ctx.moveTo(x-W,y);ctx.lineTo(x-W*.2,y-H);ctx.lineTo(x+W*.3,y-H*.8);ctx.lineTo(x+W,y);ctx.closePath();ctx.fill();ctx.strokeStyle='#5a3a1e';ctx.lineWidth=1.5;ctx.stroke();
   ctx.fillStyle='rgba(255,240,200,.35)';ctx.beginPath();ctx.moveTo(x-W*.2,y-H);ctx.lineTo(x+W*.3,y-H*.8);ctx.lineTo(x+W*.1,y-H*.3);ctx.closePath();ctx.fill();ctx.restore();}}
 for(const q of c.enemyProjectiles??[])if(q.frag==='armor'){const u=clamp01(q.age/q.life);shadow(ctx,q.x,q.y+40,16,.3);plate(ctx,q.x,q.y-20-Math.sin(u*Math.PI)*40,1.5,q.age*14+q.x*.01);}
 for(const b of own.values()){if(b.state!=='alive'||b.sleeping)continue;const sp=b.special,col=b.bossKind==='colossus',chest={x:b.x,y:b.y-33*b.scale};/* Colossus HD model chest core */
  if(col){const core=sp?.kind==='overload'?(sp.fired?(b.exposed>0?1:0):clamp01(sp.elapsed/sp.charge)):sp?.kind==='shed'&&!sp.fired?clamp01(sp.elapsed/1.3):0;
   if(core>0){glow(ctx,chest.x,chest.y,40+70*core,'rgba(255,170,80,.95)',.4+.6*core*(.85+.15*Math.sin(time*(sp?.kind==='overload'&&sp.fired?6:20))));glow(ctx,chest.x,chest.y,16+12*core,'rgba(255,245,220,1)',core);}
   if(sp?.kind==='shed'&&!sp.fired){const k=clamp01(sp.elapsed/1.3),N=COL.shed.pieces;for(let i=0;i<N;i++){const a=i/N*TAU+.3,x=b.x+Math.cos(a)*22*b.scale*.7,y=b.y-30*b.scale+Math.sin(a)*24*b.scale*.6;glow(ctx,x,y,18+18*k,'rgba(255,140,50,.9)',.3+.7*k*(.7+.3*Math.sin(time*30+i)));}}
   if(sp?.kind==='shed'&&sp.fired&&!sp.scattered){sp.scattered=true;/* Oct 19 (user): twice the pieces - cosmetic plates fly out between the damaging lanes */const extra=Array.from({length:Math.max(0,COL.shed.pieces-sp.lanes.length)},(_,i)=>sp.lanes[i%sp.lanes.length]+TAU/COL.shed.pieces*(1+((i/sp.lanes.length)|0))*.5+(rnd(i+b.id)-.5)*.2);
    for(const a of extra){const bx=b.x,by=b.y,d=300+rnd(a*7)*260,ex=bx+Math.cos(a)*d,ey=by+Math.sin(a)*d*.72,r0=rnd(a*13);scar({born:time,life:2.6,draw:(ctx,f,age)=>{const u=clamp01(age/.7);if(u<1){const x=bx+(ex-bx)*u,y=by-20*b.scale+(ey-by+20*b.scale)*u-Math.sin(u*Math.PI)*90;shadow(ctx,bx+(ex-bx)*u,by+(ey-by)*u,14,.3);plate(ctx,x,y,1.4,age*14+r0*6);return;}const k=clamp01((age-.7)/1.2);plate(ctx,ex,ey+k*6,1.2-k*.4,r0*6,f*(1-k*.6));disc(ctx,ex,ey+6,14+16*k,'#3a3436',.3*f);}});}
    for(const a of sp.lanes){const ex=b.x+Math.cos(a)*520,ey=b.y+Math.sin(a)*520,r0=rnd(a*10);scar({born:time+.65,life:1.8,draw:(ctx,f,age)=>{if(age<0)return;const k=clamp01(age/1.2);for(let i=0;i<3;i++)plate(ctx,ex+(i-1)*14+(rnd(r0+i)-.5)*10,ey+k*10+i*4,1.2-k*.5,r0*6+i,f*(1-k*.6));
     disc(ctx,ex,ey+6,18+20*k,'#3a3436',.35*f);}});}}}
  else{
   if(sp?.kind==='breath'&&(sp.on||sp.elapsed<WYB.windup)){const inh=sp.elapsed<WYB.windup,mo=mouthOf(b),mx=mo.x,my=mo.y-12*b.scale;
    if(inh){const k=clamp01(sp.elapsed/WYB.windup);for(let i=0;i<6;i++){const q=(time*2.4+i/6)%1,a=b.face+(i-2.5)*.35,r=120*(1-q);disc(ctx,mx+Math.cos(a)*r,my+Math.sin(a)*r*.65,3+3*q,'#e8cf9a',.7*q*k);}glow(ctx,mx,my,30+30*k,'rgba(240,200,140,.8)',.5*k);}
    else{const a=sp.beam,R=WYB.range;ctx.save();ctx.translate(mx,my);ctx.scale(1,.65);ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(0,0,10,0,0,R);g.addColorStop(0,'rgba(255,236,200,.85)');g.addColorStop(.4,'rgba(222,180,120,.55)');g.addColorStop(1,'rgba(180,130,70,0)');
     ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,a-WYB.half,a+WYB.half);ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';
     for(let i=0;i<22;i++){const q=(time*2.2+rnd(i)*1)%1,off=(rnd(i+40)-.5)*2*WYB.half*.9,r=20+q*R;ctx.globalAlpha=.75*(1-q);ctx.strokeStyle=i%3?'#e8cf9a':'#a07a48';ctx.lineWidth=2+2*(1-q);const aa=a+off;ctx.beginPath();ctx.moveTo(Math.cos(aa)*r,Math.sin(aa)*r);ctx.lineTo(Math.cos(aa)*(r+26),Math.sin(aa)*(r+26));ctx.stroke();}
     ctx.restore();}}
   if(sp?.kind==='spit'&&sp.elapsed<.45){const k=clamp01(sp.elapsed/.45),mo=mouthOf(b);glow(ctx,mo.x,mo.y-12*b.scale,26+20*k,'rgba(230,190,130,.8)',.5*k);}  // throat swells
   if(sp?.kind==='shed'){if(!sp.pieces&&sp.popped){sp.pieces=Array.from({length:16},(_,i)=>({a:rnd(b.id+i)*TAU,v:120+rnd(i+9)*160,up:260+rnd(i+3)*220,r:rnd(i+5)*6,s:.9+rnd(i+7)*.8}));sp.popAt=sp.elapsed;}
    if(sp.pieces){const t=sp.elapsed-sp.popAt;for(const q of sp.pieces){const z=Math.max(0,q.up*t-700*t*t),land=z<=0&&t>.2,x=b.x+Math.cos(q.a)*q.v*Math.min(t,.9),y=b.y+Math.sin(q.a)*q.v*Math.min(t,.9)*.65,f=land?clamp01(1-(t-.7)/1):1;if(f<=0)continue;
     shadow(ctx,x,y,10*q.s,.25*f);sandPlate(ctx,x,y-z-6,q.s*1.3,q.r+t*(land?0:9),f);}}}}
 }
}
