"""Run only on the SIGAA server. Creates private runtime credentials, no stdout secrets."""
import json, os, secrets, subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[1]
private = root / '.secrets'
private.mkdir(mode=0o700, exist_ok=True)
docker = '/usr/local/bin/docker'
def sql(text):
    subprocess.run([docker, 'exec', '-i', 'sigaa-db-1', 'sh', '-c',
                    'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],
                   input=text, text=True, check=True, stdout=subprocess.DEVNULL)
target = private / 'hosted.env'
if target.exists():
    raise SystemExit('Existing credentials preserved. Use the existing deployment.')
password = secrets.token_hex(32)
# Persist before changing the database so a failed command remains recoverable.
with target.open('x') as f:
    os.chmod(target, 0o600)
    f.write(f'APP_ORIGIN=https://pending.invalid\nDATABASE_URL=postgresql://sigaa_runtime:{password}@db:5432/sigaa\n')
sql(f"""BEGIN;
CREATE ROLE sigaa_runtime LOGIN PASSWORD '{password}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE sigaa TO sigaa_runtime;
GRANT USAGE ON SCHEMA public TO sigaa_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO sigaa_runtime;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO sigaa_runtime;
COMMIT;""")
accounts = { 'teacher': {'email':'docente@sigaa.demo','password':secrets.token_urlsafe(18)},
             'student': {'email':'estudiante@sigaa.demo','password':secrets.token_urlsafe(18)} }
with (private / 'accounts.json').open('x') as f:
    os.chmod(f.name, 0o600)
    json.dump(accounts, f)
print('Private runtime role and account input prepared; no passwords logged.')
