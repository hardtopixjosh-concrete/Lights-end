# Light's End — game overview (build fx-226, live as Site version 110, October 18, 2026)

This is a plain description of the game as it is built right now, written so another person or AI can understand the whole system. Numbers marked *(tuning)* are working values from playtests, not final balance.

## 1. What the game is

**Light's End** (working name was VEYRATH; tagline "The dark has a king") is an **isometric action roguelite**. It aims for the precise, manual combat of *Diablo / Path of Exile* combined with the constant horde pressure of *Vampire Survivors*.

- One large, seamless, hand-made **desert map** (9600 × 7200 world units, 15 areas: ruins, oases, villages, a pyramid, rivers, rock fields). No levels or loading between zones.
- A run lasts **30 minutes**. Enemies spawn continuously and get denser over time; bosses appear on a schedule and in optional pits. At 30:00 the final boss arrives.
- **Manual combat**: nothing attacks automatically. You walk with WASD and aim every attack with the mouse.
- **Roguelite structure**: your level, spells, cards and buffs reset every run. **Weapons and gold are permanent** and carry over.
- **Online co-op for up to 5 players** over Steam (desktop launcher). Solo also works in the browser.
- Runs in a web browser (Canvas + WebGL), on desktop and phones (touch controls), and in an Electron desktop launcher for Steam co-op.

## 2. Controls

| Input | Action |
|---|---|
| WASD | Walk. The character faces the direction it walks. |
| Mouse | Aim. Each attack/spell is aimed at the cursor at the moment you use it. |
| LMB (hold) | Basic attack. Depends entirely on the **equipped weapon**. |
| RMB, Q, E, R | Four spells/skills from your chosen **path** (R is the ultimate). |
| Space | Movement skill: Warrior **Dash**, Mage **Blink**, Ranger **Roll**. Brief invulnerability. |
| Tab (hold) | "Your build" panel (weapon, spells, behaviors, cards, buffs). |
| I | Weapons / run bag / safe pocket. |
| M | Map. |
| F | Interact (forge, shrines, events). |
| Esc | Menu. F3 = FPS overlay. F2 = test/cheat menu. |

Phones: left joystick, right-thumb arc of skill buttons with drag-to-aim, auto-aimed basic attack.

## 3. Classes

There are **three classes**. Each picks **one of four paths** (specializations) at the start of a run. The path decides the four spells (RMB/Q/E/R); the weapon decides the LMB.

| Class | Resource | LMB weapons | Movement | Paths |
|---|---|---|---|---|
| **Warrior** (melee) | **Rage**: built by hitting and being hit; abilities spend it, short cooldowns | Longsword (starter), Greatsword, Twin Blades, Throwing Axe, Warhammer | Dash | Berserker, Vanguard, Spellblade, Warlord |
| **Mage** (caster) | **Arcane Energy**: regenerates; spells have high costs and short cooldowns. LMB is free | Staff (starter), Wand, Grimoire, Orb, Spellbook, Scepter (beam) | Blink | Pyromancer, Cryomancer, Stormcaller, Blood Mage |
| **Ranger** (ranged/skills) | **Momentum** 0–100: built by completed weapon attacks, decays after 4 s without hits; skills cost Momentum | **Depends on path:** Archer & Alchemist: Bow, Short Bow, Long Bow, Crossbow, Falconer's Glove · Ninja: Shuriken, Kunai, Chakram · Gunslinger: Pistols, Shotgun | Roll | Archer, Ninja, Alchemist, Gunslinger |

- Base HP 250 (Warrior), lower for Mage/Ranger. HP regenerates 0.8/s after 3 s without damage.
- Rage and Momentum are credited once per completed attack (not per pellet or target), so slow and fast weapons earn about the same (~8 Rage/s, ~10 Momentum/s *(tuning)*).
- Only the first path per class is free; the others are unlocked for 600 gold each *(tuning)*.
- Shared Ranger statuses: **Marked** and **Exposed** (bonus damage). Mage paths have within-kit elemental reactions (burn, chill/freeze, shock, bleed).
- Heroes are live 3D models (three.js) holding their modelled weapon in its rarity colour, with an animation per weapon type.

Path flavour (full spell lists in the appendix):
- **Berserker**: bleed, Savage Rush, bloodlust, ultimate aggression. **Vanguard**: exploding parries, Sundering Cleave, Bastion Dome. **Spellblade**: void waves, dark-matter orbs, barrier, chaining void. **Warlord**: charge, war cry, earthquake, pulling Bladestorm.
- **Pyromancer**: spreading fire, burning ground, Meteor. **Cryomancer**: Ice Road, Frost Nova, freezing, Blizzard. **Stormcaller**: chain lightning, Storm Rods linked by arcs. **Blood Mage**: life-draining beam, blooming bleeds and blood pools.
- **Archer**: Power Shot, Arrow Type (fire/frost/poison), Volley, Hunter's Focus. **Ninja**: Cyclone, Smoke Bomb, Shuriken, Shadow Assault clones. **Alchemist**: Catalyst reactions, flasks, Grand Experiment. **Gunslinger**: Fan the Hammer (ricochets), Piercing Line (marks), Quickstep, Bullet Barrage.

## 4. Leveling inside a run

- Killed enemies drop **XP crystals** on the ground; you walk over them to collect them (XP is shared in co-op).
- **Level 1**: pick your first spell (choice of RMB / Q / E). Before that you have only LMB and movement.
- **Levels 5 and 10**: another spell from the remaining RMB/Q/E.
- **Level 15**: the **R** ultimate.
- **Development picks** at levels 7, 11, 14, then every 4 levels from 18. You choose either a **spell augment** (each spell has a small tree: 2 tier-1 augments, then 2 tier-2 augments that need a tier-1 first) or a **weapon development** for the equipped weapon family: **Attack Focus**, **Coverage** or **Rhythm**, two steps each. This lets a build lean on basic attacks, on spells, or both (e.g. beam Mage vs. spell Mage). Resource/hybrid and protection/healing options also exist.
- **Every other level**: choose 1 of 3 **stat cards** (Power, Haste, Swiftness, Magnetism, Vigor, Focus, Reach, Precision, Brutality, and more) in Common / Rare (×1.5) / Epic (×2) rarities.
- Level-up helpers: **Reroll** (new cards), **Banish** (removes only that card, for the rest of the run; the other offers stay), **Heal instead** (+30% HP). Every run starts with 2 rerolls and 1 banish; one more of each can be bought (600/800 gold).
- Stat cards show which rank of that stat you're taking and your total after picking it.
- The first two trial wins in a run each give a bonus development pick (up to 5 bonus "Build Insights" per run).
- In co-op, a level-up pauses everyone; once one player has picked, the others get 20 s before a random auto-pick.

## 5. The run (30 minutes)

| Time | Phase | Effect |
|---|---|---|
| 0:00–12:00 | Day | Normal pressure |
| 12:00–20:00 | Night | +20% spawn pressure, darker lighting |
| 20:00–24:00 | **Blood Moon** | +50% pressure, enemies +15% speed, red lighting |
| 24:00–30:00 | Dusk | +10% pressure, +5% speed |
| 22:30 | **Obsidian Colossus** | Main boss arrives |
| 30:00 | **The Reckoning** | Arena clears; the final boss **Crimson Tyrant** arrives. Beating it wins the run (victory screen + a Legendary weapon). |

- Enemy HP grows with **world time**, not your level: ×1.0 at the start to ×1.6 at 30:00 (swarmer 400 → 640 HP) *(tuning)*.
- Spawn pressure ramps every 5 minutes: population cap 12 → 40 → 70 → 100 → 140 → 165 → 180, hard cap 260 enemies *(tuning)*. Enemies spawn off-screen.
- Enemies that stay alive a long time speed up (up to ×2.5) and **enrage** after 90 s (more HP, red, bigger).
- **Modes**: Normal (30 min, beat the Tyrant), Endless (keeps going after the Tyrant, bosses return, horde scales), Modified (any mix of Quickened, Horde, Glass Cannon modifiers; no extra rewards).
- When you die (everyone is down in co-op) the run ends: level, spells, cards and buffs are lost; you keep only the equipped and safe-pocket weapons.
- **Winning** (beating the Tyrant in Normal or Endless, solo or co-op, not Modified or with cheats): you keep everything you carry plus 1,500 gold, choose 1 of 3 orange weapons, and unlock the **Tyrant Slayer** achievement and the **Tyrant's Gold** spell colour. The final win is meant to be very hard and rarely achieved on a fresh account.

## 6. Enemies

- **Demon roles**: Swarmer (fast, weak), Bruiser (slow, heavy telegraphed hits), Caster (keeps distance, dodgeable projectiles), Charger (wind-up then committed charge), Guardian (big blocker), Summoner (calls reinforcements).
- Only about 4 ordinary melee enemies attack at once; the rest reposition. Ordinary enemies push softly and never trap you; bosses, elites and guardians are solid.
- **Elite packs**: a leader with a modifier (Explosive, Vampiric, Frostbound, Shielded, Berserker, Warding, Waller) plus guards. One roaming elite at a time. Elites drop more gold and have a 5% weapon chance.
- All attacks have readable red telegraphs that flash just before they hit.

## 7. Bosses

**Main bosses (timed):**
- **Obsidian Colossus** (22:30): Pursuit Slam, Boulder Hurl, Fault Line, Shattering Stomp, Core Overload (kneels with its core exposed). Armour breaks at 66% and 33% (3 visual phases).
- **Crimson Tyrant** (30:00, final boss): six mechanics including heavy melee, Hellfire lanes, Cataclysm (run to the safe zones) and a closing ring of fire.

**Pit bosses (optional, from 0:00):** four walled pits in the corners of the map, each entered along a short walled path. Stepping in starts the fight and **freezes time outside the pit**. Leaving resets the boss to full health. Bosses respawn after a few minutes.
| Pit boss | Kit |
|---|---|
| Dune Ravager | boulders, charges |
| Dune Wyrm | Sandstorm Breath, Burrow Ambush, Tail sweep + rumbling ground, Scuttling Charge, Raking Claws, Quicksand Spit; orange armour bar, then a faster exposed phase |
| Ashen Butcher | Cross Chop, Boomerang Cleavers, Meat Hook, Butcher's Mark, Ash Fissures; Bloodrage at 50% |
| Hollow Prophet | Spectral Scythes, Delayed Echo, Soul Cage, False Apparitions, Soul Lances, Repulse |

**Pit boss rewards:** the **first** kill of each kind of corner boss in a run gives every player who fought it their own reward: a **personal weapon** plus a **run-long blessing** you choose (offense, health, or healing/barriers). Collecting all four strengthens the blessings you chose. Repeat kills of the same boss give no extra major reward (XP is still shared). After a pit kill, once everyone who was inside has chosen, the group is teleported out to the pit entrance and the pit seals until its boss returns.

Bosses enrage (show "ENRAGED") in their second phase. In co-op each boss attack targets a random player, never the same one twice in a row.

## 8. Weapons and loot (permanent)

- Weapons are the **only equipment**: no armour, rings or amulets. You hold **one weapon**; it controls your LMB.
- **Rarities**, in order (number of affixes): Common **white** 0, Magic **blue** 1, Rare **purple** 2, Legendary **yellow** 3, Mythic **orange** 4, Ascendant **red** 5. Only red weapons are meant to get wild signature effects (not built yet). Normal drops, shrines, crafting and the final boss never give red; red is reserved for the future realm boss.
- **Weapon power now boosts everything**: a weapon's power and quality improve your basic attack **and** your spells, healing and barriers (redesign, replaces the old "weapon = LMB only" rule). Attack-only affixes still affect only attacks; generic damage affixes affect both.
- **Affixes**: typed stat affixes (damage, speed, crit, HP, mobility, elemental, utility) and attack behaviour affixes, with caps and exclusions. A behaviour slot can be converted into a stat (Magic+, 400 gold) and back (Rare+).
- **Scaling**: a weapon keeps its identity, rarity, affixes and upgrades forever, but its numbers grow with your character level each run, so every run starts weak. Permanent **power ranks** +0 to +5 (about +8% each; 50/100/200/350/550 gold) and their bonus ramp from 40% at level 1 to 100% at level 20.
- **Tier promotion** at the forge: white → blue → purple → yellow → orange (100/300/600/1200 gold), each adds one stat affix and keeps everything else. Stops at orange.
- **Drop chances**: ordinary enemy 0.15%, elite 5%, boss 25% (main bosses guaranteed), plus events and the merchant. Drops always fit your class.
- **Where weapons live**: Armory (**50 slots**, permanent), overflow (never silently lost), **run bag** (12 slots, weapons found this run), **safe pocket** (1 slot). When a run ends you keep only the **equipped weapon and the safe-pocket weapon**; the rest of the run bag is lost.
- **Ember Forge** (fixed landmark on the map): power ranks, tier promotion, reroll an affix (paid old/new choice), behaviour↔stat conversion, salvage for gold. Salvaging from the lobby armory pays 70%.
- **Colour runes**: cosmetic weapon tint (Gold, Crimson, Frost, Ember, Storm, Void, Verdant). New purchases are "Coming Soon"; owned ones are kept.

## 9. Healing

- Passive regen 0.8 HP/s after 3 s without damage.
- **Heart pickups** drop from enemies (swarmer 1.5%, bruiser 4%, elite 30%, boss 100%) and heal 20% max HP; they fly to a hurt player nearby.
- One **healing pool** on the map heals while you stand in it, then dries up and refills after 75 s.

## 10. Optional world events

- **Shrines**: interacting reveals a personal choice of gold (permanent), healing, or a blue weapon. Each shrine is used once. (The old curse bargains were replaced.)
- **Guarded camps**: beat the guards for a 4-minute buff (Crimson Warcamp: damage + burn; Azure Sanctum: cooldowns + dash; Stonewarden's Rest: damage reduction).
- **Rifts**: opt in, then destroy three anchors within 90 s while waves escalate (200 gold + weapon chance).
- **Wandering merchant**: sells weapons for gold for a limited time (no yellow/red; orange very rare; sealed gamble offers).
- **Ancient Trials** in a walled colosseum: Steel (kill a champion), Precision (dodge marked strikes), Survival (hold a circle), Hunter (catch fleeing demons), Unbroken. The first two wins per run give a bonus development pick; later wins give gold and a purple/yellow weapon. Failure never ends the run; trials recharge after a few minutes.
- In co-op, entering a pit or trial starts a **vote** (everyone must say yes within 15 s; then all are teleported in).

## 11. Between runs (meta progression)

- **Gold** is permanent (from kills, bosses, events, salvage).
- **Starter runes** (gameplay runes, new): up to **3 rune slots** (100/400/800 gold) and runes at 200 gold each, equipped before a run (locked once it starts). Effects cover attack damage, abilities, barriers, healing, health, melee reach and spell travel range; each only helps actions it fits. Unranked for now; values are *(tuning)*.
- **Unlocks** (categories: Starter Runes, Class Paths, Run Upgrades, Weapon Codex, Cosmetics & Rewards, Coming Soon): extra paths (600 gold), runes and slots, Reroll/Banish charges, movement upgrades (second Blink/Dash charge, faster recharge, longer reach, Ember step burst). Weapon families are hidden until you find one. Planned: weapon evolutions and skill evolutions.
- **Best runs** records; the last 20 attempts can be exported as JSON for balancing. **Lobby** ("Prepare your run"): choose class and path, see your spells, equipped weapon, rune, safe pocket, armory, mode, then Start run.

## 12. Co-op (online, up to 5)

- Steam lobby via the desktop launcher: host, invite or join by code. Friends show in the lobby with their hero.
- **Host-authoritative**: the host's game simulates the world; friends send their inputs and receive snapshots ~20×/s, with their own movement predicted locally.
- Each player has their own class, path, weapon, HP, spells, level-up cards, gold and weapon drops (personal loot). XP and level are shared.
- **Downed, not dead**: at 0 HP you are downed; a teammate standing next to you for 3 s revives you at 35% HP. The run ends when everyone is down.
- Enemy HP +35% (normal), +50% (elite), +60% (boss) per extra player, and +25% spawns per extra player *(tuning)*.
- Enemies pick their own target; area attacks hit every player. Friendly fire is off. Duplicate classes are allowed.

## 13. Look and feel

- Isometric desert at a close camera, sand palette, vegetation, ruins; day/night lighting and a red Blood Moon.
- 2D painted world and sprite enemies; heroes and big bosses are detailed 3D/HD models. Spell effects run on a custom WebGL shader engine with bloom.
- Painted cloth-and-gold-crest UI kits for the main menu, character select, level-up cards, settings and Unlocks; low-poly moonlit backgrounds on the title and character screens.
- Music ("Desert Whispers"), ambience and hit sounds with separate volume sliders.

## 14. Designed but not built yet / open questions

- **Hollow Sovereign / realm**: a rare abduction into a separate realm with a four-phase boss; a win will give each eligible player a personal red weapon. Reward plumbing exists but the event is disabled until the boss is built.
- **Future classes**: healer, tank and a buff class that empowers another player (planning only; the shared power system already supports healing, barriers and ally buffs).
- Red Ascendant signature effects; weapon and skill evolutions.
- Balance from real full runs: beam vs. spell Pyromancer, Blood Mage sustain, Gunslinger burst (tests show it highest), XP and gold pacing, how many attempts a first win should take, menu protection rules in co-op.
- Real 5-player soak test and frame rate on lower-end PCs.

---

## Appendix — every path, spell and augment (from the game code)

Each path has four spells. Tier 0 is the spell itself; tier 1 augments need the spell; tier 2 augments need one tier-1 augment of the same spell.


### Mage · Pyromancer
*Fire-spreading fireballs, burning ground and meteor scorch.*

- **RMB · Fireball** — Hurl an exploding fireball. It only ignites by spreading: hitting a burning enemy bounces the fire on to the next.
  - tier 1: **Searing Impact** — Fireball explodes 15% wider.
  - tier 1: **Sunfire** — Every Fireball impact leaves burning ground for 2 seconds.
  - tier 2: **Chain Reaction** — Fireball bounces 2 more times (5 total).
  - tier 2: **Combustion** — Burning enemies explode when they die (60 fire damage, 80 radius).
- **Q · Flame Ward** — A fiery barrier that scorches nearby enemies.
  - tier 1: **Thick Ward** — Flame Ward barrier +15.
  - tier 1: **Enduring Flame** — Flame Ward lasts 1 second longer.
  - tier 2: **Flare Ring** — Flame Ward scorches 25% more area.
  - tier 2: **Flame Nova** — Flame Ward explodes outward when it ends, igniting nearby enemies.
- **E · Flame Surge** — A wave of fire that ignites everything in front of you.
  - tier 1: **Fire Pool** — Flame Surge leaves burning ground for 3 seconds.
  - tier 1: **Wall of Fire** — Flame Surge wave is 25% wider.
  - tier 2: **Kindling** — Burns deal 12% more damage.
  - tier 2: **Wildfire** — Burning enemies that die spread a half-strength burn to a neighbour.
- **R · Meteor** — Call a meteor from the sky.
  - tier 1: **Falling Stars** — Meteor splits into three staggered impacts.
  - tier 1: **Burning Earth** — Meteor scorch lasts 3s longer and covers 30% more ground.
  - tier 2: **Infernal Core** — Meteor centre hits 20% harder.
  - tier 2: **Molten Aftershock** — Meteor craters erupt again 1.5s later for 40% damage.

### Mage · Cryomancer
*Ice Road, freezing control and a crushing blizzard.*

- **RMB · Ice Road** — Lay a road of ice that chills and damages.
  - tier 1: **Frost Highway** — Ice Road lasts 2s longer and you move 25% faster on it.
  - tier 1: **Glacier Charge** — Ice Road freezes ordinary enemies it first hits for 1 second.
  - tier 2: **Cold Snap** — Chill is 15% stronger.
  - tier 2: **Wide Road** — Ice Road is 25% wider.
- **Q · Frost Nova** — Freeze enemies around you.
  - tier 1: **Frozen Armor** — Frost Nova grants a 20 HP barrier.
  - tier 1: **Frozen Heart** — Frost Nova restores 8 energy per frozen enemy (up to 32).
  - tier 2: **Glacial Reach** — Frost Nova radius +15%.
  - tier 2: **Deep Freeze** — Frost Nova freezes 25% longer.
- **E · Glacial Burst** — An icy explosion that freezes and chills.
  - tier 1: **Permafrost** — Glacial Burst freeze and chill last 20% longer.
  - tier 1: **Shatter** — Glacial Burst hits chilled or frozen enemies 15% harder.
  - tier 2: **Avalanche** — Glacial Burst covers 20% more area.
  - tier 2: **Ice Shards** — Glacial Burst launches 6 piercing ice shards outward.
- **R · Blizzard** — A storm of hail that follows the area.
  - tier 1: **Winterfall** — Blizzard radius +15%.
  - tier 1: **Ice Age** — Blizzard lasts 2s longer and ends with a freezing burst.
  - tier 2: **Following Storm** — Blizzard drifts after you while it rages.
  - tier 2: **Long Winter** — Blizzard lasts 30% longer.

### Mage · Stormcaller
*Chain lightning, linked storm rods and a chasing tempest.*

- **RMB · Chain Lightning** — Lightning that jumps between enemies.
  - tier 1: **Conductivity** — Chain Lightning reaches 2 more targets.
  - tier 1: **Arc Flash** — The last enemy struck erupts in a 90-radius shock burst.
  - tier 2: **Overcurrent** — Chain Lightning damage +12%.
  - tier 2: **Static Charge** — Shocked enemies take 5% more spell damage.
- **Q · Static Guard** — A crackling barrier that shocks attackers.
  - tier 1: **Storm Ward** — Static Guard barrier +15.
  - tier 1: **Lasting Charge** — Static Guard lasts 30% longer.
  - tier 2: **Static Field** — Static Guard burst covers 25% more area.
  - tier 2: **Voltaic Escape** — Blink arrival shocks nearby enemies.
- **E · Storm Rod** — Plant up to 2 lightning rods. Each zaps nearby enemies, arcs join the rods, and Chain Lightning overcharges them.
  - tier 1: **Long Rods** — Rods last 4 seconds longer.
  - tier 1: **Supercharger** — Chain Lightning overcharges every rod it passes, and overcharge lasts 2 seconds longer.
  - tier 2: **Wide Field** — Rod zap range +25%.
  - tier 2: **Live Wire** — Arcs between rods deal 50% more damage and slow enemies.
- **R · Tempest** — A storm that follows you and strikes nearby enemies.
  - tier 1: **Tempest Focus** — Tempest damage +15%.
  - tier 1: **Storm Chaser** — Tempest chases twice as fast and each pulse strikes the nearest enemy.
  - tier 2: **Thunderhead** — Tempest lasts 2 seconds longer.
  - tier 2: **Supercell Front** — Tempest covers 20% more area.

### Mage · Blood Mage
*Neon life drain, blooming bleeds and blood pools.*

- **RMB · Sanguine Drain** — Channel a beam that drains life.
  - tier 1: **Blood Feast** — Drain heals 25% more from a bleeding target.
  - tier 1: **Crimson Torrent** — Drain forks to a second nearby enemy.
  - tier 2: **Walking Drain** — Move 9 points faster while channeling Drain.
  - tier 2: **Eternal Hunger** — A full Drain empowers your next Crimson Bloom by 30%.
- **Q · Crimson Veil** — A blood barrier.
  - tier 1: **Thick Blood** — Crimson Veil barrier +20%.
  - tier 1: **Crimson Sanctuary** — Crimson Veil barrier +60%, but its cooldown is 25% longer.
  - tier 2: **Living Veil** — 25% of Drain overhealing becomes a barrier (up to 40).
  - tier 2: **Undying Blood** — A fatal hit leaves you at 1 HP with a 50 HP barrier (90s cooldown).
- **E · Crimson Bloom** — A bloom of blood that leaves bleeding pools.
  - tier 1: **Blood Geyser** — Blood pools are 20% bigger.
  - tier 1: **Second Bloom** — Crimson Bloom erupts again 0.6s later for half damage.
  - tier 2: **Hemorrhage** — Bloom on an already-bleeding enemy doubles its Bleed.
  - tier 2: **Lingering Blood** — Bleeds last 25% longer.
- **R · Blood Eclipse** — Darken the sky and feed on the blood below.
  - tier 1: **Blood Dominion** — Eclipse consumes each Bleed for a burst; Eclipse is 20% shorter.
  - tier 1: **Red Horizon** — Blood Eclipse covers 25% more area.
  - tier 2: **Long Night** — Blood Eclipse lasts 25% longer.
  - tier 2: **Harvest** — Enemies killed under Blood Eclipse heal you for 2% of your max HP.

### Warrior · Berserker
*Bleeding pressure, Savage Rush and ultimate aggression.*

- **RMB · Savage Rush** — Dash through enemies, leaving them bleeding.
  - tier 1: **Bleeding Rush** — Savage Rush Bleed damage +15%.
  - tier 1: **Executioner** — Rush hits enemies below 30% health 20% harder.
  - tier 2: **Long Rush** — Savage Rush travels 25% farther.
  - tier 2: **Ricochet** — After Savage Rush ends you leap again at the nearest enemy (60% distance).
- **Q · Bloodletting** — Enter a bloodlust that boosts damage and speed.
  - tier 1: **Red Mist** — Bloodlust damage bonus +20% effectiveness.
  - tier 1: **Blood Leap** — Each Bloodletting burst splashes 2 blood stacks onto a nearby enemy.
  - tier 2: **Lasting Fury** — Bloodlust lasts 25% longer.
  - tier 2: **Blood Feast** — Each enemy that bursts heals you for 3% of your max HP.
- **E · Carnage** — A savage spinning slash around you.
  - tier 1: **Maelstrom of Steel** — Every Carnage spin drags nearby enemies toward you.
  - tier 1: **Wide Carnage** — Carnage covers 25% more area.
  - tier 2: **Flung Blades** — The last Carnage spin flings 6 blood blades outward.
  - tier 2: **Serrated Spin** — Carnage spins make enemies bleed for 3 seconds.
- **R · Unchained Wrath** — Unleash your rage.
  - tier 1: **Burning Rage** — While Wrath is active, nearby enemies burn for 30 damage every 0.5s.
  - tier 1: **Endless Hunger** — Each kill during Unchained Wrath extends it by 0.5s (up to +4s).
  - tier 2: **Endless Wrath** — Unchained Wrath lasts 25% longer.
  - tier 2: **Wrath Horizon** — Wrath cuts reach 20% farther.

### Warrior · Vanguard
*Exploding parries, Sundering Cleave and the Bastion Dome.*

- **RMB · Sundering Cleave** — A ground-splitting cleave.
  - tier 1: **Long Sunder** — Sundering Cleave reaches 25% farther.
  - tier 1: **Aftershock Fissure** — Sundering Cleave cracks the ground; it erupts again 0.8s later for 50%.
  - tier 2: **Shatterblow** — Enemies killed by Sundering Cleave explode for 120 damage around them.
  - tier 2: **Broad Sunder** — Sundering Cleave is 25% wider.
- **Q · Perfect Guard** — Time a block to explode with a counter.
  - tier 1: **Patient Guard** — Perfect Guard window +0.04 seconds.
  - tier 1: **Second Wind** — A successful guard restores 10 health.
  - tier 2: **Iron Guard** — A successful guard grants 15% damage reduction for 2s.
  - tier 2: **Shield Shards** — A successful Perfect Guard fires shards at up to 5 nearby enemies.
- **E · Seismic Stomp** — Stomp the ground and stagger enemies.
  - tier 1: **Sheltering Slam** — Seismic Stomp grants a 15 HP barrier for 3s.
  - tier 1: **Wide Stomp** — Seismic Stomp covers 25% more area.
  - tier 2: **Stone Pillars** — Seismic Stomp raises 6 rock pillars around you for 3s that block enemies.
  - tier 2: **Aftershock** — Seismic Stomp repeats 0.7s later at 60% damage.
- **R · Bastion Dome** — Raise a protective dome.
  - tier 1: **Retribution** — While the Dome is active, enemies that hit you take 50 damage.
  - tier 1: **Fortress** — Bastion Dome blocks 10 more points of damage.
  - tier 2: **Enduring Bastion** — Bastion Dome lasts 25% longer.
  - tier 2: **Deflecting Dome** — Bastion Dome destroys enemy projectiles that touch it.

### Warrior · Spellblade
*Void waves, dark-matter orbs, an exploding barrier and chaining Void Ascension.*

- **RMB · Void Waves** — Send out a crescent of void.
  - tier 1: **Returning Waves** — Void Waves fly back to you after reaching full range, hitting again.
  - tier 1: **Far Waves** — Void Waves travel 25% farther.
  - tier 2: **Fan of Void** — Fire five Void Waves instead of three.
  - tier 2: **Collapsing Waves** — Each Void Wave explodes where it ends for 60% damage.
- **Q · Void Barrier** — A barrier that explodes.
  - tier 1: **Lasting Barrier** — Void Barrier lasts 25% longer.
  - tier 1: **Siphon Shell** — When Void Barrier breaks, refund 15 rage.
  - tier 2: **Void Burst** — Void Barrier explosion covers 25% more area.
  - tier 2: **Event Horizon** — Void Barrier pulls nearby enemies in just before it bursts.
- **E · Dark Matter** — Orbiting dark-matter orbs.
  - tier 1: **Gravity Well** — Dark Matter pulses slow enemies for 1 second.
  - tier 1: **Wide Orbit** — Dark Matter covers 25% more area.
  - tier 2: **Seeking Matter** — Every Dark Matter pulse also fires an orb at the nearest enemy.
  - tier 2: **Collapse** — When Dark Matter ends it implodes, pulling enemies in for 3x pulse damage.
- **R · Void Ascension** — Ascend and chain void strikes.
  - tier 1: **Eye of the Storm** — Void Ascension pulls nearby enemies toward you.
  - tier 1: **Arc Cascade** — Each chain hit also explodes for 30 damage.
  - tier 2: **Widening Storm** — Void Ascension chain range +10%.
  - tier 2: **Endless Chain** — Void Ascension chains jump to 3 more enemies.

### Warrior · Warlord
*Brutal Charge, a crushing War Cry, Earthquake and a pulling Bladestorm.*

- **RMB · Brutal Charge** — Charge forward and smash enemies.
  - tier 1: **Long Charge** — Brutal Charge travels 25% farther.
  - tier 1: **Shockwave Landing** — Brutal Charge ends with a shockwave around you for 60% damage.
  - tier 2: **Momentum** — Each enemy Brutal Charge hits refunds 4 rage.
  - tier 2: **Juggernaut** — Brutal Charge hits a 25% wider area.
- **Q · War Cry** — A crushing shout that weakens enemies.
  - tier 1: **Dread Command** — War Cry weakens enemy damage 10 points more.
  - tier 1: **Resonant Cry** — War Cry radius +25%.
  - tier 2: **Echoing Cry** — War Cry echoes a second time 2s later.
  - tier 2: **Terrifying Cry** — Enemies hit by War Cry flee from you for 2 seconds.
- **E · Earthquake** — Rolling fissures across the ground.
  - tier 1: **Earthsplitter** — Earthquake rolls a fourth, wider wave.
  - tier 1: **Long Fissures** — Earthquake fissures are 25% longer.
  - tier 2: **Rattling Quake** — The last Earthquake wave stuns enemies for 1.5 seconds.
  - tier 2: **Fault Lines** — Earthquake also cracks 3 fissures outward in a star.
- **R · Bladestorm** — A pulling whirlwind of blades.
  - tier 1: **Sandstorm** — Bladestorm pulls from 340 range and 60% harder.
  - tier 1: **Eye of the Cyclone** — Bladestorm lasts 20% longer.
  - tier 2: **Flying Blades** — Every second, Bladestorm throws a blade at the nearest enemy.
  - tier 2: **Whirlwind Finale** — Bladestorm ends with a blast for 3x pulse damage.

### Ranger · Archer
*Charged Power Shots, Fire/Frost/Poison arrows, marking Volleys and Hunter's Focus.*

- **RMB · Power Shot** — Hold to draw, release to fire a piercing arrow straight through every enemy in a line. Longer draws hit harder.
  - tier 1: **Heavy Draw** — Power Shot deals 25% more damage.
  - tier 1: **Quick Draw** — Power Shot reaches full draw 40% faster.
  - tier 2: **Split Shot** — Power Shot also fires two side arrows for 40% damage.
  - tier 2: **Hunter's Mark** — Power Shot Marks every enemy it pierces.
- **Q · Arrow Type** — Switch your arrows between Fire (burn), Frost (slow) and Poison (stacking damage). Applies to Quick Shot, Power Shot and Volley.
  - tier 1: **Ember Tips** — Fire arrow burns deal 30% more damage.
  - tier 1: **Deep Frost** — Every third Frost hit freezes an ordinary enemy for 1 second.
  - tier 2: **Virulent** — Poison stacks up to 8 instead of 5.
  - tier 2: **Elemental Surge** — After switching arrow type, your next 3 Quick Shots deal 50% more damage.
- **E · Volley** — Rain a volley of arrows on a large target area, hitting repeatedly and Marking enemies.
  - tier 1: **Rain of Arrows** — Volley covers 25% more area.
  - tier 1: **Long Volley** — Volley lasts 30% longer.
  - tier 2: **Final Salvo** — The last Volley wave hits 3x as hard.
  - tier 2: **Marked Prey** — Volley deals 25% more damage to Marked enemies.
- **R · Hunter's Focus** — Gain huge attack speed, piercing arrows and more crit chance. Quick Shot automatically targets Marked enemies.
  - tier 1: **Steady Focus** — Hunter's Focus lasts 25% longer.
  - tier 1: **Momentum Flow** — Kills during Hunter's Focus restore 5 Momentum.
  - tier 2: **Hail of Focus** — Every 4th Quick Shot during Focus calls a small volley on its target.
  - tier 2: **Eagle Eye** — Focus arrows pierce 3 more enemies and gain 10% more crit chance.

### Ranger · Ninja
*Bouncing shuriken, a blade Cyclone, Exposing Smoke Bomb and Shadow Assault clones.*

- **RMB · Cyclone** — Throw shuriken in every direction. Blades that hit an Exposed enemy ricochet again.
  - tier 1: **Sharpened Edges** — Cyclone deals 20% more damage.
  - tier 1: **Twin Cyclone** — Cyclone throws a second ring 0.25s later.
  - tier 2: **Blade Storm** — Cyclone throws 18 blades instead of 12.
  - tier 2: **Returning Blades** — Cyclone blades fly back to you, hitting again.
- **Q · Smoke Bomb** — Drop smoke: become briefly untargetable and faster. Enemies inside the smoke are Exposed.
  - tier 1: **Thick Smoke** — Smoke Bomb covers 25% more area.
  - tier 1: **Lingering Smoke** — Smoke lasts 30% longer.
  - tier 2: **Blinding Smoke** — Enemies inside the smoke are slowed.
  - tier 2: **Ambush** — Your first hit after the untargetable time ends deals double damage.
- **E · Shuriken Throw** — A fast, spammable shuriken that bounces between nearby enemies and hits Exposed enemies harder.
  - tier 1: **Ricochet Master** — Shuriken bounce 2 more times.
  - tier 1: **Twin Stars** — Throw two shuriken at once.
  - tier 2: **Cruel Edge** — Shuriken Expose the enemies they hit for 2s.
  - tier 2: **Honed Steel** — Shuriken deal 20% more damage.
- **R · Shadow Assault** — Shadow clones dash between enemies, striking them. Arrows you fire are copied by every clone.
  - tier 1: **Long Shadow** — Shadow Assault lasts 25% longer.
  - tier 1: **Shadow Legion** — Summon 5 clones instead of 3.
  - tier 2: **Shadow Marks** — Clone strikes Expose their target for 3s.
  - tier 2: **Vanishing Strike** — Clones explode when the assault ends.

### Ranger · Alchemist
*Toxic clouds, reactive Catalyst Flasks, a barrier flask and the Grand Experiment.*

- **RMB · Catalyst Flask** — Rapidly throw small flasks that react to what they hit: burning makes explosions, poison makes poison bursts, slowed enemies shatter, anything else ignites.
  - tier 1: **Wide Splash** — Catalyst splash covers 25% more area.
  - tier 1: **Double Dose** — Throw two Catalyst Flasks at once.
  - tier 2: **Residue** — Igniting flasks leave a small fire puddle for 2s.
  - tier 2: **Chain Reaction** — Each reaction also triggers on one nearby enemy for 60%.
- **Q · Reactive Flask** — Smash a potion at your feet: a barrier, a knockback blast and a slowing frost puddle.
  - tier 1: **Thick Glass** — Reactive Flask barrier +40%.
  - tier 1: **Shockwave Brew** — Reactive Flask blast covers 25% more area.
  - tier 2: **Restorative** — Reactive Flask heals 8% of your max HP.
  - tier 2: **Aftershock** — A second, weaker knockback follows 1s later.
- **E · Volatile Mixture** — Throw a large flask that leaves a wide toxic cloud, poisoning and slowing enemies.
  - tier 1: **Wide Cloud** — Volatile Mixture covers 25% more area.
  - tier 1: **Lingering Fumes** — The cloud lasts 30% longer.
  - tier 2: **Flammable** — The cloud also burns enemies inside it.
  - tier 2: **Corrosive** — Poisoned enemies take 15% more damage from you.
- **R · Grand Experiment** — Detonate every chemical on screen for huge chain reactions, then all Catalyst Flasks trigger enhanced reactions for a few seconds.
  - tier 1: **Prolonged Study** — The enhanced phase lasts 30% longer.
  - tier 1: **Recycle** — Each detonated puddle restores 5 Momentum.
  - tier 2: **Fresh Batch** — After detonating, leave a toxic cloud at your feet.
  - tier 2: **Overclocked** — Grand Experiment detonations deal 30% more damage.

### Ranger · Gunslinger
*Marking Piercing Line, ricocheting Fan the Hammer, Quickstep and Bullet Barrage.*

- **RMB · Fan the Hammer** — Rapidly fire shots toward the cursor. Shots against Marked enemies hit harder, and shots ricochet from enemies affected by your other abilities.
  - tier 1: **Hot Lead** — Fan the Hammer deals 20% more damage.
  - tier 1: **Six More** — Fire 9 shots instead of 6.
  - tier 2: **Piercing Rounds** — Shots pierce one extra enemy.
  - tier 2: **Called Shot** — Every third shot Marks its target.
- **Q · Quickstep** — A quick step with a moment of invulnerability. Using your other abilities shortens its cooldown.
  - tier 1: **Long Step** — Quickstep goes 30% farther.
  - tier 1: **Reload** — Quickstep restores 10 Momentum.
  - tier 2: **Parting Shots** — Quickstep fires at the 3 nearest enemies.
  - tier 2: **Rhythm** — Other abilities cut Quickstep cooldown by 1s instead of 0.5s.
- **E · Piercing Line** — A powerful shot straight through every enemy in a narrow line. Enemies hit are Marked.
  - tier 1: **Heavy Caliber** — Piercing Line deals 25% more damage.
  - tier 1: **Double Tap** — A second line follows 0.2s later for 60%.
  - tier 2: **Long Mark** — Piercing Line Marks last 3s longer.
  - tier 2: **Explosive Round** — The line ends in an explosion for 50% damage.
- **R · Bullet Barrage** — Lock your guns forward and unleash a stream of bullets toward the cursor while you keep moving.
  - tier 1: **Extended Mag** — Bullet Barrage lasts 25% longer.
  - tier 1: **Ricochet Rain** — Barrage bullets ricochet off Marked enemies.
  - tier 2: **Run and Gun** — Move at full speed during Bullet Barrage.
  - tier 2: **Spray** — Fire 50% more bullets in a wider spread.
