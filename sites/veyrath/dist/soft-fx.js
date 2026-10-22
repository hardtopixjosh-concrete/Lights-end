// Oct 19 (user: "a lot of stuff to bloom or have blending with particles, less hard lines"): soft particle system shared by
// the Ranger and Mage weapon visuals. Particles are cached radial-gradient sprites (no per-draw gradients), drawn additive
// ('glow') or normal ('smoke'/'blood'), with a colour ramp over their life. Visual only: a pool is ticked from its owner's
// simulation clock (tickSoft with the owner's dt), so a paused game stays still.
const SPR=new Map();
function sprite(color,soft){const key=color+'|'+soft;let s=SPR.get(key);if(s)return s;
 if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');if(!g)return null;
 const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,color);gr.addColorStop(soft?.35:.55,color+(soft?'99':'cc'));gr.addColorStop(1,color+'00');g.fillStyle=gr;g.fillRect(0,0,64,64);
 SPR.set(key,c);if(SPR.size>400)SPR.delete(SPR.keys().next().value);return c;}
/* Colour ramps: stop list over life 0..1. Hex colours only (#rrggbb). */
export const RAMPS={
 fire:['#fff6d8','#ffd060','#ff8a2a','#d8380f','#5a1a0a'],
 fireHot:['#ffffff','#fff0b0','#ffb040','#ff5a14'],
 smoke:['#5a4a40','#3a302a','#1e1814'],
 toxic:['#e4ffc8','#a4ff5a','#4fd02a','#1e5a10'],
 toxicFog:['#7dff5a','#3a8f2a','#16300c'],
 blood:['#ff8aa0','#d0284f','#7a0c26','#2a0410'],
 bloodDark:['#a8173a','#5a0818','#1a0206'],
 bloodFog:['#5a0818','#30040c','#0e0204'],
 frost:['#ffffff','#d6f4ff','#8fd8f5','#3a8fb8'],
 storm:['#ffffff','#e2d6ff','#9d7bff','#4a2fb0'],
 blue:['#ffffff','#bfe0ff','#4f9bff','#1a3fd0'],
 purple:['#ffffff','#efdcff','#b35cff','#3a0e5a'],
 gold:['#ffffff','#fff0c8','#ffc24a','#a86a10'],
 shadow:['#5a6a9a','#1a2448','#04081a']};
export function createSoft(){return {list:[],clock:null};}
/* o: {x,y,z?,vx,vy,vz?,life,size,grow?(size/s),ramp,blend:'glow'|'normal',alpha?,drag?,g?(z gravity, + = falls),squash?} */
export function emitSoft(pool,o){if(!pool||pool.list.length>=900)return;pool.list.push({z:0,vz:0,grow:0,alpha:1,drag:0,g:0,blend:'glow',...o,age:0});}
export function burstSoft(pool,x,y,n,{z=0,speed=[40,160],up=[0,60],life=[.3,.7],size=[6,16],grow=0,ramp='fire',blend='glow',alpha=1,drag=2,g=0,spread=0,squash=.65,angle=null,arc=Math.PI}={}){
 for(let i=0;i<n;i++){const a=angle==null?Math.random()*Math.PI*2:angle+(Math.random()*2-1)*arc,s=speed[0]+Math.random()*(speed[1]-speed[0]),r=spread*Math.sqrt(Math.random()),ra=Math.random()*Math.PI*2;
  emitSoft(pool,{x:x+Math.cos(ra)*r,y:y+Math.sin(ra)*r*squash,z,vx:Math.cos(a)*s,vy:Math.sin(a)*s*squash,vz:up[0]+Math.random()*(up[1]-up[0]),life:life[0]+Math.random()*(life[1]-life[0]),size:size[0]+Math.random()*(size[1]-size[0]),grow,ramp,blend,alpha,drag,g});}}
export function tickSoft(pool,now){if(!pool)return;const dt=pool.clock==null?0:Math.max(0,Math.min(.1,now-pool.clock));pool.clock=now;if(!dt)return;
 const L=pool.list;for(let i=L.length-1;i>=0;i--){const p=L[i];p.age+=dt;if(p.age>=p.life){L[i]=L[L.length-1];L.pop();continue;}const d=Math.exp(-p.drag*dt);p.vx*=d;p.vy*=d;p.vz=p.vz*d-p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z=p.z+p.vz*dt;if(p.floor!=null&&p.z<p.floor){p.z=p.floor;p.vz=0;p.vx*=.3;p.vy*=.3;}p.size=Math.max(.5,p.size+p.grow*dt);}}
function rampColor(ramp,k){const R=RAMPS[ramp]??RAMPS.fire,f=Math.min(.999,Math.max(0,k))*(R.length-1),i=Math.floor(f);return [R[i],R[Math.min(R.length-1,i+1)],f-i];}
/* draw: blend 'glow' adds light (bloom-like), 'normal' paints (smoke, blood). Each particle fades in fast and out over its life. */
export function drawSoft(ctx,pool,{only=null}={}){if(!pool?.list.length)return;const op=ctx.globalCompositeOperation,pa=ctx.globalAlpha;
 for(const pass of ['normal','glow']){if(only&&only!==pass)continue;ctx.globalCompositeOperation=pass==='glow'?'lighter':'source-over';
  for(const p of pool.list){if((p.blend==='glow')!==(pass==='glow'))continue;const k=p.age/p.life,[c1,c2,f]=rampColor(p.ramp,k),fade=Math.min(1,k*8)*(1-k)*(p.alpha??1),S=p.size*2,x=p.x-p.size,y=p.y-p.z-p.size;
   const s1=sprite(c1,pass!=='glow');if(!s1)continue;ctx.globalAlpha=fade*(1-f);ctx.drawImage(s1,x,y,S,S);const s2=f>.02?sprite(c2,pass!=='glow'):null;if(s2){ctx.globalAlpha=fade*f;ctx.drawImage(s2,x,y,S,S);}}}
 ctx.globalCompositeOperation=op;ctx.globalAlpha=pa;}
/* soft glow blob straight away (no particle): cached sprite at x,y with radius r */
export function softGlow(ctx,x,y,r,color,alpha=1,{add=true,squash=1}={}){const s=sprite(color,!add);if(!s||r<=0)return;const op=ctx.globalCompositeOperation,pa=ctx.globalAlpha;ctx.globalCompositeOperation=add?'lighter':'source-over';ctx.globalAlpha=alpha;ctx.drawImage(s,x-r,y-r*squash,r*2,r*2*squash);ctx.globalCompositeOperation=op;ctx.globalAlpha=pa;}
