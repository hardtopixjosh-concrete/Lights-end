import {createUnlockCatalog} from './unlocks-ui.js?v=fx-260';
import {createRunePicker} from './rune-picker.js?v=fx-260';
import {ARMORY_CAPACITY} from './weapons.js?v=fx-260';
import {installTitleUI} from './title-ui.js?v=fx-260';
import {installCharacterUI} from './character-ui.js?v=fx-260';
import {GAMEPLAY_RUNES,RUNE_SLOT_PRICES,runeEligible,equipGameplayRune,SPELL_COLORS} from './progression.js?v=fx-260';
import {tip} from './ui-tip.js?v=fx-260';
import {MODES,MODIFIERS,RUNES,RUNE_PRICE,UPGRADES,COMING_LATER,tier,upgradePrice,buyItem,PATH_PRICE,pathUnlocked} from './meta.js?v=fx-260';
import {PATHS,pathNodes} from './specializations.js?v=fx-260';
import {SLOTS} from './talent-data.js?v=fx-260';
import {FAMILIES} from './weapon-families.js?v=fx-260';
import {iconNode} from './ui-icons.js?v=fx-260';
// Main-menu batch (Oct 16, docs/main-menu-plan.md): title, character select, loadout, unlocks, best runs, how to play.
// UI only: game.js passes the hooks (class, gold, meta save, run start); simulation stays in game.js.
const SCREENS={title:'fe-title',class:'fe-class',loadout:'fe-loadout',unlocks:'fe-unlocks-screen',best:'fe-best-screen',howto:'fe-howto-screen'};
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const clock=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
export function createFront(h){
 installTitleUI();installCharacterUI();
 const renderUnlockCatalog=createUnlockCatalog();
 const renderRunePickers=createRunePicker(h,()=>renderLoadout(),()=>show('unlocks'));
 let screen='title',raf=0,t0=0;
 function show(name,opts={}){screen=name;document.body.classList.add('in-menu');for(const [k,id] of Object.entries(SCREENS))$(id).hidden=k!==name;cancelAnimationFrame(raf);
  if(name==='title')$('fe-gold').textContent=h.gold();
  if(name==='class'){t0=performance.now();raf=requestAnimationFrame(drawPreviews);for(const c of ['sword','mage','ranger'])$('class-'+c).setAttribute('aria-pressed',String(h.classId()===c));}
  $('welcome').classList.toggle('lobby',name==='loadout');h.lobby?.(name==='loadout');
  if(name==='loadout'){t0=performance.now();raf=requestAnimationFrame(drawPreviews);setArmory(opts.focus==='armory');renderLoadout();if(opts.focus==='armory'){$('prep-search').focus({preventScroll:true});return;}}if(name==='unlocks')renderUnlocks();if(name==='best')renderBest();
  $(SCREENS[name]).querySelector('button.primary,button')?.focus({preventScroll:true});}
 // Oct 18: outline (bounding box) of each sprite's 4th front-facing frame, cached, used to size heroes and portraits evenly.
 const BOXES=new Map(),HERO_KEYS={};
 /* Oct 18 (user): drag the lobby hero left/right to turn it. */
 let heroRot=0;{const cv=$('prep-portrait');let drag=null;cv.addEventListener('pointerdown',e=>{drag=e.clientX;cv.setPointerCapture(e.pointerId);});cv.addEventListener('pointermove',e=>{if(drag==null)return;heroRot+=(e.clientX-drag)*.012;drag=e.clientX;});const end=()=>{drag=null;};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);}
 function spriteBox(key,img,fw,fh){if(BOXES.has(key))return BOXES.get(key);let b={x:0,y:0,w:fw,h:fh};try{const cv=document.createElement('canvas');cv.width=Math.ceil(fw);cv.height=Math.ceil(fh);const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(img,3*fw,2*fh,fw,fh,0,0,fw,fh);/* frame 3: frame 0 of the source sheets is a known near-empty frame */const d=c.getImageData(0,0,cv.width,cv.height).data;let x0=cv.width,y0=cv.height,x1=-1,y1=-1;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(d[(y*cv.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}if(x1>=0)b={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};}catch{}BOXES.set(key,b);return b;}
 // Real character sheets (15 frames x 8 directions; row 2 faces the viewer), idling on the class cards.
 // Oct 18 (user): friends in the online lobby stand beside your hero (live 3D, default weapon) with their name above.
 const ALLY_KEYS={};
 function drawAllies(now){const box=$('fe-loadout'),list=screen==='loadout'&&h.allies?h.allies().slice(0,4):[];let cvs=[...box.querySelectorAll('.lb-ally-hero')];
  while(cvs.length<list.length){const cv=document.createElement('canvas');cv.className='lb-ally-hero';cv.width=cv.height=640;box.append(cv);cvs.push(cv);}
  cvs.forEach((cv,i)=>{const a=list[i];if(cv.hidden!==!a)cv.hidden=!a;if(!a)return;cv.style.setProperty('--i',i);const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);
   const key=ALLY_KEYS[a.id+':'+a.cls]??={},bw=cv.height*.98,fy=cv.height*.8;h.allyHero?.(c,a.cls,[cv.width/2-bw/2,fy-bw*.75,bw,bw],(now-t0)/1000,key);
   c.font='600 30px Cinzel, Georgia, serif';c.textAlign='center';c.lineWidth=6;c.strokeStyle='#000b';c.fillStyle='#ffe6b0';const ny=Math.round(cv.height*.27);c.strokeText(a.name,cv.width/2,ny);c.fillText(a.name,cv.width/2,ny);});}
 function drawPreviews(now){try{drawAllies(now);}catch{}for(const cv of document.querySelectorAll(screen==='loadout'?'#prep-portrait,.lb-mini':'.fe-class-card canvas')){const img=h.images.get(cv.dataset.sheet),c=cv.getContext('2d');if(cv.classList.contains('lb-mini')&&cv.dataset.drawn)continue;/* portraits are static: draw once */
   if(cv.id==='prep-portrait'){const want=Math.min(1600,Math.round(cv.clientWidth*(devicePixelRatio||1)))||768;if(cv.width!==want)cv.width=cv.height=want;}/* HD: canvas at screen resolution */
   c.clearRect(0,0,cv.width,cv.height);
   /* Oct 18: live 3D hero (Warrior/Mage) with the equipped weapon, tried before the sprite (sprite sheets may not be loaded any more); box = sprite box, feet 75% down it. */
   {const isHero=cv.id==='prep-portrait',isMini=cv.classList.contains('lb-mini');if((isHero||isMini)&&h.lobbyHero){const key=HERO_KEYS[(cv.dataset.cls??'')+(isHero?':hero':':mini')]??=({});if(isHero)key.rot=heroRot;const bw=isHero?cv.height*.98:cv.height*3.1,fy=isHero?cv.height*.8:cv.height*1.62;if(h.lobbyHero(c,cv.dataset.cls,[cv.width/2-bw/2,fy-bw*.75,bw,bw],(now-t0)/1000,key)){if(isMini)cv.dataset.drawn='1';continue;}}}
   if(!img)continue;const hero=cv.id==='prep-portrait',mini=cv.classList.contains('lb-mini'),fw=img.width/15,fh=img.height/8,f=hero||cv.closest('.selected')?Math.floor((now-t0)/1000*12)%15:3;
   /* Oct 18: hero drawn large and pixel-crisp with a cool moonlit rim; carousel minis crop to head and shoulders. */
   /* Oct 18: live 3D hero with the equipped weapon when the class has a model (box = sprite box; feet sit 75% down it). */
   const bb=spriteBox(cv.dataset.sheet,img,fw,fh);
   if(hero){/* Oct 18: integer pixel scale so the figure is ~62% of the canvas tall, feet on the canvas bottom; moon-blue rim glow drawn in two passes. */
    const s=Math.max(2,Math.round(cv.height*.62/bb.h)),x=cv.width/2-(bb.x+bb.w/2)*s,y=cv.height-6-(bb.y+bb.h)*s;c.imageSmoothingEnabled=false;
    c.shadowColor='#6cc4ffcc';c.shadowBlur=34;c.drawImage(img,f*fw,2*fh,fw,fh,x,y,fw*s,fh*s);c.shadowColor='#e8f6ffb3';c.shadowBlur=8;c.drawImage(img,f*fw,2*fh,fw,fh,x,y,fw*s,fh*s);c.shadowBlur=0;}
   else if(mini){/* head and shoulders: top 60% of the outline fills the card */
    const s=cv.height/(bb.h*.6),x=cv.width/2-(bb.x+bb.w/2)*s,y=4-bb.y*s;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(img,f*fw,2*fh,fw,fh,x,y,fw*s,fh*s);}
   else{const s=Math.min(cv.width/fw,cv.height/fh)*1.6;c.imageSmoothingQuality='high';c.drawImage(img,f*fw,2*fh,fw,fh,(cv.width-fw*s)/2,cv.height-fh*s+fh*s*.12,fw*s,fh*s);}}
  /* Oct 19 fix (measured: the lobby hero kept rendering under the whole run, ~1.3 ms of every frame): stop once the front end is hidden; show('class'|'loadout') restarts it */
  if((screen==='class'||screen==='loadout')&&!$('welcome').hidden)raf=requestAnimationFrame(drawPreviews);}
 // Character lobby (Oct 17, user navy & gold mockups): path + spell preview left, the character on a pedestal in the
 // centre with a carousel, loadout / rune / safe pocket right, mode + START RUN at the bottom. The armory slides in
 // from the right inside the lobby. Class restrictions apply to equipping only; every weapon can be stored.
 const CLASSES=[['sword','Warrior','knight-Idle','Close-range blade · Rage'],['mage','Mage','mage-Idle','Ranged caster · Arcane Energy'],['ranger','Ranger','ranger-Idle','Bow and skills · Momentum']];
 const SLOT_KEY={RMB:'cleave',Q:'parry',E:'slam',R:'storm'};
 let tab='class',query='',rarity=-1,inspect=null,armoryOpen=false,modsOpen=false,salvageArm=null;
 const tile=(w,opts={})=>{const t=el('button','prep-tile'+(opts.big?' big':''));t.style.setProperty('--tint',w.color);t.title=w.name;const ic=el('span','prep-ico');ic.append(iconNode(w.name,w.cls,'lmb'));t.append(ic,el('i','rar'));if(opts.badge)t.append(el('span','prep-badge',opts.badge));return t;};
 const drag=(node,id)=>{node.draggable=true;node.ondragstart=e=>{e.dataTransfer.setData('text/plain',id);e.dataTransfer.effectAllowed='move';};};
 const dropOn=(node,fn)=>{node.ondragover=e=>{e.preventDefault();node.classList.add('drop-on');};node.ondragleave=()=>node.classList.remove('drop-on');node.ondrop=e=>{e.preventDefault();node.classList.remove('drop-on');fn(e.dataTransfer.getData('text/plain'));};};
 const act=(kind,id,opts)=>{const err=h.act(kind,id,opts);if(err){h.toast(err);return false;}renderLoadout();return true;};
 const clsName=c=>(CLASSES.find(x=>x[0]===c)??CLASSES[0])[1];

 /* Oct 18 (user: match the mockup exactly): vivid path colours sampled from the mockup and filled path icons. */
 const PATH_LOOK={
  pyro:['#fb602b','M24 4C27 13 37 16 37 28C37 37 31 44 24 44C17 44 11 37 11 29C11 22 16 18 17 12C20 17 21 20 21 23C25 18 26 11 24 4ZM24 44C20 44 18 40 18 37C18 33 22 31 23 26C26 30 30 33 30 37C30 41 27 44 24 44Z'],
  cryo:['#69b9fc','M22 3H26V14L32 8L35 11L26 20V22H28L37 13L40 16L34 22H45V26H34L40 32L37 35L28 26H26V28L35 37L32 40L26 34V45H22V34L16 40L13 37L22 28V26H20L11 35L8 32L14 26H3V22H14L8 16L11 13L20 22H22V20L13 11L16 8L22 14Z'],
  storm:['#a86bff','M29 3L10 27H22L17 45L38 19H26L33 3Z'],
  blood:['#fa314f','M24 3L44 24L24 45L4 24ZM24 14L14 24L24 34L34 24Z'],
  berserker:['#ff4a3a','M8 8L20 12L36 40L40 36L12 20ZM40 8L28 12L12 40L8 36L36 20Z'],
  vanguard:['#f2c76a','M24 3L42 10V22C42 33 34 41 24 45C14 41 6 33 6 22V10ZM24 11L13 15V22C13 29 18 34 24 37Z'],
  spellblade:['#4fd2ff','M36 4L44 4L44 12L20 36L24 40L20 44L14 38L8 44L4 40L10 34L4 28L8 24L12 28ZM10 6L12 11L17 13L12 15L10 20L8 15L3 13L8 11Z'],
  warlord:['#ff9a2a','M10 4H14V44H10ZM14 6H40L33 15L40 24H14Z'],
  archer:['#7fe04a','M10 4Q40 24 10 44L12 40Q34 24 12 8ZM8 23H38L33 18L35 16L44 24L35 32L33 30L38 25H8Z'],
  ninja:['#2f62ff','M24 2L29 19L46 24L29 29L24 46L19 29L2 24L19 19ZM24 20A4 4 0 1 0 24 28A4 4 0 1 0 24 20Z'],
  alchemist:['#b35cff','M18 4H30V8H28V18L40 38C42 42 39 45 35 45H13C9 45 6 42 8 38L20 18V8H18ZM15 34L12 39H36L33 34Z'],
  gunslinger:['#ffc24a','M4 14H40V22H24L21 34H11L14 22H4ZM40 16H46V20H40Z']};
 const SVGNS='http://www.w3.org/2000/svg';
 function pathIcon(id){const look=PATH_LOOK[id];const s=document.createElementNS(SVGNS,'svg');s.setAttribute('viewBox','0 0 48 48');s.setAttribute('aria-hidden','true');if(!look)return s;const p=document.createElementNS(SVGNS,'path');p.setAttribute('d',look[1]);p.setAttribute('fill',look[0]);p.setAttribute('fill-rule','evenodd');s.append(p);return s;}
 const pathObs=new MutationObserver(()=>{if(screen==='loadout')renderLoadout();});pathObs.observe($('path-picker'),{childList:true});
 function setArmory(open){armoryOpen=open;$('fe-loadout').classList.toggle('armory-open',open);$('prep-armory').hidden=!open;if(open)renderLoadout();}
 function renderLoadout(){
  const m=h.meta(),cid=h.classId(),cls=CLASSES.find(x=>x[0]===cid)??CLASSES[0],mage=cid==='mage',a=h.armory(),info=w=>h.weaponInfo(w);h.renderPathPicker();
  /* Oct 18: give each path row a large icon like the mockup (game.js writes "icon name" into <strong>). */
  [...document.querySelectorAll('#path-picker .path-choice')].forEach((b,i)=>{const p=(PATHS[h.classId()]??[])[i];if(!p)return;const locked=b.classList.contains('locked')||b.disabled;b.style.setProperty('--path-color',PATH_LOOK[p.id]?.[0]??p.color);const ic=el('span','lb-picon');ic.append(pathIcon(p.id));b.replaceChildren(ic,el('strong','',p.name),el('small','',p.description));if(locked){b.classList.add('locked');b.title='Locked · unlock it in Unlocks';}});pathObs.takeRecords();
  $('prep-gold').textContent=h.gold().toLocaleString();
  // Left: class, path list (built by game.js), spell preview.
  $('prep-char-name').textContent=cls[1].toUpperCase();$('prep-char-sub').textContent=cls[3];$('lb-hero-name').textContent=cls[1].toUpperCase();
  const path=PATHS[cid]?.find(p=>p.id===h.path()),tint=path?.color??'#e6c581',nodes=path?pathNodes({path:path.id}):[];
  $('lb-spells').replaceChildren(...SLOTS.map(slot=>{const n=nodes.find(x=>x.ability===slot&&x.tier===0),t=el('span','lb-spell');t.style.setProperty('--tint',tint);tip(t,()=>n?{title:n.name,sub:slot+' · Spell',tint,body:n.description}:{title:slot,sub:'No path chosen',body:'Choose a path to see this spell.'});t.append(iconNode(n?.name??slot,cid,SLOT_KEY[slot]),el('kbd','',slot));return t;}));
  $('lb-pathchip').replaceChildren(el('b','',path?path.icon+' '+path.name:'No path'),el('small','','Change path →'));$('lb-pathchip').style.setProperty('--tint',tint);$('lb-pathchip').onclick=()=>setArmory(false);
  // Centre: carousel of characters.
  $('prep-portrait').dataset.sheet=cls[2];$('prep-portrait').dataset.cls=cid;
  $('lb-chars').replaceChildren(...CLASSES.map(([id,name,sheet],i)=>{const b=el('button','lb-char'+(id===cid?' selected':''));b.setAttribute('aria-pressed',String(id===cid));const cv=el('canvas');cv.width=200;cv.height=186;cv.dataset.sheet=sheet;cv.dataset.cls=id;cv.className='lb-mini';b.append(cv,el('span','',name.toUpperCase()),el('kbd','',String(i+1)));b.onclick=()=>{if(id!==cid)h.chooseClass(id);};return b;}));
  const idx=CLASSES.findIndex(x=>x[0]===cid);$('lb-prev').onclick=()=>h.chooseClass(CLASSES[(idx+CLASSES.length-1)%CLASSES.length][0]);$('lb-next').onclick=()=>h.chooseClass(CLASSES[(idx+1)%CLASSES.length][0]);
  // Right: loadout, colour rune, safe pocket.
  const eqW=a.weapons.find(w=>w.id===a.equipped),eq=eqW&&info(eqW),box=$('prep-equipped');box.replaceChildren();
  if(eq){const t=tile(eq,{big:true}),txt=el('div','lb-eqtext'),name=el('b','',eq.name);name.style.color=eq.color;const open=el('button','lb-open','OPEN ARMORY →');open.onclick=()=>setArmory(true);txt.append(name,el('small','',eq.kind),open);box.append(t,txt);}
  dropOn(box,id=>equipDrop(id));
  renderRunePickers();
  const pw=a.weapons.find(w=>w.location==='pocket'),pk=$('prep-pocket');pk.classList.toggle('occupied',!!pw);pk.replaceChildren();const ph=el('h4','lb-label');ph.append(el('span','','SAFE POCKET'),el('em','pocket-status',pw?'OCCUPIED · 1/1':'EMPTY · 0/1'));pk.append(ph);
  if(pw){const p=info(pw),row=el('div','lb-pkrow'),t=tile(p);drag(t,pw.id);const txt=el('div','lb-eqtext'),name=el('b','',p.name);name.style.color=p.color;const st=el('button','lb-open','STORE IN ARMORY');st.onclick=()=>act('stash',pw.id);txt.append(name,el('small','','Protected weapon'+(p.cls!==cid?' · '+clsName(p.cls)+' only':'')));row.append(t,txt);pk.append(row,st);}
  else{const row=el('div','lb-pkrow'),slot=el('div','prep-tile pocket-empty','—'),txt=el('div','lb-eqtext');slot.setAttribute('aria-hidden','true');txt.append(el('b','','Empty'),el('small','','Room for one protected weapon.'));row.append(slot,txt);pk.append(row);}
  // Bottom bar: mode, modifiers, reminder.
  const mode=m.last.mode??'normal',ms=$('lb-mode');ms.replaceChildren(...MODES.map(md=>new Option(md.name,md.id)));ms.value=mode;ms.onchange=()=>{h.setLast({mode:ms.value,mods:ms.value==='modified'&&!(m.last.mods??[]).length?['haste']:m.last.mods});renderLoadout();};
  $('lb-mods-btn').onclick=()=>{modsOpen=!modsOpen;renderLoadout();};$('lb-modpop').hidden=!modsOpen;
  const mods=$('fe-mods');mods.hidden=mode!=='modified';mods.replaceChildren(...MODIFIERS.map(d=>{const on=(m.last.mods??[]).includes(d.id),l=el('label','fe-mod'+(on?' on':'')),c=el('input');c.type='checkbox';c.checked=on;c.onchange=()=>{const next=new Set(h.meta().last.mods??[]);c.checked?next.add(d.id):next.delete(d.id);if(!next.size){c.checked=true;h.toast('Pick at least one modifier, or choose Normal');return;}h.setLast({mods:[...next]});renderLoadout();};const t=el('span');t.append(el('b','',d.name),el('small','',d.desc));l.append(c,t);return l;}));
  $('fe-mode-desc').textContent=MODES.find(x=>x.id===mode).desc;
  const status=$('prep-alert');status.hidden=!pw&&!!h.path();status.textContent=!h.path()?'Choose a path to start.':pw?'Store your safe-pocket item so you can pocket new loot this run.':'';
  $('intro-controls').textContent=mage?'WASD move · LMB arcane attack · RMB / Q / E / R spells · Space Blink · hold Tab for your build':'WASD move · LMB weapon attack · RMB / Q / E / R skills · Space dash · hold Tab for your build';
  if(armoryOpen)renderArmoryPanel(a,cid,info,pw,eq);}
 function equipDrop(id){const a=h.armory(),w=a.weapons.find(n=>n.id===id);if(!w)return;if(w.location==='pocket'){h.toast('Store it in the armory first, then equip it');return;}const i=h.weaponInfo(w);if(i.cls!==h.classId()){h.toast(clsName(i.cls)+' only');return;}act('equip',id);}
 // Armory panel (slides in from the right): tabs, search, rarity, grid, detail, and an Equipped / Safe pocket strip.
 function renderArmoryPanel(a,cid,info,pw,eq){
  const stored=a.weapons.filter(w=>w.location==='armory'||w.location==='overflow').map(info),mine=stored.filter(w=>w.cls===cid);
  $('prep-cap').textContent=a.weapons.filter(w=>w.location==='armory').length+' / '+ARMORY_CAPACITY;
  $('prep-tab-class').textContent='For '+clsName(cid);$('prep-tab-all').textContent='All Weapons';
  for(const [id,k] of [['prep-tab-class','class'],['prep-tab-all','all']]){$(id).classList.toggle('selected',tab===k);$(id).onclick=()=>{tab=k;renderLoadout();};}
  const rs=$('prep-rarity');if(!rs.options.length){rs.append(new Option('Rarity','-1'),...h.rarities.map((r,i)=>new Option(r.name,String(i))));rs.onchange=()=>{rarity=Number(rs.value);renderLoadout();};}
  const se=$('prep-search');se.oninput=()=>{query=se.value.trim().toLowerCase();renderGrid();};
  function renderGrid(){const list=(tab==='class'?mine:stored).filter(w=>(rarity<0||w.rarity===rarity)&&(!query||(w.name+' '+w.kind).toLowerCase().includes(query))).sort((x,y)=>(y.id===a.equipped)-(x.id===a.equipped)||y.rarity-x.rarity);
   $('lb-count').textContent=list.length+(tab==='class'?' compatible weapons':' weapons');
   if(inspect==null||!list.some(w=>w.id===inspect))inspect=list[0]?.id??null;
   const cells=list.map(w=>{const t=tile(w,{badge:w.id===a.equipped?'E':w.favorite?'★':''});if(w.cls!==cid)t.classList.add('other');if(inspect===w.id)t.classList.add('selected');t.onclick=()=>{inspect=w.id;renderGrid();};t.onmouseenter=()=>renderInspect(w);t.onmouseleave=()=>renderInspect(list.find(x=>x.id===inspect));/* Oct 18: hover previews */if(w.cls===cid)drag(t,w.id);return t;});
   const filled=cells.length,total=Math.max(ARMORY_CAPACITY,filled);/* Oct 18 (user): compact 64 px grid */for(let k=filled;k<total;k++)cells.push(el('div','prep-tile slot'+(k===filled&&pw?' target':''),'+'));
   $('prep-grid').replaceChildren(...cells);renderInspect(list.find(w=>w.id===inspect));}
  function renderInspect(w){const box=$('prep-inspect');box.replaceChildren();if(!w){box.append(el('p','lb-note','No weapons match.'));return;}
   const head=el('div','lb-insp-head'),name=el('h3','',w.name),fav=el('button','lb-star'+(w.favorite?' on':''),w.favorite?'★':'☆');fav.title=w.favorite?'Unfavorite':'Favorite';fav.onclick=()=>act('favorite',w.id);head.append(name,fav);
   box.append(head,el('small','lb-kind',w.kind.replace(' · ',' • ')+(w.cls!==cid?' • '+clsName(w.cls)+' only':'')));
   const art=el('div','lb-art');art.style.setProperty('--tint',w.color);art.append(iconNode(w.name,w.cls,'lmb'));box.append(art,el('h4','lb-label','BASIC ATTACK'),el('p','',w.desc||''));
   const stats=el('div','lb-stats');for(const [l,v] of [['POWER',w.power],['ATTACK',w.damage],['ABILITY',w.ability],['BARRIER',w.barrier],['SPEED',w.speed],...(w.reach!=null?[['REACH',w.reach]]:[])]){const s=el('div');s.append(el('small','',l),el('b','','× '+v.toFixed(2)));stats.append(s);}box.append(stats);
   if(w.affixes.length){box.append(el('h4','lb-label','AFFIXES'));for(const x of w.affixes.slice(0,5))box.append(el('p','lb-affix',x));}
   const eqb=el('button','primary lb-equip',w.id===a.equipped?'EQUIPPED':w.cls!==cid?clsName(w.cls).toUpperCase()+' ONLY':'EQUIP');eqb.disabled=w.id===a.equipped||w.cls!==cid;eqb.onclick=()=>act('equip',w.id);box.append(eqb,el('small','lb-note','Changes your basic attack.'));
   // Oct 17 (user): salvage outside the forge pays 70%; second click confirms.
   const sv=el('button','lb-salvage',salvageArm===w.id?'Click again: destroy for +'+w.salvage+' gold':'Salvage · +'+w.salvage+' gold');sv.title='Pays 30% less than salvaging at the Ember Forge';sv.onclick=()=>{if(salvageArm!==w.id){salvageArm=w.id;renderInspect(w);setTimeout(()=>{if(salvageArm===w.id&&inspect===w.id){salvageArm=null;renderInspect(w);}},2500);return;}salvageArm=null;if(act('salvage',w.id,{confirmed:true,away:true})){inspect=null;h.toast('Salvaged '+w.name+' · +'+w.salvage+' gold','#e6c581');renderLoadout();}};box.append(sv);}
  renderGrid();
  const eqs=$('lb-arm-eq'),eh=el('h4','lb-label');eh.append(el('span','','EQUIPPED'),el('em','','LMB · you start the run with it'));eqs.replaceChildren(eh);if(!eq)eqs.append(el('p','lb-note','Nothing equipped · drag a weapon here'));if(eq){const r=el('div','lb-pkrow'),t=tile(eq),txt=el('div','lb-eqtext'),n=el('b','',eq.name);n.style.color=eq.color;txt.append(n,el('small','',eq.kind.replace(' · ',' • ')));r.append(t,txt);eqs.append(r);}dropOn(eqs,id=>equipDrop(id));
  const ps=$('lb-arm-pocket');ps.classList.toggle('occupied',!!pw);ps.replaceChildren();const ph=el('h4','lb-label');ph.append(el('span','','SAFE POCKET'),el('em','',(pw?1:0)+' / 1 · survives the run'));ps.append(ph);
  if(pw){const p=info(pw),r=el('div','lb-pkrow'),t=tile(p);drag(t,pw.id);const txt=el('div','lb-eqtext'),n=el('b','',p.name);n.style.color=p.color;txt.append(n,el('small','','Recovered item'));const st=el('button','lb-open','STORE →');st.onclick=()=>act('stash',pw.id);r.append(t,txt,el('small','lb-note','Drag into storage'),st);ps.append(r);}else ps.append(el('p','lb-note','Empty'));
  dropOn($('prep-grid'),id=>{const w=a.weapons.find(n=>n.id===id);if(w?.location==='pocket')act('stash',id);});}
 function shopRow(icon,tint,name,tag,desc,state,price,onBuy){const r=el('div','arm-row fe-shop-row');r.style.setProperty('--tint',tint);const ic=el('span','bicon fe-swatch',icon);ic.style.background=tint+'33';ic.style.borderColor=tint;const text=el('span','arm-text'),top=el('span','arm-name');top.append(el('b','',name),el('i','',tag));text.append(top,el('small','',desc));const right=el('span','fe-buy');if(state)right.append(el('em','',state));if(price!=null){const b=el('button','primary','Buy · '+price);b.disabled=h.gold()<price;b.onclick=onBuy;right.append(b);}r.append(ic,text,right);return r;}
 function section(name,hint,count){const s=el('h4','arm-section');s.append(el('span','',name),el('small','',hint),el('em','',count));return s;}
 function buy(kind,id){const r=buyItem(h.meta(),kind,id,h.gold());if(r.error){h.toast(r.error);return;}if(!h.purchase(r)){h.toast('Purchase could not be saved');return;}h.toast('Unlocked','#ffc94a');renderUnlocks();}
 function renderUnlocks(){const m=h.meta(),list=[];$('fe-unlocks-gold').textContent=h.gold();
  list.push(section('GAMEPLAY RUNES','Up to three; equip between runs',(m.gameplaySlots??0)+' / 3 slots'));
  const slotPrice=RUNE_SLOT_PRICES[m.gameplaySlots??0];list.push(shopRow('◇','#e6c581','Rune slot '+Math.min(3,(m.gameplaySlots??0)+1),'PERMANENT CAPACITY','Unlock another starter rune slot. Equip up to three runes before a run.',slotPrice==null?'All slots owned':'',slotPrice,()=>buy('gameplaySlot','slot')));
  for(const r of GAMEPLAY_RUNES){const owned=m.gameplayRunes.includes(r.id),on=m.gameplayLoadout.includes(r.id),row=shopRow('◆','#9fdcf0',r.name,'GAMEPLAY',r.desc,owned?(on?'Equipped':'Owned'):'',owned?null:r.price,()=>buy('gameplayRune',r.id));if(owned){const b=el('button','',on?'Unequip':'Equip');b.disabled=!on&&(!runeEligible(r,h.classId())||m.gameplayLoadout.length>=m.gameplaySlots);b.title=b.disabled?(!runeEligible(r,h.classId())?'Unavailable for this class':'Unlock a slot or unequip a rune first'):'';b.onclick=()=>{const out=on?{next:{...h.meta(),gameplayLoadout:h.meta().gameplayLoadout.filter(id=>id!==r.id)}}:equipGameplayRune(h.meta(),r.id,h.classId());if(out.error)h.toast(out.error);else{h.setMeta(out.next);renderUnlocks();}};row.append(b);}list.push(row);}
  list.push(section('VICTORY RECOGNITION','Normal or Endless; cosmetic only',h.victoryUnlocked()?'Earned':'Locked'));
  const won=shopRow('✦','#ffc94a','Tyrant Slayer','ACHIEVEMENT',SPELL_COLORS[0].description,h.victoryUnlocked()?'Unlocked':'Defeat the final boss',null);if(h.victoryUnlocked()){const b=el('button','',m.spellColor==='tyrant'?'Use default spell colors':'Equip Tyrant’s Gold spell color');b.onclick=()=>{h.setMeta({...h.meta(),spellColor:m.spellColor==='tyrant'?null:'tyrant'});renderUnlocks();};won.append(b);}list.push(won);
  // Oct 16 (user): Unlocks doubles as a codex. Paths: first per class free, others bought. Weapons: hidden until found.
  for(const [cid,cname] of [['mage','Mage'],['sword','Warrior'],['ranger','Ranger']]){const ps=PATHS[cid];list.push(section(cname.toUpperCase()+' PATHS','First path free; buy the others',ps.filter(p=>pathUnlocked(m,ps,p.id)).length+' / '+ps.length));
   for(const p of ps){const open=pathUnlocked(m,ps,p.id);list.push(shopRow(p.icon,p.color,p.name,cname.toUpperCase()+' PATH',p.description,open?'Unlocked':'',open?null:PATH_PRICE,()=>buy('path',p.id)));}}
  const found=m.found??[];list.push(section('WEAPON CODEX','Fills in as you find weapons',FAMILIES.filter((f,i)=>!f.removed&&found.includes(i)).length+' / '+FAMILIES.filter(f=>!f.removed).length));
  FAMILIES.forEach((f,i)=>{if(f.removed)return;const seen=found.includes(i);list.push(shopRow(seen?'⚔':'?',seen?'#ffc94a':'#4a5163',seen?f.name:'???',seen?({mage:'MAGE WEAPON',ranger:'RANGER WEAPON'}[f.classId]??'WARRIOR WEAPON'):'NOT FOUND',seen?f.description:'Find this weapon in a run to reveal it.',seen?'Found':'Hidden',null));});
  list.push(section('COLOUR RUNES','Recolour a weapon’s attack effects',m.runes.length+' / '+RUNES.length));
  for(const r of RUNES){const owned=m.runes.includes(r.id);list.push(shopRow('◆',r.color,r.name,'COSMETIC','Changes the colour of the weapon attack animations on the weapon you put it on. No power change.',owned?'Owned':'COMING SOON',null));}
  for(const [sec,title,hint] of [['helpers','LEVEL-UP HELPERS','Charges you start every run with'],['move','BLINK / DASH','Permanent movement upgrades']]){const ups=UPGRADES.filter(u=>u.section===sec);list.push(section(title,hint,ups.reduce((a,u)=>a+tier(m,u.id),0)+' / '+ups.reduce((a,u)=>a+u.prices.length,0)));
   for(const u of ups){const t=tier(m,u.id),p=upgradePrice(m,u.id);list.push(shopRow(sec==='helpers'?'↻':'»',sec==='helpers'?'#e6c581':'#9fd8ff',u.name+(u.prices.length>1?' '+['I','II','III'][Math.min(t,u.prices.length-1)]:''),u.tag,u.desc,p==null?'Max':'Tier '+t+' / '+u.prices.length,p,()=>buy('upgrade',u.id)));}}
  list.push(section('EVOLUTIONS','Coming later','0 / 0'));for(const c of COMING_LATER)list.push(shopRow('✦','#6b7386',c.name,'COMING LATER',c.desc,'Soon',null));
  renderUnlockCatalog(list);}
 function renderBest(){const m=h.meta(),cells=[];for(const [cid,cname] of [['sword','Warrior'],['mage','Mage'],['ranger','Ranger']])for(const md of MODES){const r=m.best[cid+'|'+md.id],c=el('div','fe-record');c.append(el('h4','arm-section',cname.toUpperCase()+' · '+md.name.toUpperCase()));
   if(!r)c.append(el('p','muted small','No run yet.'));else{const g=el('div','stat-grid');for(const [v,l] of [[clock(r.time),r.victory?'Victory':'Survived'],[r.level,'Level'],[r.kills,'Kills'],[r.gold,'Gold']]){const d=el('div');d.append(el('b','',v),el('small','',l));g.append(d);}c.append(g,el('p','muted small',[r.pathName,r.weapon,r.modNames?.length?r.modNames.join(' + '):'',new Date(r.date).toLocaleDateString()].filter(Boolean).join(' · ')));}cells.push(c);}
  const exportButton=el('button','','Export recent run data');exportButton.onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),runs:m.recentRuns??[]},null,2)],{type:'application/json'}));a.href=u;a.download='lights-end-run-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};$('fe-best-list').replaceChildren(exportButton,...cells);$('fe-totals').textContent='Runs played: '+(m.totals.runs??0)+' · Total kills: '+(m.totals.kills??0);}
 for(const b of document.querySelectorAll('.fe-back'))b.onclick=()=>back();
 function back(){show('title');}
 $('fe-play').onclick=()=>{h.unlock();show('loadout');};$('fe-unlocks').onclick=()=>{h.unlock();show('unlocks');};$('fe-best').onclick=()=>show('best');$('fe-howto').onclick=()=>show('howto');
 $('fe-inventory').onclick=()=>{h.unlock();h.openInventory();};$('fe-settings').onclick=()=>{h.unlock();h.openSettings();};$('lb-settings').onclick=()=>h.openSettings();$('lb-arm-close').onclick=()=>setArmory(false);
 // Keys while the menu is up: Enter = main action, Esc/Backspace = back, 1/2 = character.
 function key(k){if(screen==='loadout'&&armoryOpen&&(k==='escape'||k==='backspace')){setArmory(false);return true;}
  if(screen==='title'&&(k==='arrowdown'||k==='arrowup')){const bs=[...document.querySelectorAll('.fe-menu button')].filter(b=>!b.disabled),i=bs.indexOf(document.activeElement);if(bs.length)bs[i<0?(k==='arrowdown'?0:bs.length-1):(i+(k==='arrowdown'?1:-1)+bs.length)%bs.length].focus();return true;}
  if(k==='escape'||k==='backspace'){if(screen!=='title'){back();return true;}return false;}
  if(screen==='loadout'&&['1','2','3'].includes(k)&&!['INPUT','SELECT'].includes(document.activeElement?.tagName)){h.chooseClass({1:'sword',2:'mage',3:'ranger'}[k]);return true;}
  if(screen==='class'&&['1','2','3'].includes(k)){$({1:'class-sword',2:'class-mage',3:'class-ranger'}[k]).click();return true;}
  if(screen==='loadout'&&armoryOpen&&(k==='escape'||k==='backspace')){setArmory(false);renderLoadout();return true;}
  if(k==='enter'){if(screen==='title'){const selected=document.activeElement?.closest('#fe-title .fe-menu button');(selected??$('fe-play')).click();return true;}if(screen==='loadout'&&!$('enter').disabled){$('enter').click();return true;}}
  return false;}
 return {show,key,back,refresh:()=>show(screen),get screen(){return screen;}};
}
