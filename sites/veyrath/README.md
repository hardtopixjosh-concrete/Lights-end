# VEYRATH — combat playtest 01

The authoritative working design is `../../GAME_REFERENCE.md`. Read it and the root `AGENTS.md` before changes. The PDF and original asset packs remain at the workspace root.

Movement, approved sword combo, corrected vertical reach and Space dash remain. M2b adds manual RMB Heavy Cleave: slower, wider 110-damage sweep with stronger impact/hurt reaction, 2.5-second cooldown and recovery-only dash cancel. Enemy attacks, parry/slam/ultimate and progression remain deferred. Await user cleave-feel review before the next ability.

Serve `dist/` using a static HTTP server (ES modules require HTTP). Run `node --test tests/*.test.js` for movement and combat checks. No npm installation or build is required. `prepare-assets.py` uses Pillow and reads the original asset ZIPs at the workspace root to prepare the current milestone's assets, verifying knight row directions against labeled source PNGs. Do not add the full ZIP packs to this checkout.

Use focused smoke checks for small increments; reserve the full suite and longer browser passes for larger updates or concrete failures. Do not repeat successful checks during packaging. `dist/dash.js` contains dash timing, movement and cancel rules; incoming-damage testing is deferred until enemies can attack.

`dist/simulation.js` contains input-vector, direction, collision and scene definitions. `dist/combat.js` contains pure combat state and hit rules. `dist/game.js` owns browser input, rendering and UI feedback; `dist/sound.js` owns synthesized audio. Movement/damage/timing defaults are provisional tuning seeds, documented in the master reference.

Deployment identity is preserved in `.openai/hosting.json`; use the Sites skill workflow for source synchronization and private publication. Never persist source credentials here.
