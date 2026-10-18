import prisma from './db';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { app } from './index';
import http from 'http';

async function runAdminDashboardTestSuite() {
  console.log('🧪 Starting CampusMart Admin Dashboard Security & Operations Test Suite...\n');

  let server: any = undefined;
  const testPort = 5097;

  await new Promise<void>((resolve) => {
    server = app.listen(testPort, () => {
      resolve();
    });
  });

  const baseUrl = `http://localhost:${testPort}/api`;
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

  async function apiCall(path: string, options: RequestInit = {}, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  }

  try {
    // 1. Setup colleges & test accounts
    const colleges = await prisma.college.findMany();
    assert(colleges.length >= 1, 'Colleges exist in database');
    const testCollege = colleges[0];

    // Admin user
    let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'superadmin_test@campusmart.in',
          phone: '9999999999',
          password_hash: 'hashedpassword',
          college_id: testCollege.id,
          role: 'ADMIN',
        },
      });
    }

    // Regular student user
    let studentUser = await prisma.user.findFirst({ where: { role: 'USER' } });
    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          name: 'Normal Student',
          email: 'normal_student_test@college.edu',
          phone: '9888888888',
          password_hash: 'hashedpassword',
          college_id: testCollege.id,
          role: 'USER',
        },
      });
    }

    // Campus Hero user
    let heroUser = await prisma.user.findFirst({ where: { role: 'CAMPUS_HERO' } });
    if (!heroUser) {
      heroUser = await prisma.user.create({
        data: {
          name: 'Hero Volunteer',
          email: 'hero_volunteer_test@college.edu',
          phone: '9777777777',
          password_hash: 'hashedpassword',
          college_id: testCollege.id,
          role: 'CAMPUS_HERO',
        },
      });
    }

    const adminToken = jwt.sign({ id: adminUser.id }, config.jwtSecret, { expiresIn: '1h' });
    const studentToken = jwt.sign({ id: studentUser.id }, config.jwtSecret, { expiresIn: '1h' });
    const heroToken = jwt.sign({ id: heroUser.id }, config.jwtSecret, { expiresIn: '1h' });

    console.log('--- 1. ADMIN AUTHORIZATION & ROUTE GUARDS ---');
    // Test unauthenticated access to multiple admin endpoints
    const unauthStats = await apiCall('/admin/stats');
    assert(unauthStats.status === 401, 'Unauthenticated GET /admin/stats blocked with 401');

    const unauthUsers = await apiCall('/admin/users');
    assert(unauthUsers.status === 401, 'Unauthenticated GET /admin/users blocked with 401');

    const unauthAnalytics = await apiCall('/admin/analytics');
    assert(unauthAnalytics.status === 401, 'Unauthenticated GET /admin/analytics blocked with 401');

    const unauthColleges = await apiCall('/admin/colleges', { method: 'POST', body: JSON.stringify({ code: 'FAIL', name: 'Fail' }) });
    assert(unauthColleges.status === 401, 'Unauthenticated POST /admin/colleges blocked with 401');

    // Test non-admin student access
    const studentStats = await apiCall('/admin/stats', {}, studentToken);
    assert(studentStats.status === 403, 'Regular student GET /admin/stats blocked with 403');

    const studentUsers = await apiCall('/admin/users', {}, studentToken);
    assert(studentUsers.status === 403, 'Regular student GET /admin/users blocked with 403');

    // Test campus hero trying to access admin dashboard
    const heroStats = await apiCall('/admin/stats', {}, heroToken);
    assert(heroStats.status === 403, 'Campus Hero accessing /admin/stats blocked with 403');

    // Test admin access
    const adminStatsRes = await apiCall('/admin/stats', {}, adminToken);
    assert(adminStatsRes.status === 200 && adminStatsRes.data?.success === true, 'Admin GET /admin/stats succeeds with 200');
    assert(typeof adminStatsRes.data?.data?.totalStudents === 'number', 'Admin stats returns real numeric counts');

    console.log('\n--- 2. REAL-DATA ANALYTICS ENDPOINT ---');
    const analyticsRes = await apiCall('/admin/analytics', {}, adminToken);
    assert(analyticsRes.status === 200 && analyticsRes.data?.success === true, 'Admin GET /admin/analytics returns 200');
    assert(analyticsRes.data?.data?.summary !== undefined, 'Analytics includes summary counts');
    assert(analyticsRes.data?.data?.financials !== undefined, 'Analytics includes computed financials');
    assert(typeof analyticsRes.data?.data?.financials?.totalEstimatedVolume === 'number', 'Financials contains totalEstimatedVolume');
    assert(Array.isArray(analyticsRes.data?.data?.categoryBreakdown), 'Analytics contains category breakdown');
    assert(Array.isArray(analyticsRes.data?.data?.collegeBreakdown), 'Analytics contains college breakdown');

    console.log('\n--- 3. USER MANAGEMENT & ROLE ASSIGNMENT ---');
    const usersListRes = await apiCall('/admin/users', {}, adminToken);
    assert(usersListRes.status === 200 && Array.isArray(usersListRes.data?.data), 'Admin GET /admin/users returns list of users');
    assert(usersListRes.data?.data?.length > 0, 'Users directory contains registered users');
    const sampleUser = usersListRes.data?.data[0];
    assert(sampleUser.college !== undefined, 'User object includes college relation');
    assert(sampleUser._count !== undefined, 'User object includes activity counters');

    // Filter by role
    const studentUsersFilter = await apiCall('/admin/users?role=USER', {}, adminToken);
    assert(studentUsersFilter.status === 200 && studentUsersFilter.data?.data.every((u: any) => u.role === 'USER'), 'GET /admin/users?role=USER properly filters users');

    // Search filter
    const searchRes = await apiCall(`/admin/users?search=${encodeURIComponent(studentUser.name.slice(0, 4))}`, {}, adminToken);
    assert(searchRes.status === 200 && searchRes.data?.data.length >= 1, 'GET /admin/users?search=... finds matching user');

    // Update role validation
    const invalidRoleRes = await apiCall(`/admin/users/${studentUser.id}/role`, { method: 'PUT', body: JSON.stringify({ role: 'SUPER_HERO' }) }, adminToken);
    assert(invalidRoleRes.status === 400, 'Invalid role rejected with 400');

    // Valid role promotion to CAMPUS_HERO
    const promoteRes = await apiCall(`/admin/users/${studentUser.id}/role`, { method: 'PUT', body: JSON.stringify({ role: 'CAMPUS_HERO' }) }, adminToken);
    assert(promoteRes.status === 200 && promoteRes.data?.data?.role === 'CAMPUS_HERO', 'Promoting user to CAMPUS_HERO succeeds');

    // Demote back to USER
    const demoteRes = await apiCall(`/admin/users/${studentUser.id}/role`, { method: 'PUT', body: JSON.stringify({ role: 'USER' }) }, adminToken);
    assert(demoteRes.status === 200 && demoteRes.data?.data?.role === 'USER', 'Demoting user back to USER succeeds');

    console.log('\n--- 4. CUSTOM ITEM SUBMISSIONS APPROVAL & REJECTION (PUBLICATION INTEGRITY) ---');
    // Create two custom item submissions for testing
    const customSub1 = await prisma.customItemSubmission.create({
      data: {
        user_id: studentUser.id,
        college_id: testCollege.id,
        name: 'Scientific Lab Multimeter',
        category: 'Lab Equipment',
        condition: 'Like New',
        description: 'Fluke digital multimeter with test leads',
        expected_price: 1200,
        images: JSON.stringify(['https://example.com/meter.jpg']),
        status: 'PENDING',
      },
    });

    const customSub2 = await prisma.customItemSubmission.create({
      data: {
        user_id: studentUser.id,
        college_id: testCollege.id,
        name: 'Unapproved Prohibited Gear',
        category: 'Forbidden',
        condition: 'Poor',
        description: 'Item not allowed',
        expected_price: 50,
        images: JSON.stringify(['https://example.com/bad.jpg']),
        status: 'PENDING',
      },
    });

    // TEST REJECTION: Must NOT create Product or SellRequest
    const initialProductCount = await prisma.product.count();
    const initialSellCount = await prisma.sellRequest.count();

    const rejectRes = await apiCall(
      `/admin/custom-submissions/${customSub2.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'REJECT',
          rejection_reason: 'Item is on the prohibited platform list.',
        }),
      },
      adminToken
    );

    assert(rejectRes.status === 200 && rejectRes.data?.success === true, 'Rejecting custom item returns 200');

    const updatedSub2 = await prisma.customItemSubmission.findUnique({ where: { id: customSub2.id } });
    assert(updatedSub2?.status === 'REJECTED', 'Custom submission status updated to REJECTED');
    assert(updatedSub2?.rejection_reason === 'Item is on the prohibited platform list.', 'Rejection reason persisted');

    const productCountAfterReject = await prisma.product.count();
    const sellCountAfterReject = await prisma.sellRequest.count();
    assert(productCountAfterReject === initialProductCount, 'CRITICAL: Rejecting custom submission did NOT create catalog Product');
    assert(sellCountAfterReject === initialSellCount, 'CRITICAL: Rejecting custom submission did NOT create SellRequest');

    // TEST APPROVAL: Atomically creates Product, creates approved SellRequest, updates submission
    const approveRes = await apiCall(
      `/admin/custom-submissions/${customSub1.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          action: 'APPROVE',
          admin_buy_price: 1100,
          admin_sell_price: 1450,
        }),
      },
      adminToken
    );

    assert(approveRes.status === 200 && approveRes.data?.success === true, 'Approving custom submission returns 200');

    const updatedSub1 = await prisma.customItemSubmission.findUnique({ where: { id: customSub1.id } });
    assert(updatedSub1?.status === 'APPROVED', 'Custom submission status updated to APPROVED');
    assert(updatedSub1?.created_product_id !== null, 'Submission references created product ID');
    assert(updatedSub1?.created_sell_request_id !== null, 'Submission references created sell request ID');

    // Verify created Product
    const createdProduct = await prisma.product.findUnique({ where: { id: updatedSub1!.created_product_id! } });
    assert(createdProduct !== null && createdProduct.name === 'Scientific Lab Multimeter', 'Created product exists in catalog');
    assert(createdProduct?.sell_price === 1450, 'Created product has correct catalog sell price');

    // Verify created SellRequest
    const createdSellReq = await prisma.sellRequest.findUnique({ where: { id: updatedSub1!.created_sell_request_id! } });
    assert(createdSellReq !== null && createdSellReq.status === 'APPROVED', 'Created sell request exists and is marked APPROVED');
    assert(createdSellReq?.college_id === testCollege.id, 'Created sell request is locked to student college campus');
    assert(createdSellReq?.admin_buy_price === 1100, 'Created sell request payout price matches approved valuation');

    // Prevent duplicate approval/re-processing
    const duplicateApprove = await apiCall(
      `/admin/custom-submissions/${customSub1.id}`,
      { method: 'PUT', body: JSON.stringify({ action: 'APPROVE', admin_buy_price: 1000, admin_sell_price: 1200 }) },
      adminToken
    );
    assert(duplicateApprove.status === 400, 'Re-approving an already processed submission rejected with 400');

    console.log('\n--- 5. DYNAMIC COLLEGE MANAGEMENT ---');
    const uniqueCode = `TST${Date.now().toString().slice(-4)}`;
    const createCollegeRes = await apiCall(
      '/admin/colleges',
      {
        method: 'POST',
        body: JSON.stringify({
          code: uniqueCode,
          name: `Test University Branch ${uniqueCode}`,
          is_active: true,
        }),
      },
      adminToken
    );
    assert(createCollegeRes.status === 201 && createCollegeRes.data?.success === true, 'Admin POST /admin/colleges creates new college');
    const createdCol = createCollegeRes.data?.data;

    // Toggle active status
    const toggleRes = await apiCall(`/admin/colleges/${createdCol.id}/toggle-status`, { method: 'PATCH' }, adminToken);
    assert(toggleRes.status === 200 && toggleRes.data?.data?.is_active === false, 'Toggling college status sets is_active to false');

    const toggleBackRes = await apiCall(`/admin/colleges/${createdCol.id}/toggle-status`, { method: 'PATCH' }, adminToken);
    assert(toggleBackRes.status === 200 && toggleBackRes.data?.data?.is_active === true, 'Toggling college status back sets is_active to true');

    console.log('\n--- 6. CAMPUS HERO APPLICATION WORKFLOW ---');
    // Create test hero application
    const heroApp = await prisma.campusHeroApplication.create({
      data: {
        user_id: studentUser.id,
        college_id: testCollege.id,
        branch: 'Computer Science',
        year: '3rd Year',
        phone: '9888888888',
        reason: 'Excited to coordinate campus recommerce',
        status: 'PENDING',
      },
    });

    const approveHeroRes = await apiCall(
      `/admin/campus-heroes/${heroApp.id}`,
      { method: 'PUT', body: JSON.stringify({ status: 'APPROVED' }) },
      adminToken
    );
    assert(approveHeroRes.status === 200 && approveHeroRes.data?.success === true, 'Approving Campus Hero application returns 200');

    const updatedStudentAfterHero = await prisma.user.findUnique({ where: { id: studentUser.id } });
    assert(updatedStudentAfterHero?.role === 'CAMPUS_HERO', 'Approving Campus Hero automatically upgrades user.role to CAMPUS_HERO');

    console.log('\n--- 7. CATALOG PRODUCT CREATION & MULTIPLE IMAGES ---');
    const createProdRes = await apiCall(
      '/admin/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name: `Admin Showcase Item ${Date.now()}`,
          category: 'Electronics',
          description: 'High quality electronics for students',
          image_url: 'https://example.com/primary.jpg',
          images: ['https://example.com/primary.jpg', 'https://example.com/photo2.jpg', 'https://example.com/photo3.jpg'],
          buy_price: 350,
          sell_price: 499,
          is_buying_enabled: true,
          is_active: true,
        }),
      },
      adminToken
    );
    assert(createProdRes.status === 201 && createProdRes.data?.success === true, 'Creating product with multiple images succeeds');
    const createdProdData = createProdRes.data?.data;
    const parsedImages = JSON.parse(createdProdData.images || '[]');
    assert(parsedImages.length === 3, 'Multiple images stored and retrieved properly');

    console.log('\n--- 8. AUTO-MATCHING ENDPOINTS ---');
    const autoRulesRes = await apiCall('/admin/auto-match/rules', {}, adminToken);
    assert(autoRulesRes.status === 200 && Array.isArray(autoRulesRes.data?.data), 'GET /admin/auto-match/rules returns product auto-match rules');

    const runAutoRes = await apiCall('/admin/auto-match/run', { method: 'POST' }, adminToken);
    assert(runAutoRes.status === 200 && runAutoRes.data?.success === true, 'POST /admin/auto-match/run triggers auto match cycle');

  } catch (err: any) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdminDashboardTestSuite();
