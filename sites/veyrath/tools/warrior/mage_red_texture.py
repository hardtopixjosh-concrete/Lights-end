"""Oct 20 (user): Mage outfit red with three reds for depth, crimson -> red -> light red.
Builds T_Wizard_Red_BaseColor.png next to the source Wizard textures from colour 2 (purple + gold):
purple cloth is remapped by its brightness onto crimson / red / light red, the near-black olive trousers become deep wine,
gold trim, cream wraps, metal and skin keep their colours. Shading inside each tone is kept (value is scaled, not replaced).
  blender -b --python tools/warrior/mage_red_texture.py [-- preview.png]   (Blender's Python has numpy)"""
import os, sys
import numpy as np
import bpy
HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', 'tmp', 'warrior-src', 'Textures', 'Wizard'))
def load(path):
    im = bpy.data.images.load(path); im.colorspace_settings.name = 'Non-Color'; w, hh = im.size
    a = np.empty(w * hh * 4, np.float32); im.pixels.foreach_get(a); return a.reshape(hh, w, 4)[..., :3], (w, hh)
def save(arr, size, path):
    w, hh = size; im = bpy.data.images.new('out', w, hh, alpha=False); im.colorspace_settings.name = 'Non-Color'
    full = np.concatenate([arr, np.ones(arr.shape[:2] + (1,), np.float32)], -1); im.pixels.foreach_set(full.ravel())
    im.filepath_raw = path; im.file_format = 'PNG'; im.save()
src, SIZE = load(os.path.join(TEX, 'T_Wizard_2_BaseColor.png'))

def rgb_to_hsv(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]; mx = c.max(-1); mn = c.min(-1); d = mx - mn
    h = np.zeros_like(mx); m = d > 1e-6
    rr = (mx == r) & m; gg = (mx == g) & m & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6; h[gg] = (b - r)[gg] / d[gg] + 2; h[bb] = (r - g)[bb] / d[bb] + 4
    return h / 6, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx
def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6; f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    out = np.stack([np.choose(i, [v, q, p, p, t, v]), np.choose(i, [t, v, v, q, p, p]), np.choose(i, [p, p, t, v, v, q])], -1)
    return out

h, s, v = rgb_to_hsv(src)
purple = (h > .70) & (h < .97) & (s > .18) & (v > .06)
olive = (h > .08) & (h < .30) & (v < .26) & (s < .65) & ~purple   # near-black trousers
# three reds as a gradient map over the purple cloth's own brightness: shadows -> crimson, mid tones -> red,
# highlights -> light red. Every pixel keeps its relative brightness, so folds and panels read as depth (no hard patches).
CRIMSON, RED, LIGHT = np.array([.36, .03, .08]), np.array([.72, .09, .13]), np.array([.95, .40, .38])
lo, hi = np.percentile(v[purple], 4), np.percentile(v[purple], 97)
x = (np.clip((v - lo) / max(hi - lo, 1e-3), 0, 1) ** 1.6)[..., None]  # gamma: most cloth lands on red, only highlights reach light red
tone = np.where(x < .5, CRIMSON + (RED - CRIMSON) * (x / .5), RED + (LIGHT - RED) * ((x - .5) / .5))
out = src.copy(); out[purple] = tone[purple]
# near-black olive trousers -> deep wine
WINE = np.array([.17, .03, .05])
sel = olive; k = (v[sel] / max(np.median(v[sel]), 1e-3))[:, None]; out[sel] = np.clip(WINE[None, :] * k, 0, 1)
save(out, SIZE, os.path.join(TEX, 'T_Wizard_Red_BaseColor.png'))
print('purple px', int(purple.sum()), 'olive px', int(olive.sum()), 'bands', round(float(lo), 3), round(float(hi), 3))
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if args:  # side-by-side preview, every 8th pixel
    save(np.concatenate([src[::8, ::8], out[::8, ::8]], 1), (SIZE[0] // 4, SIZE[1] // 8), args[0])
