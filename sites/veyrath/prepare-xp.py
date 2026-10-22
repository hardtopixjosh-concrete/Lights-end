"""Prepare only the selected XP crystal from the preserved source pack."""
from pathlib import Path
from PIL import Image
import io, json, zipfile

root = Path(__file__).resolve().parents[2]
out = Path(__file__).parent / 'dist/assets'
with zipfile.ZipFile(root / 'objects pickups visuals/Super Pixel Item Pickups Fantasy Pack 1.zip') as pack:
    names = sorted(n for n in pack.namelist() if '/fp1_gem_blue/' in n and n.endswith('.png'))
    atlas = Image.new('RGBA', (32 * len(names), 32))
    for i, name in enumerate(names):
        frame = Image.open(io.BytesIO(pack.read(name))).convert('RGBA')
        atlas.paste(frame, (i * 32 + (32 - frame.width) // 2, 0))
    atlas.save(out / 'pickup-xp.webp', lossless=True)
path = out / 'manifest.json'
manifest = json.loads(path.read_text(encoding='utf-8'))
manifest['sheets']['pickup-xp'] = {'url': 'assets/pickup-xp.webp', 'cols': len(names), 'rows': 1,
    'cellWidth': 32, 'cellHeight': 32, 'width': atlas.width, 'height': 32,
    'source': 'fp1_gem_blue', 'credit': 'Will Tice / Untied Games'}
path.write_text(json.dumps(manifest), encoding='utf-8')
