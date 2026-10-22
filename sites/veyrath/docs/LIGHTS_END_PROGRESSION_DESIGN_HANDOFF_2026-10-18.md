# Light’s End — progression, rewards and weapon design handoff

**Decision record: October 18, 2026, through the creator’s 2:26 PM answers (America/New_York), with the subsequent confirmed rarity-color correction recorded below.**

This document consolidates the progression discussion beginning with `LIGHTS_END_PROGRESSION_REVIEW_BRIEF.md` around 1:42 PM. It describes the intended replacement progression model. The supplied implementation report and damage comparisons describe the old build; they are background evidence, not constraints requiring the old progression to survive.

**Status: design handoff. No game changes were implemented by preparing this document.** Boss attacks, phases, telegraphs, hitboxes and other encounter mechanics remain outside this redesign. Rewards, eligibility, pacing and progression are in scope.

## Reading the decision labels

- **[C] Confirmed:** explicit creator decisions or the direction accepted in the subsequent clarification.
- **[R] Recommended:** a concrete design recommendation or necessary edge-case treatment; not represented as an explicit creator decision.
- **[T] Test value:** an illustrative prototype number or mathematical scenario. Not measured gameplay and not a final balance target.
- **[O] Open:** a remaining decision or implementation fact that this conversation does not establish.
- **[B] Background:** a rule or test reported by the old build. It is not evidence that the replacement is balanced.

Creator decisions take precedence over recommendations, test values and historical documents. A numerical example never becomes a confirmed rule merely because it appears in a table.

## 1. Confirmed direction

| Area | Decision |
| --- | --- |
| Experience | Distinct builds, escalating survival pressure, meaningful growth between attempts, and a very difficult earned final victory. |
| Fresh accounts | A fresh-account victory should be extraordinarily difficult. It can be theoretically possible; there is no approved mandatory loss count or account-purchase gate. |
| Rune starting state | Start with **zero gameplay runes and zero unlocked gameplay-rune slots**. All three slots must be purchased with earned gold. |
| Rune capacity | Maximum of three equipped gameplay runes. Slot ownership persists between attempts. |
| Shop helpers | Permanent, capped improvements to reroll/banish allowances; allowances refresh each run. |
| Shop evolutions | Defer a separate purchased weapon-evolution system. Forging, rarity promotion and affixes already develop weapons. |
| Forge | Separate permanent power upgrades, rarity/color promotion, and affix reforging. Promotion adds a random eligible affix while preserving existing investment. |
| Weapon scaling | Current numerical weapon strength follows current character level. Finding an item at level 5 does not permanently make it a level-5 item. |
| Weapon persistence | Retained items keep their rarity, affix rolls, behavior and forge investment. Their scalable numerical advantages start smaller in a new run and grow with the character. |
| Corner bosses | Each gives a guaranteed weapon and a selected run-long blessing. Defeating all four different bosses earns Boss Soul, strengthening the chosen blessings. |
| Corner-boss importance | All four are optional, but winning without completing the set should be **much, much harder**. They are the strongest preparation route. |
| Trials | Up to two bonus development choices total per run; later trial rewards are gold/equipment. |
| Shrines | Choice of gold, healing when useful, or a modest weapon cache. |
| Reward presentation | Activity reward choices appear as cards after successful completion. Weapons appear where the activity was started. |
| Realm event | Rare random occurrence after five minutes, at most once per run, not present every run. It pulls the **whole party**. |
| Reds | New red weapons come exclusively from the realm-pulling boss. No red drops from the final boss, ordinary enemies, shrines or trials; no crafting up to red. |
| Final victory | Guaranteed orange weapon, plus the achievement and cosmetic spell color card for the qualifying first award. |
| Failed run | Keep the equipped weapon and the weapon in the safe pocket. Other carried weapons are lost. Ordinary pocket placement is manual. |
| Successful run | Keep everything in the run bag, as well as equipped/pocket items. |
| Red pocket exception | A red earned from the realm boss automatically occupies the safe pocket, replacing whatever was protected there. This is not automatic armory banking. |
| Duration | Roughly 30 real minutes for a complete attempt, with flexibility. The exact clock arrangement is not settled by that preference. |

Two policies remain recommendations rather than confirmed decisions: whether gameplay runes have purchasable levels, and whether every successful realm-boss defeat guarantees a red. See section 20.

## 2. How the progression should feel

**Fresh account.** The player has a functional starter weapon and class kit, no gameplay runes, and three visibly locked rune slots. The opening teaches combat and build choices. The final victory is an extreme challenge, not a reasonable first-session expectation. A failure can still leave gold and up to two carefully protected weapons.

**First purchases.** The player can improve a weapon or save for their first usable rune setup. A slot alone provides no effect; a rune without a slot cannot be equipped. The shop must display the combined cost of becoming able to use a first rune. A paid “buy slot and selected rune” transaction may combine the two purchases at their listed total, without granting a free rune or free slot.

**Developing account.** The player promotes and reforges promising weapons, acquires more rune capacity and alternatives, and learns when to take shrines, trials and bosses. The same weapon can support an attack-heavy or ability-heavy run through different cards and relevant affixes. Account strength makes the early game more manageable without replacing combat with waiting.

**Serious victory attempts.** A developed loadout and growing player skill make the full four-boss route achievable. Two trial developments refine the build. Boss Soul is a substantial earned preparation advantage. The player still needs a coherent build and good execution to finish the run.

**First victory and beyond.** The orange weapon, entire carried bag, achievement and spell color card make victory a material and visible milestone. Repeat wins become more achievable through skill and equipment. They should still require attention and execution; do not secretly increase difficulty just to cancel the player’s progress.

“50+ runs” remains an exploratory retention idea. It is not a required number of losses, a guaranteed date of victory, or a reason to withhold already-earned power.

## 3. Permanent state versus run state

| State | Across attempts |
| --- | --- |
| Gold | Retained after settlement; spending is permanent and is not refunded by restarting. |
| Weapons retained under the outcome rules | Preserve stable item identity, rarity, rolled affixes and forge history. |
| Purchased rune slots and owned runes | Retained. No automatic slot/rune gift on a fresh account. |
| Purchased helper-allowance upgrades | Retained; the number of charges available refreshes each run. |
| Character level and current XP | Reset. |
| Selected run abilities/developments/stat cards | Reset under the normal run-start rules. |
| Corner-boss blessings and Boss Soul | Reset. These are run-long buffs, not repeatable account-wide stat gains. |
| Trial bonus-development counter | Reset; maximum two during each run. |
| Spent rerolls and run banishes | Reset. A banish does not permanently remove an option from the account. |
| Victory achievement and spell color card | Persist once earned; repeated settlement cannot duplicate the grant. |

**[R]** Keep the existing bag-capacity convention until the actual inventory code is inspected. The old brief reports 12 bag slots, but its capacity accounting must not be guessed when implementing pocket swaps. Stored armory items outside a run remain untouched by a run failure. All items physically carried into the run must have an explicit risk status; do not use “previously owned” as an undocumented way to protect additional carried weapons.

## 4. Weapon growth: one item, different current character levels

### 4.1 The item is not locked to its discovery level

**[C]** A Legendary found at character level 5 uses the level-5 output rules, grows automatically as that character reaches levels 10 and 20, and uses the level-1 rules if retained into a new attempt. Its permanent investment is not erased.

Two otherwise identical items found at different levels must perform equally when compared at the same character level and forge rank. Different actual rolls, affixes and investment can distinguish them; discovery level does not impose a permanent power ceiling.

Automatic growth costs no gold. Gold pays for a permanent advantage relative to an otherwise identical unupgraded weapon at the same character level.

### 4.2 Shared contribution across builds

**[R]** Preserve a shared weapon contribution to eligible attacks, abilities, healing and barriers, with separate scopes for their affixes. Attack-only bonuses remain attack-only; ability bonuses support ability builds; support modifiers improve the authored support amount. This prevents the earlier problem of weapon investment becoming irrelevant to an ability-focused Mage.

Use the character-level curve once in each applicable calculation. Do not multiply an independent character damage curve by a second equivalent weapon-level damage curve and accidentally square normal growth.

Conceptually: current authored action output at character level, modified by the weapon’s currently available permanent bonuses and applicable run choices. Derived effects do not reapply already-included power or critical multipliers.

### 4.3 Prototype availability curve

**[T]** For scalable numerical permanent bonuses, test:

`A(L) = 0.40 + 0.60 × clamp((L − 1) / 19, 0, 1)`

`available permanent bonus = full earned bonus × A(L)`

Here L is current character level. This makes 40% of an earned numerical bonus available at level 1, rising to 100% at level 20. It does **not** reduce the entire weapon to 40% of its ordinary level-1 strength.

An illustrative power track has ranks +0 through +5, with each rank adding 8 percentage points of full-strength weapon power. That gives a maximum +40% bonus before other modifiers:

| Character level | Bonus availability | Available bonus for a fully upgraded +40% item |
| --- | ---: | ---: |
| 1 | 40.0% | +16.0% |
| 5 | 52.6% | +21.1% |
| 10 | 68.4% | +27.4% |
| 20 and later | 100.0% | +40.0% |

These are prototype values, not an approved maximum account advantage. Extra affixes, signatures and runes must be tested on top. A late-game 40% power bonus plus another 30% applicable multiplicative advantage gives 1.4 × 1.3 = 1.82, not a harmless isolated 40% increase.

**[R]** Apply a coherent availability policy to scalable numerical affix advantages too. Evaluate chance, speed, mitigation, healing and cooldown effects against their own caps; do not blindly treat every property as linear damage.

Behavioral identity remains recognizable from the beginning. An extra projectile is not rendered as a fractional projectile. Its total damage allocation, secondary contribution and proc budget can scale instead. Additional shapes must not create unlimited same-target damage or resource generation. Red signatures can function immediately while their numerical contribution remains bounded.

### 4.4 UI and comparison rules

- Show permanent power rank and rarity consistently; do not imply that paid upgrades were deleted at restart.
- Show current-level values, with a separate full-strength preview.
- Compare items at the same current level. A newly found item must not appear stronger simply because one panel uses full-strength values and another uses current values.
- Explain when a capped stat grants less than its nominal roll.
- Preserve one clear permanent power-upgrade track. Do not silently add this system on top of old ceiling upgrades, quality multipliers and another identical power ladder.

## 5. Forge operations

| Operation | Intended behavior |
| --- | --- |
| Upgrade Power | Increase permanent power rank; preserve rarity and affixes. |
| Upgrade Tier | Promote to the next ordinary rarity/color; preserve power rank and existing affixes; add one random eligible ordinary affix. |
| Reforge Affix | Replace a selected ordinary affix through a paid persistent candidate choice; preserve unrelated properties. |

**[C]** Promotion can reach orange, never red. Red signatures are not ordinary affixes and cannot be created through promotion, conversion or reforging.

**[C] Subsequent creator correction:** rarity colors ascend **white → blue → purple → yellow → orange → red**. Common-to-orange therefore requires four promotions. Yellow is the ordinary tier immediately below orange; orange is the highest craftable tier; red remains above it and cannot be crafted under this handoff.

**[R] Implementation mapping:** preserve the existing numeric tier IDs and names, mapping Common to white, Magic to blue, Rare to purple, Legendary to yellow, Mythic to orange, and Ascendant to red. The creator confirmed the color order, not a separate renaming of the tiers. Update the current palette and color-based text consistently rather than swapping saved item rarity IDs. The current game still maps Legendary to orange and Mythic to yellow until this change is implemented. Preserve existing saved items, affix counts and rolls; do not demote collected items to preserve their previous display color.

The old ordinary slot ranges were 0–1, 1–2, 2–3, 3–4, 4–5 and 5–6 respectively. These are usable starting ranges, not a reason to reroll an existing collection. Promotion adds one slot while respecting the next tier’s cap. Preserve each existing affix and roll. Legal behavior-slot limits continue to apply; the new slot need not be a behavioral affix.

Promotion must always preview a real added benefit. If legacy data already fills the destination tier’s slot cap, do not take payment for a color-only promotion or delete an affix to make space; route that legacy case through an explicit migration treatment.

Do not add an invisible universal damage multiplier for changing color. Rarity already adds affix opportunities. Naturally dropped higher-tier items save promotion costs and may have better rolls or fit, keeping loot relevant alongside investment in a favorite item.

Preserve existing chosen-affix locks and the paid old/new candidate workflow where compatible. A stored candidate survives reloads. Purchase, item mutation and candidate persistence are atomic; reopening a menu does not reroll the result. No rarity downgrade/refund loop can repeatedly generate fresh affixes cheaply.

Permanent forging belongs to the item; it does not make that item unlosable. If an upgraded weapon is left outside the equipped/pocket protection and the run fails, losing that weapon also loses access to its purchased upgrades. Show its current protection status at the forge. Do not automatically pocket an ordinary weapon or refund its investment to avoid that consequence.

**[R]** Keep behavior-to-stat conversion available for ability/support builds where the item legally supports it. It changes an ordinary slot’s role; it cannot manufacture a red signature or increase the total slot count.

## 6. Gameplay runes and the shop

### 6.1 Paid capacity and ownership

**[C]** New accounts have zero gameplay runes and all three gameplay-rune slots locked. Buy slots and individual runes using earned gold. Purchases are permanent, not repeated per-run fees. **[R]** Unlock the slots sequentially so the increasing capacity costs are clear.

The shop should show the combined cost of a slot and the rune needed to use it. An empty purchased slot is not described as a combat upgrade. The first usable setup should be affordable through early failed attempts; exact prices depend on retained income after competing forge expenses.

Purchased capacity is intentionally advantageous. The balancing task is to keep that advantage bounded and make its acquisition satisfying, not pretend one unlocked slot is equal to three.

### 6.2 Rune levels remain open

**[O]** The creator confirmed paid slots and zero starting runes, but did not explicitly settle the earlier five-level rune proposal.

**[R] Recommended first version:** purchased, unranked runes with one defined effect each. Buying more runes increases options; buying slots increases simultaneous capacity. Defer a third, five-level cost ladder until the first two have demonstrated good pacing.

If rune levels are approved later, give them a separate finite budget. Never grant another full projectile at every level, and price the total slot + rune + rank investment against real failed-run income. This document does not authorize assuming five rune levels are confirmed, nor claim that their removal was explicitly approved.

### 6.3 Loadout rules

**[R]** Equip up to the number of purchased slots, maximum three. No duplicate rune copies or disguised duplicate effects that bypass the same cap. Swapping owned runes between attempts is free. Lock the loadout when the run starts; weapon switching cannot reroll it or grant recovery/resources.

Show class, path and weapon eligibility before purchase and before starting. A legal weapon switch that makes an effect inapplicable should show that outcome in advance; it does not delete the purchased rune or replace it with an unearned effect.

Keep cosmetic weapon-color runes and gameplay runes separate in naming, UI and saved data. The victory spell color card is cosmetic and belongs to its own reward definition.

Range examples such as “20 spell range” and “20 melee range” have no settled units. Define units before creating content. Do not silently convert them into percentages. A projectile rune requires family-specific behavior, shared action/proc budgets and a measured same-target cost. It cannot be a universal extra full-strength attack for every family.

Offer useful options for attack, ability, hybrid and support builds. Defer permanent XP/gold-multiplier runes in the first version; these can become obligatory economic purchases that delay experimentation. No ordinary rune should duplicate an exclusive red signature.

## 7. Rerolls, banishes and build control

**[C]** Shop purchases permanently increase a capped allowance refreshed each run. They are not consumables that charge gold on every attempt. Separate purchased weapon evolutions are deferred.

**[T]** Start testing with two ordinary-card rerolls and one ordinary-card banish per run. Permit one permanent upgrade to each allowance, producing three rerolls and two banishes. These counts are provisional; the purchase model is confirmed.

**[R]** Helpers apply to randomized ordinary level-up offers. Do not silently let them reroll weapon drops, forge affixes, boss rewards, rare-event occurrence, or an already deliberate development catalog.

Banishing one option must not leave a selected build’s required progression inaccessible without warning. Exclude unusable and permanently capped options from offers. Use an explicit useful fallback when the pool is exhausted; no infinite currency loop from repeated invalid choices. Temporary buffs must not hide an otherwise useful long-term option merely because a temporary cap is currently reached.

The goal is some agency over a run, not certainty that every attempt obtains the same optimal sequence. Measure build repetition as well as frustration from unsuitable offers.

## 8. XP, build milestones and elapsed time

### 8.1 Schedule to test

**[R]** Retain the existing acquisition schedule as the first prototype: abilities at levels 1, 5 and 10, then the ultimate at 15. Developments occur at 7, 11, 14, 18, 22, 26 and 30, continuing every four levels where the mode supports it. Other levels provide ordinary stat/utility choices.

Level 30 therefore supplies seven scheduled developments. Two trial bonuses make nine, replacing the old potential total of twelve from five extra Insights. Nine versus seven is 28.6% more selections, not a guarantee of 28.6% more power. Completing a powerful interaction can be worth much more than one ordinary numerical choice.

**[T]** Opening timing hypotheses remain: second ability around world minute 2–3, third around 5–6, ultimate around 9–12. They are not measured arrival times. Character level need not be capped at 30 merely because the main encounter begins around that time.

### 8.2 Illustrative XP curve

For a transparent mathematical scenario only, let XP to advance from level L be `80 + 12 × (L − 1)`. Then the XP needed for n level gains is `6n² + 74n`.

Assume collected XP per world minute of 165 during minutes 0–5, 230 during 5–12, 260 during 12–20, and 300 during 20–30, with no optional activity rewards. This produces:

| Milestone | Approximate world minute |
| --- | ---: |
| Level 5: second ability | 2.38 |
| Level 7: first development | 4.00 |
| Level 10: third ability | 6.42 |
| Level 15: ultimate | 11.03 |
| Level 18: development | 14.14 |
| Level 26: development | 23.62 |
| Level 30: development | 28.92 |

This scenario yields 7,515 collected XP by world minute 30. At 75% of that collection, the character is level 26; at 125%, level 34. Thus clearing and collecting efficiency alone can change which development thresholds are reached. These are scenario results, not a proposed guarantee that all builds end at the same level.

Separate kills, XP spawned and XP collected in telemetry. A ranged build can kill efficiently but leave experience behind; a melee build can collect more easily while accepting greater exposure. Pickup range must not become a hidden prerequisite for keeping pace.

### 8.3 The 30-minute constraint

**[C]** Desired full-attempt duration is roughly 30 real minutes, flexible. **[B]** The old design uses a 30-minute world clock, paused during isolated encounters and choices. Those are different durations.

Illustrative timing arithmetic:

| Component | No optional activities | Four bosses + two trials |
| --- | ---: | ---: |
| Main world clock | 30 min | 30 min |
| Four corner fights at 1.5 min each | 0 | 6 min |
| Two trials at 1 min each | 0 | 2 min |
| Menus/choices | 2 min | 2 min |
| Final encounter | 3 min | 3 min |
| **Total** | **35 min** | **43 min** |

A hypothetical four-minute realm event would extend the second case to 47 minutes. Travel already occurring during the world clock is not added again. These encounter durations are assumptions, not requests to redesign mechanics.

**[R]** Keep the present clock behavior for the initial comparison, but do not describe a 43-minute route as meeting a strict 30-minute target. Measure actual full sessions. If the longer full route exceeds acceptable flexibility, revise the main-world duration and associated progression/availability schedule together. Shortening that clock is a separate proposed pacing change, not already approved here. Do not solve the mismatch by silently speeding up attacks or removing earned choices.

## 9. Activity rewards and their presentation

| Activity | Main reward | Scaling rule |
| --- | --- | --- |
| Ordinary enemies | XP, modest gold, occasional lower-tier weapons | Survival is the main source of routine leveling. |
| Elites | Better gold and weapon opportunity | Reward dangerous targets without granting development points per kill. |
| Shrine | Card choice: gold, useful healing, or modest weapon cache | One selection, not all three rewards. No large XP jackpot. |
| Trial, before bonus cap | Card choice of one eligible bonus development | Maximum two trial developments per player per run. |
| Trial, after cap | Advertised gold/equipment reward | No hidden third development. |
| Corner boss | Guaranteed weapon plus card choice of one blessing | One major payout per distinct corner boss per run. |
| Four distinct corner bosses | Boss Soul upgrades earned blessings | Run-long, personal and bounded. |
| Final boss | Guaranteed orange; victory recognition and full-bag retention | No red chance. |
| Realm boss | Exclusive red opportunity; red auto-pocket behavior | Rare, once-per-run event; payout guarantee still a recommendation. |

**[C]** Present reward cards after successful completion. Weapons spawn at the recorded location where the event was started, rather than becoming inaccessible at an enemy’s death position inside an isolated arena. Record that anchor before entering/pulling the party.

**[R]** Use one activity settlement identity linking its card choice and physical item reward. Selecting or reconnecting cannot create another choice, another item or a new roll. Ordinary boss weapon drops are independent of which blessing card is chosen.

For shrines, hide a healing option that cannot help. Offer fewer useful choices rather than a fake unusable card if a valid replacement is unavailable. A cache’s expected salvage value must not exceed the gold option while also providing a free equipment-upgrade chance; otherwise the gold choice is dominated.

Optional enemies and completion rewards share a finite XP/gold allowance. Do not add a large completion XP burst on top of unlimited rewarding waves. Paused world time makes additional leveling especially valuable, so compare total benefits of none, some and all activities. Do not interpret reward-ledger correctness as proof that those activities are economically balanced.

## 10. Corner blessings, Boss Soul and trial developments

### 10.1 Boss blessings and Soul

**[C]** Each distinct corner boss offers one run-long blessing selection. Completing all four strengthens the chosen blessings through Boss Soul. Completion is not a hard access requirement, but the final fight should be much harder without full preparation.

**[R]** Offer three eligible directions per boss: offense, protection, and sustain/utility. Tailor useful effects to the actual build. A support player must not receive three personal attack-damage choices. Boss Soul improves the selected effects; it does not erase the build’s choices and replace them with one universal package.

**[T]** For an all-offense example, each ordinary blessing contributes +3 percentage points to the applicable additive damage group. On full completion, each becomes +5 points:

| Distinct corner bosses completed | Combined example bonus |
| --- | ---: |
| 0 | +0 points |
| 1 | +3 points |
| 2 | +6 points |
| 3 | +9 points |
| 4, Boss Soul active | +20 points total |

The +20 replaces the four smaller contributions. Do not calculate four independent multipliers and then multiply by another Soul bonus. With an existing +100% in that same additive group, adding 20 points increases the multiplier from 2.0 to 2.2: only a 10% relative damage increase. This distinction matters when judging whether Soul feels substantial enough.

Do not copy these percentages directly onto damage reduction, cooldown reduction, resources or healing. Each has a different impact on survival and uptime. Boss reward power, equipment improvements and trial developments must be evaluated together. The creator’s intended difficulty gap without all four is confirmed; the +3/+5 example is not proof that the gap has been achieved.

Avoid XP/gold multipliers in blessings initially. More direct combat effectiveness already increases clearing and indirectly improves income. Avoid extra unbudgeted projectiles and recursive procs.

Each unique boss contributes at most once. Repeating the easiest boss cannot complete Soul. Respawns, if retained, must not reissue that boss’s major completion reward during the same run.

### 10.2 Trial selections

**[C]** The first two qualifying trial completions can each grant one bonus development; further trials grant gold/equipment. Show the remaining development allowance before entry so a player is not surprised after success.

**[R]** Offer three eligible nodes where possible and let the player select one. Normal ability ownership, level requirements and prerequisites still apply. A trial does not grant an unearned ultimate early. If no legal node exists, record the earned choice as pending until one does; never silently substitute an unusable selection. Pending and spent bonuses share the same cap of two.

This replaces the old five-Insight allowance across the redesigned reward system. Do not accidentally preserve extra boss Insights on top of the two trial selections.

## 11. Weapon sources, rarity and meaningful drops

**[C]** Red exclusivity and the final orange guarantee are settled. **[R]** The ordinary source distribution below is the recommended starting structure; its probabilities need testing.

| Source | Recommended weapon pool |
| --- | --- |
| Ordinary enemies | Common, Magic and Rare; later world stages can favor the better entries. |
| Elites | Rare, with a chance at the ordinary tier immediately below orange. |
| Shrine caches | Lower/middle ordinary tiers; no orange or red. |
| Trial equipment rewards | Rare or the tier below orange, appropriate to the authored trial. |
| Corner bosses | Guaranteed Rare-or-better, usually below orange, with a small orange chance. |
| Final boss | One guaranteed orange weapon per qualifying victory. |
| Realm-pulling boss | Exclusive source of new red weapons. |

**[T]** One corner-boss rarity distribution to test is 55% Rare, 40% the tier below orange, and 5% orange. These are conditional rarity weights for its guaranteed weapon, not a 5% chance to drop any weapon. Four independent 5% orange chances give `1 − 0.95^4 = 18.55%` probability of at least one orange. There is no guaranteed pre-final orange from completing the set.

**[R]** For the final reward, show three eligible orange weapon cards and let each eligible player select one. Only the chosen item is granted; the other offers cannot be salvaged. This increases relevance without giving three items. The chosen weapon follows the activity-start drop location and victory-claim handling below.

Family eligibility applies to all personal offers and drops. Preserve the confirmed Ranger groups: Archer/Alchemist use Bow, Short Bow, Long Bow, Crossbow and Falconer; Ninja uses Shuriken, Kunai and Chakram; Gunslinger uses Pistols and Shotgun. A legal item is not necessarily a numerical upgrade, and a higher rarity is not automatically better for every build.

Do not define ordinary drop rates solely by a tiny-looking percentage. For example, a 0.2% weapon chance gives four expected drops in 2,000 kills but twenty in 10,000 kills. Crowd clear, party density and mode rules change the number of opportunities. Establish desired item frequency against observed kill counts, then inspect actual bag pressure and salvage income.

Track a useful upgrade as an item the player equips, pockets for a planned alternative, or retains and later uses—not merely an item with a brighter color. High-rarity drops that repeatedly need expensive conversion before an ability/support build can use them are an economy problem.

Do not make every new drop automatically beat the equipped item. Conversely, promotion and cheap perfect-affix crafting must not make all natural drops irrelevant. Higher-tier natural drops save investment and can provide better-fitting rolls or an alternative build.

## 12. The rare realm event

### 12.1 Confirmed event conditions

- **[C]** It can occur randomly after five minutes.
- **[C]** It is rare and does not occur in every run.
- **[C]** It appears at most once per run and pulls the whole party.
- **[C]** Its boss is the exclusive source of new reds.
- **[C]** A red received from it automatically replaces the safe-pocket weapon.

**[R]** Interpret the five-minute threshold using main-world time, not time spent in menus. Persist the event’s once-per-run identity, its random scheduling state and any resolved reward. Reconnects, saving and menu changes cannot reroll whether it appears. A genuine new attempt can receive a new random schedule; do not punish ordinary restarting to mask an unfavorable economy.

Random appearance timing should span an eligible window after the threshold rather than make “wait until 5:01, then restart if absent” the most efficient search. If another isolated activity is active, use a defined safe transition and the recorded event state. Do not generate several queued occurrences. The event must not interfere with final victory settlement.

### 12.2 Red payout recommendation

**[R] Recommended default:** one guaranteed personal, eligible red for each qualifying participant when the party defeats the realm boss. The encounter is already rare, occurs once per run, and requires a successful fight. Random family/affix/signature selection can supply the ongoing item chase.

**[O]** The creator has not explicitly confirmed a 100% red payout on every victory. The statement “if you kill the realm boss and get a red” confirms its pocket treatment, not its drop probability. Keep the guarantee clearly labeled until this policy is adopted.

Why another chance layer matters: with hypothetical event probability p = 8% per attempt, conditional encounter-win probability q = 10%, and red payout chance r = 100%, red acquisition probability is `p × q × r = 0.8%`. Under a stationary independent model that is 125 attempts on average, with a median of 87 attempts. At r = 25%, the mean becomes 500 attempts. These are illustrations, not suggested event rates, measured skill levels or acceptable grind targets. Early deaths can also prevent reaching a scheduled occurrence, and player skill changes over time.

Measure reds per real hour, not just reds per boss kill. Compare short restart searches with full attempts. Avoid making red acquisition necessary for a reasonable developed-account final victory; the realm event is too random to serve as a required preparation step.

**[O]** Whole-party realm defeat behavior—return to the world versus end the normal run—was not resolved here. Inspect the actual current realm rules and preserve that outcome until explicitly changed. Do not infer a new boss mechanic or a new death exception from this reward document.

## 13. Inventory, the safe pocket and settlement

### 13.1 Ordinary run failure

**[C]** Retain only the equipped weapon and the manually protected safe-pocket weapon from the carried run inventory. Other carried weapons are lost. Earned retained gold remains, subject to actual spending. There is no automatic “best weapon” selection after death.

**[R]** Apply the same failure-retention settlement to abandon and restart so quitting just before death does not bank the whole bag. Do not add an extraction penalty or confiscate previously stored armory items that were never carried into the run.

If equipped and pocket references can point to the same item, keep it once. Moving or equipping an item must not duplicate it or create a third protected reference. Make protection visible before failure: labels should distinguish equipped, protected and at-risk items.

### 13.2 Red automatically replaces the pocket item

**[C]** A newly earned realm-boss red takes the safe pocket automatically over any weapon already there, including another red. It is protected because it is pocketed, not because it was automatically banked to the armory.

**[R] Atomic handling:**

1. Create the single personal red reward with a stable item/reward identity.
2. Place it in the safe pocket as part of the reward transaction.
3. Move the displaced pocket weapon into the red’s former bag position if applicable, or a free ordinary bag location.
4. If no carried location is available, put the displaced weapon in a reserved personal pickup at the recorded activity-start/return location. Do not silently delete, auto-salvage, or auto-bank it.
5. Clearly notify the player that the previous pocket weapon is now unprotected or on the ground.

If a red is shown dropping at the activity-start location, that presentation represents the same automatically pocketed item. It must not leave a second collectible copy on the ground. No manual pickup is required to trigger the confirmed red-protection exception.

The player can subsequently move items manually, but doing so must make the loss of red protection explicit. Ordinary non-red rewards never evict the pocket weapon automatically.

### 13.3 Victory retains the entire bag

**[C]** Winning retains every item in the run bag plus equipped/pocket items. This is a major additional reward over failure and belongs in economy balancing.

**[R]** Resolve final reward cards and the guaranteed orange claim through the victory transaction before returning to the menu. If the bag is full, reserve the orange as a pending victory reward and provide a valid claim/overflow path; do not destroy it or force an unrelated saved item to disappear. This is a final-victory handling rule, not a general extra safe-pocket slot.

All retained item IDs, earned gold and first-victory awards settle once. A reconnect or repeated completion message resumes the same pending choice or shows the completed result. It cannot reroll the orange offers or grant the contents of the bag twice.

If the player continues into Endless, the victory snapshot is already retained. Do not retroactively lose it on a later death. The protection of newly acquired post-victory loot needs an explicit mode rule; do not assume that the Normal victory permanently makes all future Endless loot risk-free.

### 13.4 What full-bag retention changes mathematically

Do not model failure as seeing only two weapon rolls. A player can inspect many candidates and protect the best two before dying.

Illustration: eight inspected independent candidates, each with usefulness probability u, and perfect management of the two protected slots. If K is the number of useful items, a failed run retains `min(K, 2)` while a win retains K.

| Assumed u | Expected useful items retained on failure | Expected useful items retained on victory |
| --- | ---: | ---: |
| 10% | 0.756 | 0.800 |
| 30% | 1.687 | 2.400 |

This idealized model excludes imperfect pocket management, a displaced item after a red, previously occupied protected slots and differences in item value. It shows that full-bag victory retention can add substantial collection/salvage value without multiplying the chance of finding a single useful upgrade by the bag size. Include both retained equipment and gold when comparing farming routes.

## 14. Co-op and support progression

**[R]** Preserve shared progression credit with individual choices and personal loot. Shared XP is awarded once for the party event, not once per player on top of shared XP. Additional enemies, faster group clearing and personal gold must be evaluated together so rewards do not multiply twice with party size.

Each eligible player receives their own blessing selection, weapon entitlement and trial-counter progress. Boss Soul affects that player’s selected blessings. Five players do not create five stacking party-wide Soul auras.

Track distinct-boss participation per player. A player who joins after three bosses does not immediately gain three unearned blessings or complete Soul by attending only the fourth. Eligible teammates who are downed at the end still receive credit. Supporters qualify through encounter participation, not personal damage thresholds or last hits.

The realm event pulls the whole current party as confirmed. Freeze its eligible roster consistently with encounter rules. Valid reconnects retain identity; late arrivals do not reroll scaling or claim a completed encounter they did not join. A coordinated support composition must not turn healing, barriers and mitigation into a permanently invulnerable progression farm.

Account strength differences are expected. A veteran can help a new player, and a qualifying party victory can award that new player the normal team reward. Record solo versus co-op and participating account/loadout state so a carried victory is not used as evidence that a fresh solo account is balanced to win. Do not invent a damage-contribution gate that excludes healers or tanks.

Future healer/tank/buffer kits are not implemented by this document. Their progression contract is: access to shared XP, personal currency/loot, applicable weapon power and runes, and reward eligibility independent of last hits. Existing classes must still be able to progress solo without a mandatory support composition.

## 15. Prototype purchase costs and competing expenses

All prices in this section are **[T] scenario inputs**, not measured current prices or final approvals. They make the cost structure reviewable. They must be reconciled with actual retained income, existing paid unlocks and forge spending before implementation tuning.

### 15.1 Rune and helper purchases

| Purchase | Illustrative price |
| --- | ---: |
| Rune slot 1 | 100 gold |
| Rune slot 2 | 400 gold |
| Rune slot 3 | 800 gold |
| One ordinary gameplay rune | 200 gold |
| Permanent +1 reroll allowance | 600 gold |
| Permanent +1 banish allowance | 800 gold |

| Purchase milestone | Cumulative cost |
| --- | ---: |
| First slot + first rune | 300 gold |
| Two slots + two runes | 900 gold |
| Three slots + three runes | 1,900 gold |
| Three slots/runes + both helper upgrades | 3,300 gold |

These milestones exclude forge investment and additional alternative runes. They assume no rune-level ladder. The player may choose a different purchase order; a fixed table must not become a forced tutorial shopping sequence.

### 15.2 Forge project examples

**[T]** A five-rank power track could cost 50, 100, 200, 350 and 550 gold, totaling 1,250. An ordinary tier-promotion chain could cost 100, 300, 600 and 1,200, totaling 2,200 from Common through the ordinary tiers to orange. Reforging and locking are separate expenses.

The old implementation reported a 400-gold behavior/stat conversion and existing rarity-based reforge fees. Those are background inputs, not proof of fair prices under the replacement economy. Inventory the actual operations and prices; avoid charging both an obsolete quality/ceiling upgrade and the replacement power upgrade for the same benefit.

A full crafted orange costs materially more than accepting a useful naturally dropped orange. That preserves a reason to fight for loot. Do not let low-tier cheap reforging followed by cheap promotion reliably produce perfect orange items for less than improving an ordinary orange drop. Prefer sensible promotion/reforge pricing over deleting the player’s existing affixes on promotion.

## 16. Numerical economy scenario: failures, time and improving skill

This is a deliberately hypothetical affordability model. It is not a simulation of the game’s combat, a prediction of first victory, or evidence that a purchase causes a particular win probability.

### 16.1 Assumed outcomes

| Outcome | Illustrative world progress | Total real time | Gold retained before purchases |
| --- | --- | ---: | ---: |
| Early failure | About 8 world minutes | 12 min | 120 |
| Mid-run failure | About 18 world minutes | 24 min | 340 |
| Late failure | About 28 world minutes | 38 min | 700 |
| Victory | Main clock plus final encounter | 43 min | 1,000 |

Real time includes relevant paused encounters, choices and turnaround; travel within world time is not counted twice. Gold includes the modeled currency/salvage payout already received, not the hypothetical future sale of every retained weapon. Full-bag victory collection value is additional and must be measured separately.

### 16.2 Changing outcome assumptions

| Phase | Attempts in this toy model | Early / mid / late / win probabilities | Gold budget reserved for forge activity |
| --- | --- | --- | ---: |
| Learning | 1–5 | 70% / 25% / 5% / 0% | 25% |
| Developing | 6–15 | 35% / 40% / 24.9% / 0.1% | 35% |
| Experienced | 16 onward | 10% / 25% / 60% / 5% | 40% |

These bands represent hypothetical improvement through skill and account development together. They do not say a player becomes experienced on attempt 16, or that a fresh victory is mechanically forbidden. The zero early win probability only describes the illustrative ordinary-learning cohort. The model does not assign victory to spending a specific number of gold.

Expected values for each phase:

| Phase | Gross gold/attempt | Real minutes/attempt | Budget available for rune/helper purchases |
| --- | ---: | ---: | ---: |
| Learning | 204.0 | 16.300 | 153.000 |
| Developing | 353.3 | 23.305 | 229.645 |
| Experienced | 567.0 | 32.150 | 340.200 |

For probabilities pᵢ, retained gold Gᵢ, elapsed time Tᵢ and forge reserve f:

`E[gold] = Σ pᵢGᵢ`

`E[time] = Σ pᵢTᵢ`

`purchase budget = E[gold] × (1 − f)`

Use total retained gold divided by total real minutes for long-run income efficiency. Do not take an unweighted average of each outcome’s gold/minute rate.

### 16.3 Purchase milestone results

A reproducible toy calculation sampled 40,000 independent account histories using Python’s `random.Random(181026)`. Each attempt sampled the phase’s outcome, added its elapsed minutes, and reserved the stated fraction of retained gold for forging. The remaining cumulative budget was compared with the cumulative milestone costs. Purchase costs and income behavior were otherwise fixed.

| Milestone | Median attempt of affordability | Median elapsed time | 10th–90th percentile elapsed time |
| --- | ---: | ---: | ---: |
| First slot + rune: 300 | 2 | 0.80 h | 0.60–1.00 h |
| Two slots + runes: 900 | 6 | 1.83 h | 1.60–2.20 h |
| Three slots + runes: 1,900 | 10 | 3.50 h | 3.23–3.90 h |
| Above plus helper upgrades: 3,300 | 16 | 5.93 h | 5.50–6.33 h |

Attempt and elapsed-time medians are separate distribution statistics; do not multiply median attempts by a single run length to reconstruct the time column. The forge reserve is a spending-budget abstraction, not a claim that fractional real purchases occur. Individual item decisions, different purchase order, changing rewards from specific upgrades and covariance between loot and outcomes are not modeled.

A player who repeatedly fails early would receive only 90 shop-budget gold per attempt after a 25% forge reserve, so four such attempts are needed for the first 300-gold setup. The early median of two in the mixed cohort is not a promise that everyone gets a rune after two failures.

This exercise supports a testable question: is roughly the first hour an acceptable wait for the first usable rune, given that earlier gold can improve a weapon? If not, reduce the combined first-slot-and-rune price rather than quietly granting free starting runes against the creator’s decision.

### 16.4 Farming comparisons

In the assumed table, gross retained currency rates are 10.00, 14.17, 18.42 and 23.26 gold per real minute from early failure through victory. This ordering deliberately rewards deeper progress before counting retained equipment.

A repeatable 100-gold opening bonus would make the early route `(120 + 100) / 12 = 18.33 gold/minute`, beating the mid-run rate. That is a mathematically demonstrable risk under these assumptions, not evidence of an actual current exploit.

Also test corner-boss rewards per real minute, short realm-event searches, salvage from extra co-op spawns, easier modes and full-bag victory value. Do not fix a lucrative restart route by removing the approved failure retention. Adjust reward cadence/value or the exploitable repeat grant.

With independent 10% probability of a useful reforge result and a hypothetical 150-gold price, expected cost is 1,500 gold; there is no guarantee of success after ten attempts. Avoid an unlimited random reforge sink becoming the only sensible use of every future run’s earnings.

## 17. Difficulty and replay expectations

Distinguish three milestones:

1. **First possible victory:** no approved hard purchase/attempt gate, but an extraordinarily difficult fresh-account accomplishment. Do not balance routine new players around winning immediately.
2. **Typical first victory:** achieved through learning, retained weapons, paid capacity, useful runes, build decisions and usually full corner-boss preparation. Its distribution is currently unknown.
3. **Repeat victory:** more attainable for a skilled developed account, while still requiring execution. Do not force a fixed failure rate after mastery.

Boss Soul is not required by an access gate. It is intended to make a large practical difference to preparedness. Compare zero, two, three and four corner completions using similar accounts and builds; compare both outcome and additional elapsed time. A zero-Soul success by an expert does not mean the reward is too weak. A total collapse of every non-full-clear build may mean “optional” has become misleading.

Permanent power should make the early game somewhat easier. The warning sign is several minutes without consequential positioning, target choice or build decisions. Late difficulty cannot compensate for a repetitive opening. Preserve an early opportunity to make meaningful build choices and test developed accounts as well as fresh ones.

Measure the total package: weapon power, rarity/affixes, three runes, helper control, two trial nodes, four blessings/Soul and improved player skill. Testing each track alone cannot establish the combined result.

## 18. Important risks: mathematical facts versus playtest questions

| Priority | Finding | Classification | Smallest response |
| --- | --- | --- | --- |
| High | A 30-minute paused world clock plus activities and final fight exceeds 30 real minutes. | Arithmetic, with exact overrun depending on actual durations. | Measure total sessions and adjust the clock/progression schedule together if needed. |
| High | Buying a slot without a rune, or a rune without a slot, gives no usable loadout benefit. | Confirmed structural consequence of the chosen model. | Show combined usable cost; make the first complete purchase attainable early. |
| High | Several permanent power tracks can multiply into a much larger advantage. | Mathematical interaction; exact size needs actual scopes and values. | Bound the combined package and avoid duplicate level/quality/power multipliers. |
| High | Paused encounters provide power without advancing outside pressure. | Intentional advantage; mandatory-route severity needs measurement. | Finite XP/rewards; measure full preparation versus selective routes and real time. |
| High | Red pocket replacement can erase an existing item if overflow is unspecified. | Missing-rule hazard. | Atomic displacement to bag or personal pickup; never silent deletion. |
| High | Full-bag victory changes retained value relative to failure. | Confirmed consequence; magnitude unknown. | Include retained items, future salvage and currency in the economy model. |
| Medium | Rare appearance × difficult fight × rare red drop can create extreme grind. | Mathematical multiplication under stated probabilities. | Prefer guaranteeing red on an earned rare-event victory; measure acquisition hours. |
| Medium | Cheap lower-tier reforging followed by promotion can dominate natural loot. | Plausible exploit depending on prices and roll rules. | Audit total project costs; preserve rolls but price promotion sensibly. |
| Medium | Three rune slots and helper allowances may converge on one repeating build. | Playtest/content risk. | Useful alternatives, eligibility-aware offers and bounded helper counts. |
| Medium | More clear speed yields more XP and earlier upgrades, creating further clear speed. | Intentional positive feedback that may become excessive. | Compare collected XP and milestone timing across focus/coverage builds. |
| Medium | Co-op or easy modes can become the optimal permanent-reward farm. | Unmeasured. | Compare rewards per player per real minute, without damage gates for support. |

Do not respond to every advantage by removing it. Paid slots, a better weapon, full preparation and improved skill should matter. The question is whether the advantage remains understandable, bounded and compatible with meaningful choices.

## 19. Validation and migration checklist for the builder

### 19.1 Necessary behavior checks

| Check | Expected behavior |
| --- | --- |
| New account | Zero owned gameplay runes; all three gameplay-rune slots locked. |
| Purchase | Gold and ownership update once; reopening/reconnecting does not duplicate the purchase. |
| Same item at different discovery levels | Equal current-level output with equal rolls and investment. |
| Restart with retained upgraded item | Rank/rarity/affixes remain; current numerical availability resets with character level. |
| Forge promotion | Existing rolls survive; one eligible affix is added; no red can be crafted. |
| Ability/support build | Relevant weapon power/affixes improve its actual output, not only LMB. |
| Trial counter | At most two earned or pending bonus developments; retries cannot grant another. |
| Corner completion | One weapon entitlement and one blessing per unique boss; repeated boss does not advance Soul. |
| Reward location | Weapon appears at the saved activity-start anchor; arena exit cannot strand it. |
| Red award with full pocket/bag | Red becomes protected; old pocket item remains recoverable and becomes unprotected; no duplicate red. |
| Failure/restart | Only equipped/pocket carried weapons retained; uncarried armory preserved. |
| Victory with full bag | Entire carried bag retained; guaranteed orange claim resolved without silent item loss. |
| Reconnect during reward | Same card options, item IDs and settlement resume; no reroll or duplicate reward. |
| Co-op support/downed member | Eligible participant receives normal personal reward without a damage threshold. |
| Late join | No retroactive boss blessings or completed-encounter rewards. |

### 19.2 Run measurements

Capture start account state, path/family, power rank, rarity/affixes, rune slots/loadout, helper allowances, player experience, party size, activity participation, world time and real elapsed time. Record XP earned/collected, level arrival times, gold by source, gold spending, items seen, items retained, useful retained upgrades and outcome.

Compare fresh/developing/established accounts; attack/ability/hybrid builds; focused and coverage routes; zero/two/four corner bosses; zero/two trial developments; and solo/two/five-player sessions. Include failed attempts and deliberate opening/restart routes. Test ordinary, maximum-investment and relevant critical/proc builds, not only Common items with critical hits disabled.

Use actual first-win distributions and reasons for failure to assess difficulty. Do not derive victory probability from target-dummy DPS, shop cost or number of runs alone.

### 19.3 Safe migration

Inspect current source before mapping the old saved ceiling, quality and level model into permanent power rank. Preserve original item data, IDs, affixes, paid candidates and invested currency history. Do not add new bonuses on top of equivalent old bonuses. Do not delete historical red items because future drop sources change.

Existing cosmetic runes must not be reinterpreted as gameplay runes. Existing paid helper upgrades should not be silently charged again or removed. Inventory legacy shop passives before deciding whether they remain, are folded into the new budget, or receive compensation. That migration policy is not settled by the old implementation report.

Apply the new outcome rules prospectively to clearly labeled carried items; do not retroactively wipe a stored collection. Back up the old save schema and make conversion idempotent. No live deployment or destructive collection migration was performed for this handoff.

## 20. Remaining decisions and exact evidence needed

The following are deliberately not presented as confirmed:

1. **Rune levels:** recommended unranked initial version; the paid five-level proposal remains unresolved.
2. **Red payout probability:** recommended guarantee on a successful rare realm-boss victory; exclusivity and auto-pocket behavior are confirmed independently of this choice.
3. **Pacing reconciliation:** acceptable real-time overrun and whether the 30-minute world clock needs shortening. Current paused-clock behavior and rough real-time goal cannot be treated as identical.
4. **Realm defeat and late-run scheduling:** exact existing return/failure behavior and how a pending event interacts with an already-active isolated encounter or final transition.
5. **Mode eligibility:** which official modes qualify for the achievement/color card, and explicit Modified/Endless reward and post-victory retention rules. Do not let an easier modifier quietly become a superior permanent farm.
6. **Content/tuning:** exact rune effects, blessing effects, prices, drop frequencies, XP curve, power curve, spell color/name and support-specific alternatives.

The last category should be authored and measured as normal tuning work, not turned into a long list of arbitrary questions for the creator. Keep recommended defaults clearly separate from approved policies.

For actual implementation and calibration, obtain:

- Current `GAME_REFERENCE.md` and relevant `docs/reference/` progression/economy segments.
- Current source under `sites/veyrath/dist/`: especially `weapons.js`, `core-rules.js`, `affix-data.js`, `level-cards.js`, `developments.js`, `rewards.js`, `survival.js`, `pits.js`, `world-events.js`, `party.js`, `meta.js`, `front-end.js` and `game.js`; also the actual realm-event and save/settlement modules if named differently.
- The actual functions/constants for XP thresholds, XP collection/sharing, item generation, shop/forge prices, bag/pocket capacity, death/victory settlement and rare-event scheduling. Record real paths and exports rather than treating suggested filenames as verified source ownership.
- `tests/core-redesign-comparisons.mjs` if interpreting the old DPS data: exact loadouts, starting resources, cast accounting, action overlap and per-ability damage attribution are required.
- Real attempt logs containing the measurements in section 19.2, including failures and party runs.

## 21. Superseded proposals and source notes

| Earlier proposal/background | This handoff’s treatment |
| --- | --- |
| Three free rune slots and a free starter selection | Superseded by creator: zero starting runes; all three slots purchased with gold. |
| Five purchasable levels per rune | Still open; not silently approved. Recommended initial version is unranked. |
| Separate purchased weapon evolution | Deferred in favor of power, promotion and affix forging. |
| Up to five extra Insights | Replaced by up to two trial developments in the approved reward structure. |
| Optional activities need not strongly affect final readiness | Refined by creator: all four bosses remain optional, but skipping the set makes victory exceptionally hard. |
| Final boss can drop red | Superseded by creator: guaranteed orange; new reds exclusively from realm boss. |
| Level at discovery or saved ceiling limits an item’s ultimate usefulness | Replaced by current-character-level scaling with retained permanent investment. |
| Forging cannot change rarity | Replaced by separate rarity/color promotion up to orange. |
| All rewards automatically go to inventory/protection | Ordinary weapons drop at the activity-start point; manual pocket placement, with the red exception. |
| Two protected weapons regardless of outcome | Failure keeps equipped/pocket; victory keeps the entire bag. |
| Realm boss is a solo-only event | Creator clarified that the whole party is pulled. |
| Fresh-account wins may be merely uncommon | Creator clarified that they should be extraordinarily difficult. No mandatory loss count was approved. |

Source basis:

- **Creator conversation, October 18, 2026:** progression intent, activity-reward and forging discussion, discovery-level clarification, and the eight final answers at 2:26 PM. These are the authority for confirmed decisions.
- **`LIGHTS_END_PROGRESSION_REVIEW_BRIEF.md`:** sections 2–4 for goals and proposed progression; sections 5–7 for required analysis; section 8 for scope; section 10 for background sources. Its description of an old local implementation is not approval to preserve that progression unchanged.
- **`CORE_REDESIGN_IMPLEMENTATION_2026-10-18.md`:** “Action and output contracts,” “Checks actually performed,” and “Limits and outstanding playtest acceptance.” Background evidence of reported local technical work, not proof of the new economy.
- **`core-redesign-comparisons.json`:** 39 old deterministic output scenarios: 13 configurations at three levels, covering seven paths and eleven weapon families. No incoming attacks or critical hits. These establish neither all-class survival balance nor progression pace.
- **Earlier combat handoff:** background for shared output, ownership, resource budgets, legal equipment and save protections. Apply it only where consistent with the latest creator decisions; do not import its provisional loot/economy values as approved replacement rules.

The next implementation work should use this as a coherent design specification while resolving the explicitly open policies and inspecting actual source/migration needs. Creating this document is not a claim that those changes are already in the game or that the numerical examples have passed playtesting.

