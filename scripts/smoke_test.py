"""Render a historical teacher script without an API call or tokenizer."""
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
code = ROOT / 'examples/historical/atom_5b3300aaeeab/code.js'
out = ROOT / 'outputs/smoke'
subprocess.run([sys.executable, str(ROOT / 'runtime/render_program.py'),
                '--code', str(code), '--dim', '3', '--frames', '12',
                '--duration-seconds', '4', '--out', str(out)], check=True)
result = json.loads((out / 'render_metrics.json').read_text())
assert result['deterministic_first_frame'], result
assert result['spatial_vertices_midpoint']['finite'], result
assert result['spatial_vertices_midpoint']['vertices'] > 0, result
with Image.open(out / 'clip.gif') as gif:
    duration = 0
    for i in range(gif.n_frames):
        gif.seek(i)
        duration += gif.info['duration']
assert duration == 4000, duration
print('PASS: rendering, finite geometry, deterministic t=0, GIF duration 4s')
print(out / 'clip.gif')
