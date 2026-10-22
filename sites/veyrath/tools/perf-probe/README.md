# Frame-time probe (Oct 19)

Measures real frame times in an on-screen Electron window. Use it before claiming any performance fix, and again after the fix.

Run it from `VEYRATH/launcher`, which provides Electron:

    URL=http://localhost:8765/ OUT=C:/tmp/lobby.json LABEL=local CLICKS="#fe-play" SECS=60 npx electron ../sites/veyrath/tools/perf-probe/probe.js
    node ../sites/veyrath/tools/perf-probe/fps-per-second.js C:/tmp/lobby.json

Options (environment variables):

- `URL`: the page to measure (live site or `http://localhost:8765/`; add `?debug` for EXEC).
- `CLICKS`: comma-separated selectors to click before measuring. `#fe-play` goes to the lobby.
- `EXEC`: JavaScript to run before measuring, for example `veyrathDebug.start()` to start a run.
- `SKIP`: comma-separated rAF callback names to disable, for A/B tests (for example `drawPreviews`).
- `SECS`: how long to measure.

The output JSON contains:

- `f`: frame intervals
- `cb`: time spent per rAF callback
- `rs`: canvas resizes
- `loaf`: long-animation-frame attribution
- `mem`: heap samples
- `res`: resources that arrived during the measurement
