const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { ensureDemoUser, DEMO_EMAIL, DEMO_PASSWORD } = require('../server/src/services/demoService');
const prisma = require('../server/src/lib/prisma');

async function main() {
  const user = await ensureDemoUser();
  console.log('Seeded demo user:', user.email);
  console.log('Demo login:', DEMO_EMAIL, '/', DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
