"""Dev-only server for baking pre-rendered ground tiles with the game's own renderer.
Serves sites/veyrath/dist and accepts POST /__save?path=maps/ground/X_Y.webp (or maps/ground.json) to write tiles.
Usage: python sites/veyrath/tools/bake-server.py [port]  -> open http://localhost:PORT/?debug, start a run,
then in the console: await veyrathDebug.bakeGroundTiles()   (re-bake whenever the map generator is re-run)."""
import http.server,sys,re,os
from pathlib import Path
from urllib.parse import urlparse,parse_qs
DIST=Path(__file__).resolve().parents[1]/'dist';OK=re.compile(r'^maps/(ground/\d+_\d+\.webp|ground\.json)$')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**k):super().__init__(*a,directory=str(DIST),**k)
    def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
    def do_POST(self):
        u=urlparse(self.path);rel=parse_qs(u.query).get('path',[''])[0]
        if u.path!='/__save' or not OK.match(rel):self.send_error(403);return
        n=int(self.headers.get('Content-Length',0));data=self.rfile.read(n);out=DIST/rel;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
        self.send_response(200);self.end_headers();self.wfile.write(b'ok')
    def log_message(self,*a):pass
port=int(sys.argv[1]) if len(sys.argv)>1 else 8770
http.server.ThreadingHTTPServer(('127.0.0.1',port),H).serve_forever()
