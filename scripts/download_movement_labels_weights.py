"""Download public GitHub Release assets, resume transfers, verify SHA256."""
from pathlib import Path
import argparse,urllib.request,json,hashlib,time,tarfile,shutil
ROOT=Path(__file__).resolve().parents[1]
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(8*1024**2),b''):h.update(b)
 return h.hexdigest()
def download(url,p,size,sha):
 p.parent.mkdir(parents=True,exist_ok=True)
 if p.exists():
  if p.stat().st_size==size and digest(p)==sha:return
  raise RuntimeError('Existing file differs from release manifest: '+str(p))
 part=p.with_suffix(p.suffix+'.partial')
 if part.exists() and part.stat().st_size==size:
  if digest(part)!=sha:raise RuntimeError('Complete partial file failed SHA256: '+str(part))
  part.replace(p);return
 for attempt in range(8):
  try:
   offset=part.stat().st_size if part.exists() else 0
   req=urllib.request.Request(url,headers={'User-Agent':'threejs-sketch-release-downloader','Range':f'bytes={offset}-'} if offset else {'User-Agent':'threejs-sketch-release-downloader'})
   with urllib.request.urlopen(req,timeout=120) as r:
    append=offset>0 and r.status==206
    if append:assert r.headers.get('Content-Range','').startswith(f'bytes {offset}-')
    with part.open('ab' if append else 'wb') as f:shutil.copyfileobj(r,f,8*1024**2)
   assert part.stat().st_size==size and digest(part)==sha,'size/SHA256 mismatch';part.replace(p);return
  except Exception as e:
   if attempt==7:raise
   print('Retry',p.name,type(e).__name__,flush=True);time.sleep(min(30,2**attempt))
def extract(p,out):
 with tarfile.open(p,'r:gz') as z:
  for m in z.getmembers():
   dest=(out/m.name).resolve()
   if not dest.is_relative_to(out.resolve()) or m.issym() or m.islnk():raise RuntimeError('Unsafe archive member')
  z.extractall(out)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,default=Path('weights/movement_labels_4b'));a=ap.parse_args();m=json.loads((ROOT/'models/movement_labels2000_2ep/release_manifest.json').read_text());api=f"https://api.github.com/repos/{m['repo']}/releases/tags/{m['tag']}"
 with urllib.request.urlopen(urllib.request.Request(api,headers={'User-Agent':'threejs-sketch-release-downloader'}),timeout=45) as r:release=json.load(r)
 assets={x['name']:x for x in release['assets']};a.output.mkdir(parents=True,exist_ok=True)
 for f in m['files']:
  asset=assets[f['name']];assert asset['size']==f['bytes'];p=a.output/f.get('destination','.downloads/'+f['name']);print('Downloading/verifying',f['name'],flush=True);download(asset['browser_download_url'],p,f['bytes'],f['sha256'])
  if f.get('kind') in ['support','adapter_archive']:extract(p,a.output)
 adapter=a.output/'adapter/adapter_model.safetensors';assert digest(adapter)==m['adapter_tensor_sha256'];print('Verified complete model:',a.output)
if __name__=='__main__':main()
