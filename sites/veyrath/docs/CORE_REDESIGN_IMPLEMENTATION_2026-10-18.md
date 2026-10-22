# Core redesign implementation — October 18, 2026

Local implementation of `LIGHTS_END_CODEX_IMPLEMENTATION_HANDOFF.md`. The three code batches are present; balance acceptance remains provisional. Nothing was published. Existing models, assets, boss kits, permanent unlocks and hosting identity were preserved. The handoff supersedes conflicting historical LMB-only power and unrestricted Ranger equipment rules.

## Player-facing changes

- Weapon power and quality now improve eligible attacks, abilities, healing and barriers. Attack-only affixes still affect attacks only; generic damage affects both damage components. Support has independent scopes. Common resolution no longer uses the old Mage-wide ×2 or absolute-damage bypass; authored Mage coefficients retain their previous baseline instead.
- Attack Focus, Coverage and Rhythm each have two developments, mapped to the equipped family. All 21 active families and 59 legal path/family combinations are covered. Investment survives switching. Existing ability trees remain, alongside resource/hybrid and protection/healing choices. Spell acquisition stays at 1/5/10/15; developments follow 7/11/14/18 and every four levels thereafter. Up to five optional Build Insights remain bonuses.
- Rage/Momentum credit belongs to a successful original attack cycle, not each pellet, target, return or secondary. Slow weapons can fund single-target ability rotations. Recovery survives cancellation; weapon changes queue during committed actions. Beam re-pressing does not mint immediate ticks. Orb base pulses are free and incompatible casts pause them without banking ticks.
- Ranger equipment: Archer and Alchemist use Bow, Short Bow, Long Bow, Crossbow and Falconer's Glove; Ninja uses Shuriken, Kunai and Chakram; Gunslinger uses Pistols and Shotgun. Ineligible collected items remain saved. Migration provides deterministic, non-salvageable fallback starters where needed and preserves per-path equipment.
- Ranger families have ordinary reach/focus behavior choices. Behavior-to-stat conversion is available on legal Magic+ behavior slots for 400 gold; forward conversion remains Rare+. Locks and the paid persistent old/new choice remain intact. Armory comparisons show separate power, attack, ability and barrier multipliers, plus a separate level-30 preview.
- Enemy HP uses world time rather than player level; the director splits one workload across spawn cadence and population, bounded at 260. Existing day/night phases and main-boss schedule remain. Optional encounters freeze outside clocks while their own combat advances.
- Stable add reward slots and finite allowances block repeat reset rewards. Engaged encounters retain their roster and HP scaling across disconnect/reconnect; late arrivals wait. Damage-over-time ownership, same-owner overlapping fields, mitigation, self-healing, refunds and exceptional windows have shared limits.

## Source of truth

| Area | Files under `sites/veyrath` |
| --- | --- |
| Shared power, caps, action/resource ownership | `dist/core-rules.js`, `dist/combat.js`, `dist/weapons.js` |
| Run developments and UI | `dist/developments.js`, `dist/specializations.js`, `dist/level-cards.js`, `dist/skill-ui.js`, `dist/style.css` |
| Current class integration | `dist/mage.js`, `dist/mage-abilities.js`, `dist/blood-mage.js`, `dist/warrior.js`, `dist/ranger.js` |
| Ownership, encounters, world pressure | `dist/status-ownership.js`, `dist/encounter-rules.js`, `dist/survival.js`, `dist/combat-balance.js`, `dist/party.js`, `dist/pits.js`, `dist/world-events.js`, `dist/enemy-roles.js`, `dist/rewards.js` |
| Collection, previews and orchestration | `dist/affix-data.js`, `dist/front-end.js`, `dist/game.js`, `dist/boss-choices.js` |

Armory schema is version 6; source item rolls/IDs and pending paid candidates are retained. The browser keeps `veyrath-armory-before-core-v6` before migration. Migration validation failure surfaces a recoverable error instead of replacing the collection. Existing explicit Halberd removal remains separate from Ranger fallback. Hosting metadata and the pre-existing publishing-log edit were not changed.

## Action and output contracts

| Component | Timing / accounting |
| --- | --- |
| Warrior combo | Full family cycle; dual contacts share one action; ability cancellation after contact cannot bypass the next basic recovery |
| Mage projectiles / Orb | Cast weapon snapshot retained through travel; Orb pauses for incompatible casts; failed spell requests do not repeatedly cancel Orb pulses |
| Scepter | Due time persists independently of held-beam visual state; no accumulated inactive ticks |
| Ranger basics | Owner cadence and projectile history survive switching; one hawk, two player chakrams; shotgun five pellets with three contacts per target; shuriken fan has distinct-target accounting |
| Persistent fields / copies | Cast weapon snapshots retained on principal projectile/field paths; owner field-contact budgets; clone strike/copy/finale shares one theoretical 60% basic-output budget |
| Derived damage | Declared pre-defense payload applies destination resistance only; final payload does not reapply source power, critical, elite or reward multipliers |
| Resources / protection | Base 8 Rage/s and 10 Momentum/s, successful original-cycle credit, owner rolling rate limit; refund <=30% actually paid; non-stacking barriers; aggregate authored self-healing <=6% max HP/s |
| Exceptional stats | Ordinary speed 2.5, crit .60, mitigation .65; exceptional speed 3.5, crit .75 and mitigation .80 use recipient/category windows with recovery |

## Checks actually performed

1. `tests/core-redesign-batch1.mjs`: migration/idempotence, legal Ranger rolls and equip rejection, starter protection, power formulas, Normal/Endless effective-level caps, independent damage/support scopes, paid refund/barrier caps, actual Staff/Wand Fireball, derived-damage bases, beam restart cadence, and 20-second single-target resource simulations. Pass. Staff and Wand both dealt 276 in the equal-power test. Quality-5, ceiling-30 baseline power was 1.419. Tested Warrior families generated 7.74–8.21 Rage/s; tested Ranger families 9.38–10.45 Momentum/s.
2. `tests/core-redesign-batch2.mjs`: paid Magic reverse conversion, candidate reload/idempotence and lock rejection, development prerequisites, all 59 legal mappings, Ranger behavior eligibility and development levels 34/38. Pass.
3. `tests/core-redesign-batch3.mjs`: finite reward slots and retry identity, fixed engaged roster/HP, reconnect identity, late-join damage rejection including between-wave trial eligibility, independently owned statuses, field overlap budgets, source expiry, protection recovery, empowerment without recipient character scaling, and repeated settlement. Pass.
4. Syntax checks on 25 changed/new JavaScript modules. Local Electron boot, first spell selection and development UI checked; no panel overflow at 1500×950. Five-player mixed-class bot run with duplicate classes and 20 spawned enemies ran for 12 seconds with no console/runtime errors. Snapshot round-trip passed (about 41 KB full / 1.46 KB delta, 1.1 ms on this machine). The local hero was kept alive for this smoke check; this does not measure survival balance.
5. Existing `tests/net-audit-smoke.mjs`: real message handlers, authority, ordered inputs, duplicate rejection, pauses and teammate replay passed. Four-guest/260-enemy transport fixture passed (100 healthy snapshots, 0.83 ms maximum build time in this run). This is not a five-PC Steam test.
6. `tests/core-redesign-comparisons.mjs`: 39 deterministic 60-second moving-target scenarios at levels 1/15/30. Common items with matched level/quality and no bonus Build Insight, no crits or incoming attacks. Level-30 results below; raw results saved in `docs/validation/core-redesign-comparisons.json`. These are damage/output experiments, not completed boss fights or survival/clear-rate tests. Raw `estimated240kSeconds` is arithmetic against hypothetical 240k HP, not measured encounter duration.

| Level-30 route | Total DPS | Attack DPS | Ability DPS | Accepted casts / 60s | Ending resource |
| --- | ---: | ---: | ---: | ---: | ---: |
| pyro / Scepter / attack | 2107 | 1754.1 | 352.8 | 30 | 35.2 |
| pyro / Staff / ability | 1421.4 | 468.7 | 952.7 | 37 | 7.6 |
| pyro / Orb / ability | 1511.9 | 541.7 | 970.1 | 37 | 5.3 |
| pyro / Spellbook / ability | 1555.3 | 596.4 | 958.9 | 37 | 7 |
| blood / Orb / ability | 1064.5 | 286.8 | 777.7 | 21 | 1.4 |
| berserker / Greatsword / attack | 2083.9 | 1641.7 | 442.3 | 16 | 23 |
| spellblade / Greatsword / ability | 1830.6 | 477.9 | 1352.7 | 25 | 16.6 |
| spellblade / Throwing Axe / ability | 1867.1 | 569.6 | 1297.5 | 23 | 16.1 |
| alchemist / Short Bow / hybrid | 1955.5 | 600 | 1355.5 | 104 | 0.9 |
| alchemist / Crossbow / hybrid | 2089.2 | 637 | 1452.2 | 111 | 0.6 |
| alchemist / Falconer / hybrid | 2086 | 658.8 | 1427.2 | 109 | 1.4 |
| gunslinger / Shotgun / hybrid | 2757.4 | 585.6 | 2171.8 | 48 | 3.2 |
| ninja / Chakram / hybrid | 1413.8 | 840.5 | 573.3 | 80 | 7 |

The higher beam output and lower Blood Mage output require testing against actual movement, exposure, crowd clear and sustain. Gunslinger's higher output also remains an investigation priority. Alchemist's three tested weapons are within roughly 7% in this fixture, and the slow-weapon Spellblade routes remain funded. These findings justify functional progress, not a claim of equal or final balance.

## Tuning decisions and fixes made during validation

- Hawk primary coefficient 140 -> 90 and catch follow-up 1.5 -> .8: initial close single-target catch output was 479 DPS; revised output was 248.4 DPS in the same base fixture, while retaining catch value.
- Void Waves share a same-action target cap; return contribution is .55. Catalyst overlap shares an original-action target cap. Additional coverage no longer automatically multiplies one-boss damage by every overlapping shape.
- Resource accounting uses full successful-cycle credit and a three-second owner rolling cap. The first attempted partial-cycle scheme underfunded slow swings; the full-cycle model plus recovery protection produced the measured comparable income above.
- Overlapping rods/links share .25-second contact budgets; scorch/chemical field budgets use .5 seconds. Weaker barrier applications do not replace stronger protection or attach a new weak ward burst to the old barrier.
- World-time HP grows from 1.0 to 1.6 over 30 minutes (400 -> 640 for swarmers), independently of player level. This is a provisional pressure seed, not a measured final curve.
- Fixed failed Mage requests interrupting Orb repeatedly and Warrior casts clearing held attack input. Fixed frozen-world hurt-Rage accounting to use actor combat time. Fixed duplicate owned Warrior bleed ticking and persistent weapon/camp burn ownership.

## Limits and outstanding playtest acceptance

- A competent zero-Insight final-boss completion has **not** been demonstrated. The output fixtures omit enemy attacks, terrain and mandatory mechanics. Real boss duration, crowd clear, sustained defensive rotations and survival require playtesting.
- Retained useful upgrades, gold and XP per real/world minute, early-abandon farming, Modified-mode economy and long Endless runs have **not** been measured. Existing rewards/retention were preserved; no new extraction penalty was introduced.
- Normal/Endless formula and post-30 pick checks passed; exhaustive mode runs, maximum-roll clone/reset stress and every existing ability-node combination are not covered. Some authored temporary class bonuses still use their existing coefficient behavior; tuning and tooltip review should follow live feedback.
- Party ownership/transport and five-player local simulation passed; real Steam reconnects and coordinated defense on separate PCs remain untested. Trial success conditions retain their existing host-driven behavior; this batch protects roster/scaling/reward identity rather than redesigning each trial objective for independent per-player scoring.
- Healing, barrier and ally-empowerment foundations are present. Future healer/tank/buffer kits and Sovereign content were deliberately not implemented or tested.
- Local build remains on the existing fx-208 asset query convention. A future release should perform the repository's normal cache-version/publication process; no deployment or live-version claim is made here.

Next: play the local build through complete runs, starting with beam versus spell Pyromancer, zero-Insight Tyrant, Blood Mage sustain, Gunslinger burst, and real two/five-player pit sessions. Tune from those observations without silently changing the handoff's provisional values into approved final targets.
