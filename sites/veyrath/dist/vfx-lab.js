// VEYRATH VFX Lab (Oct 15): preview, scrub and tune vfx-recipes.js effects on a game-like background.
// Edits apply live; "Save to game" stores the recipe as a browser-local override that the game's
// vfx-recipes.js loads on startup; "Copy JSON" exports it so it can be baked into vfx-recipes.js.
import GUI from './vendor/lil-gui.esm.min.js';
import {vfx,MAT} from './vfx-engine.js?v=fx-260';
import {RECIPES,recipe,emitFx,saveOverride,clearOverride,hasOverride} from './vfx-recipes.js?v=fx-260';

const cv=document.getElementById('lab'),ctx=cv.getContext('2d'),$status=document.getElementById('status'),$info=document.getElementById('info');
const mage=new Image();mage.src='./assets/mage-Idle.webp';
const clone=o=>JSON.parse(JSON.stringify(o));
const FIELD_DEFAULTS={count:1,delay:[0,0],life:[.5,.5],loop:false,static:false,place:'center',size:[1,1],w:[1,1],h:[1,1],ease:'out',dist:[0,1],off:[0,0],back:0,anchor:'base',speed:[1,2],up:[0,0],g:0,rise:0,spread:0,orient:false,rotOff:0,rotJit:0,spin:0,orientVel:false,fade:[0,1],opacity:1,add:0,colors:['#5a1206','#ff6a1a','#fff2b0'],params:[0,0,0,0],jitter:0,squash:.65,dissolve:false};
const CHOICES={mat:Object.keys(MAT),layer:['upper','ground'],place:['center','ring','burst','trail'],ease:['out','lin','in'],anchor:['','base']};

const S={recipe:Object.keys(RECIPES)[0],playing:true,loop:true,speed:1,age:0,zoom:1.4,scale:1,moving:true,bg:'sand',showMage:true,shader:vfx.enabled};
let work=clone(recipe(S.recipe)),spawns=[],seed=1,last=performance.now(),dpr=1,W=0,H=0;
const isLoop=()=>!!work.loop;

function resize(){dpr=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
addEventListener('resize',resize);resize();

// ---------- GUI ----------
const gui=new GUI({title:'VFX Lab'});
const top=gui.addFolder('Playback');
top.add(S,'recipe',Object.keys(RECIPES)).name('Recipe').onChange(()=>{work=clone(recipe(S.recipe));restart();buildLayers();});
top.add(S,'playing').name('Playing');top.add(S,'loop').name('Loop');
top.add(S,'speed',.05,2,.05).name('Speed');
const ageCtl=top.add(S,'age',0,4,.001).name('Time (scrub)').listen().onChange(()=>{S.playing=false;});
top.add(S,'zoom',.4,3,.05).name('Zoom');top.add(S,'scale',.2,3,.05).name('Effect scale');
top.add(S,'moving').name('Move projectile');top.add(S,'bg',['sand','dark','grid']).name('Background');top.add(S,'showMage').name('Mage for scale');
top.add(S,'shader').name('Shader VFX in game').onChange(v=>vfx.setEnabled(v));
top.add({replay:restart},'replay').name('▶ Replay (Space)');
const io=gui.addFolder('Save / export');
io.add({save(){saveOverride(S.recipe,clone(work));flash('Saved — the game uses this recipe in this browser');}},'save').name('💾 Save to game');
io.add({reset(){clearOverride(S.recipe);work=clone(RECIPES[S.recipe]);buildLayers();flash('Reset to built-in recipe');}},'reset').name('↺ Reset to default');
io.add({copy(){navigator.clipboard?.writeText(`'${S.recipe}':${JSON.stringify(work)}`).then(()=>flash('Recipe JSON copied'),()=>flash('Clipboard blocked'));}},'copy').name('📋 Copy JSON');
let layersFolder=null;

function addCtl(f,obj,key,label){const v=obj[key];
 if(CHOICES[key])return f.add(obj,key,CHOICES[key]).name(label??key);
 if(typeof v==='boolean')return f.add(obj,key).name(label??key);
 if(typeof v==='number')return f.add(obj,key).step(.01).name(label??key);
 if(typeof v==='string')return v.startsWith('#')?f.addColor(obj,key).name(label??key):f.add(obj,key).name(label??key);
 if(Array.isArray(v))v.forEach((_,i)=>addCtl(f,v,i,`${label??key}[${i}]`));}
function buildLayers(){
 layersFolder?.destroy();layersFolder=gui.addFolder(`Layers — ${work.layers.length}`);
 const meta=layersFolder.addFolder('Recipe');for(const k of ['R','duration'])if(work[k]!=null)meta.add(work,k).step(.01);work.loop=!!work.loop;meta.add(work,'loop').name('loop (attached)');meta.close();
 work.layers.forEach((L,i)=>{const f=layersFolder.addFolder(`${L.disabled?'○':'●'} ${L.name??'layer'+i} · ${L.mat}`);
  const ctl={enabled:!L.disabled,add:'',dup(){work.layers.splice(i+1,0,clone(L));buildLayers();},del(){work.layers.splice(i,1);buildLayers();},up(){if(i>0){[work.layers[i-1],work.layers[i]]=[work.layers[i],work.layers[i-1]];buildLayers();}}};
  f.add(ctl,'enabled').name('enabled').onChange(v=>{L.disabled=!v;});
  for(const k of Object.keys(L))if(k!=='name'&&k!=='disabled')addCtl(f,L,k);
  f.add(ctl,'add',['',...Object.keys(FIELD_DEFAULTS).filter(k=>!(k in L))]).name('+ add field').onChange(k=>{if(k){L[k]=clone({v:FIELD_DEFAULTS[k]}).v;buildLayers();}});
  f.add(ctl,'up').name('↑ draw earlier');f.add(ctl,'dup').name('⧉ duplicate');f.add(ctl,'del').name('✕ delete');f.close();});
 ageCtl.max(Math.max(.5,work.duration??2));ageCtl.updateDisplay();
}
buildLayers();

function restart(){S.age=0;S.playing=true;seed=(seed*7+3)%997+1;}
let flashT=0,flashMsg='';function flash(m){flashMsg=m;flashT=2.5;}
addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body){e.preventDefault();restart();}});
cv.addEventListener('pointerdown',e=>{const x=(e.clientX-W/2)/S.zoom,y=(e.clientY-H/2)/S.zoom;if(!isLoop())spawns.push({x,y,age:0,seed:(Math.random()*997|0)+1});});

// ---------- drawing ----------
const specks=Array.from({length:500},(_,i)=>{const a=Math.sin(i*12.9898)*43758.5453,b=Math.sin(i*78.233)*12543.12;return [(a-Math.floor(a))*2400-1200,(b-Math.floor(b))*1600-800,(i%5)+1];});
function background(){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=S.bg==='sand'?'#b09868':S.bg==='dark'?'#17120e':'#2a2420';ctx.fillRect(0,0,cv.width,cv.height);
 ctx.setTransform(dpr*S.zoom,0,0,dpr*S.zoom,dpr*W/2,dpr*H/2);
 if(S.bg==='sand'){for(const [x,y,s] of specks){ctx.fillStyle=s>3?'#9d8559':'#c2ab7c';ctx.globalAlpha=.55;ctx.fillRect(x,y,s*1.4,s*.8);}ctx.globalAlpha=1;}
 if(S.bg==='grid'){ctx.strokeStyle='#ffffff14';ctx.lineWidth=1/S.zoom;for(let x=-1200;x<=1200;x+=50){ctx.beginPath();ctx.moveTo(x,-800);ctx.lineTo(x,800);ctx.stroke();}for(let y=-800;y<=800;y+=50){ctx.beginPath();ctx.moveTo(-1200,y);ctx.lineTo(1200,y);ctx.stroke();}}
 ctx.strokeStyle='#00000033';ctx.lineWidth=1.5/S.zoom;ctx.beginPath();ctx.ellipse(0,0,(work.R??40)*S.scale,(work.R??40)*S.scale*.65,0,0,Math.PI*2);ctx.stroke();
}
function drawMage(){if(!S.showMage||!mage.complete||!mage.naturalWidth)return;const f=Math.floor(performance.now()/66)%15,x=-Math.max(140,(work.R??40)*S.scale*1.3),y=40;
 ctx.fillStyle='#0000002a';ctx.beginPath();ctx.ellipse(x,y,22,8,0,0,Math.PI*2);ctx.fill();ctx.drawImage(mage,f*128,2*128,128,128,x-76.8,y-115.2,153.6,153.6);}

function emitMain(pass){
 const road=work.layers.some(L=>L.place==='road'),seg=work.layers.some(L=>L.place==='segment'||L.at==='end');
 if(seg){const k=S.scale,t=isLoop()?S.age:S.age;emitFx(work,{x:-150*k,y:-60,x2:130*k,y2:-30+(S.moving?Math.sin(S.age*1.3)*40:0),age:t,scale:S.scale,seed},pass);}
 else if(road){const t=S.age%(work.duration??3),len=Math.min(340,t*900)*S.scale;emitFx(work,{x:-170*S.scale,y:20,age:t,angle:0,len,max:340*S.scale,speed:900*S.scale,scale:S.scale,seed,alpha:1-Math.max(0,Math.min(1,(t-(work.duration??3)+.6)/.6))},pass);}
 else if(isLoop()){const mv=S.moving&&work.projectile,t=S.age,rad=170,x=mv?Math.cos(t*1.1-Math.PI/2)*rad:0,y=mv?Math.sin(t*1.1-Math.PI/2)*rad*.65-30:-30;
  // tangent of the elliptical path, so the projectile faces its travel direction
  const dir=mv?Math.atan2(Math.cos(t*1.1-Math.PI/2)*rad*.65,-Math.sin(t*1.1-Math.PI/2)*rad):0;
  emitFx(work,{x,y,age:t,angle:mv?dir:0,scale:S.scale,seed},pass);}
 else emitFx(work,{x:0,y:0,age:S.age,scale:S.scale,seed},pass);
 for(const s of spawns)emitFx(work,{x:s.x,y:s.y,age:s.age,scale:S.scale,seed:s.seed},pass);
}
function frame(now){
 const dt=Math.min(.1,(now-last)/1000);last=now;
 if(S.playing){S.age+=dt*S.speed;const D=work.duration??2;if(!isLoop()&&S.age>D+.25){if(S.loop){S.age=0;seed=(seed*7+3)%997+1;}else{S.age=D;S.playing=false;}}}
 for(const s of spawns)s.age+=dt*S.speed;spawns=spawns.filter(s=>s.age<(work.duration??2)+.2);
 background();
 const ok=vfx.ok;emitMain('ground');vfx.flush(ctx,'ground');
 drawMage();
 emitMain('upper');vfx.flush(ctx,'upper');
 flashT-=dt;$status.textContent=ok?(hasOverride(S.recipe)?'· saved override active':'· built-in recipe'):'· WebGL2 unavailable / shader VFX off';
 $info.textContent=(flashT>0?flashMsg+' · ':'')+(work.note??'')+` · t=${S.age.toFixed(2)}s`;
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
