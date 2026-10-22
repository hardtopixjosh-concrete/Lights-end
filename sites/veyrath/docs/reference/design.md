# VEYRATH — design reference by system (PDF pages)

## Design pillars (PDF pp. 1–3)

An isometric action roguelite: Diablo/Path of Exile precision with Vampire Survivors continuous pressure. One large, seamless, mostly handcrafted desert; manual combat; bosses with learnable mechanics; permanent weapon collection and gold. No forced region transitions or corridor dungeon loop.

Preserve the supplied screenshot's close camera feel, sand palette, vegetation, boulders, ruins, tall stones and density. Use SmallScaleInt's HD 8-Directional Top-Down Character Pack 1, 2D Desert Fantasy Tileset and Top-Down Demons. Props must have ground-level footprints and correct draw-depth ordering. Keep combat telegraphs readable. Add subtle moving clouds/dust for depth (annotation p. 3).

Forge is a fixed recognizable landmark reachable from different directions. Enemy packs and events use curated potential placement points, with activation/randomization per run. The first test area is a foundation, not the final handcrafted world.

## Controls and combat (p. 4)

| Input | Action | Rule |
| --- | --- | --- |
| WASD | Walk and face | Eight-direction movement/facing independent of cursor; retain last walking facing at rest (chat change October 14) |
| Mouse | Aim attacks | Each swing snapshots precise cursor world aim and faces its nearest eight-direction animation row for that swing. On recovery, walking/idle facing resumes; cursor movement alone does not turn the walking/idle character |
| LMB / hold | Sword combo | Manual three-hit combo, hold may continue |
| RMB | Heavy Cleave | Slower broad attack, stagger and large targets |
| Q | Parry | Brief timed counter; some boss moves un-parryable |
| E | Ground Slam | AoE damage/stagger |
| R | Blade Storm | Player-triggered ultimate |
| Space | Dash | Directional evade through small enemies |
| I / F | Inventory / interact | Menus/forge/events; pause rule below needs resolution |

No automatic basic attacks or abilities. Input buffer, deliberate attack commitment, specified recovery cancels, animation-aligned hit windows, small hitstop, distinct parry feedback, stagger and clear melee openings. Creator specifically wants hit animation and sound feedback.

October 14 playtest decision: default camera scale is 90%, replacing the initial 100%. WASD controls walking facing, superseding M0's always-on mouse facing interpretation. Mouse combat aim stays separate from walking; M1 snapshots it per swing.

Tuning seeds, not locked balance: 250 HP; combo 45/50/65; heavy 110; movement 220 world units/s; dash about 3 s cooldown and 0.18 s invulnerability; ultimate about 35 s cooldown.

## Enemies and collision (p. 5)

| Role | Seed HP | Function |
| --- | --- | --- |
| Swarmer | 75 | Fast close pressure |
| Bruiser | 225 | Slow wide telegraphed strikes |
| Caster | 100 | Keep distance, dodgeable projectiles |
| Charger | 150 | Windup then committed charge |
| Guardian | 450 | Large blocker, protects others |
| Summoner | 175 | Capped reinforcements |

Regular enemies use soft separation and cannot hard-trap players. Only large demons, leaders and bosses body-block. Terrain is solid. Dash ignores ordinary bodies but respects terrain and major blockers. Use feet footprints, not image rectangles. Pursuit, spacing and obstacle avoidance with capped separation forces.

Pressure seed: about 3–4 ordinary melee attackers strike concurrently; others reposition. Ranged/elite/boss coordination is separate. Started animations finish unless legitimately interrupted.

Creator annotation: enemies left alive for a while enrage: increased HP, red appearance and slightly larger model. Trigger timing, caps and treatment of current vs maximum HP are unresolved.

Performance target, not verified: 150–180 active late-run enemies. Spatial hashing, pooling, shared textures and throttled AI; benchmark on real browsers.

## Run and encounter director (pp. 6–7, 21)

Continuous spawns, no mandatory downtime rounds. Budgeted regeneration and enemy-cost weights. Spawn off camera in navigable space. Bosses never spawn on the player. Queue major bosses; preserve engaged elites/bosses. Recycle distant ordinary enemies.

Proposed population progression per five-minute interval: 12–40, 40–70, 70–100, 100–140, 140–165, 165–180. Around a 30-minute core run followed by optional endless play is unresolved. Creator wants the end boss very difficult and rarely beaten.

Elite packs: leader plus about 3–6 demons; Explosive, Vampiric, Frostbound, Shielded, Berserker, Warding modifiers. Seed frequency 60–90 s, seed gold 40–80. **Annotated elite weapon drop chance: 5%, superseding printed 15% everywhere.**

Mini-bosses give one skill point on eligible kills without forcing a menu. Seed every ~3 min; proposed 8–10 point-producing kills per run, later kills yield gold/loot.

Ashen Butcher (~5 min seed): sweep, delayed charge, smash, phase change at 50%. Hollow Prophet (~10 min seed): projectile fan, marked eruptions, reposition and guardians. Major bosses guarantee weapon + gold. Each boss needs at least two learnable mechanics, readable parryability, fair telegraphs, punish windows and feasible baseline melee wins.

Director coordinates packs, camps, bosses, mini-bosses, shrines, merchant, trials, rifts, Blood Moon and abduction. Seed cap two active optional timed events. No inaccessible objectives or impossible hazard combinations. Avoid boss/realm/merchant transitions overlapping. Discoverable landmarks rather than full-screen prompts.

## Levels and skill tree (p. 8)

XP automatically improves core stats; routine levels never force a menu. Mini-boss points can be saved and manually spent; points and choices reset at ordinary death. Mix branches. Begin with about 18 meaningful nodes (six per branch), possibly grow to 24 after playtesting. Existing skills evolve without extra key demands. Run-only respec at forge.

- Berserker: criticals, bleed, execution; fast combo, bleed finisher, cleave execution.
- Vanguard: counters, parry, recovery; healing parry, counter boost, temporary guard.
- Spellblade: fire, frost, lightning, crowds; ignite spread, frost ground, chain lightning.

Examples are proposals: fire-wave combo, Cyclone cleave, lightning parry, frozen/burning slam, pulling ultimate. Exact nodes are not approved yet.

## Weapons, loot and permanent scaling (pp. 9–11, 19–20)

Weapons are the only persistent equipment. No equippable armor/rings/amulets. No weapon mastery or weapon-use XP. One equipped weapon. Longsword balanced; Greatsword slow/stagger; Twin Blades fast/short/status; Battleaxe execution/heavy; Polearm long/narrow.

| Rarity | Color | Annotated affix count | Printed seed weight |
| --- | --- | --- | --- |
| Common | Gray | 0 | 50% |
| Magic | Blue | 1 | 28% |
| Rare | Purple | 2 | 14% |
| Legendary | Orange | 3 | 6% |
| Mythic | Yellow/gold | 4 | 1.7% |
| Ascendant | Red | 5 | 0.3% |

Creator annotation replaces printed slot ranges. **Only red Ascendant weapons have wild signature effects.** Clarify distinction between ordinary elemental affixes/skill-tree effects and red-only signatures when those systems are built.

Keep identity, rarity, family, original maximum level/ceiling, appearance, affix types/rolled quality and forged improvements after ordinary death. Reset effective numerical power at the next run. Original proposal: effective level = min(character level, saved ceiling), starting at 1. Creator thinks 1:1 may restore power too quickly; **final scaling curve remains open**. Preserve red weapon signature identity/visuals while scaling numeric contributions. No rerolling stored instances on load or balance updates.

Loot pipeline: eligibility → family → rarity → stored ceiling → base roll → compatible affixes/signature → visual treatment → permanent unique instance. No duplicate/incompatible affixes. Bound multipliers, proc chains, attack speed and cooldown reductions.

Affix groups: physical damage, speed, crit, elite damage; HP, defensive/recovery; dash/mobility; fire/frost/lightning; bleed/poison/debuff; skill-specific bonuses; gold/XP/pickup/cooldown utility. Actual rolls remain saved.

Seed basic enemy weapon odds 0.15%; elite **5%**; major boss guaranteed. Printed boss rarity seed 15/40/30/12/2.5/0.5% is a proposal, and red-tier access needs reconciliation with Sovereign exclusivity before implementation. Named Sovereign-exclusive weapons must never drop elsewhere.

## Forge, armory and gold (p. 12)

Fixed map landmark. Reroll ordinary affixes, limited quality upgrades, salvage, run skill respec. All acquired unsalvaged weapons and collected gold persist. Versioned saves, atomic spend + item update. No free-gold upgrade/salvage loops.

Proposed prices: reroll 100 × 1.35^prior rolls; quality 150 × 1.6^quality, +5 limit, +2% base per level; one affix lock ~250. Seed salvage by rarity: 10/25/60/150/350/800, ignoring sunk crafting cost. Economy seed 300–500 gold in a successful first ten minutes.

Inspect/compare damage, speed, reach, affixes, skills. Favorites protect salvage; equipped/favorite destruction confirms. Proposed 12-weapon run backpack, 20-weapon armory and overflow chest so items are never silently lost. Between-run selection and salvage.

## Camps and titans (p. 13)

Fixed optional guarded buff camps. Proposed Crimson Warcamp: +15% damage/small burn for 4 min; Azure Sanctum: +15% cooldown recovery/dash benefit for 4 min; Stonewarden's Rest: +12% damage reduction/stagger resistance for 4 min. Seed camp respawn ~6 min; identical buffs refresh, not infinite stacking.

Optional Dune Wyrm (~12 min): breath, reposition, breakable armor; Wyrm's Heart temporary run buff. Late Obsidian Colossus: stages/weak-point windows; Colossus' Dominion for run. All buffs reset at ordinary death; timing/values provisional.

## Optional world activities (pp. 14–16)

Cursed shrines present explicit risk/reward before acceptance; at most one active curse. No benefit from abandoning/restarting. Proposals:

| Bargain | Risk | Reward |
| --- | --- | --- |
| Blood Pact | +30% incoming damage, 3 min | Double elite gold during curse |
| Glass Warrior | −35% maximum HP, 2 min | +50% attack damage |
| Demon's Bargain | +20% enemy speed, 3 min | Better rare odds |
| Forsaken Ground | −75% healing, 3 min | +35% XP |
| Mark of the Hunted | Dangerous hunting elite | Rare-or-better reward on defeat |

Merchant appears intermittently at sensible locations, limited duration, permanent gold purchases. Seed chance 20–30% of runs. Three offer types: affordable randomized, inspectable higher rarity/ceiling, sealed gamble. Stock rerolls per visit. Annotation: **no yellow or red items; orange extremely rare**. Never exclusive Sovereign items. Safe bubble unresolved.

Rifts: **player must accept before three anchors activate** (annotation). Can ignore entirely. Attack three separate anchors while waves escalate; seed 90 s deadline. Success gold + weapon chance; failure loses bonus and ordinary run continues. Blood Moon faster/rarer waves and better rewards, within population caps.

## Ancient trials (p. 17)

Located in a **walled colosseum area with an entrance**, part of the seamless map (annotation). Opt-in, clear boundaries/timer, baseline-kit solvable, failure never ends run. Proposed 2–3 available locations.

- Steel: kill champion in 90 s; gold + weapon chance.
- Precision: three signaled parries; gold + temporary crit.
- Survival: 60 s in marked area; defensive buff.
- Hunter: kill marked fleeing enemies; 3-minute elite gold bonus.
- Unbroken: win without damage; rare weapon chance.

## Atmosphere (p. 18)

Day/night changes monsters and pressure. Recurring predictable Blood Moon boosts density/speed, not blanket HP. Seed repeating 20-minute schedule: day 0–10; night 10–16 (+20% pressure); Blood Moon 16–18 (+50% pressure, +15% speed); aftermath 18–20 reduced pressure. Creator wants timing playtested. Distinct night mechanics, Blood Moon-exclusive variants/mini-boss opportunity. Red lighting must retain telegraph readability. Main-world clocks pause during Sovereign realm.

## Sovereign, omens and realm return (pp. 19–20)

Extremely rare involuntary abduction, at most once per run, no active major boss/transition overlap. Printed probability 15–25% of eligible runs is provisional and may not match intended extreme rarity. Main realm freezes, including player location, enemies, bosses, day/night and buff/event clocks. Separate realm clock. Win grants **one random named red weapon**; defeat returns to original ordinary run, not game over. Protected return, return HP unresolved.

Four Hollow Sovereign phases: 100–75% delayed sword/parry/dodge duel; 75–50% sequential safe zones/exploding runes; 50–25% true boss vs mirrors with repeatable tells; 25–0% combine learned mechanics with controlled overlap. Creator wants a very difficult boss requiring an excellent build OR exceptional mechanics; avoid unfair unavoidable one-shots. Hardness must be playtested.

Omens: wrong shadows, fading ruin symbols, reversed wind/dust, distant whispers/metallic sound. One or two signs may mean nothing. Annotation: **more than a couple of signs guarantees an abduction later that run if the player survives**. Exact counting/schedule unresolved. Clearly signaled ~4–6 s final transition: demons freeze, audio cuts, shadow circle, vanish.

Named red target weapons, exclusive to Sovereign farming: Judgment's Edge (spectral cleave echo), The Divided Soul (dash empowers shadow-repeat finisher), The King's Ruin (parry charges directional ultimate waves), Worldbreaker (second slam stagger ring). Grow to 6–8 named weapons over time. Visual/functional identity persists, numeric power follows finalized scaling. Optional cosmetic ambient changes after first win grant no stats.

## Menu protection and unresolved rules (p. 22)

Printed solo rule: inventory/forge/skill menus pause simulation. Annotation for multiplayer: 15 seconds of damage protection when opening a menu, a visible timer, no protection-reset exploit by reopening; a 30-second cycle with ~15 seconds downtime before renewed protection.

Do not silently decide whether this replaces solo pause, or whether the 30-second cycle starts at first menu-open or after leaving. Resolve precise semantics with the user when menus/multiplayer are built.

Permanent vs run data: weapons/rolls/quality/favorites/gold/cosmetic win record permanent; character level/XP/points/skills/effective weapon stats/buffs/curses/enemies/bosses/director clocks/event progress temporary. UI and simulation separate. Meaningful future tests: scaling, realm-defeat return, exclusive loot, atomic forge, event overlap/scheduling. Benchmark dense encounters before claiming performance targets.

Other open choices: 30-minute ending vs endless; final boss identity/timing; weapon recovery curve; point cap; trial point rewards; cross-category camp stacking; return health; forge cost basis; merchant safety; multiplayer player count/network model/save authority. Do not block the movement foundation on later decisions.

## Milestone sequence and acceptance

| Step | Scope | Acceptance | State |
| --- | --- | --- | --- |
| M0 | Small desert area, real knight, WASD movement/facing, 90% camera, depth, terrain collision | Diagonals equal speed; eight facings; grounded collision; user movement/collision review | User authorized advancing after fixes |
| M1 | Three-hit manual sword combo against one test demon | Frame-aligned hit windows, sound/hitstop/stagger, reliable directional hits, user review | Implemented, verified, published; user-approved October 14 |
| M2a | Space dash only | Directional animation, solid terrain, cooldown, recovery-only cancel; user feel review | Implemented; focused smoke check passed; published; awaiting user review |
| M2b | RMB Heavy Cleave | Wider/slower manual swing, stronger stagger, cooldown, recovery cancel; user feel review | Implemented; focused smoke/visual check passed; published; awaiting review |
| M2c onward | Parry, slam, ultimate in separate increments | Commitment/cancels, readable telegraphs, cooldowns; baseline kit feels right | Planned |
| M3 | Enemy roles, crowd steering, pressure, enrage | Soft regular bodies, major blockers, offscreen budgets; browser benchmarks | Planned |
| M4 | Gold, weapon instances, armory, death/reset | Finalize scaling/rarity decisions; versioned saves and scaling/drop tests | Planned |
| M5 | Mini-boss points, initial tree, fixed forge, Butcher | Meaningful nodes, atomic transactions, learnable boss | Planned |
| M6 | Expand handcrafted map, camps, shrine, merchant, rift, colosseum | Opt-in rules, navigation, bounded overlapping events | Planned |
| M7 | Prophet/titans, day/night/Blood Moon, pacing/end boss | Fair encounters, tuned pressure and economy | Planned |
| M8 | Omens, realm snapshot, four-phase Sovereign, named red loot | Preserved world/return on loss; exclusive drops; guaranteed multi-omen logic | Planned |
| M9 | Multiplayer architecture and menu bubble | Agreed player count/server model, authoritative state, no reset exploit | Planned |
| M10 | Balance, performance, polish | Full-run tests, dense scenes, economy simulations and user review | Planned |

Steps may be subdivided further. Do not begin the next major milestone before the current one is reviewed. A milestone is not complete merely because code exists.
