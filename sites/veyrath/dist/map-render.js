import {gfx} from './quality.js?v=fx-260';
// Oct 15 desert look pass: painted sand ground, sun shadows and warm light shafts so the open map reads like
// the Desert Biome reference photos instead of sprites on a flat fill. Pure rendering; no simulation state.
const SCALE=8,SUN={x:-.62,y:-.36},PAL={base:'#d2a76c',light:'#e6c58f',dark:'#b98c57',worn:'#a97f4f',clay:'#c87443',ash:'#6e5640'};
function rng(seed){let s=seed>>>0;return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function blob(c,x,y,rx,ry,color,a){const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(1,color+'00');c.save();c.translate(x,y);c.scale(rx,ry);c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();}
// Large-scale colour map at 1/8 world resolution, smoothed when stretched: dunes, clay, worn soil around scenery.
function paintMacro(scene){
  const w=Math.ceil(scene.width/SCALE),h=Math.ceil(scene.height/SCALE),cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d'),r=rng(1015);
  c.fillStyle=PAL.base;c.fillRect(0,0,w,h);
  for(let i=0;i<260;i++)blob(c,r()*w,r()*h,20+r()*70,12+r()*40,r()<.5?PAL.light:PAL.dark,.18+r()*.22);
  for(let i=0;i<46;i++){const x=r()*w,y=r()*h;for(let k=0;k<5;k++)blob(c,x+(r()-.5)*30,y+(r()-.5)*18,8+r()*22,5+r()*13,PAL.clay,.16+r()*.16);}
  // Worn, darker soil wherever scenery clusters (camps, enclosures, villages) and under every landmark.
  for(const p of scene.props)if(p.footprint||p.layer==='depth')blob(c,p.x/SCALE,p.y/SCALE,9,6,PAL.worn,.07);
  for(const l of scene.landmarks??[]){if(l.name==='forge'){blob(c,l.x/SCALE,(l.y-60)/SCALE,62,40,'#a3a05e',.45);blob(c,l.x/SCALE,(l.y-60)/SCALE,40,26,'#8f9a55',.35);continue;}blob(c,l.x/SCALE,l.y/SCALE,40,28,PAL.worn,.32);blob(c,l.x/SCALE,l.y/SCALE,22,15,PAL.dark,.25);}
  return cv;
}
// Fine 512px grain tile: speckles, pebbles, wind ripples and faint footprints; wraps seamlessly.
function paintGrain(){
  const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;const c=cv.getContext('2d'),r=rng(77);
  const wrap=(fn,x,y)=>{for(const dx of [-S,0,S])for(const dy of [-S,0,S])fn(x+dx,y+dy);};
  for(let i=0;i<5200;i++){const x=r()*S,y=r()*S,l=r();c.fillStyle=l<.5?'rgba(255,240,205,.16)':'rgba(90,60,30,.13)';c.fillRect(x,y,1+r()*1.5,1+r()*1.5);}
  c.lineCap='round';
  for(let i=0;i<70;i++){const x=r()*S,y=r()*S,len=30+r()*70,amp=2+r()*3;wrap((px,py)=>{c.strokeStyle='rgba(120,82,44,.10)';c.lineWidth=1.6;c.beginPath();for(let t=0;t<=1;t+=.1)c.lineTo(px+t*len,py+Math.sin(t*6)*amp-t*len*.18);c.stroke();c.strokeStyle='rgba(255,236,196,.10)';c.beginPath();for(let t=0;t<=1;t+=.1)c.lineTo(px+t*len,py+2+Math.sin(t*6)*amp-t*len*.18);c.stroke();},x,y);}
  for(let i=0;i<90;i++){const x=r()*S,y=r()*S,s=1.5+r()*3;wrap((px,py)=>{c.fillStyle='rgba(70,48,28,.22)';c.beginPath();c.ellipse(px+1,py+1,s,s*.6,0,0,7);c.fill();c.fillStyle=r()<.5?'rgba(176,140,98,.9)':'rgba(150,112,76,.9)';c.beginPath();c.ellipse(px,py,s,s*.65,0,0,7);c.fill();},x,y);}
  for(let i=0;i<10;i++){let x=r()*S,y=r()*S;const a=r()*6.28;for(let k=0;k<6;k++){const side=k%2?1:-1;wrap((px,py)=>{c.fillStyle='rgba(110,76,42,.10)';c.beginPath();c.ellipse(px-Math.sin(a)*4*side,py+Math.cos(a)*4*side,3,2,a,0,7);c.fill();},x,y);x+=Math.cos(a)*11;y+=Math.sin(a)*11;}}
  return cv;
}
// Organic ground features from landmarks (water-N, plaza-N, crater-N) replace grid tiles that read as big squares.
// shapeR() must match the generator's lake collider formula.
export function shapeR(a,seed){return 1+.09*Math.sin(3*a+seed)+.05*Math.sin(5*a+2*seed)+.035*Math.sin(8*a+3*seed);}
function shapePath(c,cx,cy,rx,ry,seed,k=1,n=72){c.beginPath();for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=shapeR(a,seed)*k,x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}
function prop(l,k,d){return l.properties?.[k]??d;}
function bakeWater(g){
  const ms=g.members,pad=60;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const m of ms){const rx=prop(m,'rx',400)*1.3,ry=prop(m,'ry',250)*1.3;x0=Math.min(x0,m.x-rx);y0=Math.min(y0,m.y-ry);x1=Math.max(x1,m.x+rx);y1=Math.max(y1,m.y+ry);}
  x0-=pad;y0-=pad;x1+=pad;y1+=pad;const cv=document.createElement('canvas');cv.width=Math.ceil(x1-x0);cv.height=Math.ceil(y1-y0);const c=cv.getContext('2d');
  const all=(k)=>{c.beginPath();for(const m of ms){const rx=prop(m,'rx',400),ry=prop(m,'ry',250),seed=prop(m,'seed',1);for(let i=0;i<=72;i++){const a=i/72*Math.PI*2,r=shapeR(a,seed)*k,x=m.x-x0+Math.cos(a)*rx*r,y=m.y-y0+Math.sin(a)*ry*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}};
  // Oct 16 (user, shoreline ref): a band of darker wet sand around the water, then light shallow water at the edge
  // getting deeper toward the middle; crisp, slightly ragged edges instead of a white foam ring.
  const bites=(k,n)=>{c.globalCompositeOperation='destination-out';const r=rng(ms.length*97+n|0);for(const m of ms){const rx=prop(m,'rx',400),ry=prop(m,'ry',250),seed=prop(m,'seed',1);for(let i=0;i<rx*.9;i++){const a=r()*Math.PI*2,e=shapeR(a,seed)*k*(.985+r()*.03),x=m.x-x0+Math.cos(a)*rx*e,y=m.y-y0+Math.sin(a)*ry*e;c.fillRect(x-3,y-2,4+r()*7,3+r()*4);}}c.globalCompositeOperation='source-over';};
  c.globalAlpha=.55;c.fillStyle='#c39a63';c.filter='blur(5px)';all(1.13);c.fill('nonzero');c.filter='none';c.globalAlpha=1;
  c.fillStyle='#b38754';all(1.075);c.fill('nonzero');bites(1.075,1);
  c.fillStyle='#9c7346';all(1.035);c.fill('nonzero');
  c.fillStyle='#6f9fe0';all(1);c.fill('nonzero');
  {const r=rng(ms.length*31|0);for(const m of ms){const rx=prop(m,'rx',400),ry=prop(m,'ry',250),seed=prop(m,'seed',1);for(let i=0;i<rx*1.1;i++){const a=r()*Math.PI*2,out=r()<.5,e=shapeR(a,seed)*(out?1.0+r()*.02:.985+r()*.015),x=m.x-x0+Math.cos(a)*rx*e,y=m.y-y0+Math.sin(a)*ry*e;if(ms.some(o=>o!==m&&insideWater(o,x+x0,y+y0,.99)))continue;c.fillStyle=out?'#6f9fe0':'#9c7346';c.fillRect(x-2,y-1.5,3+r()*6,2+r()*3);}}}
  c.fillStyle='#4f86d6';all(.975);c.fill('nonzero');
  const W=x1-x0,H=y1-y0,grad=c.createLinearGradient(0,0,W*.3,H);grad.addColorStop(0,'#2d5fbd');grad.addColorStop(.5,'#2753b0');grad.addColorStop(1,'#20489e');
  c.fillStyle='#3a6cc4';all(.95);c.fill('nonzero');c.fillStyle=grad;all(.91);c.fill('nonzero');
  // light shimmer flecks in the shallows
  c.globalAlpha=.35;c.fillStyle='#a9c8f2';{const r=rng(ms.length*13|0);for(const m of ms){const rx=prop(m,'rx',400),ry=prop(m,'ry',250),seed=prop(m,'seed',1);for(let i=0;i<rx*.6;i++){const a=r()*Math.PI*2,e=shapeR(a,seed)*(.955+r()*.035),x=m.x-x0+Math.cos(a)*rx*e,y=m.y-y0+Math.sin(a)*ry*e;if(!ms.some(o=>o!==m&&insideWater(o,x+x0,y+y0,.95)))c.fillRect(x,y,3+r()*5,1.5);}}}c.globalAlpha=1;
  const segs=[];
  return {cv,ox:g.x-x0,oy:g.y-y0,members:ms,segs};
}
function bakePlaza(l){
  const rx=prop(l,'rx',140),ry=prop(l,'ry',75),seed=prop(l,'seed',2),W=Math.ceil(rx*2.4),H=Math.ceil(ry*2.4),cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),cx=W/2,cy=H/2,r=rng(seed*997|0);
  c.globalAlpha=.35;c.fillStyle='#8c6a45';c.filter='blur(5px)';shapePath(c,cx,cy,rx,ry,seed,1.08);c.fill();c.filter='none';
  // Irregular flagstones, sparser and more broken toward the rim.
  for(let i=0;i<rx*ry/90;i++){const a=r()*Math.PI*2,d=Math.sqrt(r()),x=cx+Math.cos(a)*rx*d*shapeR(a,seed),y=cy+Math.sin(a)*ry*d*shapeR(a,seed);if(r()<d*d*.8)continue;
    const w=9+r()*13,h=w*.55,rot=(r()-.5)*.5,tone=150+r()*40|0;c.save();c.translate(x,y);c.rotate(rot);c.globalAlpha=.95;c.fillStyle='rgba(60,40,22,.55)';c.beginPath();c.ellipse(1.5,2,w+1.5,h+1.5,0,0,7);c.fill();
    c.fillStyle=`rgb(${tone+28},${tone+8},${tone-30})`;c.beginPath();for(let k=0;k<6;k++){const q=k/6*Math.PI*2,j=.8+r()*.3;k?c.lineTo(Math.cos(q)*w*j,Math.sin(q)*h*j):c.moveTo(Math.cos(q)*w*j,Math.sin(q)*h*j);}c.closePath();c.fill();
    c.fillStyle='rgba(255,240,200,.25)';c.beginPath();c.ellipse(-w*.2,-h*.3,w*.5,h*.35,0,0,7);c.fill();c.restore();}
  return {cv,ox:cx,oy:cy};
}
function bakeCrater(l){
  const rx=prop(l,'rx',260),ry=prop(l,'ry',150),seed=prop(l,'seed',3),W=Math.ceil(rx*2.6),H=Math.ceil(ry*2.6),cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),cx=W/2,cy=H/2,r=rng(seed*331|0);
  c.filter='blur(8px)';c.globalAlpha=.5;c.fillStyle='#e0bd86';shapePath(c,cx,cy,rx,ry,seed,1.18);c.fill();c.globalAlpha=.55;c.fillStyle='#7a5434';shapePath(c,cx,cy,rx,ry,seed,1.0);c.fill();
  c.globalAlpha=.8;const g=c.createRadialGradient(cx,cy+ry*.1,0,cx,cy,rx);g.addColorStop(0,'#1c120c');g.addColorStop(.5,'#3b2618');g.addColorStop(1,'rgba(90,60,36,0)');c.fillStyle=g;shapePath(c,cx,cy,rx,ry,seed,.85);c.fill();c.filter='none';
  c.strokeStyle='rgba(20,12,8,.55)';c.lineCap='round';for(let i=0;i<14;i++){let a=r()*Math.PI*2,x=cx+Math.cos(a)*rx*.35,y=cy+Math.sin(a)*ry*.35;c.lineWidth=1+r()*2;c.beginPath();c.moveTo(x,y);for(let k=0;k<5;k++){a+=(r()-.5)*.8;x+=Math.cos(a)*rx*.13;y+=Math.sin(a)*ry*.13;c.lineTo(x,y);}c.stroke();}
  c.globalAlpha=.35;c.fillStyle='#ff6a2a';c.filter='blur(14px)';c.beginPath();c.ellipse(cx,cy+ry*.05,rx*.22,ry*.2,0,0,7);c.fill();c.filter='none';
  return {cv,ox:cx,oy:cy};
}
function patchCanvas(rx,ry,k=2.6){const cv=document.createElement('canvas');cv.width=Math.ceil(rx*k);cv.height=Math.ceil(ry*k+30);return cv;}
// Grass meadow: soft green wash with a wavy edge, then hand-drawn tufts (denser in the middle, drier at the rim), a few flowers.
const BLADES=['#5c7a32','#6f8f3a','#86a84a','#a3b85a','#7f9a3e'],DRY=['#b9a35a','#a8944c','#c9b56c'];
function bakeGrass(l){
  const rx=prop(l,'rx',140),ry=prop(l,'ry',80),seed=prop(l,'seed',1),cv=patchCanvas(rx,ry),c=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2+10,r=rng(seed*7919|0);
  c.filter='blur(7px)';for(const [k,col,a] of [[1.12,'#a49a58',.3],[.95,'#8c9a4c',.38],[.7,'#78923f',.42]]){c.globalAlpha=a;c.fillStyle=col;shapePath(c,cx,cy,rx,ry,seed,k);c.fill();}c.filter='none';
  const n=Math.min(900,rx*ry/22),tufts=[];
  for(let i=0;i<n;i++){const a=r()*Math.PI*2,d=Math.pow(r(),.7),e=shapeR(a,seed)*1.05;if(r()<d*d*.55)continue;tufts.push([cx+Math.cos(a)*rx*d*e,cy+Math.sin(a)*ry*d*e,d]);}
  tufts.sort((p,q)=>p[1]-q[1]);c.lineCap='round';
  for(const [x,y,d] of tufts){const dry=r()<d*.6,h=(6+r()*9)*(1.15-d*.45),blades=4+(r()*5|0);
    c.globalAlpha=.3;c.fillStyle='#3d3a1a';c.beginPath();c.ellipse(x+2,y+1,4,1.8,0,0,7);c.fill();c.globalAlpha=1;
    for(let b=0;b<blades;b++){const lean=(r()-.5)*1.1+.15,len=h*(.6+r()*.5),tip=[x+Math.sin(lean)*len,y-Math.cos(lean)*len];c.strokeStyle=(dry?DRY:BLADES)[r()*(dry?3:5)|0];c.lineWidth=1.1+r()*.9;c.beginPath();c.moveTo(x+(b-blades/2)*.8,y);c.quadraticCurveTo(x+Math.sin(lean)*len*.3,y-len*.6,tip[0],tip[1]);c.stroke();}
    if(!dry&&r()<.25){c.strokeStyle='rgba(220,235,150,.6)';c.lineWidth=1;c.beginPath();c.moveTo(x-1,y-1);c.lineTo(x-3,y-h*.7);c.stroke();}
    if(r()<.035){c.fillStyle=r()<.5?'#f4e27a':'#f3efe0';c.beginPath();c.arc(x+r()*4,y-h*.8,1.8,0,7);c.fill();}}
  return {cv,ox:cx,oy:cy};
}
// Rubble: loose pebbles and grit; scorch: blackened burn mark with ash.
function bakeRubble(l){
  const rx=prop(l,'rx',50),ry=prop(l,'ry',26),seed=prop(l,'seed',1),cv=patchCanvas(rx,ry,2.4),c=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2,r=rng(seed*4211|0);
  c.globalAlpha=.25;c.fillStyle='#8a6a44';c.filter='blur(4px)';shapePath(c,cx,cy,rx,ry,seed,.9);c.fill();c.filter='none';
  for(let i=0;i<rx*ry/12;i++){const a=r()*Math.PI*2,d=Math.sqrt(r()),x=cx+Math.cos(a)*rx*d,y=cy+Math.sin(a)*ry*d,s=(1+r()*3.5)*(1.2-d*.6),tone=120+r()*60|0;
    c.globalAlpha=.45;c.fillStyle='#3a2810';c.beginPath();c.ellipse(x+1,y+1,s,s*.6,0,0,7);c.fill();c.globalAlpha=1;c.fillStyle=`rgb(${tone+40},${tone+15},${tone-20})`;c.beginPath();c.ellipse(x,y,s,s*.65,r()*.6,0,7);c.fill();
    if(s>2.5){c.fillStyle='rgba(255,240,205,.35)';c.beginPath();c.ellipse(x-s*.3,y-s*.25,s*.45,s*.25,0,0,7);c.fill();}}
  return {cv,ox:cx,oy:cy};
}
function bakeScorch(l){
  const rx=prop(l,'rx',60),ry=prop(l,'ry',32),seed=prop(l,'seed',1),cv=patchCanvas(rx,ry,2.4),c=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2,r=rng(seed*613|0);
  c.filter='blur(6px)';c.globalAlpha=.55;c.fillStyle='#4a3020';shapePath(c,cx,cy,rx,ry,seed);c.fill();c.globalAlpha=.6;c.fillStyle='#1b120c';shapePath(c,cx,cy,rx,ry,seed,.55);c.fill();c.filter='none';
  for(let i=0;i<40;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*.9;c.globalAlpha=.5;c.fillStyle=r()<.5?'#8d8378':'#2a1d14';c.fillRect(cx+Math.cos(a)*rx*d,cy+Math.sin(a)*ry*d,1.5+r()*2,1+r());}
  return {cv,ox:cx,oy:cy};
}
// Oct 16 reference pass: lush meadow ground (forest areas), orange clay ground (camps, ruins), red-brown crack
// networks (thorn wastes). Each is a rough-edged organic patch from a landmark kind-N with rx, ry, seed.
function bakeMeadow(l){
  const rx=prop(l,'rx',400),ry=prop(l,'ry',220),seed=prop(l,'seed',1),cv=patchCanvas(rx,ry,2.3),c=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2,r=rng(seed*5171|0);
  c.fillStyle='#8fae5a';shapePath(c,cx,cy,rx,ry,seed);c.fill();
  // ragged sandy fringe: little bites out of the edge
  c.globalCompositeOperation='destination-out';for(let i=0;i<rx*1.4;i++){const a=r()*Math.PI*2,e=shapeR(a,seed),x=cx+Math.cos(a)*rx*e*(.97+r()*.06),y=cy+Math.sin(a)*ry*e*(.97+r()*.06);c.fillRect(x-4,y-3,6+r()*8,4+r()*5);}c.globalCompositeOperation='source-over';
  c.save();shapePath(c,cx,cy,rx,ry,seed,.985);c.clip();
  for(let i=0;i<rx*ry/90;i++){const x=cx+(r()*2-1)*rx,y=cy+(r()*2-1)*ry;c.fillStyle=r()<.5?'#7d9c4c':'#a3c06a';c.fillRect(x,y,2,1.4);}
  for(let i=0;i<rx*ry/1600;i++){const x=cx+(r()*2-1)*rx,y=cy+(r()*2-1)*ry,s=20+r()*60;c.globalAlpha=.18;c.fillStyle=r()<.5?'#6f9142':'#b0c773';c.beginPath();c.ellipse(x,y,s,s*.55,0,0,7);c.fill();}
  c.restore();return {cv,ox:cx,oy:cy};
}
function bakeClay(l){
  const rx=prop(l,'rx',200),ry=prop(l,'ry',110),seed=prop(l,'seed',1),cv=patchCanvas(rx,ry,2.3),c=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2,r=rng(seed*3313|0);
  c.fillStyle='#cf7a3c';shapePath(c,cx,cy,rx,ry,seed);c.fill();
  c.globalCompositeOperation='destination-out';for(let i=0;i<rx*1.6;i++){const a=r()*Math.PI*2,e=shapeR(a,seed),x=cx+Math.cos(a)*rx*e*(.95+r()*.08),y=cy+Math.sin(a)*ry*e*(.95+r()*.08);c.fillRect(x-4,y-3,7+r()*7,4+r()*4);}c.globalCompositeOperation='source-over';
  for(let i=0;i<rx*1.2;i++){const a=r()*Math.PI*2,e=shapeR(a,seed)*(1.02+r()*.1),x=cx+Math.cos(a)*rx*e,y=cy+Math.sin(a)*ry*e;c.fillStyle='#d98a4c';c.fillRect(x,y,4+r()*5,3+r()*3);}
  c.save();shapePath(c,cx,cy,rx,ry,seed,.98);c.clip();for(let i=0;i<rx*ry/120;i++){c.fillStyle=r()<.5?'#c06c33':'#dc8c4f';c.fillRect(cx+(r()*2-1)*rx,cy+(r()*2-1)*ry,2,1.5);}c.restore();
  return {cv,ox:cx,oy:cy};
}
function bakeCracks(l){
  const rx=prop(l,'rx',300),ry=prop(l,'ry',170),seed=prop(l,'seed',1),cv=patchCanvas(rx,ry,2.3),c=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2,r=rng(seed*977|0);
  c.save();shapePath(c,cx,cy,rx,ry,seed);c.clip();c.strokeStyle='#6b2216';c.lineCap='round';c.lineJoin='round';
  // iso honeycomb-like crack cells, broken up randomly (l2E8YR)
  const sx=64,sy=32;for(let gy=-ry;gy<ry;gy+=sy)for(let gx=-rx;gx<rx;gx+=sx){if(r()<.45)continue;const x=cx+gx+((gy/sy)&1?sx/2:0),y=cy+gy;c.lineWidth=2.5+r()*1.5;c.globalAlpha=.75;c.beginPath();c.moveTo(x-sx/2,y);c.lineTo(x-sx/4+(r()-.5)*6,y-sy/2);c.lineTo(x+sx/4+(r()-.5)*6,y-sy/2);c.lineTo(x+sx/2,y);if(r()<.6){c.lineTo(x+sx/4,y+sy/2);c.lineTo(x-sx/4,y+sy/2);c.closePath();}c.stroke();}
  c.restore();return {cv,ox:cx,oy:cy};
}
// Oct 16: worn sand trail leading to bridges (yWgidJ).
function bakePath(l){
  const rx=prop(l,'rx',70),ry=prop(l,'ry',35),seed=prop(l,'seed',1),cv=patchCanvas(rx,ry,2.4),c=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2,r=rng(seed*733|0);
  c.filter='blur(3px)';c.fillStyle='#e6cf9c';shapePath(c,cx,cy,rx,ry,seed);c.fill();c.filter='none';
  for(let i=0;i<rx*ry/40;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*.95;c.fillStyle=r()<.5?'#d9bd86':'#f0dcae';c.fillRect(cx+Math.cos(a)*rx*d,cy+Math.sin(a)*ry*d,2,1.5);}
  return {cv,ox:cx,oy:cy};
}
// Oct 16 (user bridge ref): raised stone causeway across a river, laid along an iso axis: flagstone deck with light
// curbs, darker block sides facing the camera, and a soft shadow on the water. Landmark causeway-N: len, wid, ux, uy.
function bakeCauseway(l){
  const L=prop(l,'len',520),Wd=prop(l,'wid',110),ux=prop(l,'ux',.894),uy=prop(l,'uy',.447),vx=-ux,vy=uy,h=16,r=rng(prop(l,'seed',1)*911|0);
  const P=(a,b,z=0)=>[a*ux+b*vx,a*uy+b*vy-z];const pts=[P(-L/2,-Wd/2),P(L/2,-Wd/2),P(L/2,Wd/2),P(-L/2,Wd/2)];
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),pad=40,x0=Math.min(...xs)-pad,y0=Math.min(...ys)-h-pad,cv=document.createElement('canvas');cv.width=Math.ceil(Math.max(...xs)-x0+pad);cv.height=Math.ceil(Math.max(...ys)-y0+pad);const c=cv.getContext('2d');
  const poly=(q,fill,stroke,lw=1)=>{c.beginPath();q.forEach(([x,y],i)=>i?c.lineTo(x-x0,y-y0):c.moveTo(x-x0,y-y0));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
  c.globalAlpha=.35;c.filter='blur(5px)';poly(pts.map(([x,y])=>[x+8,y+10]),'#0d1f40');c.filter='none';c.globalAlpha=1;
  // sides: draw the faces whose outward normal points toward the camera (down-screen)
  const top=[P(-L/2,-Wd/2,h),P(L/2,-Wd/2,h),P(L/2,Wd/2,h),P(-L/2,Wd/2,h)];
  for(let k=0;k<4;k++){const a=pts[k],b=pts[(k+1)%4],cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;if(cy<=ys.reduce((s,v)=>s+v,0)/4)continue;
    poly([a,b,top[(k+1)%4],top[k]],k%2?'#8a653f':'#9b7448','#5e4229',1);
    const n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/26));c.strokeStyle='#6d4e30';c.lineWidth=1;for(let i=1;i<n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;c.beginPath();c.moveTo(x-x0,y-y0);c.lineTo(x-x0,y-y0-h);c.stroke();}
    c.beginPath();c.moveTo((a[0]+b[0])/2-x0-(b[0]-a[0])/2,a[1]-y0-h/2);c.lineTo(b[0]-x0,b[1]-y0-h/2);c.stroke();}
  poly(top,'#c49862','#6d4e30',1.5);
  // curbs along both long edges
  const curb=12;for(const sb of [-1,1]){const b0=sb*Wd/2,b1=sb*(Wd/2-curb);const n=Math.round(L/34);for(let i=0;i<n;i++){const a0=-L/2+i*L/n,a1=a0+L/n;poly([P(a0,b0,h),P(a1,b0,h),P(a1,b1,h),P(a0,b1,h)],r()<.5?'#dcb987':'#d2ad78','#8a6640',1);}}
  // flagstones
  const cs=24,nb=Math.max(2,Math.round((Wd-2*curb)/cs)),na=Math.round(L/cs),ja=()=>(r()-.5)*5;
  for(let i=0;i<na;i++)for(let j=0;j<nb;j++){const a0=-L/2+i*L/na,a1=a0+L/na,b0=-(Wd/2-curb)+j*(Wd-2*curb)/nb,b1=b0+(Wd-2*curb)/nb;
    poly([P(a0+1.5+ja(),b0+1.5,h),P(a1-1.5+ja(),b0+1.5,h),P(a1-1.5+ja(),b1-1.5,h),P(a0+1.5+ja(),b1-1.5,h)],['#caa06a','#ba8f5a','#d4ab74','#c0955f'][r()*4|0],'#7d5a35',1.1);}
  return {cv,ox:-x0,oy:-y0};
}
const BAKE={causeway:bakeCauseway,path:bakePath,water:bakeWater,plaza:bakePlaza,crater:bakeCrater,grass:bakeGrass,rubble:bakeRubble,scorch:bakeScorch,meadow:bakeMeadow,clay:bakeClay,cracks:bakeCracks},fcache=new WeakMap();
// Oct 16 (user): overlapping water landmarks are one body of water (one shore, one fill, one foam line), not pools on pools.
const wr=(l,a)=>shapeR(a,prop(l,'seed',1));
function insideWater(m,x,y,k=1){const dx=(x-m.x)/prop(m,'rx',400),dy=(y-m.y)/prop(m,'ry',250),a=Math.atan2(dy*prop(m,'ry',250),dx*prop(m,'rx',400));return Math.hypot(dx,dy)<wr(m,a)*k;}
function waterGroups(ls){
  const water=ls.filter(l=>l.name.split('-')[0]==='water'),parent=water.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
  for(let i=0;i<water.length;i++)for(let j=i+1;j<water.length;j++){const a=water[i],b=water[j];if(Math.hypot((a.x-b.x)/(prop(a,'rx',400)+prop(b,'rx',400)),(a.y-b.y)/(prop(a,'ry',250)+prop(b,'ry',250)))<1.02)parent[find(i)]=find(j);}
  const groups=new Map();water.forEach((l,i)=>{const g=find(i);if(!groups.has(g))groups.set(g,[]);groups.get(g).push(l);});
  return [...groups.values()].map(members=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const m of members){const rx=prop(m,'rx',400)*1.15,ry=prop(m,'ry',250)*1.15;x0=Math.min(x0,m.x-rx);y0=Math.min(y0,m.y-ry);x1=Math.max(x1,m.x+rx);y1=Math.max(y1,m.y+ry);}
    return {l:{x:(x0+x1)/2,y:(y0+y1)/2,properties:{rx:(x1-x0)/2/1.4,ry:(y1-y0)/2/1.4},members},kind:'water'};});
}
function features(scene){let f=fcache.get(scene);if(!f){f=[...(scene.landmarks??[]).map(l=>({l,kind:l.name.split('-')[0]})).filter(o=>BAKE[o.kind]&&o.kind!=='water'),...waterGroups(scene.landmarks??[])].sort((p,q)=>ORDER.indexOf(p.kind)-ORDER.indexOf(q.kind));fcache.set(scene,f);}return f;}
const ORDER=['meadow','clay','path','cracks','crater','grass','rubble','scorch','plaza','water','causeway'];let baked=0;
function drawFeatures(ctx,scene,view,time,mode='all'){
  // Bake up to two patches per frame ahead of the camera (900px margin) so walking into a meadow never hitches.
  let budget=2;
  for(const f of features(scene)){const l=f.l,rx=prop(l,'rx',300)*1.4,ry=prop(l,'ry',200)*1.4,M=900;if(l.x+rx<view.x0-M||l.x-rx>view.x1+M||l.y+ry<view.y0-M||l.y-ry>view.y1+M)continue;
    const inView=!(l.x+rx<view.x0||l.x-rx>view.x1||l.y+ry<view.y0||l.y-ry>view.y1);if(mode!=='anim'&&!f.baked&&(inView||budget-->0)){f.baked=f.kind==='water'?bakeWater(l):BAKE[f.kind](l);baked++;}if(mode==='anim'){if(f.kind==='water'&&inView)animateWater(ctx,l,{members:l.members},time);continue;}if(!inView||!f.baked)continue;const b=f.baked;ctx.drawImage(b.cv,l.x-b.ox,l.y-b.oy);if(f.kind==='water'&&mode==='all')animateWater(ctx,l,b,time);}
  // Free far-away baked patches so a long run never holds every canvas.
  if(baked>140){const mx=(view.x0+view.x1)/2,my=(view.y0+view.y1)/2;for(const f of features(scene))if(f.baked&&Math.hypot(f.l.x-mx,f.l.y-my)>2600){f.baked=null;baked--;}}
}
function animateWater(ctx,l,b,t){
  const ms=b.members;ctx.save();ctx.beginPath();for(const m of ms){const rx=prop(m,'rx',400),ry=prop(m,'ry',250),seed=prop(m,'seed',1);for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,r=shapeR(a,seed)*.97,x=m.x+Math.cos(a)*rx*r,y=m.y+Math.sin(a)*ry*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}ctx.clip('nonzero');ctx.lineCap='round';
  // Drifting ripple rings, wind streaks and sun glints (upper-left sun), spread over the members.
  ms.forEach((m,k)=>{const rx=prop(m,'rx',400),ry=prop(m,'ry',250);
    for(let i=0;i<4;i++){const ph=(t*.18+i/4+k*.31)%1,a=i*2.4+k,d=.2+.5*((i*.37+k*.13)%1),x=m.x+Math.cos(a)*rx*d,y=m.y+Math.sin(a)*ry*d,s=8+ph*40;ctx.globalAlpha=(1-ph)*.35;ctx.strokeStyle='#d9e8ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,s,s*.45,0,0,7);ctx.stroke();}
    for(let i=0;i<5;i++){const x=m.x-rx+((i*137+k*71+t*14)%(rx*2)),y=m.y-ry*.7+((i*53+k*29)%(ry*1.4));ctx.globalAlpha=.12+.08*Math.sin(t*1.3+i+k);ctx.strokeStyle='#eef6ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+18,y-3,x+38,y);ctx.stroke();}});
  ctx.restore();
}
const cache=new WeakMap();
function terrain(ctx,scene){let t=cache.get(scene);if(!t){t={macro:paintMacro(scene),grain:ctx.createPattern(paintGrain(),'repeat')};cache.set(scene,t);}return t;}
export function drawDesertGround(ctx,scene,view,time=0,mode='all'){
  if(mode==='anim')return drawFeatures(ctx,scene,view,time,'anim');
  const t=terrain(ctx,scene),{x0,y0,x1,y1}=view;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality=gfx.smoothing;
  const sx=Math.max(0,x0/SCALE),sy=Math.max(0,y0/SCALE),sw=Math.min(t.macro.width,x1/SCALE)-sx,sh=Math.min(t.macro.height,y1/SCALE)-sy;
  if(sw>0&&sh>0)ctx.drawImage(t.macro,sx,sy,sw,sh,sx*SCALE,sy*SCALE,sw*SCALE,sh*SCALE);
  ctx.fillStyle=t.grain;ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.restore();drawFeatures(ctx,scene,view,time,mode);
}
// Prepare the starting view while the loading screen is still visible; yield between patches.
export async function prepareTerrain(ctx,scene,view){
 terrain(ctx,scene);
 for(const f of features(scene)){
  const l=f.l,rx=prop(l,'rx',300)*1.4,ry=prop(l,'ry',200)*1.4,M=900;
  if(f.baked||l.x+rx<view.x0-M||l.x-rx>view.x1+M||l.y+ry<view.y0-M||l.y-ry>view.y1+M)continue;
  f.baked=BAKE[f.kind](l);baked++;await new Promise(r=>setTimeout(r,0));
 }
}
// Sun shadows: each sprite's silhouette, blurred once and cached, sheared away from the sun (upper left).
const shadows=new Map();
function silhouette(img,key){let s=shadows.get(key);if(s)return s;const pad=6,cv=document.createElement('canvas');cv.width=img.width+pad*2;cv.height=img.height+pad*2;const c=cv.getContext('2d');c.filter='blur(3px)';c.drawImage(img,pad,pad);c.filter='none';c.globalCompositeOperation='source-in';c.fillStyle='#3a2410';c.fillRect(0,0,cv.width,cv.height);s={cv,pad};shadows.set(key,s);return s;}
export function drawPropShadows(ctx,props,images,anchorOf,visible){
  ctx.save();
  for(const p of props){
    if(!p.key||p.layer==='ground'||!visible(p.x,p.y))continue;const img=images.get(p.key);if(!img)continue;const a=anchorOf(p.key)??[img.width/2,img.height-4],s=silhouette(img,p.key),k=p.scale;
    // Contact shade anchors the prop to the sand; the long shadow falls down-right.
    if(p.footprint){ctx.globalAlpha=.32;ctx.fillStyle='#3a2410';ctx.beginPath();ctx.ellipse(p.x+4,p.y+2,Math.min(90,img.width*k*.32),Math.min(40,img.width*k*.13),0,0,7);ctx.fill();}
    ctx.globalAlpha=.26;ctx.transform(k,0,SUN.x*k,SUN.y*k,p.x,p.y);
    ctx.drawImage(s.cv,-a[0]-s.pad,-a[1]-s.pad);ctx.restore();ctx.save();
  }
  ctx.restore();
}
// Oct 16 (user: "make a bunch of small things into bigger assets"): every static prop shadow and every flat ground-layer
// prop is baked once into 768px world chunks, so a frame draws a few chunk images instead of hundreds of blurred,
// sheared shadows and tufts. Chunks bake lazily around the camera (all in-view ones at once, one look-ahead per frame)
// and far chunks are freed. Big sprites (pyramids) get their silhouette blurred at reduced size so the bake never hitches.
const CHUNK=768,KEEP=28,chunkCache=new WeakMap();
function bigSilhouette(img,key){let s=shadows.get(key);if(s)return s;const k=Math.min(1,700/Math.max(img.width,img.height)),pad=6,cv=document.createElement('canvas');cv.width=Math.ceil(img.width*k)+pad*2;cv.height=Math.ceil(img.height*k)+pad*2;const c=cv.getContext('2d');c.filter='blur(3px)';c.drawImage(img,pad,pad,img.width*k,img.height*k);c.filter='none';c.globalCompositeOperation='source-in';c.fillStyle='#3a2410';c.fillRect(0,0,cv.width,cv.height);s={cv,pad,k};shadows.set(key,s);return s;}
function chunkIndex(scene,images,anchorOf){
  let idx=chunkCache.get(scene);if(idx)return idx;idx={chunks:new Map(),baked:0};chunkCache.set(scene,idx);
  const add=(cx,cy,item)=>{const k=cx+','+cy;let c=idx.chunks.get(k);if(!c)idx.chunks.set(k,c={cx,cy,items:[],cv:null,used:0});c.items.push(item);};
  scene.props.forEach((p,order)=>{if(!p.key||p.trialGate)return;const img=images.get(p.key);if(!img)return;const a=anchorOf(p.key)??[img.width/2,img.height-4],k=p.scale??1;
    let x0,y0,x1,y1;
    if(p.layer==='ground'){x0=p.x-a[0]*k;y0=p.y-a[1]*k;x1=x0+img.width*k;y1=y0+img.height*k;}
    else{const h=a[1]*k,w=img.width*k;x0=p.x-a[0]*k+Math.min(0,SUN.x*h)-20;x1=p.x+(img.width-a[0])*k+Math.max(0,-SUN.x*h)+90;y0=p.y+SUN.y*h-20;y1=p.y+Math.max(40,(img.height-a[1])*k)+20;}
    for(let cx=Math.floor(x0/CHUNK);cx<=Math.floor(x1/CHUNK);cx++)for(let cy=Math.floor(y0/CHUNK);cy<=Math.floor(y1/CHUNK);cy++)add(cx,cy,{p,img,a,order});});
  return idx;
}
function bakeChunk(c){
  const cv=document.createElement('canvas');cv.width=cv.height=CHUNK;const g=cv.getContext('2d');g.translate(-c.cx*CHUNK,-c.cy*CHUNK);
  const ground=c.items.filter(i=>i.p.layer==='ground').sort((p,q)=>p.order-q.order),depth=c.items.filter(i=>i.p.layer!=='ground');
  for(const {p,img,a} of ground){const k=p.scale??1;g.drawImage(img,p.x-a[0]*k,p.y-a[1]*k,img.width*k,img.height*k);}
  for(const {p,img,a} of depth){const k=p.scale??1;if(p.key.startsWith('Pyramid'))continue;  // pyramids carry their own baked ground shadow decal

    if(p.footprint){g.globalAlpha=.32;g.fillStyle='#3a2410';g.beginPath();g.ellipse(p.x+4,p.y+2,Math.min(90,img.width*k*.32),Math.min(40,img.width*k*.13),0,0,7);g.fill();}
    const big=img.width*img.height>400000,s=big?bigSilhouette(img,p.key):silhouette(img,p.key),sk=s.k??1;g.save();g.globalAlpha=.26;g.transform(k,0,SUN.x*k,SUN.y*k,p.x,p.y);g.drawImage(s.cv,-a[0]-s.pad/sk,-a[1]-s.pad/sk,s.cv.width/sk,s.cv.height/sk);g.restore();}
  g.globalAlpha=1;return cv;
}
export function drawStaticChunks(ctx,scene,images,anchorOf,view,frame=0){
  const idx=chunkIndex(scene,images,anchorOf),x0=Math.floor(view.x0/CHUNK),x1=Math.floor(view.x1/CHUNK),y0=Math.floor(view.y0/CHUNK),y1=Math.floor(view.y1/CHUNK);
  for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++){const c=idx.chunks.get(cx+','+cy);if(!c)continue;if(!c.cv){c.cv=bakeChunk(c);idx.baked++;}c.used=frame;ctx.drawImage(c.cv,cx*CHUNK,cy*CHUNK);}
  // look ahead: bake one neighbouring chunk per frame
  outer:for(let cx=x0-1;cx<=x1+1;cx++)for(let cy=y0-1;cy<=y1+1;cy++){const c=idx.chunks.get(cx+','+cy);if(c&&!c.cv){c.cv=bakeChunk(c);c.used=frame;idx.baked++;break outer;}}
  if(idx.baked>KEEP){const old=[...idx.chunks.values()].filter(c=>c.cv&&c.used<frame-2).sort((p,q)=>p.used-q.used);for(const c of old.slice(0,idx.baked-KEEP)){c.cv=null;idx.baked--;}}
}
// Warm sun grade + slow diagonal light shafts in screen space.
export function drawSunLight(ctx,width,height,time,dpr){
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);const cheap=gfx.grade!=='full';ctx.globalCompositeOperation=cheap?'source-over':'soft-light';
  // Cheap grade (medium/low quality): a light alpha tint instead of soft-light, which forces a full-frame copy on many GPUs.
  const g=ctx.createLinearGradient(0,0,width,height);if(cheap){g.addColorStop(0,'rgba(255,214,140,.12)');g.addColorStop(.6,'rgba(255,190,110,.03)');g.addColorStop(1,'rgba(90,50,30,.12)');}else{g.addColorStop(0,'rgba(255,214,140,.55)');g.addColorStop(.6,'rgba(255,190,110,.12)');g.addColorStop(1,'rgba(90,50,30,.35)');}ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation='screen';
  for(let i=0;i<(gfx.shafts?4:0);i++){const x=((i*.31+time*.006)%1.3-.15)*width,w=width*(.07+.04*(i%2)),a=.05+.03*Math.sin(time*.4+i*1.7);ctx.save();ctx.translate(x,-40);ctx.rotate(-.55);const lg=ctx.createLinearGradient(-w,0,w,0);lg.addColorStop(0,'rgba(255,226,160,0)');lg.addColorStop(.5,`rgba(255,226,160,${a})`);lg.addColorStop(1,'rgba(255,226,160,0)');ctx.fillStyle=lg;ctx.fillRect(-w,0,w*2,height*2.4);ctx.restore();}
  ctx.globalCompositeOperation='source-over';const v=ctx.createRadialGradient(width/2,height/2,Math.min(width,height)*.35,width/2,height/2,Math.max(width,height)*.75);v.addColorStop(0,'rgba(60,30,10,0)');v.addColorStop(1,'rgba(60,30,10,.32)');ctx.fillStyle=v;ctx.fillRect(0,0,width,height);
  ctx.restore();
}

// Oct 16 (user): the static ground (terrain, patches, water, causeways, shadows, flat props) is pre-rendered at build
// time into 1024px WebP tiles (maps/ground/, baked by the game itself via veyrathDebug.bakeGroundTiles() + tools/bake-server.py).
// A signature of the loaded scene guards against stale tiles after the map is regenerated.
export function mapSignature(scene){let h=2166136261;const mix=v=>{const t=String(v);for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}};
  mix(scene.width);mix(scene.height);for(const p of scene.props)mix((p.key??'')+Math.round(p.x)+','+Math.round(p.y)+(p.layer??''));for(const l of scene.landmarks??[])mix(l.name+Math.round(l.x)+','+Math.round(l.y));return (h>>>0).toString(16);}
export const GROUND_TILE=1024;
export function renderGroundTile(ctx,scene,images,anchorOf,tx,ty,frame=0){
  const view={x0:tx*GROUND_TILE,y0:ty*GROUND_TILE,x1:(tx+1)*GROUND_TILE,y1:(ty+1)*GROUND_TILE};
  ctx.fillStyle='#b09868';ctx.fillRect(0,0,GROUND_TILE,GROUND_TILE);ctx.save();ctx.translate(-view.x0,-view.y0);drawDesertGround(ctx,scene,view,0,'static');drawStaticChunks(ctx,scene,images,anchorOf,view,frame);ctx.restore();
}
export function createGroundTiles(info,load){
  const tiles=new Map();let frame=0;
  return {info,
    ready(view){const T=info.tile;for(let x=Math.floor(view.x0/T);x<=Math.floor(view.x1/T);x++)for(let y=Math.floor(view.y0/T);y<=Math.floor(view.y1/T);y++){if(x<0||y<0||x>=info.cols||y>=info.rows)continue;const t=tiles.get(x+','+y);if(!t?.img)return false;}return true;},
    draw(ctx,view){frame++;const T=info.tile,x0=Math.floor(view.x0/T),x1=Math.floor(view.x1/T),y0=Math.floor(view.y0/T),y1=Math.floor(view.y1/T);
      for(let x=x0-1;x<=x1+1;x++)for(let y=y0-1;y<=y1+1;y++){if(x<0||y<0||x>=info.cols||y>=info.rows)continue;const k=x+','+y;let t=tiles.get(k);
        if(!t){t={img:null,used:frame};tiles.set(k,t);load(`maps/ground/${x}_${y}.webp?s=${info.signature}`).then(img=>{t.img=img;}).catch(()=>{t.failed=true;});}
        t.used=frame;if(t.img&&x>=x0&&x<=x1&&y>=y0&&y<=y1)ctx.drawImage(t.img,x*T,y*T);}
      if(tiles.size>24)for(const [k,t] of tiles)if(t.img&&t.used<frame-120){t.img.close?.();tiles.delete(k);}
    }};
}
