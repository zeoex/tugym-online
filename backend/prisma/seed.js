const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// En producción se pasan por variable de entorno: nunca dejar el admin por defecto.
const email = process.env.ADMIN_EMAIL || 'admin@gymapp.com';
const password = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  const hash = await bcrypt.hash(password, 10);

  await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: { nombre: 'Administrador', email, passwordHash: hash, rol: 'ADMIN' },
  });

  // Idempotente: los planes no tienen constraint único, así que sin esto
  // correr el seed dos veces los duplica.
  const planesExistentes = await prisma.plan.count();
  if (planesExistentes === 0) {
    await prisma.plan.createMany({
      data: [
        { nombre: 'Día libre', tipo: 'DIARIO',      duracionDias: 1,   precio: 500  },
        { nombre: 'Mensual',   tipo: 'MENSUAL',     duracionDias: 30,  precio: 5000 },
        { nombre: 'Trimestral',tipo: 'TRIMESTRAL',  duracionDias: 90,  precio: 12000},
        { nombre: 'Semestral', tipo: 'SEMESTRAL',   duracionDias: 180, precio: 22000},
        { nombre: 'Anual',     tipo: 'ANUAL',       duracionDias: 365, precio: 40000},
      ],
    });
  } else {
    console.log(`Planes ya cargados (${planesExistentes}), no se tocan.`);
  }

  console.log(`Seed completado. Usuario: ${email}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
