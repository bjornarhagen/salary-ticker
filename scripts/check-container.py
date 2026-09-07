"""Verify the final static image under production filesystem/user constraints."""
import hashlib
import json
import re
import subprocess
import sys
import time
from urllib.error import HTTPError
from urllib.request import urlopen

image = sys.argv[1]
container = subprocess.check_output([
    'docker', 'run', '-d', '--rm', '--read-only', '--user', '1000:1000',
    '--cap-drop=ALL', '--security-opt=no-new-privileges', '--memory=32m',
    '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
    '-p', '127.0.0.1::8080', image,
], text=True).strip()
try:
    port = subprocess.check_output(['docker', 'port', container, '8080/tcp'], text=True).strip().rsplit(':', 1)[1]
    base = 'http://127.0.0.1:' + port
    for attempt in range(30):
        try:
            with urlopen(base, timeout=2) as response:
                html = response.read()
                assert response.status == 200
                assert response.headers['Cache-Control'] == 'no-cache'
            break
        except OSError:
            if attempt == 29:
                raise
            time.sleep(0.2)
    assert b'id="root"' in html and b"Salary Ticker" in html
    assets = re.findall(rb'(?:src|href)="(/assets/[^\"]+)"', html)
    assert len(assets) >= 2
    for path in assets:
        with urlopen(base + path.decode(), timeout=5) as response:
            body = response.read()
            assert body and response.status == 200
            assert 'immutable' in response.headers['Cache-Control']
            assert 'text/html' not in response.headers['Content-Type']
            print('PASS asset', path.decode(), hashlib.sha256(body).hexdigest())
    with urlopen(base + '/example?test=1', timeout=5) as response:
        assert response.read() == html
    try:
        urlopen(base + '/assets/missing.js', timeout=5)
        raise AssertionError('Missing asset returned success')
    except HTTPError as response:
        assert response.code == 404
    state = json.loads(subprocess.check_output(['docker', 'inspect', container], text=True))[0]
    assert state['State']['Running'] and not state['State']['OOMKilled']
    assert state['Config']['User'] == '1000:1000'
    print('PASS HTML, SPA fallback, missing-asset 404, cache policy and restricted runtime')
    print(subprocess.check_output(['docker', 'stats', '--no-stream', '--format', '{{.MemUsage}}', container], text=True).strip())
finally:
    subprocess.run(['docker', 'stop', container], check=True, stdout=subprocess.DEVNULL)
