import {developmentDescription,ATTACK_DEVELOPMENTS} from './developments.js?v=fx-260';
import {pathInfo,pathNodes,rank,SLOTS,SPELL_LEVELS} from './specializations.js?v=fx-260';
import {cardSummary} from './level-cards.js?v=fx-260';
import {iconNode} from './ui-icons.js?v=fx-260';
function el(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
const SLOT_KEY={RMB:'cleave',Q:'parry',E:'slam',R:'storm'};
function row(name,desc,{tint,classId,slot,locked}={}){
 const r=el('div','brow'+(locked?' locked':'')),icon=el('div','bicon');if(tint)r.style.setProperty('--tint',tint);
 icon.append(iconNode(name,classId,slot));const text=el('div');text.append(el('b','',name),el('small','',desc));r.append(icon,text);return r;
}
// UI redesign (Oct 16): "Your build" panel shown while Tab is held (replaces the K Spellbook).
// Read-only: weapon, owned/locked spells, learned behaviors, stat cards and active blessings/curses.
export function renderBuild(container,s,{classId,weapon,spellName,buffs=[]}={}){
 container.replaceChildren(el('h3','','YOUR BUILD'));
 const path=pathInfo(s),tint=path?.color,nodes=pathNodes(s);
 if(weapon){container.append(el('h4','','WEAPON'),row(weapon.name,weapon.desc||'Left click',{tint:weapon.color,classId,slot:'lmb'}));}
 if(!path){container.append(el('small','','Choose a specialization to see your spells.'));return;}
 container.append(el('h4','','SPELLS · '+path.name.toUpperCase()));
 for(const slot of SLOTS){
  const root=nodes.find(n=>n.ability===slot&&n.tier===0);if(!root)continue;
  const owned=!!rank(s,root.id),name=spellName?.(slot)??root.name;
  container.append(row(slot+' · '+name,owned?root.description:(slot==='R'?'Locked: unlocks at level '+SPELL_LEVELS.at(-1):'Locked: chosen at a spell level ('+SPELL_LEVELS.slice(0,-1).join(', ')+')'),{tint,classId,slot:SLOT_KEY[slot],locked:!owned}));
 }
 const learned=nodes.filter(n=>n.tier>0&&rank(s,n.id));
 if(learned.length){container.append(el('h4','','BEHAVIORS'));for(const n of learned)container.append(row(n.name,n.ability+' · '+n.description,{tint,classId,slot:SLOT_KEY[n.ability]}));}
 const stats=cardSummary(s);
 if(stats.length){container.append(el('h4','','STATS'));for(const c of stats)container.append(row(c.name,c.description,{tint:'#c9cfdb',classId}));}
 if(buffs.length){container.append(el('h4','','BLESSINGS & CURSES'));for(const b of buffs)container.append(row(b.name,b.desc,{tint:b.tint,classId}));}
}
// Oct 18 (user): talent window from the Veyrath Talent Tree pack (assets/ui/talents) on its 1672x941 design board,
// scaled to fit. Left: Attack, Resource / Hybrid and Defense / Support rows with rank buttons. Right: one augment tree
// per spell (root, two tier-1, two tier-2; a tier-2 needs any tier-1) and an inert Coming Soon grid. Only real game
// data is shown; the offer's options decide what is clickable and onPick(index) learns it. Layers are drawn separately
// (backing, path-colour glow, glyph, frame, lock) so available/learned nodes take the subclass colour.
const TT='assets/ui/talents/',TT_ICONS=new Set('arrow_type coverage deep_frost eagle_eye elemental_surge ember_tips final_salvo focus hail_of_focus heavy_draw hunters_focus hunters_mark long_volley marked_prey momentum_flow power_shot quick_draw rain_of_arrows resource_hybrid resource_leaf resource_spiral rhythm split_shot steady_focus virulent volley'.split(' '));
const ttSlug=t=>String(t??'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const TT_BRANCH_X=[626,905,1184,1463],TT_OFF=68,TT_ROOT=275,TT_T1=365,TT_T2=493,TT_SOON=[664,732,800];
const TT_ROW_ICON={'Resource / Hybrid':'resource_hybrid'},TT_ROLE_SHORT={focus:'+15% attack damage',rhythm:'+10% attack speed'};
function ttNode(size,state,{icon,name,classId,slot,rankText}={}){
 const n=el('span','tt-node tt-'+state);n.style.setProperty('--sz',size+'px');n.append(el('i','tt-back'));
 if(state==='have'||state==='open')n.append(el('i','tt-glow'));
 const key=icon??ttSlug(name);
 if(rankText)n.append(el('b','tt-rank',rankText));
 else if(TT_ICONS.has(key)){const g=el('i','tt-glyph');g.style.setProperty('--glyph',`url(${TT}icons/${key}.svg)`);n.append(g);}
 else if(name){const g=el('i','tt-glyph tt-svg');g.append(iconNode(name,classId,slot));n.append(g);}
 n.append(el('i','tt-frame'),el('i','tt-ftint'));if(state==='shut'&&!rankText)n.append(el('i','tt-lock'));return n;
}
let ttFit=null;
export function renderAugmentTree(container,s,options,onPick,{classId}={}){
 const path=pathInfo(s),tint=path?.color??'#e6c581',nodes=pathNodes(s),family=s.weaponFamily;
 const have=n=>!!rank(s,n.id),idx=n=>options.findIndex(o=>o.id===n.id),state=n=>have(n)?'have':idx(n)>=0?'open':'shut';
 const wrap=el('div','tt-wrap'),board=el('div','tt-board');wrap.append(board);board.style.setProperty('--tint',tint);
 const at=(node,x,y,cls)=>{if(cls)node.classList.add(cls);node.style.left=x+'px';node.style.top=y+'px';board.append(node);return node;};
 const SVG='http://www.w3.org/2000/svg',svg=document.createElementNS(SVG,'svg');svg.setAttribute('viewBox','0 0 1672 941');svg.classList.add('tt-lines');board.append(svg);
 const line=(x1,y1,x2,y2,cls)=>{const l=document.createElementNS(SVG,'line');for(const [k,v] of Object.entries({x1,y1,x2,y2}))l.setAttribute(k,v);l.setAttribute('class',cls);svg.append(l);};
 const rule=(x1,y,x2,cls='tt-rule')=>{const r=at(el('i',cls),x1,y);r.style.width=(x2-x1)+'px';};
 const vline=(x,y1,y2,cls='tt-vline')=>{const r=at(el('i',cls),x,y1);r.style.height=(y2-y1)+'px';};
 // Footer info: hover a node to read it.
 const info=at(el('div','tt-info'),486,866),idle=()=>info.replaceChildren(el('b','',options.length?'Pick one augment':'No augments available'),el('span','','Bright nodes can be learned. Second-row talents need one augment above.'));
 /* Oct 18 (user): hover/focus shows a tooltip beside the node instead of in the footer. */
 const tip=el('div','tt-tip'),hideTip=()=>tip.classList.remove('show');
 const describe=(target,title,body)=>{const show=()=>{tip.replaceChildren(el('b','',title),el('span','',body));const cx=parseFloat(target.style.left)||0,cy=parseFloat(target.style.top)||0,centred=target.classList.contains('tt-c'),w=target.offsetWidth||60,h=target.offsetHeight||60,x0=centred?cx-w/2:cx,y0=centred?cy-h/2:cy,TW=340,right=x0+w+14+TW<1640;tip.style.left=(right?x0+w+14:x0-14-TW)+'px';tip.classList.add('show');const th=tip.offsetHeight||90;tip.style.top=Math.max(20,Math.min(941-th-20,y0+h/2-th/2))+'px';};target.addEventListener('mouseenter',show);target.addEventListener('focus',show);target.addEventListener('mouseleave',hideTip);target.addEventListener('blur',hideTip);};
 const place=(n,size,x,y,opts,title,body)=>{const i=n?idx(n):-1,b=el(i>=0?'button':'div','tt-hit');if(i>=0){b.type='button';b.onclick=()=>onPick(i);}b.append(ttNode(size,n?state(n):'soon',opts));at(b,x,y,'tt-c');if(title)describe(b,title,body);return b;};
 // Window, header and dividers.
 at(el('div','tt-modal'),64,24);for(const [k,x,y] of [['top_left',58,18],['top_right',1575,18],['bottom_left',58,875],['bottom_right',1575,875]]){const c=at(el('img','tt-corner'),x,y);c.src=TT+'artwork/corner_'+k+'.png';c.alt='';}
 board.append(svg);/* connector lines sit above the window but under the nodes */
 at(el('h2','tt-title','TALENTS'),117,30);rule(90,104,1582);
 at(ttNode(28,'open'),1289,70,'tt-c');at(el('span','tt-legend','Available'),1313,58);at(ttNode(28,'shut',{rankText:' '}),1425,70,'tt-c');at(el('span','tt-legend','Locked'),1448,58);
 const x=at(el('button','tt-x'),1535,45);x.type='button';x.setAttribute('aria-label','Close talents');x.onclick=()=>document.getElementById('levelup-close')?.click();
 vline(480,111,843);rule(91,852,1582);
 // Left column: every passive category the path has, one row per chain with its rank buttons.
 let y=110;
 for(const category of ['Attack','Resource / Hybrid','Defense / Support']){
  const list=nodes.filter(n=>n.category===category);if(!list.length)continue;
  at(el('h3','tt-head',category.toUpperCase()),104,y);rule(91,y+40,465);y+=80;
  const chains=new Map();for(const n of list){const key=n.role??n.id.replace(/\d+$/,'');if(!chains.has(key))chains.set(key,[]);chains.get(key).push(n);}
  [...chains.values()].forEach((chain,r)=>{
   chain.sort((a,b)=>a.tier-b.tier);const role=chain[0].role,profile=ATTACK_DEVELOPMENTS[family],next=chain.find(n=>!have(n))??chain.at(-1);
   const title=role?role[0].toUpperCase()+role.slice(1):next.name;
   const short=role?(TT_ROLE_SHORT[role]??(profile?Object.entries(profile.mods).map(([k,v])=>['pierce','beamPierce'].includes(k)?'+'+v+' pierce':'+'+Math.round((v-1)*100)+'% '+k).join(' · '):'')):next.description.split('. ')[0].replace(/\.$/,'');
   const rowState=chain.some(have)?'have':chain.some(n=>idx(n)>=0)?'open':'soon';
   const icon=at(ttNode(57,rowState,{icon:role??TT_ROW_ICON[category],name:chain[0].name,classId}),128,y,'tt-c');describe(icon,title,chain.map(n=>n.name+': '+developmentDescription(n,family)).join('  ·  '));
   const rn=at(el('b','tt-rname',title),170,y-26);if(title.length>17)rn.style.fontSize='16px';at(el('small','tt-rsum',short),170,y+2);
   chain.slice(0,2).forEach((n,k)=>place(n,46,371+k*61,y,{rankText:String(k+1)},(role?title+' '+(k+1):n.name)+(have(n)?' · learned':''),developmentDescription(n,family)+(state(n)==='shut'&&k?' (Needs rank '+k+' first.)':'')));
   if(r<chains.size-1)rule(103,y+39,451,'tt-rowline');y+=80;});
  y-=10;
 }
 // Right: ability augment trees.
 at(el('h3','tt-head tt-head-big','ABILITY AUGMENTS'),500,110);rule(493,150,1582);
 SLOTS.forEach((slot,b)=>{
  const root=nodes.find(n=>n.ability===slot&&n.tier===0),cx=TT_BRANCH_X[b];if(!root||cx==null)return;const owned=have(root);
  if(b>0){vline(cx-140,166,579,'tt-vline tt-thin');vline(cx-140,625,836,'tt-vline tt-thin');}
  const head=at(el('div','tt-branch'+(owned?'':' locked'),root.name.toUpperCase()),cx,160);if(root.name.length>13)head.style.fontSize=(root.name.length>16?18:21)+'px';if(!owned)head.append(el('i','tt-hlock'));
  at(el('span','tt-key'+(owned?'':' locked'),slot),cx,208,'tt-c');
  const t1=nodes.filter(n=>n.ability===slot&&n.tier===1).slice(0,2),t2=nodes.filter(n=>n.ability===slot&&n.tier===2).slice(0,2);
  const pos=(k,row)=>[cx+(k?TT_OFF:-TT_OFF),row];
  t1.forEach((n,k)=>line(cx,TT_ROOT,...pos(k,TT_T1),owned?'lit':'dim'));
  t1.forEach((a,i)=>t2.forEach((c,k)=>line(...pos(i,TT_T1),...pos(k,TT_T2),have(a)&&have(c)?'lit':owned?'mid':'dim')));
  place(root,80,cx,TT_ROOT,{name:root.name,classId,slot:SLOT_KEY[slot]},slot+' · '+root.name+(owned?' · learned':''),root.description+(owned?'':' (Locked: learn this spell at a spell level first.)'));
  [[t1,TT_T1],[t2,TT_T2]].forEach(([tier,row],t)=>tier.forEach((n,k)=>{const [nx,ny]=pos(k,row);
   place(n,76,nx,ny,{name:n.name,classId,slot:SLOT_KEY[slot]},n.name+(have(n)?' · learned':''),n.description+(state(n)==='shut'?(owned?(t?' (Needs a tier-1 augment of this spell.)':''):' (Learn '+root.name+' first.)'):''));
   at(el('span','tt-nname'+(state(n)==='shut'?' locked':''),n.name),nx,ny+42);}));
  for(const sy of TT_SOON)for(const dx of [-TT_OFF,TT_OFF])at(ttNode(58,'soon'),cx+dx,sy,'tt-c');
 });
 rule(505,584,1575);at(el('h3','tt-soonhead','Coming Soon'),509,588);rule(655,608,1570,'tt-rowline');
 // Footer: Heal instead (the level-up helper) and Close (= Decide later).
 const heal=document.querySelector('#levelup-helpers .heal');if(heal){const h=at(el('button','tt-btn tt-heal',heal.textContent.replace(/\s*6$/,'')),100,862);h.type='button';h.disabled=heal.disabled;h.onclick=()=>heal.click();}
 const close=at(el('button','tt-btn tt-close'),1420,862);close.type='button';close.append(el('kbd','','Esc'),el('span','','Close'));close.onclick=()=>document.getElementById('levelup-close')?.click();
 board.append(info,tip);idle();container.replaceChildren(wrap);
 if(!ttFit){ttFit=()=>document.documentElement.style.setProperty('--tt-s',Math.min(innerWidth/1672,innerHeight/941));addEventListener('resize',ttFit);}ttFit();
}
