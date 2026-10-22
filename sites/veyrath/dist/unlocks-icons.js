// Original layered vector artwork for the blank slots in the supplied Unlocks kit.
// Pure presentation: names map to pictures, never to progression or balance.
const NS='http://www.w3.org/2000/svg';
const p=(d,fill,stroke='#172035',width=2)=>['path',{d,fill,stroke,'stroke-width':width,'stroke-linejoin':'round','stroke-linecap':'round'}];
const c=(cx,cy,r,fill,stroke='#172035')=>['circle',{cx,cy,r,fill,stroke,'stroke-width':2}];
const sword=[p('M18 43L42 9L54 6L53 18L28 48Z','#d7f5ff'),p('M23 44L49 12L53 8L42 12Z','#7bb9de','none'),p('M13 39L32 52L36 46L17 34Z','#ffd271'),p('M10 51L18 41L25 46L17 57Z','#bb6035'),c(13,55,4,'#ffe299')];
const flame=[p('M33 4C41 16 28 22 39 29C43 24 43 21 45 17C62 34 55 58 32 59C7 59 5 35 19 23C18 34 23 36 25 30C17 19 30 13 33 4Z','#ff6326'),p('M32 21C32 35 47 39 42 50C38 60 20 55 21 45C21 39 28 37 27 30Z','#ffbf40','none'),p('M32 38C44 51 33 58 28 51C25 47 29 43 32 38Z','#fff0aa','none')];
const snow=[p('M32 5V59M9 18L55 46M9 46L55 18','#abf3ff','#429edc',7),p('M32 6V58M10 18L54 46M10 46L54 18','none','#e2ffff',3),p('M23 9L32 18L41 9M23 55L32 46L41 55M9 29L20 25L18 14M46 50L44 39L55 35M9 35L20 39L18 50M46 14L44 25L55 29','none','#a6efff',3),p('M32 24L40 32L32 40L24 32Z','#ffffff','#5cc8ed')];
const bolt=[p('M35 3L12 35H29L24 61L54 24H36L44 3Z','#a56bff'),p('M35 8L19 31H34L29 49L46 28H31Z','#fff0a1','none'),p('M9 13L14 18M52 43L57 48M7 48L12 43','none','#d7c1ff',3)];
const drop=[p('M32 4C27 18 10 33 12 43C15 64 50 65 53 43C55 30 37 16 32 4Z','#d72e59'),p('M32 8C31 29 43 37 41 48C38 57 29 58 21 54C37 67 56 50 48 36Z','#ff6786','none'),p('M23 30Q15 43 25 48','none','#ffd5dd',4)];
const shield=[p('M32 5L55 14V31Q54 48 32 60Q10 48 9 31V14Z','#e4ba65'),p('M32 11L49 18V32Q47 45 32 53Q17 45 15 32V18Z','#3e9cd2'),p('M32 12V52Q48 43 49 30V18Z','#23668f','none'),p('M32 20L37 29L46 31L37 35L32 45L27 35L19 31L27 29Z','#defbff','none')];
const gem=[p('M32 4L54 26L32 60L10 26Z','#58d9ed'),p('M32 4L24 26L32 60L10 26Z','#2771b4','none'),p('M32 4L40 26L32 60L54 26Z','#349bbf','none'),p('M24 26L32 4L40 26L32 60Z','#b8f9ff','none'),p('M10 26H54','none','#d4ffff',1)];
const heart=[p('M32 58L9 35C-2 20 16 4 32 19C48 4 66 20 55 35Z','#ed4e79'),p('M32 20V55L53 34C62 22 48 10 37 19Z','#b92059','none'),p('M12 26Q15 18 23 22','none','#ffbace',4)];
const bow=[p('M19 5Q67 32 19 59L24 49Q49 32 24 15Z','#e9ba65'),p('M19 6V58','none','#b5f59d',2),p('M7 32H54','none','#c7edff',4),p('M48 23L61 32L48 41L51 32Z','#b0e960'),p('M7 26L16 32L7 38Z','#51c69d')];
const star=[p('M32 4L38 24L60 32L40 39L32 60L25 40L4 32L24 25Z','#bcc5ed'),p('M32 4L32 32L60 32L38 24Z','#edf6ff','none'),p('M32 32L32 60L25 40L4 32Z','#7574bf','none'),c(32,32,7,'#6438ad'),c(32,32,3,'#d9b8ff')];
const flask=[p('M24 6H40V23L55 47Q59 58 47 59H17Q5 58 9 47L24 23Z','#adc9ed'),p('M19 35H45L52 49Q54 55 46 55H18Q10 55 13 49Z','#35d69e','none'),p('M21 5H43V12H21Z','#d9b269'),c(26,44,3,'#caff91','none'),c(38,49,4,'#b0ff79','none'),p('M20 31L14 46','none','#e2ffff',3)];
const pistol=[p('M7 14H58V28H31L26 52H12L17 28H7Z','#92bdd6'),p('M7 14H57V20H7Z','#d6f0ff','none'),p('M18 30H29L24 49H14Z','#ad643e'),p('M31 29V39H40V28','none','#ffd66f',3),p('M46 9L49 5M56 34L60 36','none','#ffcc66',3)];
const crown=[p('M7 17L21 28L32 8L43 28L57 17L51 52H13Z','#e6a73a'),p('M14 39H50V52H14Z','#ffe39b'),p('M15 21L21 32L32 15L43 32L50 21','none','#ffe6a4',3),p('M32 33L38 40L32 47L26 40Z','#e3486a'),c(7,14,4,'#80d9ff'),c(57,14,4,'#80d9ff'),c(32,6,4,'#fff1aa')];
const boot=[p('M24 7H43L39 33L52 41Q58 45 53 54H13V44L21 32Z','#4aaebd'),p('M24 7H43L42 17H22Z','#f7c87a'),p('M13 48H54V55H13Z','#d9ebf3'),p('M6 22H17M3 31H14M5 40H12','none','#a7f0ff',3)];
const orb=[c(33,28,19,'#8a4cde'),p('M20 14Q37 4 46 24Q32 12 20 14Z','#e3acff','none'),p('M32 13L36 24L47 28L36 33L32 44L28 33L18 28L28 24Z','#e9e3ff','none'),p('M15 49L26 42L32 47L38 42L50 49L46 58H18Z','#c18d48')];
const arrow=[p('M7 25H39V14L60 32L39 50V39H7Z','#5ddcc2'),p('M8 26H40V20L53 31H8Z','#b6ffe3','none'),p('M7 48H24M4 55H16','none','#7dd7ff',3)];
const restore=[...heart,p('M28 24H37V32H45V41H37V49H28V41H20V32H28Z','#c8ffba','#247d69')];
const branch=[p('M32 15V30L12 48M32 30L52 48','none','#dfc584',5),c(32,12,8,'#bc89ff'),c(12,49,8,'#65dafa'),c(52,49,8,'#ee8054'),c(32,30,5,'#fff0ba')];
const hourglass=[p('M18 9H46V18L37 32L46 46V55H18V46L27 32L18 18Z','#81b4cf'),p('M21 15H43L32 30Z','#ffc96a','none'),p('M21 50L32 37L43 50Z','#ffc96a','none'),p('M14 7H50M14 57H50','none','#edc17a',5)];
const reroll=[p('M52 23A23 23 0 0 0 10 24M12 41A23 23 0 0 0 54 40','none','#70dfbd',6),p('M43 10L55 25L39 26Z','#d5ffb0'),p('M23 38L9 38L18 53Z','#d5ffb0'),p('M32 22L42 32L32 42L22 32Z','#e7c575')];
const banish=[p('M18 7H45L51 14V57H18Z','#b392d8'),p('M22 13H43V51H22Z','#473e83'),p('M9 16L56 49M9 49L56 16','none','#ff6983',6)];
const horns=[p('M9 13Q19 25 27 23L33 17Q45 16 55 7L52 44Q40 36 31 39Q20 35 15 32Z','#e7af58'),p('M47 13L45 40L53 44L56 7Z','#fff0b4'),p('M14 20L18 29L27 32L29 26Z','#a45d31','none')];
const hammer=[p('M14 56L36 22L43 27L23 60Z','#a9673e'),p('M18 12L32 4L57 24L48 38Z','#87adcc'),p('M20 12L32 8L52 24L44 29Z','#e3f3ff','none'),p('M22 19L31 12L44 23L36 33Z','#d8a44c')];
const axe=[p('M16 58L37 7L44 10L23 61Z','#b37b47'),p('M29 12Q12 12 10 31L29 29L42 35L55 25Q43 21 40 9Z','#98c6d9'),p('M11 30Q17 15 28 16L26 26Z','#e0faff','none'),p('M29 13L36 16L30 31L24 28Z','#f7c578')];
const book=[p('M6 12Q19 6 32 14Q45 6 58 12V53Q45 47 32 55Q19 47 6 53Z','#b7955e'),p('M10 11Q23 8 32 16Q42 8 54 11V48Q42 44 32 51Q22 44 10 48Z','#e4e3c9'),p('M32 16V50','none','#7e587f',2),p('M41 20L44 27L51 30L44 33L41 41L38 33L34 30L38 27Z','#b26ce6','none'),p('M15 22L25 24M15 29L25 31M15 36L23 38','none','#628bb2',2)];
const wand=[p('M11 56L38 24L43 29L18 61Z','#b98151'),p('M33 25L42 13L50 15L51 24L42 32Z','#a767ed'),p('M42 13L39 23L51 24Z','#c9b7ff','none'),p('M22 13H30M26 9V17M51 40H59M55 36V44','none','#8aeaff',3)];
const glove=[p('M14 58L11 37L18 33V16Q22 10 26 16V29L28 9Q33 5 35 11V28L39 13Q44 10 46 16L42 32L49 24Q55 22 56 29L43 53L39 59Z','#bc8255'),p('M15 45L42 49L39 59H14Z','#f3cb77'),p('M23 32L31 25L39 35L30 44Z','#51bda7'),p('M19 49L37 52','none','#755027',2)];
const ring=[c(32,32,25,'#c5e5f4'),c(32,32,15,'#294d6b'),p('M10 24L17 8L25 10M40 12L56 20L54 27M52 40L45 56L37 54M24 52L8 44L10 37','none','#b599ed',5)];
const art={flame,snow,bolt,drop,sword,shield,gem,heart,bow,star,flask,pistol,crown,boot,orb,arrow,restore,branch,hourglass,reroll,banish,horns,
 hammer,axe,book,wand,glove,ring,
 doubleSword:[['g',{transform:'translate(64 0) scale(-1 1)',opacity:.85},sword],['g',{},sword]],
 spellblade:[['g',{},sword],p('M44 29L48 38L57 41L48 45L44 55L40 45L32 41L40 38Z','#cf9bff','#6936a5')],
 upgrades:[p('M8 34L32 8L56 34L47 41L32 25L17 41Z','#78ddf7'),p('M8 51L32 26L56 51L47 58L32 43L17 58Z','#edba69')],
 slot:[p('M10 10H54V54H10Z','#335c86','#f4c875',3),p('M27 18H37V27H46V37H37V46H27V37H18V27H27Z','#90eaff')],
 unknown:[p('M22 21Q22 9 35 10Q49 11 45 24L33 35V42','none','#b3bdd7',6),c(33,53,3,'#b3bdd7')]
};
const MAP={runes:['gem','ice'],paths:['branch','violet'],upgrades:['upgrades','orange'],weapons:['sword','navy'],cosmetics:['crown','violet'],future:['hourglass','neutral'],
 Mage:['flame','orange'],Warrior:['doubleSword','crimson'],Ranger:['bow','green'],Pyromancer:['flame','orange'],Cryomancer:['snow','ice'],Stormcaller:['bolt','violet'],'Blood Mage':['drop','crimson'],Berserker:['doubleSword','crimson'],Vanguard:['shield','navy'],Spellblade:['spellblade','violet'],Warlord:['horns','orange'],Archer:['bow','green'],Ninja:['star','violet'],Alchemist:['flask','green'],Gunslinger:['pistol','orange'],
 'Rune of Striking':['sword','orange'],'Rune of Invocation':['orb','violet'],'Rune of Protection':['shield','ice'],'Rune of Restoration':['restore','green'],'Rune of Vitality':['heart','crimson'],'Rune of Reach':['arrow','orange'],'Rune of Far Casting':['orb','ice'],
 'Tyrant Slayer':['crown','crimson'],'Extra charge':['bolt','ice'],'Quick step':['boot','ice'],'Long step':['arrow','green'],'Ember step':['flame','orange'],'Skill evolutions':['branch','violet'],
 'Gold Rune':['gem','orange'],'Crimson Rune':['drop','crimson'],'Frost Rune':['snow','ice'],'Ember Rune':['flame','orange'],'Storm Rune':['bolt','violet'],'Void Rune':['orb','violet'],'Verdant Rune':['restore','green'],
 'Twin Blades':['doubleSword','crimson'],'Throwing Axe':['axe','orange'],Warhammer:['hammer','navy'],Grimoire:['book','violet'],Spellbook:['book','ice'],Staff:['wand','violet'],Wand:['wand','violet'],Scepter:['wand','orange'],"Falconer's Glove":['glove','green'],Chakram:['ring','violet'],Kunai:['sword','violet'],'???':['unknown','neutral']};
function definition(name){return MAP[name]||(/^Rune slot/.test(name)?['slot','navy']:/reroll/i.test(name)?['reroll','green']:/banish/i.test(name)?['banish','violet']:/Quick step/.test(name)?MAP['Quick step']:/Long step/.test(name)?MAP['Long step']:/rune/i.test(name)?['gem','green']:/bow/i.test(name)?['bow','green']:/staff|wand|orb|grimoire|spellbook|scepter/i.test(name)?['orb','violet']:/pistol|shotgun/i.test(name)?['pistol','orange']:/shuriken|chakram|kunai/i.test(name)?['star','violet']:['sword','navy']);}
function append(parent,layers){for(const [tag,attrs,children] of layers){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(children)append(e,children);parent.append(e);}}
export const unlockCrestColor=name=>definition(name)[1];
export function unlockIcon(name){const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('aria-hidden','true');svg.classList.add('unlock-art');svg.dataset.icon=definition(name)[0];append(svg,art[definition(name)[0]]);return svg;}
