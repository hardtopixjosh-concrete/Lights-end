# VEYRATH working roadmap (agreed October 16, 2026)

This is the working list for the overnight batches. Status is kept current here. Details of how each item was built go in the matching `docs/reference/log-*.md` entries.

Legend (updated Oct 16 morning): ☐ to do · ◐ in progress / partial · ☑ done (smoke-checked; user playtest pending)

## Run structure (user decisions, Oct 16)
- **30-minute run.** At 30:00 every enemy dies off, normal spawning stops, and the final boss arrives with a big warning. Win: victory screen, big gold and a guaranteed high-rarity weapon. Lose: the run ends like a normal death.
- **Main bosses:** Ashen Butcher 7:30 · Hollow Prophet 15:00 · Obsidian Colossus 22:30 · Final boss 30:00. Each keeps the existing 3-way reward choice (Spell insight / gold / blessing).
- **Pit bosses**, like Dragon/Baron in League of Legends: the Dune Ravager and the Dune Wyrm live in walled pits on the map outskirts. They are optional, stay inside their pit, respawn some time after being killed, and grant a buff plus rewards.
- **Day/night:** day 0–12 · night 12–20 (+20% pressure) · Blood Moon 20–24 (+50% pressure, faster enemies) · dark dusk 24–30 leading into the final boss.
- **Trials:** one walled colosseum with one entrance, placed in code so the Tiled map stays untouched. Each visit offers a random trial of the 5, and it recharges after a few minutes.
- **Elemental reactions:** within each path's own kit, e.g. Pyro Meteor detonates burn, Cryo Glacial Burst on a frozen enemy makes shatter shards, Storm lightning on Vortex-pulled enemies causes an overload chain, Blood Eclipse on bleeding enemies makes a blood geyser.

## Final boss: giant crimson demon (elite demon sprite ~4×, black/red, burning aura)
Six mechanics:
1. **Cataclysm:** a huge arena-wide attack. Safe zones appear, and you must run into one before it lands.
2. **Hellfire Charge:** 3 telegraphed lines, then 3 charges in a row that leave burning trails.
3. **Bullet-hell Spiral:** rotating fireball spirals, denser at low HP.
4. **Shadow Clones:** splits into 3. Only the real one has a shadow; hitting a fake makes it explode.
5. **Pylon Shield:** becomes invulnerable while 4 pylons stand, with minions attacking until they're destroyed.
6. **Closing Ring of Fire:** the arena shrinks for a while, forcing close range.

## Work list (agreed numbering)
| # | Item | Status |
|---|---|---|
| 1 | Unique spell behaviors (replace stat-type behavior cards, Warrior first) | ☑ |
| 2 | Impact sound hooks for the other paths (synth until recordings arrive) | ☑ |
| 5 | Charger enemy | ☑ |
| 6 | Guardian enemy | ☑ |
| 7 | Summoner enemy | ☑ |
| 8 | Population ramp per 5 minutes (12–40 → 165–180) + perf check | ☑ |
| 9 | Ashen Butcher (7:30) | ☑ |
| 10 | Hollow Prophet (15:00) | ☑ |
| 11 | Titans: Obsidian Colossus (22:30 main) + Dune Wyrm pit; Dune Ravager pit | ☑ |
| 12 | Day/night + Blood Moon | ☑ |
| 13 | Ancient Trials colosseum (Steel, Precision, Survival, Hunter, Unbroken) | ☑ |
| 14 | Elemental reactions (within-kit) | ☑ |
| 15 | 30-minute end + final boss | ☑ |
| 16 | Bug: area spells don't damage enemies out of line of sight from the caster (should hit based on the blast itself) | ☑ |
| 17 | Camps/shrines/world events scale with run time: harder later, gold small early → worth it late | ☑ |

Testing rule (user, Oct 16): test once at the end of the batch, fix what's broken, and don't re-test.

Not in this list (later): recorded sounds for the remaining paths (user generates them), healing pool art, omens/Sovereign, remaining weapon behaviors, multiplayer, account saves, balance pass.
