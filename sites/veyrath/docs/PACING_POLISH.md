# Pacing and world-event polish — October 15, 2026

Latest user decision replaces the fast, nearly constant ordinary spawn stream. Current values live in dist/encounter-pacing.js, consumed by survival.js; exact speeds in encounter-space.js. All values are playtest tuning.

| Run time | Ordinary interval | Ordinary population allowance |
| --- | --- | --- |
| Start | 3.0s | 8 |
| 1 minute | 2.4s | 14 |
| 3 minutes | 1.6s | 28 |
| 6 minutes | 1.1s | 48 |
| 10+ minutes | 0.8s | 70 |

Values interpolate between stages and plateau after ten minutes. Last12s of each minute after the opening minute run at half replenishment. Accepted optional fights use45% ambient rate; mini-boss fights60%. Population allowances do not remove existing enemies or build spawn debt. Scripted encounters retain the shared150 cap. Base movement is10% slower for all four existing roles; enemy aging/enrage and explicit curses remain applicable.

Automatic elites start at105s, then every105s, delayed during optional/boss encounters and15s before boss arrival. Optional completion pauses ambient refill12s. Boss death pauses it15s and holds automatic elites at least20s. Existing enemies are unaffected by the refill pause. No new invulnerability is introduced.

Presentation uses existing assets only: smaller relics, stone bases, differentiated ground sigils, ground-projected rift, nearby titles, dimmed cooldown camps/return text, hidden spent shrines, highlighted claimable rewards and targeted ownership labels. Anchors remain distinct objectives and do not count in the hunting HUD. Existing F interactions, explicit acceptance and persistent transaction rules remain.

Verification: tests/pacing.test.js focused integration, including world-events.test.js; finite growth, caps, rate coordination/recovery, exact speed change and run event/reward/save safeguards. Immediate-clear arrivals per minute:22,24,29,34,40,44,49,53,57,62 over ten minutes. Brief local visual and changed entry/render syntax checks; no dense-scene performance claim or broad/duplicate production test pass.
