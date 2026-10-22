# VEYRATH — Early milestones log (M0-M2)

Entries are verbatim from the former single GAME_REFERENCE.md build log (split Oct 15), filed by primary topic, oldest first. Append new entries for this topic at the end.

### October 14, 2026 — M0 movement review corrections

- User chose 90% camera scale, reported incorrect movement facing and some collision mismatch, and asked whether map work should happen now or later.
- Default camera and playtest slider now start at 90%. WASD determines all eight walking facings; stopping retains last facing. Mouse movement has no walking/idle facing effect. Updated control labels and canvas keyboard focus.
- Identified overly large circular blockers (e.g. the small Stone A1 sprite was only 68 world pixels wide at .8 scale but had a 48-pixel radius). Replaced solid terrain circles with inspected per-asset ground pivots/contact polygons. Trees block at the trunk; rock bases use shallow footprints; ruined walls follow their slanted bases. Decorative plants/shadows remain non-solid.
- Rendering, depth sorting and collision now share the prop's actual ground anchor. Adjusted character ground pivot from source y104 to y96 after inspecting idle/run directional cells. Substep collision and wall sliding preserved.
- Ten simulation tests passed, including WASD-facing retention, rock close passage, palm canopy clearance, both ruined-wall ends and narrow-footprint tunneling. JavaScript syntax check passed.
- Local browser check: entered at default 90%, walked north then west, confirmed directional animation/idle facing, opened collision overlay and observed boulder base contact, then walked south and west around it. Wider map design and all combat remain deferred.
- Source helper reran all ten tests and syntax validation successfully, pushed source `0895c42c5e43042b0feec24e80aa4e827095d542` and packaged its exact static archive. Private deployment succeeded. Revision review URL: `https://veyrath-desert-roguelite.jestudios.chatgpt.site/?build=0895c42c`.
- The existing browser initially displayed a cached older root page after reload. Navigating with the revision query loaded the updated page. Authenticated production check verified updated controls, 90% default slider, walking west, retained west-facing after moving/clicking the mouse to the right, and authored collision overlay. Published review screenshot: `tmp/reference/movement-collision-published.jpg`.
- Limits: footprints are hand-inspected approximations; not every object/angle has been user-tested. M0 still awaits user's movement/collision review; no next major milestone started. Camera preference is approved at 90%.

### October 14, 2026 — M0 direction rows and low-foliage correction

- User reported up/down and diagonals facing backwards (horizontal directions were correct), and clarified that orange bushes caused front/behind overlap popping.
- Found the assumed sheet row order was vertically reversed. Matched the first Idle and Run frames for all eight rows against labeled `1Knight/<action>/<direction>/` PNGs in the original ZIP; all sixteen comparisons matched exactly. Correct order: E, SE, S, SW, W, NW, N, NE. Earlier tests validated the mistaken assumption rather than the source artwork; corrected expected rows to the verified asset evidence.
- Corrected animation facing only; W still moves screen-up, S down, A left and D right. Updated initial/reset south-facing to row 2. Camera stays at 90%.
- Passable orange/low shrubs now render in the ground-foliage layer under the player, with explicit base pivots. This eliminates a whole-sprite depth swap during traversal. Tall solid scenery retains ground-pivot depth sorting and collision. Low shrubs remain non-solid, matching the existing test-area behavior; this is a rendering correction, not a new collision-design decision.
- Added revision query parameters to the game and simulation module URLs so the next build loads current code rather than cached modules.
- Eleven simulation tests passed, including source-verified direction expectations and ground-layer/passable bush behavior; syntax check passed. Local browser verified north/west/south movement and passage across an orange bush; the nearby boulder still occludes from behind. Review screenshot: `tmp/reference/bush-facing-fix.jpg`.
- Source synchronized as `4755628117d327911f74a9f2aa03da8556e1b573`, all eleven checks rerun by the helper, archive packaged and private publication succeeded. Review link: `https://veyrath-desert-roguelite.jestudios.chatgpt.site/?build=47556281`. Opened the authenticated production revision and checked walking; production bush traversal was not fully rechecked before the browser session ended. Still on M0, awaiting user feel review.

### October 14, 2026 — M1 accepted

- User reviewed the combat build and said “yea looks great.” Marked M1 accepted; current timing/reach/feedback become the working baseline, with numerical balance still provisional.
- Next suggested small step: M2a Space dash only, before heavy cleave/parry/slam/ultimate. The proposal follows the existing design; no new gameplay code or publication changes made during this approval-record update.
