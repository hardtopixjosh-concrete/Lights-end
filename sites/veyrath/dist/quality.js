// Graphics quality (Oct 15, performance batch). Levels trade pixel density, shader-VFX resolution, bloom and
// Canvas shadows for frame rate. 'auto' starts from a device guess and steps down one level when the measured
// frame interval stays under ~45 fps; the learned level is remembered per browser. Also hosts a per-cell tint
// cache so CSS-filtered enemy sprites (chilled, enraged, elite, hurt flash) don't run a live ctx.filter per draw.
export const LEVELS={
// res = internal render scale (canvas pixels per CSS px after the DPR cap). grade 'full' = soft-light sun grade
 // (needs a full-frame destination read on GPUs without advanced blend support), 'cheap' = plain alpha tint.
 high:{dpr:2,res:1,vfxScale:1,post:true,bloomQuality:5,blur:6,shadows:true,grade:'full',smoothing:'high',shafts:true,particleDensity:1,particleCap:900},
 medium:{dpr:1.25,res:1,vfxScale:.6,post:true,bloomQuality:3,blur:4,shadows:false,grade:'cheap',smoothing:'low',shafts:true,particleDensity:.7,particleCap:600},
 low:{dpr:1,res:1,vfxScale:.5,post:false,bloomQuality:2,blur:3,shadows:false,grade:'cheap',smoothing:'low',shafts:false,particleDensity:.45,particleCap:360},
 lowest:{dpr:1,res:.7,vfxScale:.5,post:false,bloomQuality:2,blur:3,shadows:false,grade:'cheap',smoothing:'low',shafts:false,particleDensity:.25,particleCap:200}};
// Oct 16 (user): phones started on 'low' (no bloom) and auto could only step down, so a capable phone never got the
// spell glow back. Touch devices now start on 'medium' (bloom + shader VFX kept), auto also steps UP after sustained
// smooth play, and the auto key was renamed so phones stuck on a remembered 'low' get a fresh start.
const ORDER=['high','medium','low','lowest'],KEY='veyrath.quality',AUTO_KEY='veyrath.quality.auto2';
export const gfx={shadows:true,grade:'full',smoothing:'high',shafts:true,particleDensity:1,particleCap:900};
const read=k=>{try{return localStorage.getItem(k);}catch{return null;}},write=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
function guess(){const mem=navigator.deviceMemory??8,cores=navigator.hardwareConcurrency??8,px=screen.width*screen.height*(devicePixelRatio||1)**2;if(matchMedia('(pointer:coarse)').matches)return 'medium';return mem<=4||cores<=4||px>4.2e6?'medium':'high';}

export function createQuality(onChange=()=>{}){
 let mode=read(KEY);if(!['auto',...ORDER].includes(mode))mode='auto';
 let autoLevel=read(AUTO_KEY);if(!ORDER.includes(autoLevel))autoLevel=guess();
 // ceil = best level index auto may climb back to this session; a level that proved too slow is not retried until reload.
 let acc=0,n=0,slow=0,fast=0,grace=3,ceil=0;
 const q={
  get mode(){return mode;},get level(){return mode==='auto'?autoLevel:mode;},get settings(){return LEVELS[q.level];},
  setMode(m){if(!['auto',...ORDER].includes(m))return;mode=m;write(KEY,m);if(m==='auto'){grace=3;acc=n=slow=0;}apply();},
  // Feed real frame intervals (unpaused, visible tab). Two consecutive slow 2s windows step auto down a level;
  // five consecutive smooth (~58+ fps) windows step it up one, never above a level that was too slow this session.
  sample(elapsed){if(mode!=='auto'||!(elapsed>0)||elapsed>.25)return;if(grace>0){grace-=elapsed;return;}acc+=elapsed;n++;if(acc<2)return;
   const avg=acc/n;acc=n=0;const i=ORDER.indexOf(autoLevel);
   if(avg<=1/45){slow=0;if(avg<=1/57&&i>ceil&&++fast>=5){fast=0;autoLevel=ORDER[i-1];write(AUTO_KEY,autoLevel);grace=2;apply();}else if(avg>1/57)fast=0;return;}
   fast=0;if(++slow<2)return;slow=0;if(i>=ORDER.length-1)return;
   ceil=i+1;autoLevel=ORDER[i+1];write(AUTO_KEY,autoLevel);grace=2;apply();}
 };
 function apply(){Object.assign(gfx,{shadows:q.settings.shadows,grade:q.settings.grade,smoothing:q.settings.smoothing,shafts:q.settings.shafts,particleDensity:q.settings.particleDensity,particleCap:q.settings.particleCap});onChange(q.settings,q.level);}
 Object.assign(gfx,{shadows:q.settings.shadows,grade:q.settings.grade,smoothing:q.settings.smoothing,shafts:q.settings.shafts,particleDensity:q.settings.particleDensity,particleCap:q.settings.particleCap});
 return q;
}

// ---- tint cache: one filtered 128px cell per (image, filter, frame, row), LRU-bounded ----
const ids=new WeakMap();let nextId=1,budget=6;const cells=new Map(),MAX_CELLS=700;
let tintNew=0;
export function tintFrame(){budget=6;}
export function takeTintStats(){const n=tintNew;tintNew=0;return n;}
function cell(img,filter,sx,sy,size){
 let id=ids.get(img);if(!id){id=nextId++;ids.set(img,id);}
 const key=id+'|'+filter+'|'+sx+'|'+sy;let c=cells.get(key);
 if(c){cells.delete(key);cells.set(key,c);return c;}
 if(budget<=0)return null;budget--;tintNew++;
 c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.filter=filter;g.drawImage(img,sx,sy,size,size,0,0,size,size);
 cells.set(key,c);if(cells.size>MAX_CELLS)cells.delete(cells.keys().next().value);return c;
}
// Draws one sheet cell honoring ctx.filter through the cache (ctx.filter is reset to 'none' for the draw).
export function drawCell(ctx,img,sx,sy,size,dx,dy,dw,dh){
 const k=img.cellScale;if(k){sx*=k;sy*=k;size*=k;}
 const f=ctx.filter;if(!f||f==='none'){ctx.drawImage(img,sx,sy,size,size,dx,dy,dw,dh);return;}
 ctx.filter='none';const c=cell(img,f,sx,sy,size);if(c)ctx.drawImage(c,0,0,size,size,dx,dy,dw,dh);else ctx.drawImage(img,sx,sy,size,size,dx,dy,dw,dh);ctx.filter=f;
}

// Oct 16 (user): bosses are drawn from a smooth "HD" cache instead of stretching the 128px pixel-art
// frame 3-4x. Each used frame is supersampled (x4 with high-quality smoothing, then down to x2) once,
// tint included, and kept in a small LRU.
const hdCells=new Map(),HD_MAX=160;let hdIds=new WeakMap(),hdNext=1;
export function drawCellHD(ctx,img,sx,sy,size,dx,dy,dw,dh){
 const k=img.cellScale;if(k){sx*=k;sy*=k;size*=k;}
 // Oct 16: sheets rendered at high resolution (e.g. the golem Ravager, 160px cells) are already smooth; draw directly.
 if(size>=160&&(!ctx.filter||ctx.filter==='none')){const q=ctx.imageSmoothingQuality,e=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,sx,sy,size,size,dx,dy,dw,dh);ctx.imageSmoothingQuality=q;ctx.imageSmoothingEnabled=e;return;}
 const f=ctx.filter&&ctx.filter!=='none'?ctx.filter:'none';let id=hdIds.get(img);if(!id){id=hdNext++;hdIds.set(img,id);}
 const key=id+'|'+f+'|'+sx+'|'+sy;let c=hdCells.get(key);
 if(c){hdCells.delete(key);hdCells.set(key,c);}
 else{const big=document.createElement('canvas');big.width=big.height=size*4;const g=big.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.filter=f;g.drawImage(img,sx,sy,size,size,0,0,size*4,size*4);
  c=document.createElement('canvas');c.width=c.height=size*2;const h=c.getContext('2d');h.imageSmoothingEnabled=true;h.imageSmoothingQuality='high';h.drawImage(big,0,0,size*2,size*2);
  hdCells.set(key,c);if(hdCells.size>HD_MAX)hdCells.delete(hdCells.keys().next().value);}
 const prevF=ctx.filter,prevS=ctx.imageSmoothingEnabled,prevQ=ctx.imageSmoothingQuality;ctx.filter='none';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(c,0,0,size*2,size*2,dx,dy,dw,dh);ctx.filter=prevF;ctx.imageSmoothingEnabled=prevS;ctx.imageSmoothingQuality=prevQ;
}
