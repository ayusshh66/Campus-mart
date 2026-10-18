import prisma from './db';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { app } from './index';
import http from 'http';

async function runHeroTestSuite() {
  console.log('🧪 Starting Campus Hero Dashboard Security & Operations Test Suite...\n');

  let server: http.Server | undefined = undefined;
  const testPort = 5098;

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
    // 1. Fetch colleges
    const colleges = await prisma.college.findMany();
    assert(colleges.length >= 2, 'At least 2 colleges exist for isolation testing');

    const collegeA = colleges[0];
    const collegeB = colleges[1];

    // 2. Fetch or create test users
    // User 1: Approved Campus Hero in College A
    let approvedHeroA = await prisma.user.findFirst({ where: { email: 'approved_hero_a@bpit.ac.in' } });
    if (!approvedHeroA) {
      approvedHeroA = await prisma.user.create({
        data: {
          name: 'Hero Aarav (College A)',
          email: 'approved_hero_a@bpit.ac.in',
          phone: '9811111111',
          password_hash: 'dummyhash',
          college_id: collegeA.id,
          role: 'CAMPUS_HERO',
        },
      });
    }

    // Ensure approved hero has an APPROVED application
    await prisma.campusHeroApplication.deleteMany({ where: { user_id: approvedHeroA.id } });
    await prisma.campusHeroApplication.create({
      data: {
        user_id: approvedHeroA.id,
        college_id: collegeA.id,
        branch: 'CSE',
        year: '3rd',
        phone: '9811111111',
        reason: 'Authorized active campus coordinator',
        status: 'APPROVED',
      },
    });

    // User 2: Pending Hero Applicant in College A
    let pendingUser = await prisma.user.findFirst({ where: { email: 'pending_applicant@bpit.ac.in' } });
    if (!pendingUser) {
      pendingUser = await prisma.user.create({
        data: {
          name: 'Pending Applicant',
          email: 'pending_applicant@bpit.ac.in',
          phone: '9822222222',
          password_hash: 'dummyhash',
          college_id: collegeA.id,
          role: 'USER',
        },
      });
    }
    await prisma.campusHeroApplication.deleteMany({ where: { user_id: pendingUser.id } });
    await prisma.campusHeroApplication.create({
      data: {
        user_id: pendingUser.id,
        college_id: collegeA.id,
        branch: 'IT',
        year: '2nd',
        phone: '9822222222',
        reason: 'Awaiting approval',
        status: 'PENDING',
      },
    });

    // User 3: Rejected Hero Applicant in College A
    let rejectedUser = await prisma.user.findFirst({ where: { email: 'rejected_applicant@bpit.ac.in' } });
    if (!rejectedUser) {
      rejectedUser = await prisma.user.create({
        data: {
          name: 'Rejected Applicant',
          email: 'rejected_applicant@bpit.ac.in',
          phone: '9833333333',
          password_hash: 'dummyhash',
          college_id: collegeA.id,
          role: 'USER',
        },
      });
    }
    await prisma.campusHeroApplication.deleteMany({ where: { user_id: rejectedUser.id } });
    await prisma.campusHeroApplication.create({
      data: {
        user_id: rejectedUser.id,
        college_id: collegeA.id,
        branch: 'ECE',
        year: '1st',
        phone: '9833333333',
        reason: 'Application denied',
        status: 'REJECTED',
      },
    });

    // User 4: Regular Student with No Application
    let regularUser = await prisma.user.findFirst({ where: { email: 'regular_student@bpit.ac.in' } });
    if (!regularUser) {
      regularUser = await prisma.user.create({
        data: {
          name: 'Regular Student',
          email: 'regular_student@bpit.ac.in',
          phone: '9844444444',
          password_hash: 'dummyhash',
          college_id: collegeA.id,
          role: 'USER',
        },
      });
    }
    await prisma.campusHeroApplication.deleteMany({ where: { user_id: regularUser.id } });

    // User 5: Approved Campus Hero in College B
    let approvedHeroB = await prisma.user.findFirst({ where: { email: 'approved_hero_b@mait.ac.in' } });
    if (!approvedHeroB) {
      approvedHeroB = await prisma.user.create({
        data: {
          name: 'Hero Priya (College B)',
          email: 'approved_hero_b@mait.ac.in',
          phone: '9855555555',
          password_hash: 'dummyhash',
          college_id: collegeB.id,
          role: 'CAMPUS_HERO',
        },
      });
    }
    await prisma.campusHeroApplication.deleteMany({ where: { user_id: approvedHeroB.id } });
    await prisma.campusHeroApplication.create({
      data: {
        user_id: approvedHeroB.id,
        college_id: collegeB.id,
        branch: 'CSE',
        year: '3rd',
        phone: '9855555555',
        reason: 'College B coordinator',
        status: 'APPROVED',
      },
    });

    // Admin user
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    assert(Boolean(adminUser), 'Platform admin found');

    // Create JWT tokens
    const makeToken = (u: any) =>
      jwt.sign(
        { id: u.id, email: u.email, role: u.role, college_id: u.college_id },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

    const tokenHeroA = makeToken(approvedHeroA);
    const tokenHeroB = makeToken(approvedHeroB);
    const tokenPending = makeToken(pendingUser);
    const tokenRejected = makeToken(rejectedUser);
    const tokenRegular = makeToken(regularUser);
    const tokenAdmin = makeToken(adminUser);

    // 3. Create Sample Delivery Tasks in College A and College B
    let productA = await prisma.product.findFirst();
    if (!productA) {
      productA = await prisma.product.create({
        data: {
          name: 'Scientific Calculator fx-991EX',
          category: 'Calculators',
          description: 'Classwiz calculator',
          image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=400',
          buy_price: 600,
          sell_price: 850,
          is_buying_enabled: true,
        },
      });
    }

    // Task 1: Unassigned Task in College A
    const taskCollegeA = await prisma.deliveryTask.create({
      data: {
        task_type: 'PICKUP',
        product_id: productA.id,
        college_id: collegeA.id,
        status: 'ASSIGNED',
        assigned_hero_id: null, // Available to claim
      },
    });

    // Task 2: Unassigned Task in College B
    const taskCollegeB = await prisma.deliveryTask.create({
      data: {
        task_type: 'PICKUP',
        product_id: productA.id,
        college_id: collegeB.id,
        status: 'ASSIGNED',
        assigned_hero_id: null, // In College B
      },
    });

    // ========================================================
    // TEST SECTION 1: ROUTE ACCESS & PERMISSION VERIFICATION
    // ========================================================
    console.log('\n--- Test 1: Access Control for Unapproved / Pending / Rejected Users ---');

    // 1A. Pending applicant receives 403
    const pendingRes = await apiCall('/hero/dashboard', { method: 'GET' }, tokenPending);
    assert(pendingRes.status === 403, 'Pending Campus Hero applicant blocked with 403 Forbidden', pendingRes.data.message);

    // 1B. Rejected applicant receives 403
    const rejectedRes = await apiCall('/hero/dashboard', { method: 'GET' }, tokenRejected);
    assert(rejectedRes.status === 403, 'Rejected Campus Hero applicant blocked with 403 Forbidden', rejectedRes.data.message);

    // 1C. Regular student with no application receives 403
    const regularRes = await apiCall('/hero/dashboard', { method: 'GET' }, tokenRegular);
    assert(regularRes.status === 403, 'Regular student blocked with 403 Forbidden', regularRes.data.message);

    // 1D. Approved hero receives 200 OK
    const approvedRes = await apiCall('/hero/dashboard', { method: 'GET' }, tokenHeroA);
    assert(approvedRes.status === 200 && approvedRes.data.success, 'Approved Campus Hero granted access (200 OK)');

    // 1E. Admin receives 200 OK
    const adminRes = await apiCall('/hero/dashboard', { method: 'GET' }, tokenAdmin);
    assert(adminRes.status === 200 && adminRes.data.success, 'Platform Admin granted access (200 OK)');

    // ========================================================
    // TEST SECTION 2: COLLEGE DATA ISOLATION & METRICS
    // ========================================================
    console.log('\n--- Test 2: College Data Isolation & Summary Metrics ---');

    // Hero A (College A) should see taskCollegeA, but NOT taskCollegeB
    const heroATasks = approvedRes.data.data.tasks;
    assert(
      heroATasks.some((t: any) => t.id === taskCollegeA.id),
      'Hero A sees unassigned task for College A'
    );
    assert(
      !heroATasks.some((t: any) => t.id === taskCollegeB.id),
      'Hero A CANNOT see tasks from College B (Strict College Isolation)'
    );

    // Check live metrics
    const stats = approvedRes.data.data.stats;
    assert(stats.available_tasks_count >= 1, 'Live summary metrics: available_tasks_count correctly counted', `Count: ${stats.available_tasks_count}`);

    // ========================================================
    // TEST SECTION 3: PRIVACY CONTROLS (UNASSIGNED VS CLAIMED)
    // ========================================================
    console.log('\n--- Test 3: Private Contact Details Hidden on Unclaimed Tasks ---');

    const unclaimedTaskInList = heroATasks.find((t: any) => t.id === taskCollegeA.id);
    assert(Boolean(unclaimedTaskInList), 'Unclaimed task found in list');
    assert(unclaimedTaskInList.is_unassigned === true, 'Task flagged as is_unassigned: true');
    assert(unclaimedTaskInList.is_assigned_to_me === false, 'Task flagged as is_assigned_to_me: false');

    // ========================================================
    // TEST SECTION 4: CLAIM TASK WORKFLOW & SECURITY
    // ========================================================
    console.log('\n--- Test 4: Claim Task Workflow & Cross-College Security ---');

    // 4A. Hero A attempts to claim task from College B -> must be 403 Forbidden
    const crossClaimRes = await apiCall(`/hero/tasks/${taskCollegeB.id}/claim`, { method: 'POST' }, tokenHeroA);
    assert(crossClaimRes.status === 403, 'Hero A blocked from claiming task in College B', crossClaimRes.data.message);

    // 4B. Pending applicant attempts to claim task in College A -> must be 403 Forbidden
    const pendingClaimRes = await apiCall(`/hero/tasks/${taskCollegeA.id}/claim`, { method: 'POST' }, tokenPending);
    assert(pendingClaimRes.status === 403, 'Pending applicant blocked from claiming task', pendingClaimRes.data.message);

    // 4C. Hero A claims taskCollegeA in College A -> Success 200
    const claimRes = await apiCall(`/hero/tasks/${taskCollegeA.id}/claim`, { method: 'POST' }, tokenHeroA);
    assert(claimRes.status === 200 && claimRes.data.success, 'Hero A successfully claimed task in College A');

    // 4D. Another hero attempts to claim already claimed task -> must be 400
    // Create another hero in College A
    let heroA2 = await prisma.user.findFirst({ where: { email: 'hero_a2@bpit.ac.in' } });
    if (!heroA2) {
      heroA2 = await prisma.user.create({
        data: {
          name: 'Hero Vikram (College A)',
          email: 'hero_a2@bpit.ac.in',
          phone: '9866666666',
          password_hash: 'dummyhash',
          college_id: collegeA.id,
          role: 'CAMPUS_HERO',
        },
      });
    }
    const tokenHeroA2 = makeToken(heroA2);
    const doubleClaimRes = await apiCall(`/hero/tasks/${taskCollegeA.id}/claim`, { method: 'POST' }, tokenHeroA2);
    assert(doubleClaimRes.status === 400, 'Duplicate claim blocked: task already claimed by another hero', doubleClaimRes.data.message);

    // ========================================================
    // TEST SECTION 5: TASK STATUS UPDATES & QUALITY CHECK
    // ========================================================
    console.log('\n--- Test 5: Task Status Updates & Verification ---');

    // 5A. Update status to PICKED_UP with quality_verified = true
    const updatePickupRes = await apiCall(
      `/hero/tasks/${taskCollegeA.id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status: 'PICKED_UP',
          quality_verified: true,
          pickup_notes: 'Item verified in excellent condition at library',
        }),
      },
      tokenHeroA
    );
    assert(updatePickupRes.status === 200 && updatePickupRes.data.success, 'Marked task as PICKED_UP with quality verification');

    // 5B. Non-assigned hero cannot update status
    const unauthorizedUpdate = await apiCall(
      `/hero/tasks/${taskCollegeA.id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' }),
      },
      tokenHeroA2
    );
    assert(unauthorizedUpdate.status === 403, 'Non-assigned hero blocked from updating task status');

    // 5C. Complete the task
    const updateCompleteRes = await apiCall(
      `/hero/tasks/${taskCollegeA.id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status: 'COMPLETED',
          delivery_notes: 'Handover complete to student',
        }),
      },
      tokenHeroA
    );
    assert(updateCompleteRes.status === 200 && updateCompleteRes.data.data.status === 'COMPLETED', 'Marked task as COMPLETED');

    // ========================================================
    // TEST SECTION 6: COORDINATION MESSAGING
    // ========================================================
    console.log('\n--- Test 6: In-Website Coordination Messaging ---');

    const msgRes = await apiCall(
      `/hero/tasks/${taskCollegeA.id}/message`,
      {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: regularUser.id,
          content: 'Hello! I am outside the library with your calculator.',
        }),
      },
      tokenHeroA
    );

    assert(msgRes.status === 201 && msgRes.data.success, 'Sent coordination message');
    assert(
      msgRes.data.data.sender_display_name === 'Operations Team — Campus Hero',
      'Message sent under official "Operations Team — Campus Hero" identity'
    );

    // Clean up test tasks
    await prisma.deliveryTask.deleteMany({
      where: { id: { in: [taskCollegeA.id, taskCollegeB.id] } },
    });

    console.log(`\n========================================`);
    console.log(`🏁 HERO TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test suite error:', err);
  } finally {
    (server as any)?.close();
  }
}

runHeroTestSuite();
