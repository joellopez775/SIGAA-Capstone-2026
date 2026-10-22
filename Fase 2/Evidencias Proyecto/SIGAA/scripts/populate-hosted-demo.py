"""Back up, prove the synthetic seed on a restored copy, then add it to the demo."""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true', required=True)
parser.parse_args()
root = Path(__file__).resolve().parents[1]
if root != Path('/srv/sigaa-current-20261015/SIGAA'):
    raise SystemExit('Restricted to the known demo deployment.')
docker = '/usr/local/bin/docker'
stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
test_db = 'sigaa_demo_check_' + stamp
backup = Path('/srv/sigaa-backups') / ('demo-' + stamp)
backup.mkdir(mode=0o700, parents=True, exist_ok=False)
dump = backup / 'before-demo.dump'

def seed(*args):
    result = subprocess.run([docker, 'exec', 'sigaa-current-api-1', 'node',
        'src/populate-demo.js', *args], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)

def db_shell(command, **kwargs):
    return subprocess.run([docker, 'exec', '-i', 'sigaa-db-1', 'sh', '-c', command], check=True, **kwargs)

subprocess.run([docker, 'cp', str(root / 'apps/api/src/populate-demo.js'),
    'sigaa-current-api-1:/app/src/populate-demo.js'], check=True)
initial = seed('--inspect')
if initial['alreadyApplied']:
    print(json.dumps({'alreadyApplied': True, 'changed': False, 'inspection': initial}))
    raise SystemExit(0)
with dump.open('xb') as out:
    os.chmod(dump, 0o600)
    db_shell('pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"', stdout=out)
with dump.open('rb') as source:
    listing = subprocess.run([docker, 'exec', '-i', 'sigaa-db-1', 'pg_restore', '--list'], stdin=source, capture_output=True, check=True)
assert len(listing.stdout) > 100, 'Invalid backup'
db_shell('createdb -U "$POSTGRES_USER" ' + test_db)
try:
    with dump.open('rb') as source:
        db_shell('pg_restore --exit-on-error -U "$POSTGRES_USER" -d ' + test_db, stdin=source, stdout=subprocess.DEVNULL)
    target = '--test-database=' + test_db
    clone_before = seed('--inspect', target)
    assert clone_before['counts'] == initial['counts']
    dry = seed('--dry-run', target)
    assert seed('--inspect', target)['counts'] == clone_before['counts'], 'Dry run changed data'
    applied = seed('--apply-demo', 'SIGAA-DEMO-2026-10', target)
    repeated = seed('--apply-demo', 'SIGAA-DEMO-2026-10', target)
    assert repeated['alreadyApplied'] and not repeated['changed']
    assert repeated['counts'] == applied['after']
    for key, minimum in {'estudiante': 80, 'curso': 4, 'funcionario': 4, 'sesion_clase': 97,
        'asistencia': 1280, 'evaluacion': 48, 'calificacion': 640, 'anotacion_estudiante': 160,
        'justificacion_ausencia': 12, 'alerta': 1}.items():
        assert applied['after'][key] >= minimum, key
    assert seed('--inspect')['counts'] == initial['counts'], 'Live data changed during testing; review before proceeding'
    print(json.dumps({'isolatedTest': 'passed', 'dryRunRolledBack': True, 'repeatIsNoOp': True}), flush=True)
    live = seed('--apply-demo', 'SIGAA-DEMO-2026-10')
    verified = seed('--inspect')
    assert verified['alreadyApplied'] and verified['counts'] == live['after']
    report = {'date': datetime.datetime.now().isoformat(), 'backup': str(dump),
        'backupBytes': dump.stat().st_size, 'isolatedTest': 'passed',
        'dryRunRolledBack': True, 'repeatIsNoOp': True, 'live': live}
    output = root / 'output/evidence/synthetic-demo-load.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report, ensure_ascii=False))
finally:
    # This is the exact disposable database created above, never the live database.
    db_shell('dropdb -U "$POSTGRES_USER" ' + test_db)
