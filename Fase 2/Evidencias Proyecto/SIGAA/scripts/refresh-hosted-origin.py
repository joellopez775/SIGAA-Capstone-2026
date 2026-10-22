"""Synchronize strict login origin after a Quick Tunnel starts or changes URL."""
import os, re, subprocess, time
from pathlib import Path
root = Path(__file__).resolve().parents[1]
os.chdir(root)
docker = '/usr/local/bin/docker'
base = [docker, 'compose', '--env-file', '.secrets/hosted.env', '-f', 'compose.hosted.yaml']
for attempt in range(30):
    logs = subprocess.check_output(base + ['logs', '--no-color', '--tail', '300', 'tunnel'], text=True)
    urls = re.findall(r'https://[a-z0-9-]+\.trycloudflare\.com', logs)
    if urls: break
    time.sleep(2)
else: raise SystemExit('Tunnel URL unavailable; no origin change made')
origin = urls[-1]
target = root / '.secrets/hosted.env'
data = re.sub(r'^APP_ORIGIN=.*$', 'APP_ORIGIN=' + origin, target.read_text(), flags=re.M)
target.write_text(data)
os.chmod(target, 0o600)
subprocess.run(base + ['up', '-d', 'api', 'web'], check=True)
print(origin)
