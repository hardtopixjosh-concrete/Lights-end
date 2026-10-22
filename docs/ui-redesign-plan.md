# VEYRATH UI redesign plan

Status: **all three batches built October 16 (fx-89, fx-90, fx-91). Remaining: painted icons from the user, and the title/class-select screen (moved to `docs/main-menu-plan.md`). Class select/title screen moved to `docs/main-menu-plan.md`.** See log-systems.md.

> **Superseded in part (user, October 16): `docs/main-menu-plan.md` is the final word** on the title screen, Inventory, the Unlocks shop, Reroll/Banish charges, free "Heal instead" on level-up, Blink/Dash upgrades, evolutions (later), and game modes. Where this file says otherwise, that plan wins. Lines changed for this are marked *(→ main-menu plan)*.

Written October 16, 2026, while another session builds the boss and character models. Implementation waits until that session is finished. This file is the only one this planning pass touched.

Sources read: `AGENTS.md`, `GAME_REFERENCE.md`, `docs/reference/design.md` (controls, levels, forge, menu rules), `docs/reference/decisions.md` (UI-related entries), the V0.8, V0.9.2 and Mage PDF transcripts (UI/HUD/menu/inventory/tooltip passages), `docs/ASSET_CATALOG.md`, and the current code: `dist/index.html`, `style.css`, `talent.css`, `skill-ui.js`, `level-cards.js`, `status-icons.js`, `bosses.js`, `minimap.js`, `fps-overlay.js` and the HUD/menu parts of `game.js` (version tag fx-86 at the time of reading).

---

## 1. What the design documents actually say about UI

The PDFs say a lot about *rules* and almost nothing about *looks*. The look now comes from the user's reference screenshots (section 3).

### PDF-confirmed (must keep)

| Rule | Source |
|---|---|
| Tone reference: "the precision of Diablo and Path of Exile" with Vampire Survivors pressure | V0.8 p.1 |
| The environment stays visually below combat telegraphs, loot and enemy silhouettes | V0.8 p.3 |
| Weapon rarity colours: Gray > Blue > Purple > Orange > Yellow/Gold > Red; red tier gets flames and a distinct aura | V0.8 p.9 |
| Inventory, forge and skill menus pause the solo game | V0.8 p.4, p.12, p.22; V0.9.2 |
| Inventory: one equipped weapon, hover/click inspect, **compare damage, speed, reach, affixes and affected skills**, favorite protection, confirm before salvaging equipped/favorite, rarity beam on important ground loot, overflow chest so no weapon is lost silently | V0.8 p.12 |
| Every upgrade choice shows a precise tooltip with real numbers, which spell it affects and a preview of the change | V0.9.2 p.6 (written for talent nodes; the cards replaced the nodes, so it now applies to cards) |
| Permanent upper-right minimap: player arrow and facing, terrain, forge after discovery, revealed events with icon priority, no ordinary-enemy clutter, no phantom boss markers, never covers reward/talent screens | V0.9.2 C05 |
| Optional events are found through subtle landmarks/map hints, not constant full-screen prompts | V0.8 p.20 |
| UI separate from simulation | V0.8 p.22 |
| Multiplayer menu "bubble": 15 s damage protection when a menu opens, visible timer in the menu, 30 s cycle, no reset exploit | V0.8 p.22 annotation. **Unresolved, multiplayer only. Not part of this redesign.** |

### Recorded chat decisions that touch UI

- Minimap is a round, bronze-ringed lens in map colours; M or Esc opens a paused full map (Oct 16).
- Boss HP bar appears only once the boss is engaged (hurt or within 650 px); boss spawn shows "<NAME> SPAWNED" (Oct 16, fx-71).
- Level-ups open a card choice (3 cards; spell/behaviour picks on fixed levels); the K panel is a read-only Spellbook; respec is removed (Oct 15).
- Warrior uses Rage (0–100), Mage uses Energy; the old R-cooldown globe is replaced (Oct 15).
- Volume sliders default 50 %, Music 15 % (Oct 15–16).
- Enemy status badges above heads with a time-left ring (Oct 15). Keep these; they are already good.
- Graphics quality menu, F3 FPS overlay and "Copy performance report" stay available.

### Assets

The 15 supplied packs contain **no UI frames, panels, buttons or fonts.** Useful for UI are only:
- *Pickups Fantasy 1* / *Objects And Items*: coins, gems, hearts, potions, keys, relics, souls → icons for gold, healing, XP, rewards.
- FX packs (Gigapack, Fantasy FX 1/2, Projectiles): single frames of fire, ice, lightning, blood, wind effects → could be cropped into **spell icons**.
- Already shipped: `pickup-heart.webp`, XP crystal and coin sprites.
- Fonts: Cinzel (headings, via Google Fonts) and Inter (body) are already in use.

Panel frames, borders and buttons therefore have to be drawn with CSS (gradients, borders, small inline SVG ornaments). That is cheap and keeps the game buildless.

---

## 2. Current UI inventory and problems

General problems that run through everything:
1. **Two visual languages.** Panels are dark green-black (`#242a24`) with pale gold text, which fights the warm sand map. The minimap was just made bronze; nothing else matches it.
2. **Text instead of pictures.** Abilities, buffs, curses, rewards and cards are all words. No spell icons anywhere.
3. **Duplicates.** HP, XP, level, gold and the K/I buttons each appear two or three times on screen.
4. **Leftovers from older rules.** Several labels describe removed systems (talent points, respec, "BLADE STORM" globe, "K talent graph").
5. **Player settings and developer tools live in the same pause menu.**
6. **Small bug spotted while reading:** `hudSet(..., 'class:spell-locked', ...)` never toggles the CSS class, because `hudFlush` only handles `class:energy-short`; every other `class:` key just writes a dead JS property. So locked spells never look locked. (Fix in Batch 1.)

### In-run HUD (always on screen)

| # | Element (code) | What it shows today | Problems |
|---|---|---|---|
| H1 | Top bar `.topbar` (brand "V VEYRATH / Sands of the Sovereign", build tag, "Controls ?" button) | Title strip 100 px tall with dark gradient | Decorative, eats screen, stale tagline "Hold the expanse" |
| H2 | Location card `.location` ("THE SUNDERED EXPANSE" + flavour line) | Static text, top left | Never changes; collides with world-status text below it |
| H3 | Compass `.compass` (big "N") | Top right | Redundant: the minimap already shows north |
| H4 | Bottom bar `.bottom` (class seal "Ⅰ SWORDSMAN", WASD/LMB/RMB/Esc hints, ⚙ Settings) | Full-width dark gradient | Tutorial text left on forever; sits behind the combat HUD; hints only say Warrior keys |
| H5 | Right "run" panel `.target-panel` | Run clock, phase, kills, "hunting you" count, HP text + bar, gold/points, Upgrades K + Inventory I buttons, weapon name, forge arrow, level/XP text, combo text, **"Restart run" button** | Big box of mixed text; HP, XP, level and both buttons repeat the bottom HUD; a one-click restart sits in the combat HUD |
| H6 | Combat HUD `.combat-hud`: health globe + wing, 5 ability tiles (RMB/Q/E/R/Space), XP bar with level medal, right globe, SKILLS K / INVENTORY I buttons | Diablo-style centre bar | Tiles are text only; cooldown is a thin bar, not a sweep; element IDs are named after Warrior abilities (`cleave/parry/slam/storm`) even for Mage; no LMB/weapon tile; locked state shows only the word "Locked"; right globe still labelled "BLADE STORM" in HTML; "not enough energy" is only 50 % opacity |
| H7 | Boss bar `#boss-hud` | Name, HP numbers, direction arrow, thin bar, top centre | Small and flat for the game's main moments; no phase marks or shield/exposed state (canvas `drawBossBar` in `bosses.js` draws those but is **never called**) |
| H8 | Minimap `#minimap-wrap` + full map `#bigmap` | Round bronze lens; M full map with emoji legend | Recently redone and fine. Only the emoji legend and the "M map" caption need to match the new style |
| H9 | Mini-boss reward button `#reward-open` | "Mini-boss reward · n" | Plain button; easy to miss |
| H10 | World status `#world-status` | Curse/buff timers as one text line joined by "\|" | Hard to read mid-fight; no icons |
| H11 | Interact prompt `#world-interact` + canvas "F TO USE FORGE" | Two different prompt styles | Inconsistent |
| H12 | Toast `#toast` | One message, 3 s, bottom centre | New messages overwrite old ones; boss spawn, level, loot and errors all look the same |
| H13 | FPS overlay (`fps-overlay.js`, F3) | Graph + numbers | Fine as a tool; only restyle to match |

### In-world canvas text (drawn in the game view)

| # | Element (code) | Problems |
|---|---|---|
| W1 | Damage numbers (`numbers[]` in game.js) | One style for damage, heals, reactions; no crit/elemental colour |
| W2 | Enemy name tags + HP bars (`drawDemon`) | Inter font, different look from boss bar |
| W3 | Elite telegraph labels "PARRY · SWEEP", "DODGE · SMASH", "SAFE" (`elite-fx.js`) | Fine function, style differs |
| W4 | "LEVEL UP · n" text over the player | Plain text |
| W5 | Healing pool refill timer (`healing.js`) | Plain number |
| W6 | Weapon loot on the ground (`drawWeaponLoot`) | Rarity beam is good; the weapon itself is two coloured rectangles; no name on hover/nearby |
| W7 | Enemy status badges (`status-icons.js`) | Good, keep. Reuse the same badge style for player buffs |

### Screens and panels (pause the game)

| # | Screen (code) | Problems |
|---|---|---|
| S1 | Loading `#loading` (big "V", progress, Retry) | Plain; fine to keep simple |
| S2 | Welcome / class select `#welcome` | Class buttons are text; path picker uses emoji icons; footnote still says "Q / E / R specialization skills · K talent graph" (old rules) |
| S3 | Pause menu `#menu` ("V0.9.2 Playtest tools") | Mixes camera/sound/graphics settings with collision debug, enemy previews, event visits, spawn boss, summon elite, drop weapon, reset; ends in a wall of control text and credits |
| S4 | Spellbook `#skills-panel` (K) | Header still says "RUN UPGRADES / Upgrade your active abilities" and "Earn a talent point every even level…" (removed rule) |
| S5 | Level-up cards `#levelup-panel` | Text cards with a coloured top border; no icon; spell cards do not show the before/after numbers the PDF asks for |
| S6 | Mini-boss reward `#reward-panel` ("VICTORY SPOILS") | Plain buttons |
| S7 | Armory / Forge `#armory-panel` | List + detail; **all forge buttons always shown**; still has "Refund path upgrades · 50 gold" (respec was removed); no side-by-side compare with the equipped weapon (PDF requirement) |
| S8 | Salvage confirm `#salvage-confirm`, Forge old/new choice `#forge-choice` | Plain |
| S9 | World event panel `#world-panel` (shrine, camp, merchant, rift) | Plain text cards |
| S10 | Game over `#gameover` | Summary is one line of text |
| S11 | Victory `#victory` | Small side panel for the biggest moment of the run |
| S12 | Developer tools (`developer-tools.js`) and VFX Lab (separate page) | Tools; VFX Lab is out of scope |

---

## 3. Target look — user reference screenshots (October 16)

> **User decision (October 16):** the in-game menu, bottom bar, level-up screen, "Your build" panel and unlocks menu should look **exactly like the five reference screenshots the user supplied**, but with **orange, yellow and red** accents instead of the screenshots' cyan/blue. "Your build" opens by **holding Tab**. This replaces my earlier "bronze and obsidian" and "clean modern" proposals.
>
> The screenshots are from another game. They set the **look and layout only**. They do not add its mechanics (auto spells, embers, heroes) to VEYRATH. *(→ main-menu plan: Reroll and Banish charges and a free "Heal instead" are now added on the level-up screen; Skip is not; weapon/skill evolutions come later in their own design.)* Open details are in section 5.

### Shared style (taken from the screenshots)

- **Panels:** dark slate-navy glass (about `#121826` at ~92 %), 1 px light border (`#ffffff1a`), **rounded corners** (~12 px on panels, ~8 px on rows/tiles), soft dark drop shadow. The game behind a menu is dimmed, not blurred.
- **Rows:** each setting/list item is its own rounded dark row (`#0f1422`) with a thin border, label on the left, control on the right.
- **Font:** a heavy, rounded modern sans (the screenshots look like Segoe UI / Nunito style). Proposal: **Nunito** (Google Fonts, weights 600/800), with system sans fallback. Titles big, bold, wide letter spacing ("PAUSED", "UNLOCKS", "YOUR BUILD"); small section headers in spaced caps. Cinzel is dropped from the in-game UI (could stay on the title screen logo only).
- **Key chips:** small dark rounded boxes with the key name ("Esc", "R", "Backspace", "Tab", "1"). Used on buttons, tiles, cards and footer hints.
- **Accent colours (user: orange, yellow, red):**
  - Orange `#ff9a2e` — primary accent: selected/focused button border, slider fill and thumb, "Power" card border and tag, owned-upgrade pips, ready ultimate tile.
  - Yellow/gold `#ffc94a` — currency, section titles ("HEROES", "TOOLS"…), "Equipped", locked-item names, level number highlights.
  - Red `#e8414a` — HP bar, danger buttons (Abandon, Salvage), warnings.
  - Neutral gray-white `#c9cfdb` — "Passive"/stat card border and tag (as in the screenshot).
  - Spell/element colours stay inside the icons only (fire orange, frost ice-blue, storm violet, blood crimson, arcane cyan). Weapon rarity colours (*PDF*) stay on weapon names and loot.
- **Icons:** square tile with a dark inner background, a coloured 2 px rounded border, and a **painted-style spell icon** filling it. Painted icons will be supplied by the user (decision).

### Pause menu (screenshot 1) — replaces S3

- Centred tall panel, big "PAUSED" title.
- Button row: **Resume `Esc`** (orange-bordered, focused), **Restart `R`**, **Menu `Backspace`** (back to the title screen, with a confirm *(→ main-menu plan)*). Second row: **Abandon `X`** (red border; ends the run as a death, weapons and gold kept). While paused these keys do not cast spells.
- A short centred control summary for the current class (e.g. "WASD move · mouse aims · LMB weapon · RMB/Q/E/R spells · Space Blink · hold Tab for your build · M map · I inventory").
- Setting rows, each a rounded row: Camera scale (slider), Music / Background / Effects volume (orange sliders with % at the right; defaults stay 15/50/50 *decision*), Graphics quality (dropdown Auto/High/Medium/Low/Lowest), Spell effects (shader VFX on/off), Enhanced graphics (bloom), Pack ability effects, Drifting dust, Show FPS (F3).
- Bottom: "Copy performance report" as a small outlined button. All developer tools only with `?debug` (*decision*), in an extra "Developer" section at the bottom of the same panel.
- The other screens (Spellbook K, Armory I, world-event panel, game over, victory, salvage confirm, forge choice, class select, loading) use the same panel, title, row and button style.

### Bottom bar (screenshot 2) — replaces H4, H5, H6

- Centred at the bottom, no frame around the whole bar:
  1. **HP bar** — wide red rounded bar, "HP 180 / 250" centred in bold white.
  2. **Level/XP bar** — thin dark bar under it, "LV 7" left and "120 / 300" right, fill in orange/yellow.
  3. **Resource bar (VEYRATH addition):** thin cyan Energy bar for Mage / ember-red Rage bar for Warrior, same style as the XP bar. The screenshot game has none; VEYRATH needs it.
  4. **Ability tiles** — big square tiles (~80 px) with the painted icon, key chip in the top-left corner ("LMB", "RMB", "Q", "E", "R", "SPACE"), spell name in small gray text under the tile. VEYRATH has **six** slots (screenshot has four). Cooldown: tile darkens and shows the seconds left in big bold text (like the "5 %" ultimate tile). Not enough Energy/Rage: icon dims and the border turns red. Not learned yet: dark tile with "Lv 6" in the middle. The **R** tile gets the orange "ultimate" border when ready (screenshot's Space tile).
  5. **Clock chip** right of the tiles: "12:34" big, "213 kills" small, rounded dark box. Phase (Day / Night / Blood Moon) goes under the minimap.
- Gold and "picks waiting" sit as small chips next to the clock chip (VEYRATH addition).
- Removed: both globes, the wings, the right-side run panel, top bar, location card, compass and bottom hint bar (*decision: minimal HUD*).

### Level-up (screenshot 3) — replaces S5 and S6

- Game dimmed; big white "Level up" title; under it "Pick a card: press 1, 2 or 3, or click."
- Three tall rounded cards. Each card: number key chip top-left (1/2/3), category tag top-right in spaced caps, icon tile centred, bold name, **5 progress pips + "Level n"** (how many times this card has been taken), the effect with exact numbers (*PDF*: real numbers, which spell, preview of the change), and an optional coloured note line.
- Card borders/tags mapped to VEYRATH's offers:
  - **NEW SPELL** (levels 1/6/12/18) — orange border, tag "NEW SPELL", note line "Goes on Q".
  - **BEHAVIOR** (spell behaviours) — orange border, tag "BEHAVIOR", note line names the spell it changes.
  - **STAT** cards — gray-white border, tag "PASSIVE", as in the screenshot.
  - **Spell insight** (mini-boss) and **mini-boss reward** (gold / blessing / insight) — yellow border, tag "REWARD".
- The screenshot's "Evolves with Haste" line has no VEYRATH mechanic. Use that line only for real links that exist (e.g. an elemental reaction: "Frozen enemies shatter under Fireball"). See open question 7.
- "Decide later" stays as a small text button under the cards.

### Your build — hold Tab (screenshot 4) — replaces the Spellbook as the in-fight view

- While **Tab is held**, a panel appears top-left over the game (game keeps running, like the screenshot; it closes on release). Bottom-left a tiny hint "TAB  HOLD FOR BUILD" with the owned spell icons in a row and their pips.
- Sections, each with spaced-caps header, then rows of icon + name + one line:
  - **WEAPON** — equipped weapon in rarity colour, its LMB behaviour and affixes in one line each.
  - **SPELLS** — RMB/Q/E/R owned spells with their current numbers; unlearned slots show "Unlocks at level 12" in yellow (the screenshot's "Locked" style).
  - **BEHAVIORS** — learned spell behaviours with pips.
  - **STATS** — taken stat cards with their total (e.g. "Power ×3 · +24 % damage").
  - **BLESSINGS & CURSES** — active buffs/curses with time left.
- **The K Spellbook is removed** (user, October 16). Tab is the only build view; K is freed.

### Armory / Forge in the unlocks layout (screenshot 5)

- Panel with big "UNLOCKS" title, a one-line subtitle, a currency counter top-right, a scrolling list grouped by yellow section headers with "x / y" counts, each item a rounded row: icon tile, bold name + spaced-caps type tag, description, and a right-side **Buy (price)** button / "Equipped" / requirement + progress bar. Footer key hints ("Up Down choose · Enter buy or equip · Esc close") and a Close button.
- **User decision (October 16): this layout is used for the existing Armory / Forge** (sections: Equipped, Weapons by rarity, Forge actions with gold prices on the Buy buttons, Salvage). *(→ main-menu plan: a separate **Unlocks shop**, paid with the existing gold, now uses this same layout too: colour runes, Reroll/Banish charges, Blink/Dash upgrades, evolutions "coming later". Inventory gets a rune slot per weapon. Still no new currency.)*

### Other HUD pieces (same style)

- Boss bar: wide rounded red bar top centre, bold name above, phase marks; only once engaged (*decision*). "<NAME> SPAWNED" as a big centred title like "Level up".
- Buffs/curses: small rounded icon tiles top-left with a time ring.
- Messages: small rounded dark chips stacking at the left; big moments use the large centred title.
- Interact prompt: key chip "F" + bold verb above the bottom bar ("Use forge", "Trade").
- Minimap: keep the round map (*decision*), swap its bronze ring for the new slate border + orange player arrow; phase label under it.
- In-world text: bold rounded sans numbers with dark outline; crits larger and orange/yellow; heals green; reactions in their element colour.

---

## 4. Build order (3 large batches)

All per-frame DOM writes keep the rule: **only through `hudSet(el,key,v)` + one `hudFlush()` per frame, change-only**, with element references looked up once. Batch 1 extends `hudFlush` so any `class:<name>` key toggles that class (fixes the dead `spell-locked` toggle) and adds a `var:--name` key for CSS variables (rounded, change-only) for bar widths and cooldown overlays.

Line numbers are from fx-86 and will shift after the boss/character session; re-locate by function name.

### Batch 1 — Style foundation, bottom bar, HUD, Tab build panel

| File | Change |
|---|---|
| `style.css` | New tokens (panel, row, border, radius, orange/yellow/red accents, font), Nunito import; new bottom bar, clock/gold chips, boss bar, buff tiles, message chips, big title, interact prompt, Tab build panel; delete `.topbar`, `.location`, `.compass`, `.bottom`, `.target-panel`, `.hud-wing`, globe rules |
| `index.html` | Remove H1–H5 and globes; new bottom bar (HP, XP, Energy/Rage bars, 6 tiles with names, clock chip), build panel + Tab hint, buff row, message stack, big title, single interact prompt. Keep tile IDs `cleave/parry/slam/storm/dash` (RMB/Q/E/R/Space) to limit churn; add an LMB tile |
| `game.js` | `hudSet`/`hudFlush` (~615). Main per-frame HUD block (~312–325): bars, clock chip, LMB tile, drop writes to removed elements. `updateMageHUD` (~624), `updateWarriorHUD` (~652), `configureClassUI` (~629), `configureAbilityLabels` (~160): icons, cooldown text, short/locked states. Key handler: Tab keydown/keyup shows/hides the build panel (preventDefault so focus doesn't move); build panel content built only when opened. `updateWorldHUD` (~683): buff tiles + one prompt. `toast` (~207): message stack + big-title helper. `drawForgeLabel` (~502) removed. Damage numbers, "LEVEL UP" text, `drawDemon` name/HP bar, `drawWeaponLoot` nameplate: new font/style |
| new `ui-icons.js` | Data only: spell/behaviour/stat/buff id → icon image + border colour |
| new `assets/icons/*.webp` (+ small prep script) | Painted spell icons **supplied by the user**; until they arrive, temporary placeholder icons (pack frames or drawn symbols) through the same `ui-icons.js` lookup so swapping is data-only |
| `skill-ui.js` | Becomes the Tab build-panel row builder; K Spellbook removed (`#skills-panel`, `openSkills`/`refreshSkills`, the K key and the SKILLS K button) |
| `bosses.js` | Reuse `drawBossBar` phase/shield logic for the DOM bar, or delete it (unused) |
| `minimap.js`, `elite-fx.js`, `healing.js`, `fps-overlay.js` | Colours/fonts only |

### Batch 2 — Pause menu, level-up, all other panels

| File | Change |
|---|---|
| `index.html` | Pause menu as in screenshot 1 (buttons with key chips, control summary, setting rows, `?debug` Developer section); level-up layout; reward panel merged into level-up cards; class select, Spellbook, world panel, game over, victory, salvage/forge confirm in the shared panel style |
| `style.css` + `talent.css` | Panel, row, select/slider, button, card components; merge `talent.css` into `style.css` |
| `game.js` | Menu open/close + keys Esc/R/Backspace/X while paused (spell keys ignored while paused); Restart/Abandon confirm; `renderLevelUp` (~659) + keys 1/2/3; `renderBossChoice` (~657) into the same cards; `renderPathPicker` (~158), `refreshSkills`, `renderWorldPanel` (~675), `showVictory` (~132), game-over handler (~286) |
| `level-cards.js` | "Before → after" text, pip count (times taken), tag/category per offer (read-only data use, no balance change) |
| `developer-tools.js` | Mounted in the `?debug` Developer section |

### Batch 3 — Armory / Forge in the unlocks-list layout

| File | Change |
|---|---|
| `index.html`, `style.css` | Screenshot-5 layout for the Armory/Forge: sections, item rows with icon, tags, Buy/Equip/price buttons, compare block for the selected weapon (*PDF*: damage, speed, reach, affixes, affected skills), keyboard hints |
| `game.js` | `openArmory`/`renderArmory` (~167–200), equip/favorite/salvage/forge handlers, `renderForgeChoice` (~653); remove the stale "Refund path upgrades" button |
| `weapons.js` / `affix-data.js` | Read-only use of describe helpers; small compare helper only if missing |

After each batch at build time: one shared cache-tag bump, a log entry in `docs/reference/log-systems.md`, Current state update in `GAME_REFERENCE.md`, and the decisions below copied to `decisions.md`.

---

## 5. Open questions for the user

Answered: Q1 style and Q3 HUD amount (screenshots + minimal), Q4 dev tools (`?debug` only), Q5 unlocks layout → Armory/Forge, Q6 icons → user supplies painted icons, Q8 K Spellbook → removed.

Still open (small, can be settled at build time):

7. **"Evolves with …" line on cards:** no evolution mechanic yet. Show only real links for now (elemental reactions, which spell a card changes). Evolutions are planned for later *(→ main-menu plan)*; add the line when they exist.
9. **Panel colour:** proposal: dark navy-slate exactly as in the screenshots, only the accents change to orange/yellow/red.
10. **Pause keys R and X:** confirm Restart = R and Abandon = X while paused (both with a confirm step).
11. **Icon list for the user:** at build time, give the user the exact list of icons needed (per class path: each RMB/Q/E/R spell, Blink/Dash, weapon families, behaviour and stat cards, buffs/curses) with size (128×128 PNG, square, no frame) so they can supply them.

Unresolved, not part of this redesign: the multiplayer menu "bubble" timer (V0.8 p.22); single player keeps pausing.

---

## 6. Decisions to record

(Copy into `docs/reference/decisions.md` at build time, with date, replaced rule and affected systems.)

- **October 16 — Minimal fight HUD.** User chose the minimal in-run screen. Replaces: top bar, location card, compass, bottom control-hint bar and the right-side run panel (its Restart moves to the pause menu). Affects index.html, style.css, game.js HUD block/updateMageHUD/updateWarriorHUD.
- **October 16 — Developer tools only with `?debug`.** All playtest/developer controls hidden from normal players; shown in a Developer section of the pause menu only with `?debug`. Replaces the mixed "Playtest tools" pause menu. Affects index.html, game.js menu handlers, developer-tools.js.
- **October 16 — UI look from user reference screenshots.** The in-game pause menu, bottom bar, level-up screen, "Your build" panel and unlocks-style list must look exactly like the five reference screenshots the user supplied (dark slate rounded glass panels, rounded rows, key chips, heavy rounded sans, big square icon tiles with key labels and names, HP bar + level bar above the tiles, numbered level-up cards with tag, icon, pips and exact numbers), **with orange, yellow and red accents instead of cyan/blue**. Replaces the Cinzel/gold-on-green panels, Diablo globes and wings. Screenshots set look only, not mechanics (Reroll/Banish/Heal-instead and the Unlocks shop were added separately by the user, see `docs/main-menu-plan.md`). Affects index.html, style.css, talent.css, game.js HUD/menus, skill-ui.js, level-cards.js.
- **October 16 — Hold Tab for "Your build".** Holding Tab shows a build panel (weapon, spells, behaviours, stats, blessings/curses) over the running game; releasing closes it. New key binding. Affects game.js input + HUD, index.html, style.css.
- **October 16 — Armory/Forge uses the unlocks-list layout.** User chose the screenshot-5 layout for the existing Armory/Forge *Amended Oct 16 (→ main-menu plan): a separate gold-priced Unlocks shop (meta-progression) is now wanted and uses the same layout; no new currency.* Affects index.html, style.css, game.js renderArmory/forge handlers.
- **October 16 — User supplies painted spell icons.** Placeholder icons until then, wired through one data lookup. Affects ui-icons.js, assets/icons.
- **October 16 — K Spellbook removed.** Replaces the October 15 read-only K Spellbook; holding Tab shows the build instead. Affects index.html, game.js (openSkills/refreshSkills, K key), skill-ui.js, talent.css.
- **October 16 — Pause menu keys.** Resume Esc, Restart R, Menu Backspace (→ title screen), Abandon X (as in the reference screenshot), active only while paused. *Proposal pending user confirmation of R/X while paused.*

---

## 7. Navy & gold redesign (October 17, user reference images) · BUILT fx-146

**User decision (Oct 17):** one consistent "premium fantasy action-RPG" style across **everything**: main menu, character lobby, armory, settings, unlocks, best runs, results, **and** the in-game HUD, pause menu, level-up cards, Tab build panel, in-run inventory and the F2 test menu. It replaces the October 16 slate-and-orange look (section 3). Reference: three user mockups (lobby with armory open, main menu, lobby) plus a written style brief.

### Style system (from the brief)
- **Colours:** panel base `#071522`, navy surface `#10283D`, antique-gold borders `#A88B52`, bright gold selection `#E6C581`, ivory text `#F1EBDD`, blue-grey secondary text `#A5B6C8`, cyan-blue interaction `#55B9E8`. Rarity colours appear only as small markers or subtle borders.
- **Panels:** dark navy glass at 75–90% opacity, light blur behind, faint vertical gradient and inner sheen. Thin gold border, **square corners**, an occasional clipped corner, and small diamond marks on dividers and selected tabs.
- **Type:** Cinzel (already loaded) for titles and headings in spaced caps. Inter (already loaded) for body text, stats and hints. Nunito is dropped.
- **Buttons:** translucent blue-black fill, fine gold outline, ivory/gold label. Primary buttons get a soft blue inner glow. Hover is brighter blue. Selected is a bright gold outline plus a check or diamond. Disabled is muted with no glow. No big glows, no pills, no rounded cards.
- **Avoid:** large rounded cards, pill controls, grey or white frosted panels, neon, heavy bloom, oversized icons.
- Because all of batches 1–3 use the `--ui-*` tokens, a token swap plus new shape rules restyles most existing UI at once.

### Screens
- **Main menu:** "Light's End" logo with the tagline from the mockup ("The dark has a king", to be confirmed). A left column of framed buttons with icons: **Play** (Enter), **Armory**, **Unlocks**, **Best runs**, **How to play**, **Settings**. Gold top right, ↑/↓ and Enter hints bottom left, version bottom right. **Background: the live scrolling map (user)**, not a painting.
- **Character lobby** (replaces the 3-column Prepare Run): top bar with ← LOBBY, PREPARE YOUR RUN, gold and a settings gear.
  - **Left panel:** class name and subtitle, the **path** list (icon, name, two-line description, radio/check), and a **spell preview** row of 4 icons.
  - **Centre:** the selected character **scaled up from the real game sprite** on a glowing pedestal (user: painted art later), with "YOU · MAGE" under it. Next to it an **Invite friend slot marked "Coming later"** (user). A character carousel (Warrior / Mage portraits with ‹ › arrows).
  - **Right panel:** YOUR LOADOUT (weapon tile, name, kind, **Open armory**), **Colour rune** tiles (Default plus owned runes, check on the selected one), **Safe pocket** (item + Store loot).
  - **Bottom bar:** Mode dropdown, Change (modifiers), a status line, START RUN.
  - **Background: a fixed ruins spot of the map at night** (user), darkened behind panels.
- **Armory (inside the lobby):** slides in from the right over the centre-right while the character stays visible on the left. It has ARMORY with "Shared across characters", the capacity count and a close ✕, For <class> / All Weapons tabs with a diamond underline, search and rarity, a 4-wide tile grid with small rarity markers and an "E" badge, and a detail panel (large art, Basic attack line, Damage/Speed, Affixes, EQUIP, the 70% salvage, favorite ☆). The bottom strip holds Equipped and Safe pocket ("Drag into storage", STORE). The title-screen Armory button opens the lobby with the armory already open.
- **Results, settings, unlocks, best runs, how to play:** same frames and buttons.
- **In-game:** the HUD bars, slot tiles, level-up cards, pause menu, Tab build panel, in-run inventory and F2 menu all move to navy/gold/serif with square slots. The layout stays as built.

### Art still missing (placeholders until supplied)
Large character art (scaled sprites for now), weapon art and spell icons (line glyphs for now), and the rune tiles (coloured gems drawn in CSS).

### Open points
1. **Start Run with a full pocket:** the mockups show START RUN disabled with "Store your safe-pocket item before starting". On Oct 17 the user chose to **allow** starting with a full pocket. Keep that (status line as a reminder only) unless the user says otherwise.
2. **Tagline:** "The dark has a king" appears in the mockup; confirm it's wanted.
3. **Which ruins spot** for the lobby background: pick a ruined area near the map centre; the user can choose another.

### Build order (proposal)
1. **Style swap everywhere:** tokens, fonts, square frames, buttons and states across HUD, pause, level-up, build panel, inventory and F2. Files: style.css (new tokens and override block), small markup touches in index.html.
2. **Main menu:** new title layout over the live map. Files: index.html (`#fe-title`), style.css, front-end.js (keys and focus).
3. **Character lobby + armory overlay + results:** lobby layout, scaled sprite pedestal, carousel, right loadout panel with rune tiles, armory slide-in, fixed ruins night camera for the lobby. Files: index.html (`#fe-loadout`), front-end.js (`renderLoadout` split into lobby and armory), game.js (front hooks and the lobby camera spot), style.css.
4. **Other menus:** unlocks, best runs, how to play, settings, results restyled.

### Decisions to record (Oct 17)
- Navy & gold style everywhere (replaces the Oct 16 orange/slate UI look).
- Lobby characters use scaled-up game sprites until painted art arrives.
- Co-op slot shown as "Invite friend · Coming later".
- Lobby background is a fixed ruins spot at night; the main menu keeps the scrolling map.
