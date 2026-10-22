# Light's End alpha launcher

A desktop window that loads the **live Sites build** and adds Steam co-op (lobbies, invites, P2P messages).
Game updates still go out the usual way: publish through Sites, then press **F5** in the launcher.

- Uses Valve's test app **Spacewar (App ID 480)** until the game has its own Steam App ID (`STEAM_APP_ID=<id>`).
- Only talks to the game's own site. The page gets a small `window.veyrathSteam` API and nothing else.

## Run it (you)
- Double-click `Start launcher.cmd` (needs Node.js; already installed here), or
- run `out/LightsEnd-win32-x64/LightsEnd.exe`.

Start **Steam** first and log in. Otherwise the game runs but co-op is off.

## Send it to a friend
Send `out/LightsEnd-alpha-win64.zip`. They unzip it, start Steam, and run `LightsEnd.exe`.
You only need to send a new zip when the **launcher** changes. Game updates arrive with F5.

## Play co-op
1. Both open the character lobby (pick a class). The right-hand slot shows **CO-OP**.
2. You press **Host co-op**, then **Invite via Steam** (or copy the join code and send it).
3. Your friend accepts the invite, or types the code and presses **Join**.
4. Both lists show each other's name and a ping in ms. The host starts the shared run; everyone chooses their own cards.

If the builds differ, the join is refused. Both press F5.

## Developer notes
- `npm start`: run from source. `npm run pack`: rebuild `out/LightsEnd-win32-x64`.
- `VEYRATH_URL=http://localhost:8765/` loads a local server instead of the live site.
- `VEYRATH_SELFTEST=1`: hidden boot check (Steam status, bridge, co-op slot), then quit.

## Local two-player test (developer)
`VEYRATH_LOOPBACK=offscreen VEYRATH_URL=http://localhost:8765/?debug VEYRATH_LOOP_EVAL='[[5000,"h","veyrathDebug.netState()"]]' npx electron .`
runs a host and a friend game off-screen with a fake Steam relay (see loopback.js). `VEYRATH_LOOPBACK=show` shows both windows.

## Launcher 0.1.2
Disables background throttling so minimizing the host does not intentionally throttle the shared simulation, and bounds each Steam receive-pump pass. New package: `out/LightsEnd-0.1.2-win64.zip`, unpack into a fresh folder. Both players should use 0.1.2; F5 updates game code but cannot update launcher settings. The original out/LightsEnd-win32-x64 folder was locked during packaging, so this release is staged under out/0.1.2/.

Network testing (Oct 19): `VEYRATH_LOOP_DELAY_MS=30 VEYRATH_LOOP_JITTER_MS=5` adds one-way latency to the test relay; `VEYRATH_LOOP_NETSTATS=1` (optionally `VEYRATH_LOOP_NETSTATS_AFTER=ms`) prints average snapshot bytes per channel and field on quit. Frame/position probes: `sites/veyrath/tools/perf-probe/`.
