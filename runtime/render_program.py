"""Isolated browser evaluation with network blocked outside the local artifact root."""
import argparse,json,threading,functools,time,os
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
H=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
def render(code,dim,frames,duration_seconds,out):
 if frames < 2 or duration_seconds <= 0: raise ValueError("Need >=2 frames and positive duration")
 out.mkdir(parents=True,exist_ok=True);start=time.perf_counter()
 server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(H)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();origin=f'http://127.0.0.1:{server.server_port}'
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('CHROME_PATH') or None,headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
   context=browser.new_context(viewport={'width':640,'height':640},device_scale_factor=1,accept_downloads=False,service_workers='block')
   context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(origin+'/') else route.abort())
   page=context.new_page();page.route_web_socket('**/*',lambda ws:ws.close());errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(origin+f'/runtime.html?dim={dim}');page.wait_for_function('window.runtimeReady===true',timeout=20000);page.evaluate('(code)=>window.setupAnimation(code)',code)
   camera_fit=page.evaluate('window.fitAnimationCamera()') if dim==3 else None
   images=[];pngdir=out/'frames';pngdir.mkdir(exist_ok=True)
   for i in range(frames):
    page.evaluate('(t)=>window.renderFrame(t)',i/(frames-1));path=pngdir/f'{i+1:04d}.png';page.locator('canvas').screenshot(path=str(path));images.append(Image.open(path).convert('RGB'))
    if errors:raise RuntimeError('\n'.join(errors))
   page.evaluate('window.renderFrame(0)');roundtrip=page.locator('canvas').screenshot()
   deterministic_first_frame=roundtrip==(pngdir/'0001.png').read_bytes()
   page.evaluate('window.renderFrame(.5)')
   for name,pos in [('side',[0,-6,0.5]),('top',[0,-.01,6])]:
    page.evaluate('(p)=>{const C=window.animationCamera.position.constructor;const target=new C(...window.displayTarget);const dir=new C(...p).normalize();window.animationCamera.position.copy(target).addScaledVector(dir,window.displayDistance);window.animationCamera.lookAt(target);}',pos)
    page.evaluate('window.renderFrame(.5)');page.locator('canvas').screenshot(path=str(out/(name+'.png')))
   spatial=None
   if dim==3:
    spatial=page.evaluate('''()=>{const positions=[];window.animationScene.updateMatrixWorld(true);window.animationScene.traverse(o=>{const a=o.geometry?.attributes?.position;if(a)for(let i=0;i<a.count;i++){const p=new THREE.Vector3(a.getX(i),a.getY(i),a.getZ(i));p.applyMatrix4(o.matrixWorld);positions.push([p.x,p.y,p.z]);}});return {vertices:positions.length,finite:positions.every(p=>p.every(Number.isFinite))};}'''.replace('new THREE.Vector3','new window.animationCamera.position.constructor'))
   browser.close()
  palette=images[len(images)//2].quantize(colors=128);gif=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in images];gif[0].save(out/'clip.gif',save_all=True,append_images=gif[1:],duration=[10*(round((i+1)*duration_seconds*100/frames)-round(i*duration_seconds*100/frames)) for i in range(frames)],loop=0,optimize=False)
  selected=sorted(set(round(i*(frames-1)/8) for i in range(9)));sheet=Image.new('RGB',(320*len(selected),350),'white');draw=ImageDraw.Draw(sheet)
  for n,i in enumerate(selected):sheet.paste(images[i].resize((320,320)),(n*320,30));draw.text((n*320+10,8),f'Frame {i+1}',fill='black')
  sheet.save(out/'contact_sheet.png')
  result={'ok':True,'frames':frames,'duration_ms':round(duration_seconds*1000),'dim':dim,'render_seconds':time.perf_counter()-start,'network_policy':'Local artifact root only; no credentials in browser','camera_fit':camera_fit,'deterministic_first_frame':deterministic_first_frame,'spatial_vertices_midpoint':spatial}
  (out/'render_metrics.json').write_text(json.dumps(result,indent=2));return result
 finally:server.shutdown();server.server_close()
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--code',type=Path,required=True);p.add_argument('--dim',type=int,required=True);p.add_argument('--frames',type=int,required=True);p.add_argument('--duration-seconds',type=float,default=4);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 try:render(a.code.read_text(),a.dim,a.frames,a.duration_seconds,a.out)
 except Exception as e:
  a.out.mkdir(parents=True,exist_ok=True);(a.out/'render_failure.json').write_text(json.dumps({'ok':False,'error':str(e),'error_type':type(e).__name__},indent=2));raise
