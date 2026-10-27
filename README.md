# CampusMart — Skiper-inspired UI effects (reversible, no API changes)

This is **not** a replacement of the whole project or of `client/src/pages`. Copy the ZIP anywhere outside your project. The script modifies ONLY files that actually exist in your CURRENT frontend. It makes a timestamped backup of each changed file before writing.

## Apply in PowerShell (from where you extracted the ZIP)

```powershell
# 1. Preview what it will touch. Set this to the INNER project client folder.
python .\apply_ui_effects.py "C:\Users\Ayush\OneDrive\Documents\personal projects\Intern Data\kampus-mart\kampus-mart\client" --dry-run

# 2. Apply the targeted changes (creates client/.skiper-backup/<timestamp>/)
python .\apply_ui_effects.py "C:\Users\Ayush\OneDrive\Documents\personal projects\Intern Data\kampus-mart\kampus-mart\client"

# 3. Add ONLY the GSAP dependency for the walking crowd
cd "C:\Users\Ayush\OneDrive\Documents\personal projects\Intern Data\kampus-mart\kampus-mart\client"
npm install gsap
npm run build
```

If your original `client` is somewhere else, supply its actual path. Do not point the script to the outer `kampus-mart` wrapper folder.

## What is installed

- `src/components/motion/SmoothInput.tsx` — Skiper 106-inspired smooth caret on **native** inputs. Automatically converts existing `<input ... />` to `<SmoothInput ... />`, preserving all existing props/handlers/ref/type; extra caret animation only on text/email/password/search/tel/url. File, checkbox, radio, number, datetime stay *native* and operational (no bogus text caret).
- `src/components/motion/TextRoll.tsx` — Skiper 58-inspired rolling nav text. The script applies it to simple literal labels in your existing Navbar without replacing the router links. If your Navbar generates labels dynamically, change only the children of existing `<Link>` components, e.g. `<TextRoll text="Explore" />`. Keep the original `to`, `onClick`, `className`, and role guards.
- `src/components/motion/CrowdCanvas.tsx` — Skiper 39-inspired GSAP canvas using local sprite. Script places this only in the Teammates hero, in a reserved **bottom 12rem**, behind foreground text/buttons.
- `public/images/peeps/all-peeps.png` — **original characters drawn for this package**, 15-column x 7-row transparent sprite; no Open Peeps proprietary or third-party asset required.
- `src/components/motion/HomeScrollAccent.tsx` — Skiper 19-inspired progress-drawn background stroke in its own contained homepage section. It doesn't require 350vh or overlap product cards.

Both animations honor reduced-motion settings. Attribution links to Skiper UI are included where applicable.

## If nav labels are dynamic or effect wasn't inserted

The script reports which edits were applied. A missing nav transformation is harmless. To use rolling labels manually, add this to `client/src/components/Navbar.tsx`:

```tsx
import { TextRoll } from './motion/TextRoll';
```

Keep your existing links, but replace their visible text:

```tsx
<Link to="/buy" className={existingClasses}>
  <TextRoll text="Explore" />
</Link>
```

The script only inserts Home and Teammates effects when it recognizes the correct section comments; otherwise it **skips** them rather than potentially corrupting a modified page.

## Restore safely

Read the printed backup path, then run:

```powershell
python .\restore_from_backup.py "C:\...\kampus-mart\kampus-mart\client" "C:\...\kampus-mart\kampus-mart\client\.skiper-backup\20261022-XXXXXX"
```

Do not run `git reset --hard`. The restore script only restores files backed up during the patch. All new motion components remain installed but unused after restoring previous pages.

## Verification

1. `npm run build` in `client/` (requires the project's normal `npm install` dependencies, plus `gsap`).
2. `/`: search input still works, homepage contains a scroll-path CTA, product links still navigate.
3. `/find-teammates`: text/buttons readable above walking figures, filters and profile modal work.
4. `/login`, `/signup`, `/sell`, `/buy`, `/my-teams`: existing form submissions and validation still work.
5. Mobile + `prefers-reduced-motion` check. If sprites don't display, verify `/images/peeps/all-peeps.png` is served from `client/public/`.

**No changes to** server, database, Prisma, `services/api.ts`, auth context, App.tsx, or admin business logic. Existing `.tsx` files are edited locally; they are never wholesale replaced by the archive.

**Tests performed on provided page snapshot:** automated patch applied to 12 TSX pages, replaced 41 input elements, and TypeScript parser reported zero TSX syntax errors. Full production build was **not** performed because the user's actual repository and its node_modules aren't accessible in this runtime.
