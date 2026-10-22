import {MODES} from './meta.js?v=fx-260';
// Scale the supplied banner art without changing the live 3D scene or controls.
export function installCharacterUI(){
 const screen=document.getElementById('fe-loadout');
 if(screen.dataset.clothReady)return;
 screen.dataset.clothReady='true';
 const fit=()=>screen.style.setProperty('--cs-scale',Math.min(innerWidth/1672,(innerHeight-116)/820));
 fit();window.addEventListener('resize',fit);
 installModeMenu(screen);
}

function installModeMenu(screen){
 const select=document.getElementById('lb-mode'),wrap=document.createElement('div');
 wrap.className='lb-mode-picker';select.before(wrap);select.hidden=true;
 const trigger=document.createElement('button'),menu=document.createElement('div');
 trigger.id='lb-mode-trigger';trigger.type='button';trigger.setAttribute('aria-haspopup','menu');
 trigger.setAttribute('aria-controls','lb-mode-menu');trigger.setAttribute('aria-expanded','false');
 menu.id='lb-mode-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Run mode');menu.hidden=true;
 const close=(focus=false)=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();};
 const choices=MODES.map(mode=>{
  const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitemradio');b.dataset.mode=mode.id;
  const name=document.createElement('strong'),desc=document.createElement('small');name.textContent=mode.name;desc.textContent=mode.desc;b.append(name,desc);
  b.onclick=()=>{select.value=mode.id;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close(true);};
  menu.append(b);return b;
 });
 const sync=()=>{trigger.textContent=select.selectedOptions[0]?.textContent??'Normal';trigger.setAttribute('aria-label','Run mode: '+trigger.textContent);trigger.disabled=select.disabled;choices.forEach(b=>b.setAttribute('aria-checked',String(b.dataset.mode===select.value)));};
 const open=()=>{sync();menu.hidden=false;trigger.setAttribute('aria-expanded','true');(choices.find(b=>b.dataset.mode===select.value)??choices[0]).focus();};
 trigger.onclick=()=>menu.hidden?open():close();
 wrap.append(trigger,menu);
 wrap.addEventListener('keydown',e=>{
  // Keep menu keystrokes from reaching the lobby's Enter-to-start shortcut.
  e.stopPropagation();
  if(e.key==='Escape'){e.preventDefault();close(true);}
  else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();if(menu.hidden){open();return;}
   const i=choices.indexOf(document.activeElement),n=e.key==='Home'?0:e.key==='End'?choices.length-1:(i+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;choices[n].focus();
  }else if(e.key==='Tab')close();
 });
 document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close();});
 new MutationObserver(sync).observe(select,{childList:true,attributes:true,subtree:true});
 new MutationObserver(()=>{if(screen.hidden)close();}).observe(screen,{attributes:true,attributeFilter:['hidden']});
 select.addEventListener('change',sync);sync();
}
