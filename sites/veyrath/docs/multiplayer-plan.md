# VEYRATH multiplayer plan (historical plan, 2026-10-17)

**Current implementation:** See [October 17 co-op audit](COOP_AUDIT_2026-10-17.md) and GAME_REFERENCE.md (fx-182). The phase notes below are historical and include superseded rules: level-ups now pause, personal loot/cards are implemented, in-progress joins are allowed, and transport is Steam P2P. They are not a current completion checklist.

Status: **approved 2026-10-17** (Phase 1 started; co-op rules accepted as defaults). Scope decided by the user: online co-op, up to 5 players, start soon.
Items marked ❓ are design questions for the user. Nothing here is built yet.

## Where the game is today

- One global `player` object in `game.js` (position and animation only). The player's HP, resource and buffs live inside `survival` together with world state (enemies, waves, pickups).
- Most sim functions already take `player` as an argument (`tickSurvival(s,c,player,…)`, `receiveHit`, `areaHits`, `castAbility`). That's a good starting point.
- Class state (mage energy, warrior rage, ranger momentum, cooldowns) is stored once per run, not per player.
- Keyboard and mouse are read directly inside the update loop.
- There are about 355 `Math.random()` calls. That rules out lockstep networking (every PC simulating the same game), but it's fine for the host-authoritative model below.

## Network model (recommended)

**Host-authoritative.** One player (the host) runs the real simulation. The other players send only their inputs (movement, aim, buttons) and receive snapshots of the world ~20 times per second. Their screens smooth movement between snapshots. Each client predicts its own movement so walking feels instant.

- Why: it's the simplest model that works for an action game with lots of randomness, and cheating is limited to the host. Up to 5 players and a few hundred enemies fits comfortably in the snapshot budget.
- Browser version: peer-to-peer WebRTC data channels. ❓ This needs a small "matchmaking/signalling" service so players can find each other via an invite code. The current Site is static files only, so that service is either a tiny server of ours or a third-party broker.
- Steam version: the same model, with the transport swapped for Steam lobbies, invites and Steam Datagram Relay. The game code doesn't change, only the "send/receive" layer.

## Phases

### Phase 1 — Multi-player-ready core (offline, no visible change)
**Progress:** batch 1 done Oct 17 (fx-161): party list, enemy/boss targeting, downed/revive, scaling, F2 test bots, party frames (steps 1, 3, 5, 6 partly; co-op rules from Phase 2 partly). Batch 2 done Oct 17 (fx-162): full class kits per player (steps 1 and 4); bot commands are the future network input. Batch 3 done Oct 17 (fx-163): area attacks hit every player; local input is command edges run by `runCommand` (step 2). **Phase 1 complete.** Leftovers for later: per-player flow fields, teammate slows, personal loot for teammates.
1. **Player objects.** Replace the single `player` with a `players[]` list. Each player owns position, HP/max HP, resource, cooldowns, buffs, class/path/loadout and level/talents. World state stays in `survival`.
2. **Input as commands.** Each tick, every player produces a command (move vector, aim point, pressed buttons). The keyboard/mouse/touch only fill the local player's command. The simulation never reads keys directly.
3. **Enemies pick a target.** Enemies and bosses choose a player (nearest or most threatening) instead of "the player". Boss attacks that aim at the player use their current target.
4. **Abilities know their caster.** Every ability, projectile, pool and buff records which player owns it (for damage credit, buffs and ally effects).
5. **Camera/HUD.** The camera follows the local player. The HUD shows the local player, plus small party frames for the others.
6. **Test dummy.** An F2 test-menu option adds 1–4 local "bot" players that walk and attack, so all of this can be tested without networking.

This phase touches almost every system (game.js alone has ~200 `player` references), so it will take a few batches. It's also the step that makes every future feature multiplayer-safe.

### Phase 2 — Co-op rules ❓ (your call; my suggested defaults)
- **Downed and revive:** at 0 HP a player is downed, not dead. Teammates revive them by standing next to them for ~3 s. The run ends when everyone is down.
- **Difficulty scaling:** enemy HP and spawn count scale with player count (e.g. +60% HP per extra player for bosses). Exact numbers get tuned in playtests.
- **Loot:** personal loot (each player sees their own drops; no stealing). Gold is personal.
- **XP and level-ups:** shared XP. Each player picks their own level-up card, without pausing the game.
- **Pause:** online play doesn't pause. The menu opens over the running game.
- **Friendly fire:** off.
- **Duplicate classes:** allowed (e.g. 3 Mages).

### Phase 3 — Online play (Steam launcher; replaced the browser plan Oct 17)
**Progress:** step 1 done Oct 17 (fx-166): Electron launcher + Steam lobby/invite/join code/ping (`launcher/`, `net.js`). Step 2 done Oct 17 (fx-168): host-authoritative snapshot sync (`net-sync.js`), friends join the host's run, client prediction. Next: two-PC playtest, then own level-up picks + personal loot for friends.
- Lobby: the "Invite friend" slot becomes real. The host creates a lobby and gets an invite code/link, and up to 4 friends join. Each picks their own class and loadout. The host starts the run.
- Snapshots and interpolation, client prediction for own movement, host migration not included (if the host leaves, the run ends).
- Joining is lobby-only at first (no joining a run in progress).

### Phase 4 — Steam
- Desktop wrapper (Electron or similar) + Steamworks: friends list invites, lobbies, relay networking, later achievements and cloud saves.

## Design rule from now on
New systems get built with per-player state, a target player for enemies, and an owner for effects, even before Phase 1 is finished.
