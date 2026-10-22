// Touch controls (Oct 16, user: mobile home-screen web app with drag-to-aim abilities).
// Left thumb: floating joystick anywhere on the left half. Right thumb: the HUD slot tiles are moved into an
// arc and become buttons. Ability buttons aim by dragging away from the button (direction = aim direction,
// drag length = distance) and cast on release; a tap without dragging auto-aims at the nearest enemy.
// Basic attack casts on press and keeps auto-aiming while held. Input only: everything goes through the
// game's existing handlers via the hooks object, so the simulation does not know about touch.
export const isTouchDevice=()=>/[?&]touch\b/.test(location.search)||matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1&&!matchMedia('(pointer:fine)').matches;

// Oct 17 (user: aiming too sensitive): longer drag for full range, and the aim point eases toward the finger.
const DEAD=18,MAX_DRAG=150,STICK=62,AIM_EASE=12;
// Offsets of each button centre from the bottom-right corner [right, bottom] in px, before --touch-scale.
const LAYOUT={lmb:[78,78,96],cleave:[190,92,66],parry:[150,186,66],slam:[66,204,66],storm:[248,196,72],dash:[290,62,62]};
const SLOT={lmb:'lmb',cleave:'rmb',parry:'q',slam:'e',storm:'r',dash:'dash'};

export function createTouchControls(h){
  document.body.classList.add('touch');
  const root=document.createElement('div');root.id='touch-ui';
  const zone=document.createElement('div');zone.id='touch-stick';
  const base=document.createElement('div');base.className='stick-base';const knob=document.createElement('div');knob.className='stick-knob';base.append(knob);zone.append(base);
  const pad=document.createElement('div');pad.id='touch-pad';
  const aimCv=document.createElement('canvas');aimCv.id='touch-aim';
  const rotate=document.createElement('div');rotate.id='touch-rotate';rotate.textContent='Rotate your phone to landscape';
  const top=document.createElement('div');top.id='touch-top';
  for(const [label,fn] of [['Map',()=>h.key('m')],['Bag',()=>h.key('i')],['Build',()=>h.toggleBuild()]]){const b=document.createElement('button');b.textContent=label;b.addEventListener('click',e=>{e.preventDefault();fn();});top.append(b);}
  root.append(zone,pad,aimCv,top);document.body.append(root,rotate);
  const actx=aimCv.getContext('2d');

  // ---- joystick ----
  let stickId=null,sx=0,sy=0;
  zone.addEventListener('pointerdown',e=>{if(stickId!==null||!h.active())return;e.preventDefault();stickId=e.pointerId;try{zone.setPointerCapture(e.pointerId);}catch{}sx=e.clientX;sy=e.clientY;base.style.left=sx+'px';base.style.top=sy+'px';base.classList.add('on');moveStick(e);h.unlock();});
  zone.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveStick(e);});
  const endStick=e=>{if(e.pointerId!==stickId)return;stickId=null;base.classList.remove('on');knob.style.transform='';h.stick(null);};
  zone.addEventListener('pointerup',endStick);zone.addEventListener('pointercancel',endStick);
  function moveStick(e){let dx=e.clientX-sx,dy=e.clientY-sy;const d=Math.hypot(dx,dy);if(d>STICK){dx*=STICK/d;dy*=STICK/d;}knob.style.transform=`translate(${dx}px,${dy}px)`;h.stick(d>10?{x:dx/(d||1),y:dy/(d||1)}:null);}

  // ---- buttons ----
  let aiming=null;// {id, pointerId, cx, cy, dx, dy, mode}
  for(const [id,[r,b,size]] of Object.entries(LAYOUT)){
    const el=document.getElementById('slot-'+id);if(!el)continue;
    el.classList.add('touch-btn');el.style.setProperty('--r',r+'px');el.style.setProperty('--b',b+'px');el.style.setProperty('--s',size+'px');pad.append(el);
    el.addEventListener('pointerdown',e=>down(e,id,el));
    el.addEventListener('pointermove',e=>{if(aiming&&aiming.pointerId===e.pointerId){aiming.dx=e.clientX-aiming.cx;aiming.dy=e.clientY-aiming.cy;}});
    el.addEventListener('pointerup',e=>up(e,false));el.addEventListener('pointercancel',e=>up(e,true));
    el.addEventListener('contextmenu',e=>e.preventDefault());
  }
  function down(e,id,el){
    e.preventDefault();h.unlock();if(!h.active())return;
    if(id==='dash'){h.key(' ');return;}
    if(aiming)return;// one aimed button at a time
    const r=el.getBoundingClientRect();try{el.setPointerCapture(e.pointerId);}catch{}
    aiming={id,pointerId:e.pointerId,cx:r.left+r.width/2,cy:r.top+r.height/2,dx:0,dy:0,mode:id==='lmb'||h.holdSlot(SLOT[id])?'hold':'release'};
    el.classList.add('pressed');applyAim();
    if(aiming.mode==='hold'){if(id==='lmb')h.press(0);else if(id==='cleave')h.press(2);else h.keyDown(SLOT[id]);}
    loop();
  }
  function up(e,cancel){
    if(!aiming||aiming.pointerId!==e.pointerId)return;const a=aiming;aiming=null;
    document.getElementById('slot-'+a.id)?.classList.remove('pressed');
    if(!cancel){a.mode==='release'&&applyAim(a);}
    if(a.mode==='hold'){if(a.id==='lmb')h.release(0);else if(a.id==='cleave')h.release(2);else h.keyUp(SLOT[a.id]);}
    else if(!cancel){if(a.id==='cleave'){h.press(2);h.release(2);}else{h.keyDown(SLOT[a.id]);h.keyUp(SLOT[a.id]);}}
    actx.clearRect(0,0,aimCv.width,aimCv.height);
  }
  // Aim point in client px: a drag picks direction and distance; no drag = nearest enemy or straight ahead.
  function aimPoint(a=aiming){
    const p=h.playerScreen(),len=Math.hypot(a.dx,a.dy);
    if(len<DEAD)return {...(h.autoTarget()??h.facingPoint()),auto:true};
    const range=h.aimRange(),t=Math.min(1,len/MAX_DRAG),dist=40+t*(range-40);
    return {x:p.x+a.dx/len*dist,y:p.y+a.dy/len*dist,auto:false};
  }
  // Smoothed as an offset from the player so the aim follows the hero while it eases toward the drag target.
  function applyAim(a=aiming){if(!a)return;const raw=aimPoint(a),p=h.playerScreen(),tx=raw.x-p.x,ty=raw.y-p.y,now=performance.now();
    if(a.ox===undefined||raw.auto){a.ox=tx;a.oy=ty;}else{const k=1-Math.exp(-Math.min(.1,(now-a.at)/1000)*AIM_EASE);a.ox+=(tx-a.ox)*k;a.oy+=(ty-a.oy)*k;}
    a.at=now;const pt={x:p.x+a.ox,y:p.y+a.oy,auto:raw.auto};h.aim(pt.x,pt.y);return pt;}
  function loop(){
    if(!aiming){return;}
    const pt=applyAim();aimCv.width!==innerWidth&&(aimCv.width=innerWidth);aimCv.height!==innerHeight&&(aimCv.height=innerHeight);
    actx.clearRect(0,0,aimCv.width,aimCv.height);
    if(aiming.id!=='lmb'||!pt.auto){const p=h.playerScreen();actx.save();actx.lineWidth=3;actx.strokeStyle=pt.auto?'#ffffff66':'#ffb15ccc';actx.setLineDash([10,8]);actx.beginPath();actx.moveTo(p.x,p.y);actx.lineTo(pt.x,pt.y);actx.stroke();actx.setLineDash([]);actx.fillStyle=pt.auto?'#ffffff22':'#ff9a2e33';actx.beginPath();actx.arc(pt.x,pt.y,18,0,Math.PI*2);actx.fill();actx.stroke();actx.restore();}
    requestAnimationFrame(loop);
  }
  // Pausing or a menu opening drops any held input so nothing stays stuck.
  function reset(){if(aiming){const a=aiming;aiming=null;document.getElementById('slot-'+a.id)?.classList.remove('pressed');if(a.mode==='hold'){if(a.id==='lmb')h.release(0);else if(a.id==='cleave')h.release(2);else h.keyUp(SLOT[a.id]);}}actx.clearRect(0,0,aimCv.width,aimCv.height);if(stickId!==null){stickId=null;base.classList.remove('on');knob.style.transform='';}h.stick(null);}
  return {reset};
}
