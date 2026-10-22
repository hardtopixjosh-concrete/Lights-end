// Balance report: DPS of every class path with every eligible weapon, attack- and ability-focused builds,
// against one moving boss and a 5-enemy crowd. Output experiment only (no crits, no incoming attacks,
// no Insight, equal Common items). Run from sites/veyrath: node tests/balance-report.mjs [level]
// Writes docs/validation/balance-report.json and balance-report.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const tag=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').match(/game\.js\?v=([\w-]+)/)[1].replace(/^(fx-\d+).*/,'$1');
const load=name=>import(`../dist/${name}.js?v=${tag}`);
const [{createCombat,pressAttack,tickCombat},{createMage,tickMage,requestMage},{createWarrior,tickWarrior,requestWarrior,handleWarriorHits},{createRanger,tickRanger,requestRanger,releaseRanger},{makeWeapon,weaponStats},{withCards},{PATH_NODES}]=await Promise.all(['combat','mage','warrior','ranger','weapons','level-cards','specializations'].map(load));

const LEVEL=Number(process.argv[2]??30),SECONDS=60,DT=1/60;
// Fight away from the map edge: blocked() treats x/y below the player radius as out of bounds, which stopped every rush/charge at (0,0).
const ORIGIN={x:1800,y:1400};
const WEAPONS=['Longsword','Greatsword','Twin Blades','Throwing Axe','','Flame Staff','Wand','','','','','Warhammer','','Long Bow','Short Bow','Shuriken','Crossbow','Kunai','Pistols',"Falconer's Glove",'Shotgun','Chakram','Daggers','Potion Satchel','Bomb Bag','Toxic Canister','Sludge Barrel','Rifle','Flamethrower','Maul','Greataxe','Spear and Shield','Runeblade','Runed Gauntlets','Elemental Katana','Enchanted Spear','War Standard','Great Lance','Chain Axe','Royal Glaive','Ice Staff','Storm Staff','Ember Beads','Sun Disc','Flame Gauntlets','Snow Globe','Freeze Gauntlets','Lightning Rod','Thunder Drum','Tesla Scepter','Blood Orb','Sacrificial Book','Crimson Lantern','Cursed Skull'];
const CLASSES={mage:['pyro','cryo','storm','blood'],sword:['berserker','vanguard','spellblade','warlord'],ranger:['archer','ninja','alchemist','gunslinger']};
const ELIGIBLE={mage:[5,6],pyro:[5,42,43,44],cryo:[40,6,45,46],storm:[41,47,48,49],blood:[50,51,52,53],sword:[0,1,2,3,11],berserker:[0,2,3,29],vanguard:[1,11,30,31],spellblade:[32,33,34,35],warlord:[36,37,38,39],archer:[14,13,16,19],alchemist:[23,24,25,26],ninja:[15,17,22,21],gunslinger:[18,27,20,28]};
const NAMES={pyro:'Pyromancer',cryo:'Cryomancer',storm:'Stormcaller',blood:'Blood Mage',berserker:'Berserker',vanguard:'Vanguard',spellblade:'Spellblade',warlord:'Warlord',archer:'Archer',ninja:'Ninja',alchemist:'Alchemist',gunslinger:'Gunslinger'};
const CROWD=[[0,0],[38,22],[-38,22],[32,-26],[-32,-26]];
const classOf=path=>Object.keys(CLASSES).find(k=>CLASSES[k].includes(path));

function run(path,family,build,scenario,rotation="greedy"){
 Math.random=()=>.99;
 const cls=classOf(path),skills={},s={classId:cls,path,skills,level:LEVEL,hp:100,maxHp:500,world:{},cardStats:{},clock:0},c=createCombat(),p={x:ORIGIN.x,y:ORIGIN.y,row:0};
 const roots=PATH_NODES.filter(n=>n.path===path&&n.tier===0);for(const n of LEVEL<5?roots.filter(n=>n.ability==='RMB'):roots)skills[n.id]=1;
 const picks=LEVEL<15?0:LEVEL<30?3:7;
 if(build==='attack'){for(const id of ['focus1','rhythm1','focus2','rhythm2','coverage1','coverage2'].slice(0,picks))skills[path+'-attack-'+id]=1;if(picks>6)skills[path+'-hybrid']=1;s.cardStats.attack=LEVEL===1?0:.08*Math.floor(LEVEL/3);}
 else{for(const n of PATH_NODES.filter(n=>n.path===path&&n.tier>0&&!n.category).slice(0,Math.max(0,picks-1)))skills[n.id]=1;s.cardStats.ability=LEVEL===1?0:.08*Math.floor(LEVEL/3);if(picks>0)skills[path+'-hybrid']=1;}
 const item=makeWeapon(LEVEL,()=>.4,0,family);Object.assign(item,{base:1,ceiling:30,quality:LEVEL>=30?5:0,affixes:[],affixCount:0});c.weapon=withCards(weaponStats(item,LEVEL),s);c.weapon.crit=0;
 const targets=scenario==='boss'?[{id:1,dx:0,dy:0,role:'boss',radius:28}]:CROWD.map(([dx,dy],i)=>({id:i+1,dx,dy,radius:18}));
 c.targets=targets.map(t=>({id:t.id,x:0,y:0,hp:1e9,maxHp:1e9,state:'alive',role:t.role,radius:t.radius,clock:0,hurt:0,death:0}));
 const m=cls==='mage'?createMage(s):null,w=cls==='sword'?createWarrior(s):null,r=cls==='ranger'?createRanger(s):null;
 if(m){m.held=true;m.orbOn=family===8;}else if(w)pressAttack(c);else r.held=true;
 let damage=0,attack=0,ability=0;const casts={RMB:0,Q:0,E:0,R:0};
 for(let i=0;i<SECONDS*60;i++){
  s.clock+=DT;const cx=ORIGIN.x+(scenario==='boss'?100:160)+55*Math.sin(i/150),cy=ORIGIN.y+25*Math.sin(i/93);
  c.targets.forEach((e,k)=>{e.x=cx+targets[k].dx;e.y=cy+targets[k].dy;});
  const aim={x:cx,y:cy};
  if(build!=='attack'||i%90===0)for(const key of ['R','E','RMB','Q']){const ok=m?requestMage(m,c,s,p,aim,{R:'meteor',E:'chain',RMB:'fireball',Q:'nova'}[key],[]):w?requestWarrior(w,c,s,p,aim,key,[]):requestRanger(r,c,s,p,aim,key,[]);if(ok){casts[key]++;break;}
   // "save" rotation: save Energy/Rage/Momentum for a ready E or R instead of always spending on the cheapest spell.
   const kit=m??w??r,cdKey=m?{R:'meteor',E:'chain',RMB:'fireball',Q:'nova'}[key]:key,busy=w?.cast||s.cast||(m?.cast&&m.cast.kind!=='bolt')||r?.charge;
   if(rotation==="save"&&!busy&&(key==='R'||key==='E')&&skills[`${path}-spell-${key}`]&&(kit.cooldowns[cdKey]??0)<=0)break;}
  // Charged shots (Archer Power Shot): release RMB at full charge, as a player holding it would.
  if(r?.charge&&r.charge.t>=r.charge.spec.charge)releaseRanger(r,c,s,p,aim,'RMB');
  let ev;
  /* Cursed Skull (Oct 18): release at full charge, then hold again, as a player would. */
  if(m)m.held=!(c.weapon.primary==='skull'&&(m.skull?.charge>=2-1e-6||m.skull&&s.hp<=1));/* Oct 19: the skull drains until 1 HP, so also let go when empty */
  if(m)ev=tickMage(m,c,s,p,aim,[],DT);
  /* War Standard (Oct 18 fix): the lunge needs a fresh click, so click again whenever the standard is planted, as a player would. */
  if(w&&c.standard?.landed)pressAttack(c);
  if(m);else if(w){c.held=true;ev=tickWarrior(w,c,s,p,aim,[],DT);ev.push(...tickCombat(c,p,aim,[],DT,!w.cast));ev.push(...handleWarriorHits(w,c,s,p,ev,[]));}
  /* Oct 19 Toxic Canister: its pools drop behind you, so the hero weaves through the pack as a player would */
  else if(c.weapon.primary==='canister'){const a=i/25,R=scenario==='boss'?30:45;p.x=cx+Math.cos(a)*R;p.y=cy+Math.sin(a)*R*.65;ev=tickRanger(r,c,s,p,aim,[],DT,{x:-Math.sin(a),y:Math.cos(a)});}
  else ev=tickRanger(r,c,s,p,aim,[],DT,{x:0,y:0});
  // Rushes/charges move the hero; walk back toward the fight so it stays in range like a player would.
  const dist=Math.hypot(p.x-ORIGIN.x,p.y-ORIGIN.y);if(dist>1&&!w?.cast&&c.weapon.primary!=='canister'){p.x+=(ORIGIN.x-p.x)*Math.min(1,220*DT/dist);p.y+=(ORIGIN.y-p.y)*Math.min(1,220*DT/dist);}
  for(const hit of ev)if(hit.type==='hit'){const d=hit.actualDamage??hit.damage;damage+=d;if(hit.basic)attack+=d;else ability+=d;}
 }
 return {cls,path,family,weapon:WEAPONS[family],build,scenario,rotation,dps:Math.round(damage/SECONDS),attackDps:Math.round(attack/SECONDS),abilityDps:Math.round(ability/SECONDS),casts,resourceEnd:Math.round(m?.energy.value??w?.rage??r?.momentum)};
}

const results=[];
for(const [cls,paths]of Object.entries(CLASSES))for(const path of paths)for(const family of ELIGIBLE[path]??ELIGIBLE[cls])for(const build of ['attack','ability'])for(const scenario of ["boss","crowd"]){const runs=[run(path,family,build,scenario)];if(build!=="attack")runs.push(run(path,family,build,scenario,"save"));results.push(runs.sort((a,b)=>b.dps-a.dps)[0]);}

const best=(path,scenario)=>results.filter(x=>x.path===path&&x.scenario===scenario).sort((a,b)=>b.dps-a.dps)[0];
const paths=Object.values(CLASSES).flat();
const rows=paths.map(path=>({path,boss:best(path,'boss'),crowd:best(path,'crowd')})).sort((a,b)=>b.boss.dps-a.boss.dps);
const label=x=>`${x.weapon}, ${x.build==='attack'?'attack':'spells'}`;
const md=[`# Balance report — level ${LEVEL} (${tag})`,'',`Generated by \`node tests/balance-report.mjs ${LEVEL}\`. ${SECONDS} s per run, equal Common +${LEVEL>=30?5:0} weapons, crits off, no incoming attacks, no Insight. Boss = one moving target. Crowd = 5 clustered moving targets (total damage across all 5). Output experiment, not survival or clear-speed validation.`,'',
 '## Best setup per subclass','','| # | Subclass | Boss: best setup | Boss DPS | Crowd: best setup | Crowd DPS | Crowd ÷ boss |','|---|---|---|---:|---|---:|---:|',
 ...rows.map((x,i)=>`| ${i+1} | ${NAMES[x.path]} | ${label(x.boss)} | ${x.boss.dps} | ${label(x.crowd)} | ${x.crowd.dps} | ${(x.crowd.dps/x.boss.dps).toFixed(1)}× |`),
 '','## Every run','','| Subclass | Weapon | Build | Scenario | DPS | Attack | Spells | Casts RMB/Q/E/R | Rotation | Resource end |','|---|---|---|---|---:|---:|---:|---|---|---:|',
 ...results.map(x=>`| ${NAMES[x.path]} | ${x.weapon} | ${x.build==='attack'?'attack':'spells'} | ${x.scenario} | ${x.dps} | ${x.attackDps} | ${x.abilityDps} | ${x.casts.RMB}/${x.casts.Q}/${x.casts.E}/${x.casts.R} | ${x.rotation} | ${x.resourceEnd} |`),''].join('\n');
const out=new URL('../docs/validation/',import.meta.url);mkdirSync(out,{recursive:true});
writeFileSync(new URL('balance-report.json',out),JSON.stringify({level:LEVEL,tag,seconds:SECONDS,results},null,1));
writeFileSync(new URL('balance-report.md',out),md);
console.log(md.split('\n## Every run')[0]);
