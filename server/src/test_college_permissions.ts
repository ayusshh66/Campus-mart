import prisma from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';

async function runTests() {
  console.log('🧪 Starting Permissions & Dynamic College Management Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Verify Seeded Colleges are intact
  const seededColleges = await prisma.college.findMany({
    where: { code: { in: ['BPIT', 'MAIT', 'MSIT', 'USAR'] } },
  });
  assert(seededColleges.length === 4, 'Seeded colleges intact', `Found ${seededColleges.length}/4 colleges`);

  const bpit = seededColleges.find((c) => c.code === 'BPIT')!;
  const mait = seededColleges.find((c) => c.code === 'MAIT')!;

  // 2. Setup Tokens for Admin and Non-Admin (Rahul)
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@campusmart.in' } });
  const rahulUser = await prisma.user.findUnique({ where: { email: 'rahul@bpit.ac.in' } });

  assert(Boolean(adminUser && adminUser.role === 'ADMIN'), 'Admin user exists with ADMIN role');
  assert(Boolean(rahulUser && rahulUser.role === 'USER'), 'Rahul user exists with USER role');

  const adminToken = jwt.sign(
    { id: adminUser!.id, email: adminUser!.email, role: adminUser!.role, college_id: adminUser!.college_id },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const rahulToken = jwt.sign(
    { id: rahulUser!.id, email: rahulUser!.email, role: rahulUser!.role, college_id: rahulUser!.college_id },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const baseUrl = `http://localhost:${config.port}/api`;

  // Helper fetch
  async function apiCall(path: string, options: RequestInit = {}, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  }

  // 3. Test Non-Admin (Rahul) access to admin endpoints
  console.log('\n--- Testing Role Permissions (Non-Admin Restrictions) ---');
  const getCollegesAsStudent = await apiCall('/admin/colleges', { method: 'GET' }, rahulToken);
  assert(getCollegesAsStudent.status === 403, 'Non-admin GET /api/admin/colleges returns 403 Forbidden');

  const createCollegeAsStudent = await apiCall(
    '/admin/colleges',
    { method: 'POST', body: JSON.stringify({ code: 'FAKE', name: 'Fake College' }) },
    rahulToken
  );
  assert(createCollegeAsStudent.status === 403, 'Non-admin POST /api/admin/colleges returns 403 Forbidden');

  const updateCollegeAsStudent = await apiCall(
    `/admin/colleges/${bpit.id}`,
    { method: 'PUT', body: JSON.stringify({ name: 'Hacked Name' }) },
    rahulToken
  );
  assert(updateCollegeAsStudent.status === 403, 'Non-admin PUT /api/admin/colleges/:id returns 403 Forbidden');

  const toggleCollegeAsStudent = await apiCall(
    `/admin/colleges/${bpit.id}/toggle-status`,
    { method: 'PATCH' },
    rahulToken
  );
  assert(toggleCollegeAsStudent.status === 403, 'Non-admin PATCH /api/admin/colleges/:id/toggle-status returns 403 Forbidden');

  // 4. Test Admin access to College Endpoints
  console.log('\n--- Testing Admin College Management ---');
  const getCollegesAsAdmin = await apiCall('/admin/colleges', { method: 'GET' }, adminToken);
  assert(getCollegesAsAdmin.status === 200, 'Admin GET /api/admin/colleges returns 200 OK');
  assert(Array.isArray(getCollegesAsAdmin.data.data), 'Returns list of colleges with count data');

  // Duplicate code validation
  const duplicateCreate = await apiCall(
    '/admin/colleges',
    { method: 'POST', body: JSON.stringify({ code: 'bpit', name: 'Duplicate BPIT' }) },
    adminToken
  );
  assert(duplicateCreate.status === 400, 'Admin creating duplicate college code returns 400 Bad Request', duplicateCreate.data.message);

  // Missing fields validation
  const missingCode = await apiCall(
    '/admin/colleges',
    { method: 'POST', body: JSON.stringify({ code: '', name: 'Missing Code' }) },
    adminToken
  );
  assert(missingCode.status === 400, 'Admin creating college without code returns 400 Bad Request');

  // Create new college: DTU
  // Clean up if existing from previous run
  await prisma.college.deleteMany({ where: { code: 'DTU' } });

  const createDTU = await apiCall(
    '/admin/colleges',
    { method: 'POST', body: JSON.stringify({ code: 'DTU', name: 'Delhi Technological University', is_active: true }) },
    adminToken
  );
  assert(createDTU.status === 201, 'Admin creating valid college (DTU) returns 201 Created');
  const dtuId = createDTU.data.data?.id;

  // 5. Verify Newly Added College appears in Public GET /api/colleges (Student Registration source)
  console.log('\n--- Testing Dynamic Appearance in Public API & Registration ---');
  const publicColleges = await apiCall('/colleges', { method: 'GET' });
  const hasDTUInPublic = publicColleges.data.data?.some((c: any) => c.code === 'DTU');
  assert(hasDTUInPublic, 'Newly created DTU appears dynamically in public GET /api/colleges');

  // 6. Test Deactivating College
  console.log('\n--- Testing Deactivation & Inactive Handling ---');
  const deactivateDTU = await apiCall(`/admin/colleges/${dtuId}/toggle-status`, { method: 'PATCH' }, adminToken);
  assert(deactivateDTU.status === 200 && deactivateDTU.data.data.is_active === false, 'Admin toggle status deactivates DTU');

  // Public /colleges should no longer return deactivated college
  const publicCollegesAfterDeactivate = await apiCall('/colleges', { method: 'GET' });
  const hasDTUAfterDeactivate = publicCollegesAfterDeactivate.data.data?.some((c: any) => c.code === 'DTU');
  assert(!hasDTUAfterDeactivate, 'Deactivated DTU is filtered out from public /api/colleges');

  // Registration attempt with deactivated college
  const regDeactivated = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Inactive',
      email: 'test_inactive@dtu.ac.in',
      phone: '9999999999',
      password: 'password123',
      college_id: dtuId,
    }),
  });
  assert(regDeactivated.status === 400, 'Student registration rejected for deactivated college');

  // Re-activate DTU
  const reactivateDTU = await apiCall(`/admin/colleges/${dtuId}/toggle-status`, { method: 'PATCH' }, adminToken);
  assert(reactivateDTU.status === 200 && reactivateDTU.data.data.is_active === true, 'Re-activated DTU successfully');

  // 7. Test Cross-Campus Product Browsing
  console.log('\n--- Testing Cross-Campus Product Browsing & College Immutability ---');
  // Rahul (BPIT) browses BPIT listings
  const bpitProducts = await apiCall(`/products?college_id=${bpit.id}`, { method: 'GET' }, rahulToken);
  const casioAtBPIT = bpitProducts.data.data?.find((p: any) => p.name.includes('Casio'));
  assert(Boolean(casioAtBPIT?.is_available), 'Casio calculator is marked available at BPIT');

  // Rahul (BPIT) browses MAIT listings
  const maitProducts = await apiCall(`/products?college_id=${mait.id}`, { method: 'GET' }, rahulToken);
  const casioAtMAIT = maitProducts.data.data?.find((p: any) => p.name.includes('Casio'));
  assert(!casioAtMAIT?.is_available, 'Casio calculator is marked unavailable when browsing MAIT');
  const keyboardAtMAIT = maitProducts.data.data?.find((p: any) => p.name.includes('Keyboard'));
  assert(Boolean(keyboardAtMAIT?.is_available), 'Mechanical keyboard is marked available when browsing MAIT');

  // 8. Test Immutability of User's College ID
  const rahulProfile = await apiCall('/auth/me', { method: 'GET' }, rahulToken);
  assert(rahulProfile.data.data?.college.code === 'BPIT', "Rahul's registered college remains strictly BPIT (immutable)");

  // Clean up DTU
  await prisma.college.delete({ where: { id: dtuId } });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
