# VEYRATH weapon affix implementation plan

Recorded October14,2026. Status: **Core affix batch implemented after user adoption October14.** Detailed current behavior/checks in latest GAME_REFERENCE. Historical review/gap analysis below is retained for context; current scope is47behaviors/15stats, typed forge/saveversion5, new rarity ranges and1:1 scaling. Remaining example behaviors and named red signatures are future work.

Original source: `../VEYRATH_Weapon_Affix_System_V0_5_Quick_Reference.pdf`,3pages. Read original relevant pages before implementation. Page-labelled searchable convenience copy: `weapon-affix-design-transcript.txt`. All numbers and behavior pools are explicitly provisional in PDF p.3. Latest user supplied it as the intended weapon design; structural rules below guide future work, while numerical conflicts with earlier explicit decisions are flagged separately.

## Intended architecture and separation (p.1)

- Family defines LMB shape/speed/range/delivery only. Class and chosen specialization own RMB/Q/E/R/SPACE and progression.
- Ordinary affixes comprise stat affixes and family-eligible LMB behavior affixes. Behavior affixes count toward the ordinary slot total; they are not a second set of free slots.
- Ordinary attack damage/speed/range/crit/elite bonuses apply to basic attacks; they must not leak into active-skill damage, cooldowns, casting, geometry or replacement identity. Explicitly permitted health/movement/Mage Arcane Energy passives affect character resources, but do not replace or directly modify active-skill definitions. This reconciles passive stat examples with the slot-separation rule; exact passive bounds remain tuning work.
- A red Ascendant signature is separate from ordinary affix count and may modify class skills. Lower-tier ordinary LMB behaviors are allowed; the red-only rule governs exceptional signatures, not every pierce/echo mechanic.
- Arcane-colored, free Mage LMB patterns and staged Arcane Energy remain. Preserve class-only drops/equip/visible armory, per-five-level chosen-path points, forge landmark, persistent weapons/gold and no mastery XP.

## Rarity specification (p.1; adopted October14)

| Rarity | Proposed ordinary affix count | Maximum behavior affixes | Separate signature |
| --- | --- | --- | --- |
| Common / gray | 0–1 | 0 | No |
| Magic / blue | 1–2 | 1 | No |
| Rare / purple | 2–3 | 1 | No |
| Legendary / orange | 3–4 | 2 | No |
| Mythic / yellow | 4–5 | 2 | No |
| Ascendant / red | 5–6 | 2 | Yes, curated/exclusive |

Earlier explicit V0.8 annotation fixed0/1/2/3/4/5, currently implemented0/1/2/3/4 and no Ascendant. The new PDF shows ranges but calls all numbers provisional. **Resolved: user adopted new PDF October14; ranges implemented as playtest baseline.** Existing items must keep their stored affix count and rolls on migration; never fill extra slots for free or reroll automatically. Rarity probabilities and curated red signatures are not specified by this quick reference.

## Family map and current gaps (p.1)

| PDF family | Intended LMB | Current implementation / migration direction |
| --- | --- | --- |
| Twin Blades | Fast narrow cone | Existing paired half-damage strikes remain unless later changed; PDF does not explicitly remove two contacts. |
| Throwing Axe | Ranged piercing line | Current Battleaxe first-contact projectile must become a bounded piercing line; preserve existing family ID3/items. |
| Greatsword | Slow wide cone | Existing family1 baseline fits. |
| Longsword | Three-hit combo | Existing family0 baseline fits. |
| Halberd | Long narrow thrust | Current Spear/Polearm family4 is matching behavior; use stable-ID mapping/alias rather than destructive conversion. |
| Warhammer | Circular forward impact | Missing; append a Warrior/Swordsman family, do not reindex Mage families. |
| Wand | Rapid arcane bolts | Current family6. |
| Staff | Piercing projectile | Current family5. |
| Spellbook | Fan of projectiles | Current family9, five base shots per latest explicit chat. |
| Orb | Radial pulse | Current family8. |
| Scepter | Continuous beam | Current family10. |
| Grimoire | Seeking wisps | Current family7, two lightly homing shots per latest chat. |

PDF says Warrior; current class label is Swordsman. Treat as corresponding class for this plan; do not create an extra Warrior class solely from that wording. Existing historical item names can remain; display current family and behavior clearly. No exact new Warhammer timing/reach/impact coefficients or axe base pierce count are specified.

## Behavior pool inventory (p.2; examples, not fully defined mechanics)

| Family | Candidate IDs/names from PDF |
| --- | --- |
| Twin Blades | Extended Edge; Sweeping Flurry; Double Cut; Bloodletting; Momentum; Cross Slash |
| Throwing Axe | Twin Throw; Greater Pierce; Returning Blade; Ricochet; Heavy Flight; Long Flight |
| Greatsword | Long Reach; Wide Arc; Aftershock; Crushing Edge; Execution Sweep; Cleaving Momentum |
| Longsword | Extended Cut; Sweeping Third; Swift Recovery; Piercing Thrust; Echo Finisher; Precision Edge |
| Halberd | Extended Shaft; Broadhead; Penetrating Strike; Hooked Blade; Sweeping Return; Impaling Force |
| Warhammer | Expanded Impact; Tremor; Crushing Blow; Shattering Impact; Focused Impact; Fault Line |
| Wand | Split Shot; Double Impact; Seeking Bolts; Ricochet; Focused Barrage; Echo Shot |
| Staff | Greater Pierce; Expanding Bolt; Twin Lance; Arcane Push; Echo Lance; Lingering Charge |
| Spellbook | Additional Pages; Focused Pages; Scattered Pages; Second Volley; Piercing Pages; Returning Pages |
| Orb | Expanded Pulse; Double Pulse; Repulsion; Focused Pulse; Resonance; Arcane Ring |
| Scepter | Twin Beam; Beam Width; Extended Channel; Refraction; Resonant Beam; Penetrating Ray |
| Grimoire | Additional Wisp; Greater Seeking; Lingering Spirits; Spirit Split; Spectral Pierce; Convergent Spirits |

Names alone do not specify damage fractions, hit limits, proc behavior or exact timings. Define each implemented subset in data with explicit coefficients and limits; do not infer an approved full72-effect implementation from this inventory. Preserve remaining names as future candidates, clearly labelled.

Example stat pool (p.1): Basic Attack Damage, Attack Speed, Critical Chance, Critical Damage, Range, Damage to Elites/Bosses, Stagger, Health, Movement Speed, Gold from Elites; projectile speed/area for applicable families; maximum Arcane Energy/regen/recovery delay for Mage only. Resource/passive stat migration must not heal/refill players through equip toggles; clamp current values to new maxima and retain recovery clock. Exact coefficients/caps are not given.

## Modifier pipeline and safety (pp.2–3)

Data definitions: WeaponFamily, AffixDefinition, WeaponInstance, BasicAttack. Order: base -> shape -> projectile count -> travel/pierce -> hit -> secondary effects. Definitions carry stable ID, stat/behavior kind, class/family eligibility, weight/value model, incompatibilities and proc/hit limits. Instances retain saved rolls/quality/forge history/version/rarity visual/signature separately; runtime scaling never rewrites full saved rolls.

No duplicate IDs, opposing behaviors, or more than two behaviors. Respect tighter rarity caps. Explicit exclusions: Focused Pages vs Scattered Pages; Expanded Pulse vs Focused Pulse; Returning Blade/Axe vs Ricochet initially; mutually exclusive Longsword third-hit replacements. Secondary attacks cannot recursively generate more secondary attacks. Bound extra projectiles, echoes, returns, ricochets, same-target contacts, on-hit procs and VFX. All attack branches preserve terrain, visible-body projectile contacts and mutual forge shield.

Roll family/rarity/ceiling -> ordinary count -> eligible0–2 behavior affixes within rarity cap -> compatible stat fill -> values/exclusions validation -> red-only curated signature separately -> persistent unique instance. Class-only eligibility stays ahead of family roll. Pools need enough unique eligible definitions to fill requested count; exhaustion should produce a controlled valid result, never undefined affixes or infinite loops.

## Forge (p.2; prototype costs)

| Action | Base cost | Constraints |
| --- | --- | --- |
| Reforge stat | 100 | Eligible stat pool only |
| Reforge behavior | 250 | Compatible family pool and rarity/global cap |
| Convert stat to behavior | 400 | Rare+, open behavior capacity; ordinary slot count unchanged |
| Lock ordinary affix | 250 | Protect chosen saved affix |
| Quality +1 | 150 | Maximum+5; base damage only |
| Salvage | Rarity-based | Destroy item; no refund of previous forge spending |

Subsequent reforge cost: rounded base ×1.35^previous reforges. Count scope (shared/per-kind) and escalation on conversion are not explicit; settle/document implementation choice before charging. Reforging cannot raise rarity/ceiling/ordinary count or generate signatures. Signature reroll disabled initially. Current single reroll action must split into typed operations with atomic gold+item+history+save validation. Preserve favorite/equipped salvage confirmation and class final-weapon protections. Quality is base-damage-only; do not let it amplify behavior counts/resource stats.

## Scaling (pp.1/3; explicit conflict register)

PDF formula: effective level=min(character level, saved ceiling), returning to1 each run. Current runtime uses min(ceiling,1+floor((level-1)*.5)), based on earlier creator concern that1:1 recovers power too fast. **Resolved: latest user adoption replaces gradual formula; runtime now1:1.** Proposed percentage-affix normalization:40% full rolled value at level1 to100% at ceiling; this is explicitly a starting model, not fixed confirmed numbers. Ceiling1 edge case and flat-health/energy normalization need definitions. Base damage/numerical values scale, behavior identity (+2pierce/secondpulse etc) stays active from level1. Gold/appearance/affix and signature identity persist; no weapon XP.

## Current code audit / implementation batches

Current weapons.js has five rarities, fixed slots, six flat generic stat affixes and no behavior/signature schema. Damage/crit/elite currently flow through shared damageEnemy to both basic attacks and active spells; speed affix also affects active cast/Cleave, Earthshaker directly boosts Ground Slam. These paths violate the new stricter ordinary-affix slot boundary. Changing weapon patterns alone is insufficient: separate attack-source context and basic-only resolved stats from class skill stats. Existing saves have no per-affix type; migration must preserve old rolls, identify/retire incompatible active-only affix data transparently, and avoid silent rerolls or item loss. Decide treatment of legacy Earthshaker before destructive conversion; preserve original source roll metadata.

Recommended coherent batches under latest fast-progress workflow:
1. Weapon/affix definitions, basic-vs-active stat separation, versioned non-destructive migration, typed generator/validation, missing Warhammer/piercing axe, bounded representative behaviors for all families, tooltip scope. Resolve two numeric conflicts above before dependent tuning. One focused integration check and publish.
2. Typed forge reforges/conversion/locks with atomic transactions and history, expanded compatible stat/behavior pools, red rarity/signature data only when curated signatures are actually defined. Publish once for coherent batch, not per affix.
3. Tune against one boss, dense crowd and moving elite encounter only when those paths are ready; keep balance/proc caps under observation, without claiming benchmark parity in advance.

Verification for this review: extracted all3 original pages; rendered/visually inspected all3tables/formula; inspected current weapon definitions/stats/forge and shared damage/cast routing. Poppler emitted font fallback warnings, but tables/formula were legible. No gameplay tests, code modifications or production deployment in this documentation-only review. Next: resolve numeric differences and implement the selected coherent weapon batch when requested.


## Implemented batch status after adoption

New ranges/caps, weighted eligible generation and validation; schema5 preserves old instances/rolls/counts and maps legacy Earthshaker runtime bonus to LMB while retaining original metadata. Effective-level1:1 and proposed40%-to100% numeric-affix scaling implemented (ceiling1=100%); identities remain full strength at level1. Shared source-tagged damage separates basic-only affix stats from all active abilities. Explicit passive HP/movement/Mage Energy/gold stats work without swap healing/refilling. Warhammer appended11, Axe3 now pierces3 base, Halberd4 stable ID. All12families have bounded behavior choices,47definitions total;15newstat definitions plus legacy Earthshaker support. All listed coefficients are playtest defaults; not full72-name completion.

Typed single-affix stat/behavior reforge and Rare+ conversion, one-affix lock, quality/salvage use atomic transactions and forge history. Shared reforge/conversion escalation counter chosen; no rarity/ceiling/slot inflation. Product tooltips show scoped behavior/caps and current/full numeric roll. Red rarity available with separate null signature field; no curated signatures implemented or rolled. Signatures cannot be forged/rerolled. Future named signatures require actual definitions, not inference from color.

One focused integration smoke576generation cases plus combat/source-isolation/resource/persistence/forge edge paths passed; local class-filtered inventory preview showed new Rare Orb behavior/scaled stat and no captured errors. No broad/production duplicate check. See GAME_REFERENCE final log for explicit behavior coefficients, limits, migration and actual validation. Earlier review-only status and unresolved numeric discussions are historical; current adoption above governs.
