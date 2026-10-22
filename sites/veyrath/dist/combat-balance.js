import {worldHealthFactor} from './encounter-rules.js?v=fx-260';
// Combat feel revision: four/five normal reference hits against a 400-HP Small Swarmer.
// Latest chat supersedes V0.2 damage; timings/HP/crit remain unchanged.
export const BASE_CRIT_CHANCE=.05;
export const BASE_CRIT_DAMAGE=1.75;
// Oct 15 user decision: every weapon's LMB kills a level-1 Swarmer (400 HP) in about the Longsword's time
// (~1.5s, 4 hits). Values tuned by simulation (crits off, single target); where whole-hit steps made
// damage alone overshoot, the interval was shortened instead. Multi-target weapons keep their crowd edge.
export const BASIC_ATTACKS={
 sword:{damage:100,interval:.45},
 /* Oct 18 new Warrior families: seeds, tuned against tests/balance-report.mjs */
 maul:{damage:185,interval:.95},
 greataxe:{damage:185,interval:1},
 spearshield:{damage:100,interval:.4},
 runeblade:{damage:105,interval:.48},
 gauntlets:{damage:78,interval:.28},
 katana:{damage:58,interval:.3},
 enchspear:{damage:120,interval:.62},
 standard:{damage:315,interval:.8},
 lance:{damage:170,interval:.95},
 chainaxe:{damage:115,interval:.9},
 glaive:{damage:180,interval:1},
 bow:{damage:100,interval:.42},
 longbow:{damage:210,interval:.85},
 shortbow:{damage:60,interval:.25},
 shuriken:{damage:114,interval:.31},
 crossbow:{damage:260,interval:1.4},
 kunai:{damage:94,interval:.24},
 pistols:{damage:55,interval:.2},
 falconer:{damage:90,interval:.15},
 shotgun:{damage:80,interval:1.25},
 chakram:{damage:304,interval:.55},
 /* Oct 18 new Ranger families + Crossbow single shot (user approved these balance-band values; Rifle is an approved exception above the band). */
 daggers:{damage:97,interval:.26},
 potion:{damage:115,interval:.5},
 bombbag:{damage:304,interval:1},
 canister:{damage:185,interval:.2},
 barrel:{damage:240,interval:.45},
 rifle:{damage:190,interval:1.1},
 flamethrower:{damage:28,interval:.1},
 dual:{damage:42,interval:.22,contacts:2},
 axe:{damage:90,interval:.56},
 greatsword:{damage:200,interval:1.08},
 spear:{damage:136,interval:.63},
 hammer:{damage:200,interval:1.10},
 orb:{damage:180,interval:.66},
 wand:{damage:100,interval:.26},
 staff:{damage:180,interval:.55},
 spellbook:{damage:80,interval:.53},
 scepter:{damage:63,interval:.20},
 grimoire:{damage:67,interval:.52},
 /* Oct 18 new Mage families: seeds, tuned against tests/balance-report.mjs. Skull damage = full-charge pulse. */
 icestaff:{damage:180,interval:.55},
 stormstaff:{damage:180,interval:.55},
 embers:{damage:246,interval:.18},
 sundisc:{damage:290,interval:.5},
 flamegaunt:{damage:160,interval:.42},
 lightrod:{damage:160,interval:.5},
 tesla:{damage:127,interval:.4},
 bloodorb:{damage:88,interval:.9},
 sigilbook:{damage:152,interval:.7},
 snowglobe:{damage:137,interval:.3},
 frostbeam:{damage:71,interval:.2},
 drum:{damage:305,interval:1.1},
 lantern:{damage:125,interval:.35},
 skull:{damage:765,interval:2},
};
export const ENEMY_HEALTH={swarmer:400,standard:650,medium:1000,heavy:2000,elite:4500,miniboss:15000};
// Provisional progression slope; existing enemies retain their spawn-time health and enrage.
export function enemyHealth(tier,seconds=0){return Math.round(ENEMY_HEALTH[tier]*worldHealthFactor(seconds));}
