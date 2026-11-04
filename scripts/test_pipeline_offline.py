"""Exercise generation, compression, rendering, export and resume with a local API fixture."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parents[1]
CODE = (ROOT / 'examples/historical/atom_5b3300aaeeab/code.js').read_text()
calls = []


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        request = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        calls.append(request)
        if request['thinking']['type'] == 'enabled':
            message = dict(content=CODE, reasoning_content='Fixture geometry calculation. ' * 4000)
        else:
            message = dict(content='Fixture summary: keep the original geometry and motion unchanged.')
        body = json.dumps(dict(choices=[dict(finish_reason='stop', message=message)], usage={})).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with tempfile.TemporaryDirectory(prefix='threejs-pipeline-test-') as tmp:
        tmp = Path(tmp)
        config = json.loads((ROOT / 'config.json').read_text())
        config.update(endpoint=f'http://127.0.0.1:{server.server_port}/chat/completions', frames=6)
        cp = tmp / 'config.json'
        cp.write_text(json.dumps(config))
        command = [sys.executable, str(ROOT / 'run.py'), '--config', str(cp),
                   '--limit', '1', '--output', str(tmp / 'output')]
        env = dict(os.environ, DEEPSEEK_API_KEY='offline-fixture-no-real-key')
        subprocess.run(command, env=env, check=True, timeout=180)
        assert len(calls) == 2, len(calls)
        row = json.loads((tmp / 'output/samples.provisional.jsonl').read_text())
        assert row['messages'][-1]['content'] == CODE
        assert row['messages'][-1]['reasoning_content'].startswith('Fixture summary:')
        assert row['messages'][0]['content'] == (ROOT / 'prompts/system.txt').read_text()
        subprocess.run(command, env=env, check=True, timeout=30)
        assert len(calls) == 2, 'Resume must reuse cached responses'
        config['frames'] = 7
        cp.write_text(json.dumps(config))
        mismatch = subprocess.run(command, env=env, capture_output=True, text=True, timeout=30)
        assert mismatch.returncode != 0 and 'different prompts/tasks/config' in mismatch.stderr
        assert len(calls) == 2
        print('PASS: mocked API, compression, rendering, unchanged JS export, resume, configuration guard')
finally:
    server.shutdown()
    server.server_close()
