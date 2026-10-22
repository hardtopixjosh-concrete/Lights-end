# Selected world-event assets

October 15, 2026. Selected after consulting `ASSET_CATALOG.md`, the exact
`assets/inventory.json` entries, and original V0.8 PDF pages 3 and 13–15 plus
V0.9.2 pages 2 and 6. These files provide presentation for approved optional
events; their pack names do not establish new mechanics.

| Manifest key | Supplied source | Native frame canvas | Frames / atlas | Suggested playback |
| --- | --- | --- | --- | --- |
| `world-rift` | Sci-fi FX Pack 2, `scifx2_black_hole_loop_large_red` | 128×128 | 24 / 3072×128 | 12 fps, repeat |
| `world-shrine` | Item Pickups Fantasy Pack 1, `fp1_relic_B_orange` | 32×32 | 16 / 512×32 | 10 fps, repeat |
| `world-camp-red` | Item Pickups Fantasy Pack 1, `fp1_relic_A_red` | 32×32 | 16 / 512×32 | 10 fps, repeat |
| `world-camp-blue` | Item Pickups Fantasy Pack 1, `fp1_relic_A_blue` | 32×32 | 16 / 512×32 | 10 fps, repeat |
| `world-merchant` | HD Character Pack 1 V1.2, `2Archer/Idle` | 128×128 | 15×8 directions / 1920×1024 | 10 fps, repeat |
| `world-merchant-run` | HD Character Pack 1 V1.2, `2Archer/Run` | 128×128 | 15×8 directions / 1920×1024 | 15 fps, repeat |

The portal's fiery red ring and dark center distinguish it from friendly relics.
Orange shrine fire harmonizes with the desert and approved orange Ground Slam
palette. Red/blue camp relics remain legible at small size. Merchant uses the
brown-clothed traveler from the same HD pack as the player, retaining its bow;
there is no dedicated shopkeeper in the supplied pack. It is a friendly NPC role,
not a new player weapon or combat mechanic. A nearby ground prop or sign can
establish the stall without altering the sprite.

All sequence canvases and native alpha are preserved in lossless WebP atlases;
no independent frame crops, recoloring or resizing. Character row order matches
the player: E, SE, S, SW, W, NW, N, NE. Render relics/portal centered on their full
source canvas; character placement should reuse existing HD ground-foot anchor.
Scale/opacity and world positioning are renderer choices, independent of the
stored source frames. Portal and shrine effects should not obscure enemy warnings.

Reproduce with `sites/veyrath/prepare-world-assets.py`. It reads cataloged sequence
paths and hashes, checks all frame counts and dimensions, adds these six manifest
entries, and retains existing entries. Only selected sheets and four original
pixel-pack license summaries ship. Original ZIPs stay intact outside the Site.

Bundled local pixel-pack license summaries request attribution to **Will Tice /
Untied Games**. Copies sit beside each `world-*.webp`; source paths and hashes
are in the manifest. The supplied HD character ZIP contains no local license or
readme; `world-merchant-source.txt` records only provenance without inventing
terms. Existing original source ownership/permissions remain applicable.

Inspected candidate frames against the desert palette before selection:
`tmp/reference/world-candidates.png` and `tmp/reference/merchant-candidates.png`.
Preparation checked all original frames against catalog dimensions and assembled
all eight merchant directions. Parent feature integration owns the focused runtime
and brief visual check; no separate duplicated game pass performed here.
