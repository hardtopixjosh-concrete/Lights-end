# Light's End — rebuild handoff (co-op first)

Written October 21, 2026, from the current build (fx-262 / Site version 131) and the reference docs. Give this file to whoever (or whichever AI) starts the new project. It covers:

1. What to keep (assets, data, pipelines, design sources)
2. The game as it stands now: every system, with the newest rules
3. How to structure the new project so co-op is built in from the start
4. Mistakes from the old build that must not happen again
5. A build order

Numbers marked *(tuning)* are playtest values, not approved balance. The exact values live in the old source files named next to each system. Copy them from there; don't retype them from memory.

---

## 1. What to keep

### 1.1 Original design sources (authority order still applies)
Latest explicit user decision > recorded chat decisions / PDF annotations > unannotated PDF design > PDF proposals > implementation defaults.

| Source | What it governs |
|---|---|
| `Action_Roguelite_Complete_Game_Design_Review_V0_8 (1).pdf` (+ `docs/pdf-design-transcript.txt`) | Core game: pillars, combat, world, economy, persistence |
| `VEYRATH_V0_9_2_COMPLETE_UPDATE_WITH_WARRIOR.pdf` (+ `docs/v0-9-2-design-transcript.txt`) | V0.9.2 change orders, Warrior appendix |
| `VEYRATH_Mage_Class_Build_Spec_V0_2.pdf` (+ `docs/mage-design-transcript.txt`) | Mage class mechanics |
| `VEYRATH_Warrior_Four_Specializations.pdf` | Warrior paths |
| `VEYRATH_Weapon_Affix_System_V0_5_Quick_Reference.pdf` (+ transcript) | Rarity, affix slots, caps, forge |
| `docs/LIGHTS_END_CODEX_IMPLEMENTATION_HANDOFF.md` | Oct 18 core redesign (shared weapon power, developments, Ranger eligibility) |
| `docs/LIGHTS_END_PROGRESSION_DESIGN_HANDOFF_2026-10-18.md` | Oct 18 progression (power ranks, promotion, runes, victory banking) |
| `docs/reference/decisions.md` | **Every user decision since the PDFs, with dates.** Wherever it conflicts with a PDF, it wins. |
| `docs/reference/balance-targets.md` | DPS band every class/path must hit |
| `docs/GAME_OVERVIEW.md` | Plain description of the whole game plus the full spell/augment appendix (as of fx-226; section 2 below lists what changed since) |

### 1.2 Raw asset packs (source material, keep the ZIPs untouched)
- **Characters / enemies / terrain (2D):** `2D HD Character pack 1 V1.2.zip`, `2D Demons - TopDown assetpack v1.1.zip`, `2D Desert Fantasy tileset v1.0.zip`, `Desert Biome/` (15 area reference shots)
- **3D hero sources:** `Visuals/Character models/` (Modular Character Outfits – Fantasy, Universal Animation Library 1+2, Universal Base Characters)
- **FX:** 13 Super Pixel packs in `Visuals/` (Gigapack, Blood, Explosion, Fantasy 1/2, Impact 1/2, Projectiles 2/3/4, Sci-fi 1/2, Effects 3). The user approved the **orange Sci-fi FX Pack 1 shockwave** (Ground Slam) as the FX style baseline.
- **Pickups / items:** `objects pickups visuals/` (Item Pickups Fantasy 1, Objects And Items)
- **UI kits:** `Visuals/UI/` (Main Menu, Unlocks, Armory/Inventory, Character Select, Crest & Cloth, Orb HUD, Settings, Talent Tree) + the two low-poly backgrounds
- **Audio:** `Sounds/` (music "Desert Whispers", sword/hit/death/game-over, Pyro casts). The CC0 Kenney/rubberduck recordings were **rejected** by the user (fx-251); don't bring them back.
- Catalog of every pack: `docs/ASSET_CATALOG.md` + exact index `docs/assets/inventory.json`. Read it before picking FX, pickups, icons or hazards. A pack containing something doesn't make it a game mechanic.

### 1.3 Prepared, game-ready assets (reuse directly, `sites/veyrath/dist/assets/`)
| Asset | Where | Notes |
|---|---|---|
| 3D heroes | `hero/warrior.glb`, `mage.glb` (red outfit, fx-262), `ranger.glb` | Quaternius outfits on the UAL skeleton, per-weapon clips (`W_<family>`, `Hold_<w>`, `Lmb_*`, `Channel_*`, `R_*`) |
| 3D weapons | `hero/weapons-warrior.glb`, `weapons-mage.glb`, `weapons-ranger.glb` | Materials named `Crystal`/`Rune` drive rarity glow and rune tint |
| HD bosses (pre-rendered strips) | `butcher/`, `prophet/`, `colossus1/2/3`, `wyrm1/2`, `golem/` (Dune Ravager), `tyrant1/2/3` | ~200 MB total; original quality is mandatory (never recompress) |
| Enemy sheets | `dm-*`, `demon-*`, `imp*` webp | 15 cols × 8 directions, 128 px cells |
| Knight/mage 2D sheets | `knight-*`, `mage-*` | Old fallbacks; the 3D heroes replaced them |
| Map | `maps/desert.tmj` (Tiled), `desert-props.tsj`, `maps/ground/*.webp` (80 baked ground tiles), `ground.json` | 9600 × 7200, 15 areas |
| Map props | `Ground-*`, `Flora-*`, `Door-*`, `Chest-*`, `Pyramid-*`, etc. | `assets/manifest.json` has `anchor`/`solid`/`foot` per sprite |
| UI | `ui/` (65 MB) | Already sliced from the kits, with fonts (Cinzel, Nunito, Source Serif 4, Grenze Gotisch) |
| Audio | `audio/` | Music, ambience, SFX manifest |
| Pickups | `pickup-hotsauce` (health), `pickup-pepper` (XP, purple glow) | |

**Critical sheet fact:** 8-direction rows are **E, SE, S, SW, W, NW, N, NE**, verified pixel-exact against the source packs. Do not guess row order for new sheets. 6Mage source frame 0 is a broken, nearly transparent frame.

### 1.4 Asset pipelines (keep; they're independent of game code)
- `sites/veyrath/prepare-*.py`: build the webp sheets/manifest from the ZIPs.
- `sites/veyrath/tools/generate-desert-map.py`: generates the map (re-running it **overwrites** Tiled hand edits). `tools/render-map-preview.py` gives an offline preview. `tools/bake-server.py` + the in-game bake bakes the ground tiles.
- `tools/warrior/` (prepare_sources → build_warrior.py → export_warrior_glb.py, presets `HERO=warrior|mage|ranger`), `tools/weapons/build_*_weapons.py`: Blender 4.3 hero and weapon pipeline. `mage_red_texture.py` makes the red Mage outfit.
- `tools/butcher|prophet|colossus|wyrm|golem|tyrant/` + `tools/hd/compose_model.py`: boss model build and strip compose (don't run two at once).
- `tools/deploy/` + `docs/ASSET_DELIVERY.md`: content-addressed R2 delivery that uploads only changed bytes. Keep the existing Site ID (`sites/veyrath/.openai/hosting.json`), saves origin and launcher URL.
- `tools/perf-probe/`: frame-time measurement.
- `launcher/`: Electron + steamworks.js (Spacewar App 480), lobby, invite, join code. It works and can be reused, but see 3.6 on transport.

### 1.5 Code worth porting as *data* (not as structure)
Lift the tables and formulas out of these files. Don't copy their architecture.

| System | Old file(s) |
|---|---|
| Class kits, spell numbers, augments | `mage-abilities.js`, `blood-mage.js`, `warrior.js`, `ranger.js` (RANGER_KITS), `talent-data.js`, `specializations.js` |
| Weapon families (54 IDs; IDs are save-stable) | `weapon-families.js`, `core-rules.js` (PATH_FAMILIES, caps, resource accounting), `mage-weapons.js` |
| Affixes, rarity, forge | `affix-data.js`, `weapons.js`, `forge-oasis.js` |
| Developments (Attack Focus/Coverage/Rhythm…) | `developments.js` |
| Level cards, XP | `level-cards.js`, `ground-xp.js`, `survival.js` |
| Waves and enemies | `wave-roster.js`, `wave-mechanics.js`, `enemy-roles.js`, `enemy-ranged.js`, `elite-powers.js`, `demon-roster.js` |
| Run clock, phases, scaling | `run-director.js`, `encounter-pacing.js` |
| Bosses | `bosses.js` (Ravager, Butcher, Prophet), `titans.js` (Colossus, Wyrm: COL/WY tables), `final-boss.js` (Tyrant), `realm.js`, `pits.js`, `arenas.js`, `boss-choices.js` |
| World events, trials | `world-events.js`, `arenas.js` |
| Meta / progression | `meta.js`, `progression.js`, `realm-rewards.js`, `encounter-rules.js`, `status-ownership.js` |
| VFX recipes | `vfx-recipes.js` (data recipes) + `vfx-engine.js` (WebGL2 instanced quads) + `vfx-lab.html` (tuning lab) |
| Sound recipes | `sound.js` |
| Balance harness | `tests/balance-report.mjs` (rebuild it against the new sim; it's the balance gate) |

---

## 2. The game today: full design spec (newest rules)

**Light's End** (working name VEYRATH, tagline "The dark has a king"). Isometric action roguelite: manual Diablo/PoE-style combat under Vampire-Survivors-style horde pressure. **Online co-op for 1–5 players is a core requirement** (Steam is the long-term target). Solo is just a party of one.

### 2.1 Controls
WASD walk (character faces walk direction) · mouse aims every attack/spell at the moment of use · **LMB** = equipped weapon's attack (hold) · **RMB/Q/E/R** = path spells (R = ultimate) · **Space** = class movement (Warrior Dash, Mage Blink, Ranger Roll; brief invulnerability) · Tab (hold) build panel · I weapons/bag · M map · F interact · Esc menu · F3 FPS/network overlay · F2 test menu. Phones get a left joystick, a right-thumb arc of skill buttons with drag-to-aim (tap = auto-aim), and an auto-aimed basic attack.

### 2.2 Classes, paths and resources
Three classes, each picking one of four paths per run. **Path = the four spells. Weapon = the LMB.** Only the first path per class is free; the others cost 600 gold *(tuning)*.

| Class | Resource | Movement | Paths (spell lists in GAME_OVERVIEW appendix) |
|---|---|---|---|
| Warrior | **Rage**: built by hitting and being hit, credited once per completed attack (~8/s) | Dash | Berserker, Vanguard, Spellblade, Warlord |
| Mage | **Arcane Energy**: regenerates; high costs, short cooldowns; LMB is free | Blink | Pyromancer, Cryomancer, Stormcaller, Blood Mage |
| Ranger | **Momentum** 0–100, built by completed attacks (~10/s), decays after 4 s | Roll | Archer, Ninja, Alchemist, Gunslinger |

- Base HP 250 for Warrior (lower for Mage/Ranger). Regen 0.8 HP/s after 3 s without damage.
- Statuses: Ranger shares **Marked** and **Exposed**. Mages get within-kit elemental reactions (burn, chill/freeze, shock, bleed).
- **Changes since the GAME_OVERVIEW appendix** (check decisions.md / log-ranger.md for details): the **Ninja rework** (RMB Shuriken Throw bouncing to 10; E rooted Blade Fan of 3 piercing waves; R Shadow Clones copying everything at 35% for 5 s, 20 s cooldown). Archer Power Shot is 350 at full charge (approved above the band). Storm E is Storm Rod. The Mage outfit is red.
- **Balance gate:** every path, including future classes, must land at level 30 in **~2,000–2,450 boss DPS** and **~7,000–11,000 crowd DPS (5 targets)**, with a crowd:boss ratio of 3–5×. Approved exceptions: Archer, Gunslinger Rifle. See `balance-targets.md`.
- **Animation rule:** every attack/spell pose is designed for the weapon being held (wand flick, two-handed staff thrust, overhand potion, etc.).
- **Hit rule:** weapons and projectiles hit the **whole enemy body** (body hitbox), never just the feet.

### 2.3 Weapons (permanent loot, the only equipment)
- One weapon equipped. It controls LMB, and **weapon power boosts everything** (attacks, spells, healing, barriers). Attack-only affixes affect only attacks.
- **Each path has exactly 4 eligible weapon families** (IDs are save-stable; keep them):

| Path | Families (ID) |
|---|---|
| Berserker | Longsword 0, Twin Blades 2, Throwing Axe 3, Maul 29 |
| Vanguard | Greatsword 1, Warhammer 11, Greataxe 30, Spear and Shield 31 |
| Spellblade | Runeblade 32, Runed Gauntlets 33, Elemental Katana 34, Enchanted Spear 35 |
| Warlord | War Standard 36, Great Lance 37, Chain Axe 38, Royal Glaive 39 |
| Pyromancer | Flame Staff 5, Ember Beads 42, Sun Disc 43, Flame Gauntlets 44 |
| Cryomancer | Ice Staff 40, Wand 6, Snow Globe 45, Freeze Gauntlets 46 |
| Stormcaller | Storm Staff 41, Lightning Rod 47, Thunder Drum 48, Tesla Scepter 49 |
| Blood Mage | Blood Orb 50, Sacrificial Book 51, Crimson Lantern 52, Cursed Skull 53 |
| Archer | Short Bow 14, Long Bow 13, Crossbow 16, Falconer's Glove 19 |
| Alchemist | Potion Satchel 23, Bomb Bag 24, Toxic Canister 25, Sludge Barrel 26 |
| Ninja | Shuriken 15, Kunai 17, Daggers 22, Chakram 21 |
| Gunslinger | Pistols 18, Rifle 27, Shotgun 20, Flamethrower 28 |

  Retired IDs: 4 (Halberd, deleted by the user), 7–10 (old Grimoire/Orb/Spellbook/Scepter, converted via `retiredTo`), 12 (old Bow). Ineligible weapons a player owns are kept and fall back safely.
- **Rarity:** white Common 0 affixes · blue Magic 1 · purple Rare 2 · yellow Legendary 3 · orange Mythic 4 · **red Ascendant 5** (red only via the realm boss; wild signature effects are red-only and not built yet).
- **Affixes:** typed stat affixes plus attack-behaviour affixes, with caps and exclusions. A behaviour↔stat slot conversion is possible (Magic+ 400 gold, reverse Rare+).
- **Scaling:** a weapon keeps its identity forever but its numbers follow your run level (1:1 effective level). Power ranks +0…+5 (~+8% each; 50/100/200/350/550 gold). The bonus ramps from 40% at level 1 to 100% at level 20.
- **Promotion:** white→blue→purple→yellow→orange (100/300/600/1200 gold) adds one stat affix each and stops at orange.
- **Drops** *(tuning)*: ordinary 0.15%, elite 5%, boss 25% (main bosses guaranteed). Drops always fit your class. Random drops never give red.
- **Storage:** Armory 50 slots (permanent) + overflow (never silently lost) + **run bag** 12 slots + **safe pocket** 1 slot. When a run ends you keep only the **equipped and safe-pocket** weapons. Victory keeps everything carried.
- **Ember Forge** (fixed map landmark): power ranks, promotion, affix reroll (paid old/new choice that persists until resolved), conversion, salvage. Lobby salvage pays 70%.
- Colour runes are cosmetic weapon tints; new purchases are "Coming Soon".

### 2.4 Leveling inside a run
- Enemies drop **XP crystals** (purple pepper) that you walk over. **XP and level are shared in co-op.**
- Level 1: first spell (choose RMB/Q/E; before that only LMB + movement). Levels 5 and 10: another spell. **Level 15: R.**
- **Development picks** at 7, 11, 14, then every 4 from 18: either a spell augment (per-spell tree: 2 tier-1, then 2 tier-2 that need a tier-1) or a weapon development for the equipped family (Attack Focus / Coverage / Rhythm, 2 steps each), plus resource/hybrid and defense/support options. Uses the Talent Tree pack window.
- **Other levels:** 1 of 3 stat cards (Power, Haste, Swiftness, Magnetism, Vigor, Focus, Reach, Precision, Brutality…) in Common / Rare ×1.5 / Epic ×2. Each card shows its rank and your new total.
- Helpers: Reroll, Banish (removes just that card for the run), Heal instead (+30% HP). Each run starts with 2 rerolls and 1 banish; one more of each can be bought.
- The first two trial wins give bonus development picks (max 5 "Build Insights").
- **Co-op level-up:** the shared game pauses. Once one player picks, the others get a 20 s countdown before a random auto-pick. Cards are personal.

### 2.5 The run (30 minutes)
| Time | Event |
|---|---|
| 0–12:00 | Day |
| 12–20:00 | Night: +20% pressure, darker |
| 20–24:00 | **Blood Moon**: +50% pressure, +15% enemy speed, red light |
| 24–29:00 | Dusk: +10% pressure, +5% speed |
| random 5:00–25:00, once | **Crimson Tyrant realm**: everyone is pulled into his sealed realm and the world freezes. A win returns everyone and gives each a personal red weapon (fx-245) |
| **29:00** | **The Reckoning**: arena clears, **Obsidian Colossus** arrives as the end boss (HP ×2). Killing it wins the run (fx-245, replaces the old "Colossus 22:30 + Tyrant 30:00") |

- Enemy HP scales with **world time**, not player level: ×1.0 → ×1.6 at the end *(tuning)*.
- Population ramps every 5 min (cap 12 → 40 → 70 → 100 → 140 → 165 → 180, hard cap 260) *(tuning)*. Spawns are off-screen, singly, from all directions.
- Long-lived enemies speed up (×2.5 cap) and enrage after 90 s.
- **Modes:** Normal; Endless (bosses return, horde keeps scaling); Modified (Quickened / Horde / Glass Cannon; no rewards).
- **Death** (everyone downed in co-op) loses level, spells, cards, buffs and the run bag except the equipped + pocket weapons.
- **Victory** (Normal/Endless, no Modified/cheats): keep everything, +1,500 gold, choose 1 of 3 orange weapons, the Tyrant Slayer achievement and the "Tyrant's Gold" spell colour.

### 2.6 Enemies (monster waves, fx-230)
Each run rolls **one variant per category**. Categories start at imp 0:00, tank 5:00, ranged 10:00, fast 15:00, attack-speed 20:00, peak shortly after, then the older ones fade to a 20% floor. Full stat table: `wave-roster.js`.
- **Imps** (4 skins) · **Tanks**: Ashbound Brute, Bastion Guardian, Sand Behemoth (pound), Horned Juggernaut (charge) · **Ranged**: Ash Archer (bolt), Cinder Lobber (lob), Void Fanner (fan), Shade Sniper (line) · **Fast**: Dune Runner, Sand Pouncer (leap) · **Attack-speed**: Claw Fiend (3-hit combo), Blade Dancer, Frenzied Lancer (frenzy stacks).
- Base AI roles: swarmer, bruiser, caster, charger, guardian, summoner.
- **Elites:** 6 models = 6 powers (Frostbound, Waller, Explosive, Vampiric, Shielded, Berserker; Warding dropped). One roaming elite at a time, with guards. 5% weapon chance.
- At most ~4 ordinary melee attackers at once; the rest reposition. Ordinary enemies push softly and never trap you; bosses, elites and guardians are solid. Enemies path with a flow field around obstacles.
- All attacks have readable red telegraphs that flash 0.38 s before the hit.

### 2.7 Bosses
- **Corner pit bosses** (optional, in their pits from 0:00, entered along a short walled path):
  - **Dune Ravager** (sandstone golem: boulders, charges, pound; enrages at 50%)
  - **Dune Wyrm** (Sandstorm Breath, Burrow Ambush, Tail sweep + 7 rumble spots, Scuttling Charge, Raking Claws, Quicksand Spit ×2; orange armour bar → faster exposed phase; whole-body hitbox)
  - **Ashen Butcher** (Cross Chop X cleavers, Boomerang Cleavers, Meat Hook that leads you, Butcher's Mark, Ash Fissures; Bloodrage + Cleaver Storm at 50%)
  - **Hollow Prophet** (Spectral Scythes, Delayed Echo → Soul Mire, Soul Cage, False Apparitions, Soul Lances, cone Repulse; walks toward you between casts)
- **Pit rules:** entering freezes time outside. Leaving resets the boss. The **first kill of each kind per run** gives every participant a personal weapon plus a chosen run blessing (offense / health / healing-barrier); all four strengthen your blessings. Afterwards everyone picks, then is teleported out and the pit seals until the boss respawns. Co-op entry needs a **vote** (all yes within 15 s, immune while voting).
- **Obsidian Colossus** (end boss, 29:00): Pursuit Slam, Boulder Hurl, Fault Line (black obsidian spike walls, 3/5/5 lines), Shattering Stomp (4 gaps), Ground Slam / Jump Slam by distance, Core Overload, rock rain below 10%. Armour breaks at 66%/33% (3 model phases, 16 armour pieces shed).
- **Crimson Tyrant** (realm boss, HP 170k *(tuning)*): armour sheds at 70%/35%, Molten Core, Last Light, meteor overlay, 10 attacks incl. Cataclysm safe zones, Hellfire lanes, bullet spirals, clones, pylon shield and a closing ring of fire.
- Bosses show "ENRAGED" in phase 2. **Co-op targeting:** each boss attack picks a random player (never the same twice in a row) and chases them until the next attack. Area attacks hit every player.

### 2.8 World and events
- One seamless hand-made desert, 9600 × 7200, 15 areas (ruins, oases, villages, pyramid, rivers, rock fields), each modelled on a `Desert Biome/` shot. Fixed Ember Forge, round minimap (upper right) + M full map.
- **Shrines:** personal choice of gold / healing / blue weapon, once each. **Guarded camps:** 4-minute buffs (Crimson Warcamp, Azure Sanctum, Stonewarden's Rest). **Rifts:** destroy 3 anchors in 90 s. **Wandering merchant.** **Ancient Trials** colosseum (Steel, Precision, Survival, Hunter, Unbroken; failure never ends the run; recharge after a few minutes). One **healing pool** (75 s refill). Events scale with the run clock.
- **Healing:** regen, heart pickups (hot-sauce bottle; 20% max HP; swarmer 1.5%, bruiser 4%, elite 30%, boss 100%), the healing pool.

### 2.9 Between runs (meta)
Gold is permanent. Unlocks codex: Starter Runes (3 slots 100/400/800, runes 200 each; unranked), Class Paths, Run Upgrades (Reroll/Banish, extra Blink/Dash charge, recharge, reach, Ember step), Weapon Codex (families hidden until found), Cosmetics. Best runs, plus a JSON export of the last 20 attempts. Settings include **Account → Reset entire account** (keeps settings). Audio sliders default to 50% (Music 15%).

### 2.10 Co-op rules (all current)
Steam lobby (host / invite / join code; friends' heroes shown in the lobby). **Ready-up**: everyone presses READY, then a shared 5 s countdown starts; it cancels if anyone un-readies or someone joins. Mid-run joiners get JOIN RUN. Each player has their own class/path/weapon, HP, spells, cards, gold and personal loot. XP/level are shared. **Downed** at 0 HP: a teammate standing next to you for 3 s revives you at 35%. Scaling per extra player *(tuning)*: enemy HP +35% / elite +50% / boss +60%, spawns +25%. Friendly fire off; duplicate classes allowed; no host migration.

### 2.11 Look and feel
Close isometric camera (90% scale start), sand palette, day/night grade, red Blood Moon. Painted 2D world and enemy sprites; heroes are live 3D models (three.js) holding their weapon in its rarity colour; big bosses are HD pre-rendered strips. Spell FX use the WebGL2 shader engine plus bloom. FX depth rule: height + shadows, layering, light, 3 phases (wind-up / hit / linger), camera shake. Navy-and-gold cloth/crest UI everywhere; Cinzel/Grenze Gotisch headings. Whole-number damage, rounded up; crits are bigger yellow numbers.

### 2.12 Designed but not built
Red Ascendant signature effects, weapon and skill evolutions, Hollow Sovereign (4-phase abduction boss; reward plumbing exists), healer/tank/buffer classes, guest-side forge/merchant parity, real 5-player soak test, Steam achievements/cloud saves, a production Steam App ID.

---

## 3. New architecture: co-op from line one

The old build was single-player first. A global `player` got swapped per teammate (`withMember`), the host simulation ran inside the render loop, and `game.js` grew to 250 KB of single-line code. The rule for the new build: **solo is a host with one player on a local loopback connection. There is only one code path.**

### 3.1 Platform: the user's decision, with a recommendation
- **Recommended: TypeScript + Vite, rendering with Canvas2D/WebGL (PixiJS or a custom renderer) + three.js for the 3D heroes, shipped in Electron with Steam.** This reuses every prepared asset, the GLB heroes, the VFX recipes, the launcher, the Site delivery and the browser saves as they are. Vite removes the hand-bumped `?v=fx-NNN` cache tags.
- Alternative: Godot 4 + GodotSteam. You get native performance and built-in multiplayer, and the sheets/GLBs import fine. But it means a rewrite of the VFX engine, UI and delivery, and browser/phone play becomes harder.

### 3.2 Layers (strict, one-way dependencies)
```
input  →  commands  →  SIMULATION (pure data, fixed tick)  →  events + state
                                                              ↓
                                       net (snapshots/events) / render / ui / audio
```
- **`sim/`** never touches DOM, canvas, audio, `window`, `Date.now` or `Math.random`. It runs headless in Node: tests, bots, the balance report, a full-run autopilot and later a worker or dedicated server all use the same code.
- **Fixed tick** (30 or 60 Hz), decoupled from rendering. The renderer interpolates between ticks. (The old host sim ran on requestAnimationFrame with dt capped at 40 ms, so a GPU stall slowed everyone.)
- **Seeded RNG per system** (spawns, loot, AI, cosmetic). The old build had ~355 bare `Math.random()` calls.
- **`render/`** reads world state and the event stream only, and keeps no gameplay state. All VFX are triggered by sim events (`{type:'hit', by, target, amount, crit}`), so remote clients get identical FX from the same events.
- **`ui/`** reads view-models. Per-frame DOM writes go through a change-only writer.
- **`content/`** is data: classes, paths, spells, augments, weapon families, affixes, enemies, waves, bosses, events, cards. Behaviours live in a registry keyed by id (`spellBehaviours['pyro.fireball']`), so content can be added without touching the core.
- **`meta/`** is account and save state (versioned schema + migrations), completely separate from the run sim.

### 3.3 Entities and ownership
- `world.players: Map<playerId, PlayerState>` from day one. Each has position, HP, barrier, resource, cooldowns, statuses, class/path/loadout, cards, developments, downed state and personal pickups.
- Every projectile, pool, buff, summon and damage instance carries `ownerId` (for credit, Rage/Momentum gain, ally buffs and personal kill rewards).
- Every enemy/boss carries `targetId` and a targeting policy (nearest, threat, random-no-repeat for bosses).
- Shared vs personal is explicit in the schema: **shared** = world clock, enemies, XP pool/level, bosses, map events. **Personal** = cards, loot rolls, gold, forge/merchant/shrine choices, rewards.
- Stable numeric entity IDs. Entity lists use add/remove events, not per-snapshot resends.

### 3.4 Input
Devices fill one `Command` per tick for the local player: `{tick, move:{x,y}, aim:{x,y}, pressed:[...], released:[...]}`. Bots and remote players produce the same struct. The sim never reads keys. Validate on the host: finite values, normalized movement, bounded queues, monotonic IDs, run ID.

### 3.5 Networking model
- **Host-authoritative** (it suits PvE with lots of randomness; lockstep is not an option).
- **Two channels:**
  - **Reliable ordered events**: level-up offers and choices, rewards, loot, votes, run control, spawns/despawns of important entities, damage/kill events that drive personal rewards.
  - **Unreliable state snapshots**: positions, HP, animation state, with acknowledged baselines, keyframes and delta-from-acked. Per-recipient relevance (far enemies at a lower rate).
- Compact binary encoding (quantized positions, small integers), not JSON. Budget it up front with 260 enemies + 5 players.
- **Client:** timestamped interpolation buffer (~100 ms) for others. Predict own movement *and* dash/blink, and show cast wind-ups locally so attacks feel instant.
- **Transport interface** (`send(peer, channel, bytes)`, `onMessage`) with three implementations: local loopback (solo, tests), Steam **NetworkingMessages/Sockets** (the old build used deprecated ISteamNetworking via steamworks.js 0.4.0; migrate), and optionally WebRTC for browser play.
- Built-in diagnostics from day one: ping, bytes/s per peer, snapshot size, pending queue, sim tick time (F3 overlay + copyable report).
- Pause semantics: menus never pause online, except level-up (shared pause + 20 s countdown) and votes.

### 3.6 Persistence and trust
Account saves (gold, armory, unlocks, runes, best runs) stay local per player for now, as before. Personal loot is rolled by the host but stored on the owner's PC, delivered via reliable events with IDs so nothing duplicates. Keep the save keys/origin compatible if old saves must carry over (`veyrath-armory*`, `veyrath-meta*`, `veyrath-wallet*`, `veyrath-account*`), and keep family IDs stable.

### 3.7 Rendering and performance rules carried over
Lazy-load boss/hero sheets (loading everything decoded ~940 MB). Bake static ground/shadows into tiles. Never use a live `ctx.filter` per draw (cache tinted cells). Cap particles by quality level. Graphics quality presets Auto/High/Medium/Low/Lowest. Don't resize GPU buffers per frame. Hide renderers not on screen. Measure with the perf probe before claiming a fix.

---

## 4. Mistakes from the old build (don't repeat)
1. **Single-player assumptions bolted onto co-op.** Global `player`, the `withMember` swap, guest-only crashes from missing effect data. Fix: section 3.
2. **One giant file** with very long single lines. A mid-line `//` comment once silently disabled XP, gold and events (fx-169). Use small modules, a formatter and a linter.
3. **Hand-bumped cache tags** across every module, and tests importing a different tag got a separate module copy. Use a bundler.
4. **JSON snapshots and per-field kit array resends**, full particle pools sent over the network, the whole enemy list resent every tick. Use an event-driven FX design and a compact schema.
5. **Host sim inside the render loop.** Use a fixed tick.
6. **Sim fixtures at map (0,0)** count as out-of-bounds and silently broke charges in tests. Give tests a valid spawn helper.
7. **Balance mismeasured** when the harness skipped a class tick. The balance harness must drive the real sim exactly like gameplay.
8. **Lossy recompression** of boss art to fit hosting limits. Never do it. Use content-addressed delivery.
9. **Building against what the user said.** Confirm interpretation, rule changes and any additions before building.

---

## 5. Suggested build order (each step playable, co-op from step 1)
1. **Skeleton:** project setup, fixed-tick sim, seeded RNG, loopback transport, Command input, 2–5 players (bots via the same Command path), camera on the local player, map loading from `desert.tmj` + baked ground tiles, collision/foot polygons, y-sort.
2. **Real networking early:** Steam lobby (reuse launcher UI), host/join, snapshots + events, interpolation, own-movement prediction, the F3 net overlay. Test 2 PCs here, before content.
3. **Combat core:** one class (Warrior, Longsword + Berserker) on the 3D hero, hit/hurt/telegraphs, dash i-frames, enemies with flow-field pathing, targeting, downed/revive, damage numbers.
4. **Run loop:** run clock + phases, wave roster, XP crystals, shared level, level-up pause/countdown, stat cards, spells at 1/5/10/15, death/victory.
5. **All 12 paths + 48 weapons + developments,** ported as data, with the balance report as the gate.
6. **Loot/meta:** rarity, affixes, run bag/safe pocket/armory, forge, gold, unlocks, runes, save migration.
7. **Bosses:** pit system + vote, Ravager, Wyrm, Butcher, Prophet, the Colossus end boss, the Tyrant realm.
8. **World events,** trials, merchant, shrines, camps, rifts, healing pool.
9. **UI kits** (title, lobby with ready-up, cards, talent window, armory, unlocks, settings, Orb HUD), audio, VFX recipes, quality presets, touch controls.
10. **Hardening:** 5-player soak, weak network, performance on low-end PCs, Steam achievements/cloud saves.
