import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/db';

async function main() {
  const email = 'manager.bpit@campusmart.in';
  const password = process.env.MANAGER_PASSWORD;

  if (!password) {
    throw new Error('MANAGER_PASSWORD is missing.');
  }

  const college = await prisma.college.findUnique({
    where: { code: 'BPIT' },
  });

  if (!college) {
    throw new Error('BPIT college not found.');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing && existing.role !== 'HERO_MANAGER') {
    throw new Error(
      'This email belongs to a different account role.'
    );
  }

  const password_hash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const manager = await tx.user.upsert({
      where: { email },

      update: {
        password_hash,
      },

      create: {
        name: 'BPIT Hero Manager',
        email,
        password_hash,
        phone: '0000000000',
        college_id: college.id,
        role: 'HERO_MANAGER',
      },
    });

    await tx.heroManagerAssignment.upsert({
      where: {
        user_id_college_id: {
          user_id: manager.id,
          college_id: college.id,
        },
      },

      update: {
        is_active: true,
      },

      create: {
        user_id: manager.id,
        college_id: college.id,
        is_active: true,
      },
    });
  });

  console.log('Manager account is ready!');
  console.log('Email:', email);
  console.log('College: BPIT');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });