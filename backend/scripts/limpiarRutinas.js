const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.rutinaDia.deleteMany({})
  .then(r => console.log('Rutinas borradas:', r.count))
  .finally(() => p.$disconnect());
