import prisma from './db';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { app } from './index';
import http from 'http';

async function runTeamsTestSuite() {
  console.log('🧪 Starting Find Teammates & Hackathon Matching Test Suite...\n');

  let server: http.Server | undefined = undefined;
  const testPort = 5099;

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
    // 1. Fetch colleges & test users
    const colleges = await prisma.college.findMany();
    assert(colleges.length >= 2, 'Colleges available for cross-college testing', `Found ${colleges.length} colleges`);

    const collegeA = colleges[0];
    const collegeB = colleges[1];

    // Ensure User A (Creator, from College A)
    let userA = await prisma.user.findFirst({ where: { email: 'teamlead@bpit.ac.in' } });
    if (!userA) {
      userA = await prisma.user.create({
        data: {
          name: 'Aarav Sharma (Team Lead)',
          email: 'teamlead@bpit.ac.in',
          phone: '9876543210',
          password_hash: 'dummyhash',
          college_id: collegeA.id,
          role: 'USER',
        },
      });
    }

    // Ensure User B (Applicant from College B)
    let userB = await prisma.user.findFirst({ where: { email: 'hacker@mait.ac.in' } });
    if (!userB) {
      userB = await prisma.user.create({
        data: {
          name: 'Priya Verma (Fullstack Dev)',
          email: 'hacker@mait.ac.in',
          phone: '9876543211',
          password_hash: 'dummyhash',
          college_id: collegeB.id,
          role: 'USER',
        },
      });
    }

    // Admin user
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    assert(Boolean(adminUser), 'Admin user found');

    const tokenA = jwt.sign(
      { id: userA.id, email: userA.email, role: userA.role, college_id: collegeA.id, college_name: collegeA.name, college_code: collegeA.code },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const tokenB = jwt.sign(
      { id: userB.id, email: userB.email, role: userB.role, college_id: collegeB.id, college_name: collegeB.name, college_code: collegeB.code },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const adminToken = jwt.sign(
      { id: adminUser!.id, email: adminUser!.email, role: 'ADMIN', college_id: adminUser!.college_id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // ==========================================
    // TEST 1: User A Creates / Updates Skill Profile
    // ==========================================
    console.log('\n--- Test 1: Skill Profile Creation & Retrieval ---');
    const profileRes = await apiCall(
      '/teams/profile',
      {
        method: 'POST',
        body: JSON.stringify({
          bio: 'Passionate 3rd year fullstack developer, SIH 2025 finalist. Love building AI applications.',
          skills: ['React', 'Node.js', 'Python', 'PyTorch'],
          preferred_roles: ['Team Lead', 'Full Stack Developer'],
          github_url: 'https://github.com/aaravsharma',
          portfolio_url: 'https://aarav.dev',
          experience_level: 'Advanced',
        }),
      },
      tokenA
    );

    assert(profileRes.status === 200 && profileRes.data.success, 'User A saved skill profile successfully');
    assert(profileRes.data.data.skills.includes('React'), 'Skills array correctly parsed and saved');

    // GET /teams/profile/me
    const getMeProfile = await apiCall('/teams/profile/me', { method: 'GET' }, tokenA);
    assert(getMeProfile.status === 200 && getMeProfile.data.data.experience_level === 'Advanced', 'Retrieved my skill profile');

    // ==========================================
    // TEST 2: User A Creates Team Recruitment Post (SIH 2026, Open to all)
    // ==========================================
    console.log('\n--- Test 2: Team Post Creation (SIH 2026) ---');
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10);

    const createPostRes = await apiCall(
      '/teams',
      {
        method: 'POST',
        body: JSON.stringify({
          hackathon_name: 'Smart India Hackathon (SIH 2026)',
          team_title: 'EcoVision - AI Waste Classification',
          description: 'Building an automated IoT and Computer Vision system for real-time segregation of municipal waste. Seeking talented teammates.',
          skills_needed: ['Python', 'YOLOv8', 'React', 'Raspberry Pi'],
          required_roles: ['AI/ML Specialist', 'Frontend Developer', 'Hardware Engineer'],
          max_team_size: 6,
          eligibility_rules: 'OPEN_TO_ALL',
          eligibility_notes: 'As per SIH guidelines, at least one female teammate is mandatory. 2nd or 3rd year students preferred.',
          application_deadline: deadline.toISOString(),
        }),
      },
      tokenA
    );

    assert(createPostRes.status === 201 && createPostRes.data.success, 'Team recruitment post created successfully');
    const createdPostId = createPostRes.data.data.id;
    assert(Boolean(createdPostId), 'Post ID returned', `ID: ${createdPostId}`);

    // ==========================================
    // TEST 3: Browse and Filter Team Posts
    // ==========================================
    console.log('\n--- Test 3: Browse, Search & Filter Team Posts ---');
    const browseRes = await apiCall(`/teams?hackathon=Smart India Hackathon`, { method: 'GET' }, tokenB);
    assert(browseRes.status === 200 && browseRes.data.success, 'Browse endpoint returned 200');
    assert(
      browseRes.data.data.some((p: any) => p.id === createdPostId),
      'Created SIH team found in browse results'
    );

    // Filter by skill
    const skillFilterRes = await apiCall(`/teams?skill=YOLOv8`, { method: 'GET' }, tokenB);
    assert(
      skillFilterRes.data.data.some((p: any) => p.id === createdPostId),
      'Skill filter correctly matches team posts'
    );

    // ==========================================
    // TEST 4: Prevention Rules: Owner Applying to Own Team
    // ==========================================
    console.log('\n--- Test 4: Prevent Owner Applying to Own Team ---');
    const ownerApplyRes = await apiCall(
      `/teams/${createdPostId}/apply`,
      {
        method: 'POST',
        body: JSON.stringify({
          role_applied: 'AI/ML Specialist',
          message: 'Trying to apply to my own team',
        }),
      },
      tokenA
    );

    assert(ownerApplyRes.status === 400, 'Owner blocked from applying to own team', ownerApplyRes.data.message);

    // ==========================================
    // TEST 5: User B Applies to User A's Team
    // ==========================================
    console.log('\n--- Test 5: Applicant Applies to Team ---');
    const applyRes = await apiCall(
      `/teams/${createdPostId}/apply`,
      {
        method: 'POST',
        body: JSON.stringify({
          role_applied: 'AI/ML Specialist',
          message: 'Experienced with PyTorch and YOLOv8 computer vision models. Built dataset pipelines.',
        }),
      },
      tokenB
    );

    assert(applyRes.status === 201 && applyRes.data.success, 'User B applied to User A team successfully');
    const appId = applyRes.data.data.id;

    // ==========================================
    // TEST 6: Duplicate Application Prevention
    // ==========================================
    console.log('\n--- Test 6: Duplicate Application Prevention ---');
    const duplicateApplyRes = await apiCall(
      `/teams/${createdPostId}/apply`,
      {
        method: 'POST',
        body: JSON.stringify({
          role_applied: 'AI/ML Specialist',
          message: 'Trying to apply a second time',
        }),
      },
      tokenB
    );

    assert(duplicateApplyRes.status === 400, 'Duplicate application blocked', duplicateApplyRes.data.message);

    // ==========================================
    // TEST 7: Cross-College Restriction Validation
    // ==========================================
    console.log('\n--- Test 7: Institution-Specific Restriction Validation ---');
    // Create a strict SAME_COLLEGE_ONLY team post by User A (College A)
    const strictPostRes = await apiCall(
      '/teams',
      {
        method: 'POST',
        body: JSON.stringify({
          hackathon_name: 'Campus Internal Hackathon',
          team_title: 'College A Internal Squad',
          description: 'Strictly restricted to students of our own campus.',
          skills_needed: ['React'],
          required_roles: ['Frontend Developer'],
          max_team_size: 4,
          eligibility_rules: 'SAME_COLLEGE_ONLY',
          application_deadline: deadline.toISOString(),
        }),
      },
      tokenA
    );

    const strictPostId = strictPostRes.data.data.id;

    // User B (from College B) attempts to apply to College A's SAME_COLLEGE_ONLY team
    const crossApplyRes = await apiCall(
      `/teams/${strictPostId}/apply`,
      {
        method: 'POST',
        body: JSON.stringify({
          role_applied: 'Frontend Developer',
          message: 'Applying from different college',
        }),
      },
      tokenB
    );

    assert(crossApplyRes.status === 403, 'Cross-college applicant blocked by SAME_COLLEGE_ONLY rule', crossApplyRes.data.message);

    // ==========================================
    // TEST 8: Team Lead Decision (Accept Applicant)
    // ==========================================
    console.log('\n--- Test 8: Team Lead Accepts Application & Capacity Update ---');
    const acceptRes = await apiCall(
      `/teams/${createdPostId}/applications/${appId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACCEPTED' }),
      },
      tokenA
    );

    assert(acceptRes.status === 200 && acceptRes.data.success, 'Team lead accepted User B application');

    // Verify team details reflect the new member
    const teamDetailsRes = await apiCall(`/teams/${createdPostId}`, { method: 'GET' }, tokenA);
    assert(teamDetailsRes.data.data.current_team_size === 2, 'Team capacity updated to 2 members (1 lead + 1 accepted)');
    assert(teamDetailsRes.data.data.open_seats === 4, 'Open seats updated to 4');
    assert(
      teamDetailsRes.data.data.accepted_members.some((m: any) => m.id === userB.id),
      'User B listed in confirmed team members roster'
    );

    // ==========================================
    // TEST 9: Unauthorized User Cannot Decide on Applications
    // ==========================================
    console.log('\n--- Test 9: Unauthorized User Decision Blocked ---');
    const unauthorizedDecision = await apiCall(
      `/teams/${createdPostId}/applications/${appId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJECTED' }),
      },
      tokenB
    );

    assert(unauthorizedDecision.status === 403, 'Unauthorized decision blocked with 403');

    // ==========================================
    // TEST 10: My Teams Endpoint Verification
    // ==========================================
    console.log('\n--- Test 10: My Teams & Applications Endpoint ---');
    const myTeamsLead = await apiCall('/teams/my/all', { method: 'GET' }, tokenA);
    assert(myTeamsLead.data.data.created_teams.length >= 1, 'My created teams listed');

    const myTeamsApplicant = await apiCall('/teams/my/all', { method: 'GET' }, tokenB);
    assert(myTeamsApplicant.data.data.applied_teams.length >= 1, 'My submitted applications listed');
    assert(
      myTeamsApplicant.data.data.applied_teams.some((a: any) => a.id === appId && a.status === 'ACCEPTED'),
      'Application status shows ACCEPTED in applicant dashboard'
    );

    // ==========================================
    // TEST 11: Admin Moderation of Team Posts
    // ==========================================
    console.log('\n--- Test 11: Admin Moderation Controls ---');
    const adminListRes = await apiCall('/teams/admin/all', { method: 'GET' }, adminToken);
    assert(adminListRes.status === 200 && adminListRes.data.data.length >= 2, 'Admin can view all team posts');

    const adminStatusRes = await apiCall(
      `/teams/admin/${strictPostId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REMOVED' }),
      },
      adminToken
    );

    assert(adminStatusRes.status === 200 && adminStatusRes.data.data.status === 'REMOVED', 'Admin can moderate/remove team post');

    console.log(`\n========================================`);
    console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test suite error:', err);
  } finally {
    (server as any)?.close();
  }
}

runTeamsTestSuite();
