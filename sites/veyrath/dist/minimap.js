import {WORLD} from './simulation.js?v=fx-260';
import {shapeR} from './map-render.js?v=fx-260';
// Oct 16 (user): round minimap in the map's own colours, plus a full big map on M.
// The whole world is baked once into a small terrain image (1 px = TERRAIN world px) from the same landmarks and props
// the ground renderer uses; both maps draw from it.
const TERRAIN=8;
const GROUND={meadow:'#8fae5a',clay:'#cf7a3c',path:'#e6cf9c',cracks:'#9a4f37',crater:'#a07c55',plaza:'#c9b28a',grass:'#a5a865',rubble:'#bb9a6c',scorch:'#5a4232'};
function propColor(k){
  if(!k)return null;
  if(k.startsWith('Pyramid'))return '#c9a15f';if(k.startsWith('Roof'))return '#6b4a32';if(k.startsWith('Wall-H5'))return '#5b4330';
  if(k.startsWith('Tree-D'))return '#557a3e';if(k.startsWith('Tree-A'))return '#4f8a3a';if(k.startsWith('Tree-B'))return '#7a2f2a';if(k.startsWith('Tree'))return '#3f6e2e';
  if(k.startsWith('Wall-B'))return '#8c7048';if(k.startsWith('Wall')||k.startsWith('Door'))return '#9c8058';
  if(/^Misc-B6[2-6]/.test(k))return '#6b4a2e';if(k.startsWith('Flora-B')||k.startsWith('Misc-E'))return '#c98a45';if(k.startsWith('Flora-A'))return '#3f9aa0';if(k.startsWith('Flora'))return null;
  if(k.startsWith('Stone'))return '#8f8676';if(k.startsWith('Misc-D')||k.startsWith('Misc-A1'))return '#e2dccb';
  return '#8a6d4c';
}
const prop=(l,k,d)=>l.properties?.[k]??d;
export function buildTerrain(scene){
  const w=Math.ceil(WORLD.width/TERRAIN),h=Math.ceil(WORLD.height/TERRAIN),cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');
  c.fillStyle='#d2a76c';c.fillRect(0,0,w,h);
  const blob=(l,k=1)=>{const rx=prop(l,'rx',0)/TERRAIN,ry=prop(l,'ry',0)/TERRAIN,seed=prop(l,'seed',1),x=l.x/TERRAIN,y=l.y/TERRAIN;c.beginPath();for(let i=0;i<=36;i++){const a=i/36*Math.PI*2,r=shapeR(a,seed)*k;i?c.lineTo(x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r):c.moveTo(x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r);}c.closePath();};
  const ls=scene.landmarks??[];
  for(const kind of ['meadow','clay','path','cracks','crater','grass','rubble','scorch','plaza'])for(const l of ls)if(l.name.split('-')[0]===kind&&prop(l,'rx',0)){c.fillStyle=GROUND[kind];c.globalAlpha=kind==='rubble'||kind==='grass'?.55:.95;blob(l);c.fill();}
  c.globalAlpha=1;const water=ls.filter(l=>l.name.startsWith('water-'));
  c.fillStyle='#7aa4e0';for(const l of water){blob(l,1.06);c.fill();}c.fillStyle='#2552b0';for(const l of water){blob(l);c.fill();}
  for(const p of scene.props){const col=propColor(p.key);if(!col)continue;const s=(p.scale??1),r=p.key.startsWith('Pyramid')?0:Math.max(.8,Math.min(5,(p.key.startsWith('Tree')?34:p.key.startsWith('Wall')||p.key.startsWith('Roof')?30:18)*s/TERRAIN));c.fillStyle=col;
    if(p.key.startsWith('Pyramid')){const n=p.key.includes('Big')?11*.85:7*.8,hw=n*64*s/TERRAIN,hh=n*32*s/TERRAIN,x=p.x/TERRAIN,y=p.y/TERRAIN;c.beginPath();c.moveTo(x-hw,y);c.lineTo(x,y-hh);c.lineTo(x+hw,y);c.lineTo(x,y+hh);c.fill();c.fillStyle='#e0bf82';c.beginPath();c.moveTo(x,y-hh);c.lineTo(x+hw,y);c.lineTo(x,y+hh);c.fill();continue;}
    c.beginPath();c.ellipse(p.x/TERRAIN,p.y/TERRAIN,r,r*.7,0,0,Math.PI*2);c.fill();}
  return cv;
}
export const mapPoint=(p,center,size=196,range=900)=>({x:size/2+(p.x-center.x)*size/(2*range),y:size/2+(p.y-center.y)*size/(2*range)});
export function createMinimap(){return {seen:new Set(),forge:false,elapsed:0,range:900,terrain:null,scene:null};}
const ICONS={shrine:'✦',anchor:'◇',leader:'◆',boss:'♛',majorBoss:'♛',merchant:'$',rift:'◈',trial:'⚑',camp:'⛺',healPool:'✚'};
function markerList(m,p,enemies,events){
  const active=[...enemies.filter(e=>e.state==='alive'&&['leader','boss'].includes(e.role)).map(e=>({...e,key:'enemy-'+e.id,kind:e.role})),...events.filter(e=>e.active!==false&&e.kind!=='secretRealm')];
  for(const e of active)if(Math.hypot(e.x-p.x,e.y-p.y)<700)m.seen.add(e.key??e.id);
  return active.filter(e=>m.seen.has(e.key??e.id)).map(e=>({x:e.x,y:e.y,icon:ICONS[e.kind]??'◇',color:e.status==='cooldown'?'#8a8676':e.status==='reward'?'#ffe1a0':e.kind==='boss'?'#ff6f66':e.kind==='leader'?'#ffb35c':'#e6c2ff'}));
}
function drawIcon(ctx,x,y,icon,color,px){ctx.font=`bold ${px}px Georgia`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#1a120bcc';ctx.strokeText(icon,x,y);ctx.fillStyle=color;ctx.fillText(icon,x,y);}
function drawArrow(ctx,x,y,row,s=1){ctx.save();ctx.translate(x,y);ctx.rotate((row??0)*Math.PI/4);ctx.scale(s,s);ctx.fillStyle='#fff7e0';ctx.strokeStyle='#2a1a0c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-6,-5);ctx.lineTo(-3,0);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
function terrainFor(m,scene){if(!m.terrain||m.scene!==scene){m.terrain=buildTerrain(scene);m.scene=scene;}return m.terrain;}
export function drawMinimap(canvas,m,p,props,enemies,forge,dt,events=[],scene=null){
  m.elapsed+=dt;if(m.elapsed<.1)return;m.elapsed=0;
  if(Math.hypot(p.x-forge.x,p.y-forge.y)<500)m.forge=true;
  const ctx=canvas.getContext('2d'),size=canvas.width,R=size/2-9,range=m.range,at=x=>mapPoint(x,p,size,range);ctx.clearRect(0,0,size,size);
  ctx.save();ctx.beginPath();ctx.arc(size/2,size/2,R,0,Math.PI*2);ctx.clip();
  ctx.fillStyle='#c9a06a';ctx.fillRect(0,0,size,size);
  if(scene){const t=terrainFor(m,scene),k=size/(2*range),sx=(p.x-range)/TERRAIN,sy=(p.y-range)/TERRAIN;ctx.imageSmoothingEnabled=true;ctx.drawImage(t,sx,sy,range*2/TERRAIN,range*2/TERRAIN,0,0,size,size);}
  // soft inner vignette so the disc reads as a lens
  const g=ctx.createRadialGradient(size/2,size/2,R*.55,size/2,size/2,R);g.addColorStop(0,'#0000');g.addColorStop(1,'#2a170a88');ctx.fillStyle=g;ctx.fillRect(0,0,size,size);
  const edge=(pt)=>{const dx=pt.x-size/2,dy=pt.y-size/2,d=Math.hypot(dx,dy),lim=R-10;return d>lim?{x:size/2+dx/d*lim,y:size/2+dy/d*lim,clamped:true}:{...pt,clamped:false};};
  if(m.forge){const q=edge(at(forge));drawIcon(ctx,q.x,q.y,'⚒','#ffce72',15);}
  for(const mk of markerList(m,p,enemies,events)){const q=edge(at(mk));if(q.clamped&&!['♛','⚑'].includes(mk.icon))continue;drawIcon(ctx,q.x,q.y,mk.icon,mk.color,14);}
  drawArrow(ctx,size/2,size/2,p.row);ctx.restore();
  // ornate bronze ring with ticks and a north mark
  ctx.save();ctx.translate(size/2,size/2);
  const ring=ctx.createLinearGradient(-R,-R,R,R);ring.addColorStop(0,'#f1d79a');ring.addColorStop(.5,'#9a6a32');ring.addColorStop(1,'#e6c27a');
  ctx.lineWidth=7;ctx.strokeStyle='#2a1a0c';ctx.beginPath();ctx.arc(0,0,R+3,0,Math.PI*2);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle=ring;ctx.beginPath();ctx.arc(0,0,R+3,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='#f6e2b088';ctx.beginPath();ctx.arc(0,0,R-1,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2,l=i%6===0?7:3;ctx.strokeStyle=i%6===0?'#f6e2b0':'#c79a5a';ctx.lineWidth=i%6===0?2:1;ctx.beginPath();ctx.moveTo(Math.cos(a)*(R+6),Math.sin(a)*(R+6));ctx.lineTo(Math.cos(a)*(R+6-l),Math.sin(a)*(R+6-l));ctx.stroke();}
  ctx.fillStyle='#2a1a0c';ctx.beginPath();ctx.arc(0,-R-3,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f6e2b0';ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('N',0,-R-3);
  ctx.restore();
}
// Full map (M): whole world fitted to the canvas, revealed markers, player arrow, legend.
export function drawBigMap(canvas,m,p,enemies,forge,events,scene){
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,t=terrainFor(m,scene),k=Math.min((W-40)/WORLD.width,(H-70)/WORLD.height),ox=(W-WORLD.width*k)/2,oy=(H-WORLD.height*k)/2+10;
  ctx.clearRect(0,0,W,H);ctx.drawImage(t,ox,oy,WORLD.width*k,WORLD.height*k);
  ctx.lineWidth=6;ctx.strokeStyle='#2a1a0c';ctx.strokeRect(ox-3,oy-3,WORLD.width*k+6,WORLD.height*k+6);ctx.lineWidth=3;const ring=ctx.createLinearGradient(0,0,W,H);ring.addColorStop(0,'#f1d79a');ring.addColorStop(.5,'#9a6a32');ring.addColorStop(1,'#e6c27a');ctx.strokeStyle=ring;ctx.strokeRect(ox-3,oy-3,WORLD.width*k+6,WORLD.height*k+6);
  const at=pt=>({x:ox+pt.x*k,y:oy+pt.y*k});
  if(m.forge){const q=at(forge);drawIcon(ctx,q.x,q.y,'⚒','#ffce72',22);}
  for(const mk of markerList(m,p,enemies,events)){const q=at(mk);drawIcon(ctx,q.x,q.y,mk.icon,mk.color,20);}
  const q=at(p);drawArrow(ctx,q.x,q.y,p.row,1.6);
  ctx.fillStyle='#f6e2b0';ctx.font='bold 18px Georgia';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText('THE SUNDERED EXPANSE',W/2,oy-14);
  ctx.font='12px Georgia';ctx.fillStyle='#e8d6ad';ctx.fillText('⚒ forge   ✦ shrine   ⛺ camp   $ merchant   ◈ rift   ⚑ trial   ♛ boss      M or Esc to close',W/2,H-10);
}
