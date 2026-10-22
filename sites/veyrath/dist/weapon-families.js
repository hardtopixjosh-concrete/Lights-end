export const FAMILIES=[
 {name:'Longsword',style:'sword',description:'Balanced three-hit sweeping combo.',reach:1,arc:1},
 {name:'Greatsword',style:'greatsword',description:'Slow, powerful swings covering a wide arc.',reach:1.3,arc:1.5},
 {name:'Twin Blades',style:'dual',description:'Fast double strikes that stack bleed (up to 5); at 3+ stacks your cuts splash and the bleed spreads to nearby enemies.',reach:.95,arc:.95},
 {name:'Throwing Axe',style:'axe',description:'Throws a spinning axe that pierces up to three enemies, then flies back to you, hitting again.',reach:1,arc:1},
 /* Oct 18 (user): the Halberd is deleted entirely. Weapons save their family as this list position, so slot 4 stays as an
    empty placeholder (never drops, hidden everywhere, old saved halberds are removed on load) to keep every other weapon's number. */
 {name:'',removed:true,style:'removed',description:'',reach:0,arc:0},
 /* Oct 18 (user list, Mage weapons by subclass, locked): the Staff becomes the Pyromancer's Flame Staff; the Wand stays (Cryomancer).
    Grimoire, Orb, Spellbook and Scepter are removed (slots kept; saved copies turn into their closest new weapon on load). */
 {name:'Flame Staff',renamedFrom:'Staff',classId:'mage',primary:'staff',description:'LMB: one large fire projectile piercing up to 6 enemies.',reach:1,arc:1},
 {name:'Wand',classId:'mage',primary:'wand',description:'LMB: rapid small ice darts toward your cursor.',reach:1,arc:1},
 {name:'',removed:true,oldName:'Grimoire',retiredTo:40,style:'removed',description:'',reach:0,arc:0},
 {name:'',removed:true,oldName:'Orb',retiredTo:50,style:'removed',description:'',reach:0,arc:0},
 {name:'',removed:true,oldName:'Spellbook',retiredTo:51,style:'removed',description:'',reach:0,arc:0},
 {name:'',removed:true,oldName:'Scepter',retiredTo:46,style:'removed',description:'',reach:0,arc:0},
 {name:'Warhammer',style:'hammer',description:'Slow circular impact in front of you.',reach:1.15,arc:1},
 // Oct 17: Ranger Bow, the only ranged family for now (user: "a bow for the time being").
 /* Oct 18 (user): the plain Bow is removed. Slot 12 stays as an empty placeholder (never drops, hidden everywhere); saved Bows
    become Short Bows on load (retiredTo). The Archer now starts with the Short Bow. */
 {name:'',removed:true,retiredTo:14,style:'removed',description:'',reach:0,arc:0},
 // Oct 17: Ranger families (user list). Any Ranger spec can use any of them; Bow stays the starter. Numbers are proposals.
 {name:'Long Bow',classId:'ranger',primary:'longbow',style:'bow',description:'LMB hold: draw back, then loose slow, heavy, long-range arrows.',reach:1,arc:1},
 {name:'Short Bow',classId:'ranger',primary:'shortbow',style:'bow',description:'LMB hold: rapid light arrows with short range.',reach:1,arc:1},
 {name:'Shuriken',classId:'ranger',primary:'shuriken',style:'bow',description:'LMB hold: fast throwing stars; every 3rd throw fans out 3.',reach:1,arc:1},
 {name:'Crossbow',classId:'ranger',primary:'crossbow',style:'bow',description:'LMB hold: one very heavy bolt into the first enemy hit, then a reload.',reach:1,arc:1},
 {name:'Kunai',classId:'ranger',primary:'kunai',style:'bow',description:'LMB hold: fast kunai that pierce up to 3 enemies.',reach:1,arc:1},
 {name:'Pistols',classId:'ranger',primary:'pistols',style:'bow',description:'LMB hold: left and right guns alternate, each firing at a different nearest enemy.',reach:1,arc:1},
 // Oct 17 (user): three more Ranger families. Numbers are proposals.
 {name:"Falconer's Glove",classId:'ranger',primary:'falconer',style:'bow',description:'LMB: send your hawk through enemies at the cursor; it circles back to a marked spot near you. Catch it there to loose hawks at the 3 nearest enemies.',reach:1,arc:1},
 {name:'Shotgun',classId:'ranger',primary:'shotgun',style:'bow',description:'LMB hold: slow, short-range bursts of 5 pellets; up to 3 pellets can hit one enemy.',reach:1,arc:1},
 {name:'Chakram',classId:'ranger',primary:'chakram',style:'bow',description:'LMB hold: a returning blade that pierces and hits on the way out and back. Up to 2 in the air.',reach:1,arc:1},
 // Oct 18 (user list, by subclass): Ninja Daggers; Alchemist Potion Satchel / Bomb Bag / Toxic Canister / Sludge Barrel; Gunslinger Rifle / Flamethrower.
 {name:'Daggers',classId:'ranger',primary:'daggers',style:'bow',description:'LMB hold: very fast short-range dagger throws, alternating hands.',reach:1,arc:1},
 {name:'Potion Satchel',classId:'ranger',primary:'potion',style:'bow',description:'LMB hold: lob potions that splash a small area; every 4th is Fire, Frost or Poison.',reach:1,arc:1},
 {name:'Bomb Bag',classId:'ranger',primary:'bombbag',style:'bow',description:'LMB hold: a bomb that skips twice along the ground with a small blast per bounce, then a big blast.',reach:1,arc:1},
 {name:'Toxic Canister',classId:'ranger',primary:'canister',style:'bow',description:'LMB hold: spray a short poison cone; while moving you leave a poison trail.',reach:1,arc:1},
 {name:'Sludge Barrel',classId:'ranger',primary:'barrel',style:'bow',description:'LMB: place up to 3 barrels; click a barrel to blow it up. Blasts chain to nearby barrels and leave slowing sludge.',reach:1,arc:1},
 {name:'Rifle',classId:'ranger',primary:'rifle',style:'bow',description:'LMB hold: a slow, heavy shot through every enemy in a long line.',reach:1,arc:1},
 {name:'Flamethrower',classId:'ranger',primary:'flamethrower',style:'bow',description:'LMB hold: a continuous short flame cone that hits rapidly and burns.',reach:1,arc:1},
 // Oct 18 (user list, Warrior weapons by subclass, locked): Berserker Maul; Vanguard Greataxe, Spear and Shield; Spellblade Runeblade,
 // Runed Gauntlets, Elemental Katana, Enchanted Spear; Warlord War Standard, Great Lance, Chain Axe, Royal Glaive.
 {name:'Maul',style:'maul',description:'Slow blunt blows; every blow sends a small staggering shockwave ring.',reach:1.05,arc:1},
 {name:'Greataxe',style:'greataxe',description:'Large sweeping chops that make enemies bleed.',reach:1.35,arc:1.5},
 {name:'Spear and Shield',style:'spearshield',description:'Hold LMB: shield raised, keep thrusting and pushing enemies back. 30% less damage taken while held.',reach:1.25,arc:1},
 {name:'Runeblade',style:'runeblade',description:'A summoned spectral sword swings ahead of you with longer reach.',reach:1.3,arc:1.3},
 {name:'Runed Gauntlets',style:'gauntlets',description:'Fast enchanted punches; each sends a short shockwave forward.',reach:.7,arc:.75},
 {name:'Elemental Katana',style:'katana',description:'Fast slashes cycling Fire (burn), Frost (slow), Poison and Electric (shock).',reach:1.15,arc:1.3},
 {name:'Enchanted Spear',style:'enchspear',description:'A long-reach glowing sweep.',reach:1.65,arc:.95},
 {name:'War Standard',style:'standard',description:'LMB: hurl a war standard down from the sky at the cursor (420 range); click again within 2s to lunge to it, hitting everything you pass, then take 50% less damage for 0.5s.',reach:1,arc:1},
 {name:'Great Lance',style:'lance',description:'A slower long stab with a short lunge, piercing everything in a line.',reach:2,arc:1},
 {name:'Chain Axe',style:'chainaxe',description:'Throw a chained axe-ball, then yank it back, dragging hooked enemies toward you.',reach:1,arc:1},
 {name:'Royal Glaive',style:'glaive',description:'A large, long-reach sweeping attack.',reach:1.5,arc:1.35},
 // Oct 18 (user list, Mage weapons by subclass, locked): Pyromancer Flame Staff / Ember Beads / Sun Disc / Flame Gauntlets; Cryomancer Ice Staff /
 // Wand / Snow Globe / Freeze Gauntlets; Stormcaller Storm Staff / Lightning Rod / Thunder Drum / Tesla Scepter; Blood Mage Blood Orb / Sacrificial
 // Book / Crimson Lantern / Cursed Skull.
 {name:'Ice Staff',classId:'mage',primary:'icestaff',description:'LMB: one large ice projectile piercing up to 6 enemies.',reach:1,arc:1},
 {name:'Storm Staff',classId:'mage',primary:'stormstaff',description:'LMB: one large lightning projectile piercing up to 6 enemies.',reach:1,arc:1},
 {name:'Ember Beads',classId:'mage',primary:'embers',description:'LMB: 5 fire motes circle you; each click sends one at the nearest enemy. They regrow.',reach:1,arc:1},
 {name:'Sun Disc',classId:'mage',primary:'sundisc',description:'LMB: a big burning disc that flies out through enemies and comes back, hitting again. 1 in the air.',reach:1,arc:1},
 {name:'Flame Gauntlets',classId:'mage',primary:'flamegaunt',description:'LMB hold: short fire bursts in a cone that burn.',reach:1,arc:1},
 {name:'Snow Globe',classId:'mage',primary:'snowglobe',description:'LMB hold: channel a small swirling ice storm at the cursor that follows it and slows.',reach:1,arc:1},
 {name:'Freeze Gauntlets',classId:'mage',primary:'frostbeam',description:'LMB hold: an ice beam that slows; 1.5 s on the same enemy freezes it.',reach:1,arc:1},
 {name:'Lightning Rod',classId:'mage',primary:'lightrod',description:'LMB hold: lightning strikes from the sky on the enemy nearest the cursor.',reach:1,arc:1},
 {name:'Thunder Drum',classId:'mage',primary:'drum',description:'LMB hold: every beat sends a thunderous shockwave ring around you.',reach:1,arc:1},
 {name:'Tesla Scepter',classId:'mage',primary:'tesla',description:'LMB hold: a fast lightning line that pierces everything.',reach:1,arc:1},
 {name:'Blood Orb',classId:'mage',primary:'bloodorb',description:'LMB hold: a slow floating sphere that goes through enemies, damaging them. Up to 2 out.',reach:1,arc:1},
 {name:'Sacrificial Book',classId:'mage',primary:'sigilbook',description:'LMB hold: blood sigils under up to 3 enemies near the cursor erupt after a short delay.',reach:1,arc:1},
 {name:'Crimson Lantern',classId:'mage',primary:'lantern',description:'LMB hold: a damaging aura that drains nearby enemies and heals you a little.',reach:1,arc:1},
 {name:'Cursed Skull',classId:'mage',primary:'skull',description:'Hold LMB: your health flows into the floating heart, growing the pulse (up to 2 s). Release: a blood pulse from the heart; blood streams back and heal you for 30% of the damage.',reach:1,arc:1}
];