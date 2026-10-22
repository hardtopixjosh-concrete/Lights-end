// Presentation only. Existing HUD nodes, input handlers and tooltips retain their identity.
const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!=null)e.textContent=text;return e;};
export function setOrbFill(fill,percent){
 if(!fill?.dataset.orbFill)return;
 const value=Math.max(0,Math.min(100,Number.parseFloat(percent)||0)),empty=(100-value)+'%';
 if(fill.style.getPropertyValue('--orb-empty')!==empty)fill.style.setProperty('--orb-empty',empty);
 fill.closest('.hud-orb').classList.toggle('low-health',fill.id==='hp-fill'&&value>0&&value<25);
}
export function setHudCooldown(slot,fraction){
 const angle=Math.round(Math.max(0,Math.min(1,Number(fraction)||0))*360)+'deg';
 if(slot.style.getPropertyValue('--cooldown-angle')!==angle)slot.style.setProperty('--cooldown-angle',angle);
}
export const orbValueText=(el,value)=>el.id==='hp-text'?String(value).replace(/^HP\s+/, ''):el.id==='res-text'?String(value).split(' · ')[0]:String(value);
export function installOrbHUD(){
 for(const path of ['orbs/frame_gold.png','orbs/glass_empty.png','orbs/glass_shine.png','orbs/liquid_health.png','orbs/liquid_mana.png','panels/action_bar.png','panels/run_stats.png','slots/normal.png','slots/locked.png']){const image=new Image();image.src=new URL('./assets/ui/orb-hud/'+path,import.meta.url).href;}
 const root=document.querySelector('.hudbar');root.classList.add('orb-hud');
 const hp=root.querySelector('.hp'),res=root.querySelector('.res'),xp=root.querySelector('.xp'),slots=root.querySelector('.slots'),side=root.querySelector('.hud-side');
 const stats=node('div','hud-run-stats'),gold=document.getElementById('gold-status'),time=document.getElementById('run-time'),kills=document.getElementById('run-kills');
 stats.setAttribute('aria-label','Run counters');stats.append(gold,time,kills);
 const level=document.getElementById('lv-text'),xpText=document.getElementById('xp-text');
 for(const [orb,kind] of [[hp,'health'],[res,'resource']]){
  orb.classList.add('hud-orb','orb-'+kind);const fill=orb.querySelector('i'),mask=node('div','orb-liquid-mask');
  fill.dataset.orbFill='true';mask.append(fill);orb.prepend(mask);
  const label=kind==='health'?node('b','orb-label','HP'):document.getElementById('res-label');label.classList.add('orb-label');orb.append(label);
  orb.append(node('div','orb-glass'),node('div','orb-frame'));
  const text=orb.querySelector(kind==='health'?'#hp-text':'#res-text');text.classList.add('orb-value');text.textContent=orbValueText(text,text.textContent);
  setOrbFill(fill,fill.style.width||(kind==='health'?'100%':'0%'));
 }
 const shield=node('span','orb-shield');shield.id='hud-shield';res.append(shield);
 root.append(hp,res,stats,slots,xp,level,xpText,side);root.querySelector('.hud-main').remove();side.querySelector('.run-chip').remove();
 const bindings={lmb:'Mouse0',cleave:'Mouse2',parry:'KeyQ',slam:'KeyE',storm:'KeyR',dash:'Space'};
 for(const [id,key] of Object.entries(bindings)){
  const slot=document.getElementById('slot-'+id);slot.dataset.hudKey=key;
  slot.tabIndex=0;slot.setAttribute('role','group');slot.setAttribute('aria-label',slot.querySelector('kbd').textContent+' ability');
 }
 const pressed=(key,on)=>{if(document.body.classList.contains('in-menu'))on=false;for(const el of document.querySelectorAll('[data-hud-key]'))if(el.dataset.hudKey===key)el.classList.toggle('hud-pressed',on);};
 addEventListener('keydown',e=>pressed(e.code,true));addEventListener('keyup',e=>pressed(e.code,false));
 addEventListener('pointerdown',e=>pressed('Mouse'+e.button,true));addEventListener('pointerup',e=>pressed('Mouse'+e.button,false));
 const clear=()=>document.querySelectorAll('.hud-pressed').forEach(e=>e.classList.remove('hud-pressed'));
 addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 const fit=()=>root.style.setProperty('--orb-hud-scale',Math.max(.1,Math.min(.8,(innerWidth-24)/1600,innerHeight*(document.body.classList.contains('touch')?.28:.30)/340)));
 fit();addEventListener('resize',fit);
 return {shield};
}
