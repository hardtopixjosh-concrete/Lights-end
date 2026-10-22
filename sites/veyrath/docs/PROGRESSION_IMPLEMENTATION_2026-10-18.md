# Progression handoff implementation — October 18, 2026

Implemented in the local `sites/veyrath/dist` build. Not published. This checkpoint supersedes conflicting progression/economy statements in the older core redesign report. The original handoff remains the design source; this report records actual behavior, not proven balance.

## Confirmed choices

- Rarity order: white, blue, purple, yellow, orange, red. Existing numeric IDs and item collections are preserved. Both interface and 3D weapon palette match.
- Unranked gameplay runes initially; no paid rune levels.
- Keep the 30-minute world clock. XP thresholds also remain unchanged pending measurements.
- Final victory recognition: Normal and Endless, solo or co-op; Modified and cheat-assisted runs do not qualify.
- Realm event remains disabled until its boss exists. Future victory guarantees a personal red weapon for each eligible participant. No boss mechanics changed.

## Implemented

**Weapon investment:** discovery ceiling no longer limits effective character level. Character scaling applies once. Permanent power uses existing +0–5 investment, with provisional +8 percentage points per rank; numerical bonus availability is 40% at level 1, reaching 100% at level 20. Power upgrades cost 50/100/200/350/550. Tier promotions cost 100/300/600/1200, stop at orange, add one eligible stat affix, and preserve existing affixes and power. Existing paid reforge choices and reverse conversions remain. No invisible rarity damage multiplier. Forge displays protection status and current/full power bonus.

**Account progression:** fresh accounts have no gameplay runes or slots. Three slots cost 100/400/800; each initial rune costs 200, so first usable setup costs 300. Initial effects cover attack, abilities, barriers, healing, health, melee reach and ranged spell travel. Range does not enlarge areas; Ranger Quickstep is excluded. Rune effects apply only to relevant actions; a kit without a ranged spell gains no spell-travel benefit. Loadouts lock at run start. These are provisional content values. Cosmetic weapon runes remain separate.

**Helpers:** base two rerolls and one banish; one additional permanent purchase at 600/800. Charges refresh per run and only manipulate stat offers. Existing accounts with older extra helper tiers retain their purchases rather than being wiped.

**Corner bosses:** one personal weapon and run-long blessing per distinct corner kind. Recorded encounter-start anchors position equipment. Choices are offense, health or healing/barriers; collecting all four strengthens those chosen blessings. Old universal Soul and temporary pit reward packages no longer apply. Duplicate/repeated kills do not grant extra major rewards. Shared XP remains separate from personal rewards.

**Trials:** first two qualifying successes grant a personal bonus development, with at most three eligible choices. Pending and spent picks share the cap. If none is legal, the choice remains pending and does not stall other available level choices. Later successes award gold and a purple/yellow weapon. Trial crit/guard/gold temporary bonuses were removed. Entry states the remaining bonus allowance. Completion uses the encounter roster, includes downed participants, excludes late entrants and rejects duplicate completion IDs. Remote participants own separate counters and reward lists.

**Shrines:** completing the interaction reveals personal gold, useful healing or blue equipment choices. Gold is permanent; equipment appears at the recorded interaction position and follows run-bag retention. Choices are consumed once; old curse contracts are replaced.

**Victory and retention:** final victory banks equipped/pocket/full bag and 1,500 gold, then presents three saved orange items, of which one is kept. Pending offers survive reload and do not reroll. Full permanent storage uses overflow. Eligible claim unlocks the local Tyrant Slayer achievement and Tyrant’s Gold spell color in Unlocks. Endless banks that victory checkpoint; subsequent loot remains at risk. Failure/restart/abandon retain equipped and pocket only from carried items, without deleting uncarried armory items or treating every old class-equipped reference as protected. A paid candidate belonging to a lost item is archived rather than leaving an invalid save.

**Realm preparation:** `progression.js` supplies disabled scheduling/encounter state; `realm-rewards.js` supplies frozen personal entitlements and settlement; `weapons.js` supplies duplicate-safe red auto-pocketing. A displaced pocket item moves to the bag or remains a personal ground item when full. No live realm enemy, portal or active reward trigger exists. Generic rewards, shrines, crafting and the final boss cannot generate new red drops. Debug spawning remains a cheat.

**Persistence:** collection version 7 archives prior ceiling/base/quality; menu version 2 adds account fields. Before-migration backups preserve original local records. Gold plus account purchases use a recoverable write-ahead transaction. An interrupted purchase blocks further purchases until recovery rather than spending twice. Existing paid items and legal fallback starters survive migration.

**Measurement:** Best Runs now exports the latest 20 recorded attempts as JSON. Records include starting weapon/runes/helpers, level arrival times, collected XP, world/real duration, activity rewards, forge changes, party size, blessings/trial count, retained item identities and outcome. This is lightweight local instrumentation, not a complete analytics service. It does not automatically judge whether a retained item is useful, capture every spending source, recover an abruptly closed attempt or replace representative full-run testing.

## Checks performed

- `tests/progression-handoff-smoke.mjs`: migration repeatability, four promotions preserving rolls, five power ranks, rune ownership, interrupted purchase recovery, failure/victory retention, persistent orange choice, red-pocket overflow, inactive realm adapter/entitlements, personal blessings, deferred trial picks, actual host/guest trial handler isolation and late-join exclusion, shrine consumption and generic boss drop restrictions.
- Core redesign fixtures 1–3 pass. Fixture 1 expectations updated only for the newly approved power/ceiling rules; a real starter migration repeatability bug was fixed.
- Network audit passes: message-handler/run isolation, ordered input, duplicate rejection, pause handling and four-guest transport fixture.
- All 91 runtime JavaScript files pass syntax checks.
- Hidden local browser smoke: fresh slot+rune purchase equips successfully and deducts 300; normal gameplay and five simulated players run without JavaScript errors; a cheat-assisted final victory offers three orange weapons, claims exactly one and does not unlock recognition.
- Reload with a persisted eligible victory restores all three exact offers and successfully unlocks recognition on claim. Victory layout checked at 1500×950 and fixed to fit (1120×472 panel). Shop and victory screenshots retained under root `tmp/`.
- Electron emitted a GPU teardown diagnostic after the visual harness exited; application console/runtime error lists were empty. This was a hidden test harness, not the recommended player launcher.

## Practical limits and next review

This is a playable implementation, not proof of an economy or difficulty target. No representative full 30-minute attempts, 50-run campaign simulation, real multi-PC Steam party session, support-class kits or realm boss were tested or added. Achievement storage is local to this browser profile, not a Steam achievement integration. Network reconnect/disconnect and interrupted personal-activity deliveries still need a real party acceptance pass; the fixtures cover eligibility and duplicate guards, not every transport failure.

Use the existing local browser at `http://127.0.0.1:8765/` and hard-refresh once. Keep the same browser and host spelling to use the same local saves. Try fresh and invested accounts, attack/ability/hybrid builds, and different optional routes; export Best Runs afterward. Tune prices, XP and pressure from these results before claiming the intended very difficult final victory or any particular number of attempts.
