# VEYRATH main menu / front-end plan

Status: **built October 16 (fx-92); see log-systems.md.** Values marked as proposals still need review. Written October 16, 2026. This file is the only one this planning pass touched. Build after the boss/character-model session, together with (or right after) Batch 2 of `docs/ui-redesign-plan.md`, which makes the shared panel/button/row style.

Labels used below:
- **PDF**: confirmed in the design PDFs.
- **Decision**: earlier recorded user decision.
- **User (Oct 16)**: the user's own list in this planning chat (the core of this plan).
- **Suggestion**: my proposal, not approved.
- **Needs design**: the user wants it, but how it works isn't defined yet. Don't build until settled.

---

## 1. The user's list (October 16, as given)

- **Play**
  - **Select character**: pick which character.
  - **Loadout**: pick which Mage etc. (the path); **pick which weapon from my inventory**; **buy power-up cards to start the run with**.
- **Inventory** button on the main menu.
- **Best run details**
- **Settings**
- **How to play**
- **Unlocks** (a shop):
  - **Colour runes**: e.g. buy a gold rune and put it on a weapon. It changes the colour of that weapon's skill animations.
  - New **evolutions for weapons**.
  - New **evolutions for skills**.
  - **Run helpers**: rerolls, banish, skip, heal, etc.
  - **Upgrades for Blink / Dash**.
- **Mode**
  - **Normal**
  - **Endless**
  - **Modified run**:
    - cooldowns 30 % faster and more regen, but enemies faster
    - 50 % more enemies spawn
    - double damage, half HP

**Follow-up answers (User, October 16):**
- Mode is picked **on the Loadout screen**.
- Modifiers **mix and match** (any combination). **No extra rewards** for modifiers.
- Endless **keeps going after the final boss and keeps getting harder** until you die.
- **Starting power-up cards: removed for now.**
- Shop currency: **the existing gold**.
- Reroll / Banish: **charges bought in Unlocks, used on the level-up card screen**. Skip charges were dropped (a free "Heal instead" covers skipping).
- Heal: on any level-up you can **skip the cards and take an instant heal instead, always free**.
- Weapon/skill evolutions: **later, in their own design session.** They're listed in the shop as "coming later".
- Forging: **only at the forge in the world**, not from the menu.
- Blink/Dash upgrades: **all four**: extra charge, shorter cooldown, longer distance, leaves an effect.
- Background/music: **live drifting desert + ambience** until a menu track is supplied.
- **No Credits button.**

## 2. What exists today

| Piece | Where | Notes |
|---|---|---|
| Loading `#loading` | `index.html` | "V" mark, progress, Retry |
| Welcome / class select `#welcome` | `index.html`, `configureClassUI` / `renderPathPicker` in `game.js` | One panel: Warrior/Mage toggle, 4 path buttons, "Enter the desert", "Choose starting weapon" (opens Armory), stale "K talent graph" footnote |
| Armory / inventory | `openArmory` / `renderArmory` in `game.js` | Permanent weapons, equip, favourite, salvage, forge. Saved in `veyrath-armory-v1` |
| Gold | `veyrath-wallet-v1` | Persists between runs. The only currency |
| Settings | inside the Esc pause menu | UI plan Batch 2 splits player settings from `?debug` dev tools |
| Level-up cards | `level-cards.js` | Behaviour/stat/spell cards during a run. No reroll/banish/skip today |
| Music | `desert-whispers.mp3` (in-game, **Decision** Oct 15), `background-quiet.mp3` (ambience) | No menu track |

Paths: Warrior has Berserker, Vanguard, Spellblade, Warlord. Mage has Pyromancer, Cryomancer, Stormcaller, Blood Mage.

The PDFs say **nothing** about a title screen, main menu, modes or a meta shop. Relevant PDF rules: menus pause the solo game; avoid unnecessary menu work; multiplayer is a future requirement; there's a permanent armory. Current rule (**Decision**): the path locks when you enter, and you pick your first spell as the run begins.

## 3. Visual style

Same as `docs/ui-redesign-plan.md` section 3 (**Decision** Oct 16): dark slate-navy rounded glass panels, rounded rows, key chips, Nunito, **orange / yellow / red accents**. The Unlocks shop uses the **screenshot-5 "UNLOCKS" list layout** (yellow section headers with x / y counts, rows with icon, name, tag, description, **Buy (price)** button).

Planned difference (**suggestion**): the VEYRATH logo on the title screen stays in **Cinzel**, gold with an orange glow (the UI plan allows this). No logo art exists in the packs. It's text until the user supplies art.

## 4. Flow

```
Loading ─► Title screen
             ├─ Play ─► Select character ─► Loadout ─► Start run ─► Run
             │            (Warrior/Mage)     (path, weapon, mode, starting cards)
             ├─ Inventory ─► weapons (equip, favourite, salvage, put runes on)
             ├─ Unlocks ───► shop (runes, evolutions, run helpers, Blink/Dash)
             ├─ Best runs ─► records
             ├─ How to play
             └─ Settings

Run ─Esc─► Pause ─"Menu"─► Title   (confirm: this run is lost, weapons + gold kept)
Run ends ─► Results ─► Play again (same loadout) │ Loadout │ Title
```

**Mode is on the Loadout screen** next to the Start button (User Oct 16). Cold start to fighting is then: Play → character → Start (3 clicks; the loadout remembers last time).

## 5. Screens

### 5.1 Loading (keep, restyle)
Logo instead of "V", thin orange bar, one rotating tip line. Fades into the title screen.

### 5.2 Title screen (User Oct 16 buttons; layout is a suggestion)
- **Background (User Oct 16):** the real desert map, camera drifting slowly at dusk, drifting dust and ambience on, a few demons wandering far off, no HUD. No new art needed. Fallback: a dimmed still frame of the map.
- **Left column:** logo, tagline (suggestion: "Sands of the Sovereign"), then the button stack:
  1. **Play** (focused, `Enter`)
  2. **Inventory**
  3. **Unlocks**
  4. **Best runs**
  5. **How to play**
  6. **Settings**
  - No Credits button (User Oct 16).
  - Hidden reserved slot: **Multiplayer** (future, PDF).
  - No Continue (no mid-run save) and no Quit (browser).
- **Corners:** gold counter bottom-left (also shown on Unlocks), version bottom-right.
- **Keys:** Up/Down, Enter, Esc = back.
- **Music (User Oct 16):** ambience only until the user supplies a menu track. `desert-whispers` starts when the run starts. "Click to begin" over the logo on first load, because browsers block sound until the first click.

### 5.3 Select character (User Oct 16)
- Two big cards: **Warrior** and **Mage**. Each shows the **real animated character** from the character-model session, idle on a dark stage (short attack on hover), a one-line role, resource tag (Rage / Energy).
- Click or `1` / `2` → Loadout. Last choice pre-selected.

### 5.4 Loadout (User Oct 16)
One screen, three blocks (layout is a suggestion):

| Block | What it does |
|---|---|
| **Path** ("which Mage") | 4 path cards for the chosen character: icon, name, 1–2 line playstyle. Locks when the run starts (**Decision**) |
| **Weapon** | Pick the weapon you start with **from your inventory** (User Oct 16). Shows its stats, affixes and rune. "Open inventory" link |
| **Mode** | Normal / Endless / Modified run, plus the three modifier toggles (section 5.9) |

Starting power-up cards were **removed for now** (User Oct 16).

Bottom: **Start run →** (primary, `Enter`), **Back**. The note "You pick your first spell as the run begins" stays if that rule stays.

### 5.5 Inventory (User Oct 16)
- The existing Armory, opened from the title screen, in the UI plan's Batch-3 unlocks-list layout (**Decision** Oct 16).
- From the menu: view, compare, equip, favourite, salvage. **New:** put **colour runes** on a weapon (one rune slot per weapon, suggestion).
- **No forging from the menu** (User Oct 16). Forging stays at the forge you find in the world.

### 5.6 Unlocks shop (User Oct 16)
Screenshot-5 list layout, gold price on each **Buy** button, sections:

| Section | Items | State |
|---|---|---|
| **Colour runes** | Gold, crimson, frost, void, etc. Bought once, kept forever, socketed on a weapon in Inventory or Loadout. Only changes the **colour** of that weapon's skill animations (cosmetic, no power) | Clear enough to build. Needs the FX to support recolouring (section 7) |
| **Weapon evolutions** | New evolutions per weapon family | Shown as "coming later". **Own design session** (User Oct 16) |
| **Skill evolutions** | New evolutions per skill/spell | Same: "coming later", own design session |
| **Run helpers** | **Reroll** (new set of cards), **Banish** (that card never shows again this run). Buy charges once (permanent); each run starts with that many uses on the level-up screen (User Oct 16) | Prices and max charges not set |
| **Blink / Dash upgrades** | **Extra charge, shorter cooldown, longer distance, leaves an effect** (e.g. brief invulnerability or a damage trail) (User Oct 16) | Tier count, values and prices not set. Values must not be invented; balance proposals need approval |

**Heal (User Oct 16):** not a shop item. On every level-up screen there's a free **"Heal instead"** choice: skip the cards and heal at once. How much it heals isn't set yet.

**Skip charges dropped (User Oct 16):** the free "Heal instead" already lets you skip the cards.

### 5.7 Best runs (User Oct 16)
- Best run per character and per mode (suggestion): time survived, kills, level reached, gold earned, path, weapon, mode/modifiers, date, bosses beaten.
- Plus totals (runs played, total kills). Stored locally like the armory.

### 5.8 How to play (User Oct 16)
- Short pages with key chips: Controls (per character), Your goal (survive, level up, bosses), Level-up cards, Weapons & forge, Rage / Energy, Modes. Text plus small icons. No video.
- The control summary stays in the pause menu too (UI plan).

### 5.9 Modes (User Oct 16)
| Mode | Meaning (user) | Open points |
|---|---|---|
| **Normal** | The current run | — |
| **Endless** | The run **continues after the final boss** and keeps getting harder (stronger enemies, bosses return) until you die (User Oct 16) | How fast it ramps and which bosses return isn't set |
| **Modified run** | Toggle any mix of: (a) cooldowns 30 % faster + more regen, but enemies faster; (b) 50 % more enemies spawn; (c) double damage, half HP. **Mix and match; no extra rewards** (User Oct 16) | How much "more regen" and how much faster enemies isn't set |

Best runs are kept separately per mode (suggestion), so modified runs don't mix with normal records.

The 30 % / 50 % / ×2 / ½ values are the **user's own numbers** (User Oct 16), not my proposals.

### 5.10 Settings
- One shared settings component, the same rows as the pause menu (UI plan section 3).
- Extra rows on the menu (suggestion): **Controls** (read-only list) and **Reset saved data** (red, with confirm).

### 5.11 Credits: not included (User Oct 16)
No Credits button. Check at build time whether any asset pack licence in `docs/ASSET_CATALOG.md` *requires* attribution. If one does, a small line in How to play or Settings covers it.

### 5.12 Results (death / victory)
The UI plan restyles these. This plan adds: run summary, a "New best!" marker, gold earned, and buttons **Play again** (same loadout), **Loadout**, **Title screen**.

## 6. Conflicts and things to settle before building

### 6.1 Conflict with `docs/ui-redesign-plan.md`
That plan (section 3 + Decisions) says the reference screenshots do **not** add "evolutions, reroll/banish/skip" to VEYRATH, and that the unlocks layout is used for the Armory **with "no new unlock system or currency"**. The user's list (Oct 16) now **asks for** an Unlocks shop with exactly those items. Under the authority order, the latest user decision wins, but that plan and its decision entries must be updated to match. **Resolved (user, Oct 16): this plan is final; `ui-redesign-plan.md` was updated to match.**

### 6.2 Still to settle (numbers and later designs)
1. **Weapon and skill evolutions:** own design session (User Oct 16). VEYRATH has no evolution system yet.
2. **Numbers not set:** gold prices for every shop item, max Reroll/Banish charges, Blink/Dash tier values, how much "Heal instead" heals, how much "more regen" and "enemies faster" in modifier (a), Endless ramp speed. Propose these at build time and mark them as proposals until approved.
3. **Balance:** permanent upgrades (shop) make runs easier over time. This is a new kind of meta-progression the PDFs don't describe. User's choice, recorded as new.

### 6.3 Save data
Everything new (runes, unlocks, best runs, last loadout) would use browser-local storage like the armory. GAME_REFERENCE says local storage is **not** an approved permanent save architecture. Fine for now, but bought unlocks can be lost if browser data is cleared.

## 7. Build notes (for whoever implements)

- Own module for the front-end state machine (e.g. `front-end.js`); `game.js` only gets `startRun({character, path, weaponId, mode, modifiers})` and "return to title". Reroll/Banish buttons and "Heal instead" live on the level-up screen (`level-cards.js` + the UI plan level-up layout). Data-only files for shop items (`unlocks-data.js`) and modes (`modes-data.js`). This keeps UI separate from simulation (**PDF**).
- Modes are multipliers on existing tuning (`combat-balance.js`, `run-director.js`, `encounter-pacing.js`). No forked game logic.
- Colour runes need the weapon/skill FX to take a tint/palette (likely through `vfx-recipes.js` / `warrior-fx.js` / `mage-spell-fx.js`). Check cost before promising it for every effect. Sprite-sheet FX may need hue-shifted cached copies.
- Suggested build order:
  1. **Front-end shell:** title, character select, loadout (path + weapon + mode), inventory, settings, how to play, best runs, results buttons.
  2. **Modes:** Normal / Endless / Modified.
  3. **Unlocks shop:** colour runes, Reroll/Banish charges, Blink/Dash upgrades; "Heal instead" on level-up.
  4. **Evolutions**, after their own design session.

## 8. Open questions for the user

All the big questions were answered on October 16 (section 1). Left over:

1. **Numbers** (prices, charges, Blink/Dash tiers, heal amount, modifier (a) regen/enemy speed, Endless ramp): proposed at build time for your approval.
2. **Evolutions:** in their own design session later.

## 9. Decisions to record

(Copy into `docs/reference/decisions.md` at build time, with date, replaced rule and affected systems.)

- **October 16: Main menu contents.** Title buttons: Play, Inventory, Unlocks, Best runs, How to play, Settings. **No Credits button.** Background: live drifting desert map; ambience only until a menu track is supplied. Play → Select character → Loadout. Replaces the single welcome/class-select panel. Affects index.html, style.css, game.js welcome flow, new front-end module.
- **October 16: Loadout screen.** Choose path ("which Mage"), the starting weapon from the inventory, and the mode (on the same screen). Starting power-up cards were proposed then **removed for now**. Replaces the path picker + "Choose starting weapon" button. Affects game.js run start, armory.
- **October 16: Inventory on the main menu.** View/compare/equip/favourite/salvage and socket colour runes. **No forging from the menu**; the forge stays in the world. Affects armory UI.
- **October 16: Unlocks shop (new meta-progression), paid with existing gold.** Colour runes (cosmetic recolour of a weapon's skill animations); Reroll/Banish charges (Skip dropped, since "Heal instead" covers it) (bought permanently, used on the level-up screen); Blink/Dash upgrades: extra charge, shorter cooldown, longer distance, leaves an effect. Weapon/skill evolutions listed as "coming later", designed in their own session. **Replaces** the UI plan's Oct 16 "no new unlock system or currency" and its exclusion of evolutions/reroll/banish/skip. Affects new unlocks data, inventory, level-cards.js, dash/blink code, FX tinting, local saves.
- **October 16: Free "Heal instead" on level-up.** On any level-up you can skip the cards and heal instantly, free. Amount not set. Affects level-cards.js, level-up UI, healing.
- **October 16: Game modes.** Normal; Endless (continues after the final boss, keeps getting harder until death); Modified run with mix-and-match modifiers: cooldowns 30 % faster + more regen but faster enemies; 50 % more enemy spawns; double damage + half HP. **No extra rewards** for modifiers. Affects run director, balance, best-run records.
- **October 16: Best runs and How to play screens** on the main menu. Affects the front-end module and local storage.
