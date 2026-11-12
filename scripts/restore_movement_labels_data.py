"""Restore the exact2000-row SFT input, checking public shard and raw hashes."""
from pathlib import Path
import argparse,gzip,json,hashlib
R=Path(__file__).resolve().parents[1];D=R/'data/teachers/movement_labels2000_v1'
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,default=R/'data/movement_labels_train.raw.jsonl');a=ap.parse_args();m=json.loads((D/'manifest.json').read_text());a.output.parent.mkdir(parents=True,exist_ok=True);tmp=a.output.with_suffix(a.output.suffix+'.partial');h=hashlib.sha256();rows=0
 with tmp.open('wb') as out:
  for s in m['shards']:
   p=D/s['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256'],p.name
   with gzip.open(p,'rb') as f:
    for line in f:
     x=json.loads(line);assert x['completion'].count('</think>')==1;rows+=1;h.update(line);out.write(line)
 assert rows==m['rows']==2000 and h.hexdigest()==m['raw_sha256'];tmp.replace(a.output);print(json.dumps({'rows':rows,'sha256':h.hexdigest(),'output':str(a.output)},indent=2))
if __name__=='__main__':main()
