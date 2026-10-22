"""Prepare only the selected world-event art from the preserved supplied packs.

The exact catalog index is authoritative for pixel sequences. All frame canvases
and alpha are retained; no per-frame trimming, recoloring or interpolation.
"""
from pathlib import Path
from PIL import Image
import io
import json
import zipfile

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent / 'dist/assets'
INDEX = json.loads((ROOT / 'docs/assets/inventory.json').read_text(encoding='utf-8'))
manifest_path = OUT / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))

SELECTED = {
    'world-rift': 'scifx2_black_hole_loop_large_red',
    'world-shrine': 'fp1_relic_B_orange',
    'world-camp-red': 'fp1_relic_A_red',
    'world-camp-blue': 'fp1_relic_A_blue',
}

for key, name in SELECTED.items():
    entry = next(s for s in INDEX['sequences'] if s['sequence'].rsplit('/', 1)[-1] == name)
    with zipfile.ZipFile(ROOT / entry['archive']) as pack:
        names = sorted(n for n in pack.namelist()
                       if n.startswith(entry['sequence'] + '/') and n.endswith('.png'))
        assert len(names) == entry['frames'], (key, len(names), entry['frames'])
        w, h = entry['frame_width'], entry['frame_height']
        atlas = Image.new('RGBA', (w * len(names), h))
        for col, source in enumerate(names):
            frame = Image.open(io.BytesIO(pack.read(source))).convert('RGBA')
            assert frame.size == (w, h), (source, frame.size)
            atlas.paste(frame, (col * w, 0))
        atlas.save(OUT / (key + '.webp'), lossless=True)
        license_name = next(n for n in pack.namelist() if n.lower().endswith('/license.txt'))
        (OUT / (key + '-license.txt')).write_bytes(pack.read(license_name))
    manifest['sheets'][key] = {
        'url': 'assets/' + key + '.webp', 'width': atlas.width, 'height': h,
        'cols': len(names), 'rows': 1, 'cellWidth': w, 'cellHeight': h,
        'source': entry['sequence'], 'pack': entry['archive'],
        'sourceSha256': entry['sha256'], 'fps': 12 if key == 'world-rift' else 10,
        'credit': 'Will Tice / Untied Games',
    }

# A brown-clothed traveler matches the existing HD characters and desert palette.
# Keep every original direction and native animation canvas for renderer reuse.
with zipfile.ZipFile(ROOT / '2D HD Character pack 1 V1.2.zip') as pack:
    for action, key in [('Idle', 'world-merchant'), ('Run', 'world-merchant-run')]:
        atlas = Image.new('RGBA', (1920, 1024))
        for row, direction in enumerate(['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE']):
            names = sorted(n for n in pack.namelist()
                           if n.startswith('2Archer/' + action + '/' + direction + '/') and n.endswith('.png'))
            groups = sorted({n.rsplit('_', 1)[0] for n in names})
            group = next((g for g in groups if g.endswith('_' + direction)), groups[0])
            names = [n for n in names if n.rsplit('_', 1)[0] == group]
            assert len(names) == 15, (key, direction, len(names))
            for col, source in enumerate(names):
                frame = Image.open(io.BytesIO(pack.read(source))).convert('RGBA')
                assert frame.size == (128, 128), (source, frame.size)
                atlas.paste(frame, (col * 128, row * 128))
        atlas.save(OUT / (key + '.webp'), lossless=True)
        manifest['sheets'][key] = {
            'url': 'assets/' + key + '.webp', 'width': 1920, 'height': 1024,
            'cols': 15, 'rows': 8, 'cellWidth': 128, 'cellHeight': 128,
            'source': '2Archer/' + action, 'pack': '2D HD Character pack 1 V1.2.zip',
            'fps': 10 if action == 'Idle' else 15,
        }

(OUT / 'world-merchant-source.txt').write_text(
    'Merchant traveler: selected 2Archer Idle and Run animations from the supplied\n'
    '2D HD Character pack 1 V1.2.zip (SmallScaleInt pack identified in the original\n'
    'VEYRATH design PDF). No license/readme text was present in this local ZIP.\n'
    'This note records provenance only and does not assert new license terms.\n', encoding='utf-8')

manifest_path.write_text(json.dumps(manifest), encoding='utf-8')
print('Prepared six selected world-event sheets; existing manifest entries retained.')
