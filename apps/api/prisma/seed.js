const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

// Helper to load file as base64 data url
function getFileAttachment(filename, displayName) {
  const possiblePaths = [
    path.join('/app/Desarrollos', filename),
    path.join(__dirname, '..', '..', 'Desarrollos', filename),
    path.join(__dirname, '..', '..', '..', 'Desarrollos', filename),
    path.join(process.cwd(), 'Desarrollos', filename),
    path.join('F:\\monday-propio\\Desarrollos', filename),
  ];

  let filePath = possiblePaths.find((p) => fs.existsSync(p));
  if (!filePath) {
    return null;
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const sizeKb = Math.round(fileBuffer.length / 1024);

    return {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: displayName || filename,
      url: `data:application/pdf;base64,${base64Data}`,
      size: `${sizeKb} KB`,
    };
  } catch (e) {
    console.warn(`Error reading file ${filename}:`, e.message);
    return null;
  }
}

async function main() {
  console.log('🌱 Inicializando / Actualizando base de datos corporativa con información 100% real...');

  // 1. Organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Caja Popular Oblatos S.C. de A.P. de R.L. de C.V.',
        domain: 'cajapopularoblatos.com.mx',
      },
    });
  }

  // 2. Teams
  let teamPMO = await prisma.team.findFirst({ where: { name: { contains: 'Proyectos' } } });
  if (!teamPMO) {
    teamPMO = await prisma.team.create({
      data: {
        name: 'Oficina de Gestión de Proyectos (PMO) & Dirección',
        description: 'Coordinación estratégica, entregables corporativos y planeación',
        organizationId: org.id,
      },
    });
  }

  let teamSistemas = await prisma.team.findFirst({ where: { name: { contains: 'Tecnología' } } });
  if (!teamSistemas) {
    teamSistemas = await prisma.team.create({
      data: {
        name: 'Ingeniería de Software & Arquitectura de Sistemas',
        description: 'Desarrollo de software, automatizaciones y arquitectura de microservicios',
        organizationId: org.id,
      },
    });
  }

  // 3. Users
  let userSuperAdmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
  if (!userSuperAdmin) {
    userSuperAdmin = await prisma.user.create({
      data: {
        email: 'ing.ballesteros16@gmail.com',
        name: 'Ing. Ballesteros (SuperAdmin)',
        passwordHash: hashPassword('Seguridad2026@'),
        azureId: 'azure-user-ballesteros',
        role: 'SUPERADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        organizationId: org.id,
        teamId: teamPMO.id,
      },
    });
  }

  let userDiego = await prisma.user.findFirst({ where: { email: { contains: 'diego' } } });
  if (!userDiego) {
    userDiego = await prisma.user.create({
      data: {
        email: 'diego@m365corp.com',
        name: 'Diego Morales (Admin Proyectos)',
        passwordHash: hashPassword('Seguridad2026@'),
        azureId: 'azure-user-diego',
        role: 'ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
        organizationId: org.id,
        teamId: teamPMO.id,
      },
    });
  }

  let userSofia = await prisma.user.findFirst({ where: { email: { contains: 'sofia' } } });
  if (!userSofia) {
    userSofia = await prisma.user.create({
      data: {
        email: 'sofia.rodriguez@koresuite.com',
        name: 'Ing. Sofía Rodríguez (Líder de Proyectos)',
        passwordHash: hashPassword('Seguridad2026@'),
        azureId: 'azure-user-sofia',
        role: 'MEMBER',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
        organizationId: org.id,
        teamId: teamPMO.id,
      },
    });
  }

  let userCarlos = await prisma.user.findFirst({ where: { email: { contains: 'carlos' } } });
  if (!userCarlos) {
    userCarlos = await prisma.user.create({
      data: {
        email: 'carlos.mendoza@koresuite.com',
        name: 'Lic. Carlos Mendoza (Analista de Procesos)',
        passwordHash: hashPassword('Seguridad2026@'),
        azureId: 'azure-user-carlos',
        role: 'MEMBER',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
        organizationId: org.id,
        teamId: teamPMO.id,
      },
    });
  }

  const adminId = userSuperAdmin.id;
  const sofiaId = userSofia.id;
  const diegoId = userDiego.id;
  const carlosId = userCarlos.id;

  // Eliminar cualquier tablero de prueba residual si existiera
  const mockBoards = await prisma.board.findMany({
    where: {
      OR: [
        { title: { contains: 'Gestión de Proyectos Estratégicos Q3' } },
        { title: { contains: 'Lanzamiento Plataforma Kore Suite' } },
      ],
    },
  });
  for (const mb of mockBoards) {
    await prisma.meetingActionItem.deleteMany({ where: { meeting: { boardId: mb.id } } });
    await prisma.meeting.deleteMany({ where: { boardId: mb.id } });
    await prisma.automationLog.deleteMany({ where: { automation: { boardId: mb.id } } });
    await prisma.automation.deleteMany({ where: { boardId: mb.id } });
    await prisma.columnValue.deleteMany({ where: { item: { boardId: mb.id } } });
    await prisma.item.deleteMany({ where: { boardId: mb.id } });
    await prisma.group.deleteMany({ where: { boardId: mb.id } });
    await prisma.column.deleteMany({ where: { boardId: mb.id } });
    await prisma.board.delete({ where: { id: mb.id } });
  }

  console.log('✅ Base de datos verificada y limpia de datos de prueba.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
