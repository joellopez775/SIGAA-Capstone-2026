"""Provision private demo staff accounts once; never print passwords."""
import json
import os
from pathlib import Path
import secrets
import subprocess

root = Path(__file__).resolve().parents[1]
if root != Path('/srv/sigaa-current-20261015/SIGAA'):
    raise SystemExit('Run only on the existing demo server.')
target = root / '.secrets/operations-accounts.json'
if target.exists():
    raise SystemExit('Existing account credentials preserved. No accounts changed.')
accounts = {
    'admin': {'email': 'administracion@sigaa.demo', 'name': 'Administración SIGAA', 'role': 'ADMINISTRADOR', 'password': secrets.token_urlsafe(24)},
    'inspector': {'email': 'inspectoria@sigaa.demo', 'name': 'Inspectoría SIGAA', 'role': 'INSPECTORIA', 'password': secrets.token_urlsafe(24)},
}
with target.open('x') as output:
    os.chmod(target, 0o600)
    json.dump(accounts, output)
for account in accounts.values():
    subprocess.run(['/usr/local/bin/docker', 'exec', '-i', 'sigaa-current-api-1',
        'node', 'src/manage-user.js'], input=json.dumps(account), text=True, check=True)
print('Staff demo accounts created; credentials remain in the private file only.')
