import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Microsoft Enterprise Corp',
      domain: 'm365corp.com',
    },
  });

  // Create Teams
  const teamDev = await prisma.team.create({
    data: {
      name: 'Equipo de Desarrollo & Producto',
      description: 'Ingeniería de software, UI/UX y QA',
      organizationId: org.id,
    },
  });

  const teamMarketing = await prisma.team.create({
    data: {
      name: 'Equipo de Marketing & Ventas',
      description: 'Campañas M365, eventos y conversión',
      organizationId: org.id,
    },
  });

  // Create Users
  const userDiego = await prisma.user.create({
    data: {
      email: 'diego@m365corp.com',
      name: 'Diego Morales',
      azureId: 'azure-user-diego',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      organizationId: org.id,
      teamId: teamDev.id,
    },
  });

  const userSofia = await prisma.user.create({
    data: {
      email: 'sofia.tech@m365corp.com',
      name: 'Sofía Rodríguez',
      azureId: 'azure-user-sofia',
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
      organizationId: org.id,
      teamId: teamDev.id,
    },
  });

  const userCarlos = await prisma.user.create({
    data: {
      email: 'carlos.mkt@m365corp.com',
      name: 'Carlos Mendoza',
      azureId: 'azure-user-carlos',
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
      organizationId: org.id,
      teamId: teamMarketing.id,
    },
  });

  // Create Main Board 1: "Lanzamiento Plataforma Monday M365"
  const board1 = await prisma.board.create({
    data: {
      title: '🚀 Lanzamiento Plataforma Monday M365',
      description: 'Seguimiento de roadmap de producto, integración con Entra ID y Microsoft Graph API.',
      icon: 'layout',
      teamId: teamDev.id,
      createdById: userDiego.id,
      columns: {
        create: [
          { title: 'Tarea', type: 'TEXT', position: 0, width: 240 },
          { title: 'Responsable', type: 'USER', position: 1, width: 160 },
          { title: 'Estatus', type: 'STATUS', position: 2, width: 160, settingsJson: JSON.stringify({
              options: [
                { label: 'Not Started', color: '#C4C4C4' },
                { label: 'In Progress', color: '#579BFC' },
                { label: 'Blocked', color: '#E2445C' },
                { label: 'Completed', color: '#00C875' },
              ]
            })
          },
          { title: 'Fecha Límite', type: 'DATE', position: 3, width: 160 },
        ],
      },
    },
  });

  // Create Groups for Board 1
  const group1 = await prisma.group.create({
    data: {
      title: 'Q3 — Backend & Arquitectura Core',
      color: '#579BFC',
      position: 0,
      boardId: board1.id,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      title: 'Q3 — Integraciones M365 (Teams & Outlook)',
      color: '#A54EE1',
      position: 1,
      boardId: board1.id,
    },
  });

  const group3 = await prisma.group.create({
    data: {
      title: 'Q4 — Entregables & Despliegue',
      color: '#00C875',
      position: 2,
      boardId: board1.id,
    },
  });

  // Create Items in Group 1
  const item1 = await prisma.item.create({
    data: {
      title: 'Diseñar arquitectura backend NestJS y esquema de PostgreSQL',
      groupId: group1.id,
      boardId: board1.id,
      createdById: userDiego.id,
      assignedToId: userDiego.id,
      status: 'Completed',
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
  });

  const item2 = await prisma.item.create({
    data: {
      title: 'Construir motor de automatizaciones sin código (Triggers & Actions)',
      groupId: group1.id,
      boardId: board1.id,
      createdById: userDiego.id,
      assignedToId: userSofia.id,
      status: 'In Progress',
      dueDate: new Date(Date.now() + 86400000 * 5),
    },
  });

  const item3 = await prisma.item.create({
    data: {
      title: 'Configurar WebSockets (Socket.IO) para colaboración en tiempo real',
      groupId: group1.id,
      boardId: board1.id,
      createdById: userDiego.id,
      assignedToId: userDiego.id,
      status: 'Not Started',
      dueDate: new Date(Date.now() + 86400000 * 7),
    },
  });

  // Create Items in Group 2
  await prisma.item.create({
    data: {
      title: 'Implementar SSO con Microsoft Entra ID (OAuth 2.0 / OIDC)',
      groupId: group2.id,
      boardId: board1.id,
      createdById: userSofia.id,
      assignedToId: userSofia.id,
      status: 'In Progress',
      dueDate: new Date(Date.now() + 86400000 * 3),
    },
  });

  await prisma.item.create({
    data: {
      title: 'Sincronizar tareas con Outlook Calendar vía Graph API',
      groupId: group2.id,
      boardId: board1.id,
      createdById: userDiego.id,
      assignedToId: userDiego.id,
      status: 'Not Started',
      dueDate: new Date(Date.now() + 86400000 * 6),
    },
  });

  await prisma.item.create({
    data: {
      title: 'Notificaciones automáticas a canales de Microsoft Teams',
      groupId: group2.id,
      boardId: board1.id,
      createdById: userDiego.id,
      assignedToId: userCarlos.id,
      status: 'Blocked',
      dueDate: new Date(Date.now() + 86400000 * 4),
    },
  });

  // Create Automations for Board 1
  await prisma.automation.create({
    data: {
      title: '🚨 Notificar en canal de Teams cuando una tarea se marque como BLOQUEADA',
      boardId: board1.id,
      triggerType: 'ITEM_STATUS_CHANGED',
      conditions: JSON.stringify([{ field: 'status', operator: 'equals', value: 'Blocked' }]),
      actions: JSON.stringify([
        {
          type: 'NOTIFY_TEAMS',
          payload: {
            channel: 'Proyectos / Alertas',
            message: '🚨 ¡Atención Equipo! La tarea ha cambiado su estado a BLOQUEADO.',
          },
        },
      ]),
    },
  });

  await prisma.automation.create({
    data: {
      title: '📅 Crear recordatorio en Outlook Calendar al crear una nueva tarea',
      boardId: board1.id,
      triggerType: 'ITEM_CREATED',
      conditions: JSON.stringify([]),
      actions: JSON.stringify([
        {
          type: 'CREATE_OUTLOOK_EVENT',
          payload: {},
        },
      ]),
    },
  });

  // Create Meeting for Board 1
  const meeting = await prisma.meeting.create({
    data: {
      title: 'Junta Semanal de Sincronización M365 & Roadmap',
      boardId: board1.id,
      calendarEventId: 'outlook-event-sync-101',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      summary: 'Revisión de avances del backend NestJS, reglas de automatización y próximos entregables para Teams.',
      actionItems: {
        create: [
          { text: 'Probar flujo SSO Entra ID con usuarios de prueba', assigneeId: userSofia.id },
          { text: 'Conectar WebSockets en frontend React', assigneeId: userDiego.id },
          { text: 'Crear plantilla de presentación para Microsoft Teams', assigneeId: userCarlos.id },
        ],
      },
    },
  });

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
