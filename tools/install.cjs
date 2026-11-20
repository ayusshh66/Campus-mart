#!/usr/bin/env node
/* Safe, additive CampusMart Hero Operations installer.
   Usage (from CampusMart project root):
   node .\\CampusMart_Hero_Operations_Integration\\tools\\install.cjs
*/
const fs = require('fs');
const path = require('path');
const base = path.resolve(__dirname, '..');
const root = path.resolve(base, '..');
const read = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(p);
const target = p => path.join(root, p);
function assert(condition, message) { if (!condition) throw new Error(message); }
const appFile = target('client/src/App.tsx');
const indexFile = target('server/src/index.ts');
const schemaFile = target('database/schema.prisma');
for (const f of [appFile,indexFile,schemaFile]) assert(exists(f), `Missing ${f}; extract the folder inside the real CampusMart project root.`);

function addSchemaField(source, model, line, match) {
  const reg = new RegExp(`(model\\s+${model}\\s*\\{)([\\s\\S]*?)(\\n\\})`);
  const m = source.match(reg);
  assert(m, `Missing model ${model} in schema.prisma`);
  if (m[2].includes(match)) return source;
  return source.replace(reg, (_full,start,body,end)=>`${start}${body}\n  ${line}${end}`);
}
let schema=read(schemaFile);
const modelDefinitions=read(path.join(base,'database/HERO_OPS_SCHEMA_ADDITIONS.prisma.txt'));
if (!schema.includes('model HeroManagerAssignment {')) schema += '\n\n' + modelDefinitions.slice(modelDefinitions.indexOf('model HeroManagerAssignment {')) + '\n';
for (const [model,line,key] of [
 ['College','hero_manager_assignments HeroManagerAssignment[]','hero_manager_assignments'],
 ['College','hero_announcements HeroAnnouncement[]','hero_announcements'],
 ['User','hero_manager_assignments HeroManagerAssignment[]','hero_manager_assignments'],
 ['User','hero_availability HeroAvailability?','hero_availability'],
 ['User','hero_task_events HeroTaskEvent[]','hero_task_events'],
 ['User','hero_task_issues HeroTaskIssue[] @relation("HeroIssueReporter")','hero_task_issues'],
 ['User','hero_task_proofs HeroTaskProof[] @relation("HeroProofUploader")','hero_task_proofs'],
 ['User','hero_announcements HeroAnnouncement[] @relation("HeroAnnouncementAuthor")','hero_announcements'],
 ['DeliveryTask','due_at DateTime?','due_at '],
 ['DeliveryTask','hero_task_events HeroTaskEvent[]','hero_task_events'],
 ['DeliveryTask','hero_task_issues HeroTaskIssue[]','hero_task_issues'],
 ['DeliveryTask','hero_task_proofs HeroTaskProof[]','hero_task_proofs'],
]) schema=addSchemaField(schema,model,line,key);

let server=read(indexFile);
if (!server.includes("from './routes/heroOps'")) server = "import heroOpsRoutes from './routes/heroOps';\n" + server;
if (!server.includes("app.use('/api/hero-ops'")) {
  const marker="app.use('/api/hero', heroRoutes);";
  assert(server.includes(marker),'Could not locate hero router mount in server/src/index.ts. Not changing files; integrate manually.');
  server=server.replace(marker,marker+"\napp.use('/api/hero-ops', heroOpsRoutes);");
}
let app=read(appFile);
assert(app.includes('<Routes>'),'Could not locate React Router routes in App.tsx. Not changing files.');
assert(app.includes('ProtectedRoute'),'No ProtectedRoute in App.tsx. Add a login guard and integrate manually.');
// Keep the old hero source file as a rollback option; route the old URLs to the new screen.
if (app.includes("import { CampusHeroDashboardPage } from './pages/CampusHeroDashboardPage';")) {
  app=app.replace("import { CampusHeroDashboardPage } from './pages/CampusHeroDashboardPage';", "import { HeroOperationsCenter } from './pages/HeroOperationsCenter';\nimport { HeroManagerDashboardPage } from './pages/HeroManagerDashboardPage';");
} else {
  if (!app.includes("from './pages/HeroOperationsCenter'")) app="import { HeroOperationsCenter } from './pages/HeroOperationsCenter';\n"+app;
  if (!app.includes("from './pages/HeroManagerDashboardPage'")) app="import { HeroManagerDashboardPage } from './pages/HeroManagerDashboardPage';\n"+app;
}
app=app.replace(/<CampusHeroDashboardPage\s*\/>/g,'<HeroOperationsCenter />');
if (!app.includes('path="/hero-operations"')) app=app.replace('<Routes>', '<Routes>\n          <Route path="/hero-operations" element={<ProtectedRoute><HeroOperationsCenter /></ProtectedRoute>} />');
if (!app.includes('path="/hero-manager"')) app=app.replace('<Routes>', '<Routes>\n          <Route path="/hero-manager" element={<ProtectedRoute><HeroManagerDashboardPage /></ProtectedRoute>} />');
// Existing global navbar/footer: avoid rendering student chrome on the new full-screen operations consoles.
if (app.includes('const AppRoutes: React.FC = () => {') && !app.includes('const isHeroOpsScreen =')) {
  if (!app.includes('useLocation')) {
    app=app.replace(/(import\s*\{)([^}]*)(\}\s*from\s*['"]react-router-dom['"])/,(_all,left,inner,right)=>`${left}${inner.trimEnd()}, useLocation ${right}`);
  }
  app=app.replace('const AppRoutes: React.FC = () => {','const AppRoutes: React.FC = () => {\n  const { pathname } = useLocation();\n  const isHeroOpsScreen = ["/hero-operations", "/hero-manager", "/hero-dashboard", "/hero/dashboard", "/campus-hero-dashboard"].includes(pathname);');
  // Handle both bare Navbar/Footer and the newer admin-conditional variants.
  for(const name of ['Navbar','Footer']) {
    const conditional = new RegExp('\\{\\s*(!isAdminRoute)\\s*&&\\s*<'+name+'\\s*/>\\s*\\}');
    if(conditional.test(app)) app=app.replace(conditional, `{!isAdminRoute && !isHeroOpsScreen && <${name} />}`);
    else app=app.replace(`<${name} />`, `{!isHeroOpsScreen && <${name} />}`);
  }
  app=app.replace('className="flex-grow pb-20 md:pb-0"','className={isHeroOpsScreen ? "flex-grow" : "flex-grow pb-20 md:pb-0"}');
}
// Preflight passed: now back up all touched files, then copy new files and write modifications.
const backupDir=path.join(base,'backups',new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(backupDir,{recursive:true});
for(const rel of ['client/src/App.tsx','server/src/index.ts','database/schema.prisma']){
  const dest=path.join(backupDir,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(target(rel),dest);
}
for(const rel of [
  'server/src/routes/heroOps.ts','client/src/services/heroOps.ts',
  'client/src/components/hero-ops/HeroOpsUI.tsx',
  'client/src/pages/HeroOperationsCenter.tsx','client/src/pages/HeroManagerDashboardPage.tsx'
]){
  const source=path.join(base,rel), destination=target(rel);
  assert(exists(source),'Missing integration file: '+source);
  if(exists(destination)){
    const backup=path.join(backupDir,rel);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(destination,backup);
  }
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source,destination);
  console.log('Installed: '+rel);
}
fs.writeFileSync(schemaFile,schema);fs.writeFileSync(indexFile,server);fs.writeFileSync(appFile,app);
console.log('Updated: database/schema.prisma');console.log('Updated: server/src/index.ts');console.log('Updated: client/src/App.tsx');
console.log('Backups saved to:',backupDir);
console.log('\nNEXT: Stop backend, check DATABASE_URL, then validate/generate/apply Prisma changes (see INSTALL.md).');
