"""Loopback-only static preview with Netlify-like extensionless HTML routes."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent.parent

class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        # Never expose source control, internal documentation or tooling.
        if path.startswith(('/.git', '/.netlify', '/docs/', '/tools/', '/README')):
            self.send_error(404)
            return
        if path != '/' and not Path(path).suffix and (ROOT / f'{path.lstrip("/")}.html').is_file():
            self.path = f'{path}.html'
        return super().do_GET()

    def do_POST(self):
        self.send_error(503, 'Preview only: no applications accepted')

if __name__ == '__main__':
    os.chdir(ROOT)
    print('Powered Vitality local preview: http://127.0.0.1:8765/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8765), PreviewHandler).serve_forever()
