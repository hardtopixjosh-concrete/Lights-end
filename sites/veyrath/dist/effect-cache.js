// Bounded visual-only raster cache. Dynamic transforms/opacity stay with callers.
// Two layers preserve source-over ice faces and additive glow blending independently.
const LIMIT=32*1024*1024,MAX_ENTRIES=192,entries=new Map(),ids=new WeakMap();
let nextId=1,bytes=0,builds=0,view=null;
export function setFxView(bounds){view=bounds;}
export function effectVisible(x,y,rx,ry=rx){return !view||x+rx>=view.x0&&x-rx<=view.x1&&y+ry>=view.y0&&y-ry<=view.y1;}
export function fxCacheStats(){return {entries:entries.size,bytes,builds};}
function remember(key,make){
 let item=entries.get(key);if(item){entries.delete(key);entries.set(key,item);return item;}
 item=make();if(!item)return null;builds++;item.bytes=item.canvas.width*item.canvas.height*4;
 while(entries.size&&(bytes+item.bytes>LIMIT||entries.size>=MAX_ENTRIES)){const k=entries.keys().next().value;bytes-=entries.get(k).bytes;entries.delete(k);}
 if(item.bytes<=LIMIT){entries.set(key,item);bytes+=item.bytes;}return item;
}
export function cachedSurface(owner,variant,bounds,paint){
 if(typeof document==='undefined')return null;
 let id=ids.get(owner);if(!id){id=nextId++;ids.set(owner,id);}
 return remember('surface:'+id+':'+variant,()=>{
  const x=Math.floor(bounds[0])-2,y=Math.floor(bounds[1])-2,w=Math.ceil(bounds[2])-x+2,h=Math.ceil(bounds[3])-y+2;
  if(w<=0||h<=0||w>1024||h>1024)return null;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');ctx.translate(-x,-y);const previous=view;view=null;
  try{paint(ctx);}finally{view=previous;}return {canvas,x,y};
 });
}
export function cachedGlow(ctx,x,y,r,stops,alpha=1,squash=1){
 // Callers may have translated/rotated into local coordinates; cull at world-space call sites only.
 if(!(r>.5)||!(alpha>0))return;
 // Four resolution buckets avoid caching every animated radius. Colours/stops remain exact.
 const size=r<=16?32:r<=32?64:r<=64?128:256,key='glow:'+size+':'+stops.map(s=>s.join(':')).join('|');
 const item=remember(key,()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const g=canvas.getContext('2d'),radius=size/2,gradient=g.createRadialGradient(radius,radius,0,radius,radius,radius);
  for(const [offset,color] of stops)gradient.addColorStop(offset,color);
  g.fillStyle=gradient;g.beginPath();g.arc(radius,radius,radius,0,Math.PI*2);g.fill();return {canvas};});
 const previous=ctx.globalAlpha;ctx.globalAlpha=alpha;ctx.drawImage(item.canvas,x-r,y-r*squash,r*2,r*2*squash);ctx.globalAlpha=previous;
}
