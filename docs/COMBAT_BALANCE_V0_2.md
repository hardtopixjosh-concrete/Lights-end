# VEYRATH — Combat Balance V0.2

Historical damage targets: superseded by `COMBAT_FEEL_REVISION.md` after the user requested four to five basic hits against the smallest enemies. HP, timing and scaling rules remain unless explicitly replaced.

Adopted October 14, 2026 from the user's explicit combat balance instructions. Supersedes earlier baseline enemy HP, LMB damage, LMB family speed seeds, and base critical values. Longsword and Orb are confirmed anchors; other weapon numbers remain initial playtest values.

## Level-1 enemy HP

| Enemy type | Base HP |
|---|---:|
| Small Swarmer | 400 |
| Standard Demon | 650 |
| Medium Demon | 1,000 |
| Heavy Demon | 2,000 |
| Elite Demon | 4,500 |
| Mini-Boss | 15,000 |
| Major Boss | Individually balanced; no implemented major boss yet |

## Level-1 basic attacks

Values precede critical strikes, quality, affixes and skill upgrades. Mage basics remain free and arcane-colored. Family affects LMB only.

| Class | Family | Damage per contact | Interval | Normal contacts against 1,000 HP |
|---|---|---:|---:|---:|
| Warrior | Longsword | 250 | 0.45s | 4 |
| Warrior | Twin Blades | 120 | 0.22s per strike | 9 |
| Warrior | Throwing Axe | 320 | 0.65s | 4 |
| Warrior | Greatsword | 460 | 0.90s | 3 |
| Warrior | Halberd | 340 | 0.70s | 3 |
| Warrior | Warhammer | 550 | 1.10s | 2 |
| Mage | Orb | 200 | 0.90s | 5 |
| Mage | Wand | 105 | 0.20s | 10 |
| Mage | Staff | 270 | 0.55s | 4 |
| Mage | Spellbook | 80 per projectile | 0.80s per five-projectile cast | Depends on projectiles hitting |
| Mage | Scepter | 90 per damage tick | Continuous; 0.20s ticks | 12 |
| Mage | Grimoire | 110 per wisp | 0.65s per two-wisp cast | 10 individual wisp hits |

Base LMB critical chance is 5%; critical multiplier is 1.75. Longsword critical damage is exactly 437.5; Orb critical damage is 350. Runtime retains basic damage to two decimal places rather than rounding half-point crits to an integer.

## Implementation details and boundaries

- Shared data: `sites/veyrath/dist/combat-balance.js`. Weapon geometry, source animations, behavior affixes, swept body hitboxes, terrain and mutual forge shield remain intact.
- All three Longsword combo poses now deal the same baseline 250; old 45/50/65 combo damage seeds no longer determine LMB. Twin Blades retains two contacts in a 0.44s animation cycle, each 120, spaced 0.22s apart. Basic hitstop no longer lengthens the attack clock; active Cleave/parry hitstop remains separate.
- Basic attacks bypass the old global ×2 damage multiplier and uncapped character-level +6% damage. Active abilities and incoming enemy attacks retain their existing damage/scaling/rounding. Ordinary weapon attack affixes continue to affect LMB only; permitted character passives remain unchanged.
- Effective weapon level remains `min(character level, stored ceiling)`. Basic base damage grows 3.5% per effective level above 1, retaining the previous provisional slope, and stops at ceiling. Numerical affixes retain 40%→100% restoration and behavior identities stay fully active. Quality remains +2% per rank.
- To preserve exact unmodified level-1 anchors, stored intrinsic item base rolls start at neutral 1.0 and restore their stored variance linearly toward the ceiling: `1 + (storedBase - 1) × (effective - 1)/(ceiling - 1)`. Ceiling-1 items stay neutral. Stored items, rolls and saves are preserved; no rerolls or inventory replacement.
- Enemy spawn-time HP is `round(baseHP × (1 + 0.02 × (playerLevel - 1)))`. This 2% slope is an implementation playtest default, not a user-approved fixed balance. Existing enemies do not gain HP on each player level; existing 90s enrage behavior remains.
- Existing light AI/body is reused for Small Swarmers and Standard Demons: 35%/65% of light spawns. Existing bruiser AI/body is reused for Medium Demons; after 90s, 25% of bruiser spawns use Heavy Demon HP. Existing bruiser appearance chance, movement, footprints, XP, spawn pressure and attack behavior stay unchanged. These HP-tier distribution values are provisional; this batch adds no new enemy behaviors/models.
- Initial enemy and elite followers use Small Swarmer HP. Leaders use Elite HP; Dune Ravager uses Mini-Boss HP. Existing elite resistance/wards remain, so 4,500 HP does not imply 4,500 effective damage against armored elites.

## Verification and next review

One focused integration smoke exercises real sustained attacks for the two anchors and eight other weapon hit counts; melee/Mage timing, paired contacts, continuous beam ticks; five pages/two wisps and per-projectile damage; exact crit values and probability threshold; effective-level ceiling and level-1 intrinsic normalization; affix/active separation; unchanged Cleave/spell/incoming damage; every ordinary HP tier plus scaled elite/follower/mini-boss spawns. The initial multi-projectile fixture stopped before the cast contact frame; extended that fixture's time budget and it passed. Rechecked the same focused smoke after preserving existing active-damage integer rounding. Updated superseded numeric legacy fixtures without running broader suites.

No browser/visual pass for this numerical batch and no duplicate production pass. Actual crowd clear, moving elite time-to-kill, and whether Orb's 0.90s close-range cadence feels competitive remain playtest review, not verified by stationary target counts. Preserve the five-pulse anchor when tuning Orb cadence later unless the user changes it.
