"""Oct 18 (user): HP pickups become a hot sauce bottle, XP pickups a little purple pepper.
Purple pepper = Objects And Items `spicy_pepper` (outline_dark) recoloured to purple, 2x nearest, 33-frame bob + glint.
Hot sauce bottle = hand-authored 32x32 pixel art in the same dark-outline style (no bottle exists in the packs), 13-frame glint."""
from pathlib import Path
from PIL import Image
import io, json, zipfile, colorsys, math

root = Path(__file__).resolve().parents[2]
out = Path(__file__).parent / 'dist/assets'

# ---------- purple pepper ----------
with zipfile.ZipFile(root / 'objects pickups visuals/Super Pixel Objects And Items.zip') as pack:
    src = Image.open(io.BytesIO(pack.read('Super Pixel Objects And Items/PNG/outline_dark/spicy_pepper.png'))).convert('RGBA')
    license_name = next(n for n in pack.namelist() if n.lower().endswith('license.txt'))
    (out / 'pickup-pepper-license.txt').write_bytes(pack.read(license_name))
pep = src.copy()
px = pep.load()
for y in range(pep.height):
    for x in range(pep.width):
        r, g, b, a = px[x, y]
        if not a: continue
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if (h < .14 or h > .9) and s > .25:  # red/orange flesh -> purple (stem greens untouched)
            h = .76 + (h if h < .5 else h - 1) * .4
            r2, g2, b2 = colorsys.hsv_to_rgb(h % 1, min(1, s * 1.05), min(1, v * 1.02))
            px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
pep = pep.resize((32, 32), Image.NEAREST)
N = 33
atlas = Image.new('RGBA', (32 * N, 32))
for i in range(N):
    f = Image.new('RGBA', (32, 32))
    dy = round(math.sin(i / N * math.tau) * 1.5)
    f.alpha_composite(pep, (0, dy))
    g = i - 8  # glint sweeping across the pepper on part of the loop
    if 0 <= g < 10:
        fp = f.load()
        for k in range(-1, 2):
            gx, gy = 9 + g + k, 10 + g - k + dy
            if 0 <= gx < 32 and 0 <= gy < 32 and fp[gx, gy][3] > 0:
                r, gg, b, a = fp[gx, gy]
                fp[gx, gy] = (min(255, r + 110), min(255, gg + 110), min(255, b + 110), a)
    atlas.alpha_composite(f, (i * 32, 0))
atlas.save(out / 'pickup-pepper.webp', lossless=True)

# ---------- hot sauce bottle ----------
O, RED, RED_D, RED_L, CAP, CAP_D, CAP_L, LAB, LAB_D, GLASS = (
    (42, 15, 10, 255), (214, 50, 31, 255), (142, 26, 16, 255), (255, 138, 106, 255),
    (63, 154, 58, 255), (31, 90, 34, 255), (126, 214, 104, 255), (243, 226, 192, 255), (196, 168, 120, 255), (255, 255, 255, 255))
def bottle():
    im = Image.new('RGBA', (32, 32)); p = im.load()
    def row(y, x0, x1, c):
        for x in range(x0, x1 + 1): p[x, y] = c
    # silhouette spans: (y, left, right)
    spans = [(2, 14, 17), (3, 13, 18), (4, 13, 18), (5, 13, 18), (6, 13, 18), (7, 14, 17), (8, 14, 17), (9, 14, 17), (10, 13, 18), (11, 12, 19), (12, 11, 20)]
    spans += [(y, 10, 21) for y in range(13, 29)] + [(29, 11, 20)]
    for y, a, b in spans: row(y, a - 1, b + 1, O)
    row(1, 14, 17, O); row(30, 11, 20, O)
    for y, a, b in spans:
        for x in range(a, b + 1):
            if y <= 6: c = CAP_L if x == a + 1 else CAP_D if x >= b - 1 else CAP
            else: c = RED_L if x == a + 1 and y > 7 else RED_D if x >= b - 1 else RED
            p[x, y] = c
    row(6, 13, 18, CAP_D)
    for y in range(16, 25):  # label
        for x in range(10, 22): p[x, y] = LAB_D if y in (16, 24) or x in (10, 21) else LAB
    for x, y in [(14, 21), (15, 21), (16, 20), (17, 20), (17, 19), (15, 22), (14, 22)]: p[x, y] = RED  # little chili on the label
    for x, y in [(18, 18), (17, 18)]: p[x, y] = CAP
    p[13, 19] = RED_D; p[16, 21] = RED_D
    return im
base = bottle()
N2 = 13
atlas2 = Image.new('RGBA', (32 * N2, 32))
for i in range(N2):
    f = base.copy(); fp = f.load()
    y = 27 - i * 2  # glint climbing the left highlight
    for yy in (y, y - 1):
        if 8 <= yy <= 28 and not (16 <= yy <= 24): fp[11 if yy > 12 else 14, yy] = GLASS
    if i in (10, 11, 12):  # sparkle off the cap
        for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)) if i == 11 else ((0, 0),):
            fp[20 + dx, 3 + dy] = GLASS
    atlas2.alpha_composite(f, (i * 32, 0))
atlas2.save(out / 'pickup-hotsauce.webp', lossless=True)

path = out / 'manifest.json'
manifest = json.loads(path.read_text(encoding='utf-8'))
manifest['sheets']['pickup-pepper'] = {'url': 'assets/pickup-pepper.webp', 'cols': N, 'rows': 1, 'cellWidth': 32, 'cellHeight': 32, 'width': 32 * N, 'height': 32,
    'source': 'spicy_pepper (outline_dark) recoloured purple', 'pack': 'Super Pixel Objects And Items.zip', 'credit': 'Will Tice / Untied Games'}
manifest['sheets']['pickup-hotsauce'] = {'url': 'assets/pickup-hotsauce.webp', 'cols': N2, 'rows': 1, 'cellWidth': 32, 'cellHeight': 32, 'width': 32 * N2, 'height': 32,
    'source': 'hand-authored pixel art (VEYRATH)', 'credit': 'VEYRATH'}
path.write_text(json.dumps(manifest), encoding='utf-8')
preview = Image.new('RGBA', (32 * 8, 32 * 4), (70, 58, 44, 255))
preview.alpha_composite(atlas2.crop((0, 0, 32, 32)).resize((128, 128), Image.NEAREST), (0, 0))
preview.alpha_composite(atlas.crop((0, 0, 32, 32)).resize((128, 128), Image.NEAREST), (128, 0))
import sys
if len(sys.argv) > 1: preview.save(sys.argv[1])
print('ok')
