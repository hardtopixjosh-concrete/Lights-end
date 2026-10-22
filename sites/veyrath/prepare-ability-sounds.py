"""Trim, fade and loudness-normalize user-made ability SFX into dist/assets/audio/abilities.

Source: <workspace>/Sounds/<name>.mp3 (a doubled ".mp3.mp3" is accepted). Takes lists
(start, end) seconds per variant; files holding several generated takes are split into
-1, -2 ... variants. Re-run after adding sounds; then list new names in sound.js ABILITY_SAMPLES.
"""
from pathlib import Path
import subprocess, sys
root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / 'tmp/audio-tools'))
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
out = Path(__file__).parent / 'dist/assets/audio/abilities'
out.mkdir(parents=True, exist_ok=True)
# name: list of (start, end) takes. Loudness target in LUFS (impacts a little hotter).
SOUNDS = {
    'pyro-fireball-cast': [(0, 1.3)],
    'pyro-fireball-impact': [(0, .85)],
    'pyro-nova-cast': [(0, 2.4), (10.0, 12.4)],
    'pyro-chain-cast': [(0, 1.8)],
    'pyro-meteor-cast': [(0, 1.3)],
    'pyro-meteor-impact': [(0, 3.6), (4.5, 8.1), (9.27, 13.0)],
}
def source(name):
    for p in (root / 'Sounds' / f'{name}.mp3', root / 'Sounds' / f'{name}.mp3.mp3'):
        if p.exists(): return p
    raise FileNotFoundError(name)
for name, takes in SOUNDS.items():
    src = source(name)
    for i, (a, b) in enumerate(takes):
        dur = b - a; fade = min(.35, dur * .3)
        target = -15 if 'impact' in name else -17
        dest = out / (f'{name}.mp3' if i == 0 else f'{name}-{i + 1}.mp3')
        af = f'atrim={a}:{b},asetpts=PTS-STARTPTS,silenceremove=start_periods=1:start_threshold=-50dB,afade=t=in:d=0.005,afade=t=out:st={max(0, dur - fade - .02)}:d={fade},loudnorm=I={target}:TP=-1.5:LRA=11'
        subprocess.run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(src), '-af', af, '-ac', '1', '-ar', '44100', '-b:a', '112k', str(dest)], check=True)
        print(dest.name)
