#!/usr/bin/env python3
"""Targeted, reversible CampusMart Skiper-inspired React/Vite UI patch.

Usage: python apply_ui_effects.py "C:\\...\\kampus-mart\\client"
       python apply_ui_effects.py "C:\\...\\kampus-mart\\client" --dry-run

Never changes server/, database/, services/api.ts, App.tsx, or Git metadata.
"""
from __future__ import annotations
import argparse
import datetime
import os
import re
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC_COMPONENTS = HERE / 'client/src/components/motion'
ASSET = HERE / 'client/public/images/peeps/all-peeps.png'


def inject_import(text: str, imported_name: str, relative_path: str) -> str:
    imp = f"import {{ {imported_name} }} from '{relative_path}';"
    if imp in text:
        return text
    # Keep a potential Next.js 'use client' directive as the first statement.
    useclient = re.match(r"^([ \t]*['\"]use client['\"];[ \t]*\r?\n)", text)
    if useclient:
        return text[:useclient.end()] + imp + '\n' + text[useclient.end():]
    return imp + '\n' + text


def relative_module(file: Path, target: Path) -> str:
    relative = Path(os.path.relpath(target.with_suffix(''), file.parent)).as_posix()
    return relative if relative.startswith('.') else './' + relative


def patch_inputs(text: str, path: Path, src: Path) -> tuple[str, int]:
    # JSX <input ... /> becomes <SmoothInput ... />, but the rendered input DOM,
    # attributes and handlers remain exactly the same (see SmoothInput.tsx).
    result, count = re.subn(r'<input(?=[\s/>])', '<SmoothInput', text)
    if count:
        target = src / 'components/motion/SmoothInput.tsx'
        result = inject_import(result, 'SmoothInput', relative_module(path, target))
    return result, count


def patch_home(text: str, path: Path, src: Path) -> tuple[str, bool]:
    if '<HomeScrollAccent' in text:
        return text, False
    # Insert a self-contained scroll-reactive section between existing major sections.
    anchor = re.search(r'(?m)^\s*\{\/\* =+\s*\n\s*SECTION\s+[345]\s*[—-]', text)
    if not anchor:
        anchor = re.search(r'(?m)^\s*\{\/\*\s*SECTION\s+[345]', text)
    if not anchor:
        return text, False
    markup = '      {/* Skiper-inspired scrolling path: self-contained, no overlays */}\n      <HomeScrollAccent />\n\n'
    text = text[:anchor.start()] + '\n' + markup + text[anchor.start():]
    text = inject_import(text, 'HomeScrollAccent', relative_module(path, src / 'components/motion/HomeScrollAccent.tsx'))
    return text, True


def patch_teammates(text: str, path: Path, src: Path) -> tuple[str, bool]:
    if '<CrowdCanvas' in text:
        return text, False
    # Locate the intended banner only; never modify arbitrary dark UI containers.
    match_comment = re.search(r'(?:Top Hero Banner|HERO BANNER)', text, re.I)
    if not match_comment:
        return text, False
    start = match_comment.end()
    candidate = text[start:start + 900]
    tag = re.search(r'<(?:div|section)\s+className="([^"]+)"[^>]*>', candidate)
    if not tag or not ('relative' in tag.group(1) and 'overflow-hidden' in tag.group(1)):
        return text, False
    full_start = start + tag.start()
    full_end = start + tag.end()
    opening = text[full_start:full_end]
    # Reserve a real 12rem at the bottom so figures CAN'T overlap hero content.
    if 'style=' not in opening:
        opening = opening[:-1] + " style={{ paddingBottom: '12rem' }}>"
    crowd = '''
        {/* Decorative crowd in a reserved lower band, below clickable hero content. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-36 sm:h-40 overflow-hidden" aria-hidden="true">
          <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
        </div>
        <a href="https://skiper-ui.com/v1/skiper39" target="_blank" rel="noopener noreferrer"
           className="absolute bottom-1 right-4 z-10 text-[10px] text-slate-300 underline underline-offset-2 hover:text-white">
          Crowd inspired by Skiper UI
        </a>
'''
    text = text[:full_start] + opening + crowd + text[full_end:]
    text = inject_import(text, 'CrowdCanvas', relative_module(path, src / 'components/motion/CrowdCanvas.tsx'))
    return text, True


def patch_navbar(text: str, path: Path, src: Path) -> tuple[str, int]:
    if '<TextRoll' in text:
        return text, 0
    labels = ['Explore','Sell Gear','Teammates','Heroes','My Teams','Buy','Sell','Campus Heroes','Hero Operations','Admin Portal','Log in','Sign up']
    matched = 0
    # Plain text nav line; this stays INSIDE the existing <Link> and never changes its route.
    pattern = re.compile(r'(?m)^([ \t]*)(' + '|'.join(re.escape(x) for x in labels) + r')([ \t]*)$')
    text, n = pattern.subn(lambda m: f'{m.group(1)}<TextRoll text="{m.group(2)}" />', text)
    matched += n
    # Common <span>nav label</span> form.
    pattern2 = re.compile(r'<span>(\s*)(' + '|'.join(re.escape(x) for x in labels) + r')(\s*)</span>')
    text, n = pattern2.subn(lambda m: f'<span><TextRoll text="{m.group(2)}" /></span>', text)
    matched += n
    if matched:
        text = inject_import(text, 'TextRoll', relative_module(path, src / 'components/motion/TextRoll.tsx'))
    return text, matched


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('client', help='Path to inner project CLIENT folder, not the outer wrapper')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without writing anything')
    args = parser.parse_args()
    client = Path(args.client).expanduser().resolve()
    src = client / 'src'
    if not (src / 'pages/Home.tsx').is_file() or not (src / 'pages/FindTeammatesPage.tsx').is_file() or not (src / 'services/api.ts').is_file():
        parser.error('Incorrect client directory: expected src/pages/Home.tsx, FindTeammatesPage.tsx, and src/services/api.ts. Nothing changed.')

    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    backup = client / '.skiper-backup' / stamp
    changed_files: list[tuple[Path, str, int]] = []
    count_inputs = 0
    for file in src.rglob('*.tsx'):
        relative = file.relative_to(src)
        if 'node_modules' in relative.parts or (len(relative.parts) > 1 and relative.parts[:2] == ('components', 'motion')):
            continue
        original = file.read_text(encoding='utf-8')
        result, replaced = patch_inputs(original, file, src)
        count_inputs += replaced
        effects = []
        if relative.as_posix() == 'pages/Home.tsx':
            result, inserted = patch_home(result, file, src)
            if inserted: effects.append('home scroll animation')
        if relative.as_posix() == 'pages/FindTeammatesPage.tsx':
            result, inserted = patch_teammates(result, file, src)
            if inserted: effects.append('crowd background')
        if relative.as_posix() == 'components/Navbar.tsx':
            result, roll_count = patch_navbar(result, file, src)
            if roll_count: effects.append(f'{roll_count} rolling nav labels')
        if original != result:
            changed_files.append((file, result, replaced))
            print(f'  {relative}: {replaced} inputs' + (f', {", ".join(effects)}' if effects else ''))

    for component in SRC_COMPONENTS.glob('*.tsx'):
        dest = src / 'components/motion' / component.name
        if not dest.exists() or dest.read_bytes() != component.read_bytes():
            print(f'  NEW/UPDATED components/motion/{component.name}')
    asset_dest = client / 'public/images/peeps/all-peeps.png'
    if not asset_dest.exists(): print('  NEW public/images/peeps/all-peeps.png')

    if args.dry_run:
        print(f'DRY RUN: {len(changed_files)} existing TSX files, {count_inputs} native input tags, no changes made.')
        return
    # Back up all existing files that will be overwritten.
    for file, updated, _ in changed_files:
        dest = backup / 'src' / file.relative_to(src)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, dest)
        file.write_text(updated, encoding='utf-8')
    for component in SRC_COMPONENTS.glob('*.tsx'):
        dest = src / 'components/motion' / component.name
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists():
            previous = backup / 'src/components/motion' / component.name
            previous.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dest, previous)
        shutil.copy2(component, dest)
    asset_dest.parent.mkdir(parents=True, exist_ok=True)
    if asset_dest.exists():
        previous = backup / 'public/images/peeps/all-peeps.png'
        previous.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(asset_dest, previous)
    shutil.copy2(ASSET, asset_dest)
    print(f'\nChanged {len(changed_files)} existing .tsx files; replaced {count_inputs} input tags.')
    print(f'Backups: {backup}')
    print('Dependency: from client/ run `npm install gsap` (framer-motion already used by Home).')
    print('Then run `npm run build`. No backend files touched.')

if __name__ == '__main__': main()
