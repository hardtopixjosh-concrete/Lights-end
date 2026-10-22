// Presentation only: all offers, rarity rolls and selection handlers remain in game.js.
const ROOT='assets/ui/crest-cloth/';
const ICONS={'Volley':'volley','Arrow Type':'arrow_type','Power Shot':'power_shot','Quickdraw':'bow','Attack Power':'damage','Ability Power':'magic','Power':'damage','Haste':'speed','Swiftness':'speed','Vigor':'health','Precision':'critical','Brutality':'critical','Wellspring':'magic','Arcane Flow':'magic'};
export function dressLevelCard(button,option,index,pickLevel=1){
 button.classList.add('cloth-card');
 const stat=option.type==='stat';button.classList.toggle('cloth-stat',stat);
 const rarity=['common','rare','epic'].includes(option.rarity)?option.rarity:'common';
 button.style.setProperty('--cloth-art',`url("${ROOT}cards/${stat?'stat_'+rarity:'skill_orange'}.webp")`);
 const icon=button.querySelector('.licon'),file=ICONS[option.name];
 if(file){const img=document.createElement('img');img.src=ROOT+'icons/'+file+'.svg';img.alt='';icon.replaceChildren(img);}
 button.querySelector('.ltag').textContent=stat?rarity.toUpperCase():option.type==='spell'?'NEW SPELL':'DEVELOPMENT';
 const key=document.createElement('span');key.className='cloth-key';key.textContent=stat?String(pickLevel):(option.slot??String(index+1));button.append(key);
 if(stat){
  key.setAttribute('aria-label','Pick level '+pickLevel);
  button.querySelector('.lpips')?.remove();
  const note=button.querySelector('.lnote');
  if(note){const total=note.textContent.replace(/^Total after:\s*/,'');const label=document.createElement('span');label.className='cloth-total-label';label.textContent='Total after pick';const amount=document.createElement('span');amount.className='cloth-total-amount';amount.textContent=total;note.replaceChildren(label,amount);}
 }
 const divider=document.createElement('img');divider.className='cloth-divider';divider.src=ROOT+'ornaments/divider_cream.svg';divider.alt='';button.append(divider);
 if(stat){const desc=button.querySelector('.ldesc'),match=option.description.match(/^([+-]?[\d.]+%?)\s+(.+)$/);if(match){const value=document.createElement('b');value.className='cloth-value';value.textContent=match[1];const effect=document.createElement('span');effect.textContent=match[2];desc.replaceChildren(value,effect);}}
 // Full descriptions remain visible; fit only text that exceeds its painted region.
 requestAnimationFrame(()=>{for(const node of [button.querySelector('strong'),button.querySelector('.ldesc')]){let size=parseFloat(getComputedStyle(node).fontSize);while(node.scrollHeight>node.clientHeight+1&&size>11){size-=.5;node.style.fontSize=size+'px';}}});
}
