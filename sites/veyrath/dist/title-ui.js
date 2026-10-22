// Supplied title artwork over the existing front-end navigation and live balance.
export function installTitleUI(){
 const screen=document.getElementById('fe-title');if(screen.querySelector('.le-stage'))return;
 const root='assets/ui/main-menu/',stage=document.createElement('div');stage.className='le-stage';
 while(screen.firstChild)stage.append(screen.firstChild);screen.append(stage);
 const image=(path,alt='')=>{const img=document.createElement('img');img.src=root+path;img.alt=alt;img.draggable=false;return img;};
 stage.querySelector('.fe-logo').replaceChildren(image('branding/lights-end-logo.png',"Light's End"));
 stage.querySelector('.fe-tagline').replaceChildren(image('branding/tagline.svg','The dark has a king'));
 const divider=image('ornaments/title_divider.svg');divider.className='le-divider';stage.querySelector('.fe-col').append(divider);
 const actions=[['fe-play','play','Play'],['fe-inventory','armory','Armory'],['fe-unlocks','unlocks','Unlocks'],['fe-best','best_runs','Best Runs'],['fe-howto','how_to_play','How to Play'],['fe-settings','settings','Settings']];
 for(const [index,[id,asset,label]] of actions.entries()){
  const button=document.getElementById(id);button.setAttribute('aria-label',label);button.replaceChildren();button.style.top=(340+112*index)+'px';
  for(const state of ['normal','hover','pressed','disabled']){const src=root+(asset==='play'?`buttons/blank/orange_${state}.png`:`buttons/labeled/${asset}_${state}.png`);button.style.setProperty('--le-'+state,(asset==='play'?`url("${root}buttons/overlays/play.svg"),`:'')+`url("${src}")`);const preload=new Image();preload.src=src;}
 }
 const gold=stage.querySelector('#fe-gold');stage.querySelector('.fe-goldtop i').replaceWith(image('icons/coin.svg'));
 const fitGold=()=>{gold.style.fontSize=Math.min(31,Math.max(16,210/Math.max(1,gold.textContent.length)))+'px';};fitGold();new MutationObserver(fitGold).observe(gold,{childList:true,characterData:true,subtree:true});
 document.getElementById('fe-version').textContent='fx-230';
 const fit=()=>{stage.style.transform=`translate(-50%,-50%) scale(${Math.min(innerWidth/1920,innerHeight/1080)})`;};fit();addEventListener('resize',fit);
}
