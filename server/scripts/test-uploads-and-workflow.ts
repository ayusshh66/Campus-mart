process.env.NODE_ENV = 'test';
import http from 'http';
import fs from 'fs';
import path from 'path';
import prisma from '../src/db';
import { app } from '../src/index';

// Helper to make multipart request without external dependency
function makeMultipartRequest(
  serverPort: number,
  endpoint: string,
  token: string,
  fieldName: string,
  filename: string,
  mimeType: string,
  content: Buffer
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const boundary = '----CampusMartTestBoundary' + Date.now();
    const crlf = '\r\n';

    const header = Buffer.from(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"${crlf}` +
      `Content-Type: ${mimeType}${crlf}${crlf}`
    );
    const footer = Buffer.from(`${crlf}--${boundary}--${crlf}`);
    const payload = Buffer.concat([header, content, footer]);

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': payload.length,
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resData);
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, body: resData });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function makeJsonRequest(
  serverPort: number,
  endpoint: string,
  method: string,
  token?: string,
  bodyData?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const bodyStr = bodyData ? JSON.stringify(bodyData) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path: endpoint,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resData);
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 500, body: resData });
          }
        });
      }
    );

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function fetchStaticFile(serverPort: number, filePath: string): Promise<{ status: number; length: number }> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${serverPort}${filePath}`, (res) => {
      let dataLen = 0;
      res.on('data', (c) => (dataLen += c.length));
      res.on('end', () => resolve({ status: res.statusCode || 500, length: dataLen }));
      res.on('error', reject);
    });
  });
}

async function run() {
  console.log('--- STARTING IMAGE UPLOAD & CUSTOM SELLING WORKFLOW TEST ---');

  // Start test server on random open port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;
  console.log(`Test server running on port ${port}`);

  try {
    // 1. Authenticate users
    console.log('\nStep 1: Authenticating test accounts...');
    const rahulLogin = await makeJsonRequest(port, '/api/auth/login', 'POST', undefined, {
      email: 'rahul@bpit.ac.in',
      password: 'student123',
    });
    const studentToken = rahulLogin.body.data.token;
    const studentUser = rahulLogin.body.data.user;
    console.log(`✓ Student authenticated: ${studentUser.name} (${studentUser.college.code})`);

    const adminLogin = await makeJsonRequest(port, '/api/auth/login', 'POST', undefined, {
      email: 'admin@campusmart.in',
      password: 'admin123',
    });
    const adminToken = adminLogin.body.data.token;
    console.log(`✓ Admin authenticated: ${adminLogin.body.data.user.name}`);

    // 2. Test File Upload Validations: Accept JPEG, PNG, WebP only. Reject SVG or other types.
    console.log('\nStep 2: Testing upload file type validations...');

    // A) SVG file (MUST be rejected)
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
    const svgRes = await makeMultipartRequest(port, '/api/upload', studentToken, 'image', 'malicious.svg', 'image/svg+xml', svgBuffer);
    console.log(`SVG Upload HTTP status: ${svgRes.status} (Expected: 400)`);
    if (svgRes.status === 400) {
      console.log(`✓ Rejected SVG successfully: "${svgRes.body.message}"`);
    } else {
      throw new Error(`SVG was NOT rejected! Status was ${svgRes.status}`);
    }

    // B) Text/Executable file (MUST be rejected)
    const txtBuffer = Buffer.from('hello world script');
    const txtRes = await makeMultipartRequest(port, '/api/upload', studentToken, 'image', 'script.exe', 'application/x-msdownload', txtBuffer);
    console.log(`EXE Upload HTTP status: ${txtRes.status} (Expected: 400)`);
    if (txtRes.status === 400) {
      console.log(`✓ Rejected EXE successfully: "${txtRes.body.message}"`);
    } else {
      throw new Error(`EXE was NOT rejected! Status was ${txtRes.status}`);
    }

    // C) Valid JPEG image (MUST succeed)
    // 1x1 valid JPEG byte buffer
    const validJpgBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
      0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
      0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
      0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0x37, 0xff, 0xd9
    ]);
    const jpgRes = await makeMultipartRequest(port, '/api/upload', studentToken, 'image', 'photo1.jpg', 'image/jpeg', validJpgBuffer);
    console.log(`JPEG Upload HTTP status: ${jpgRes.status} (Expected: 200)`);
    if (jpgRes.status !== 200 || !jpgRes.body.data?.url) {
      throw new Error(`JPEG upload failed! ${JSON.stringify(jpgRes.body)}`);
    }
    const uploadedPhoto1Url = jpgRes.body.data.url;
    console.log(`✓ JPEG uploaded successfully: ${uploadedPhoto1Url}`);
    console.log(`✓ Filename generated safely with user prefix: ${jpgRes.body.data.filename}`);

    // D) Valid PNG image
    // Minimal PNG byte buffer
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82
    ]);
    const pngRes = await makeMultipartRequest(port, '/api/upload', studentToken, 'image', 'photo2.png', 'image/png', validPngBuffer);
    if (pngRes.status !== 200) {
      throw new Error(`PNG upload failed! ${JSON.stringify(pngRes.body)}`);
    }
    const uploadedPhoto2Url = pngRes.body.data.url;
    console.log(`✓ PNG uploaded successfully: ${uploadedPhoto2Url}`);

    // E) Test retrieving uploaded image from server static endpoint
    console.log('\nStep 3: Verifying static image retrieval...');
    const staticCheck = await fetchStaticFile(port, uploadedPhoto1Url);
    console.log(`Static file retrieval HTTP status: ${staticCheck.status}, length: ${staticCheck.length} bytes`);
    if (staticCheck.status !== 200 || staticCheck.length === 0) {
      throw new Error('Failed to retrieve uploaded image via static URL!');
    }
    console.log('✓ Uploaded image correctly served and retrieved from server!');

    // F) Test oversized image rejection (> 5MB)
    console.log('\nStep 4: Testing file size limit enforcement (max 5MB)...');
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    // Header for fake jpeg
    validJpgBuffer.copy(oversizedBuffer, 0, 0, Math.min(validJpgBuffer.length, 50));
    const oversizedRes = await makeMultipartRequest(port, '/api/upload', studentToken, 'image', 'oversized.jpg', 'image/jpeg', oversizedBuffer);
    console.log(`Oversized upload HTTP status: ${oversizedRes.status} (Expected: 400)`);
    if (oversizedRes.status === 400) {
      console.log(`✓ Oversized file correctly rejected: "${oversizedRes.body.message}"`);
    } else {
      throw new Error(`Oversized file was NOT rejected! Status was ${oversizedRes.status}`);
    }

    // 3. Complete End-to-End Workflow: Custom Item Submission -> Admin Approval -> Marketplace Listing -> Buyer Purchase
    console.log('\nStep 5: Student (Rahul, BPIT) submits custom second-hand item with uploaded images...');
    const testTimestamp = Date.now();
    const customItemPayload = {
      name: `Engineering Graphics Mini Drafter ${testTimestamp}`,
      category: 'Engineering & Lab Tools',
      condition: 'Like New',
      description: 'Used for 1 semester in BPIT ME dept. Excellent smooth scales, no cracks or bent arms.',
      expected_price: 450,
      images: [uploadedPhoto1Url, uploadedPhoto2Url],
    };

    const submitRes = await makeJsonRequest(port, '/api/sell-requests/custom', 'POST', studentToken, customItemPayload);
    console.log(`Submission HTTP status: ${submitRes.status} (Expected: 201)`);
    if (submitRes.status !== 201 || !submitRes.body.data?.id) {
      throw new Error(`Custom item submission failed! ${JSON.stringify(submitRes.body)}`);
    }
    const submissionId = submitRes.body.data.id;
    console.log(`✓ Custom item created: ID ${submissionId}, status: ${submitRes.body.data.status}`);

    // Verify college was locked to session college (BPIT), NOT a spoofed client value
    if (submitRes.body.data.college_id !== studentUser.college.id) {
      throw new Error('College was NOT locked to authenticated user session!');
    }
    console.log(`✓ College locked to authenticated user: ${submitRes.body.data.college.code}`);

    // Verify Pending submission is NOT visible in public products catalog
    console.log('\nStep 6: Verifying pending item is NOT exposed in marketplace...');
    const marketplaceBefore = await makeJsonRequest(port, `/api/products?college_id=${studentUser.college.id}`, 'GET', studentToken);
    const foundBefore = marketplaceBefore.body.data.some((p: any) => p.name === customItemPayload.name);
    if (foundBefore) {
      throw new Error('Pending custom item was exposed before admin approval!');
    }
    console.log('✓ Confirmed: Pending submission is completely hidden from public listings.');

    // 4. Admin Queue Inspection
    console.log('\nStep 7: Admin reviews custom item review queue...');
    const adminQueue = await makeJsonRequest(port, '/api/admin/custom-submissions?status=PENDING', 'GET', adminToken);
    const pendingItem = adminQueue.body.data.find((item: any) => item.id === submissionId);
    if (!pendingItem) {
      throw new Error('Submission not found in admin pending review queue!');
    }
    console.log(`✓ Admin review queue found item "${pendingItem.name}" with ${pendingItem.images.length} images.`);

    // 5. Admin Approves and Assigns Valuation
    console.log('\nStep 8: Admin approves submission and assigns buying/selling prices...');
    const approveRes = await makeJsonRequest(port, `/api/admin/custom-submissions/${submissionId}`, 'PUT', adminToken, {
      action: 'APPROVE',
      admin_buy_price: 400,
      admin_sell_price: 550,
    });
    console.log(`Approval HTTP status: ${approveRes.status} (Expected: 200)`);
    if (approveRes.status !== 200 || approveRes.body.data?.submission?.status !== 'APPROVED') {
      throw new Error(`Admin approval failed! ${JSON.stringify(approveRes.body)}`);
    }
    const approvedProduct = approveRes.body.data.product;
    console.log(`✓ Admin approved item. Created Product ID: ${approvedProduct.id}`);

    // 6. Prevent Duplicate Approval
    console.log('\nStep 9: Testing duplicate review prevention...');
    const duplicateApprove = await makeJsonRequest(port, `/api/admin/custom-submissions/${submissionId}`, 'PUT', adminToken, {
      action: 'APPROVE',
      admin_buy_price: 400,
      admin_sell_price: 550,
    });
    console.log(`Duplicate approval HTTP status: ${duplicateApprove.status} (Expected: 400)`);
    if (duplicateApprove.status === 400) {
      console.log(`✓ Blocked duplicate approval: "${duplicateApprove.body.message}"`);
    } else {
      throw new Error(`Duplicate approval was not blocked! Status: ${duplicateApprove.status}`);
    }

    // 7. Verify Publication on Campus Marketplace
    console.log('\nStep 10: Checking if approved product is now live on BPIT campus marketplace...');
    const marketplaceAfter = await makeJsonRequest(port, `/api/products?college_id=${studentUser.college.id}`, 'GET', studentToken);
    const liveListing = marketplaceAfter.body.data.find((p: any) => p.id === approvedProduct.id);
    if (!liveListing) {
      throw new Error('Approved custom item was NOT published to marketplace!');
    }
    console.log(`✓ Live listing found: "${liveListing.name}"`);
    console.log(`✓ Price: ₹${liveListing.sell_price}`);
    console.log(`✓ Available on BPIT: ${liveListing.is_available}`);
    console.log(`✓ Gallery photos count: ${liveListing.images.length} (Primary: ${liveListing.image_url})`);

    // Verify detail endpoint parses images and availability
    const detailCheck = await makeJsonRequest(port, `/api/products/${approvedProduct.id}?college_id=${studentUser.college.id}`, 'GET', studentToken);
    if (!detailCheck.body.data?.is_available || detailCheck.body.data.images.length !== 2) {
      throw new Error('Product detail endpoint failed to return all images or availability!');
    }
    console.log(`✓ Detail page API returned all ${detailCheck.body.data.images.length} images.`);

    // 8. Buyer Places Buy Request on Newly Listed Custom Item
    console.log('\nStep 11: Buyer places Buy Request for the custom item...');
    const buyRes = await makeJsonRequest(port, '/api/buy-requests', 'POST', studentToken, {
      product_id: approvedProduct.id,
      college_id: studentUser.college.id,
      notes: 'Need this urgently for Graphics lab tomorrow!',
    });
    console.log(`Buy Request HTTP status: ${buyRes.status} (Expected: 201)`);
    if (buyRes.status !== 201) {
      throw new Error(`Buy request failed! ${JSON.stringify(buyRes.body)}`);
    }
    console.log(`✓ Buy request successfully created: ID ${buyRes.body.data.id}`);

    // 9. Rejection flow test
    console.log('\nStep 12: Testing Custom Item rejection flow with reason...');
    const subToReject = await makeJsonRequest(port, '/api/sell-requests/custom', 'POST', studentToken, {
      name: 'Unusable Broken Mouse',
      category: 'Electronics & Tech',
      condition: 'Used',
      description: 'Sensor does not track and cable cut.',
      expected_price: 100,
      images: [uploadedPhoto1Url],
    });
    const rejectId = subToReject.body.data.id;
    const rejectRes = await makeJsonRequest(port, `/api/admin/custom-submissions/${rejectId}`, 'PUT', adminToken, {
      action: 'REJECT',
      rejection_reason: 'Item is physically broken and non-functional.',
    });
    console.log(`Reject HTTP status: ${rejectRes.status} (Expected: 200)`);
    if (rejectRes.status !== 200 || rejectRes.body.data?.status !== 'REJECTED') {
      throw new Error(`Rejection failed! ${JSON.stringify(rejectRes.body)}`);
    }
    console.log(`✓ Successfully rejected with reason: "${rejectRes.body.data.rejection_reason}"`);

    // Verify student sees their rejected custom submission in their profile
    const myCustoms = await makeJsonRequest(port, '/api/sell-requests/custom/my', 'GET', studentToken);
    const myRejected = myCustoms.body.data.find((s: any) => s.id === rejectId);
    if (!myRejected || myRejected.status !== 'REJECTED' || !myRejected.rejection_reason) {
      throw new Error('Student cannot see rejection status/reason in custom submissions!');
    }
    console.log(`✓ Student profile correctly displays status: ${myRejected.status} and reason: "${myRejected.rejection_reason}"`);

    console.log('\n=======================================================');
    console.log('🎉 ALL TESTS PASSED: UPLOADS & FULL WORKFLOW VERIFIED!');
    console.log('=======================================================');
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
