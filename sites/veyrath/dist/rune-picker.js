import {RUNES,RUNE_PRICE,COLOUR_RUNES_AVAILABLE,buyItem} from './meta.js?v=fx-260';
import {GAMEPLAY_RUNES,RUNE_SLOT_PRICES,runeEligible,equipGameplayRune} from './progression.js?v=fx-260';
const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!=null)e.textContent=text;return e;};
export function createRunePicker(h,refresh,unlocks){
 const dialog=node('dialog','rune-inventory');dialog.setAttribute('aria-labelledby','rune-inventory-title');document.body.append(dialog);
 let returnFocus;
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus();else document.querySelector('#lb-colour-pick')?.focus();});
 const button=(label,fn)=>{const b=node('button','',label);b.type='button';b.onclick=fn;return b;};
 function purchase(kind,id){
  const result=buyItem(h.meta(),kind,id,h.gold());
  if(result.error){h.toast(result.error);return false;}
  if(!h.purchase(result)){h.toast('Purchase could not be saved');return false;}
  refresh();return true;
 }
 function open(kind,slot=0,focusRune=null){
  if(!dialog.open)returnFocus=document.activeElement;dialog.replaceChildren();
  const m=h.meta(),a=h.armory(),eq=a.weapons.find(w=>w.id===a.equipped),colour=kind==='colour',locked=!colour&&m.gameplaySlots===0;
  // An inventory opened from a locked slot can still equip into a purchased slot.
  const targetSlot=colour?0:Math.min(slot,Math.max(0,m.gameplaySlots-1));
  const head=node('header',''),title=node('h2','',colour?'Colour rune inventory':'Starter rune inventory');title.id='rune-inventory-title';
  const close=button('✕',()=>dialog.close());close.setAttribute('aria-label','Close rune inventory');head.append(title,close);dialog.append(head);
  dialog.append(node('p','rune-inventory-note',colour?'New colour runes are coming soon. Select an owned colour for your equipped weapon.':locked?'All starter slots are locked. Unlock a slot below to use your runes.':'Select a rune for slot '+(targetSlot+1)+'. '+m.gameplayLoadout.length+' / '+m.gameplaySlots+' unlocked slots equipped.'));
  const shop=node('div','rune-shop-bar');shop.append(node('strong','rune-wallet',h.gold()+' gold'));
  const slotPrice=RUNE_SLOT_PRICES[m.gameplaySlots];
  if(!colour&&slotPrice!=null){
   const unlock=button('Unlock slot '+(m.gameplaySlots+1)+' · '+slotPrice+' gold',()=>{
    if(h.meta().gameplaySlots!==m.gameplaySlots)return;
    if(purchase('gameplaySlot','slot'))open(kind,m.gameplaySlots);
   });unlock.className='rune-slot-buy';unlock.disabled=h.gold()<slotPrice;shop.append(unlock);
  }
  dialog.append(shop);
  const list=node('div','rune-inventory-list');
  const choices=colour?[{id:'',name:'Default',color:'#8fa3b8'},...RUNES]:GAMEPLAY_RUNES;
  for(const r of choices){
   const owned=colour?(!r.id||m.runes.includes(r.id)):m.gameplayRunes.includes(r.id),selected=colour?(m.runeOn[eq?.id]??'')===r.id:m.gameplayLoadout.includes(r.id),eligible=colour?!!eq:runeEligible(r,h.classId());
   const b=button('',()=>{
    if(!owned){if(purchase(colour?'rune':'gameplayRune',r.id))open(kind,slot,r.id);return;}
    if(colour)h.setRune(eq.id,r.id);
    else{
     let base=h.meta();
     if(base.gameplayLoadout.includes(r.id))return;
     // A chosen occupied slot replaces its rune atomically; removal is explicit.
     if(!base.gameplayLoadout.includes(r.id)&&base.gameplayLoadout[targetSlot]){base=structuredClone(base);base.gameplayLoadout.splice(targetSlot,1);}
     const out=equipGameplayRune(base,r.id,h.classId());if(out.error){h.toast(out.error);return;}
     out.next.gameplayLoadout.splice(out.next.gameplayLoadout.indexOf(r.id),1);out.next.gameplayLoadout.splice(Math.min(targetSlot,out.next.gameplayLoadout.length),0,r.id);h.setMeta(out.next);
    }
    refresh();open(kind,slot,r.id);
   });
   const price=colour?RUNE_PRICE:r.price,soon=colour&&!owned&&!COLOUR_RUNES_AVAILABLE;
   b.className='rune-choice '+(owned?'rune-owned':'rune-locked')+(selected?' rune-equipped':'');b.dataset.rune=r.id;b.disabled=soon||(owned?(!eligible||locked):h.gold()<price);b.setAttribute('aria-pressed',String(selected));
   const gem=node('span',owned?'rune-glyph':'rune-lock',owned?'◆':'');gem.setAttribute('aria-hidden','true');gem.style.color=r.color??'#a5dfef';
   const text=node('span',''),name=node('strong','',r.name),desc=node('small','',colour?(r.id?'Weapon colour':'Original weapon colour'):r.desc);
   const state=node('em','rune-ownership',soon?'LOCKED':!owned?'LOCKED · '+price+' gold':selected?'✓ EQUIPPED':'UNLOCKED');
   const action=node('span','rune-card-action',soon?'COMING SOON':!owned?'Unlock · '+price+' gold'+(h.gold()<price?' · Need more gold':''):!eligible?'Unavailable for this class':locked?'Unlock a starter slot to use':selected?'Selected':colour?'Select colour':'Select for slot '+(targetSlot+1));
   text.append(name,desc,state,action);b.append(gem,text);list.append(b);
  }
  dialog.append(list);const footer=node('footer','');footer.append(button('Open Unlocks',()=>{dialog.close();unlocks();}));
  if(!colour&&!locked&&m.gameplayLoadout[targetSlot])footer.append(button('Unequip slot',()=>{const next=structuredClone(h.meta());next.gameplayLoadout.splice(targetSlot,1);h.setMeta(next);refresh();open(kind,slot);}));
  footer.append(button('Done',()=>dialog.close()));dialog.append(footer);if(!dialog.open)dialog.showModal();
  if(focusRune!==null)([...list.children].find(b=>b.dataset.rune===focusRune)??close).focus();else if(dialog.open)close.focus();
 }
 return function render(){
  const m=h.meta(),a=h.armory(),eq=a.weapons.find(w=>w.id===a.equipped),id=m.runeOn[eq?.id]??'',r=RUNES.find(r=>r.id===id),box=document.getElementById('lb-runes');
  box.classList.add('rune-picker-summary');const b=button('',()=>open('colour'));b.id='lb-colour-pick';b.disabled=!eq;
  const gem=node('span','rune-glyph','◆');gem.style.color=r?.color??'#8fa3b8';b.append(gem,node('strong','',r?.name??'Default'),node('small','','Change ›'));box.replaceChildren(b);
  const note=document.getElementById('lb-rune-note');note.hidden=true;
  let starter=document.getElementById('lb-starter-runes');if(!starter){starter=node('section','');starter.id='lb-starter-runes';note.after(starter);}
  starter.replaceChildren(node('h4','lb-label','STARTER RUNES'));const slots=node('div','starter-rune-slots');
  for(let i=0;i<3;i++){
   const locked=i>=m.gameplaySlots,r=GAMEPLAY_RUNES.find(r=>r.id===m.gameplayLoadout[i]),b=button('',()=>open('starter',i));
   b.className='starter-rune-slot'+(locked?' locked':'');b.setAttribute('aria-label','Starter rune slot '+(i+1)+': '+(locked?'Locked':r?.name??'Empty'));
   b.append(node('span','',locked?'▣':r?'◆':'+'),node('strong','',locked?'Locked':r?r.name.replace('Rune of ',''):'Empty'),node('small','','Slot '+(i+1)));slots.append(b);
  }
  starter.append(slots);
 };
}
