// Decoded sprite ownership and bounded frame-local recoloring. No full-sheet readback in combat.
const retained=new WeakSet();
export const isRetainedSprite=image=>retained.has(image);
// Oct 16 (mobile): phones/tablets use plain <img> sprites. ~100 sheets kept as ImageBitmaps (several hundred MB
// decoded) exceed iPhone Safari's memory budget (characters drew blank); the browser can drop and re-decode <img> data.
const MOBILE=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
export async function loadSprite(url){
 if(typeof createImageBitmap==='function'&&!MOBILE){
  const response=await fetch(url);if(!response.ok)throw Error('Unable to load '+url);
  const blob=await response.blob();
  try{const bitmap=await createImageBitmap(blob);retained.add(bitmap);return bitmap;}catch{/* older browsers use the image path */}
 }
 return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{
  let timer;const done=()=>{clearTimeout(timer);retained.add(img);resolve(img);};
  if(img.decode)Promise.race([img.decode(),new Promise(r=>{timer=setTimeout(r,1500);})]).then(done,done);else done();
 };img.onerror=()=>reject(Error('Unable to load '+url));img.src=url;});
}
export function createFrameCache(limit=360){
 const ids=new WeakMap(),cells=new Map();let next=0;
 return (img,variant,sx,sy,w,h,paint,read=false)=>{
  let id=ids.get(img);if(!id){id=++next;ids.set(img,id);}
  const key=[id,variant,sx,sy,w,h].join('|');let cell=cells.get(key);
  if(cell){cells.delete(key);cells.set(key,cell);return cell;}
  cell=document.createElement('canvas');cell.width=w;cell.height=h;
  const ctx=cell.getContext('2d',{willReadFrequently:read});
  ctx.drawImage(img,sx,sy,w,h,0,0,w,h);paint(ctx,w,h);
  cells.set(key,cell);if(cells.size>limit)cells.delete(cells.keys().next().value);
  return cell;
 };
}
