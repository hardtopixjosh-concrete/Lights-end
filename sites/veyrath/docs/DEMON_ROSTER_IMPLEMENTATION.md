# Progressive demon roster — October 15, 2026

User-approved direction: early simple mobs, gradual model variety/ranged, distinct bigger elite/rift families, bold purple/orange names. See GAME_REFERENCE.md latest checkpoint for actual mechanics, values, checks and limits. The catalog and original demon archive are source materials; pack names alone do not add mechanics.

| Group | Supplied family | Introduction | Visual scale/name |
| --- | --- | --- | --- |
| Opening | Imp1 | Start | Existing1.25 |
| Armored melee | Demon Spawn4 | 60s appearance/90s heavier roles | 1.25/1.65 |
| Ash Hexer | Demon Spawn8 | 180s;2 active,4 after360s | 1.55/pale blue |
| Elite/camp leader/hunter | Demon Elite3 | Existing encounter schedule | 2.65/Stone2.9;bold purple |
| Rift Ravager/Brute | Demon Beast4 | Accepted rift waves | 2.0/2.3;bold orange |
| Dune Ravager | Existing Beast1 | Existing mini-boss schedule | Existing/amber |

Ranged enemies replace regular spawn rolls and retain bounded pressure. Visible .9s locked windup, slow165 projectile,3.8–4.2s recovery; clear line of sight,2 simultaneous casts,12 projectiles. Terrain, Forge barrier, dodge immunity and parry apply. No homing or shotgun volley. Existing shots may remain after caster dies. Torso hit volumes follow new model scale; solid collision remains at feet.

Files: demon-roster.js data; enemy-ranged.js AI/projectiles/telegraph; survival.js roster/AI hooks; rewards.js and world-events.js explicit special assignments; game.js rendering/labels; projectile-contact.js model contact dimensions. Selected art/provenance: DEMON_ASSETS.md. Reproduction: prepare-demon-variety.py.

One focused integration command tests/demon-variety.test.js includes pacing and world event checks because spawn/role interfaces changed. No broad or duplicate production pass. Numbers remain initial playtest tuning; no new server persistence or performance guarantees. Menu Preview enemy models is explicit QA only; reset after using it for normal play.
