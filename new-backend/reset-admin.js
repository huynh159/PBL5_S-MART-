const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smart.com' },
    update: {
      password: hash,
      role: 'ADMIN',
      status: 'ACTIVE'
    },
    create: {
      email: 'admin@smart.com',
      password: hash,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('Admin password updated to 123456');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
