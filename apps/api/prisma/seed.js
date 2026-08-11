const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function main() {
  console.log('🌱 Limpiando y re-sembrando base de datos Kore Suite con Proyectos Corporativos...');

  // Wipe old data to guarantee full removal of CPO / Investigaciones data
  await prisma.columnValue.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.column.deleteMany({});
  await prisma.automationLog.deleteMany({});
  await prisma.automation.deleteMany({});
  await prisma.meetingActionItem.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.organization.deleteMany({});

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Corporativo Kore Suite',
      domain: 'koresuite.com',
    },
  });

  // 2. Create Teams
  const teamProyectos = await prisma.team.create({
    data: {
      name: 'Dirección de Gestión de Proyectos',
      description: 'Coordinación estratégica, entregables y planeación corporativa',
      organizationId: org.id,
    },
  });

  const teamSistemas = await prisma.team.create({
    data: {
      name: 'Equipo de Tecnología & Sistemas M365',
      description: 'Desarrollo de software, automatizaciones e integración M365',
      organizationId: org.id,
    },
  });

  // 3. Create SuperAdmin User requested by user
  const userSuperAdmin = await prisma.user.create({
    data: {
      email: 'ing.ballesteros16@gmail.com',
      name: 'Ing. Ballesteros (SuperAdmin)',
      passwordHash: hashPassword('Seguridad2026@'),
      azureId: 'azure-user-ballesteros',
      role: 'SUPERADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      organizationId: org.id,
      teamId: teamProyectos.id,
    },
  });

  const userDiego = await prisma.user.create({
    data: {
      email: 'diego@m365corp.com',
      name: 'Diego Morales (Admin Proyectos)',
      passwordHash: hashPassword('Seguridad2026@'),
      azureId: 'azure-user-diego',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
      organizationId: org.id,
      teamId: teamProyectos.id,
    },
  });

  const userSofia = await prisma.user.create({
    data: {
      email: 'sofia.rodriguez@koresuite.com',
      name: 'Ing. Sofía Rodríguez (Líder de Proyectos)',
      passwordHash: hashPassword('Seguridad2026@'),
      azureId: 'azure-user-sofia',
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
      organizationId: org.id,
      teamId: teamProyectos.id,
    },
  });

  const userCarlos = await prisma.user.create({
    data: {
      email: 'carlos.mendoza@koresuite.com',
      name: 'Lic. Carlos Mendoza (Analista de Procesos)',
      passwordHash: hashPassword('Seguridad2026@'),
      azureId: 'azure-user-carlos',
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
      organizationId: org.id,
      teamId: teamProyectos.id,
    },
  });

  // ==========================================
  // TABLERO 1: GESTIÓN DE PROYECTOS ESTRATÉGICOS Q3
  // ==========================================
  const boardProyectos = await prisma.board.create({
    data: {
      title: '💼 Gestión de Proyectos Estratégicos Q3',
      description: 'Planificación, entregables corporativos y asignación de hitos operativos.',
      icon: 'layout',
      teamId: teamProyectos.id,
      createdById: userSuperAdmin.id,
      columns: {
        create: [
          { title: 'Proyecto / Entregable', type: 'TEXT', position: 0, width: 260 },
          { title: 'Responsable', type: 'USER', position: 1, width: 180 },
          { title: 'Estatus de Avance', type: 'STATUS', position: 2, width: 160, settingsJson: JSON.stringify({
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

  // Grupos Proyectos
  const groupPlanificacion = await prisma.group.create({
    data: {
      title: '📌 Fase 1: Planificación & Alcance',
      color: '#579BFC',
      position: 0,
      boardId: boardProyectos.id,
    },
  });

  const groupEjecucion = await prisma.group.create({
    data: {
      title: '🚀 Fase 2: Ejecución & Entregables',
      color: '#A54EE1',
      position: 1,
      boardId: boardProyectos.id,
    },
  });

  const groupCompletados = await prisma.group.create({
    data: {
      title: '✅ Fase 3: Hitos Completados',
      color: '#00C875',
      position: 2,
      boardId: boardProyectos.id,
    },
  });

  // Tareas Proyectos
  await prisma.item.create({
    data: {
      title: 'Elaborar propuesta ejecutiva de transformación digital corporativa',
      groupId: groupPlanificacion.id,
      boardId: boardProyectos.id,
      createdById: userSuperAdmin.id,
      assignedToId: userSofia.id,
      status: 'Not Started',
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
  });

  await prisma.item.create({
    data: {
      title: 'Revisión presupuestal y matriz de riesgos de entregables Q3',
      groupId: groupPlanificacion.id,
      boardId: boardProyectos.id,
      createdById: userSuperAdmin.id,
      assignedToId: userCarlos.id,
      status: 'Not Started',
      dueDate: new Date(Date.now() + 86400000 * 3),
    },
  });

  await prisma.item.create({
    data: {
      title: 'Implementación del plan de automatización de procesos internos',
      groupId: groupEjecucion.id,
      boardId: boardProyectos.id,
      createdById: userSuperAdmin.id,
      assignedToId: userSofia.id,
      status: 'In Progress',
      dueDate: new Date(Date.now() + 86400000 * 4),
    },
  });

  await prisma.item.create({
    data: {
      title: 'Auditoría de cumplimiento de estándares de calidad corporativos',
      groupId: groupEjecucion.id,
      boardId: boardProyectos.id,
      createdById: userSuperAdmin.id,
      assignedToId: userCarlos.id,
      status: 'Blocked',
      dueDate: new Date(Date.now() + 86400000 * 1),
    },
  });

  await prisma.item.create({
    data: {
      title: 'Aprobación final del manual de procedimientos operativos de proyectos',
      groupId: groupCompletados.id,
      boardId: boardProyectos.id,
      createdById: userSuperAdmin.id,
      assignedToId: userSofia.id,
      status: 'Completed',
      dueDate: new Date(Date.now() - 86400000 * 1),
    },
  });

  // Automatización Proyectos
  await prisma.automation.create({
    data: {
      title: '🚨 Notificar a Dirección si un entregable crítico se marca como BLOQUEADO',
      boardId: boardProyectos.id,
      triggerType: 'ITEM_STATUS_CHANGED',
      conditions: JSON.stringify([{ field: 'status', operator: 'equals', value: 'Blocked' }]),
      actions: JSON.stringify([
        {
          type: 'NOTIFY_TEAMS',
          payload: {
            channel: 'Alertas de Proyectos Kore Suite',
            message: '🚨 ¡Atención! Un entregable crítico requiere revisión inmediata.',
          },
        },
      ]),
    },
  });

  // Reunión Proyectos
  await prisma.meeting.create({
    data: {
      title: 'Junta de Coordinación y Avance de Proyectos Q3',
      boardId: boardProyectos.id,
      calendarEventId: 'outlook-evt-kore-101',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      summary: 'Revisión semanal de hitos corporativos, avance de entregables y resolución de bloqueos.',
      actionItems: {
        create: [
          { text: 'Finalizar propuesta ejecutiva para Comité Operativo', assigneeId: userSofia.id },
          { text: 'Actualizar matriz de riesgo con el equipo de finanzas', assigneeId: userCarlos.id },
        ],
      },
    },
  });

  // ==========================================
  // TABLERO 2: ROADMAP DE PLATAFORMA KORE SUITE
  // ==========================================
  const boardKore = await prisma.board.create({
    data: {
      title: '🚀 Lanzamiento Plataforma Kore Suite',
      description: 'Seguimiento de arquitectura de software, integración con Entra ID y Microsoft Graph API.',
      icon: 'layout',
      teamId: teamSistemas.id,
      createdById: userSuperAdmin.id,
      columns: {
        create: [
          { title: 'Tarea / Módulo', type: 'TEXT', position: 0, width: 240 },
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

  const groupKoreDev = await prisma.group.create({
    data: {
      title: 'Q3 — Backend & Arquitectura Core',
      color: '#579BFC',
      position: 0,
      boardId: boardKore.id,
    },
  });

  await prisma.item.create({
    data: {
      title: 'Despliegue de infraestructura en contenedores Docker y PostgreSQL',
      groupId: groupKoreDev.id,
      boardId: boardKore.id,
      createdById: userSuperAdmin.id,
      assignedToId: userDiego.id,
      status: 'Completed',
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
  });

  console.log('✅ Base de datos re-sembrada exitosamente con la marca e hitos de Kore Suite.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
