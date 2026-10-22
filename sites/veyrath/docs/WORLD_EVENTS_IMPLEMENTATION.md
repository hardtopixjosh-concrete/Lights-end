# Optional world events — implementation, October 15, 2026

Current behavior, numeric defaults, verification and limits are recorded in GAME_REFERENCE.md under the October15 world-events checkpoint. This batch follows original V0.8 PDF pages13–16/21 and their opt-in/merchant annotations. The V0.9.2 class, XP, talent and forge changes remain in force.

Modules: world-events.js owns state, placement, director gates, curse/buff lifecycles, enemy creation, stock and transaction requests. world-render.js owns supplied-asset rendering. game.js connects F/dialogs, persistence, event processing, status and minimap. Combat/survival/resource hooks consume temporary modifiers; ordinary item affixes remain scoped as previously defined.

Simulation timers pause in menus. Merchant stock and pending world rewards are run-only; saved purchases/claimed gold and weapons are permanent through the existing local armory. A full reload resets this run. No server-authoritative economy, multiplayer synchronization, global seed director, major-boss/realm/trial/Blood Moon system or performance benchmark is claimed. Merchant menus pause existing enemies; they do not add a new shield.

Three camp blessings can coexist, each refreshes instead of stacking with itself. Shrine Glass/Crimson damage rewards affect basic attacks; this is a prototype interpretation consistent with current skill/weapon separation, available for feel review. New placements use nearby clear centers and surrounding samples, not a complete pathfinding/reachability proof. Safety checks skip an unavailable placement.

Playtest tools in Menu visit ready landmarks, forcing merchant/rift availability only when requested. They do not grant gold or auto-complete fights. Normal exploration does not teleport.

Selected artwork and reproduction: WORLD_EVENT_ASSETS.md and prepare-world-assets.py. Focused executable smoke: tests/world-events.test.js. Source packs and design PDFs are excluded from the Site source and deployed assets.

October15 follow-up: see PACING_POLISH.md for shared capped pressure, encounter coordination and renderer changes. This supersedes earlier statements that automatic bosses defer only during rifts; all accepted optional fights now defer automatic elites and mini-bosses.
