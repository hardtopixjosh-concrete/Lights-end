# VEYRATH supplied asset catalog

Updated October 14, 2026. Indexed every PNG sequence/static PNG in all archives under `Visuals/` and `objects pickups visuals/`. Original ZIPs remain intact. This is an availability catalog, not a decision to use every asset.

Exact source paths, frame counts, dimensions and content hashes: [inventory.json](assets/inventory.json). Exact cross-archive PNG-sequence duplicates: [duplicates.json](assets/duplicates.json). Local supplied license summaries: [license-notes.json](assets/license-notes.json). Contact sheets show one sampled frame per family; inspect the full animation when selecting it.

## Pack overview

| Pack | PNG sequences/static assets | Families | PNG files | Other formats |
| --- | ---: | ---: | ---: | --- |
| Super Pixel Item Pickups Fantasy Pack 1.zip | 84 | 54 | 1193 | .txt |
| Super Pixel Objects And Items.zip | 1040 | 266 | 2662 | .txt |
| Super Pixel Blood FX Pack 1.zip | 120 | 10 | 1008 | .txt |
| Super Pixel Effects Gigapack v3.0.0.zip | 2296 | 175 | 59742 | .txt, .gif, .html |
| Super Pixel Effects Pack 3.zip | 128 | 14 | 1516 | .txt |
| Super Pixel Explosion FX Pack 1.zip | 160 | 10 | 1840 | .txt |
| Super Pixel Fantasy FX Pack 1 v1_1.zip | 184 | 58 | 3778 | .txt |
| Super Pixel Fantasy FX Pack 2 v1_1.zip | 298 | 43 | 6012 | .txt |
| Super Pixel Impact FX Pack 1.zip | 140 | 10 | 1022 | .txt |
| Super Pixel Impact FX Pack 2.zip | 140 | 10 | 1246 | .txt |
| Super Pixel Projectiles Pack 2.zip | 136 | 10 | 1360 | .txt |
| Super Pixel Projectiles Pack 3.zip | 164 | 12 | 2274 | .txt |
| Super Pixel Projectiles Pack 4.zip | 322 | 17 | 2956 | .txt |
| Super Pixel Sci-fi FX Pack 1.zip | 168 | 14 | 1992 | .txt |
| Super Pixel Sci-fi FX Pack 2.zip | 262 | 50 | 4992 | .txt |

## Selection and integration rules

- Check this catalog before generating new effects, icons or pickups; prefer supplied assets that fit the selected mechanic.
- `GAME_REFERENCE.md` and PDF define mechanics; pack names do not add new gameplay requirements.
- Ship only selected assets as prepared atlases. Preserve alpha, frame canvas/pivots and source-relative dimensions; do not crop frames independently.
- Existing orange Sci-fi Pack 1 `scifx1_explosion_A_large_orange` on Ground Slam was explicitly approved by the user October 14. It is a useful style baseline.
- Pixel edges differ from the character/environment style. Evaluate at game scale, use coherent color and restrained layering. Fantasy, impact/dust, sparks and warm shockwaves are strong starting candidates; sci-fi beams/scan effects need specific art direction.
- Original license summaries request attribution to Will Tice; check the retained license for the selected pack before use. No claims about external terms beyond supplied text.
- Duplicate inventory detects exact same PNG frame bytes across archives. Similar animations with renamed/re-exported/color variants may remain distinct.

## Suggested future uses (candidates, not implemented)

| Need | Where to start |
| --- | --- |
| Sword impact/parry/crit | Impact FX 1/2, sparks, Effects Pack 3, Gigapack directional impacts |
| Ground Slam, dash, desert dust | Impact FX dust/ground effects, Explosion FX and Gigapack smoke/rings |
| Blade Storm and elemental weapon effects | Fantasy FX, Gigapack wind/swirl effects, appropriate sparks |
| Enemy caster/charger attacks | Projectiles 2/3/4; pair matching impact with projectile |
| Blood and enemy death feedback | Blood FX 1, Gigapack splatters; select coherent blood color |
| Boss AoE, rifts, shrines, magical events | Fantasy FX 1/2, Explosion FX, Gigapack; sci-fi portals selectively |
| Gold, XP/loot, potions and reward pickups | Item Pickups Fantasy 1 and Objects And Items |
| Food, keys, potions, gems and hazards | Objects And Items; food and spikes dominate; no named chest/sword/shield equipment sprites found |

## Super Pixel Item Pickups Fantasy Pack 1.zip

Source: `objects pickups visuals/Super Pixel Item Pickups Fantasy Pack 1.zip`. 84 sequences/static assets in 54 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `fp1_coin` | 18 | blue, gold, green, orange, red, silver, violet, yellow | 8 | 16×16, 8×8 |
| `fp1_energy_orb_blue` | 1 | blue | 21 | 16×24 |
| `fp1_energy_orb_green` | 1 | green | 21 | 16×24 |
| `fp1_energy_orb_orange` | 1 | orange | 21 | 16×24 |
| `fp1_energy_orb_red` | 1 | red | 21 | 16×24 |
| `fp1_energy_orb_violet` | 1 | violet | 21 | 16×24 |
| `fp1_energy_orb_yellow` | 1 | yellow | 21 | 16×24 |
| `fp1_gem_blue` | 1 | blue | 32 | 24×32 |
| `fp1_gem_green` | 1 | green | 32 | 24×32 |
| `fp1_gem_orange` | 1 | orange | 32 | 24×32 |
| `fp1_gem_red` | 1 | red | 32 | 24×32 |
| `fp1_gem_violet` | 1 | violet | 32 | 24×32 |
| `fp1_gem_yellow` | 1 | yellow | 32 | 24×32 |
| `fp1_heart_A` | 14 | blue, green, orange, pink, red, violet, yellow | 8 | 16×16, 8×8 |
| `fp1_heart_B_blue` | 1 | blue | 13 | 16×16 |
| `fp1_heart_B_green` | 1 | green | 13 | 16×16 |
| `fp1_heart_B_orange` | 1 | orange | 13 | 16×16 |
| `fp1_heart_B_pink` | 1 | pink | 13 | 16×16 |
| `fp1_heart_B_red` | 1 | red | 13 | 16×16 |
| `fp1_heart_B_violet` | 1 | violet | 13 | 16×16 |
| `fp1_heart_B_yellow` | 1 | yellow | 13 | 16×16 |
| `fp1_key_blue` | 1 | blue | 16 | 32×16 |
| `fp1_key_bronze` | 1 | source palette | 16 | 32×16 |
| `fp1_key_gold` | 1 | gold | 16 | 32×16 |
| `fp1_key_green` | 1 | green | 16 | 32×16 |
| `fp1_key_orange` | 1 | orange | 16 | 32×16 |
| `fp1_key_red` | 1 | red | 16 | 32×16 |
| `fp1_key_silver` | 1 | silver | 16 | 32×16 |
| `fp1_key_violet` | 1 | violet | 16 | 32×16 |
| `fp1_key_yellow` | 1 | yellow | 16 | 32×16 |
| `fp1_potion_blue` | 1 | blue | 16 | 16×24 |
| `fp1_potion_green` | 1 | green | 16 | 16×24 |
| `fp1_potion_orange` | 1 | orange | 16 | 16×24 |
| `fp1_potion_red` | 1 | red | 16 | 16×24 |
| `fp1_potion_violet` | 1 | violet | 16 | 16×24 |
| `fp1_potion_yellow` | 1 | yellow | 16 | 16×24 |
| `fp1_relic_A_blue` | 1 | blue | 16 | 32×32 |
| `fp1_relic_A_green` | 1 | green | 16 | 32×32 |
| `fp1_relic_A_orange` | 1 | orange | 16 | 32×32 |
| `fp1_relic_A_red` | 1 | red | 16 | 32×32 |
| `fp1_relic_A_violet` | 1 | violet | 16 | 32×32 |
| `fp1_relic_A_yellow` | 1 | yellow | 16 | 32×32 |
| `fp1_relic_B_blue` | 1 | blue | 16 | 32×32 |
| `fp1_relic_B_green` | 1 | green | 16 | 32×32 |
| `fp1_relic_B_orange` | 1 | orange | 16 | 32×32 |
| `fp1_relic_B_red` | 1 | red | 16 | 32×32 |
| `fp1_relic_B_violet` | 1 | violet | 16 | 32×32 |
| `fp1_relic_B_yellow` | 1 | yellow | 16 | 32×32 |
| `fp1_soul_blue` | 1 | blue | 16 | 16×24 |
| `fp1_soul_green` | 1 | green | 16 | 16×24 |
| `fp1_soul_orange` | 1 | orange | 16 | 16×24 |
| `fp1_soul_red` | 1 | red | 16 | 16×24 |
| `fp1_soul_violet` | 1 | violet | 16 | 16×24 |
| `fp1_soul_yellow` | 1 | yellow | 16 | 16×24 |

## Super Pixel Objects And Items.zip

Source: `objects pickups visuals/Super Pixel Objects And Items.zip`. 1040 sequences/static assets in 266 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `sparkle_A` | 2 | source palette | 28, 34 | 16×16, 32×32 |
| `sparkle_B` | 2 | source palette | 28 | 16×16, 32×32 |
| `sparkle_C` | 2 | source palette | 36, 44 | 16×16, 32×32 |
| `sparkle_D` | 2 | source palette | 17, 20 | 16×16, 32×32 |
| `appetizer_A` | 3 | source palette | 1 | 16×16 |
| `appetizer_B` | 3 | source palette | 1 | 16×16 |
| `apple_A_green` | 3 | source palette | 1 | 32×32 |
| `apple_A_red` | 3 | source palette | 1 | 32×32 |
| `apple_B_green` | 3 | source palette | 1 | 32×32 |
| `apple_B_red` | 3 | source palette | 1 | 32×32 |
| `apple_C_green` | 3 | source palette | 1 | 16×16 |
| `apple_C_red` | 3 | source palette | 1 | 16×16 |
| `apple_D_green` | 3 | source palette | 1 | 16×16 |
| `apple_D_red` | 3 | source palette | 1 | 16×16 |
| `arrow` | 3 | source palette | 1 | 32×32 |
| `arrow_x10` | 3 | source palette | 1 | 32×32 |
| `arrow_x2` | 3 | source palette | 1 | 32×32 |
| `arrow_x3` | 3 | source palette | 1 | 32×32 |
| `arrow_x5` | 3 | source palette | 1 | 32×32 |
| `baked_potato` | 3 | source palette | 1 | 16×16 |
| `banana` | 3 | source palette | 1 | 16×16 |
| `banana_bunch` | 3 | source palette | 1 | 16×16 |
| `bomb_A` | 3 | source palette | 1 | 32×32 |
| `bomb_A_lit` | 3 | source palette | 2 | 32×32 |
| `bomb_B` | 3 | source palette | 1 | 32×32 |
| `bomb_B_lit` | 3 | source palette | 2 | 32×32 |
| `booze` | 3 | source palette | 1 | 16×16 |
| `bowl` | 3 | source palette | 1 | 16×16 |
| `cabbage` | 3 | source palette | 1 | 16×16 |
| `cake_A` | 3 | source palette | 1 | 16×16 |
| `cake_B` | 3 | source palette | 1 | 16×16 |
| `cake_slice_A` | 3 | source palette | 1 | 16×16 |
| `cake_slice_B` | 3 | source palette | 1 | 16×16 |
| `candy_A` | 3 | source palette | 1 | 16×16 |
| `candy_B` | 3 | source palette | 1 | 16×16 |
| `candy_C` | 3 | source palette | 1 | 16×16 |
| `candy_D` | 3 | source palette | 1 | 16×16 |
| `candy_bar_A_unwrapped` | 3 | source palette | 1 | 16×16 |
| `candy_bar_A_wrapped` | 3 | source palette | 1 | 16×16 |
| `candy_bar_B_unwrapped` | 3 | source palette | 1 | 16×16 |
| `candy_bar_B_wrapped` | 3 | source palette | 1 | 16×16 |
| `candy_cane_A` | 3 | source palette | 1 | 16×16 |
| `candy_cane_B` | 3 | source palette | 1 | 16×16 |
| `cantaloupe` | 3 | source palette | 1 | 16×16 |
| `cantaloupe_slice` | 3 | source palette | 1 | 16×16 |
| `carrot` | 3 | source palette | 1 | 16×16 |
| `celery` | 3 | source palette | 1 | 16×16 |
| `cherry` | 3 | source palette | 1 | 16×16 |
| `chocolate_bar` | 3 | source palette | 1 | 16×16 |
| `chocolate_strawberry` | 3 | source palette | 1 | 16×16 |
| `coin` | 42 | blue, gold, green, red, silver, violet | 14 | 16×16, 32×32 |
| `cookie_A` | 3 | source palette | 1 | 16×16 |
| `cookie_B` | 3 | source palette | 1 | 16×16 |
| `cookie_C` | 3 | source palette | 1 | 16×16 |
| `cookie_D` | 3 | source palette | 1 | 16×16 |
| `cookie_sandwich` | 3 | source palette | 1 | 16×16 |
| `corn` | 3 | source palette | 1 | 16×16 |
| `cotton_candy_A` | 3 | source palette | 1 | 16×16 |
| `cotton_candy_B` | 3 | source palette | 1 | 16×16 |
| `cucumber` | 3 | source palette | 1 | 16×16 |
| `cupcake_A` | 3 | source palette | 1 | 16×16 |
| `cupcake_B` | 3 | source palette | 1 | 16×16 |
| `curry_and_rice` | 3 | source palette | 1 | 16×16 |
| `dynamite` | 3 | source palette | 1 | 32×32 |
| `dynamite_lit` | 3 | source palette | 2 | 32×32 |
| `eggplant` | 3 | source palette | 1 | 16×16 |
| `gem_A` | 42 | blue, gray, green, orange, red, violet, yellow | 7 | 16×16, 32×32 |
| `gem_B` | 42 | blue, gray, green, orange, red, violet, yellow | 7 | 16×16, 32×32 |
| `gem_C` | 42 | blue, gray, green, orange, red, violet, yellow | 7 | 16×16, 32×32 |
| `green_beans` | 3 | source palette | 1 | 16×16 |
| `green_grapes` | 3 | source palette | 1 | 16×16 |
| `green_pepper` | 3 | source palette | 1 | 16×16 |
| `heart_A` | 3 | source palette | 1 | 32×32 |
| `heart_A_half` | 3 | source palette | 1 | 32×32 |
| `heart_B` | 3 | source palette | 1 | 32×32 |
| `heart_B_half` | 3 | source palette | 1 | 32×32 |
| `heart_C` | 3 | source palette | 1 | 16×16 |
| `heart_C_half` | 3 | source palette | 1 | 16×16 |
| `heart_D` | 3 | source palette | 1 | 16×16 |
| `heart_D_half` | 3 | source palette | 1 | 16×16 |
| `ice_cream_sandwich` | 3 | source palette | 1 | 16×16 |
| `key_A` | 42 | blue, gold, green, red, silver, violet | 1 | 16×16, 32×32 |
| `key_B` | 6 | source palette | 1 | 16×16, 32×32 |
| `key_C` | 42 | blue, gold, green, red, silver, violet | 1 | 16×16, 32×32 |
| `leek` | 3 | source palette | 1 | 16×16 |
| `lemon` | 3 | source palette | 1 | 16×16 |
| `lettuce` | 3 | source palette | 1 | 16×16 |
| `lime` | 3 | source palette | 1 | 16×16 |
| `lollipop_A` | 3 | source palette | 1 | 16×16 |
| `lollipop_B` | 3 | source palette | 1 | 16×16 |
| `lollipop_C` | 3 | source palette | 1 | 16×16 |
| `lollipop_D` | 3 | source palette | 1 | 16×16 |
| `mango` | 3 | source palette | 1 | 16×16 |
| `mashed_potato_bowl` | 3 | source palette | 1 | 16×16 |
| `meat` | 6 | source palette | 1 | 16×16, 32×32 |
| `mushroom` | 3 | source palette | 1 | 16×16 |
| `orange` | 3 | orange | 1 | 16×16 |
| `pea_bowl` | 3 | source palette | 1 | 16×16 |
| `pear` | 3 | source palette | 1 | 16×16 |
| `plate` | 3 | source palette | 1 | 16×16 |
| `potato` | 3 | source palette | 1 | 16×16 |
| `potion_A_blue_full` | 3 | source palette | 1 | 32×32 |
| `potion_A_blue_half` | 3 | source palette | 1 | 32×32 |
| `potion_A_empty` | 3 | source palette | 1 | 32×32 |
| `potion_A_green_full` | 3 | source palette | 1 | 32×32 |
| `potion_A_green_half` | 3 | source palette | 1 | 32×32 |
| `potion_A_red_full` | 3 | source palette | 1 | 32×32 |
| `potion_A_red_half` | 3 | source palette | 1 | 32×32 |
| `potion_A_violet_full` | 3 | source palette | 1 | 32×32 |
| `potion_A_violet_half` | 3 | source palette | 1 | 32×32 |
| `potion_A_yellow_full` | 3 | source palette | 1 | 32×32 |
| `potion_A_yellow_half` | 3 | source palette | 1 | 32×32 |
| `potion_B_blue_full` | 3 | source palette | 1 | 32×32 |
| `potion_B_blue_half` | 3 | source palette | 1 | 32×32 |
| `potion_B_empty` | 3 | source palette | 1 | 32×32 |
| `potion_B_green_full` | 3 | source palette | 1 | 32×32 |
| `potion_B_green_half` | 3 | source palette | 1 | 32×32 |
| `potion_B_red_full` | 3 | source palette | 1 | 32×32 |
| `potion_B_red_half` | 3 | source palette | 1 | 32×32 |
| `potion_B_violet_full` | 3 | source palette | 1 | 32×32 |
| `potion_B_violet_half` | 3 | source palette | 1 | 32×32 |
| `potion_B_yellow_full` | 3 | source palette | 1 | 32×32 |
| `potion_B_yellow_half` | 3 | source palette | 1 | 32×32 |
| `potion_C_blue_full` | 3 | source palette | 1 | 32×32 |
| `potion_C_blue_half` | 3 | source palette | 1 | 32×32 |
| `potion_C_empty` | 3 | source palette | 1 | 32×32 |
| `potion_C_green_full` | 3 | source palette | 1 | 32×32 |
| `potion_C_green_half` | 3 | source palette | 1 | 32×32 |
| `potion_C_red_full` | 3 | source palette | 1 | 32×32 |
| `potion_C_red_half` | 3 | source palette | 1 | 32×32 |
| `potion_C_violet_full` | 3 | source palette | 1 | 32×32 |
| `potion_C_violet_half` | 3 | source palette | 1 | 32×32 |
| `potion_C_yellow_full` | 3 | source palette | 1 | 32×32 |
| `potion_C_yellow_half` | 3 | source palette | 1 | 32×32 |
| `red_grapes` | 3 | source palette | 1 | 16×16 |
| `red_onion` | 3 | source palette | 1 | 16×16 |
| `red_pepper` | 3 | source palette | 1 | 16×16 |
| `rice_bowl` | 3 | source palette | 1 | 16×16 |
| `snap_pea` | 3 | source palette | 1 | 16×16 |
| `spicy_curry` | 3 | source palette | 1 | 16×16 |
| `spicy_pepper` | 3 | source palette | 1 | 16×16 |
| `spike_ball_A_blue` | 3 | blue | 1 | 32×32 |
| `spike_ball_A_gray` | 3 | gray | 1 | 32×32 |
| `spike_ball_A_red` | 3 | red | 1 | 32×32 |
| `spike_ball_A_violet` | 3 | violet | 1 | 32×32 |
| `spike_ball_B_blue` | 3 | blue | 1 | 32×32 |
| `spike_ball_B_gray` | 3 | gray | 1 | 32×32 |
| `spike_ball_B_red` | 3 | red | 1 | 32×32 |
| `spike_ball_B_violet` | 3 | violet | 1 | 32×32 |
| `spike_ball_C_blue` | 3 | blue | 1 | 32×32 |
| `spike_ball_C_gray` | 3 | gray | 1 | 32×32 |
| `spike_ball_C_red` | 3 | red | 1 | 32×32 |
| `spike_ball_C_violet` | 3 | violet | 1 | 32×32 |
| `spike_ball_D_green` | 3 | green | 1 | 32×32 |
| `spike_ball_D_red` | 3 | red | 1 | 32×32 |
| `spike_ball_D_violet` | 3 | violet | 1 | 32×32 |
| `spike_ball_D_yellow` | 3 | yellow | 1 | 32×32 |
| `spike_ball_E_blue` | 3 | blue | 1 | 32×32 |
| `spike_ball_E_gray` | 3 | gray | 1 | 32×32 |
| `spike_ball_E_red` | 3 | red | 1 | 32×32 |
| `spike_ball_E_violet` | 3 | violet | 1 | 32×32 |
| `spike_ball_F_blue` | 3 | blue | 1 | 32×32 |
| `spike_ball_F_gray` | 3 | gray | 1 | 32×32 |
| `spike_ball_F_red` | 3 | red | 1 | 32×32 |
| `spike_ball_F_violet` | 3 | violet | 1 | 32×32 |
| `spike_ball_G_green` | 3 | green | 1 | 32×32 |
| `spike_ball_G_red` | 3 | red | 1 | 32×32 |
| `spike_ball_G_violet` | 3 | violet | 1 | 32×32 |
| `spike_ball_G_yellow` | 3 | yellow | 1 | 32×32 |
| `spikes_A_down` | 3 | source palette | 1 | 32×32 |
| `spikes_A_left` | 3 | source palette | 1 | 32×32 |
| `spikes_A_right` | 3 | source palette | 1 | 32×32 |
| `spikes_A_up` | 3 | source palette | 1 | 32×32 |
| `spikes_B_down` | 3 | source palette | 1 | 32×32 |
| `spikes_B_left` | 3 | source palette | 1 | 32×32 |
| `spikes_B_right` | 3 | source palette | 1 | 32×32 |
| `spikes_B_up` | 3 | source palette | 1 | 32×32 |
| `spikes_C_down` | 3 | source palette | 1 | 32×32 |
| `spikes_C_left` | 3 | source palette | 1 | 32×32 |
| `spikes_C_right` | 3 | source palette | 1 | 32×32 |
| `spikes_C_up` | 3 | source palette | 1 | 32×32 |
| `spikes_D_down` | 3 | source palette | 1 | 32×32 |
| `spikes_D_left` | 3 | source palette | 1 | 32×32 |
| `spikes_D_right` | 3 | source palette | 1 | 32×32 |
| `spikes_D_up` | 3 | source palette | 1 | 32×32 |
| `spikes_E_down` | 3 | source palette | 1 | 32×32 |
| `spikes_E_left` | 3 | source palette | 1 | 32×32 |
| `spikes_E_right` | 3 | source palette | 1 | 32×32 |
| `spikes_E_up` | 3 | source palette | 1 | 32×32 |
| `spikes_F_down` | 3 | source palette | 1 | 32×32 |
| `spikes_F_left` | 3 | source palette | 1 | 32×32 |
| `spikes_F_right` | 3 | source palette | 1 | 32×32 |
| `spikes_F_up` | 3 | source palette | 1 | 32×32 |
| `spikes_G_down` | 3 | source palette | 1 | 32×32 |
| `spikes_G_left` | 3 | source palette | 1 | 32×32 |
| `spikes_G_right` | 3 | source palette | 1 | 32×32 |
| `spikes_G_up` | 3 | source palette | 1 | 32×32 |
| `spikes_H_down` | 3 | source palette | 1 | 32×32 |
| `spikes_H_left` | 3 | source palette | 1 | 32×32 |
| `spikes_H_right` | 3 | source palette | 1 | 32×32 |
| `spikes_H_up` | 3 | source palette | 1 | 32×32 |
| `spikes_I_down` | 3 | source palette | 1 | 32×32 |
| `spikes_I_left` | 3 | source palette | 1 | 32×32 |
| `spikes_I_right` | 3 | source palette | 1 | 32×32 |
| `spikes_I_up` | 3 | source palette | 1 | 32×32 |
| `spikes_J_down` | 3 | source palette | 1 | 32×32 |
| `spikes_J_left` | 3 | source palette | 1 | 32×32 |
| `spikes_J_right` | 3 | source palette | 1 | 32×32 |
| `spikes_J_up` | 3 | source palette | 1 | 32×32 |
| `spikes_K_down` | 3 | source palette | 1 | 32×32 |
| `spikes_K_left` | 3 | source palette | 1 | 32×32 |
| `spikes_K_right` | 3 | source palette | 1 | 32×32 |
| `spikes_K_up` | 3 | source palette | 1 | 32×32 |
| `spikes_L_down` | 3 | source palette | 1 | 32×32 |
| `spikes_L_left` | 3 | source palette | 1 | 32×32 |
| `spikes_L_right` | 3 | source palette | 1 | 32×32 |
| `spikes_L_up` | 3 | source palette | 1 | 32×32 |
| `spikes_M_down` | 3 | source palette | 1 | 32×32 |
| `spikes_M_left` | 3 | source palette | 1 | 32×32 |
| `spikes_M_right` | 3 | source palette | 1 | 32×32 |
| `spikes_M_up` | 3 | source palette | 1 | 32×32 |
| `spikes_N_down` | 3 | source palette | 1 | 32×32 |
| `spikes_N_left` | 3 | source palette | 1 | 32×32 |
| `spikes_N_right` | 3 | source palette | 1 | 32×32 |
| `spikes_N_up` | 3 | source palette | 1 | 32×32 |
| `spikes_O_down` | 3 | source palette | 1 | 32×32 |
| `spikes_O_left` | 3 | source palette | 1 | 32×32 |
| `spikes_O_right` | 3 | source palette | 1 | 32×32 |
| `spikes_O_up` | 3 | source palette | 1 | 32×32 |
| `spikes_P_down` | 3 | source palette | 1 | 32×32 |
| `spikes_P_left` | 3 | source palette | 1 | 32×32 |
| `spikes_P_right` | 3 | source palette | 1 | 32×32 |
| `spikes_P_up` | 3 | source palette | 1 | 32×32 |
| `spikes_Q_down` | 3 | source palette | 1 | 32×32 |
| `spikes_Q_left` | 3 | source palette | 1 | 32×32 |
| `spikes_Q_right` | 3 | source palette | 1 | 32×32 |
| `spikes_Q_up` | 3 | source palette | 1 | 32×32 |
| `spikes_R_down` | 3 | source palette | 1 | 32×32 |
| `spikes_R_left` | 3 | source palette | 1 | 32×32 |
| `spikes_R_right` | 3 | source palette | 1 | 32×32 |
| `spikes_R_up` | 3 | source palette | 1 | 32×32 |
| `spikes_S_down` | 3 | source palette | 1 | 32×32 |
| `spikes_S_left` | 3 | source palette | 1 | 32×32 |
| `spikes_S_right` | 3 | source palette | 1 | 32×32 |
| `spikes_S_up` | 3 | source palette | 1 | 32×32 |
| `spikes_T_down` | 3 | source palette | 1 | 32×32 |
| `spikes_T_left` | 3 | source palette | 1 | 32×32 |
| `spikes_T_right` | 3 | source palette | 1 | 32×32 |
| `spikes_T_up` | 3 | source palette | 1 | 32×32 |
| `spring_A` | 3 | source palette | 8 | 32×32 |
| `spring_B` | 3 | source palette | 8 | 32×32 |
| `star_A` | 6 | source palette | 1 | 16×16, 32×32 |
| `star_B` | 6 | source palette | 1 | 16×16, 32×32 |
| `stir_fry` | 3 | source palette | 1 | 16×16 |
| `strawberry` | 3 | source palette | 1 | 16×16 |
| `tnt_A` | 3 | source palette | 8 | 32×32 |
| `tnt_B` | 3 | source palette | 8 | 32×32 |
| `tomato` | 3 | source palette | 1 | 16×16 |
| `tomato_soup` | 3 | source palette | 1 | 16×16 |
| `turkey` | 3 | source palette | 1 | 16×16 |
| `turkey_plate` | 3 | source palette | 1 | 16×16 |
| `watermelon` | 3 | source palette | 1 | 16×16 |
| `watermelon_slice` | 3 | source palette | 1 | 16×16 |
| `white_onion` | 3 | source palette | 1 | 16×16 |
| `wine` | 3 | source palette | 1 | 16×16 |
| `yellow_pepper` | 3 | source palette | 1 | 16×16 |

## Super Pixel Blood FX Pack 1.zip

Source: `Visuals/Super Pixel Blood FX Pack 1.zip`. 120 sequences/static assets in 10 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `bldfx1_blood_burst_A` | 12 | blue, green, orange, red, violet, yellow | 9 | 32×32, 64×64 |
| `bldfx1_blood_burst_B` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `bldfx1_blood_burst_C` | 12 | blue, green, orange, red, violet, yellow | 9 | 32×32, 64×64 |
| `bldfx1_blood_splash_A` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `bldfx1_blood_splash_B` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `bldfx1_blood_splash_C` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `bldfx1_blood_splash_D` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `bldfx1_blood_stream_A` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `bldfx1_blood_stream_B` | 12 | blue, green, orange, red, violet, yellow | 9 | 32×32, 64×64 |
| `bldfx1_blood_stream_C` | 12 | blue, green, orange, red, violet, yellow | 9 | 32×32, 64×64 |

## Super Pixel Effects Gigapack v3.0.0.zip

Source: `Visuals/Super Pixel Effects Gigapack v3.0.0.zip`. 2296 sequences/static assets in 175 families. Formats: .txt, .gif, .html, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `epic_explosion_001` | 12 | blue, green, orange, red, violet, yellow | 13 | 128×128, 64×64 |
| `epic_explosion_002` | 16 | blue, green, orange, pink, red, violet, white, yellow | 15 | 192×192, 96×96 |
| `epic_explosion_003` | 12 | blue, green, orange, red, violet, yellow | 13 | 128×128, 64×64 |
| `stylized_explosion_001` | 16 | blue, green, orange, pink, red, violet, white, yellow | 9 | 48×48, 96×96 |
| `stylized_explosion_002` | 16 | blue, green, orange, pink, red, violet, white, yellow | 10 | 48×48, 96×96 |
| `stylized_explosion_003` | 16 | blue, green, orange, pink, red, violet, white, yellow | 14 | 128×96, 64×48 |
| `stylized_explosion_004` | 12 | blue, green, orange, red, violet, yellow | 23 | 128×128, 64×64 |
| `stylized_explosion_005` | 12 | blue, green, orange, red, violet, yellow | 26 | 128×128, 64×64 |
| `stylized_explosion_006` | 12 | blue, green, orange, red, violet, yellow | 12 | 48×48, 96×96 |
| `symmetrical_explosion_001` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 32×32, 64×64 |
| `symmetrical_explosion_002` | 12 | blue, green, orange, red, violet, yellow | 11 | 32×32, 64×64 |
| `symmetrical_explosion_003` | 12 | blue, green, orange, red, violet, yellow | 12, 14 | 48×48, 96×96 |
| `symmetrical_explosion_004` | 12 | blue, green, orange, red, violet, yellow | 10, 12 | 48×48, 96×96 |
| `spell_absorb_001` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 31 | 128×128, 64×64 |
| `spell_attack_up_001` | 12 | blue, green, orange, red, violet, yellow | 18 | 128×128, 64×64 |
| `spell_buff_001` | 12 | blue, green, orange, red, violet, yellow | 30 | 128×128, 64×64 |
| `spell_death_001` | 12 | blue, green, orange, red, violet, yellow | 50 | 32×32, 64×64 |
| `spell_debuff_001` | 12 | blue, green, orange, red, violet, yellow | 33 | 128×128, 64×64 |
| `spell_defense_up_001` | 12 | blue, green, orange, red, violet, yellow | 18 | 128×128, 64×64 |
| `spell_dispel_001` | 14 | blue, green, orange, pink, red, violet, yellow | 22 | 128×128, 64×64 |
| `spell_forge_001` | 12 | blue, green, orange, red, violet, yellow | 16 | 48×48, 96×96 |
| `spell_haste_001` | 12 | blue, green, orange, red, violet, yellow | 29 | 128×128, 64×64 |
| `spell_heal_001` | 14 | blue, green, orange, pink, red, violet, yellow | 16 | 128×128, 64×64 |
| `spell_heal_002` | 14 | blue, green, orange, pink, red, violet, yellow | 36 | 128×128, 64×64 |
| `spell_heal_003` | 14 | blue, green, orange, pink, red, violet, yellow | 42 | 48×48, 96×96 |
| `spell_ice_001` | 12 | blue, green, orange, red, violet, yellow | 40 | 128×128, 64×64 |
| `spell_poison_001` | 20 | black, blue, brown, gray, green, orange, pink, red, violet, yellow | 17 | 128×128, 64×64 |
| `spell_sleep_001` | 12 | blue, green, orange, red, violet, yellow | 48 | 48×48, 96×96 |
| `spell_thorns_001` | 12 | blue, green, orange, red, violet, yellow | 23 | 160×96, 80×48 |
| `status_poison_001` | 12 | blue, green, orange, red, violet, yellow | 24 | 48×48, 96×96 |
| `status_sleep_001` | 12 | blue, green, orange, red, violet, yellow | 22 | 24×24, 48×48 |
| `status_sparkling_001` | 12 | blue, green, orange, red, violet, yellow | 24 | 48×48, 96×96 |
| `directional_fire_burst_001` | 12 | blue, green, orange, red, violet, yellow | 12 | 24×48, 48×96 |
| `directional_fire_burst_002` | 12 | blue, green, orange, red, violet, yellow | 19 | 16×32, 32×64 |
| `fire_looping_001` | 16 | black, blue, green, orange, red, violet, white, yellow | 12 | 32×32, 64×64 |
| `fire_looping_002A` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 16 | 48×48, 96×96 |
| `fire_looping_002B` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 16 | 48×48, 96×96 |
| `fire_looping_003A` | 12 | blue, green, orange, red, violet, yellow | 5 | 40×64, 80×128 |
| `fire_looping_003B` | 12 | blue, green, orange, red, violet, yellow | 15 | 48×64, 96×128 |
| `fire_looping_004A` | 12 | blue, green, orange, red, violet, yellow | 5 | 40×64, 80×128 |
| `fire_looping_004B` | 12 | blue, green, orange, red, violet, yellow | 15 | 40×64, 80×128 |
| `directional_impact_001` | 16 | black, blue, green, orange, red, violet, white, yellow | 7 | 32×32, 64×64 |
| `directional_impact_002` | 20 | black, blue, brown, gray, green, orange, red, violet, white, yellow | 7 | 140×50, 70×25 |
| `directional_impact_003` | 12 | blue, green, orange, red, violet, yellow | 6 | 40×40, 80×80 |
| `directional_impact_004` | 12 | blue, green, orange, red, violet, yellow | 5 | 40×40, 80×80 |
| `directional_impact_005` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 48×40, 96×80 |
| `stylized_impact_001` | 14 | blue, green, orange, red, violet, white, yellow | 9 | 128×128, 64×64 |
| `symmetrical_impact_001` | 14 | blue, green, orange, red, violet, white, yellow | 7 | 48×48, 96×96 |
| `symmetrical_impact_002` | 14 | blue, green, orange, red, violet, white, yellow | 10 | 48×48, 96×96 |
| `symmetrical_impact_003` | 14 | blue, green, orange, red, violet, white, yellow | 7 | 48×48, 96×96 |
| `symmetrical_impact_004` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 48×48, 96×96 |
| `symmetrical_impact_005` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 48×48, 96×96 |
| `symmetrical_impact_006` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 160×160, 80×80 |
| `toon_impact_001` | 12 | blue, green, orange, red, violet, yellow | 11 | 128×128, 64×64 |
| `lightning_burst_001` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `lightning_burst_002` | 14 | blue, green, orange, red, violet, white, yellow | 9 | 32×32, 64×64 |
| `lightning_burst_003` | 12 | blue, green, orange, red, violet, yellow | 10 | 48×48, 96×96 |
| `lightning_strike_001` | 12 | blue, green, orange, red, violet, yellow | 7 | 128×128, 64×64 |
| `lightning_strike_002A` | 12 | blue, green, orange, red, violet, yellow | 7 | 144×128, 72×64 |
| `lightning_strike_002B` | 12 | blue, green, orange, red, violet, yellow | 7 | 144×128, 72×64 |
| `lightning_strike_003A` | 12 | blue, green, orange, red, violet, yellow | 8 | 48×64, 96×128 |
| `lightning_strike_003B` | 12 | blue, green, orange, red, violet, yellow | 8 | 48×64, 96×128 |
| `directional_bubble_burst_001` | 12 | blue, green, orange, red, violet, yellow | 40 | 128×128, 64×64 |
| `directional_coin_burst_001` | 12 | blue, green, orange, red, violet, yellow | 31 | 128×128, 64×64 |
| `directional_heart_burst_001` | 12 | blue, green, orange, red, violet, yellow | 30 | 128×128, 64×64 |
| `directional_heart_burst_002` | 12 | blue, green, orange, red, violet, yellow | 23 | 128×128, 64×64 |
| `directional_heart_burst_003` | 14 | blue, green, orange, pink, red, violet, yellow | 35 | 128×128, 64×64 |
| `directional_music_burst_001` | 12 | blue, green, orange, red, violet, yellow | 21 | 128×128, 64×64 |
| `directional_music_burst_002` | 12 | blue, green, orange, red, violet, yellow | 17 | 128×128, 64×64 |
| `directional_particle_burst_001` | 12 | blue, green, orange, red, violet, yellow | 16 | 128×128, 64×64 |
| `directional_particle_burst_002` | 12 | blue, green, orange, red, violet, yellow | 14 | 48×64, 96×128 |
| `directional_party_burst_001` | 12 | blue, green, orange, red, violet, yellow | 34 | 128×128, 64×64 |
| `directional_sparkle_burst_001` | 12 | blue, green, orange, red, violet, yellow | 16 | 128×128, 64×64 |
| `directional_sparkle_burst_002` | 12 | blue, green, orange, red, violet, yellow | 26 | 128×128, 64×64 |
| `directional_sparkle_burst_003` | 12 | blue, green, orange, red, violet, yellow | 30 | 128×128, 64×64 |
| `directional_star_burst_001` | 12 | blue, green, orange, red, violet, yellow | 30 | 128×128, 64×64 |
| `round_bubble_burst_001` | 12 | blue, green, orange, red, violet, yellow | 15 | 128×128, 64×64 |
| `round_firework_burst_001` | 14 | blue, green, orange, pink, red, violet, yellow | 15 | 48×48, 96×96 |
| `round_firework_burst_002` | 14 | blue, green, orange, pink, red, violet, yellow | 27 | 48×48, 96×96 |
| `round_heart_burst_001` | 12 | blue, green, orange, red, violet, yellow | 23 | 128×128, 64×64 |
| `round_light_burst_001` | 16 | black, blue, green, orange, red, violet, white, yellow | 9 | 128×72, 256×144 |
| `round_music_burst_001` | 12 | blue, green, orange, red, violet, yellow | 18 | 128×128, 64×64 |
| `round_sparkle_burst_001` | 16 | blue, green, orange, red, violet, white, yellow | 14 | 32×32, 64×64 |
| `round_sparkle_burst_002` | 14 | blue, green, orange, red, violet, white, yellow | 18 | 32×32, 64×64 |
| `round_sparkle_burst_003` | 12 | blue, green, orange, red, violet, yellow | 17 | 32×32, 64×64 |
| `scifi_analyze_001` | 12 | blue, green, orange, red, violet, yellow | 120 | 144×144, 72×72 |
| `scifi_boost_001` | 12 | blue, green, orange, red, violet, yellow | 11 | 128×64, 64×32 |
| `scifi_charge_up_001` | 20 | black, blue, gray, green, orange, pink, red, violet, white, yellow | 12 | 48×48, 96×96 |
| `scifi_charge_up_002` | 12 | blue, green, orange, red, violet, yellow | 12 | 128×128, 64×64 |
| `scifi_charge_up_003` | 12 | blue, green, orange, red, violet, yellow | 16 | 128×128, 64×64 |
| `scifi_charge_up_004` | 12 | blue, green, orange, red, violet, yellow | 40 | 48×48, 96×96 |
| `scifi_heartbeat_fast_001` | 12 | blue, green, orange, red, violet, yellow | 22 | 32×16, 64×32 |
| `scifi_heartbeat_flatline_001` | 12 | blue, green, orange, red, violet, yellow | 22 | 32×16, 64×32 |
| `scifi_heartbeat_slow_001` | 12 | blue, green, orange, red, violet, yellow | 22 | 32×16, 64×32 |
| `scifi_muzzle_flash_001` | 12 | blue, green, orange, red, violet, yellow | 6 | 16×16, 32×32 |
| `scifi_muzzle_flash_002` | 12 | blue, green, orange, red, violet, yellow | 9 | 48×24, 96×48 |
| `scifi_muzzle_flash_003` | 12 | blue, green, orange, red, violet, yellow | 8 | 48×24, 96×48 |
| `scifi_spark_burst_001` | 12 | blue, green, orange, red, violet, yellow | 12 | 128×128, 64×64 |
| `scifi_spark_burst_002` | 12 | blue, green, orange, red, violet, yellow | 32 | 128×128, 64×64 |
| `scifi_warp_001` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 10 | 128×128, 64×64 |
| `scifi_warp_002` | 12 | blue, green, orange, red, violet, yellow | 10 | 48×48, 96×96 |
| `scifi_warp_003` | 12 | blue, green, orange, red, violet, yellow | 12 | 128×128, 64×64 |
| `directional_smoke_burst_001` | 14 | blue, green, orange, red, violet, white, yellow | 21 | 32×32, 64×64 |
| `directional_smoke_burst_002` | 16 | blue, gray, green, orange, red, violet, white, yellow | 16, 18 | 48×48, 96×96 |
| `directional_smoke_burst_003` | 16 | blue, brown, green, orange, red, violet, white, yellow | 8 | 40×40, 80×80 |
| `directional_smoke_burst_004` | 16 | black, blue, green, orange, red, violet, white, yellow | 17 | 24×40, 48×80 |
| `directional_smoke_burst_005` | 14 | blue, gray, green, orange, red, violet, yellow | 9 | 48×24, 96×48 |
| `looping_smoke_burst_001` | 20 | black, blue, brown, gray, green, orange, red, violet, white, yellow | 15 | 48×48, 96×96 |
| `looping_smoke_burst_002` | 20 | black, blue, brown, gray, green, orange, red, violet, white, yellow | 16 | 32×32, 64×64 |
| `stylized_skull_smoke_burst_001` | 14 | blue, green, orange, red, violet, white, yellow | 12 | 32×32, 64×64 |
| `symmetrical_smoke_burst_001` | 18 | black, blue, brown, green, orange, red, violet, white, yellow | 10 | 32×32, 64×64 |
| `symmetrical_smoke_burst_002` | 16 | blue, gray, green, orange, red, violet, white, yellow | 11, 13 | 128×128, 64×64 |
| `symmetrical_smoke_burst_003` | 16 | blue, brown, green, orange, red, violet, white, yellow | 10 | 128×128, 64×64 |
| `burst_splatter_001` | 16 | black, blue, green, orange, red, violet, white, yellow | 10 | 32×32, 64×64 |
| `burst_splatter_002` | 16 | black, blue, gray, green, orange, red, violet, yellow | 8 | 48×48, 96×96 |
| `burst_splatter_003` | 16 | black, blue, gray, green, orange, red, violet, yellow | 8 | 48×48, 96×96 |
| `directional_splatter_001` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `directional_splatter_002` | 12 | blue, green, orange, red, violet, yellow | 9 | 48×48, 96×96 |
| `directional_splatter_003` | 16 | black, blue, gray, green, orange, red, violet, yellow | 7 | 24×24, 48×48 |
| `directional_splatter_004` | 16 | black, blue, gray, green, orange, red, violet, yellow | 7 | 24×24, 48×48 |
| `directional_splatter_005` | 16 | black, blue, gray, green, orange, red, violet, yellow | 7 | 24×32, 48×64 |
| `symbol_alert_001` | 12 | blue, green, orange, red, violet, yellow | 14 | 40×40, 80×80 |
| `symbol_alert_002` | 12 | blue, green, orange, red, violet, yellow | 16 | 40×40, 80×80 |
| `symbol_alert_text_001` | 12 | blue, green, orange, red, violet, yellow | 32 | 144×96, 72×48 |
| `symbol_alert_text_002` | 12 | blue, green, orange, red, violet, yellow | 48 | 36×36, 72×72 |
| `symbol_attack_up_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_awesome_text_001` | 12 | blue, green, orange, red, violet, yellow | 41, 42 | 128×64, 256×128 |
| `symbol_bonus_text_001` | 12 | blue, green, orange, red, violet, yellow | 37, 38 | 128×64, 256×128 |
| `symbol_bonus_text_002` | 12 | blue, green, orange, red, violet, yellow | 43, 44 | 128×48, 256×96 |
| `symbol_clear_text_001` | 12 | blue, green, orange, red, violet, yellow | 43, 44 | 128×48, 256×96 |
| `symbol_complete_text_001` | 12 | blue, green, orange, red, violet, yellow | 55, 56 | 160×48, 320×96 |
| `symbol_cool_text_001` | 12 | blue, green, orange, red, violet, yellow | 35, 36 | 160×128, 80×64 |
| `symbol_crown_001` | 14 | blue, gray, green, orange, red, violet, yellow | 45 | 32×24, 64×48 |
| `symbol_danger_text_001` | 12 | blue, green, orange, red, violet, yellow | 32 | 144×96, 72×48 |
| `symbol_defense_up_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_failure_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_failure_text_001` | 12 | blue, green, orange, red, violet, yellow | 51, 52 | 128×48, 256×96 |
| `symbol_game_over_text_001` | 12 | blue, green, orange, red, violet, yellow | 44 | 208×64, 416×128 |
| `symbol_game_over_text_002` | 12 | blue, green, orange, red, violet, yellow | 59, 60 | 176×48, 352×96 |
| `symbol_great_text_001` | 12 | blue, green, orange, red, violet, yellow | 37, 38 | 192×128, 96×64 |
| `symbol_groovy_text_001` | 12 | blue, green, orange, red, violet, yellow | 39, 40 | 128×64, 256×128 |
| `symbol_level_up_text_001` | 12 | blue, green, orange, red, violet, yellow | 43, 44 | 160×64, 320×128 |
| `symbol_level_up_text_002` | 12 | blue, green, orange, red, violet, yellow | 59, 60 | 160×48, 320×96 |
| `symbol_lightbulb_001` | 12 | blue, green, orange, red, violet, yellow | 12 | 48×48, 96×96 |
| `symbol_magic_up_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_mission_start_text_001` | 12 | blue, green, orange, red, violet, yellow | 75, 76 | 240×48, 480×96 |
| `symbol_nice_text_001` | 12 | blue, green, orange, red, violet, yellow | 35, 36 | 160×128, 80×64 |
| `symbol_place_1st_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_place_2nd_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_place_3rd_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_place_4th_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_place_5th_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_place_6th_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_place_7th_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_place_8th_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_power_up_text_001` | 12 | blue, green, orange, red, violet, yellow | 59, 60 | 160×48, 320×96 |
| `symbol_question_001` | 18 | black, blue, gray, green, orange, pink, red, violet, yellow | 30 | 48×48, 96×96 |
| `symbol_radical_text_001` | 12 | blue, green, orange, red, violet, yellow | 41, 42 | 128×64, 256×128 |
| `symbol_rank_A_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_rank_B_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_rank_C_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_rank_D_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_rank_F_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_rank_S_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_ready_text_001` | 12 | blue, green, orange, red, violet, yellow | 43, 44 | 128×48, 256×96 |
| `symbol_success_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_thumbs_down_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_thumbs_up_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_tubular_text_001` | 12 | blue, green, orange, red, violet, yellow | 41, 42 | 128×64, 256×128 |
| `symbol_victory_text_001` | 12 | blue, green, orange, red, violet, yellow | 51, 52 | 128×48, 256×96 |
| `symbol_warning_001` | 12 | blue, green, orange, red, violet, yellow | 60 | 40×40, 80×80 |
| `symbol_warning_text_001` | 12 | blue, green, orange, red, violet, yellow | 32 | 176×96, 88×48 |
| `symbol_wow_text_001` | 12 | blue, green, orange, red, violet, yellow | 33, 34 | 160×128, 80×64 |
| `symbol_you_lost_text_001` | 12 | blue, green, orange, red, violet, yellow | 47, 48 | 180×64, 360×128 |
| `symbol_you_won_text_001` | 12 | blue, green, orange, red, violet, yellow | 41, 42 | 144×64, 288×128 |

## Super Pixel Effects Pack 3.zip

Source: `Visuals/Super Pixel Effects Pack 3.zip`. 128 sequences/static assets in 14 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `fx3_bite` | 12 | blue, green, orange, red, violet, yellow | 17 | 32×32, 64×64 |
| `fx3_dust_trail_large_dark_brown` | 1 | brown | 10 | 64×32 |
| `fx3_dust_trail` | 4 | gray, white | 10 | 32×16, 64×32 |
| `fx3_dust_trail_large_light_brown` | 1 | brown | 10 | 64×32 |
| `fx3_dust_trail_small_dark_brown` | 1 | brown | 10 | 32×16 |
| `fx3_dust_trail_small_light_brown` | 1 | brown | 10 | 32×16 |
| `fx3_impact_hit` | 12 | blue, green, orange, red, violet, yellow | 8 | 48×28, 94×56 |
| `fx3_lightning_aura` | 12 | blue, green, orange, red, violet, yellow | 22 | 32×32, 64×64 |
| `fx3_magic_spawn` | 12 | blue, green, orange, red, violet, yellow | 17 | 32×32, 64×64 |
| `fx3_smoke_bomb` | 18 | black, blue, brown, green, orange, red, violet, white, yellow | 10 | 32×32, 64×64 |
| `fx3_splatter` | 14 | blue, gray, green, orange, red, violet, yellow | 10 | 32×32, 64×64 |
| `fx3_toon_explosion` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 32×32, 64×64 |
| `fx3_toon_impact` | 12 | blue, green, orange, red, violet, yellow | 8 | 48×48, 96×96 |
| `fx3_warp` | 14 | blue, green, orange, pink, red, violet, yellow | 10 | 32×32, 64×64 |

## Super Pixel Explosion FX Pack 1.zip

Source: `Visuals/Super Pixel Explosion FX Pack 1.zip`. 160 sequences/static assets in 10 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `expfx1_epic_explosion_A` | 16 | blue, green, orange, pink, red, violet, white, yellow | 14 | 48×48, 96×96 |
| `expfx1_epic_explosion_B` | 16 | blue, green, orange, pink, red, violet, white, yellow | 13 | 160×160, 80×80 |
| `expfx1_epic_explosion_C` | 16 | blue, green, orange, pink, red, violet, white, yellow | 15 | 192×192, 96×96 |
| `expfx1_stylized_explosion_A` | 16 | blue, green, orange, pink, red, violet, white, yellow | 9 | 48×48, 96×96 |
| `expfx1_stylized_explosion_B` | 16 | blue, green, orange, pink, red, violet, white, yellow | 10 | 48×48, 96×96 |
| `expfx1_stylized_explosion_C` | 16 | blue, green, orange, pink, red, violet, white, yellow | 14 | 128×96, 64×48 |
| `expfx1_symmetrical_explosion_A` | 16 | blue, green, orange, pink, red, violet, white, yellow | 9 | 48×48, 96×96 |
| `expfx1_symmetrical_explosion_B` | 16 | blue, green, orange, pink, red, violet, white, yellow | 10 | 48×48, 96×96 |
| `expfx1_symmetrical_explosion_C` | 16 | blue, green, orange, pink, red, violet, white, yellow | 11 | 48×48, 96×96 |
| `expfx1_symmetrical_explosion_D` | 16 | blue, green, orange, pink, red, violet, white, yellow | 10 | 128×128, 64×64 |

## Super Pixel Fantasy FX Pack 1 v1_1.zip

Source: `Visuals/Super Pixel Fantasy FX Pack 1 v1_1.zip`. 184 sequences/static assets in 58 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `fanfx1_magic_burst_A` | 16 | blue, green, orange, red, violet, white, yellow | 14 | 32×32, 64×64 |
| `fanfx1_magic_burst_B` | 16 | blue, green, orange, red, violet, white, yellow | 20 | 128×128, 64×64 |
| `fanfx1_magic_puff_A` | 14 | blue, green, orange, red, violet, white, yellow | 18 | 32×32, 64×64 |
| `fanfx1_magic_puff_B` | 14 | blue, green, orange, red, violet, white, yellow | 21 | 32×32, 64×64 |
| `fanfx1_power_up` | 12 | blue, green, orange, red, violet, yellow | 16 | 32×32, 64×64 |
| `fanfx1_skull_puff` | 14 | blue, green, orange, red, violet, white, yellow | 12 | 32×32, 64×64 |
| `fanfx1_spellcast_A` | 14 | blue, green, orange, red, violet, yellow | 18 | 32×32, 64×64 |
| `fanfx1_spellcast_B` | 12 | blue, green, orange, red, violet, yellow | 24 | 32×32, 64×64 |
| `fanfx1_spellcast_B_large_blue_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_blue_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_green_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_green_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_orange_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_orange_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_red_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_red_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_violet_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_violet_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_yellow_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_large_yellow_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_B_small_blue_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_blue_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_green_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_green_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_orange_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_orange_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_red_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_red_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_violet_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_violet_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_yellow_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_B_small_yellow_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C` | 12 | blue, green, orange, red, violet, yellow | 24 | 32×32, 64×64 |
| `fanfx1_spellcast_C_large_blue_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_blue_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_green_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_green_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_orange_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_orange_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_red_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_red_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_violet_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_violet_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_yellow_back` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_large_yellow_front` | 1 | source palette | 24 | 64×64 |
| `fanfx1_spellcast_C_small_blue_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_blue_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_green_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_green_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_orange_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_orange_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_red_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_red_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_violet_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_violet_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_yellow_back` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_C_small_yellow_front` | 1 | source palette | 24 | 32×32 |
| `fanfx1_spellcast_D` | 12 | blue, green, orange, red, violet, yellow | 29 | 32×32, 64×64 |

## Super Pixel Fantasy FX Pack 2 v1_1.zip

Source: `Visuals/Super Pixel Fantasy FX Pack 2 v1_1.zip`. 298 sequences/static assets in 43 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `fanfx2_absorb` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 31 | 128×128, 64×64 |
| `fanfx2_claw` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 13 | 128×128, 64×64 |
| `fanfx2_cure` | 14 | blue, green, orange, pink, red, violet, yellow | 35 | 128×128, 64×64 |
| `fanfx2_cure_large_blue_back` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_blue_front` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_green_back` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_green_front` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_orange_back` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_orange_front` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_pink_back` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_pink_front` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_red_back` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_red_front` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_violet_back` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_violet_front` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_yellow_back` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_large_yellow_front` | 1 | source palette | 35 | 128×128 |
| `fanfx2_cure_small_blue_back` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_blue_front` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_green_back` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_green_front` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_orange_back` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_orange_front` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_pink_back` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_pink_front` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_red_back` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_red_front` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_violet_back` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_violet_front` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_yellow_back` | 1 | source palette | 35 | 64×64 |
| `fanfx2_cure_small_yellow_front` | 1 | source palette | 35 | 64×64 |
| `fanfx2_earth_spikes` | 16 | black, blue, brown, green, orange, red, violet, yellow | 32 | 160×128, 80×64 |
| `fanfx2_fire_spell` | 20 | black, blue, gray, green, orange, pink, red, violet, white, yellow | 23 | 160×160, 80×80 |
| `fanfx2_ice_spell` | 18 | black, blue, gray, green, orange, pink, red, violet, yellow | 50 | 192×192, 96×96 |
| `fanfx2_lightning_spell_end` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 2 | 32×64, 64×128 |
| `fanfx2_lightning_spell_loop` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 8 | 32×64, 64×128 |
| `fanfx2_lightning_spell_start` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 2 | 32×64, 64×128 |
| `fanfx2_lightning_spell_tileable_end` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 2 | 32×64, 64×128 |
| `fanfx2_lightning_spell_tileable_loop` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 8 | 32×64, 64×128 |
| `fanfx2_lightning_spell_tileable_start` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 2 | 32×64, 64×128 |
| `fanfx2_poison` | 20 | black, blue, brown, gray, green, orange, pink, red, violet, yellow | 17 | 128×128, 64×64 |
| `fanfx2_shatter` | 18 | black, blue, gray, green, orange, pink, red, violet, yellow | 27 | 192×192, 96×96 |
| `fanfx2_wind_spell` | 20 | black, blue, brown, green, orange, pink, red, violet, white, yellow | 31 | 192×192, 96×96 |

## Super Pixel Impact FX Pack 1.zip

Source: `Visuals/Super Pixel Impact FX Pack 1.zip`. 140 sequences/static assets in 10 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `impfx1_dust_impact_A` | 14 | blue, green, orange, red, violet, white, yellow | 9 | 48×48, 96×96 |
| `impfx1_dust_impact_B` | 14 | blue, green, orange, red, violet, white, yellow | 11 | 48×48, 96×96 |
| `impfx1_quick_impact_A` | 14 | blue, green, orange, red, violet, white, yellow | 5 | 32×32, 64×64 |
| `impfx1_quick_impact_B` | 14 | blue, green, orange, red, violet, white, yellow | 5 | 32×32, 64×64 |
| `impfx1_quick_impact_C` | 14 | blue, green, orange, red, violet, white, yellow | 6 | 48×48, 96×96 |
| `impfx1_quick_impact_D` | 14 | blue, green, orange, red, violet, white, yellow | 5 | 48×48, 96×96 |
| `impfx1_toon_impact_A` | 14 | blue, green, orange, red, violet, white, yellow | 10 | 48×48, 96×96 |
| `impfx1_toon_impact_B` | 14 | blue, green, orange, red, violet, white, yellow | 7 | 48×48, 96×96 |
| `impfx1_toon_impact_C` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 48×48, 96×96 |
| `impfx1_toon_impact_D` | 14 | blue, green, orange, red, violet, white, yellow | 7 | 48×48, 96×96 |

## Super Pixel Impact FX Pack 2.zip

Source: `Visuals/Super Pixel Impact FX Pack 2.zip`. 140 sequences/static assets in 10 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `impfx2_cinematic_impact_A` | 14 | blue, green, orange, red, violet, white, yellow | 7 | 48×48, 96×96 |
| `impfx2_cinematic_impact_B` | 14 | blue, green, orange, red, violet, white, yellow | 10 | 48×48, 96×96 |
| `impfx2_dust_impact_A` | 14 | blue, green, orange, red, violet, white, yellow | 9 | 32×32, 64×64 |
| `impfx2_dust_impact_B` | 14 | blue, green, orange, red, violet, white, yellow | 10 | 48×48, 96×96 |
| `impfx2_fantasy_impact_A` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 48×48, 96×96 |
| `impfx2_fantasy_impact_B` | 14 | blue, green, orange, red, violet, white, yellow | 7 | 48×48, 96×96 |
| `impfx2_scifi_impact_A` | 14 | blue, green, orange, red, violet, white, yellow | 10 | 32×32, 64×64 |
| `impfx2_scifi_impact_B` | 14 | blue, green, orange, red, violet, white, yellow | 9 | 32×32, 64×64 |
| `impfx2_toon_impact_A` | 14 | blue, green, orange, red, violet, white, yellow | 11 | 32×32, 64×64 |
| `impfx2_toon_impact_B` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 48×48, 96×96 |

## Super Pixel Projectiles Pack 2.zip

Source: `Visuals/Super Pixel Projectiles Pack 2.zip`. 136 sequences/static assets in 10 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `pj2_fireball` | 12 | blue, green, orange, red, violet, yellow | 10 | 36×16, 72×32 |
| `pj2_ground_shockwave` | 16 | black, blue, green, orange, red, violet, white, yellow | 5 | 128×64, 64×32 |
| `pj2_helix_beam` | 12 | blue, green, orange, red, violet, yellow | 30 | 32×16, 64×32 |
| `pj2_ice_spike` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 32×16, 64×32 |
| `pj2_kunai` | 14 | blue, gray, green, orange, red, violet, yellow | 8 | 16×8, 32×16 |
| `pj2_lightning_orb` | 14 | blue, green, orange, red, violet, white, yellow | 8 | 32×24, 64×48 |
| `pj2_magic_missile` | 12 | blue, green, orange, red, violet, yellow | 8 | 24×16, 48×32 |
| `pj2_meteor` | 12 | blue, green, orange, red, violet, yellow | 8 | 48×32, 96×64 |
| `pj2_scifi_missile` | 16 | black, blue, green, orange, red, violet, white, yellow | 10 | 32×16, 64×32 |
| `pj2_shuriken` | 14 | blue, gray, green, orange, red, violet, yellow | 8 | 16×16, 32×32 |

## Super Pixel Projectiles Pack 3.zip

Source: `Visuals/Super Pixel Projectiles Pack 3.zip`. 164 sequences/static assets in 12 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `pj3_acid` | 16 | black, blue, gray, green, orange, red, violet, yellow | 8 | 32×16, 64×32 |
| `pj3_arrow_impact` | 14 | black, blue, green, orange, red, violet, yellow | 13 | 32×12, 64×24 |
| `pj3_arrow_loop` | 14 | black, blue, green, orange, red, violet, yellow | 12 | 32×12, 64×24 |
| `pj3_death_wave` | 14 | black, blue, green, orange, red, violet, yellow | 10 | 48×24, 96×48 |
| `pj3_demon_bite_impact` | 12 | blue, green, orange, red, violet, yellow | 16 | 32×24, 64×48 |
| `pj3_demon_bite_loop` | 12 | blue, green, orange, red, violet, yellow | 12 | 32×24, 64×48 |
| `pj3_knife` | 14 | blue, gray, green, orange, red, violet, yellow | 16 | 16×16, 32×32 |
| `pj3_light_spark` | 12 | blue, green, orange, red, violet, yellow | 12 | 24×24, 48×48 |
| `pj3_magic_hex` | 14 | black, blue, green, orange, red, violet, yellow | 24 | 24×24, 48×48 |
| `pj3_magic_missile` | 14 | black, blue, green, orange, red, violet, yellow | 4 | 128×48, 64×24 |
| `pj3_magic_orb` | 14 | black, blue, green, orange, red, violet, yellow | 32 | 16×16, 32×32 |
| `pj3_magic_spike` | 14 | black, blue, green, orange, red, violet, yellow | 8 | 48×16, 96×32 |

## Super Pixel Projectiles Pack 4.zip

Source: `Visuals/Super Pixel Projectiles Pack 4.zip`. 322 sequences/static assets in 17 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `pj4_dark_matter` | 12 | blue, green, orange, red, violet, yellow | 40 | 48×48, 96×96 |
| `pj4_energy_blast_A` | 14 | blue, green, orange, red, violet, white, yellow | 6 | 48×32, 96×64 |
| `pj4_energy_blast_B` | 14 | blue, green, orange, red, violet, white, yellow | 4 | 32×16, 64×32 |
| `pj4_energy_pellet` | 14 | blue, green, orange, red, violet, white, yellow | 16 | 16×16, 32×32 |
| `center_end` | 24 | source palette | 5 | 16×64, 32×128 |
| `center_loop` | 24 | source palette | 8 | 16×64, 32×128 |
| `center_start` | 24 | source palette | 5 | 16×64, 32×128 |
| `impact_end` | 24 | source palette | 5 | 24×64, 48×128 |
| `impact_loop` | 24 | source palette | 8 | 24×64, 48×128 |
| `impact_start` | 24 | source palette | 5 | 24×64, 48×128 |
| `origin_end` | 24 | source palette | 5 | 24×64, 48×128 |
| `origin_loop` | 24 | source palette | 8 | 24×64, 48×128 |
| `origin_start` | 24 | source palette | 5 | 24×64, 48×128 |
| `pj4_plasma_ball` | 12 | blue, green, orange, red, violet, yellow | 24 | 24×24, 48×48 |
| `pj4_sawblade` | 14 | blue, gray, green, orange, red, violet, yellow | 8 | 24×24, 48×48 |
| `pj4_scifi_bomb` | 12 | blue, green, orange, red, violet, yellow | 16 | 16×16, 32×32 |
| `pj4_scrap_metal` | 14 | blue, gray, green, orange, red, violet, yellow | 16 | 24×24, 48×48 |

## Super Pixel Sci-fi FX Pack 1.zip

Source: `Visuals/Super Pixel Sci-fi FX Pack 1.zip`. 168 sequences/static assets in 14 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `scifx1_boost` | 12 | blue, green, orange, red, violet, yellow | 6 | 32×32, 64×64 |
| `scifx1_electricity` | 12 | blue, green, orange, red, violet, yellow | 26 | 24×24, 48×48 |
| `scifx1_explosion_A` | 12 | blue, green, orange, red, violet, yellow | 10 | 48×48, 96×96 |
| `scifx1_explosion_B` | 12 | blue, green, orange, red, violet, yellow | 10 | 48×48, 96×96 |
| `scifx1_scan_loop` | 12 | blue, green, orange, red, violet, yellow | 12 | 32×32, 64×64 |
| `scifx1_scan_start` | 12 | blue, green, orange, red, violet, yellow | 12 | 32×32, 64×64 |
| `scifx1_scan_stop` | 12 | blue, green, orange, red, violet, yellow | 12 | 32×32, 64×64 |
| `scifx1_sparks_A` | 12 | blue, green, orange, red, violet, yellow | 10 | 48×48, 96×96 |
| `scifx1_sparks_B` | 12 | blue, green, orange, red, violet, yellow | 10 | 24×16, 48×32 |
| `scifx1_wormhole_loop` | 12 | blue, green, orange, red, violet, yellow | 24 | 48×48, 96×96 |
| `scifx1_wormhole_start` | 12 | blue, green, orange, red, violet, yellow | 9 | 48×48, 96×96 |
| `scifx1_wormhole_stop` | 12 | blue, green, orange, red, violet, yellow | 9 | 48×48, 96×96 |
| `scifx1_zap_A` | 12 | blue, green, orange, red, violet, yellow | 8 | 32×32, 64×64 |
| `scifx1_zap_B` | 12 | blue, green, orange, red, violet, yellow | 8 | 48×48, 96×96 |

## Super Pixel Sci-fi FX Pack 2.zip

Source: `Visuals/Super Pixel Sci-fi FX Pack 2.zip`. 262 sequences/static assets in 50 families. Formats: .txt, .png.

| Family / object | Variants | Colors | Frame count | Frame canvas |
| --- | ---: | --- | --- | --- |
| `scifx2_black_hole_appear` | 16 | blue, green, orange, pink, red, violet, white, yellow | 10 | 128×128, 64×64 |
| `scifx2_black_hole_disappear` | 16 | blue, green, orange, pink, red, violet, white, yellow | 10 | 128×128, 64×64 |
| `scifx2_black_hole_loop` | 16 | blue, green, orange, pink, red, violet, white, yellow | 24 | 128×128, 64×64 |
| `scifx2_buff` | 14 | blue, green, orange, pink, red, violet, yellow | 15 | 48×64, 96×128 |
| `scifx2_charge_up` | 20 | black, blue, gray, green, orange, pink, red, violet, white, yellow | 12 | 48×48, 96×96 |
| `scifx2_debuff` | 14 | blue, green, orange, pink, red, violet, yellow | 15 | 48×64, 96×128 |
| `scifx2_electric_aura` | 12 | blue, green, orange, red, violet, yellow | 24 | 48×48, 96×96 |
| `scifx2_hacking` | 14 | blue, green, orange, pink, red, violet, yellow | 36 | 48×48, 96×96 |
| `scifx2_hex_shield` | 20 | black, blue, gray, green, orange, pink, red, violet, white, yellow | 20 | 48×48, 96×96 |
| `scifx2_scan_appear` | 16 | black, blue, green, orange, pink, red, violet, yellow | 16 | 128×128, 64×64 |
| `scifx2_scan_disappear` | 16 | black, blue, green, orange, pink, red, violet, yellow | 16 | 128×128, 64×64 |
| `scifx2_scan_loop` | 16 | black, blue, green, orange, pink, red, violet, yellow | 28 | 128×128, 64×64 |
| `scifx2_tech_aura` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 24 | 48×48, 96×96 |
| `scifx2_tech_aura_large_black_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_black_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_blue_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_blue_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_green_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_green_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_orange_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_orange_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_pink_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_pink_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_red_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_red_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_violet_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_violet_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_white_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_white_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_yellow_back` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_large_yellow_front` | 1 | source palette | 24 | 96×96 |
| `scifx2_tech_aura_small_black_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_black_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_blue_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_blue_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_green_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_green_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_orange_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_orange_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_pink_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_pink_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_red_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_red_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_violet_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_violet_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_white_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_white_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_yellow_back` | 1 | source palette | 24 | 48×48 |
| `scifx2_tech_aura_small_yellow_front` | 1 | source palette | 24 | 48×48 |
| `scifx2_warp` | 18 | black, blue, green, orange, pink, red, violet, white, yellow | 10 | 128×128, 64×64 |

## Character models (Visuals/Character models/, added Oct 17)

All CC0 (Quaternius; license files inside each ZIP). Preserve the ZIPs; `sites/veyrath/tools/warrior/prepare_sources.py` extracts what the build needs into `tmp/warrior-src`.
- `Modular Character Outfits - Fantasy[Source].zip` (760 MB): `All_Male.blend` / `All_Female.blend` with Knight, Noble, Peasant, Ranger and Wizard outfits on one rig, 4096 px textures (3 colour versions per outfit), FBX exports. Outfits expect a head from the separate Universal Base Characters kit (not supplied); the Knight's closed helmet needs none, the Ranger hood and Wizard do.
- `Universal Animation Library[Standard].zip` / `Universal Animation Library 2[Standard].zip`: 43 + 43 animations on the same 65-bone skeleton (locomotion, sword set, shield, punches, spells, roll, death, etc.), GLB/FBX, with and without root motion.
- `Universal Base Characters[Standard].zip` (129 MB, free/Standard): Superhero male/female full bodies (glTF/FBX; only the head is used), eyes, eyebrows, 7 hair meshes rigged to the Head bone (Beard, Buns, Buzzed, BuzzedFemale, Long, SimpleParted), 2 hair textures, light/dark skin.
- In use: Male Knight colour 1 → `dist/assets/hero/warrior.glb` (fx-183); Female Wizard colour 2 + female head + Hair_Buns → `dist/assets/hero/mage.glb` (fx-185); Male Ranger colour 1 (hood only) → `dist/assets/hero/ranger.glb` + path textures `ranger-ninja.webp` (colour 2) / `ranger-gunslinger.webp` (colour 1 recoloured) (fx-205).

## Visual family contact sheets

- [Contact sheet 01](assets/contact-01.jpg)
- [Contact sheet 02](assets/contact-02.jpg)
- [Contact sheet 03](assets/contact-03.jpg)
- [Contact sheet 04](assets/contact-04.jpg)
- [Contact sheet 05](assets/contact-05.jpg)
- [Contact sheet 06](assets/contact-06.jpg)
- [Contact sheet 07](assets/contact-07.jpg)
- [Contact sheet 08](assets/contact-08.jpg)
- [Contact sheet 09](assets/contact-09.jpg)
- [Contact sheet 10](assets/contact-10.jpg)
- [Contact sheet 11](assets/contact-11.jpg)
- [Contact sheet 12](assets/contact-12.jpg)
- [Contact sheet 13](assets/contact-13.jpg)

## Notes from representative visual review

Reviewed all 13 family contact sheets; previews are samples, not full animation playback.

- The 93,593 PNG count refers to individual animation frames/static assets. Supplied prepacked spritesheet PNGs are separately indexed per pack in inventory bundled_sprite_sheets, including dimensions and source paths. Do not interpret atlas pixel dimensions as frame dimensions.
- **Pickups Fantasy 1:** animated coins (gold/silver/bronze and elemental colors), energy orbs, gems, hearts, keys, potions, relics and souls. Strong first choices for gold, healing and loot; a soul/orb can represent XP only if that mechanic is chosen.
- **Objects And Items:** sparkle animations; static food/drink, bombs/dynamite/TNT, coins/gems/hearts/keys, full/half/empty potions, spike balls, directional spike sets, springs and stars. Includes dark/light/no-outline variants and source size variants. More suitable for icons, loot and hazards than environment landmarks. No named chest, sword or shield equipment sprites were found.
- **Blood FX 1:** blood bursts A–C, splashes A–D and streams A–C, with color/size choices. Use red for conventional blood or choose a deliberate demon palette; contact sheet orange is merely a representative color.
- **Gigapack:** 175 animation types / 2,296 variants, matching its supplied asset list. Explosions, spell/stat buffs, forge/heal/death/status effects, fire, directional/symmetrical impacts, lightning, particle/coin/heart/sparkle bursts, smoke/splatters, sci-fi effects and animated UI symbols/text. The bundled local HTML guide and GIF previews are discoverable in inventory other_files. Contains exact overlaps with standalone packs; do not treat all variants as unique designs.
- **Effects Pack 3:** bite, brown dust trails, impact hit, lightning aura, magic spawn, smoke bomb, splatter, toon explosion/impact and warp. Dark/light brown dust trail variants are useful desert candidates.
- **Explosion FX 1:** epic, stylized and symmetrical explosions. Strong boss-impact candidates; some include bright fire and smoke which need scale restraint.
- **Fantasy FX 1:** magic bursts/puffs, power-up, skull puff and spellcast sets. Some casts provide separate front/back layers for surrounding an actor: preserve their synchronized timing.
- **Fantasy FX 2:** absorb, claw, cure, earth spikes, fire/ice/lightning/poison/shatter and wind spell. Brown wind is a promising Blade Storm candidate; earth spikes suit a future enemy or boss hazard. Several effects have start/loop/end and front/back components.
- **Impact FX 1/2:** dust, quick, cinematic, fantasy, sci-fi and toon impacts. Warm dust is a promising Slam/landing candidate; sharp quick/fantasy impacts suit sword/parry feedback.
- **Projectiles 2:** fireball, ground shockwave, helix beam, ice spike, kunai, lightning orb, magic missile, meteor, sci-fi missile and shuriken.
- **Projectiles 3:** acid, arrow impact/loop, death wave, demon-bite impact/loop, knife, light spark, magic hex/missile/orb/spike. Keep matching travel/impact segments together.
- **Projectiles 4:** dark matter, energy blasts/pellet, laser-beam components, plasma ball, sawblade, sci-fi bomb and scrap metal. Beam parts use origin/center/impact and start/loop/end groups; exact nested paths distinguish them in inventory.
- **Sci-fi FX 1:** boost, electricity, explosions, scan start/loop/stop, sparks, wormhole start/loop/stop and zaps. Orange explosion_A is already used on Slam and was approved by the user.
- **Sci-fi FX 2:** black-hole lifecycle, buffs/debuffs, charge-up, electric aura, hacking, hex shield, scans, tech aura front/back and warp. Portal/shield/charge effects can cross genres; hacking/scan graphics require an intentional stylistic choice.

All suggestions are availability notes; selecting an asset still follows the PDF, user decisions and the established game palette.

## Sounds added October 14
Nine supplied MP3s in root Sounds: Game sound 1 (selected exploration background), Game sound 2 (available alternate, unused), Mini boss background sound (elite/boss encounter), sword attack 1 / Sword attack 2 / Sword attack 3 (combo), Taking damage (player hurt), Game over (run death), Base enemy dying (ordinary deaths). Original files preserved. Eight selected files ship under dist/assets/audio via prepare-sounds.py. Default volume and usage rules are recorded in GAME_REFERENCE.md; no licensing information was supplied with these loose files.
October14 selected fanfx2_ice_spell_large_blue (Fantasy FX2),50frames192×192, for Frostbound fields; prepared ice atlas/license via prepare-elite-assets.py. Existing supplied Wall-A1_E used for temporary Waller walls.


## Crest & Cloth UI Kit — added October 18, 2026
Source: `Visuals/UI/Veyrath-Crest-and-Cloth-UI-Kit.zip` (retained intact). User supplied for stat/skill leveling cards. Selected orange skill and white/blue/purple stat textures are 1024x1536 RGBA, with original margins preserved. Runtime uses matching SVG glyphs, divider, blank button states and bundled Nunito/Source Serif 4 fonts with OFL files. Exact selected archive paths and runtime files: [crest-cloth-inventory.json](assets/crest-cloth-inventory.json). Kit README/sample labels are asset guidance, not gameplay authority. No green rarity or example heal values introduced.


## Settings UI Kit — added October 18, 2026
Source: `Visuals/UI/Veyrath-Settings-UI-Kit.zip` (preserved). User-supplied pause/settings artwork: 1448x1086 transparent cloth panel and 1254x1254 gear crest, selected SVG button states, checkbox states, slider thumbs, chevron and dividers. Runtime preserves raster aspect ratios and uses live game text/controls; bundled demo script is not executed. Existing matching OFL fonts are reused. Exact selected files and adaptations: [settings-ui-inventory.json](assets/settings-ui-inventory.json). Kit sample values do not change gameplay defaults.


## Light's End Main Menu Asset Pack — added October 18, 2026
Source: `Visuals/UI/Lights-End-Main-Menu-Asset-Pack.zip` (preserved). Selected moonlit background, transparent gold logo, subtitle/divider SVGs, live wallet/coin and 24 labeled button state PNGs (1400x280, margins retained) for six existing actions. Runtime scales the reference 1920x1080 layout uniformly and uses real gold/build values. Exact files/sizes: [main-menu-inventory.json](assets/main-menu-inventory.json). Source masters, atlases, demo and example balances are not runtime dependencies. Existing OFL fonts are reused for live text.


## Character Select UI Kit — October 18, 2026
Source: `Visuals/UI/Veyrath-Character-Select-UI-Kit.zip` (preserved). Selected class/loadout cloth banners, footer, frame and button states, path rows and invite artwork. Runtime reuses existing licensed ClothSerif/ClothBody fonts and live character models/icons. Exact selected files: [character-select-inventory.json](assets/character-select-inventory.json). Demo balance, example ownership and placeholder characters are not gameplay authority.


## Unlocks reference styling — October 18, 2026
User screenshot a0056edd-76a0-4fcb-bf0f-cbede98d1a7c.png guides the new Unlocks composition. Native SVG frame.svg and cloth.svg under dist/assets/ui/unlocks provide scalable gold corner/frame details and a repeating navy weave; inline SVG crest glyphs are UI artwork. Existing supplied main-menu wallet/coin, character-select background and licensed cloth fonts are reused. No screenshot text, example gold values or proposed mechanics are baked into runtime. Source packs remain intact.


## Light's End Unlocks Asset Pack — October 18, 2026
Source: Visuals/UI/Lights-End-Unlocks-Asset-Pack.zip, preserved. The initial truncated upload was replaced by the user with a complete 52,520,777-byte archive (218 entries). All 47 selected PNG entries were read and CRC32-verified from the replacement: four card states, seven coloured crests, eight banner states, twelve action-button states, eight class-tab states, dedicated nine-slice panel/wallet, full-resolution modal cloth, two blank status strips and three dividers. Exact source/runtime paths: [unlocks-inventory.json](assets/unlocks-inventory.json). Dedicated pack exports now replace temporary card-art panel/tabs. Original layered SVG category/path/rune/upgrade/weapon icons remain in unlocks-icons.js, as explicitly requested by the user over the kit's blank-icon guidance. Live prices/counts/account rules are retained; source ZIP, preview examples and creation scripts are not shipped. Existing local fonts/background reused.


## Veyrath Orb HUD — October 18, 2026
Source: Visuals/UI/Veyrath-Orb-HUD-Asset-Pack.zip (preserved). Selected 22 PNG layers (6,915,421 bytes) indexed in [orb-hud-inventory.json](assets/orb-hud-inventory.json): separate orb frame/glass/red and blue liquid/low-health overlay; action and counter panels/connectors; XP layers; six slot states and focus overlay; blank level/key badges. Original weapon/spell icons remain live; runtime reuses existing licensed ClothSerif/ClothBody fonts. Presets, masters, example source and baked sample values are not shipped. Pack documentation is integration reference, not gameplay authority.


## Veyrath Armory & Inventory — October 18, 2026
Source: Visuals/UI/Veyrath-Armory-Inventory-Asset-Pack.zip (preserved). Prepared 54 selected PNGs (8,416,546 bytes): modal/detail/equipped/run-bag/currency/pocket panels, corners/divider, navy crest, item/drop/focus states, stat/dropdown/affix controls, blank button states and utility/badge/key backings. Exact source/runtime paths, dimensions and hashes: [armory-inventory.json](assets/armory-inventory.json). Existing weapon-family icons and licensed Cloth fonts reused; supplied preview/source scripts/fonts/sample values are not shipped. Pack documents guide presentation and do not change game rules.
