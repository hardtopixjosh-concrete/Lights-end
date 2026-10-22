# VEYRATH Mage implementation plan

Recorded October 14, 2026. **Current October14 revision: base class plus locked specializations/active-upgrade trees and six arcane weapon patterns implemented. Historical mixed-tree/evolution proposals below are superseded where noted; reactions/advanced affixes remain planned.** See GAME_REFERENCE decision log for actual behavior, provisional tuning and checks. Mage base kit, class selection, Arcane Energy/HUD, starter, class-compatible shared weapons/save migration are playable. Full24-node tree/evolutions, reactions and complete Mage affix system are not implemented.

Source: `../VEYRATH_Mage_Class_Build_Spec_V0_2.pdf` (11 pages). Searchable companion: `mage-design-transcript.txt`. Shared authority: `../GAME_REFERENCE.md`, original V0.8 PDF and newer chat decisions. Keep both PDFs unchanged. This plan supplements the shared reference; it does not replace it or authorize unrelated systems.

## Compatibility and decisions

| Topic | Reconciliation / status |
| --- | --- |
| Shared game | Keep the current desert, normalized 90% camera, enemies/elites, XP curve/bar, gold, forge, inventory, sound settings, death/restart and Sites identity. Add Mage alongside Swordsman; never overwrite Swordsman. |
| Walking facing | **User confirmed October14:** keep WASD walking/idle facing and mouse-aimed casts for Mage. This overrides Mage PDF p.10's always-mouse-facing controller instruction. Cast animation may snapshot its mouse-facing separately, as Swordsman attacks do. |
| Special weapon signatures | **User confirmed October14:** wild weapon signatures remain red Ascendant only. This overrides Mage PDF p.8's Legendary/Mythic signature examples. Ashen Star/Frostweaver/Stormglass effects remain candidates for skill effects/ordinary affixes or later red weapons; no automatic reassignment of item rarity or approval of those designs. Ordinary elemental affixes and skill evolutions remain distinct from wild weapon signatures. |
| Weapon scaling | Mage PDF pp.2/8 describes character-level restoration; V0.8 p.10 annotation leaves the curve open. Current code uses `min(ceiling, 1 + floor((level-1)*.5))`. Reuse the shared curve initially; do not introduce Mage-only 1:1 restoration. Stored weapon rolls/identity/ceiling never reroll. Current raw numeric affix bonuses are not fully level-normalized; define a shared runtime normalization formula before claiming full spec compliance. |
| Damage ×2 | Latest chat globally doubles outgoing/incoming damage. Proposed integration: Mage base damage feeds that same multiplier exactly once; HP, energy, healing, costs and cooldowns are not doubled. PDF damage values remain tuning seeds, not promises of class parity. |
| Energy versus mana | Use **Arcane Energy**, not conventional mana, Arcane Momentum or constant 8/sec recovery (obsolete per Mage p.6). Keep free LMB and free Blink. |
| Purple HUD globe | Swordsman currently shows Storm readiness. Mage should show Arcane Energy in its own class HUD, with Meteor cooldown on R. Do not relabel the Swordsman's globe or add energy to Swordsman. |
| Level-up UI | Mage p.6 prohibits forced menus/popups. Keep the nonblocking rising LEVEL UP text/chime and XP bar; never force the skill tree open on level/point gain. |
| Armor | Frozen Armor is a temporary spell barrier, not persistent armor equipment. No armor/jewelry loot. |
| Forge shield | Latest chat overrides older PDFs: 20-second dome timer continues in forge menu; mutual barrier blocks attacks/statuses through it. Mage bolts, spells, reactions and Blink must respect that same shield/terrain policy. Ordinary solo simulation and energy recovery stay paused in menus; the shield countdown is the explicit real-time exception. |
| Skill points | **Latest user override:** choose one path at level1; one point at levels5/10/15/etc within it. No mini-boss point bonus or eight-point cap. Run-only allocation, forge refunds within same path. New active-upgrade rank trees replace mixed boolean purchases. |
| Realm and future events | Sovereign defeat returns to suspended main run, not GAME OVER. Realm/events/major bosses are not implemented; retain compatibility requirements as future acceptance, not completed features. No realm-exclusive weapon can enter ordinary drops/rerolls. |

## Mage baseline from PDF pp.1–4

Manual ranged spellcaster with elemental combinations, positioning, burst/recovery rhythm. All starting actions available at level 1 without skill purchases. Proposed stats: 170 HP, 100 maximum Arcane Energy. Existing player movement/camera and shared automatic level growth are the recommended initial baseline; class-specific level-growth tuning is not specified.

| Input | Action | Prototype base damage | Energy | Prototype cadence / purpose |
| --- | --- | --- | --- | --- |
| LMB / hold | Arcane Bolt | 30 | 0 | Repeat every .30s; manual aim; useful at zero energy |
| RMB | Fireball | 85 impact + burn | 15 | 2.5s cooldown; small explosion |
| Q | Frost Nova | 25 | 20 | 9s cooldown; freezes ordinary enemies, chills bosses |
| E | Chain Lightning | 45 per hit | 25 | 6s cooldown; up to four targets |
| R | Meteor | 250 center / 125 outer | 50 | 35s cooldown; aimed, clearly marked impact |
| Space | Arcane Blink | — | 0 | 3s cooldown; short reposition and brief immunity |

Damage values are base seeds before shared damage/weapon/level modifiers. For example, with only current global ×2, Bolt is 60 and Meteor 500 center/250 outer; do not bake those doubled values into both spell data and damage service.

Energy semantics:

- Spend at successful cast commitment. Insufficient energy rejects the cast without spending energy, cooldown or recovery reset.
- Time since last successful costly spell: under1.5s =3/sec; 1.5–under2.5s =12/sec; 2.5s onward =25/sec. Integrate across stage boundaries, cap at maximum, and avoid frame-rate-dependent recovery.
- LMB, walking and Blink never restart recovery. Baseline recovery does not require kills/hits. Regeneration and recovery clock freeze with paused gameplay; no offline catch-up or forge-menu resource exploit.
- Optional resource brightening at rapid recovery; readable energy costs/shortage feedback. Numerical values are prototype tuning despite the resource structure being authoritative in the companion.

Unspecified spell details to define in implementation data: projectile speed/range/radius; cast commitment/hit/recovery frames; burn amount/duration/tick rate; Nova radius/freeze duration; chain radius/target ordering/repeat rules; Meteor warning/radii; Blink distance/immunity/recovery cancellation. Recommended: snapshot aim/target at commitment, one hit per bolt target, no duplicate chain target per cast, player-centered base Nova, and preserve readable enemy telegraphs. These recommendations are not confirmed PDF numbers.

## Elemental reactions (PDF pp.6–7)

| Reaction | Source rule |
| --- | --- |
| Thermal Shock | Fire on Frozen causes localized burst and consumes Freeze; bosses consume Chill stacks and receive limited stagger. |
| Shatterstorm | Lightning on Frozen launches limited ice fragments; bosses get reduced non-freezing effect. |
| Overload | Lightning on Burning creates a localized explosion and applies nearby Shock. |

Use shared statuses, boss resistance and bounded target/projectile/VFX budgets. Secondary damage must not recursively trigger full reactions. Proposed major-reaction per-target internal cooldown:1s. Exact damage, stack caps, freeze/stagger immunity windows and proc limits remain tuning decisions. Mage must not permanently freeze elites/bosses or bypass their telegraphed attacks. All secondary effects honor the mutual forge barrier.

## Historical proposed skill inventory (PDF pp.5–6; latest locked-path grid supersedes it)

Twenty-four nodes, eight per branch: six regular and two major evolutions. One point per node. Major evolutions require three prior points in that branch plus the named prerequisite. One active replacement evolution per ability. **Two major evolutions total/run is only a recommendation, not approved.** Ordinary-node topology is still unspecified.

| Branch | Node | Source effect / prerequisite |
| --- | --- | --- |
| Pyromancer | Kindling | +12% burn damage |
| Pyromancer | Searing Impact | +15% Fireball explosion radius |
| Pyromancer | Wildfire | Burning deaths spread weaker burn to one target; limit triggers |
| Pyromancer | Molten Core | +15% Fireball direct-hit damage to elites |
| Pyromancer | Infernal Focus | +20% Meteor center damage |
| Pyromancer | Fuel the Flames | Burn a previously unburned elite: +4 energy; 5s internal cooldown |
| Pyromancer | Inferno Orb, evolution | Replace Fireball with slow damaging orb/delayed explosion; Searing Impact prerequisite |
| Pyromancer | Falling Stars, evolution | Replace Meteor with three smaller impacts; Infernal Focus prerequisite |
| Cryomancer | Cold Snap | +15% chill strength |
| Cryomancer | Permafrost | +25% chill duration |
| Cryomancer | Frozen Armor | Nova grants20-point barrier for3s |
| Cryomancer | Shatter | Frost on Frozen causes limited ice burst |
| Cryomancer | Glacial Reach | +20% Nova radius |
| Cryomancer | Frigid Recovery | Nova costs5 less energy |
| Cryomancer | Ice Prison, evolution | Replace Nova with targeted ice ring; Glacial Reach prerequisite |
| Cryomancer | Crystal Spear, evolution | Replace Bolt with free piercing Chill projectile; Cold Snap prerequisite |
| Stormcaller | Static Charge | Shock grants +5% damage received, under shared caps |
| Stormcaller | Conductivity | Chain hits one additional target |
| Stormcaller | Overcurrent | +12% Chain damage |
| Stormcaller | Quickening | Bolt interval reduced8% |
| Stormcaller | Stormflow | +2 energy/sec to each regeneration stage |
| Stormcaller | Voltaic Escape | Blink shocks near destination |
| Stormcaller | Ball Lightning, evolution | Replace Chain with slow area-lightning orb; Conductivity prerequisite |
| Stormcaller | Thunderstep, evolution | Evolve Blink with directional lightning; Voltaic Escape prerequisite; remains free |

Keep skill points/allocations run-only; shared forge respec refunds consistently and restores base/replacement spell mappings atomically. Connected branch display must show prerequisites, current effects, energy changes and evolution conflicts before purchase. No modal interruption for routine XP/mini-boss rewards.

## Weapons, saves and class selection

PDF p.8: Staff = damage/AoE with slower Bolt; Wand = faster Bolt/mobility with lower per-hit damage; Spellbook = reactions/control with reduced direct damage. All use the shared six-tier rarity palette and annotated0/1/2/3/4/5 affix counts. Ascendant/signature loot is future shared work, not already available in current five-tier armory.

Mage affix eligibility includes spell/elemental damage, cast speed, maximum energy, regeneration, Fireball AoE, Nova radius, chain targets, Meteor damage, Blink cooldown, reactions, statuses and boss damage. Add explicit class/family tags, preserve saved rolled values, and prevent incompatible/duplicate signatures. Reuse gold, quality/reroll/lock/salvage/respec transactions; no separate Mage currency or duplicated save economy.

Batch A implementation defaults under the user's authorization: select Swordsman or Mage before a new run, with return to class selection after death; no mid-run switching. Shared weapon collection/gold with remembered class-compatible loadouts and one active equipped item. Existing sword saves retain their loadout and receive an idempotent Common Ashwood Staff starter; no old item conversion or reroll. Version2 save migration accepts legacy version1; active-class-only drops prevent unusable early loot. Staff/Wand/Spellbook family tradeoffs and compatible generic damage/speed/crit/elite affixes are present; expanded Mage affixes remain batchB.

Permanent: weapon IDs, rolls, family/class tags, rarity/ceiling, quality/locks/favorites and shared gold. Temporary: class run state, HP/energy/regen clock, XP/points/skills, statuses, cooldowns and projectiles. Reset effective power and energy state at new run; retain identity/cosmetics. Do not claim multiplayer/account-authoritative persistence from current browser-local saves.

## Assets and code audit

- Existing static JavaScript/Canvas game; separate simulation, combat, survival, rewards, weapons, sound, forge shield and elite hazards. Current input/render code is still Swordsman-specific and needs an additive class dispatcher, not destructive replacement.
- `2D HD Character pack 1 V1.2.zip` includes `3Wizard` and `6Mage`, both with `CastSpell`. **Prefer 6Mage as a candidate; final model/animation choice not approved.** Verify Idle/Run/CastSpell/TakeDamage/Die and Blink candidate frames/direction rows/pivots before use; Knight's verified rows do not prove Mage's rows.
- `docs/ASSET_CATALOG.md`: Fantasy FX1/2, Projectiles2/3/4 and Gigapack offer casts, fire/ice/lightning, impacts and warp. Existing blue ice spell is already prepared. Inspect selected sequences and ship only required atlases/license files; keep the desert art and established FX direction.
- Existing supplied audio has sword/hurt/death/background cues, but no named Mage spell clips. Preserve15% background/20% FX settings; plan restrained temporary class-specific cues until Mage audio is selected. Never replay sword swishes for every Bolt.

## Coherent build batches

| Batch | Deliverable | Essential acceptance |
| --- | --- | --- |
| A — playable Mage | Pre-run class choice, actual Mage sprite, class action dispatch, energy component/HUD, all six base actions, baseline starter and safe save migration | Swordsman still works; insufficient-energy casts leave cooldown unchanged; recovery crosses stages correctly and pauses; free Bolt/Blink work at zero energy; projectile/area/chain/Blink respect scenery, body blockers and forge dome; death/restart retain gold/weapons. One focused integration smoke plus brief visual check; publish once. |
| B — elemental builds | Shared statuses/reactions; class-filtered Staff/Wand/Spellbook rolls/affixes; data-driven24-node tree and six evolutions with explicit prerequisites | Nonrecursive capped reactions; bosses retain mechanics; branch/evolution constraints and respec refund work; old saved weapons/rolls preserved; agreed shared scaling applied once. Resolve pending evolution/energy-cap/drop rules before dependent work. Publish once. |
| C — parity and future systems | Tune representative base/skill/weapon builds against current enemies, seven elite types and Dune Ravager; connect new bosses/events/realm when those shared systems actually exist | PDF p.10 60-second DPS within10–15%, comparable wave clear/survival and FPS are **hypotheses requiring measurements**, not promises. Record observed results/limits. Defer unimplemented Blood Moon/trials/Sovereign acceptance until those features are built. |

This batches the PDF p.10 order into larger playable steps under the user's latest workflow. Update GAME_REFERENCE after each batch; do not wait for approval after each small spell or rerun successful checks during packaging.

## Open decisions register

1. Walking facing and lower-rarity signatures: **resolved October14** by user; WASD walking/mouse-aimed casts and red-only wild weapon signatures. See compatibility table.
2. Maximum two major evolutions/run: proposal only; settle before batchB.
3. Exact regular-node topology and whether prerequisites count as part of the three prior branch points: document before tree implementation.
4. Maximum energy above100 via affixes/nodes; stage bonus caps and interaction with Stormflow: unresolved in PDF p.11.
5. Exact cast/hit/recovery timings and spell/status geometry: asset inspection plus initial tuning needed.
6. Shared numeric weapon/affix normalization formula remains open. Active-class-only drops and pre-run class loadouts are batchA implementation defaults, documented above, not new immutable design requirements.
7. Named signature items and Sovereign-exclusive Mage weapon: follow the now-confirmed red-only signature policy; defer implementation until shared Ascendant/realm systems exist and specific item designs are settled.

Documentation verification: read all11 Mage PDF pages; rendered/inspected page3 ability/energy table; compared V0.8 annotated weapon pages9–10 and current reference/chat changes; inspected current effective-level formula and ZIP character folders. No gameplay implementation, deployment or gameplay tests performed for this planning request.

### October14 playable feedback overrides
Primary Bolt base interval now.60s/cast.48s (from.30/.26), projectile640speed(from760). Mage projectile contact uses generous visible body/head bounds rather than feet; mouse target compensates30-unit render elevation. Shared terrain/body-blocking and Swordsman melee still use feet. E now10unique targets/3s cooldown (from4/6), per explicit user correction to the cooldown question; energy25/damage45 unchanged. FX/particles render behind enemies, with reduced-opacity supplied projectile/impact textures, layered lightning and bounded320 particles. Mage Nova's large ground ice texture replaced with transient frost rings/motes; control mechanics unchanged. These newer user choices override PDF numeric/visual seeds. See GAME_REFERENCE latest log for checks.

October14 further playtest override: Frost Nova base radius225 (from145), same weapon AoE multiplier, no target cap; ordinary1.2s freeze and boss/elite2s chill,20energy/9s cooldown retained. Shared enemy attack movement now.45 multiplier instead of.88 to make retreat practical. See latest GAME_REFERENCE entry.


### October14 — weapon-selected primary overrides
Latest user explicitly replaces universal Bolt with weapon-bound Energy Orb (heavy single target), Rock Spikes (lower-damage cluster), Water Splash (multi-target gentle push), or Vampiric Orb (red projectile, tiny kill heal). Implemented base family5/6/7/8 mapping to Orb Staff/Tide Wand/Stone Grimoire/Blood Focus; all four free and do not reset energy recovery. Family AoE/speed traits normalized1 in favor of primary identity; numerical item affixes/quality/level remain. New starter migration makes all styles available in armory without replacing existing saves. These are ordinary base identities authorized by user, distinct from red-only extra signatures. Shared enemy chase18% slower; richer640-capped Mage particles. See latest GAME_REFERENCE for exact playtest values, checks, assets and animation limitations. Full24-node tree/evolutions/reactions/advanced affixes still future work.


### October14 current override — arcane basics, specialized actives, level points
The user explicitly reversed the elemental weapon-primary batch. Weapon family controls only LMB pattern; specialization controls active-ability progression. All Mage LMB patterns remain free and blue-violet arcane: Staff piercing shot, Wand rapid darts, Spellbook five-shot cone, Orb centered pulse, Scepter held beam, Grimoire two lightly homing shots. Old water/rock/vampire primary mappings and kill heal removed. Ordinary numerical affixes remain; red-only exceptional signatures unchanged. Loot/pickup/equip/visible armory strictly active-class eligible, retained other-class saved items hidden rather than deleted.

Choose Pyromancer/Cryomancer/Stormcaller at level1 before entering; locked for run. One point per5levels, no mini-boss points. Mage has8active-upgrade nodes per chosen path, explicit1-rank prerequisites, most3ranks, selected pattern/lifetime nodes1rank. No cross-path purchase. Crystal Spear now upgrades RMB Ice Lance, Quickening upgrades RMB Lightning Bolt, never LMB. Pyro RMB/Q/E/R = Fireball/Flame Ward/Flame Surge/Meteor; Cryo = Ice Lance/Frost Nova/Glacial Burst/Blizzard; Storm = Lightning Bolt/Static Guard/Chain Lightning/Tempest; all retain free Blink. Level1 controls require no upgrade purchase. Shared Swordsman also chooses one existing-themed path and receives active-only ranked upgrades. Forge refunds spent ranks for50gold within chosen path.

New path loadouts/rank effects/timings are playtest implementation defaults, not a claim of verbatim full24-node PDF implementation or separately approved fixed balance. Earlier major-evolution caps/topology discussions are historical; do not reintroduce mixed branches or LMB spell replacements. Elemental reaction combos/advanced affixes/Ascendant signatures and further icon polish remain future work. Latest GAME_REFERENCE current-rules section and final log enumerate actual nodes, effects, saveversion4, essential checks and limitations. One focused smoke passed the new integration and brief local tree/class-only armory preview had no captured errors. No broad rerun.


October14 Weapon Affix V0.5 adoption: Mage LMB patterns now accept family-eligible ordinary behavior/stat affixes;47behavior/15stat core batch includes all6Mage families. Active RMB/Q/E/R/Space do not use ordinary weapon damage/crit/speed/reach, preserving class/path control. Explicit passive Arcane Energy max/regen/recovery delay may roll on Mage weapons; no equip-refill. New rarity slot ranges,1:1 ceiling restoration and40%-to100% numeric-roll scaling adopted, replacing earlier gradual curve. Typed forge and schema5 migration preserve saved Mage items. Named red signatures/reaction combos remain future work; see latest GAME_REFERENCE and weapon plan for actual coefficients/limits/checks.
