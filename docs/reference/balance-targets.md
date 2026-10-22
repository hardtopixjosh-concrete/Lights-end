# Balance targets (user decision, October 18, 2026)

Every class path, including future classes, is tuned to sit in the band set by the October 18 balance pass. Check it with the balance report before a new class or path ships, and after any change to spell or weapon numbers.

## How to measure

From `sites/veyrath`: `node tests/balance-report.mjs [level]` (default level 30, ~15 s). It writes `sites/veyrath/docs/validation/balance-report.md` and `.json`.

Fixture: 60 s per run, level 30, equal Common +5 weapons, crits off, no incoming attacks, no Insight. **Boss** = one moving target. **Crowd** = 5 clustered moving targets, total damage. Each path is run with every eligible weapon and both an attack-focused and a spell-focused build. Spell builds try two rotations (spend greedily / save the resource for a ready E or R) and keep the better one. The table compares the **best setup per path**.

A new class must be added to the report's `CLASSES`/`ELIGIBLE`/`NAMES` tables (and its request/tick/release calls) so that it is measured the same way.

## Target band (level 30, best setup per path)

| Measure | Target | Hard limits | Oct 18 result |
|---|---|---|---|
| Boss DPS | about **2,000–2,450** | flag below 1,900 or above 2,500 | 1,980–2,434 |
| Crowd DPS (5 enemies) | about **7,000–11,000** | flag below 6,500 or above 11,500 | 7,249–10,955 |
| Crowd ÷ boss | about 3–5× | flag above 5.5× (one spell multiplying across a group) | 3.0–5.0× |

Support, control or tank paths (e.g. Warlord, Cryomancer, Vanguard, Blood Mage) may sit at the low end of the crowd range, because the report does not measure buffs, freezes, shields, healing or survival. They should not sit below the hard limits for boss DPS.

## Approved exceptions

- **Gunslinger Rifle** (Oct 18, user: "Accept, like the Archer"): Rifle 190 per shot / 1.1 s. With the spells build the Gunslinger reaches 2,747 boss DPS, because its spells get more casts with the Rifle equipped; lowering Rifle damage barely changes it (2,555 at 120). Kept above the band on purpose.
- **Archer** (Oct 18, user): fully charged Power Shot 350 with a 1 s charge is kept, so the Archer sits above the band (2,831 boss / 11,400 crowd). Don't tune it back down without asking. A 1.4 s charge would bring it to about 2,440.

## Oct 18 reference table (after tuning)

| Subclass | Boss DPS | Crowd DPS |
|---|---:|---:|
| Archer | 2,434 (2,831 after the approved 350 Power Shot) | 10,955 (11,400) |
| Berserker | 2,416 | 8,549 |
| Spellblade | 2,397 | 7,254 |
| Gunslinger | 2,302 | 8,431 |
| Warlord | 2,279 | 7,249 |
| Ninja | 2,282 (reworked kit, Oct 18) | 10,831 |
| Stormcaller | 2,157 | 8,263 |
| Alchemist | 2,116 | 10,504 |
| Pyromancer | 2,077 | 9,975 |
| Vanguard | 2,004 | 9,296 |
| Blood Mage | 2,000 | 8,511 |
| Cryomancer | 1,980 | 7,898 |

## Lessons from the Oct 18 pass

- Outliers came from one spell, not a whole class: Power Shot (pierce + 1 s cooldown), Fan the Hammer, an 80%-uptime Wrath buff, a Fireball that re-exploded on every bounce. Measure single-spell output (allow only one key) when a path is out of band.
- Effects that repeat on each bounce/pierce/wave multiply crowd damage without touching boss damage; tune their falloff, not the base hit.
- Rage paths are limited by Rage income. Lowering a spell's Rage cost moves DPS far more than raising its damage (Spellblade).
- Simulation fixtures must not sit at map (0,0): `blocked()` treats it as out of bounds and rushes/charges stop.
- These are damage-only numbers. Survival, movement and crowd-control value still need real playtests.
