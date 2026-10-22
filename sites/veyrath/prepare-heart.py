"""Prepare only the red heart HP pack from the preserved source pack."""
from pathlib import Path
from PIL import Image
import io, json, zipfile

root = Path(__file__).resolve().parents[2]
out = Path(__file__).parent / 'dist/assets'
with zipfile.ZipFile(root / 'objects pickups visuals/Super Pixel Item Pickups Fantasy Pack 1.zip') as pack:
    name = next(n for n in pack.namelist() if n.endswith('fp1_heart_B_red/spritesheet.png'))
    sheet = Image.open(io.BytesIO(pack.read(name))).convert('RGBA')
sheet.save(out / 'pickup-heart.webp', lossless=True)
path = out / 'manifest.json'
manifest = json.loads(path.read_text(encoding='utf-8'))
manifest['sheets']['pickup-heart'] = {'url': 'assets/pickup-heart.webp', 'cols': sheet.width // 16, 'rows': 1,
    'cellWidth': 16, 'cellHeight': 16, 'width': sheet.width, 'height': sheet.height,
    'source': 'fp1_heart_B_red', 'credit': 'Will Tice / Untied Games'}
path.write_text(json.dumps(manifest), encoding='utf-8')
print(sheet.size)
