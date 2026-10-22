"""Copy only the selected sound files; preserve the original Sounds folder."""
from pathlib import Path
import argparse
import subprocess
import re

site = Path(__file__).resolve().parent
source = site.parents[1] / 'Sounds'
target = site / 'dist' / 'assets' / 'audio'
files = {
    'Game sound 1.mp3': 'background.mp3',
    'Mini boss background sound.mp3': 'encounter.mp3',
    'sword attack 1.mp3': 'sword-1.mp3',
    'Sword attack 2.mp3': 'sword-2.mp3',
    'Sword attack 3.mp3': 'sword-3.mp3',
    'Taking damage.mp3': 'damage.mp3',
    'Game over.mp3': 'game-over.mp3',
    'Base enemy dying.mp3': 'enemy-death.mp3',
}
parser=argparse.ArgumentParser()
parser.add_argument('--ffmpeg', required=True)
args=parser.parse_args()
target.mkdir(parents=True, exist_ok=True)
trims={'sword-1.mp3':'atrim=start=0.055:end=0.965,asetpts=PTS-STARTPTS,atempo=2.2',
       'sword-2.mp3':'atrim=start=0.57:end=0.94,asetpts=PTS-STARTPTS',
       'sword-3.mp3':'atrim=start=0.14:end=0.42,asetpts=PTS-STARTPTS',
       'damage.mp3':'atrim=start=0.075:end=0.76,asetpts=PTS-STARTPTS'}
for original, shipped in files.items():
    filters=trims.get(shipped,'anull')
    if shipped in ['background.mp3','encounter.mp3']:
        gain=-12
    else:
        measured=subprocess.run([args.ffmpeg,'-hide_banner','-i',str(source/original),'-af',filters+',volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
        peak=float(re.search(r'max_volume: ([-\d.]+) dB',measured.stderr)[1])
        gain=min(0,-12-peak)
    output=target/(Path(shipped).stem+'-quiet.mp3')
    subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(source/original),'-af',filters+f',volume={gain}dB,afade=t=in:d=0.006','-ar','44100','-c:a','libmp3lame','-b:a','128k',str(output)],check=True)
    print(f'{original}: {gain:.1f} dB attenuation -> {output.name}')
