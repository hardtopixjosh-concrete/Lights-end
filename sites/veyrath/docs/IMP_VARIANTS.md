# Additional imp variants — October 15, 2026

Prepared `Imp 2`, `Imp 3`, and `Imp 4` from the preserved original `2D Demons - TopDown assetpack v1.1.zip`. Consulted `ASSET_CATALOG.md` and `assets/inventory.json` before selecting; those inventory the supplemental FX/item packs, so original demon families were inspected directly in the character archive. All ten original imp families were viewed in east/south/north idle poses before selection.

| Family | Runtime key prefix | Appearance |
| --- | --- | --- |
| Imp 2 | `demon-imp2-` | Small horned red imp with curved blade |
| Imp 3 | `demon-imp3-` | Red imp carrying a tall dark red banner and blade |
| Imp 4 | `demon-imp4-` | Red imp with blade and small shield |

Each prefix includes `Idle`, `Run`, `Attack1`, `TakeDamage1`, and `Die1`. These complement existing Imp1; source equipment is visual identity only and adds no gameplay ability. Script: `sites/veyrath/prepare-imp-variants.py`.

All 15 exported alpha-preserving, lossless WebP sheets retain source **1920×1024 dimensions, 15 columns × 8 rows, 128×128 cells, (64,96) ground pivot**. Row order **E, SE, S, SW, W, NW, N, NE** was visually checked for Idle/Run/Attack1 against the established conventions. No per-frame cropping, rescaling, or recoloring. Every output was decoded and compared exactly as RGBA with its original PNG. Total prepared bytes: **367,812**.

Selection and direction contact sheets remain development evidence at `tmp/reference/imp-candidates.png` and `tmp/reference/imp-direction-contact.png`. Original archive contains no local license/readme text, so no new external license terms were inferred. Original ZIP and existing demon sheets remain unchanged. Runtime roster choice and combat tuning are integrated separately.
