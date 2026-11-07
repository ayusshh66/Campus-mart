/**
 * CampusMart Solo Invitation installer.
 * Run from your campus-mart repository root:
 *   node CampusMart_InviteToTeam_Working/install.cjs
 * Creates backups. Does NOT touch live data or run Prisma commands.
 */
const fs = require('fs');
const path = require('path');
const pkg = __dirname;
let root = process.cwd();
if (path.basename(root).toLowerCase() === 'server') root = path.dirname(root);
const exists = (p) => fs.existsSync(path.join(root,p));
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const needed = [
  'database/schema.prisma', 'database/schema.postgresql.prisma',
  'server/src/index.ts', 'client/src/pages/SoloPostsPage.tsx',
  'client/src/services/soloApi.ts',
];
const missing = needed.filter((p) => !exists(p));
if (missing.length) {
  console.error('ERROR: Run from your CampusMart repository root (or server folder). Missing:\n' + missing.join('\n'));
  process.exit(1);
}

const modelSrc = fs.readFileSync(path.join(pkg,'database/solo-invitation.prisma.txt'),'utf8');
const model = modelSrc.slice(modelSrc.indexOf('model SoloInvitation {')).trim();
function addField(schema, modelName, field) {
  const re = new RegExp('(^model\\s+' + modelName + '\\s*\\{)([\\s\\S]*?)(^\\})','m');
  const m = schema.match(re);
  if (!m) throw new Error('Prisma model ' + modelName + ' not found; no changes written.');
  const name = field.trim().split(/\s+/)[0];
  if (new RegExp('^\\s*'+name+'\\s+', 'm').test(m[2])) return schema;
  return schema.replace(re, (_all, opening, inside, closing) => opening + inside + '  ' + field + '\n' + closing);
}
function patchSchema(schema) {
  if (!/^model\s+SoloPost\s*\{/m.test(schema)) throw new Error('SoloPost missing from schema. Install Solo Recruitment MVP first.');
  schema = addField(schema,'User','solo_invitations_sent     SoloInvitation[] @relation("SoloInvitesSent")');
  schema = addField(schema,'User','solo_invitations_received SoloInvitation[] @relation("SoloInvitesReceived")');
  schema = addField(schema,'TeamPost','solo_invitations SoloInvitation[]');
  schema = addField(schema,'SoloPost','invitations SoloInvitation[]');
  if (!/^model\s+SoloInvitation\s*\{/m.test(schema)) schema = schema.trimEnd() + '\n\n' + model + '\n';
  return schema;
}
function patchServer(entry) {
  if (!entry.includes('/api/solo-posts')) throw new Error('API /api/solo-posts not registered in server/src/index.ts yet.');
  if (!entry.includes("'./routes/soloInvites'")) {
    const importLine = "import soloInvitesRoutes from './routes/soloInvites';\n";
    const allImports = [...entry.matchAll(/^import .*?;\r?\n/gm)];
    if (!allImports.length) throw new Error('Could not locate import statements in server/src/index.ts');
    const last=allImports[allImports.length-1];
    const pos=last.index+last[0].length;
    entry=entry.slice(0,pos)+importLine+entry.slice(pos);
  }
  if (!entry.includes("'/api/solo-invites'")) {
    const route=/(app\.use\(['"]\/api\/solo-posts['"],\s*[^\n]+\);)/;
    if (!route.test(entry)) throw new Error('Could not locate /api/solo-posts registration.');
    entry=entry.replace(route,"$1\napp.use('/api/solo-invites', soloInvitesRoutes);");
  }
  return entry;
}

try {
  // All checks and transformations BEFORE writing anything.
  const currentPage = read('client/src/pages/SoloPostsPage.tsx');
  if (!currentPage.includes('Invite to Team (coming soon)') && !currentPage.includes('Invitations from team leaders')) {
    throw new Error('Your SoloPostsPage.tsx differs from the supplied MVP. For safety, no files changed. Use the included source and merge manually.');
  }
  const changes = new Map([
    ['database/schema.prisma', patchSchema(read('database/schema.prisma'))],
    ['database/schema.postgresql.prisma', patchSchema(read('database/schema.postgresql.prisma'))],
    ['server/src/index.ts', patchServer(read('server/src/index.ts'))],
    ['server/src/routes/soloInvites.ts', fs.readFileSync(path.join(pkg,'server/src/routes/soloInvites.ts'),'utf8')],
    ['client/src/services/soloInviteApi.ts', fs.readFileSync(path.join(pkg,'client/src/services/soloInviteApi.ts'),'utf8')],
    ['client/src/pages/SoloPostsPage.tsx', fs.readFileSync(path.join(pkg,'client/src/pages/SoloPostsPage.tsx'),'utf8')],
  ]);
  const backups = path.join(root, '.campusmart-invite-backups', new Date().toISOString().replace(/[:.]/g,'-'));
  for (const [dest, value] of changes) {
    const full = path.join(root,dest);
    if (fs.existsSync(full)) {
      const current = fs.readFileSync(full,'utf8');
      if (current === value) continue;
      const backup = path.join(backups,dest);
      fs.mkdirSync(path.dirname(backup),{recursive:true});
      fs.copyFileSync(full,backup);
    }
    fs.mkdirSync(path.dirname(full),{recursive:true});
    fs.writeFileSync(full,value,'utf8');
    console.log('Updated:',dest);
  }
  // Backup the existing local SQLite DB too, but do not modify it.
  const sqlite = path.join(root,'database/dev.db');
  if (fs.existsSync(sqlite)) {
    fs.mkdirSync(backups,{recursive:true});
    fs.copyFileSync(sqlite,path.join(backups,'dev.db'));
    console.log('SQLite backup saved.');
  }
  console.log('\nINSTALL FINISHED. Backups: '+backups);
  console.log('Next, from server/:');
  console.log('  npx prisma validate --schema=../database/schema.prisma');
  console.log('  npm run db:generate');
  console.log('  npm run db:push   (do NOT accept data-loss warnings)');
  console.log('  npm run build');
  console.log('Then from client/: npm run build');
} catch (err) {
  console.error('Install stopped: '+err.message);
  process.exit(1);
}
