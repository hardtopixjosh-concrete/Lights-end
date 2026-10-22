// Oct 18 (user: "when you hover spells i want it to look better for reading"): one styled hover card replaces the
// browser's native title tooltips on spell slots. tip(el, () => data) registers an element; data =
// {title, sub, tint, chips:[text], body, listTitle, list:[[name, text]]}. Returning null shows nothing.
let box=null,owner=null,getData=null;
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
function place(){if(!box||!owner)return;const r=owner.getBoundingClientRect(),w=box.offsetWidth,h=box.offsetHeight,m=10;
  let x=r.left+r.width/2-w/2,y=r.top-h-12;if(y<m)y=r.bottom+12;x=Math.max(m,Math.min(innerWidth-w-m,x));y=Math.max(m,Math.min(innerHeight-h-m,y));
  box.style.left=Math.round(x)+'px';box.style.top=Math.round(y)+'px';}
function render(){const d=getData?.();if(!d){hide();return;}
  if(!box){box=el('div','ui-tip');box.setAttribute('role','tooltip');document.body.append(box);}
  box.style.setProperty('--tint',d.tint||'#e6c581');
  const head=el('div','ui-tip-head');head.append(el('b','',d.title));if(d.sub)head.append(el('small','',d.sub));
  const parts=[head];
  if(d.chips?.length){const row=el('div','ui-tip-chips');for(const c of d.chips)if(c)row.append(el('span','',c));parts.push(row);}
  if(d.body)parts.push(el('p','',d.body));
  if(d.list?.length){parts.push(el('h5','',d.listTitle||'Behaviors'));const ul=el('ul');for(const [n,t] of d.list){const li=el('li');li.append(el('b','',n),el('span','',t));ul.append(li);}parts.push(ul);}
  box.replaceChildren(...parts);box.hidden=false;place();}
function hide(){owner=null;getData=null;if(box)box.hidden=true;}
export function tip(target,fn){if(!target)return;target.removeAttribute('title');
  const show=()=>{owner=target;getData=fn;render();};
  target.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')show();});target.addEventListener('pointerleave',()=>{if(owner===target)hide();});
  target.addEventListener('focus',show);target.addEventListener('blur',()=>{if(owner===target)hide();});}
export const hideTip=hide;
addEventListener('scroll',()=>place(),true);addEventListener('resize',()=>place());
