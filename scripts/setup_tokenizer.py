"""Download only the pinned tokenizer; no model weights or API credentials."""
import hashlib
import json
import os
from pathlib import Path
import urllib.request

from tokenizers import Tokenizer

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'config.json').read_text())
dest = ROOT / 'tokenizer/tokenizer.json'
meta = dest.with_name('provenance.json')
revision = config['tokenizer_revision']
repo = config['tokenizer_repo']
if dest.exists() and meta.exists():
    old = json.loads(meta.read_text())
    if (old.get('revision') == revision and old.get('repo') == repo
            and old.get('sha256') == hashlib.sha256(dest.read_bytes()).hexdigest()):
        Tokenizer.from_file(str(dest))
        print('Pinned tokenizer already present:', dest)
        raise SystemExit(0)
base = os.environ.get('HF_ENDPOINT', 'https://huggingface.co').rstrip('/')
url = f'{base}/{repo}/resolve/{revision}/tokenizer.json'
dest.parent.mkdir(parents=True, exist_ok=True)
tmp = dest.with_suffix('.download')
with urllib.request.urlopen(url, timeout=180) as response, tmp.open('wb') as output:
    while True:
        chunk = response.read(1024 * 1024)
        if not chunk:
            break
        output.write(chunk)
Tokenizer.from_file(str(tmp))
sha = hashlib.sha256(tmp.read_bytes()).hexdigest()
tmp.replace(dest)
meta.write_text(json.dumps(dict(repo=repo, revision=revision, sha256=sha), indent=2) + '\n')
print('Downloaded pinned tokenizer:', dest)
