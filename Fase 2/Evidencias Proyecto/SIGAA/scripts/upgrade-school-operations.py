"""Server-only additive upgrade. Never seeds or restores the live database."""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
expected = Path('/srv/sigaa-current-20261015/SIGAA')
if root != expected:
    raise SystemExit('This upgrade is restricted to the existing SIGAA server deployment.')
docker = '/usr/local/bin/docker'
backup = Path('/srv/sigaa-backups') / ('operations-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
backup.mkdir(mode=0o700, parents=True, exist_ok=False)
os.chmod(backup, 0o700)
dump = backup / 'before-operations.dump'
with dump.open('xb') as out:
    os.chmod(dump, 0o600)
    subprocess.run([docker, 'exec', 'sigaa-db-1', 'sh', '-c',
        'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"'], stdout=out, check=True)
with dump.open('rb') as source:
    listing = subprocess.run([docker, 'exec', '-i', 'sigaa-db-1', 'pg_restore', '--list'],
        stdin=source, stdout=subprocess.PIPE, check=True)
if len(listing.stdout) < 100:
    raise SystemExit('Backup inventory verification failed; migration not applied.')
subprocess.run([docker, 'exec', '-i', 'sigaa-db-1', 'sh', '-c',
    'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],
    input=(root / 'infra/postgres/init/008_school_operations.sql').read_bytes(), check=True)
print(json.dumps({'backup': str(dump), 'bytes': dump.stat().st_size,
    'backupInventoryVerified': True, 'migration': '008_school_operations.sql',
    'schema': '0.8.0', 'liveDataSeeded': False}))
