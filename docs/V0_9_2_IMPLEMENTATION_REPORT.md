# VEYRATH V0.9.2 — implementation report

October 15, 2026. Source: original 14-page `VEYRATH_V0_9_2_COMPLETE_UPDATE_WITH_WARRIOR.pdf`, read in full; searchable transcript in `docs/v0-9-2-design-transcript.txt`. Original source packs and PDFs preserved. This report describes implemented behavior, not merely a plan.

## Decisions and precedence

The user explicitly confirmed keeping Longsword at 100 damage/four normal hits against the smallest enemies before going to bed. That supersedes the PDF's repeated older 250-damage/Medium Demon anchor. Orb stays 90/five pulses. All recently reduced basic damage, slower enemy movement and rarer loot remain. This batch implements the PDF's reach-only hotfix without reversing that balance.

Proposed values are implementation seeds, not permanent balance commitments. Existing map/assets and Site identity are retained. The update replaces the old five-level talent schedule, small ranked trees, instant kill XP, escalating reforge prices, and common Warrior Cleave/Parry/Slam/Storm kit.

## Implemented change order

| Change | Actual behavior |
|---|---|
| C01 Warrior reach | All six families gain 10% LMB reach/travel. Damage, timing, cone angle, thrust width, hammer impact radius and active-skill reach remain separate. |
| C02 Blood Mage | Fourth Mage specialization with all four active spells, Arcane Energy integration, 36-node graph, blood-colored effects/trails and preserved free weapon-defined LMB/Blink. |
| C03 Forge | Flat stat/behavior reroll prices by rarity. A paid candidate is persisted while old affix stays active; KEEP OLD or ACCEPT NEW completes without another charge. Reload resumes pending choice. Other armory mutations wait for resolution. |
| C04 Talents | Eight specializations, 36 one-point nodes each (288 total). Three branching themes with alternate diamond routes/cross-links. Gates inspect allocated count before purchase: enhanced3, major5, advanced10, keystone15. Connected prerequisites, exclusive keystones, 20-allocation cap, bounded refunds and precise effect previews. |
| C04 Progression | One point per even level2–30, capped15 leveling points; up to5 mini-boss bonus selections. Points pool in the chosen tree. No auto-open on level-up; player-opened tree pauses the world. Character leveling can continue beyond30 without more leveling talent points. |
| C05 Minimap | Upper-right player-relative map, facing arrow, world boundaries, nearby solid terrain, discovered forge marker, revealed elite/mini-boss markers. Transient marker API also supports merchant/rift/trial/camp/major-boss icons; expired events disappear. Ordinary demons are omitted. Hidden while menus/rewards/talents are open. |
| C06 Ground XP | Every XP-awarding death creates/merges an actual animated blue crystal. XP is credited only after collection. Radius65 pickup/110 magnet, accelerated travel without physics blocking. Spatial buckets merge nearby values; at most480 crystals, with exact-value aggregation and pooled reuse. No timed XP deletion. Death/new run clears ground XP. |
| C07 Boss rewards | Deferred reward notification opens a paused three-way choice: bonus talent point, persistent gold, or 180s damage blessing. Claims are unique; failed gold saves leave choice pending. After5 talent selections, that option becomes a survival blessing. Eligible weapon/ordinary gold drops remain. |
| Warrior appendix | Four distinct full kits: Berserker, Vanguard, Spellblade and new Warlord; all16 abilities. Existing supplied Knight art and FX reused. SPACE remains Dash. Weapon-affix effects stay on LMB. See Warrior companion report for exact kits. |

## Blood Mage details

- **Blood Lance:** 300 base damage,20 energy,4s cooldown; aimed world projectile, baseline4 targets,650 range,560 speed. Hemorrhage adds one refreshed4s bleed,20 damage every0.5s. Crimson Spear repeats once after0.25s at50%; no recursive repeat.
- **Crimson Veil:** 50 barrier,15 energy,12s cooldown, provisional3s duration. Absorbs damage before HP and never heals automatically. Talent modifiers change its barrier, cooldown or lifetime.
- **Sanguine Drain:** hold E,25 energy once,8s cooldown,2s maximum. Tick at0.5/1/1.5/2s for120 base damage each. Steer narrow beam with mouse; movement65%, with applicable channel-control talents. Release, Blink, death, stun or lost target line of sight cancels. Releasing E also cancels a queued Drain before activation. Other casts wait until channel ends. Channel pressure keeps energy recovery at3/s.
- Drain heals20% of actual primary HP removed, capped24 per base tick/96 per base cast. Overkill cannot heal on nonexistent HP. Empty, forge-protected/immune and terrain hits cannot heal. Blood Feast and healing efficiency may raise limits, with hard144 combined cast ceiling. Torrent chains once within150 at50% damage/25% healing and shares the same cap. No horde multiplication.
- **Blood Eclipse:** cursor zone,50 energy,40s cooldown,5s duration,100 base damage per second/target; five base ticks. Duration changes retain bounded ticks with proportional final partial tick. No default healing. Dominion consumes eligible bleed once per target for a burst capped120, with20% shorter Eclipse.
- **Other named talents:** full successful Drain empowers next Lance30%; Living Veil converts25% allowed overheal to a3s barrier capped40; Undying Blood leaves1HP plus50 barrier on a fatal hit,90s internal cooldown. These are provisional concrete coefficients for the PDF's named refinements.

New Warrior/Blood active values bypass the old global×2 multiplier; character-level active damage growth and defenses still apply. Ordinary weapon stats never scale these actives. Existing elemental Mage bases retain their earlier tuning while gaining relevant graph refinements. Global health/movement/energy talents are applied as class passives; swaps do not refill health or energy.

## Forge and reward defaults

Stat/behavior prices: Common50/not eligible, Magic75/150, Rare100/200, Legendary150/300, Mythic200/400, Ascendant300/600. Reforge1 and50 cost the same. Conversion is flat400; lock250 and existing quality progression remain. Slot count, rarity, ceiling, signature restrictions and compatible pools remain intact. Paid pending proposals survive reload in schema5. Both proposing and settling use revision-checked atomic persistence.

Mini-boss gold options are125/175/250/350 across0–5/5–10/10–20/20+minute bands. Damage blessings are10/12/15/18%; survival replacement20% damage reduction. One active blessing refreshes/replaces the prior blessing, never stacks, and expires after180s simulation time. Bonus points and buffs reset with the run; selected gold banks immediately.

Mini-boss HP follows proposed elapsed-time bands:15k before5min;17k→22k during5–10;25k→40k during10–20;40k→60k during20–30; gradual growth thereafter. This supersedes the earlier level-only Mini-Boss health slope. Existing Dune Ravager attack mechanics remain.

## Architecture and assets

New modules: `ground-xp.js`, `minimap.js`, `boss-choices.js`, `blood-mage.js`, `talent-data.js`, `talent.css`, `warrior.js`, `warrior-render.js`. Existing specialization, combat, Mage, survival, weapon/save and game UI modules integrate them. Reforge proposal state is durable; talents/XP/rewards/buffs are run-only. Basic-hit IDs prevent one150-enemy swing from generating50 Overload shockwaves: one successful manual strike is counted once, including distinct Twin contacts, with recent IDs bounded128 and secondary effects excluded.

Only one new selected asset ships:33-frame blue XP gem from Super Pixel Item Pickups Fantasy Pack1, Will Tice/Untied Games. Square-padded atlas and `prepare-xp.py` retain source reproducibility. Existing Knight, Mage and packed FX provide the remaining artwork. No full packs, PDFs, credentials or runtime test data are shipped.

## Verification

Focused feature checks passed for flat forge costs/atomic proposal persistence and resolution, all talent gates/effect indexes/point caps, and all Warrior kits including bounded boss stagger and manual-strike proc limits. The combined integration smoke passed ground XP exact conservation/merging/magnet/collection-only leveling, six-family reach, actual basic-hit metadata, Blood Mage four skills and channel safeguards, reward uniqueness/save-failure recovery/caps/buff expiry, elapsed-time boss HP and minimap coordinate/expired-marker handling. Main integration check was rerun after the actual strike-ID and time-band changes. Main game syntax passed. No exhaustive legacy-suite or production duplicate pass.

Brief local browser preview verified four Mage choices including Blood Mage, actual Crimson Veil cast/energy/cooldown, upper-right minimap, 36-node Blood graph/details and paused UI. No captured browser errors. Screenshot: `tmp/reference/v092-blood-talents.png`.

## Limits and next review

- Dense-wave and boss numerical checks are functional checks, not an FPS benchmark or proof of balanced time-to-kill. Node values, footprints and secondary coefficients need player feel review.
- Graph is scrollable at smaller viewport widths. Existing Knight sheets are reused for different Warrior skills; bespoke animation sheets are not added.
- The source PDF names merchant, shrines, rifts, trials, Blood Moon, major bosses and realm abduction as existing global invariants. Those systems were not implemented in the starting build and were not invented as extra change-order features. They remain future milestones; minimap icon support is ready for their event services. Realm-boss nonfatal-death regression is therefore not applicable yet. Existing single battlefield, forge, waves, elite packs and Mini-Boss remain.
- Older regression fixtures for replaced five-level trees, direct kill XP and immediate reforges have historical expectations; this release's focused suites cover the new interfaces. A full legacy test migration was not substituted for the user's requested playable progress.
- Next: play the new Warrior/Blood kits, check crystal collection pace and point availability, review graph choices, then tune the proposed balance values. Continue from this reference and the original PDF.
