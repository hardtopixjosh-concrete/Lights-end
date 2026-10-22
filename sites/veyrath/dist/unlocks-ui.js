import {unlockIcon,unlockCrestColor} from './unlocks-icons.js?v=fx-260';
const CATEGORIES=[
 ['runes','Starter runes','Slots and run bonuses'],
 ['paths','Class paths','Mage, Warrior and Ranger'],
 ['upgrades','Run upgrades','Level-up helpers and movement'],
 ['weapons','Weapon codex','Your discovered weapon families'],
 ['cosmetics','Cosmetics & rewards','Colours and victory recognition'],
 ['future','Coming soon','Future additions']
];
const category=name=>name.includes('PATHS')?'paths':name==='WEAPON CODEX'?'weapons':['COLOUR RUNES','VICTORY RECOGNITION'].includes(name)?'cosmetics':['LEVEL-UP HELPERS','BLINK / DASH'].includes(name)?'upgrades':name==='EVOLUTIONS'?'future':'runes';
const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!=null)e.textContent=text;return e;};
export function createUnlockCatalog(){
 let active='paths',activeClass='Mage';
 const fit=()=>document.getElementById('fe-unlocks-screen').style.setProperty('--unlock-scale',Math.min(1,(innerWidth-80)/1450,(innerHeight-60)/836));
 window.addEventListener('resize',fit);fit();
 return function render(items){
  const root=document.getElementById('fe-unlocks-screen'),list=document.getElementById('fe-unlocks-list');
  root.querySelector('h2').textContent='Unlocks';
  root.querySelector('.arm-sub').textContent='Permanent upgrades, starter loadouts and your collection.';
  root.querySelector('.arm-foot>span').textContent='Unlocks are saved to your account.';
  const close=root.querySelector('.fe-back');if(!close.querySelector('kbd')){close.replaceChildren(node('kbd','','Esc'),node('span','','Close'));}
  const previous=list.querySelector('.unlock-content')?.scrollTop??0;
  const groups=[];let group;
  for(const item of items){
   if(item.matches('.arm-section')){group=node('section','unlock-group');const title=item.firstElementChild.textContent;group.dataset.category=category(title);if(group.dataset.category==='paths'){group.dataset.class=title.split(' ')[0].toLowerCase().replace(/^./,c=>c.toUpperCase());item.firstElementChild.textContent=group.dataset.class+' paths';}else item.firstElementChild.textContent=title.toLowerCase().replace(/^./,c=>c.toUpperCase());group.append(item,node('div','unlock-cards'));groups.push(group);}
   else if(group){
    const actions=item.querySelector('.fe-buy');for(const b of [...item.children].filter(e=>e.tagName==='BUTTON'))actions.append(b);
    const buy=actions.querySelector('button.primary');if(buy){const amount=buy.textContent.replace('Buy · ','');buy.replaceChildren(node('span','unlock-price-amount',amount),node('span','unlock-price-unit','gold'));buy.classList.add('unlock-price');item.classList.toggle('unlock-unaffordable',buy.disabled);if(buy.disabled){const reason=node('small','unlock-afford','Not enough gold');actions.append(reason);}}
    const state=actions.querySelector('em')?.textContent??'';item.classList.toggle('unlock-owned',/Owned|Unlocked|Equipped|Max|Found|All slots owned/.test(state));item.classList.toggle('unlock-soon',/Soon|COMING/.test(state));
    if(item.classList.contains('unlock-owned')){
     const status=actions.querySelector('em');status.classList.add('unlock-status');
     const equip=group.dataset.category==='runes'?actions.querySelector('button'):null;
     if(equip){item.classList.add('unlock-equippable');equip.classList.add('unlock-equip');equip.setAttribute('aria-pressed',String(state==='Equipped'));if(state==='Equipped'){equip.textContent='Equipped';equip.title='Click to unequip this rune';}}
     const label=/^Owned$|^Unlocked$|^Equipped$/.test(state)?'Unlocked':state;
     const check=document.createElementNS('http://www.w3.org/2000/svg','svg');check.setAttribute('viewBox','0 0 32 32');check.setAttribute('aria-hidden','true');check.classList.add('unlock-check');
     const path=document.createElementNS(check.namespaceURI,'path');path.setAttribute('d','M5 16L12 23L27 7');check.append(path);status.replaceChildren(check,node('span','',label));
    }
    const swatch=item.querySelector('.fe-swatch'),name=item.querySelector('.arm-name b').textContent;const crest=node('span','unlock-crest');swatch.removeAttribute('style');swatch.replaceChildren(unlockIcon(name));crest.dataset.color=unlockCrestColor(name);swatch.replaceWith(crest);crest.append(swatch);
    group.lastElementChild.append(item);
   }
  }
  const nav=node('nav','unlock-nav');nav.setAttribute('aria-label','Unlock categories');
  const content=node('div','unlock-content');
  const tabs=node('nav','unlock-class-tabs');tabs.setAttribute('aria-label','Class paths');
  const refresh=()=>{for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.category===active));tabs.hidden=active!=='paths';for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.class===activeClass));for(const g of groups)g.hidden=g.dataset.category!==active||(active==='paths'&&g.dataset.class!==activeClass);content.scrollTop=0;};
  const select=id=>{active=id;refresh();};
  for(const [id,label,desc] of CATEGORIES){const b=node('button','');b.type='button';b.dataset.category=id;b.title=desc;const crest=node('span','unlock-nav-crest');crest.append(unlockIcon(id));b.append(crest,node('strong','',label));b.onclick=()=>select(id);nav.append(b);}
  for(const name of ['Mage','Warrior','Ranger']){const b=node('button','');b.type='button';b.dataset.class=name;const count=groups.find(g=>g.dataset.class===name)?.querySelector('.arm-section em').textContent??'';b.append(unlockIcon(name),node('strong','',name),node('span','',count));b.onclick=()=>{activeClass=name;refresh();};tabs.append(b);}
  content.append(tabs,...groups);list.replaceChildren(nav,content);select(active);content.scrollTop=previous;
 };
}
