# Co-op architecture audit — October 17, 2026 (fx-182)

## Assessment
Host-authoritative simulation, per-player kits and local movement prediction are appropriate for this five-player PvE game. The existing implementation was not yet an optimized or production-complete networking stack. This audit fixes concrete traffic, input and lifecycle faults; it does not certify performance on every PC or connection.

## Findings and changes delivered
| Area | Finding | Change / current result |
| --- | --- | --- |
| Snapshot delivery | One broadcast delta baseline; unlimited reliable sends even when a guest stops receiving | Independent baselines and acknowledgement windows per guest. At most four snapshots outstanding; stop before encoding when 128 KiB is already outstanding. A single snapshot can cross the byte threshold. Healthy guests continue. |
| Input cadence | One IPC/network command every render frame; duration rounded to milliseconds; press/release edges combined ahead of all movement | Up to 30 normal batches/s, edges flush promptly. Original frame durations, movement and aim retained. Host replays each frame's edges/aim in order, acknowledges after applying it. |
| Invalid/stale input | Unbounded vectors; non-finite values; previous-run packets not distinguished | Finite values, normalized movement, bounded steps/edges/queues, host-wall-time movement credit (250 ms burst allowance), monotonically increasing input IDs, run IDs. |
| Pause and restart | Paused guest presses could remain queued; vote/pause state could survive restart | Cancel held inputs on block transition; clear remote queue on shared pause. Reset pause/vote/snapshot state on encounter reset. |
| Authority | A lobby member could feed run-control messages to another guest | Clients accept run control only from original host; owner change ends run (no accidental host migration). Lobby membership checked before JSON dispatch. |
| Redundant entity IDs | Every snapshot resent every entity ordering list | Lists sent only when membership/order changes, retaining full list on baseline reset. |
| Personal loot | Reward rolls depended on capped cosmetic event history | Reliable death/reward events delivered separately from snapshot throttling; cosmetic history can remain bounded. No loss from that cosmetic cap. |
| Diagnosis | FPS report had no network context and an obsolete build label | F3 adds ping, average outgoing application traffic, pending snapshots; copied report adds per-peer bytes, build time, throttle count and traffic. Native Steam queue/loss not exposed. |
| Background host | Electron's normal window enabled background throttling | Launcher 0.1.2 disables it. Receive pump also limits work per pass and obtains the lobby-member list once per pass. Requires new launcher binary; web changes work with prior launcher. |
| Prior fixes | Guest initial-state loss, Mage full-particle-pool sends, shared Alchemist spec omission | fx-180/181 retained; regression checks pass. |

## Checks and measurements
Focused net-audit-smoke runs the actual game message handlers and teammate replay in a controlled fixture, plus input batching and independent snapshot flow. 30/60/240 FPS each send 300 ordinary batches over 10 s; 144 FPS sends 288. All preserve 10 s total input duration; edges flush immediately. Malformed vectors/durations, duplicates, wrong run IDs, and wrong sender are rejected. Paused inputs are cancelled and acknowledgements follow applied movement.

Four guests, 260 simple moving enemies, 100 ticks: healthy guest 100 snapshots / 431,380 application bytes; deliberately stalled guest 4 / 35,768 bytes. Healthy receiver ACK simulated every two ticks. Largest observed individual encode in this run ~1.45 ms. Stalled guest catches up to exact newest position after ACK, without missing delta fields. This is a CPU/network fixture, not a Steam relay or GPU benchmark. No all-class, all-boss, 30-minute or real two-PC soak is claimed.

Existing network/Ice Road and Alchemist network/render regression checks pass. Renderer tests use stub Canvas; they prove data compatibility, not appearance/frame rate. New source syntax checked. No additional Electron loopback launch attempted after the prior launcher-test restriction.

## Remaining work, in priority order
1. **Measure real five-player play:** use F3 / Copy performance report on host and guests during dense fights. Test normal RTT, weak upload, packet loss, reconnect/restart and minimizing host using 0.1.2. Current rates/windows are engineering defaults, not user-approved balance requirements.
2. **Modern Steam transport:** installed steamworks.js 0.4.0 exposes legacy ISteamNetworking P2P. Valve deprecates it in favor of NetworkingSockets or NetworkingMessages. A modern transport can separate reliable choices/rewards from replaceable state and expose connection statistics. This requires a native-binding/launcher migration and real Steam validation; it is not implemented by changing a boolean.
3. **Loss-tolerant snapshot protocol:** current field deltas require ordered reliable delivery. Never switch these packets to unreliable without acknowledged baselines/keyframes, size limits/fragmentation handling, resync and event IDs. Backpressure limits obsolete queued state but does not remove head-of-line blocking.
4. **Simulation isolation:** host simulation remains requestAnimationFrame-driven, with dt capped at 40 ms, on the render thread. Heavy drawing/GC can slow the shared run. A fixed simulation schedule and eventually a worker are the next architecture step if traces show host stalls. They need careful parity tests of cooldowns, collision and input. Attack/dash prediction remains limited; only guest walking is predicted. Position smoothing is exponential, not a timestamped interpolation buffer.
5. **Feature parity:** guest forge, boss rewards and world-event/merchant interactions remain incomplete; teammate slow effects/pathfinding and some local-owner assumptions warrant gameplay-specific review. This audit did not invent or change mechanics to fill those gaps.
6. **Persistence/trust:** personal loot is still rolled/stored locally; join loadouts/helpers and client state are not account-authoritative anti-cheat. Input validation prevents obvious malformed movement, not a comprehensive competitive security model. No cloud-save service, host migration, production Steam App ID or dedicated server was introduced.
7. **Representation:** JSON and per-field kit-array replacement remain; interest management is coarse distance-based lower enemy cadence. Consider compact schemas, per-effect IDs and recipient-specific relevance after measuring CPU/bandwidth. Per-peer encoding now costs more host CPU than one broadcast; test worst-case kits before further changes.

## Primary references checked
- [Valve legacy networking API](https://partner.steamgames.com/doc/api/ISteamNetworking): deprecated API; reliable/unreliable semantics, size limits and ordered sends.
- [Valve NetworkingSockets](https://partner.steamgames.com/doc/api/ISteamNetworkingSockets): lanes and priorities can control head-of-line blocking; migration remains planned.
- [Electron BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window): backgroundThrottling affects timer/animation scheduling and visibility state.

Do not interpret these implementation checks as a claim that the game is the most efficient possible co-op game. The result is a safer, bounded, measurable existing architecture with explicit remaining work.
