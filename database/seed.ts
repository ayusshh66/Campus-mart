import { PrismaClient } from '../server/node_modules/@prisma/client';
import bcrypt from '../server/node_modules/bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CampusMart database seed...');

  // 1. Clean existing records (in reverse relation order)
  await prisma.campusHeroApplication.deleteMany();
  await prisma.buyRequest.deleteMany();
  await prisma.sellRequest.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.college.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Seed Colleges
  const collegesData = [
    { code: 'BPIT', name: 'Bhagwan Parshuram Institute of Technology' },
    { code: 'MAIT', name: 'Maharaja Agrasen Institute of Technology' },
    { code: 'MSIT', name: 'Maharaja Surajmal Institute of Technology' },
    { code: 'USAR', name: 'University School of Automation and Robotics' },
    { code: 'OTHER', name: 'Other University Campus' },
  ];

  const colleges: Record<string, any> = {};
  for (const c of collegesData) {
    const created = await prisma.college.create({
      data: {
        code: c.code,
        name: c.name,
        is_active: true,
      },
    });
    colleges[c.code] = created;
    console.log(`🏫 Created College: ${c.code} - ${c.name}`);
  }

  // 3. Seed Products
  const productsData = [
    {
      name: 'Casio FX-991ES Plus',
      category: 'Calculator',
      description: 'Essential scientific calculator with 417 functions and natural textbook display. Ideal for engineering math, physics, and all semester exams.',
      image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80',
      ]),
      buy_price: 500.0,
      upto_buy_price: 650.0,
      sell_price: 799.0,
      is_buying_enabled: true, // We are actively buying this
      is_active: true,
      quality_questions: JSON.stringify([
        {
          id: 'q_power',
          question: 'Does the calculator power on and show clear digits?',
          options: [
            { label: 'Yes, powers on and digits are dark & clear', description: 'Boots instantly, crystal-clear natural textbook LCD', deduction: 0 },
            { label: 'Digits are slightly faint / requires bright light', description: 'Display is slightly dim under low indoor lighting', deduction: 40 },
            { label: 'Fails to turn on / dead battery & solar cell', description: 'Needs battery replacement to function', deduction: 120 },
          ],
        },
        {
          id: 'q_screen',
          question: 'What is the condition of the screen & button keypad?',
          options: [
            { label: 'Flawless — No scratches, all buttons crisp', description: 'Like brand new, zero scratches on LCD', deduction: 0 },
            { label: 'Light surface scratches on screen', description: 'Normal backpack scuffs visible only under direct light', deduction: 30 },
            { label: 'Deep scratch lines or faded key labels', description: 'Noticeable scratch or key legends partly rubbed off', deduction: 70 },
          ],
        },
        {
          id: 'q_cover',
          question: 'Is the original protective slide cover included?',
          options: [
            { label: 'Yes, original hard slide cover is included', description: 'Protective hard casing snaps on securely', deduction: 0 },
            { label: 'No, protective slide cover is missing', description: 'Calculator body only without plastic slip cover', deduction: 50 },
          ],
        },
      ]),
    },
    {
      name: 'Engineering Mathematics Book',
      category: 'Books',
      description: 'Comprehensive Higher Engineering Mathematics reference book covering calculus, linear algebra, and differential equations. Crisp pages, no pen markings.',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
      ]),
      buy_price: 100.0,
      upto_buy_price: 180.0,
      sell_price: 299.0,
      is_buying_enabled: true, // We are actively buying this
      is_active: true,
      quality_questions: JSON.stringify([
        {
          id: 'q_book_cover',
          question: 'What is the condition of the book cover and spine?',
          options: [
            { label: 'Like New — Unbent cover & firm spine', description: 'Spine looks unread, pristine corners', deduction: 0 },
            { label: 'Good — Normal shelf wear, spine intact', description: 'Solid binding with light shelf wear', deduction: 15 },
            { label: 'Fair — Creased cover or rubbed edges', description: 'Noticeable cover crease, firm binding', deduction: 35 },
          ],
        },
        {
          id: 'q_markings',
          question: 'Are there any handwritten notes or highlights inside?',
          options: [
            { label: 'Clean Pages — Zero writing or highlighters', description: '100% unstained, clean pages throughout', deduction: 0 },
            { label: 'Light pencil notes or neat highlights', description: 'Occasional light notes in a few chapters', deduction: 15 },
            { label: 'Frequent pen markings or solved sums', description: 'Multiple chapters have handwritten ink solutions', deduction: 30 },
          ],
        },
        {
          id: 'q_completeness',
          question: 'Are all pages and index complete?',
          options: [
            { label: '100% Complete & Intact', description: 'All pages, formulas, and index intact', deduction: 0 },
            { label: 'Minor loose or folded page', description: 'One or two loose pages inside', deduction: 25 },
          ],
        },
      ]),
    },
    {
      name: 'Mechanical Keyboard',
      category: 'Electronics',
      description: 'Tenkeyless mechanical gaming and coding keyboard featuring tactile switches, dynamic RGB backlight, and detachable USB-C cable.',
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
      ]),
      buy_price: 750.0,
      upto_buy_price: 1050.0,
      sell_price: 1299.0,
      is_buying_enabled: false, // Currently NOT buying
      is_active: true,
      quality_questions: JSON.stringify([
        {
          id: 'q_keys',
          question: 'Do all mechanical switches and keys register?',
          options: [
            { label: 'Flawless — All switches click & register cleanly', description: 'Zero key chatter, tactile click on every keystroke', deduction: 0 },
            { label: '1 or 2 keys require firm pressing', description: 'Occasional key lag on spacebar or enter', deduction: 80 },
            { label: 'Multiple keys unresponsive or chattering', description: 'Requires switch replacement or contact cleaner', deduction: 200 },
          ],
        },
        {
          id: 'q_lighting',
          question: 'RGB backlight & USB cable connection status?',
          options: [
            { label: 'All LEDs working & original cable included', description: 'Uniform RGB brightness across all key zones', deduction: 0 },
            { label: 'Some LEDs dim or third-party cable', description: 'A couple of dim LEDs or generic USB cable', deduction: 50 },
          ],
        },
        {
          id: 'q_keycaps',
          question: 'Condition of keycaps and top plate casing?',
          options: [
            { label: 'Pristine — No keycap shine or plate scuffs', description: 'Matte texture preserved, looks brand new', deduction: 0 },
            { label: 'Light shine on WASD or spacebar', description: 'Normal smooth texture from daily coding', deduction: 40 },
            { label: 'Noticeable scuffs or rubbed keycap legends', description: 'Visible scratches or worn keycap plastic', deduction: 90 },
          ],
        },
      ]),
    },
  ];

  const products: Record<string, any> = {};
  for (const p of productsData) {
    const created = await prisma.product.create({
      data: p,
    });
    products[p.name] = created;
    console.log(`📦 Created Product: ${p.name} (Buy: ₹${p.buy_price}, Sell: ₹${p.sell_price})`);
  }

  // 4. Seed Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      name: 'CampusMart Admin',
      email: 'admin@campusmart.in',
      phone: '9876543210',
      password_hash: adminPassword,
      college_id: colleges['BPIT'].id,
      role: 'ADMIN',
    },
  });
  console.log(`👤 Created Admin: ${adminUser.email}`);

  // Students
  const rahulBPIT = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@bpit.ac.in',
      phone: '9811223344',
      password_hash: studentPassword,
      college_id: colleges['BPIT'].id,
      role: 'USER',
    },
  });

  const priyaMAIT = await prisma.user.create({
    data: {
      name: 'Priya Singh',
      email: 'priya@mait.ac.in',
      phone: '9822334455',
      password_hash: studentPassword,
      college_id: colleges['MAIT'].id,
      role: 'USER',
    },
  });

  const arjunMSIT = await prisma.user.create({
    data: {
      name: 'Arjun Verma',
      email: 'arjun@msit.ac.in',
      phone: '9833445566',
      password_hash: studentPassword,
      college_id: colleges['MSIT'].id,
      role: 'USER',
    },
  });

  console.log(`👥 Created Student Users: Rahul (BPIT), Priya (MAIT), Arjun (MSIT)`);

  // 5. Seed Approved Sell Requests (to create college-specific availability)
  // BPIT: Calculator (APPROVED), Mathematics Book (APPROVED), Keyboard (None)
  await prisma.sellRequest.create({
    data: {
      user_id: rahulBPIT.id,
      college_id: colleges['BPIT'].id,
      product_id: products['Casio FX-991ES Plus'].id,
      condition: 'Good',
      description: 'Gently used in 2nd semester. Works flawlessly, battery is fresh.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80']),
      admin_buy_price: 550,
      admin_sell_price: 799,
      status: 'APPROVED',
    },
  });

  await prisma.sellRequest.create({
    data: {
      user_id: rahulBPIT.id,
      college_id: colleges['BPIT'].id,
      product_id: products['Engineering Mathematics Book'].id,
      condition: 'Like New',
      description: 'Used for one semester only, completely clean.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80']),
      admin_buy_price: 120,
      admin_sell_price: 299,
      status: 'APPROVED',
    },
  });

  // MAIT: Calculator (None), Mathematics Book (APPROVED), Keyboard (APPROVED)
  await prisma.sellRequest.create({
    data: {
      user_id: priyaMAIT.id,
      college_id: colleges['MAIT'].id,
      product_id: products['Engineering Mathematics Book'].id,
      condition: 'Good',
      description: 'Cover is intact, clear text.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80']),
      admin_buy_price: 120,
      admin_sell_price: 299,
      status: 'APPROVED',
    },
  });

  await prisma.sellRequest.create({
    data: {
      user_id: priyaMAIT.id,
      college_id: colleges['MAIT'].id,
      product_id: products['Mechanical Keyboard'].id,
      condition: 'Like New',
      description: 'Blue switches, comes in original retail box.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80']),
      admin_buy_price: 800,
      admin_sell_price: 1299,
      status: 'APPROVED',
    },
  });

  // MSIT: Calculator (APPROVED)
  await prisma.sellRequest.create({
    data: {
      user_id: arjunMSIT.id,
      college_id: colleges['MSIT'].id,
      product_id: products['Casio FX-991ES Plus'].id,
      condition: 'Like New',
      description: 'Hardly used, clean display.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80']),
      admin_buy_price: 550,
      admin_sell_price: 799,
      status: 'APPROVED',
    },
  });

  // Add 1 Pending Sell Request for Admin review demonstration
  await prisma.sellRequest.create({
    data: {
      user_id: arjunMSIT.id,
      college_id: colleges['MSIT'].id,
      product_id: products['Engineering Mathematics Book'].id,
      condition: 'Used',
      description: 'Notes written on pencil, very readable.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80']),
      admin_buy_price: 120,
      admin_sell_price: 299,
      status: 'PENDING',
    },
  });

  console.log('✅ Approved sell requests seeded for BPIT, MAIT, and MSIT.');

  // 6. Seed Sample Buy Request
  await prisma.buyRequest.create({
    data: {
      user_id: rahulBPIT.id,
      college_id: colleges['BPIT'].id,
      product_id: products['Casio FX-991ES Plus'].id,
      status: 'PENDING',
      notes: 'Need this urgently before end-term exams next week!',
    },
  });
  console.log('🛒 Sample buy request seeded.');

  // 7. Seed Sample Campus Hero Application
  await prisma.campusHeroApplication.create({
    data: {
      user_id: rahulBPIT.id,
      college_id: colleges['BPIT'].id,
      branch: 'Computer Science and Engineering',
      year: '3rd Year',
      phone: '9811223344',
      instagram: 'rahul_bpit',
      linkedin: 'https://linkedin.com/in/rahul-sharma',
      reason: 'Active in the college tech society and would love to help juniors buy and sell textbooks and gadgets safely.',
      status: 'PENDING',
    },
  });
  console.log('🦸 Sample Campus Hero application seeded.');

  console.log('\n🎉 CampusMart database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Admin Account: admin@campusmart.in / admin123 (BPIT)');
  console.log('Student BPIT:  rahul@bpit.ac.in   / student123 (BPIT)');
  console.log('Student MAIT:  priya@mait.ac.in   / student123 (MAIT)');
  console.log('Student MSIT:  arjun@msit.ac.in   / student123 (MSIT)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
