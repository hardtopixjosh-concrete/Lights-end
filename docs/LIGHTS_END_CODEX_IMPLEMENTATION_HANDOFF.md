# Light's End combat redesign implementation handoff

Date: October 18, 2026  
Recipient: Codex working in the existing game repository  
Purpose: implement the core redesign with the corrections from its critical review.  
Status: implementation instructions prepared at the creator's request. No game code was changed while preparing this handoff. Numerical values remain prototype inputs until tested.

## 1. Start here

Implement the existing game's combat and progression redesign in the batches below. The objective is that a valuable weapon strengthens the build its player actually uses, and that attack-focused, ability-focused and hybrid runs remain viable within each class.

Read this handoff, the repository's applicable instructions, current reference/decision files, and the affected source before editing. Inspect actual behavior; do not assume the source descriptions in the earlier draft still match the repository. Implement the work, validate the changed behavior and report results. Do not stop after producing another plan. Resolve ordinary implementation details using these rules and existing architecture. Escalate only a concrete conflict with a newer explicit player decision or a genuine access/technical blocker.

This is a targeted implementation order, not permission to replace the game's identity, rebuild unrelated UI, invent extra progression systems or publish a live release. Follow the repository's established release workflow and any separate release authorization.

The design source is `CORE_REDESIGN_DRAFT_2026-10-18.md`, sections 1–29. This handoff contains the operative requirements needed for the changes. Its explicit corrections supersede conflicting recommendations in that draft. Newer explicit creator decisions take precedence. Unrelated existing behavior remains unchanged. The draft's source-map paths are discovery hints, not proof that a file is still canonical; edit the actual source of truth rather than generated output when a build pipeline exists.

### Decision status

| Category | Treatment |
| --- | --- |
| Confirmed foundations in section 2 | Preserve them. |
| Concrete rules selected in sections 3–11 | Implement them; these resolve the review findings. |
| Numerical seeds and damage bands | Centralize in tuning data. Test and adjust with evidence; do not present them as balanced facts. |
| Future healer, tank and buffer | Support their contracts in the shared systems. Do not add incomplete classes now. |
| Full Sovereign encounter, its online handling and general menu protection redesign | Keep outside this change; preserve existing behavior and document the remaining decisions. |

## 2. Preserve the game's foundations

- Manual action combat, seamless desert, weapon-only equipment loot, persistent weapon instances and gold, run-reset character levels/cards/developments, fixed forge and up to five-player co-op.
- Weapons support attacks, abilities and relevant support output. An ability build is allowed to use LMB situationally; there is no universal attack/ability damage-share requirement.
- All five Warrior families remain available to all four Warrior paths. All six Mage families remain available to all four Mage paths. A family does not receive a hidden casting-power penalty.
- Melee may earn higher committed damage for its actual exposure and commitment. Ranged Warrior actions do not inherit that premium automatically.
- Existing class kits, recognizable weapon delivery, boss mechanics and approved tell timings remain, subject to the bounded output/resource changes below.
- Halberd remains deleted. Add no weapon mastery XP, armor/jewelry equipment system, extra crafting currency or mandatory party-role requirement.
- Exceptional weapon signatures remain red-only. Do not introduce ordinary affixes that replace an entire named ability or duplicate a red signature.
- Preserve the approved level-1 Longsword 100-damage baseline as the initial anchor. Measure its complete combo and recovery; do not assume its first-hit number proves full-cycle DPS.

### Ranger eligibility

| Path | Legal families | Fallback |
| --- | --- | --- |
| Archer | Bow, Short Bow, Long Bow, Crossbow, Falconer's Glove | Bow |
| Alchemist | Bow, Short Bow, Long Bow, Crossbow, Falconer's Glove | Bow |
| Ninja | Shuriken, Kunai, Chakram | Shuriken |
| Gunslinger | Pistols, Shotgun | Pistols |

Apply eligibility to lobby selection, remembered equipment, drops, merchant and boss offers, pickup/equip, forge comparison, host validation and save restoration. Store equipment preferences per Ranger path. Preserve displaced items and stable family indices. Grant an absent legal Common starter once per appropriate unlock/migration transaction; repeated unlocking, loading or salvaging must not generate free gold. Preserve existing broader collection exceptions only where explicitly authored.

## 3. One shared output model

Source draft: sections 5–7, 15, 24 and 27.

Use a shared, source-aware calculation for independently authored damage, healing and barriers:

```text
authored amount
  × character factor
  × weapon power factor
  × (1 + sum of applicable additive modifiers)
  × declared conditional groups
  × applicable target defenses or healing rules
```

Weapon Power is independent of the size, speed, projectile count or reach of a basic attack. The same ability uses the same authored coefficient with equally powered legal weapons before their relevant affixes. Remove or rebudget legacy Mage ×2 and absolute-output exceptions through the shared model; do not stack the new power formula on top of those old routes or globally double/halve all classes.

Damage, attack damage, ability damage and matching elemental damage add when applicable. A component is classified once: an LMB hit can be attack damage while an independent triggered burst is ability damage. It does not receive both classifications simply because it was triggered by an attack. Healing and barriers have their own modifiers and do not inherit damage bonuses. Cosmetic path colors do not change damage type.

### Progression seeds

```text
L = actual run character level
F = 0.40 + 0.60 × clamp((L - 1) / 29, 0, 1)

Normal effective weapon level E = min(L, saved ceiling, 30)
Character factor = 1 + 0.03 × (L - 1)
Weapon power factor = [1 + 0.01 × (E - 1)]
                    × [1 + (stored base roll - 1) × F]
                    × [1 + 0.02 × quality × F]
Numerical affix contribution = saved full roll × F
```

Normal's effective weapon-level cap is explicitly 30. This is not a new character-level cap. Preserve higher saved ceilings without rewriting the item. Rarity adds slots/behavior opportunities and red-signature eligibility, not another hidden universal multiplier. Apply normalization to numerical rolls once; preserve full saved rolls for future runs and previews.

For the first Endless prototype, use the same character formula as an explicit linear continuation, `E = min(L, saved ceiling)` and `F = 1` above level 30. Keep the same percentage-stat caps. Continue development opportunities at 34, 38, 42 and every four levels thereafter; offer existing useful stat/utility choices instead when the finite development catalog is exhausted. Other post-30 levels use ordinary eligible choices. Preserve the existing authored Endless encounter escalation initially and measure it against this continuation; do not claim these curves produce balanced Endless play. Modified mode uses its underlying run-mode progression and retains its no-extra-reward rule. Keep all mode-specific curves in explicit data rather than accidental extrapolation.

At level 30, ceiling 30 and quality +5 combine to 1.419 times the corresponding ceiling-1/quality-0 weapon power before base rolls and affixes. Evaluate complete items against fresh-run difficulty. Numerical normalization alone does not limit the early value of extra beams, piercing or signatures; author their low-level coefficients as well.

### Stat and cap seeds

| Stat | Initial boundary |
| --- | --- |
| Attack speed | 2.5× total ordinarily; up to 3.5× only in a declared burst state |
| Critical chance | 60% ordinary; 75% declared burst |
| Critical damage | 2.5× ordinary maximum |
| Cooldown reduction | 40% ordinary; 50% declared burst |
| Cost reduction | 40% |
| Aggregate cast refunds | At most 30% of the actual amount paid for that cast |
| Permanent numerical movement bonuses | +40% before declared mobility actions |
| Applicable percentage damage reduction | Combine through remaining damage; 65% sustained, up to 80% for bounded defensive bursts |

Do not treat these as validated values. Display capped excess and actual benefit. Attack speed changes eligible weapon cycles, including Scepter ticks, but not every DoT or ability channel. Ability recovery changes cooldowns, not Blood Drain tick frequency automatically. Direct attacks and damaging abilities may critically strike when tagged eligible; default DoTs, heals and barriers do not roll their own critical strikes. Reach, coverage and ability area have family/action-specific geometric bounds. Do not silently substitute radius for area.

## 4. Action timing and weapon switching

Source draft: sections 8–10 and 14. This section resolves the missing action-economy contract.

Each action profile must declare startup, contact windows, recovery, cancellation, movement restrictions, channel state and whether another action can overlap it. Reuse current timings initially, then measure. The full authored cycle—not the input request interval—defines its commitment and output budget.

Select these rules:

1. A committed cast/channel that occupies the character's attack action suspends new LMB contacts. Instant abilities retain their existing timing; do not invent a blanket extra animation delay.
2. Orb's base toggle is free. Its pulses pause during committed ability casts/channels that occupy the attack action, and resume on their normal schedule afterward. Pausing never banks missed pulses or emits a catch-up burst. Optional energy-consuming overcharge must be an explicit selected development.
3. Already launched projectiles, hawks, Chakrams and ground effects can finish their authored behavior. Their coefficients are budgeted with that overlap in mind. Launching them does not erase the owner's attack recovery.
4. Recovery/reload time can elapse during another legal action, but it remains a real timer. Switching, casting, cancelling, input retriggering or re-equipping cannot reset it early. Measure resulting overlap instead of pretending it costs a full extra interval.
5. A weapon swap preserves the character's next attack-ready time. If an active committed action prevents switching, queue the swap until its permitted transition. Do not add a separate arbitrary swap penalty when existing recovery suffices.
6. Old effects retain their originating weapon/action profile and ownership. They neither inherit the newly equipped weapon's affixes nor gain a second grant of the old weapon's modifiers. Active hawk/blade limits remain owner-wide across swaps.
7. Switching cannot restart attack sequences at their finisher/fan bonus, reset proc counters for advantage, or refresh abilities. Preserve earned progress or reset to the sequence start consistently; never grant an unearned advanced contact.
8. Temporary run attack developments map to the new legal family. They remain selected, provide no refund/reroll and cannot bypass existing family limits.

Maintain an action-overlap table for the current kits in the repository documentation. This is required to compare total rotations meaningfully.

## 5. Resources and proc accounting

Source draft: sections 7–9, 13 and 17.

Keep the resources distinct. Warrior and Ranger ability builds still need successful attacking to fund their rotation. Mage baseline regeneration does not require attacks or kills.

| Resource | Starting prototype | Rule |
| --- | --- | --- |
| Rage | 100 pool; about 8 per second of successful basic attacking | Full action cycle determines credit; limited actual-HP-loss contribution; out-of-combat decay |
| Momentum | 100 pool; about 10 per second of successful basic attacking | Full action cycle determines credit; no normal generation from clones/copies; out-of-combat decay |
| Arcane Energy | 100 pool; current 6/10/15-per-second stages initially | Independent regeneration during active gameplay, including movement and free basics |

Apply an initial +50% ordinary ceiling to the combined increase in basic-attack resource generation from speed and resource-generation bonuses for both Warrior and Ranger. This is a tuning decision extending the draft's Warrior speed-only seed; keep the cap separately configurable. Supplemental hurt-based generation is a separate capped stream, not a way to ignore the basic-generation cap.

Use a per-owner, per-original-action ledger. Equivalent architecture is fine if it enforces these invariants:

- A full basic cycle receives one resource allowance. Twin Blade contacts, pellets, fans, pierce, hawk passes/catch and Chakram passes divide or consume that allowance; each target does not receive a new full allowance.
- Give credit only for eligible successful hostile contacts. Misses, invulnerable/no-damage contacts, scenery, corpses and decorative objects do not fund the standard rotation. Boss armor/objectives can explicitly qualify where the fight requires it.
- Tie allowances to the complete effective cycle, including speed and recovery, and enforce the owner rate ceiling across swaps. Channels use bounded active-time windows. Hawk budgets use actual full-trip behavior rather than its request interval. No resource-credit bank accumulates during menus, idle time or a paused world.
- Slow attacks may deliver chunkier grants, but cannot repeatedly front-load a full slow-cycle allowance without paying the corresponding cycle time. Partial contacts earn their declared share rather than redistributing all missing-contact credit automatically.
- Resolve critical rolls, status application credit, secondary procs and resources as separate declared budgets. Giving one hit resource eligibility does not give it every other eligibility.
- Free casts pay zero and refund zero. Copies/refunds reference the original cast payment record; all refund sources together obey its limit. Flat resource grants are explicit generation streams, not disguised refunds.
- Self-inflicted damage, blocked damage and invulnerable contacts do not grant hurt-based Rage. Award eligible hurt gain from actual qualifying HP lost, within its time cap. A healer-supported Warrior still must not gain more sustainable benefit by deliberately soaking damage than through the intended rotation.

At the proposed limits, a cost can fall to `0.60 × 0.70 = 0.42` of base. Generation at 1.5× can therefore support about 3.57× as much base-cost spending before cooldown/action restrictions. Use this arithmetic when choosing costs; do not describe the combination as an infinite loop or assume the separate caps make it harmless.

For each representative rotation, record net spending per second, effective cast intervals, attack uptime needed to fund it, casting time and actual movement loss. Attack uptime plus incompatible casting time must fit the available combat time. Tune costs, coefficients or generation bonuses to deliver the advertised route; do not force every class onto the same resource model.

## 6. Damage derivation, contact and reaction rules

Source draft: sections 5, 8, 12–14 and 17.

Every event needs stable owner, original action/cast identity, component classification, generation depth, target identity and its applicable allowances. Projectiles from one action retain its lineage. Multiple body hitboxes remain one gameplay target.

### Damage basis

Use explicit profiles instead of sending every secondary effect through the full direct-output pipeline:

| Basis | Calculation rule |
| --- | --- |
| Independently authored component | Apply its own eligible source modifiers once, then its target defense once. |
| Fraction of source pre-defense damage | Inherit the declared fraction and source modifiers; do not multiply them again. Apply the destination target's defense once. State whether the parent's critical result is inherited. |
| Fraction of final damage actually dealt | Use that final amount directly for the specified payoff, such as life steal. Do not apply the parent's power/crit/damage bonuses again. If the payoff is another damaging hit with its own defense treatment, name that explicitly; never infer it from a generic helper. |

For a DoT that is not intended to inherit a critical hit, derive its potency from the noncritical source value. A DoT with explicitly inherited critical potency still does not roll criticals on its ticks. Store snapshot rules and make tooltip wording match the chosen basis. Refreshing duration does not reset the tick phase to create extra immediate ticks.

### Same-target and reaction limits

- A melee window hits a target once unless the family explicitly authors multiple contacts; Twin Blades split their cycle between two contacts.
- Piercing hits a target once outbound. An authored return can hit it once again at its allocated coefficient.
- Shotgun retains five pellets and at most three same-target contacts per blast. Spellbook allows at most two page contacts per target per volley in this prototype. Extra coverage does not increase those caps.
- Grimoire wisps share one attack budget. Shuriken fan contacts share the original action's budgets. Chains/forks use distinct targets and cannot bounce among one boss's hitboxes.
- Scepter Twin Beam begins from the 65% + 65% comparison: at most 130% total on one target if both connect. Forks cannot reconverge to add extra boss damage. Tune total damage and width together.
- One player hawk and two player Chakrams are hard owner-wide limits, including outstanding effects after switching. Ninja visual copies are separately budgeted secondary effects, not additional full player weapons.
- Same-owner pools from the same ability share its authored per-target tick allowance. Rod/link intersections also share the owner's declared field budget. Separate players retain their own legitimately funded damage; do not collapse all co-op damage to one player's cap.
- Echoes and secondary reactions cannot recursively create more full-strength copies/reactions or normal resource grants. Keep any deliberately authored multi-step chain finite through explicit depth and trigger limits.
- Read the target's pre-hit ignition state before Fireball applies its own ignition. Fireball always explodes; spread/bounce requires a qualifying previously lit contact or carried ignition from an earlier qualifying contact, as already decided. Carry state belongs to the projectile/action and is not manufactured by its own first ignition.
- A cross-player status may satisfy a reaction condition only where declared. It does not automatically donate all its stored damage. Consuming/cashing out a status is atomic and keyed to that actual status instance; it pays out once. Decide separately whether the original DoT is consumed, continues, or supplies only a condition.
- Stacks, potency, duration, tick scheduling and beneficiaries are source-aware. Another player's weaker status does not overwrite unrelated damage or borrow their stats.

## 7. Buffs, protection and co-op contracts

Source draft: sections 7, 11–13, 16–18 and 23.

### Buff composition and duration

Separate ordinary self/item damage modifiers from outgoing ally empowerment. Ordinary applicable damage modifiers remain additive. Ally empowerment is one explicit conditional group: the strongest eligible active contribution in that group multiplies the recipient's otherwise resolved eligible output once. Thus a true +40% empowerment increases eligible output by 40%, even if the recipient already has additive damage cards. Shared vulnerability is a separate capped additive damage-taken group, not multiple multiplying Marks/Exposed sources.

For future empowerment, start from `base granted bonus × weapon power factor × (1 + eligible buff-strength modifiers)`, capped by the effect's ordinary/burst budget. Do not multiply the recipient's whole damage by buff strength again, and do not also feed empowerment through the ordinary direct-damage character factor. A base +30% bonus with +20% buff strength at neutral weapon power grants +36%. Exact potency, target count and duration are content tuning parameters. Migrate current buffs according to their declared purpose; this is not a blanket multiplication buff for every existing damage modifier.

Track each source's magnitude and expiration independently. Select the strongest currently valid contribution; a weaker application cannot refresh a stronger source's duration. Expiration, disconnection or equipment change follows the originating effect's declared lifetime. Buff strength cannot recursively amplify another buffer's buff strength. Haste, empowerment, vulnerability and protection retain separate rules and a measured combined output budget.

Mark each effect as sustained or burst. Check durations against minimum attainable cooldowns, reset rules and extension rules. Burst effects cannot refresh or extend their own active window unless explicitly budgeted. If a state can be sustained, it must use the ordinary cap and sustained coefficients. For cross-player effects that exceed an ordinary cap, maintain the authored burst window and recovery on the recipient/category as well as the source so alternating casters cannot keep the exceptional cap active indefinitely. Reuse existing recovery mechanisms; expose the resulting availability to players. Do not add blanket lockouts to unrelated abilities.

Boss hard-control recovery is target-wide. Different players or abilities cannot bypass it. Convert hard freeze/stun into the declared bounded chill/stagger result where appropriate. Define explicitly whether that result satisfies frozen/controlled-target conditions so Cryomancer and similar routes retain a boss answer.

### Protection and healing

Resolve incoming damage through applicable bounded mitigation, then the recipient's flat barrier, then HP. Apply each layer once. Self-inflicted/resource costs follow their separate explicit rules and do not generate hostile-damage procs.

The default flat-barrier category has one effective pool per recipient: a new grant replaces the remaining pool only when its amount is greater, with the new source's duration; otherwise it does not add capacity or refresh the winner. Recasting can restore a depleted pool when the new grant is stronger than what remains. Distinct barrier categories require an explicit existing mechanic and a combined-budget check, not an accidental per-caster stack. Show rejected/capped protection accurately.

Healing caps apply to combined self-sustain streams per owner and time, as well as any per-action limit. Preserve independently funded ally heals while evaluating their combined team effect. At 65% mitigation, healing/barriers can offset about 2.86× their value in pre-mitigation damage; at 80%, about 5×. Tune the complete defensive rotation rather than declaring it safe because each individual number has a cap.

Future roles remain contracts, not new playable classes in these batches:

- Healer: useful focused healing and optional divided group coverage, functional solo offense/self-target rules, allocation among eligible injured targets, effective-healing measurement rather than overhealing totals.
- Tank: timed protection compatible with cycling boss targets, enough solo offense, bounded retaliation and crowd control. No automatic permanent boss aggro or redirected locked telegraphs.
- Buffer: make an ally exceptionally strong within a funded window; distinguish focused and group budgets, preserve weaker documented self-target support and an offensive solo route. Compare duos to duos and five-player parties to five-player parties, including damage timing and enabled uptime.

### Encounter membership and rewards

Snapshot the eligible encounter roster and player-count scaling at engagement. Roster members who reconnect retain the same identity and eligibility. New arrivals wait outside the active isolated/boss encounter until it resolves; they do not damage, heal, buff, draw attacks or collect that encounter's rewards. Do not shrink the encounter's difficulty when someone disconnects. This default closes solo-pull/five-player-kill scaling without resizing an ongoing health bar.

Preserve shared XP awarded once, separate player choices and personal loot/gold. Reward eligible supporters regardless of personal damage or last hit. Everyone down ends the ordinary run; existing proximity revival remains. Preserve the shared pause for level-up choices and the current 20-second auto-pick countdown after one participant finishes. Keep existing forge/menu protection until its separate redesign is resolved.

## 8. Builds, ordinary loot and the forge

Source draft: sections 10, 15, 21–22 and 24.

Retain ability choices at 1, 5 and 10, then R at 15 after the other three. Retain developments at 7, 11, 14, 18, 22, 26 and 30. Other levels offer ordinary stat/utility cards. Opening pacing seeds remain a second ability near minutes 2–3, three near 5–6 and R near 9–12; calibrate XP instead of claiming these timings already occur.

Expand development selection to Attack, Abilities, Resource/Hybrid and Defense/Support. Keep deliberate eligible-node selection. Start with six attack nodes: first and second tiers in focused output, coverage, and rhythm/resource branches. Tier two requires its own tier one. Author each family's expression and switching mapping using its existing delivery; do not ship blank nodes, generic promises or compulsory rare-affix dependencies. Retain four existing nodes per ability as the starting inventory and rebudget them under the new contact rules. Numeric filler can move to ordinary cards.

Rename boss Spell Insight to Build Insight. Retain the proposed maximum of five extra development choices and the existing gold/blessing/survival alternatives initially. Tune the power gap rather than assuming twelve choices versus seven is harmless.

Ordinary card seeds are +4% all damage, +8% attack damage or +8% ability damage in the same applicable additive group. Keep rarity variants, reroll/banish helpers and Heal Instead. Offer usable choices for the actual path, owned abilities and build. Evaluate permanent eligibility/caps without allowing a temporary buff to incorrectly remove a useful long-term card.

Keep the rarity structure:

| Rarity | Ordinary slots | Maximum ordinary behaviors |
| --- | --- | --- |
| Common | 0–1 | 0 |
| Magic | 1–2 | 1 |
| Rare | 2–3 | 1 |
| Legendary | 3–4 | 2 |
| Mythic | 4–5 | 2 |
| Ascendant | 5–6 | 2, plus a separate authored red signature |

Behaviors consume ordinary slots. Preserve actual saved counts; do not fill newly available slots automatically. Provide real useful ordinary behavior pools for all ten Ranger families, respecting their limits. Broad stat eligibility can support attacks or casting on any legal family; exclude wholly unusable stats and describe path-dependent usefulness accurately.

Add the reverse operation to the existing conversion system: an ordinary behavior slot can become an eligible ordinary stat slot on any item that legally contains that behavior, including Magic. Keep the existing Rare+ requirement for stat-to-behavior conversion. This makes an LMB-heavy drop salvageable for an ability/support build without adding ordinary red-like transformations. Use the existing conversion price, initially 400 gold, as a tuning seed; preview eligibility, cost and resulting slot type, respect the lock and preserve the paid old/new candidate workflow. It cannot alter rarity, ceiling, total slots or signature.

Preserve typed reforging, one ordinary lock, quality to +5, salvage protections, reduced away-from-forge salvage payout and existing flat reforge prices. Initial stat/behavior prices remain Common 50/none, Magic 75/150, Rare 100/200, Legendary 150/300, Mythic 200/400 and Ascendant 300/600; lock 250. Keep quality's existing separate price curve until broader value is measured. Paid candidates survive reloads without rerolls or refunds.

Inspect items at the same current level; offer full-power preview separately. Show shared power plus separate attack, ability and applicable support summaries, resolved behavior caps and actual numerical gain. Avoid a single universal DPS arrow. Scope tooltips to components that really benefit.

## 9. World progression, encounters and economy

Source draft: sections 18–23 and 26.

Ordinary enemy durability/pressure uses main-world time and authored encounter tier, replacing player-level-based spawn HP. Do not inspect equipment, selected cards or party class composition to counter-scale enemies. Preserve readable attack commitments, legal movement corridors, off-camera spawns and bounded aging/enrage.

Replace stacked population/rate multipliers with one documented director workload. Preserve the current 260 hard population limit initially; it is a performance ceiling, not a desired encounter size. At capacity, use bounded authored threat selection rather than accumulating spawn debt. Account for ordinary HP and population together.

Keep Day 0–12, Night 12–20, Blood Moon 20–24 and Dusk 24–30. Ravager, Wyrm, Butcher and Prophet remain optional pits; no restored timed Butcher/Prophet arrivals. Colossus remains at 22:30 and Tyrant at the 30-minute transition. Keep approved boss kits/tells, reachable melee openings and locked target telegraphs. Strong builds can shorten fights; do not add universal phase-health gates as a shortcut.

Pits/trials continue to pause outside simulation and the main-world clock. Inside combat advances its own actions, cooldowns, resources, healing and buff durations. Card choice freezes gameplay timers. Network/UI countdowns use real time. Returning produces no catch-up spawn or damage burst.

Prevent retry farming with a reward ledger keyed to encounter incarnation and stable enemy/reward identity. Failed resets cannot issue repeat XP, gold, drops or death-reward procs from the same reward-bearing add slots. A legitimate boss respawn after its main-world-time respawn rule begins a new incarnation. Summoned waves have a finite authored reward allowance; changing spawn IDs does not bypass it. Boss objectives may still provide the limited combat resources the encounter needs. Menu toggles, reconnects and entry/reward transitions do not advance combat time; an empty encounter or reward screen cannot be used as a free paused-world regeneration room.

Tune a competent, appropriately equipped zero-Build-Insight build to have a viable final-boss route. Optional boss rewards then provide useful extra power. Do not require one rare affix, a Pit Soul or a particular support composition to answer a mandatory mechanic. Preserve movement/dodge answers to precision trials and usable priority targets for focused builds.

Boss duration seeds are 60–120 seconds for ordinary pits and 2–4 minutes for the final fight at the intended stage. Boss HP scaling begins at `1 + 0.6 × additional eligible players`. With equal per-player output this implies about 0.68× solo duration at five players, before coordination; evaluate its farming advantage deliberately. If output measurements already include downtime, do not discount uptime again when estimating boss HP.

Keep personal weapon eligibility filtering and current drop inputs initially: ordinary enemy chance around 0.15%, elite leaders 5%; generic rarity weights Common 55%, Magic 30%, Rare 13.75%, Legendary 1%, Mythic 0.25%, no red. Final reward remains Mythic with the existing provisional 33% red chance; do not silently guarantee red. Preserve broader named-item exceptions only where explicitly authored. The planned Sovereign named-red pool is not implemented by this handoff.

Retain the 12-slot run bag, equipped weapon plus one safe-pocket retention, safe previously banked items, permanent gold and existing armory overflow flow. Death, restart, abandon and victory settle through one idempotent transaction. Realm-defeat return is separate. Preserve path unlocks, helper charges, movement upgrades and cosmetic runes.

Measure retained useful upgrades, gold and XP per player per real elapsed minute, as well as per main-world minute. Include early-abandon farming, extra co-op spawns and easier Modified runs. Retention itself is intentional; do not add extraction penalties to fix an economy curve. Adjust reward cadence/value only when a measured loop warrants it.

## 10. Required class and family checks

Source draft: sections 11–14, 25–26. These specify what to inspect and validate, not permission to replace kits.

| Path | Retain kit | Required interaction check |
| --- | --- | --- |
| Berserker | Savage Rush, Bloodletting, Carnage, Unchained Wrath | Combined life steal, hurt Rage, blood stacks and Wrath uptime, including ally healing |
| Vanguard | Sundering Cleave, Perfect Guard, Seismic Stomp, Bastion Dome | Guard/counter resource eligibility; combined mitigation; global boss-control recovery |
| Spellblade | Void Waves, Void Barrier, Dark Matter, Void Ascension | Returning contacts, independent burst classification, barrier refunds and chain depth |
| Warlord | Brutal Charge, War Cry, Earthquake, Bladestorm | Pull/stagger alternation, storm tick budgets and casting/LMB overlap |
| Pyromancer | Fireball, Flame Ward, Flame Surge, Meteor | Pre-hit ignition; damage basis for burns/detonations; beam and AoE routes both viable |
| Cryomancer | Ice Road, Frost Nova, Glacial Burst, Blizzard | Boss-compatible controlled-target conditions and target-wide control recovery |
| Stormcaller | Chain Lightning, Static Guard, Storm Rod, Tempest | Rod/link intersections share a field budget; overcharge remains bounded |
| Blood Mage | Sanguine Drain, Crimson Veil, Crimson Bloom, Blood Eclipse | Drain channel rules and combined sustain with Orb, mitigation and ally protection |
| Archer | Power Shot, Arrow Type, Volley, Hunter's Focus | Arrow Type works on all five legal families; hawk Focus changes travel/recovery within its single-hawk limit |
| Ninja | Cyclone, Smoke Bomb, Shuriken Throw, Shadow Assault | Thrown-family identity; Exposed scope; a starting 60% owner-basic-output budget shared across all clone components, no duplicate source scaling |
| Alchemist | Catalyst Flask, Reactive Flask, Volatile Mixture, Grand Experiment | Explicit poison consumption/condition rules; funded single-boss rotations on slow weapons and hawk |
| Gunslinger | Fan the Hammer, Quickstep, Piercing Line, Bullet Barrage | One blast cannot create repeated full resets/copies; invulnerability and marking groups stay bounded |

Ninja's 60% copy seed is a theoretical eligible primary attack-output budget under the current profile, not 60% of a recursive recent-damage meter. Split it among clone strikes/copies/final explosions; changing clone count changes distribution rather than multiplying the budget. Declare snapshots versus dynamic updates and apply source modifiers once.

Use Longsword full-cycle stationary output as 100 only for initial family comparisons. These bands are hypotheses; do not force equal realized DPS or multiply family bands into active abilities.

| Family | Initial normalized single-target band | Preserve and test |
| --- | --- | --- |
| Longsword | 100 | Full real combo before finisher; wider arcs do not duplicate hits |
| Greatsword | 95–105 | Heavy cleave and stagger versus actual punish-window commitment |
| Twin Blades | 100–110 | Short reach, paired contacts with split allowances |
| Throwing Axe | 80–90 | Medium-range piercing; reduced melee premium; funded Spellblade rotation |
| Warhammer | 95–105 | Close radial impact; aftershock included in damage budget; legal leap collision |
| Staff | 70–80 | Piercing line; useful real multi-target opportunities and a focused first-target route |
| Wand | 80–90 | Responsive focused shots; speed does not multiply full status/proc grants |
| Grimoire | 70–80 | Two seeking wisps share output; reliable contact and casting overlap count as value |
| Orb | 90–100 | Close radial exposure; free base pulses pause during incompatible casts |
| Spellbook | 75–85 | Two-contact maximum; verify reach/mobility/burst value relative to Orb |
| Scepter | 85–95 | Aim/channel commitment; speed/Twin Beam/forks share resolved budgets |
| Bow | 80–90 | Useful flexible middle ground between Short and Long Bow |
| Short Bow | 85–95 | Shorter effective range must cause meaningful exposure |
| Long Bow | 75–85 | Draw commitment and meaningful range advantage, including confined pits |
| Crossbow | 70–80 | Heavy piercing, honest reload overlap and normalized resource credit |
| Falconer's Glove | 80–90 before catch payoff; 110–125 with consistent catches | Full trips, meaningful catch difficulty, single hawk and no short-trip credit exploit |
| Shuriken | 80–90 | Periodic distinct-target fan; sequence and proc allowances survive switching |
| Kunai | 75–85 | Narrow piercing lane with a useful role relative to Shuriken/Chakram |
| Chakram | 75–85 across both passes | Two player blades, one contact per target per pass, moving-boss return reliability |
| Pistols | 75–85 | Alternating nearest-target reliability; required priority mechanics remain answerable |
| Shotgun | 100–110 with three pellets connecting | Five base pellets, cap three per target, close exposure and spread tradeoff visible |

A low-output family does not automatically need a buff: range, reliability, control and clear speed can justify its band. Conversely, do not retain a discount for an advantage that rarely works in actual encounters. Coverage's suggested 80–90% of focused boss output is an alert hypothesis, not a guaranteed ratio; its XP, safety and reward advantages also count.

## 11. Implementation order and acceptance

### Batch 1 shared foundation and safe migration

Implement shared output/power and truthful scopes, action timing/Orb behavior, source lineage, resource ledgers, same-target rules, Ranger eligibility and deterministic save migration. Adapt current abilities to these contracts without adding new kits. Keep a compatibility path only where needed to migrate a saved item, not as a second hidden damage formula.

Acceptance: a weapon power/quality increase changes the eligible attack and ability at equal character level; healing/barriers follow their own profiles. Legacy modifiers are not applied twice. A legal slow weapon funds its authored rotation at comparable successful uptime. Existing item IDs and balances survive migration and repeat loading.

### Batch 2 build choices and collection usefulness

Implement six mapped attack-development nodes per family, rebudget existing ability nodes, Build Insight, usable card offers, complete Ranger ordinary behavior pools, behavior-to-stat conversion and honest previews. Use existing visual language and assets; new effects require readable geometry and a performance budget.

Acceptance: attack, ability and hybrid investment each has a functioning route without a mandatory rare affix. Legal switching preserves run investment without a free reset. A caster can convert an unwanted ordinary behavior without losing item identity or changing rarity/slot count. Paid forge choices cannot be rerolled through reload.

### Batch 3 encounter and co-op integration

Implement world-time enemy scaling, director workload normalization, pit reward/clock ledgers, encounter roster rules, buff/protection groups and recovery, bounded status reactions and current-class party validation. Verify the explicit post-30 continuation and modes. Keep future-role implementation and Sovereign work separate.

Acceptance: optional encounters provide rewards without reset farming; a zero-Insight build can complete required content with competent play. Co-op cannot bypass scaling through late join or duplicate damage through ownership mistakes. Support eligibility, personal rewards, level-up pauses and reconnect identity remain correct.

### Focused validation

Run one focused integration fixture per batch covering its changed contracts, plus a brief relevant visual/play check. Broaden only to resolve an actual remaining risk. Static checks alone do not establish balance. Use existing test infrastructure; avoid building a new analytics platform for this work.

| Check | Pass condition |
| --- | --- |
| Equal-power ability | Same Fireball coefficient with Wand/Staff before differing relevant affixes; quality improves both eligible attack and spell |
| Damage derivation | A derived effect follows its declared pre-/post-defense basis and critical inheritance exactly once |
| Contact accounting | Shotgun pellets, Twin contacts, pierce and long boss hitboxes cannot exceed action resource/proc limits |
| Orb/action overlap | Pulses stop during incompatible casts and resume without stored ticks; existing projectiles do not erase recovery |
| Swap stress | Rapid re-equip/cancel cannot accelerate cycles, reset counters or exceed owner hawk/blade limits |
| Sustained resources | Representative Rage/Momentum rotations balance on one boss; crowd size does not create an unlimited resource engine |
| Buff/control duration | Weak sources cannot extend stronger ones; coordinated sources cannot bypass declared exceptional-window recovery |
| Reactions | Fireball needs qualifying prior ignition; one consumed status instance cannot pay out to multiple concurrent detonations |
| Pit reset/clock | Reset adds do not repeat rewards; menus/transition screens cannot recharge through frozen gameplay time |
| Party roster | Late arrivals cannot influence/reward a solo-scaled active encounter; valid reconnects retain identity |
| Persistence | Migration, forge resolution and every settlement route are idempotent; no item/gold duplication or silent deletion |
| UI/visuals | Actual scopes/caps match previews; existing models, hit origins, palettes and boss tells remain readable |

Prioritize these play comparisons at matched level, item investment and encounter stage:

1. Beam Pyromancer versus ability-heavy Pyromancer, including early/mid/late run and a moving boss.
2. Orb versus Spellbook in a casting build; then Blood Mage sustain with Orb and mitigation.
3. Attack-heavy Warrior versus ability-heavy Spellblade using a slow melee family and Throwing Axe.
4. Alchemist using Short Bow, Crossbow and hawk against one boss, not only crowds.
5. Shotgun Quickstep/reset behavior and Ninja clone/return interactions at maximum reachable modifiers.
6. Two- and five-player current-class parties, including duplicates and defensive support interactions; zero versus several Build Insights; fresh versus strong retained equipment.

Record actual damage, attack/cast uptime, resource balance, clear rate, survival, encounter duration and useful rewards. Around 15% sustained boss-output difference is an investigation alert, not a rule requiring equal damage. Explain the range, safety, control, investment and clearing costs that justify an intentional difference. Do not claim the unimplemented future support classes were tested.

## 12. Migration and completion report

Preserve weapon IDs, stable family indices, saved ceilings/base rolls/quality, actual affix slots and source rolls, forge history and pending paid choices, gold, favorites, equipped/pocket/armory locations and permanent unlocks. Add explicit schema fields for scope, eligibility, effect basis and ownership where needed. Keep deterministic mappings and legacy source values. Do not turn an existing generic damage affix into a newly randomized ability affix. Illegal Ranger equipment can trigger a safe fallback, but never deletion of the displaced item.

Validate the complete migrated record before replacing it. Re-running migration must have no additional economic or item effect. Preserve recoverable backups according to repository practice. Overflow and corrupt/incompatible records use the existing recoverable flow; never silently regenerate a collection.

On completion, provide:

- The implemented batches and changed source-of-truth files.
- The concrete player-facing behavior changes.
- The focused fixtures and actual play comparisons performed, with measured results where available.
- Numerical seeds changed during tuning and the evidence for each change.
- Any untested balance claims, deferred future-role/Sovereign work, and specific unresolved blockers.
- Updated reference/decision notes documenting this handoff's selected rules, without claiming a live publication unless one actually occurred.

The original draft's technical source claims were not independently audited during this handoff. Verify them in the repository. Completion means functioning implemented rules and honest validation results; it does not mean every provisional number has become final.
