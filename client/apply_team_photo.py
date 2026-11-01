#!/usr/bin/env python3
"""Safely swap only the team-banner artwork on an existing CampusMart GuestHome."""
from pathlib import Path
from datetime import datetime
import shutil
import sys

if len(sys.argv) != 2:
    raise SystemExit('Usage: python apply_team_photo.py PATH_TO_CAMPUSMART_PROJECT')
project = Path(sys.argv[1]).expanduser().resolve()
client = project / 'client' if (project/'client/src/pages/GuestHome.tsx').exists() else project
page = client/'src/pages/GuestHome.tsx'
css = client/'src/pages/GuestHome.css'
asset = client/'public/images/campusmart-team-visual.webp'
if not page.is_file() or not css.is_file():
    raise SystemExit('GuestHome.tsx and GuestHome.css not found. Point to the project root or client directory.')
old_t = page.read_text(encoding='utf-8')
old_c = css.read_text(encoding='utf-8')

# Target only the existing team banner; never overwrite the rest of the user project.
new_t = old_t.replace("import { Skiper39Background } from '../components/ui/Skiper39Background';\n",'')
needle = '<Skiper39Background />'
photo = '<img className="cm-team-photo" src="/images/campusmart-team-visual.webp" alt="" loading="lazy" />'
if needle in new_t: new_t = new_t.replace(needle,photo,1)
elif '<div className="cm-team-image" aria-hidden="true" />' in new_t:
    new_t = new_t.replace('<div className="cm-team-image" aria-hidden="true" />',f'<div className="cm-team-image" aria-hidden="true">{photo}</div>',1)
elif photo not in new_t:
    raise SystemExit('Could not locate existing team image or animation. No changes made.')

new_c = old_c
style='.cm-team-photo {display:block;width:100%;height:100%;object-fit:cover;object-position:left center;mask-image:linear-gradient(to right,#000 0%,#000 64%,transparent 100%);-webkit-mask-image:linear-gradient(to right,#000 0%,#000 64%,transparent 100%);}'
if '.cm-team-photo {' not in new_c:
    new_c += '\n'+style+'\n'

origin = Path(__file__).parent/'client/public/images/campusmart-team-visual.webp'
if not origin.exists(): raise SystemExit('The image asset is missing from the patch folder. No changes made.')
backup = client/'.team-photo-backup'/datetime.now().strftime('%Y%m%d-%H%M%S')
backup.mkdir(parents=True,exist_ok=True)
shutil.copy2(page,backup/'GuestHome.tsx')
shutil.copy2(css,backup/'GuestHome.css')
page.write_text(new_t,encoding='utf-8')
css.write_text(new_c,encoding='utf-8')
asset.parent.mkdir(parents=True,exist_ok=True)
shutil.copy2(origin,asset)
print('Updated team banner photo only; backup:',backup)
print('Asset:',asset)
