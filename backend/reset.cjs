const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const hashed = await bcrypt.hash('12345678', 10);
  const result = await prisma.hotel.updateMany({
    where: { ownerEmail: 'richardelikem31@gmail.com' },
    data: { password: hashed }
  });
  console.log(`Password reset. Updated ${result.count} records.`);
}

reset().catch(console.error).finally(() => prisma.$disconnect());
