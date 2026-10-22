// Recompose the existing live controls; their IDs, values and game handlers stay intact.
// Oct 18 (user): settings are split into Display / Visual effects / Audio tabs. Display adds render resolution,
// windowed/fullscreen and UI scale; Audio adds Master volume and Mute. Those prefs are saved here.
const PREFS='veyrath.display',AUDIO='veyrath.audioMaster',TAB='veyrath.settingsTab';
const load=(key,fallback)=>{try{return {...fallback,...JSON.parse(localStorage.getItem(key))};}catch{return {...fallback};}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const display=load(PREFS,{res:0,ui:1}),audio=load(AUDIO,{master:1,mute:false});
const RESOLUTIONS=[[0,'Native'],[2160,'2160p (4K)'],[1440,'1440p'],[1080,'1080p'],[900,'900p'],[720,'720p']];
// Target render height in pixels (0 = native); game.js resize() turns it into the canvas pixel ratio.
export function renderHeight(){return RESOLUTIONS.some(([h])=>h===display.res)?display.res:0;}
const applyUI=()=>document.documentElement.style.setProperty('--ui-scale',display.ui);
// Master uses the same perceptual curve as the channel sliders, normalised so 100% = full volume.
const applyAudio=()=>{const H=globalThis.Howler;if(!H)return;const m=audio.master;H.volume(m<=0?0:10**(-1.5*(1-Math.min(1,m)))*Math.min(1,m/.05));H.mute(!!audio.mute);};

export function installSettingsUI(){
 const $=id=>document.getElementById(id),menu=$('menu'),board=menu.querySelector('.pause-panel');
 menu.className='v-settings';board.className='v-board';board.setAttribute('role','dialog');board.setAttribute('aria-modal','true');board.setAttribute('aria-labelledby','menu-title');
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
 const art=(cls,file)=>{const img=el('img',cls);img.src='assets/ui/settings/'+file;img.alt='';return img;};
 const fillOf=input=>input.style.setProperty('--fill',((Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100)+'%');
 const title=$('menu-title');title.className='v-title';
 applyUI();applyAudio();
 // Tabs and their panes.
 const NAMES={display:'Display',effects:'Visual effects',audio:'Audio',account:'Account'},  /* Oct 19: Account tab = reset entire account */panes={},tabs={},strip=el('div','v-tabs');strip.setAttribute('role','tablist');
 for(const [id,name] of Object.entries(NAMES)){
  const pane=panes[id]=el('section','v-section v-pane v-'+id);pane.id='settings-'+id;pane.setAttribute('role','tabpanel');pane.setAttribute('aria-label',name);
  const tab=tabs[id]=el('button','v-btn v-tab',name);tab.type='button';tab.setAttribute('role','tab');tab.setAttribute('aria-controls',pane.id);tab.onclick=()=>show(id);strip.append(tab);
 }
 let current;try{current=localStorage.getItem(TAB);}catch{}if(!panes[current])current='display';
 function show(id){current=id;for(const key in panes){const on=key===id;panes[key].hidden=!on;tabs[key].setAttribute('aria-selected',String(on));tabs[key].classList.toggle('v-amber',on);}try{localStorage.setItem(TAB,id);}catch{}refresh();}
 strip.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const ids=Object.keys(NAMES),next=ids[(ids.indexOf(current)+(e.key==='ArrowRight'?1:ids.length-1))%ids.length];e.preventDefault();show(next);tabs[next].focus();});
 // Existing rows from index.html, restyled and moved into their tab.
 const adopt=(id,pane)=>{const control=$(id),row=control.closest('label');row.className='v-row'+(id==='mobile-zoom'?' touch-only':'');row.firstElementChild.className='v-label';
  if(control.type==='checkbox')control.className='v-check';
  else if(control.tagName==='SELECT'){const wrap=el('span','v-select');control.before(wrap);wrap.append(control);const auto=row.querySelector('#gfx-level');if(auto)auto.className='v-auto';}
  else{control.className='v-range';row.querySelector('output').className='v-value';control.addEventListener('input',()=>fillOf(control));}
  pane.append(row);return control;};
 // New rows built here.
 const row=(label,...parts)=>{const r=el('label','v-row');r.append(el('span','v-label',label),...parts);return r;};
 const select=(id,options,value)=>{const s=document.createElement('select');s.id=id;for(const [v,t] of options){const o=document.createElement('option');o.value=String(v);o.textContent=t;s.append(o);}s.value=String(value);const wrap=el('span','v-select');wrap.append(s);return [s,wrap];};
 const range=(id,min,max,step,value,format,onInput)=>{const r=document.createElement('input');Object.assign(r,{id,type:'range',min,max,step,className:'v-range'});r.value=value;const out=el('output','v-value',format(Number(r.value)));r.addEventListener('input',()=>{out.textContent=format(Number(r.value));fillOf(r);onInput(Number(r.value));});return [r,out];};
 const pct=v=>Math.round(v)+'%';
 // Display: resolution, window mode, camera scale, (mobile zoom), UI scale.
 const [res,resWrap]=select('render-res',RESOLUTIONS,renderHeight());res.onchange=()=>{display.res=Number(res.value);save(PREFS,display);dispatchEvent(new Event('resize'));};
 panes.display.append(row('Resolution',resWrap));
 const [mode,modeWrap]=select('window-mode',[['windowed','Windowed'],['fullscreen','Fullscreen']],'windowed'),root=document.documentElement;
 const syncMode=()=>{mode.value=document.fullscreenElement?'fullscreen':'windowed';};syncMode();document.addEventListener('fullscreenchange',syncMode);
 mode.onchange=()=>{const p=mode.value==='fullscreen'?root.requestFullscreen?.({navigationUI:'hide'}):document.fullscreenElement?document.exitFullscreen?.():null;Promise.resolve(p).catch(syncMode);};
 const modeRow=row('Window mode',modeWrap);if(!document.fullscreenEnabled){mode.disabled=true;modeRow.title='Fullscreen is not available in this browser';}
 panes.display.append(modeRow);
 adopt('zoom',panes.display);adopt('mobile-zoom',panes.display);
 const [ui,uiOut]=range('ui-scale',.4,1.5,.05,display.ui,v=>pct(v*100),v=>{display.ui=v;save(PREFS,display);applyUI();});panes.display.append(row('UI scale',ui,uiOut));
 // Visual effects: graphics quality and every effect toggle.
 for(const id of ['gfx-quality','shader-vfx','post-fx','pack-fx','dust','fps-toggle'])adopt(id,panes.effects);
 const report=$('fps-report');report.className='v-btn v-blue v-copy';panes.effects.append(report);
 // Audio: master, mute, then the three channel sliders.
 const [master,masterOut]=range('master-volume',0,100,1,Math.round(audio.master*100),pct,v=>{audio.master=v/100;save(AUDIO,audio);applyAudio();});panes.audio.append(row('Master',master,masterOut));
 const mute=document.createElement('input');Object.assign(mute,{id:'audio-mute',type:'checkbox',className:'v-check',checked:!!audio.mute});mute.onchange=()=>{audio.mute=mute.checked;save(AUDIO,audio);applyAudio();};panes.audio.append(row('Mute all sound',mute));
 for(const id of ['music-volume','background-volume','fx-volume'])adopt(id,panes.audio);
 // Account: wipe every save (confirm popup + reset handled in game.js #reset-account).
 const wipe=$('reset-account');wipe.className='v-btn v-danger';panes.account.append(el('p','v-account-note','Start over from scratch: deletes all weapons, gold, unlocks, runes, upgrades, achievements and best runs. Settings are kept.'),wipe);
 const actions=el('div','v-actions');for(const [id,tone] of [['resume','v-amber'],['restart-run',''],['reset','v-blue'],['abandon-run','v-danger']]){const b=$(id);b.className='v-btn '+tone;actions.append(b);}
 const help=$('pause-help');help.className='v-controls';
 const dev=$('dev-section'),details=el('details','settings-dev-details'),summary=el('summary','','Developer tools');while(dev.firstChild)details.append(dev.firstChild);details.prepend(summary);dev.append(details);
 const credits=board.querySelector('.ui-credits');credits.className='settings-credits';
 board.replaceChildren(art('v-backplate','panels/settings_cloth.png'),art('v-crest','crests/settings_gear.png'),title,strip,...Object.values(panes),art('v-hline','ornaments/divider_horizontal.svg'),help,actions,dev,credits);
 const fit=()=>{board.style.transform=`scale(${Math.min((innerWidth-16)/1448,(innerHeight-16)/1086,1)})`;};fit();addEventListener('resize',fit);
 // Synchronize the painted tracks when the game's initialization/open handlers set values.
 function refresh(){for(const input of board.querySelectorAll('.v-range'))fillOf(input);}
 show(current);
 let previousFocus=null;
 new MutationObserver(()=>{if(!menu.hidden){refresh();syncMode();previousFocus=document.activeElement;$('resume').focus({preventScroll:true});}else if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}).observe(menu,{attributes:true,attributeFilter:['hidden']});
 menu.addEventListener('keydown',e=>{if(e.target.matches('input,select')&&['r','x','Backspace'].includes(e.key)){e.stopPropagation();return;}if(e.key!=='Tab')return;e.stopPropagation();const all=[...board.querySelectorAll('button,input,select,summary,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length),first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
}
