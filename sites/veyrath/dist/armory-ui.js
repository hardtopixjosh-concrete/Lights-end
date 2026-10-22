// Supplied inventory presentation. All mutations stay in the existing account/forge handlers.
const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!=null)e.textContent=text;return e;};
export function createArmoryUI(){
 const root=document.getElementById('armory-panel'),panel=root.firstElementChild,detail=panel.querySelector('.arm-detail');
 root.classList.add('cloth-armory');
 const tabs=node('nav','armory-detail-tabs');tabs.setAttribute('aria-label','Weapon and forge panels');
 for(const [view,label] of [['weapon','Weapon details'],['forge','Forge tools']]){const b=node('button','',label);b.type='button';b.dataset.view=view;b.onclick=()=>{root.dataset.view=view;for(const n of tabs.children)n.setAttribute('aria-pressed',String(n===b));};tabs.append(b);}
 detail.prepend(tabs);
 for(const corner of ['top-left','top-right','bottom-left','bottom-right']){const e=node('i','armory-corner '+corner);e.setAttribute('aria-hidden','true');panel.append(e);}
 const fit=()=>root.style.setProperty('--armory-scale',Math.min(1,(innerWidth-32)/1200,(innerHeight-32)/856));fit();addEventListener('resize',fit);
 let dragging=null;
 const crest=(w,icon)=>{const c=node('span','inventory-crest');c.style.setProperty('--tint',w.color);c.append(icon());return c;};
 function renderGroups({groups,selected,equipped,heldInBag,runCapacity,inventoryCapacity,inRun,rarities,families,weaponClass,weaponStats,iconNode,level,mode,onSelect,onMove,canMove}){
  const list=document.getElementById('weapon-list'),oldScroll=list.scrollTop,sections=[];
  const drop=(target,kind)=>{if(!kind)return;const clear=()=>target.classList.remove('drop-valid','drop-invalid');target.ondragover=e=>{e.preventDefault();const okay=!!dragging&&canMove(kind,dragging);target.classList.toggle('drop-valid',okay);target.classList.toggle('drop-invalid',!okay);e.dataTransfer.dropEffect=okay?'move':'none';};target.ondragleave=e=>{if(!target.contains(e.relatedTarget))clear();};target.ondrop=e=>{e.preventDefault();clear();const id=e.dataTransfer.getData('text/plain')||dragging;if(id)onMove(kind,id);dragging=null;};};
  const tile=(w,compact=false)=>{
   const b=node('button','arm-row inventory-item'+(w.id===selected?' selected':''));b.type='button';b.dataset.weaponId=w.id;b.style.setProperty('--tint',rarities[w.rarity].color);b.setAttribute('aria-pressed',String(w.id===selected));
   const name=w.name+(w.quality?' +'+w.quality:''),desc=weaponStats(w,level,mode).description??'',cls=weaponClass(w);
   b.title=name+' · '+rarities[w.rarity].name+' '+families[w.family].name+'\n'+desc;b.setAttribute('aria-label',b.title+(w.id===equipped?' · Equipped':''));
   b.append(crest({color:rarities[w.rarity].color},()=>iconNode(w.name,cls,'lmb')));
   const text=node('span','arm-text'),top=node('span','arm-name');top.append(node('b','',name),node('i','',rarities[w.rarity].name+' '+families[w.family].name));text.append(top,node('small','',desc));b.append(text);
   if(w.id===equipped)b.append(node('span','arm-state','Equipped'));else if(w.favorite){const star=node('span','inventory-favorite','★');star.setAttribute('aria-label','Favorite');b.append(star);}
   b.onclick=()=>onSelect(w.id);
   if(w.location==='run'||w.location==='pocket'){b.draggable=true;b.ondragstart=e=>{dragging=w.id;e.dataTransfer.setData('text/plain',w.id);e.dataTransfer.effectAllowed='move';};b.ondragend=()=>{dragging=null;root.querySelectorAll('.drop-valid,.drop-invalid').forEach(n=>n.classList.remove('drop-valid','drop-invalid'));};}
   if(compact)b.classList.add('inventory-compact');return b;
  };
  for(const [name,hint,weapons,kind] of groups){
   if(name==='OVERFLOW'&&!weapons.length)continue;
   const key=name.toLowerCase().replaceAll(' ','-'),section=node('section','inventory-section inventory-'+key);section.dataset.group=key;
   const heading=node('h4','arm-section'),title=node('span','',name),note=node('small','',name==='RUN BAG'?'Lost on failure · Kept on victory':name==='SAFE POCKET'?'Kept when the run ends':hint);
   note.title=hint;heading.append(title,note);const capacity=name==='RUN BAG'?runCapacity:name==='SAFE POCKET'?1:name==='INVENTORY'?inventoryCapacity:null;
   const reserved=name==='RUN BAG'&&heldInBag?1:0;
   if(capacity!=null)heading.append(node('em','',(weapons.length+reserved)+' / '+capacity));section.append(heading);
   const body=node('div',name==='RUN BAG'||name==='INVENTORY'||name==='OVERFLOW'?'inventory-grid':'inventory-body');drop(body,kind);
   if(name==='SAFE POCKET'){
    if(weapons.length)for(const w of weapons)body.append(tile(w));
    else{const slot=node('span','inventory-pocket-empty');slot.setAttribute('aria-hidden','true');const message=node('span','pocket-empty-message');message.append(node('b','','Empty'),node('small','',inRun?'Drag a run weapon here to protect it.':'Your safe pocket has no weapon.'));body.append(slot,message);}
   }else{
    for(const w of weapons)body.append(tile(w,name!=='EQUIPPED'));
    if(reserved){const held=node('div','inventory-empty inventory-held-marker');held.append(node('b','','Held weapon'),node('small','','Shown above'));held.title='Your equipped run weapon occupies this bag slot and is kept when the run ends.';body.append(held);}
    if(capacity!=null&&name!=='INVENTORY')for(let i=weapons.length+reserved;i<capacity;i++){const empty=node('div','inventory-empty');empty.setAttribute('aria-label','Empty weapon slot '+(i+1));body.append(empty);}
    if(!weapons.length&&capacity==null)body.append(node('p','inventory-empty-message','No weapon equipped'));
   }
   section.append(body);sections.push(section);
  }
  list.replaceChildren(...sections);list.scrollTop=oldScroll;
  const selectedNode=list.querySelector('[data-weapon-id="'+CSS.escape(selected)+'"]');if(selectedNode){const box=selectedNode.getBoundingClientRect(),bounds=list.getBoundingClientRect();if(box.top<bounds.top||box.bottom>bounds.bottom)selectedNode.scrollIntoView({block:'nearest'});}
 }
 function decorateDetails({weapon,stats,forge,weaponClass,iconNode,rarities,families}){
  if(root.dataset.mode!==(forge?'forge':'inventory'))root.dataset.view='weapon';root.dataset.mode=forge?'forge':'inventory';
  for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.view===root.dataset.view));
  const d=document.getElementById('weapon-detail'),status=d.firstElementChild,title=d.querySelector('.arm-title'),rune=d.querySelector('.fe-rune'),meta=d.querySelectorAll('.arm-meta')[1],description=d.querySelector('.affix'),compare=d.querySelector('.arm-compare'),heading=d.querySelector('h4'),summary=d.lastElementChild;
  status.classList.add('arm-protection');status.classList.toggle('at-risk',weapon.location==='run'&&status.textContent.startsWith('At risk'));
  const head=node('div','arm-weapon-head'),text=node('div','arm-weapon-summary');head.append(crest({color:rarities[weapon.rarity].color},()=>iconNode(weapon.name,weaponClass(weapon),'lmb')));
  const family=node('p','arm-family',rarities[weapon.rarity].name+' '+families[weapon.family].name);meta.textContent='Character level '+stats.effective+' · Permanent power +'+weapon.quality;meta.title='Power bonus now '+Math.round(weapon.quality*8*stats.affixScale)+'%, full strength '+weapon.quality*8+'%';
  text.append(title,family,meta,description);head.append(text);
  const preview=node('div','arm-power-preview');for(let next=compare.nextElementSibling;next&&next!==heading;){const following=next.nextElementSibling;preview.append(next);next=following;}
  const affixes=node('div','arm-affix-list');for(let next=heading.nextElementSibling;next&&next!==summary;){const following=next.nextElementSibling;affixes.append(next);next=following;}
  heading.textContent='AFFIXES';summary.classList.add('arm-affix-summary');
  for(const cell of compare.children){const delta=cell.querySelector('em');cell.dataset.trend=delta?.classList.contains('up')?'positive':delta?'negative':'normal';}
  d.replaceChildren(status,head,rune,compare,preview,heading,affixes,summary);
  document.getElementById('equip-weapon').setAttribute('aria-pressed',String(document.getElementById('equip-weapon').textContent==='Equipped'));
 }
 for(const path of ['panels/modal.png','panels/details.png','panels/equipped_row.png','panels/run_bag.png','crests/navy_blank.png','slots/empty.png','slots/selected.png','buttons/blank/orange_normal.png','buttons/blank/orange_disabled.png','buttons/blank/navy_normal.png','buttons/blank/navy_disabled.png']){const image=new Image();image.src=new URL('./assets/ui/armory/'+path,import.meta.url).href;}
 return {renderGroups,decorateDetails};
}
