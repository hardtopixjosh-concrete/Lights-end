# Tiled map workflow

The default battlefield is now authored in `dist/maps/desert.tmj`. Open this file directly in Tiled. It uses the external image-collection tileset `desert-props.tsj`, whose image paths point to the already prepared WebP assets. There is no asset repacking or map build step. Save as JSON (`.tmj`), retain its tileset next to it, and publish the Site normally.

The map migrates the previous `createScene()` output: **410 ground patches, 132 scenery props, 29 exact ground-footprint polygons**. It preserves the seeded layout rather than redesigning the battlefield in this tools batch. The pixel world remains 3600 Ã— 2800. Tiled's displayed tile grid is a 32px editing aid; gameplay positions use pixels.

## Editing

- **Ground** contains freely positioned tile objects for sand and ground patches. Their `collection` property is `ground`.
- **Scenery** contains solid stones/trees and passable low plants. Their `collection` is `props`, and `layer` chooses `depth` or `ground` rendering.
- **Collision footprints** contains polygon objects linked to scenery through an `ownerId` object reference. These model ground contact, not the whole visible sprite. Select both the tile object and its footprint when moving solid scenery, or move the footprint separately. Resizing art does **not** automatically resize its footprint. Keep passable plants without polygons.
- **Landmarks** contains `forge` and `player-spawn` point objects. Keep those unique and on walkable ground. Forge has a `radius` custom property (100px currently). The existing procedural Forge dressing remains a runtime overlay around the Forge marker; its individual props are not editable in Tiled yet. Event centers are also editable point objects: `shrine-1`–`shrine-3`, `camp-1`–`camp-3`, `rift-1`, and `merchant-1`. Move these to change preferred event locations. Runtime safe-placement checks may shift an obstructed center to nearby walkable ground; missing markers use the existing defaults. Event mechanics and spawn timing remain controlled by gameplay code.

Use the object tool to place imagery from the image collection; do not paint tile layers. Duplicate scenery and its collider together, then update the duplicate collider's `ownerId` using Tiled's object-reference picker. Retain `key`, `collection`, and `layer` properties. A tile's actual width/height control its uniform scale; the exported `scale` property is informational. The tile's `key` must agree with its tileset entry. Adding existing prepared props to the tileset also requires `key`, `anchorX`, `anchorY`, image dimensions and bottom-left alignment. No asset ZIPs or PDFs belong in this directory.

## Coordinates and supported scope

The map is **orthogonal screen space with isometric artwork**, matching the current simulation. Tiled's isometric orientation would apply a second projection and is intentionally rejected. Tiles use bottom-left alignment. Tileset `anchorX`/`anchorY` locate the gameplay ground pivot inside the original image; the loader reconstructs the existing sprite pivot from the tile object's position and size. Polygon points are converted from object-local coordinates to world coordinates, preserving independent authored collision.

Supported: finite orthogonal JSON maps, top-level object groups, uniformly scaled unrotated image-collection tile objects, polygon collision objects, and point landmarks. Unsupported formats fail with an understandable `Tiled map:` error: tile layers, infinite maps, groups/offset layers, rotation, flipped tiles and nonuniform scales. This is a small adapter for this game's format, not a universal Tiled runtime. Layer visibility/opacity are editor aids and do not change game visibility.

Map properties `veyrathSchema=1`, `worldWidth`, and `worldHeight` declare gameplay extent. The existing events/spawn director assume the current arena, so changing the world size needs a coordinated gameplay update even though the loader can read other extents.

## Integration

```js
import {loadTiledMap, parseTiledMap} from './tiled-map.js';
const scene = await loadTiledMap('maps/desert.tmj?v=BUILD', manifest);
// scene: {props, ground, landmarks, width, height}
```

The fetch helper loads external tilesets relative to the map, carries the version query to them, rejects cross-origin tilesets, checks HTTP/JSON errors, and validates asset keys against the prepared manifest. No dynamic scripts/evaluation are loaded. Image preloading uses the returned prop/ground keys plus the existing runtime assets.

For offline inspection, `parseTiledMap(map, manifest, {'desert-props.tsj': tileset})` accepts already loaded JSON. The migration exporter `node tools/export-tiled-map.mjs` is a **restore/migration tool only**; it overwrites the authored map with the old procedural baseline. Do not run it during normal builds or after hand editing.

## Focused verification

The migration was checked against the original `createScene()` snapshot for exact counts, keys, layer assignments, scale, coordinates, and polygon points (floating-point tolerance 1e-9). Fetch loading, missing asset rejection, unsupported orientation rejection, duplicate collider rejection, and landmark coordinates were included. No combat, balance, camera or collision algorithm changes belong to this adapter.
