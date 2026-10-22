// Oct 16 (user): F2 test menu. Oct 17 (user): also on the published site, plus a TEST button on touch devices.
// Pure UI: every action calls a hook supplied by game.js; toggles live in the shared `flags` object the game loop reads.
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
export function createCheatMenu(h){
 const panel=el('aside','cheat-panel');panel.id='cheat-panel';panel.hidden=true;
 const head=el('header');head.append(el('h3','','TEST MENU'),el('small','','F2 to close'));panel.append(head);
 let section;
 const sec=title=>{section=el('section');section.append(el('h4','',title));panel.append(section);};
 const btn=(label,fn)=>{const b=el('button','',label);b.onclick=()=>{fn();b.blur();};return b;};
 const line=(...items)=>{const r=el('div','cheat-row');r.append(...items);section.append(r);return r;};
 const toggle=(label,key,after)=>{const l=el('label','cheat-toggle'),c=el('input');c.type='checkbox';c.checked=!!h.flags[key];c.onchange=()=>{h.flags[key]=c.checked;after?.(c.checked);c.blur();};l.append(c,el('span','',label));section.append(l);};
 const pick=(options)=>{const s=el('select');for(const [value,label] of options){const o=el('option','',label);o.value=value;s.append(o);}return s;};

 sec('SPELLS & LEVEL');
 line(btn('Unlock all spells',()=>h.unlock(false)),btn('Learn all augments',()=>h.unlock(true)));
 line(btn('+1 level',()=>h.levels(1)),btn('+5 levels',()=>h.levels(5)),btn('To level 30',()=>h.levels(30-h.level())));
 toggle('No cooldowns, full mana / rage','noCd');

 sec('SURVIVAL');
 toggle('God mode (cannot die)','god');
 toggle('One-hit kills','oneHit');
 const dmg=pick([['1','Damage ×1'],['2','Damage ×2'],['5','Damage ×5'],['10','Damage ×10']]);dmg.value=String(h.flags.damage??1);dmg.onchange=()=>{h.flags.damage=Number(dmg.value);dmg.blur();};
 line(dmg,btn('Full heal',h.heal));

 sec('SPAWNING');
 const boss=pick(h.bosses);line(boss,btn('Spawn boss',()=>h.boss(boss.value)));
 line(btn('Elite pack',h.elite),btn('Mini-boss',h.miniBoss));
 const role=pick([['imp','Imp'],['charger','Charger'],['guardian','Guardian'],['summoner','Summoner']]),count=pick([['1','×1'],['5','×5'],['10','×10']]);
 line(role,count,btn('Spawn',()=>h.enemies(role.value,Number(count.value))));
 line(btn('Kill all enemies',h.killAll));
 toggle('Stop normal spawning','noSpawn');

 sec('CO-OP TEST BOTS');  // Multiplayer Phase 1: local bots stand in for online teammates
 const cls=pick([['sword','Warrior bot'],['ranger','Ranger bot'],['mage','Mage bot']]);
 line(cls,btn('Add bot',()=>h.addBot(cls.value)),btn('Remove bots',h.clearBots));
 line(btn('Down a bot',h.downAlly));

 sec('WORLD & LOOT');
 const clock=pick([['0','0:00 Day'],['445','7:25 before Ashen Butcher'],['720','12:00 Night'],['895','14:55 before Hollow Prophet'],['1200','20:00 Blood Moon'],['1345','22:25 before Obsidian Colossus'],['1440','24:00 Dusk'],['1795','29:55 before the final boss']]);
 line(clock,btn('Jump',()=>h.clock(Number(clock.value))));
 const place=pick([]);const refreshPlaces=()=>{place.replaceChildren(...h.places().map((p,i)=>{const o=el('option','',p.label);o.value=String(i);return o;}));};
 line(place,btn('Teleport',()=>{const p=h.places()[Number(place.value)];if(p)h.teleport(p);}),btn('↻',refreshPlaces));
 line(btn('+1000 gold',()=>h.gold(1000)),btn('+10000 gold',()=>h.gold(10000)));
 const rarity=pick(h.rarities.map((name,i)=>[String(i),name]));rarity.value=String(Math.min(3,h.rarities.length-1));
 line(rarity,btn('Drop weapon',()=>h.weapon(Number(rarity.value))));

 document.body.append(panel);
 const api={toggle(){panel.hidden=!panel.hidden;if(!panel.hidden)refreshPlaces();return !panel.hidden;},get open(){return !panel.hidden;}};
 // Oct 17 (user): phones have no F2 key, so touch devices get a small on-screen TEST button that toggles the panel.
 if(matchMedia('(pointer:coarse)').matches){const t=el('button','cheat-open','TEST');t.type='button';
  t.style.cssText='position:fixed;top:calc(8px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:41;padding:4px 10px;font:700 11px/1 var(--ui-font,sans-serif);letter-spacing:.12em;color:var(--ui-text,#fff);background:var(--ui-panel,#0b1530cc);border:1px solid var(--ui-orange,#e8a33d);border-radius:2px;opacity:.75;touch-action:manipulation';
  t.onclick=e=>{e.stopPropagation();api.toggle();t.blur();};document.body.append(t);}
 return api;
}
