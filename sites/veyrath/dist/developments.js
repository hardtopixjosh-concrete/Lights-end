// Run investment is in a delivery role. Switching maps it to the new family's delivery.
// Each row supplies all six nodes, without requiring an item behavior.
const row=(focus,coverage,rhythm,mods)=>({focus,coverage,rhythm,mods});
export const ATTACK_DEVELOPMENTS={
 0:row('Keen combo','Sweeping combo','Flowing combo',{arc:1.2,range:1.1}),
 1:row('Crushing edge','Heavy sweep','Measured swings',{arc:1.25,range:1.08}),
 2:row('Paired edges','Paired sweep','Blade rhythm',{arc:1.3,range:1.08}),
 3:row('Leading axe','Piercing axes','Throwing rhythm',{pierce:1,range:1.15}),
 5:row('Concentrated lance','Wide piercing lance','Lance rhythm',{contact:1.25,pierce:1}),
 6:row('Focused dart','Piercing dart','Rapid casting',{pierce:1,range:1.12}),
 7:row('Potent wisps','Seeking passage','Spirit rhythm',{pierce:1,turn:1.25}),
 8:row('Dense pulse','Expanding pulse','Pulse rhythm',{area:1.15,range:1.08}),
 9:row('Focused pages','Piercing pages','Page rhythm',{pierce:1,spread:1.12}),
 10:row('Concentrated beam','Piercing beam','Rapid ticks',{beamPierce:1,contact:1.2}),
 11:row('Crushing impact','Wide impact','Hammer rhythm',{area:1.2,range:1.05}),
 12:row('True shot','Piercing bow','Bow rhythm',{pierce:1,range:1.1}),
 13:row('Heavy draw','Piercing longshot','Draw rhythm',{pierce:1,range:1.1}),
 14:row('Close precision','Piercing shortshot','Rapid draw',{pierce:1,range:1.08}),
 15:row('Keen stars','Piercing fan','Star rhythm',{pierce:1,range:1.1}),
 16:row('Heavy bolt','Broad bolt','Reload rhythm',{contact:1.25,pierce:1}),
 17:row('Keen kunai','Wide kunai lane','Kunai rhythm',{contact:1.2,pierce:1}),
 18:row('Accurate pistols','Piercing rounds','Alternating rhythm',{pierce:1,range:1.08}),
 19:row('Hunting talons','Broad hawk flight','Flight rhythm',{contact:1.2,range:1.15}),
 20:row('Dense buckshot','Piercing pellets','Shotgun rhythm',{pierce:1,spread:1.15}),
 21:row('Keen discs','Wide disc flight','Returning rhythm',{contact:1.2,range:1.1}),
// Oct 19 (user): profiles for every family added after the Oct 18 redesign, so Attack Coverage works on all weapons.
// Mods follow what each delivery actually reads: Ranger range/area (w.reach/w.aoe), Warrior arc/range, Mage magePrimary.
 22:row('Keen daggers','Wide dagger volley','Dagger rhythm',{range:1.1,area:1.15}),
 23:row('Potent brew','Wide splash','Brewing rhythm',{area:1.2,range:1.05}),
 24:row('Dense charge','Wide blast','Fuse rhythm',{range:1.05}),
 25:row('Potent toxin','Spreading trail','Venting rhythm',{area:1.2}),
 26:row('Heavy sludge','Wide spill','Barrel rhythm',{area:1.2,range:1.05}),
 27:row('Steady aim','Long sightline','Bolt-action rhythm',{range:1.15}),
 28:row('Hot core','Wide flame','Burn rhythm',{range:1.1,area:1.15}),
 29:row('Crushing maul','Wide quake','Maul rhythm',{area:1.1}),
 30:row('Cleaving edge','Broad cleave','Axe rhythm',{arc:1.25,range:1.08}),
 31:row('Precise thrust','Long thrust','Guarded rhythm',{range:1.08,arc:1.05}),
 32:row('Rune edge','Rune sweep','Runic rhythm',{arc:1.2,range:1.1}),
 33:row('Rune knuckles','Wide rune burst','Fist rhythm',{area:1.2,range:1.05}),
 34:row('Honed edge','Drawing sweep','Iaido rhythm',{arc:1.05}),
 35:row('Charged tip','Long reach','Spear rhythm',{range:1.15,arc:1.1}),
 36:row('Banner strike','Wide rally','Standard rhythm',{area:1.2,range:1.08}),
 37:row('Impaling tip','Long lance','Charge rhythm',{range:1.15,arc:1.1}),
 38:row('Biting chain','Long chain sweep','Chain rhythm',{arc:1.15}),
 39:row('Royal edge','Grand sweep','Glaive rhythm',{arc:1.25,range:1.1}),
 40:row('Frozen lance','Piercing ice','Ice rhythm',{pierce:1,range:1.1}),
 41:row('Charged bolt','Arcing bolt','Storm rhythm',{pierce:1,contact:1.2}),
 42:row('Hot beads','Scattered embers','Bead rhythm',{spread:1.12,contact:1.2}),
 43:row('Searing disc','Wide disc','Orbit rhythm',{contact:1.15}),
 44:row('Hot cone','Wide cone','Flare rhythm',{area:1.15,range:1.1}),
 45:row('Dense globe','Wide flurry','Globe rhythm',{area:1.2,range:1.05}),
 46:row('Focused ray','Piercing ray','Rapid ticks',{beamPierce:1,contact:1.2}),
 47:row('Charged rod','Wide strike','Rod rhythm',{range:1.05}),
 48:row('Heavy beat','Wide shockwave','Drum rhythm',{area:1.2,range:1.05}),
 49:row('Focused arc','Long arc','Tesla rhythm',{contact:1.2,range:1.1}),
 50:row('Dense pulse','Expanding pulse','Pulse rhythm',{area:1.05,range:1.08}),
 51:row('Focused sigils','Wide sigils','Sigil rhythm',{area:1.15,spread:1.12}),
 52:row('Searing glow','Wider glow','Lantern rhythm',{area:1.08}),
 53:row('Cursed gaze','Long gaze','Skull rhythm',{range:1.12,area:1.1})
};
export function developmentNodes(paths){return paths.flatMap(path=>[
 ...['focus','coverage','rhythm'].flatMap(role=>[1,2].map(tier=>({id:path+'-attack-'+role+tier,path,ability:'LMB',category:'Attack',tier,root:null,parents:tier===2?[path+'-attack-'+role+'1']:[],name:role[0].toUpperCase()+role.slice(1)+' '+tier,description:role==='focus'?'+15% attack damage; switching retains this attack investment.':role==='rhythm'?'+10% basic attack speed; channels tick faster and hawk travel accelerates within owner caps.':'Improve this family’s coverage without adding same-target contacts.',effects:[],role}))),
 {id:path+'-hybrid',path,ability:'HYBRID',category:'Resource / Hybrid',tier:1,parents:[],name:'Efficient casting',description:'10% lower ability costs. Combined cost reduction cannot exceed 40%.',effects:[{stat:'cost',value:.1}]},
 {id:path+'-hybrid2',path,ability:'HYBRID',category:'Resource / Hybrid',tier:2,parents:[path+'-hybrid'],name:'Measured recovery',description:'10% shorter ability cooldowns within the shared 40% ordinary cap.',effects:[{stat:'cooldown',value:.1}]},
 {id:path+'-support',path,ability:'SUPPORT',category:'Defense / Support',tier:1,parents:[],name:'Reinforced protection',description:'+5% maximum health and +15% authored barriers. Replacing a weaker remaining barrier does not stack it.',effects:[{stat:'maxHp',value:.05}]},
 {id:path+'-support2',path,ability:'SUPPORT',category:'Defense / Support',tier:2,parents:[path+'-support'],name:'Restorative practice',description:'+10% maximum health and +15% authored healing, subject to self-healing limits.',effects:[{stat:'maxHp',value:.1}]}
 ]);}
export function developmentStats(w,s){
 const have=id=>Number(s.skills?.[s.path+'-'+id]??0)>0?1:0,focus=have('attack-focus1')+have('attack-focus2'),coverage=have('attack-coverage1')+have('attack-coverage2'),rhythm=have('attack-rhythm1')+have('attack-rhythm2'),profile=ATTACK_DEVELOPMENTS[w.family],mods={...w.mods};
 if(profile)for(const [key,value]of Object.entries(profile.mods)){if(key==='pierce'||key==='beamPierce')mods[key]=(mods[key]??(key==='beamPierce'?1:0))+value*coverage;else mods[key]=(mods[key]??1)*(1+(value-1)*coverage);}
 return {...w,mods,speed:Math.min(2.5,w.speed*(1+.1*rhythm)),reach:w.reach*(1+((profile?.mods.range??1)-1)*coverage),arc:w.arc*(1+((profile?.mods.arc??1)-1)*coverage),aoe:w.aoe*(1+((profile?.mods.area??1)-1)*coverage),output:{...w.output,attack:(w.output?.attack??0)+.15*focus,barrier:(w.output?.barrier??0)+.15*have('support'),healing:(w.output?.healing??0)+.15*have('support2')}};
}
export function developmentDescription(n,family){const p=ATTACK_DEVELOPMENTS[family];if(!p||!n.role)return n.description;const detail=n.role==='coverage'?Object.entries(p.mods).map(([k,v])=>['pierce','beamPierce'].includes(k)?'+'+v+' '+k:'+'+Math.round((v-1)*100)+'% '+k).join(', '):n.description;return p[n.role]+' '+n.tier+' · '+detail;}
