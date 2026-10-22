# Demon variety assets — October 15, 2026

Prepared by `sites/veyrath/prepare-demon-variety.py` from the preserved original `2D Demons - TopDown assetpack v1.1.zip`. Consulted `ASSET_CATALOG.md` and its exact `assets/inventory.json`: those cover the 15 supplemental FX/item packs; this original character archive was inspected separately. No supplemental effects selected in this asset step.

| Intended role | Original family | Key prefix | Visual identity |
| --- | --- | --- | --- |
| Later melee | Demon Spawn 4 | `demon-melee-` | Horned armored sword/shield demon |
| Later ranged | Demon Spawn 8 | `demon-caster-` | Dark-robed caster with purple orb/staff |
| Elite | Demon Elite 3 | `demon-elite-` | Broad horned armored demon with large weapon |
| Rift | Demon Beast 4 | `demon-rift-` | Distinct winged red demon |

Each family includes exactly **Idle, Run, Attack1, TakeDamage1, Die1**. Twenty lossless alpha-preserving WebP sheets total 1,512,924 bytes. Every output was decoded and compared byte-for-byte as RGBA against its source. Manifest additions merge into existing entries. All sheets are **1920×1024**, **15 columns × 8 rows**, **128×128 cells**; no per-frame cropping or resizing. Source caster `Idle 1.png` is normalized to `demon-caster-Idle`.

Rows visually match the established Imp1 convention: **E, SE, S, SW, W, NW, N, NE**. Compared run pose rows against the original Imp1; east/south/north and diagonals align. This archive contains only Combined and separated-layer sheets, without labeled directional individual PNGs, so this is visual verification rather than the knight pipeline's exact labeled-row test. Retain the established **(64,96)** cell ground pivot. Foot positions vary with the stance; do not independently crop or recenter frames.

Approximate non-shadow visible idle bounds for E/S/N respectively (exclusive right/bottom):

| Family | E | S | N |
| --- | --- | --- | --- |
| Melee | (47,25)–(87,90) | (31,27)–(85,93) | (44,25)–(97,95) |
| Caster | (37,33)–(87,89) | (44,41)–(80,83) | (48,38)–(84,89) |
| Elite | (34,23)–(71,89) | (43,25)–(89,84) | (36,33)–(87,86) |
| Rift | (29,13)–(79,90) | (33,17)–(101,84) | (28,37)–(96,85) |

Bounds include weapons/wings and are reference measurements, not collision geometry. Body collision should exclude outstretched wings and swords. Gameplay/rendering integration determines appropriate scale and body contact volumes.

Full-family contact sheet: `tmp/reference/demon-family-contact.png`; row comparison: `tmp/reference/demon-direction-contact.png`. Neither is shipped as runtime art. Original archive has no .txt/.pdf license or readme files; no additional license terms or ownership claims inferred. Existing Imp1 and Beast1 remain unchanged. No gameplay changes in this asset preparation step.
