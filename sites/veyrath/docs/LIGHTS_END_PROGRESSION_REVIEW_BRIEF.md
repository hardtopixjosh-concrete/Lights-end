# Light’s End — XP, pacing, economy and permanent progression review

Prepared October 18, 2026. This is a self-contained brief for an AI design review. Review and propose changes before implementation. Boss mechanics are excluded.

## 1. Your task

Review the game as a connected system: XP, leveling, build development, enemy pressure, optional activities, real playtime, loot, spending, retention, permanent upgrades and repeat attempts. Identify contradictions, exploitable combinations, missing rules and tradeoffs that will fail in practice. Explain how the systems should work together to deliver the intended experience.

Start by reconstructing the current rules from the supplied material. Separate verified behavior, creator decisions, proposals and unknowns. If repository access is available, inspect the implementation and cite relevant files. If only this document is available, provide a conditional design review and list the measurements you need; do not invent current prices, earnings or win rates.

Do not implement changes, redesign boss attacks or replace the game’s identity. Challenge ideas—including the rune proposal—when their consequences undermine the goals below. Give concrete alternatives and explain their costs.

## 2. The game and its intended experience

Light’s End is an isometric action roguelite with manual combat, escalating hordes, a large seamless desert battlefield, optional activities, a weapon collection and permanent gold. Players develop a distinct build during each run while improving their equipment, account and understanding across attempts. Solo and up-to-five-player co-op matter.

The intended experience is:

- Survive increasing pressure, make consequential choices and grow into a powerful build.
- Support basic-attack, ability and hybrid approaches within classes. A rapid-ticking beam Mage and an AoE spell Mage should both be meaningful routes.
- Give focused attacks, coverage, safety, control and sustain practical advantages without forcing identical output.
- Make weapons and their improvement relevant to the player’s actual playstyle.
- Make repeated attempts rewarding: players learn, collect and improve, then reach farther.
- Preserve uncertainty and experimentation after the account becomes stronger.
- Support future healer, tank and ally-buffer classes without requiring a particular party composition.

### Final victory is a difficult milestone

The creator does **not** want players routinely entering on a fresh account and defeating the final boss on their initial attempts. Learning the game and developing the account should materially help players reach and win the endgame. The creator’s latest instruction is that this should not be easy at all.

Defeating the final boss should award:

1. An achievement recognizing the victory.
2. A spell color card the player can use to customize spell colors.

These are confirmed reward intentions, not implemented features in this brief. The exact color, name, application rules and achievement platform are undecided. Treat the color card as a cosmetic reward unless the creator explicitly chooses a mechanical benefit. Do not conflate it with existing weapon-color runes.

The reward should communicate an earned accomplishment. Account growth must not automatically erase the difficulty by the time a player reaches it. Conversely, “difficult” does not establish a mandatory number of losses or authorize unfair statistical barriers.

Assess three distinct milestones: earliest plausible skilled victory, typical first victory, and reliable repeat victories. The creator floated **50+ runs to become strong enough for a relatively comfortable victory**, then emphasized that final victory should remain very difficult. Reconcile these intentions explicitly; do not silently adopt comfortable victory after 50 runs as a fixed requirement.

Ask whether exceptionally skilled fresh-account victories can remain possible, rather than inventing a hard account-level or attempt-count gate. This policy remains open.

## 3. What is already present, and what remains provisional

The weapon/combat redesign has been implemented locally. It is not proof that the game’s overall balance is solved and it has not been published as part of this work.

Current foundations reported by that implementation:

- Shared weapon power and quality support eligible attack damage, ability damage, healing and barriers, with separate effect scopes.
- Attack Focus, Coverage and Rhythm developments map to the equipped weapon family; ability trees and hybrid/support choices also exist. Run investment carries across legal weapon switches.
- Spell acquisition is at levels 1, 5, 10 and 15. Build development choices occur at 7, 11, 14 and 18, then every four levels, including after level 30. Other levels offer stat/utility choices. Optional rewards can add up to five Build Insights.
- Rage and Momentum use original-action resource accounting so pellets, multiple targets and secondary effects cannot each grant a full resource allowance. Slow weapons are intended to fund single-target spell rotations.
- Existing attack/projectile contact limits, output caps and ownership rules should constrain future upgrades too.
- Ordinary enemy HP now uses main-world time rather than the player’s level or equipment. One director workload influences spawn cadence and population, with a 260-enemy hard limit.
- Day is 0–12 minutes, Night 12–20, Blood Moon 20–24 and Dusk 24–30. The final encounter begins at the 30-minute world-clock transition. Optional pits and trials pause the outside world while their active combat proceeds. Menus/choices can extend real elapsed time.
- Permanent gold and stored weapons exist. The run bag has 12 slots; run-found weapon retention is the equipped weapon plus one safe-pocket weapon. Previously banked items are preserved. Do not assume every collected weapon survives an ordinary run ending.
- A fixed forge supports quality improvements, scoped affix operations and paid persistent old/new candidates. Reverse behavior-to-stat conversion now exists alongside the existing forward operation.
- Engaged encounter rosters and reward ledgers are intended to protect against late-join scaling abuse and repeat reset rewards.

Current paths: Warrior has Berserker, Vanguard, Spellblade and Warlord; Mage has Pyromancer, Cryomancer, Stormcaller and Blood Mage; Ranger has Archer, Ninja, Alchemist and Gunslinger.

Confirmed Ranger eligibility must remain intact:

| Path | Legal weapon families |
| --- | --- |
| Archer / Alchemist | Bow, Short Bow, Long Bow, Crossbow, Falconer’s Glove (“bird”) |
| Ninja | Shuriken, Kunai, Chakram |
| Gunslinger | Pistols, Shotgun |

Future healer/tank/buffer kits remain unimplemented. Existing cosmetic runes, unlocks and permanent shop features must be inventoried before proposing replacements.

### Evidence limits

Focused foundation, progression, encounter and networking fixtures passed, including all 59 legal current path/family combinations. Thirty-nine deterministic moving-target output experiments and a local five-player bot smoke check were performed. These did not establish complete-run survival, crowd-clearing parity, final-boss completion or long-term economy balance.

Actual gold/XP per real minute, useful retained upgrades, early-abandon farming, Modified-mode economy and long Endless progression were not measured. Prioritize those gaps. Do not use target-dummy output as a measured boss win rate.

## 4. Creator’s proposed permanent progression model

The creator prefers a bounded pre-run loadout over a conventional shop in which players eventually purchase every passive stat bonus.

### Weapons

Players gradually acquire and improve weapons between attempts. Review whether drop quality, ceilings, affixes, forging costs and retained equipment produce satisfying progress without flattening the opening minutes or invalidating future drops.

Weapon evolutions purchased through the main-menu shop are an idea to evaluate. “Evolution” has no settled definition. Compare an alternative behavior unlock, an unlock for an existing progression option, and a direct power upgrade. Explain conflicts with family identity, run developments and the existing restriction on wild Ascendant signatures. Do not assume a new ordinary evolution can provide any red-only signature.

### Rerolls and banishes

The creator is interested in shop purchases for reroll and banish charges. The purchasing model is undecided. A suggested option is permanent upgrades to the allowance refreshed each run; compare that with consumable purchases and other reasonable models.

Assess whether more control makes builds satisfying or merely guarantees the same optimal selection sequence. Consider new accounts, capped stats, prerequisites, exhausted pools, co-op pauses and the cost of trying an unfamiliar build.

### Up to three equipped gameplay runes

The creator proposed:

- Up to three runes equipped before a run.
- Rune slots purchased with in-game currency.
- Individual runes purchased with in-game currency.
- Rune levels purchased at increasing costs.
- Potentially five levels per rune.
- Example effects: “20 more spell range,” “20 melee attack range,” and “+1 projectile.”

The currency is assumed to be earned game gold for this review; real-money purchases were not requested. The range examples have no settled units or percentages. Do not rewrite “20” as “20%” without explaining and proposing that choice. Three slots is the proposed maximum, not three extra slots on top of an assumed free slot. Initial slot availability is undecided.

These are proposed gameplay runes. Existing cosmetic weapon runes have a different purpose; recommend naming/UI separation and migration compatibility.

Recommended rules to evaluate—not additional creator-approved requirements—include no duplicate equipped copies, free swapping between attempts, clear eligibility, explicit caps and gradual level growth that does not add another full projectile every level.

Review the combined cost of purchasing slots, purchasing runes and upgrading them. Three simultaneous cost ladders could create an excessive barrier before players can experiment. Compare alternatives while preserving the creator’s preference for meaningful earned progression.

## 5. Required review areas

| Area | Questions to answer |
| --- | --- |
| XP curve | At what real/world times do players reach each level? Where are the droughts or bursts? How much XP remains uncollected? |
| Build formation | When does each route become functional, distinctive and enjoyable? Are defining choices received early enough to use? |
| Choice quality | How often are all offers weak, capped, incompatible or prerequisite-blocked? How much does spending on choice control improve expected results? |
| Coverage versus focus | Does faster clearing generate a compounding XP/power lead? Do focused builds gain real safety, target removal, economy or other compensating value? |
| XP collection | Separate kill efficiency from collection efficiency. Compare melee, ranged, stationary/channeling and mobile builds. Is pickup range effectively compulsory? |
| Enemy pressure | Evaluate HP, population, spawn cadence, elite frequency and aging together. Identify pressure/recovery windows and runaway feedback. Do not counter-scale to a player’s gear or chosen build. |
| Optional activities | Does paused world time make extra progression effectively free or mandatory? Include travel, failure risk, actual combat time and opportunity cost. |
| Gold and spending | When can players afford useful forge/shop decisions? Is saving always best, or is one early purchase mandatory? What happens to poorer accounts after repeated short runs? |
| Drops and retention | Measure useful upgrade frequency and retained value, including illegal families, duplicate roles, conversion costs, bag/pocket decisions and overflow. |
| Failure/restarting | Does pushing farther earn more meaningful progress than repeatedly farming an easy opening? Can failure remain worthwhile without becoming the optimal strategy? |
| Strong retained equipment | Does a developed account skip the interesting early game? Does the normalization curve preserve growth during a run? |
| Co-op | Account for shared XP, extra spawns, personal rewards, collection, deaths, pauses, account-strength differences and valid reconnects. Can carrying accelerate permanent progression too much? |
| Modes and Endless | Can easier modes become the best permanent-reward farm? Do post-30 choices remain meaningful after common caps? What is the role of continuing after victory? |
| Actual playtime | Measure combat, collection, travel, forging, inventory and choices separately. A 30-minute world clock does not imply a 30-minute session. |
| Achievement/cosmetic reward | Define a trustworthy qualifying victory and fair co-op credit without changing boss mechanics. Address duplicates, reconnects, replayed rewards and cosmetic readability. |

Future support roles must fit this framework: access to XP and currency, solo progression expectations, useful shop/rune options and contribution credit cannot depend solely on last hits or personal damage.

## 6. Combinations and missing rules to stress-test

Analyze mechanisms and concrete sequences, not only isolated bonuses:

1. More coverage → more kills → more XP → earlier upgrades → still more coverage. Identify when this becomes an unavoidable snowball and when it is an intentional advantage.
2. Paused encounters → extra XP/gold/items → return to an unchanged world-pressure point. Compare doing none, some or all optional activities; test retries and waiting for recovery.
3. Fast opening rewards → retain currency/equipment → restart. Compare real earnings against deeper unsuccessful runs and complete runs.
4. Strong retained weapon + three upgraded runes + reroll/banish allowance. Determine the combined account advantage; do not balance each track independently and multiply unchecked advantages afterward.
5. Projectile count + piercing + returns + forks + status application + life steal/resource generation. Declare which parts scale, which share an action budget and which cannot recursively copy themselves.
6. Spell/melee range + area size + projectile range + terrain + targeting. Distinguish practical coverage, safety and travel time; nominal range is not equally valuable for every kit.
7. Extra projectiles across a single-shot weapon, shotgun, twin beams, chains, ground AoE, orbiting effects and future healing/protection abilities. Define unsupported cases and useful alternatives without multiplying complete ability payloads by accident.
8. Defense + barriers + self-healing + ally protection. Assess whether pressure disappears, whether close-range builds require mandatory defensive purchases, and whether sustain creates safe farming rooms.
9. Gold bonuses + easy modes + co-op kill volume + salvage + forge conversion. Check buy/sell/reforge loops, repeated rewards and whether the best income build sacrifices too little.
10. Rune eligibility + class/path switching + weapon swaps. Clarify when a loadout locks, what happens when an effect becomes ineligible, whether changes can grant free recovery and whether the player can preview the result.
11. Shared currency funding weapon upgrades, rune slots, rune levels and build-control charges. Could one permanent mistake delay progress for many attempts? Compare refund/respec policies and experimentation costs.
12. Final-victory reward + easier modes + co-op carries + already-dead players + late joins. Recommend qualification options and their tradeoffs; do not silently choose a policy. Clarify account-wide versus class/path-specific unlocks and whether the color card is reusable or consumed.

Also address stacking order, maximum rune level, duplicate effects, scaling costs, cap saturation, refund rules, ownership, save schema, idempotent unlock grants and compatibility with existing cosmetic runes. These are missing decisions to resolve before code changes.

## 7. Do the progression math

Do not choose prices from successful-run income alone. Model failure and increasing player competence.

Track representative fresh, developing and established accounts with focused, coverage, ability, hybrid and defensive routes. Include solo and current co-op; distinguish future-role projections from tested behavior. Use weak/typical/strong play assumptions and show sensitivity to those assumptions.

Required measurements or explicitly labeled estimates:

- XP earned and collected per real minute and world minute; level arrival times.
- Gold earned, spent and retained per real/world minute; source breakdown.
- Useful retained upgrades per attempt, with a definition of “useful.”
- Time to first meaningful purchase, successive slot unlocks and several viable rune loadouts.
- Expected time/cost to upgrade a rune and a weapon; compare vertical improvement with broader collection.
- How many runs end early, mid-run, late or in victory; rewards at each outcome.
- Menu/choice/travel time and optional-activity time outside the advancing world clock.
- First-victory and repeat-victory estimates, with player skill separated from account strength.

Basic accounting:

`expected retained gold per attempt = sum(outcome probability × retained gold for that outcome)`

`gold per real minute = total retained gold / total actual elapsed minutes`

`expected attempts to afford an upgrade ≈ remaining price / expected net savings per attempt`

The final approximation assumes stable earnings. Replace it with a changing progression model when upgrades alter survival, income or spending. Do not equate gold investment directly to win probability, and do not multiply every rune benefit as if it were universal damage.

For context, 50 attempts average 8h20m at 10 real minutes each, 16h40m at 20 minutes, and 25h at 30 minutes. Early failures and later longer runs change that average. Evaluate whether that time produces satisfying milestones before the final achievement. Fifty runs is a hypothesis to test, not a required grind or guaranteed victory date.

Provide at least a conservative and a faster progression scenario. Explain what evidence would change the recommendation. Show purchase/upgrade milestones and diminishing returns, rather than only a final total price.

## 8. Scope boundary

Boss attack patterns, phases, telegraphs, movement, hitboxes, weak points and new encounter mechanics are excluded. Leave them alone.

You may evaluate reaching the final encounter, account readiness, broad difficulty expectations, encounter participation/reward eligibility, final-victory recognition, rewards and time costs. Identify an unknown combat assumption when necessary rather than solving the economy by redesigning a boss. Any proposed global progression/durability change must be labeled and justified; it is not implementation authorization.

Preserve existing weapons, path restrictions, collection identity and the recent shared-power design unless evidence identifies a specific conflict. Do not add extraction penalties, forced losses, mandatory party roles or gear-based enemy counter-scaling as assumed solutions.

## 9. Deliver the review in this form

1. **Intended experience:** restate the game’s goals and difficult earned final victory, then identify the decisions still open.
2. **Current-system map:** explain how an attempt and the between-run loop work. Identify verified facts versus assumptions and stale documentation.
3. **Prioritized findings:** for each, give the concrete rule combination, player behavior it encourages, consequence, evidence/confidence, severity, and a practical fix with tradeoffs.
4. **Progression proposals:** compare the bounded rune model with reasonable alternatives; include weapons, possible evolutions, rerolls/banishes and the shared spending economy.
5. **Numerical scenarios:** show XP/pacing curves, purchase milestones, failure rewards, retained value and time-to-progression assumptions. Clearly mark provisional values.
6. **Reward specification options:** achievement and spell color card qualification, scope, persistence and co-op credit. Keep the aesthetic choice and unresolved policies open.
7. **Contradiction register:** call out earlier rules that would need replacement and any new proposal that conflicts with another goal.
8. **Validation plan:** a small set of high-value complete-run and economy checks, with clear pass/fail evidence. Avoid building an unnecessary analytics platform.
9. **Recommended design:** explain the whole loop in plain language from fresh account through repeated attempts to an earned final victory. List remaining creator decisions before implementation.

Do not simply approve every idea, force equal DPS across builds or claim perfect balance from formulas. Preserve the joy of becoming powerful and the significance of a difficult win.

## 10. Supporting material if available

Start with `GAME_REFERENCE.md` and its relevant `docs/reference/` segments. The index contains historical material; use the latest explicit creator decisions and current source to resolve conflicts.

- `docs/CORE_REDESIGN_IMPLEMENTATION_2026-10-18.md` — actual local implementation, measured output checks and limitations.
- `docs/LIGHTS_END_CODEX_IMPLEMENTATION_HANDOFF.md` — selected contracts for the preceding combat redesign.
- `docs/CORE_REDESIGN_DRAFT_2026-10-18.md` — earlier full review; distinguish its proposals from later adopted rules.
- `docs/validation/core-redesign-comparisons.json` — limited moving-target output experiments, not economy or complete-run evidence.
- Current source under `sites/veyrath/dist/`, particularly progression, rewards, weapons/forge, meta shop, world events, co-op and save-state code.

An earlier combat handoff requested a viable zero–Build Insight final route. The latest creator direction clarifies that a fresh account should not routinely win immediately. Distinguish **zero optional run Insight** from **zero permanent account development**. Whether that earlier viability criterion requires formal revision should be stated explicitly; do not silently reinterpret it as a guaranteed first-run win.

This brief records design intent and requests a review. It does not implement gameplay runes, shop evolutions, an achievement, a spell color card or a new economy curve.
