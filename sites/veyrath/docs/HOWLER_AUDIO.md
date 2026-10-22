# Howler audio integration — October 15, 2026

VEYRATH now uses the actual pinned Howler.js 2.2.4 distribution, vendored locally at `dist/vendor/howler-2.2.4.min.js`. Load that classic script before `game.js`. No runtime CDN, npm install or bundler is needed. `CombatSound` keeps its public constructor/unlock/setVolume/setState/restart/play interface.

Sources verified: [official documentation](https://github.com/goldfire/howler.js#documentation), [npm version metadata](https://registry.npmjs.org/howler/2.2.4). Files extracted from the official npm tarball `https://registry.npmjs.org/howler/-/howler-2.2.4.tgz`. Full bundled build includes the spatial plugin, although positional audio is not enabled in this batch. MIT license is preserved alongside it in `howler-LICENSE.md`.

SHA-256 of vendored distribution: `736c339444c88baad593e24afdf1d6e8f574019b4e37a110ecb453ff745ffd41`.
SHA-256 of license: `0ad5aef7beeb552832fe01db1c46933f948dfe5da35017bd0efa0006ffd2ced9`.

## Preserved behavior

- Existing supplied quiet/trimmed MP3 files and soundtrack mappings remain unchanged. Exploration and encounter tracks play simultaneously during elite/boss encounters.
- `veyrath-audio-v3` independent saved sliders remain background 15% / FX 20% by default. Menus dim both background tracks to 65% of that setting.
- Both long-running music tracks use Howler's HTML5 streaming path with `preload:false`, then load on the first `unlock()` gesture after Howler's capture-phase HTML5-pool priming. This avoids allocating locked HTML5 nodes and startup pool-exhaustion warnings before interaction; short effects use its default Web Audio path with fallback. Music starts silent and uses 650 ms transitions. Slider adjustments apply immediately, canceling obsolete fades so reducing volume/muting cannot briefly overshoot.
- Hidden/focus loss or death immediately pauses music and stops existing effects. State changes cannot revive queued music after hiding/death; not-yet-loaded music waits for the load event and then reads the current state. Restart clears voice/throttle state and resets track playback positions.
- The ordinary death transition produces one game-over cue. No combat effects play while dead; game-over still obeys FX volume and hidden-state rules.
- At most four active FX voice groups, including synthetic cues. One voice per kind and one shared sword cue at a time. Damage retains 110 ms throttle, enemy death 200 ms, synthesized cues 70 ms.
- Quiet whoosh/impact/rumble and four-note level-up chime use **Howler's existing AudioContext and master gain**, through a separate FX gain node. No second AudioContext and no amplitude increase. Changes to FX gain also affect playing synthetic cues. Death/focus loss stops their scheduled oscillators/noise nodes.

## Checks and limits

`node --test tests/audio-howler.test.js` passes two focused state tests covering supplied asset existence, quiet defaults, simultaneous loops, stale fades, independent slider/mute persistence, voice replacement/cap/throttles, shared-context synthesis routing, death/restart, and delayed load/play callbacks after hide/death. The old `tests/audio.test.js` inspects obsolete HTMLAudio implementation internals and should be replaced by these checks rather than retained as an incompatible second test.

Browser gesture/autoplay rules still apply: sound begins after the existing Enter/click/input interaction; Howler manages its automatic unlock and HTML5 fallback. A denied playback retries only on Howler's unlock event while that track is still wanted. If Web Audio is unavailable, supplied file sounds can use HTML5 fallback, but synthetic cues cannot play. Perceived loudness remains a listening judgment; mock tests establish gain/state correctness, not audible quality. No compression, equalization, asset re-encoding or combat balance change was introduced.
