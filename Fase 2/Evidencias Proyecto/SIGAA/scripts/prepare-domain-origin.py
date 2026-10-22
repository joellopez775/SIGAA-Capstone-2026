"""Add SIGAA's permanent origin without replacing the active demo origin.

Run from the deployed checkout. Does not recreate containers or touch DNS.
"""
import os
import re
from pathlib import Path

target = Path(__file__).resolve().parents[1] / '.secrets/hosted.env'
if target.is_symlink():
    raise SystemExit('Refusing a symlink for the private environment file')
text = target.read_text()
primary = re.findall(r'^APP_ORIGIN=(.+)$', text, re.M)
if len(primary) != 1 or not primary[0].startswith('https://'):
    raise SystemExit('Expected one existing HTTPS APP_ORIGIN; no changes made')
rows = re.findall(r'^APP_ADDITIONAL_ORIGINS=(.*)$', text, re.M)
if len(rows) > 1:
    raise SystemExit('Duplicate additional-origin settings; no changes made')
origins = [v.strip() for v in (rows[0].split(',') if rows and rows[0] else [])]
permanent = 'https://sigaa.ignisert.com'
if permanent not in origins and primary[0] != permanent:
    origins.append(permanent)
setting = 'APP_ADDITIONAL_ORIGINS=' + ','.join(origins)
updated = re.sub(r'^APP_ADDITIONAL_ORIGINS=.*$', setting, text, flags=re.M) if rows else text.rstrip('\n') + '\n' + setting + '\n'
# Create a private, exclusive temporary file and replace atomically.
temporary = target.with_name('hosted.env.domain-staging')
fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as stream:
    stream.write(updated)
os.replace(temporary, target)
print('Permanent origin added; primary origin and database settings preserved.')
