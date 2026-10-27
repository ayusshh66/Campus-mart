#!/usr/bin/env python3
"""Restore original files saved by apply_ui_effects.py; new motion files are left in place unused."""
import argparse
from pathlib import Path
import shutil

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('client', help='Original client folder')
p.add_argument('backup', help='Exact backup directory printed during patch')
a = p.parse_args()
client = Path(a.client).resolve()
backup = Path(a.backup).resolve()
if not (client/'src/pages/Home.tsx').is_file() or not (backup/'src').is_dir():
    p.error('Expected valid client folder and saved .skiper-backup/<timestamp> directory')
if not backup.is_relative_to(client):
    p.error('Backup must be inside the specified client directory')

files = [f for f in backup.rglob('*') if f.is_file()]
for source in files:
    destination = client/source.relative_to(backup)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    print('RESTORED', destination.relative_to(client))
print('Original edited files restored. Unused new components remain; remove manually only if desired.')
