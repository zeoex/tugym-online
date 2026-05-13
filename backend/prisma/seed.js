const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@gymapp.com' },
    update: {},
    create: { nombre: 'Administrador', email: 'admin@gymapp.com', passwordHash: hash, rol: 'ADMIN' },
  });

  await prisma.plan.createMany({
    data: [
      { nombre: 'Día libre', tipo: 'DIARIO',      duracionDias: 1,   precio: 500  },
      { nombre: 'Mensual',   tipo: 'MENSUAL',     duracionDias: 30,  precio: 5000 },
      { nombre: 'Trimestral',tipo: 'TRIMESTRAL',  duracionDias: 90,  precio: 12000},
      { nombre: 'Semestral', tipo: 'SEMESTRAL',   duracionDias: 180, precio: 22000},
      { nombre: 'Anual',     tipo: 'ANUAL',       duracionDias: 365, precio: 40000},
    ],
  });

  console.log('Seed completado. Usuario: admin@gymapp.com / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
