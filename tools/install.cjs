/**
 * CampusMart Admin upgrade installer.
 * Run from the project root after extracting this folder inside it:
 *   node CampusMart_Admin_Complete_Upgrade/tools/install.cjs
 * Makes backups; safely patches App.tsx when recognizable, does NOT replace
 * auth.ts, schema.prisma, or server route implementations with snapshots.
 */
const fs = require('node:fs');
const path = require('node:path');
const bundle = path.resolve(__dirname, '..');
const root = path.resolve(bundle, '..');
const backup = path.join(root, `.campusmart-admin-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const changes = [];
function verifyPatchTarget(relative, alreadyPresent, oldNeedle) {
  const f = pathInRoot(relative);
  if (!fs.existsSync(f)) throw Error(`Required route missing: ${relative}`);
  const text = fs.readFileSync(f,'utf8');
  if (!text.includes(alreadyPresent) && !text.includes(oldNeedle)) {
    throw Error(`Cannot safely patch ${relative}. Your local code differs from this snapshot. Back up and merge manually using INSTALL.md.`);
  }
}
// Validate ALL route patterns before writing any files.
verifyPatchTarget('server/src/routes/admin.ts', "router.post('/products', validateCatalogProduct,", "router.post('/products', async");
verifyPatchTarget('server/src/routes/admin.ts', "router.put('/products/:id', validateCatalogProduct,", "router.put('/products/:id', async");
verifyPatchTarget('server/src/routes/sellRequests.ts', 'requireAuth, verifySellQuote, async', "router.post('/', authenticateToken, requireAuth, async");
function pathInRoot(rel) { return path.join(root, ...rel.split('/')); }
function copy(relative, sourceRelative=relative) {
  const original = pathInRoot(relative);
  const replacement = path.join(bundle, ...sourceRelative.split('/'));
  if (!fs.existsSync(replacement)) throw Error(`Missing upgrade file: ${relative}`);
  if (fs.existsSync(original)) {
    const backupPath = path.join(backup, ...relative.split('/'));
    fs.mkdirSync(path.dirname(backupPath), {recursive:true});
    fs.copyFileSync(original,backupPath);
  }
  fs.mkdirSync(path.dirname(original), {recursive:true});
  fs.copyFileSync(replacement, original);
  changes.push(relative);
}
function replaceWithin(relative, operation) {
  const file = pathInRoot(relative);
  if (!fs.existsSync(file)) { console.warn(`SKIP: ${relative} missing`); return; }
  const old = fs.readFileSync(file, 'utf8');
  const next = operation(old);
  if (next === old) { console.log(`Unchanged/skipped: ${relative}`); return; }
  const b = path.join(backup, ...relative.split('/'));
  fs.mkdirSync(path.dirname(b),{recursive:true});
  fs.copyFileSync(file,b);
  fs.writeFileSync(file,next);
  changes.push(relative);
}
const adminDir='client/src/pages/admin';
for(const file of fs.readdirSync(path.join(bundle,adminDir))) {
  if (file === 'AdminTeamModeration.tsx') continue; // team system paused
  if (file.endsWith('.tsx') || file === 'admin-theme.css') copy(`${adminDir}/${file}`);
}
copy('server/src/middleware/validateCatalogProduct.ts');
copy('server/src/middleware/verifySellQuote.ts');
replaceWithin('server/src/routes/admin.ts', source=>{
  let content=source;
  if (!content.includes("import { validateCatalogProduct } from '../middleware/validateCatalogProduct';")) {
    content = "import { validateCatalogProduct } from '../middleware/validateCatalogProduct';\n"+content;
  }
  if (!content.includes("router.post('/products', validateCatalogProduct,")) {
    content=content.replace("router.post('/products', async", "router.post('/products', validateCatalogProduct, async");
  }
  if (!content.includes("router.put('/products/:id', validateCatalogProduct,")) {
    content=content.replace("router.put('/products/:id', async", "router.put('/products/:id', validateCatalogProduct, async");
  }
  if (!content.includes("router.post('/products', validateCatalogProduct,") || !content.includes("router.put('/products/:id', validateCatalogProduct,")) {
    throw Error('Your admin.ts product route pattern differs; no safe patch available. See INSTALL.md.');
  }
  return content;
});
replaceWithin('server/src/routes/sellRequests.ts', source=>{
  let content=source;
  if (!content.includes("import { verifySellQuote } from '../middleware/verifySellQuote';")) {
    content="import { verifySellQuote } from '../middleware/verifySellQuote';\n"+content;
  }
  if (!content.includes("requireAuth, verifySellQuote, async")) {
    content=content.replace("router.post('/', authenticateToken, requireAuth, async", "router.post('/', authenticateToken, requireAuth, verifySellQuote, async");
  }
  if (!content.includes("requireAuth, verifySellQuote, async")) {
    throw Error('Your sellRequests.ts route pattern differs. Check INSTALL.md before merging.');
  }
  return content;
});

// Preserve all existing app routes; modify only admin/non-admin page chrome.
replaceWithin('client/src/App.tsx', source => {
  if (source.includes('isAdminRoute') || source.includes('hideStudentChrome')) return source;
  if (!source.includes('const AppRoutes: React.FC = () => {') ||
      !source.includes('<Navbar />') || !source.includes('<Footer />')) {
    console.warn('App.tsx structure differs; follow the small manual App snippet in INSTALL.md.');
    return source;
  }
  let content=source.replace(/import\s*\{([^}]*)\}\s*from\s*['"]react-router-dom['"];?/, (match, imports) => {
    if (imports.includes('useLocation')) return match;
    return match.replace(imports, imports.trimEnd() + ', useLocation ');
  });
  if (!content.includes('useLocation')) { console.warn('Could not safely import useLocation; App.tsx unchanged');return source; }
  content=content.replace('const AppRoutes: React.FC = () => {',
    "const AppRoutes: React.FC = () => {\n  const adminRoutePathname = useLocation().pathname;\n  const hideStudentChrome = adminRoutePathname === '/admin' || adminRoutePathname.startsWith('/admin/');");
  content=content.replace('<Navbar />', '{!hideStudentChrome && <Navbar />}');
  content=content.replace('<Footer />', '{!hideStudentChrome && <Footer />}');
  content=content.replace('className="flex-grow pb-20 md:pb-0"',
    'className={hideStudentChrome ? "flex-grow" : "flex-grow pb-20 md:pb-0"}');
  return content;
});

// Avoid overwriting newer product-route bugfixes. Only install the stock
// availability correction if the local file exactly matches our old snapshot.
const crypto=require('node:crypto');
const productRoute='server/src/routes/products.ts';
const productFile=pathInRoot(productRoute);
if (fs.existsSync(productFile)) {
  const before=fs.readFileSync(productFile);
  const hash=crypto.createHash('sha256').update(before).digest('hex');
  if(hash==='ac076e5aee82295ee161e92a1518725eaddd3828a2f19e4de4467c858625a6e8') {
    copy(productRoute, 'reference-server/products.ts');
    console.log('Applied inventory-availability fix to matching snapshot.');
  } else {
    console.warn('Your products.ts differs from the snapshot; kept it intact. Review supplied products.ts to merge stock availability safely.');
  }
}
console.log(`\nModified ${changes.length} files:`);
changes.forEach(x=>console.log(`  ${x}`));
console.log(`Backup folder: ${backup}`);
console.log('Reminder: App.tsx admin chrome and available inventory require manual changes in INSTALL.md.');
