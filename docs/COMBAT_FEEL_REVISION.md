# Combat feel, elite placement and loot revision

October 14, 2026. Latest user decisions replace V0.2's Medium Demon damage anchor with roughly four to five normal basic hits against the smallest enemies. Waller and Frostbound should aim ahead of the player's running direction rather than directly onto the player. Yellow and orange items should appear less often. Exact coefficients below are implementation starting values for those requests.

## Basic attack damage

Small Swarmer HP remains 400. At level 1, without crits, affixes, quality or skill bonuses:

| Weapon | Damage per contact | Existing interval | Contacts against 400 HP |
|---|---:|---:|---:|
| Longsword | 100 | 0.45s | 4 |
| Twin Blades | 48 | 0.22s per strike | 9 strikes |
| Throwing Axe | 128 | 0.65s | 4 |
| Greatsword | 184 | 0.90s | 3 |
| Halberd | 136 | 0.70s | 3 |
| Warhammer | 220 | 1.10s | 2 |
| Mage Orb | 90 | 0.90s | 5 |
| Mage Wand | 42 | 0.20s | 10 |
| Mage Staff | 108 | 0.55s | 4 |
| Mage Spellbook | 32 per projectile | 0.80s per five-shot fan | Depends on projectiles hitting |
| Mage Scepter | 36 per tick | Continuous, 0.20s ticks | 12 |
| Mage Grimoire | 44 per wisp | 0.65s per two-wisp cast | 10 individual wisps |

Most values are 40% of V0.2; Orb uses 45% to retain a five-pulse target. Heavy attacks require fewer contacts and fast weapons more contacts rather than imposing the same count on all families. Basic critical chance/multiplier remain 5%/1.75x. New reference crits: Longsword 175, Orb 157.5. Enemy HP/scaling, weapon effective-level ceiling, numerical and behavior affixes, attack timings, animations, hitboxes, collisions and active spells are retained. Bonuses and stronger/progressed enemies can change actual hit counts. The 1,000-HP Medium Demon is no longer the four/five-hit baseline.

## Elite placement

The simulation receives the current WASD movement vector multiplied by walking speed. Waller and Frostbound snapshot a point ahead of that vector, leading by one warning window of travel and clamping lead distance to 150–230 world units. Waller places five wall segments perpendicular to the running direction at 45-unit spacing; Frostbound places three ice fields across that route at 100-unit spacing. Ice retains its 0.85s warning and wall retains its 1s warning, so players can change direction before activation. Telegraph positions stay fixed after casting. With no movement input, placement falls 150 units beyond the player along the elite-to-player direction, rather than on their footprint. Existing power cadence, duration, frost slow, terrain checks, forge exclusions, wall occupancy checks and collision are retained. No new art is shipped.

## Rarity odds

Percentages are conditional on a weapon dropping:

| Rarity | Previous | New |
|---|---:|---:|
| Common | 50% | 55% |
| Magic | 28% | 30% |
| Rare (purple) | 14% | 13.75% |
| Legendary (orange) | 6% | 1% |
| Mythic (yellow) | 1.7% | 0.2% |
| Ascendant (red) | 0.3% | 0.05% |

Orange is six times rarer, yellow 8.5 times rarer. Red also remains below yellow in frequency. Existing per-kill weapon eligibility remains regular 0.15%, elite 5%, mini-boss 25%; no extra loot events or guaranteed rarity changes. Existing saved weapons are preserved. These new rarity weights are provisional tuning for the user's requested reduction, not newly fixed long-term requirements.

## Verification

One focused integration smoke passed actual four-hit Longsword/five-pulse Orb kills against 400 HP, ten weapon hit counts and cadence checks, fan/wisp counts, crit values, capped scaling, unchanged active/incoming damage and HP progression. The same check verifies the rarity distribution through stratified deterministic rolls and all eight running directions for both wall and ice: ahead-of-player placement, clear current footprint, warning phase and fixed telegraph positions after direction changes. Main game syntax check passed. No browser/visual pass or duplicate production pass; actual player feel remains the next review.
