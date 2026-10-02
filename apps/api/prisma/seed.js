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
    path.join(__dirname, '..', '..', '..', 'Desarrollos', filename),
    path.join(__dirname, '..', '..', 'Desarrollos', filename),
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

  const statusColumnSettings = JSON.stringify({
    options: [
      { label: 'Not Started', color: '#94A3B8' },
      { label: 'In Progress', color: '#3B82F6' },
      { label: 'Blocked', color: '#EF4444' },
      { label: 'Completed', color: '#10B981' },
    ],
  });

  // Pre-load Attachments
  const attTabulador = getFileAttachment('DOCUMENTO_GESTION_PROYECTO_TABULADOR_CPO_PM.pdf', 'Dossier_Ejecutivo_Tabulador_Salarial_CPO.pdf');
  const attGCCPO = getFileAttachment('Documentacion_Ejecutiva_Proyecto_GCCPO_PM.pdf', 'Informe_Ejecutivo_Cobranza_GCCPO_VestaTrack.pdf');
  const attBarrioBot = getFileAttachment('Documentacion_Proyecto_Barrio_Bot_PM.pdf', 'Memoria_Tecnica_BarrioBot_Formato_Contraloria.pdf');
  const attETLCobranza = getFileAttachment('Documento_Ejecutivo_Proyecto_ETL_Cobranza.pdf', 'Informe_Arquitectura_ETL_Cobranza_Dual.pdf');
  const attAbogados = getFileAttachment('Documento_Tecnico_Ejecutivo_Proyecto_Abogados_PM.pdf', 'Memoria_Tecnica_Cobranza_Judicial_Abogados.pdf');
  const attGeoAuth = getFileAttachment('INFORME_EJECUTIVO_PROYECTO_GEOAUTH_OTP.pdf', 'Documento_Tecnico_GeoAuth_WhatsApp_OTP.pdf');
  const attIntegraHR = getFileAttachment('INFORME_EJECUTIVO_PROYECTO_INTEGRAHR_PM.pdf', 'Informe_Cierre_IntegraHR_57_Sucursales.pdf');
  const attInvestigaciones = getFileAttachment('Informe_Ejecutivo_Proyecto_CPO_Investigaciones.pdf', 'Informe_Ejecutivo_CPO_Investigaciones_Domiciliarias.pdf');
  const attPUI = getFileAttachment('documentacion_proyecto_pui_pm.pdf', 'Informe_Oficial_Interconexion_PUI_CNBV_SEGOB.pdf');

  // =========================================================================
  // TABLERO 1: PORTAFOLIO MAESTRO DE DESARROLLOS TECNOLÓGICOS & PMO
  // =========================================================================
  let masterBoard = await prisma.board.findFirst({
    where: { title: { contains: 'Portafolio Maestro de Desarrollos' } },
  });

  if (!masterBoard) {
    masterBoard = await prisma.board.create({
      data: {
        title: '🏛️ Portafolio Maestro de Desarrollos & PMO',
        description: 'Control directivo de los 9 proyectos de ingeniería de software, arquitectura de datos, biometría y cumplimiento regulatorio CPO.',
        icon: 'layout',
        teamId: teamPMO.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Proyecto / Iniciativa', type: 'TEXT', position: 0, width: 320 },
            { title: 'Responsable', type: 'USER', position: 1, width: 180 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 150, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 130 },
            { title: 'Fecha de Entrega', type: 'DATE', position: 4, width: 150 },
            { title: 'Presupuesto / Impacto', type: 'NUMBER', position: 5, width: 180 },
            { title: 'Horas Invertidas', type: 'NUMBER', position: 6, width: 140 },
          ],
        },
      },
    });
  }

  const existingMasterItems = await prisma.item.count({ where: { boardId: masterBoard.id } });
  if (existingMasterItems === 0) {
    const groupCobranza = await prisma.group.create({ data: { title: '💳 Cartera, Cobranza & Operación Financiera SIF', color: '#3B82F6', position: 0, boardId: masterBoard.id } });
    const groupHR = await prisma.group.create({ data: { title: '👥 Capital Humano, Nómina & Gobernanza Salarial', color: '#8B5CF6', position: 1, boardId: masterBoard.id } });
    const groupSeguridad = await prisma.group.create({ data: { title: '🛡️ Seguridad, Identidad & Cumplimiento Regulatorio CNBV', color: '#10B981', position: 2, boardId: masterBoard.id } });
    const groupOperaciones = await prisma.group.create({ data: { title: '📋 Auditoría, Mesa de Control & Operaciones de Campo', color: '#F59E0B', position: 3, boardId: masterBoard.id } });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-COB-2026] Sistema Integral de Cobranza y Cartera GC-CPO & Vesta Track 2.0',
        groupId: groupCobranza.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: diegoId,
        status: 'Completed',
        priority: 'Crítica',
        budget: 420000,
        timerSeconds: 400 * 3600,
        dueDate: new Date('2026-10-01T18:00:00Z'),
        attachments: attGCCPO ? JSON.stringify([attGCCPO]) : null,
        comments: JSON.stringify([{ id: 'c-101', text: '🎯 RESUMEN EJECUTIVO: Plataforma de misión crítica para recuperación de cartera. Web Next.js 14, API NestJS, App Vesta Track 2.0 APK. VPS Dokploy PostgreSQL 15.', userId: adminId, userName: 'Ing. Ballesteros (SuperAdmin)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-ETL-2026] Bridge ETL SIF & Sincronización Dual Dokploy VPS y Supabase Cloud',
        groupId: groupCobranza.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: diegoId,
        status: 'Completed',
        priority: 'Crítica',
        budget: 280000,
        timerSeconds: 220 * 3600,
        dueDate: new Date('2026-10-01T18:00:00Z'),
        attachments: attETLCobranza ? JSON.stringify([attETLCobranza]) : null,
        comments: JSON.stringify([{ id: 'c-102', text: '🎯 RESUMEN EJECUTIVO: ETL automatizado desde Core Bancario SIF. 3,600+ cuentas en <25s. Redundancia espejo dual y cero registros huérfanos.', userId: diegoId, userName: 'Diego Morales (Admin Proyectos)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-ABG-2026] Sistema de Cobranza Legal, Cartera Judicializada y Recuperación de Abogados',
        groupId: groupCobranza.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: adminId,
        status: 'Completed',
        priority: 'Crítica',
        budget: 5108000,
        timerSeconds: 352 * 3600,
        dueDate: new Date('2026-10-01T18:00:00Z'),
        attachments: attAbogados ? JSON.stringify([attAbogados]) : null,
        comments: JSON.stringify([{ id: 'c-103', text: '🎯 RESUMEN EJECUTIVO: Control de 5,108 cuentas en 12 despachos jurídicos. Aceleración de consultas de 2.5 min a 1.2s sin bloqueos (Zero-Locks).', userId: adminId, userName: 'Ing. Ballesteros (SuperAdmin)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-SAL-2026-V4] Gobernanza Salarial, Tabulador de 10 Niveles y Control Presupuestal',
        groupId: groupHR.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: sofiaId,
        status: 'Completed',
        priority: 'Crítica',
        budget: 6595402.20,
        timerSeconds: 280 * 3600,
        dueDate: new Date('2026-10-01T18:00:00Z'),
        attachments: attTabulador ? JSON.stringify([attTabulador]) : null,
        comments: JSON.stringify([{ id: 'c-104', text: '🎯 RESUMEN EJECUTIVO: Centralización de política salarial para 428 colaboradores. Dockerizado (Puerto 8085), RBAC 4 roles, PBKDF2 100k y simulación financiera.', userId: sofiaId, userName: 'Ing. Sofía Rodríguez (Líder de Proyectos)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-HR-2026] IntegraHR — Plataforma Centralizada de Capital Humano & 57 Biométricos Hikvision',
        groupId: groupHR.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: sofiaId,
        status: 'Completed',
        priority: 'Crítica',
        budget: 750000,
        timerSeconds: 380 * 3600,
        dueDate: new Date('2026-10-01T18:00:00Z'),
        attachments: attIntegraHR ? JSON.stringify([attIntegraHR]) : null,
        comments: JSON.stringify([{ id: 'c-105', text: '🎯 RESUMEN EJECUTIVO: 57 sucursales conectadas en red privada (172.28.x.x). Reducción de tiempo de corte de 3 días a 4 horas (85% ahorro).', userId: sofiaId, userName: 'Ing. Sofía Rodríguez (Líder de Proyectos)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-SEC-2026] GeoAuth WhatsApp OTP & Geocodificación Territorial ($0 OPEX)',
        groupId: groupSeguridad.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: adminId,
        status: 'Completed',
        priority: 'Alta',
        budget: 0,
        timerSeconds: 480 * 3600,
        dueDate: new Date('2026-10-02T18:00:00Z'),
        attachments: attGeoAuth ? JSON.stringify([attGeoAuth]) : null,
        comments: JSON.stringify([{ id: 'c-106', text: '🎯 RESUMEN EJECUTIVO: Prevención de fraude móvil vía WhatsApp Business Cloud API. Triangulación GPS W3C + Nominatim OSM. Costo base $0 USD.', userId: adminId, userName: 'Ing. Ballesteros (SuperAdmin)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-PUI-2026] Interconexión y Webhooks para Plataforma Única de Identidad (PUI - CNBV / SEGOB)',
        groupId: groupSeguridad.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: adminId,
        status: 'Completed',
        priority: 'Crítica',
        budget: 250000,
        timerSeconds: 136 * 3600,
        dueDate: new Date('2026-10-02T18:00:00Z'),
        attachments: attPUI ? JSON.stringify([attPUI]) : null,
        comments: JSON.stringify([{ id: 'c-107', text: '🎯 RESUMEN EJECUTIVO: Cumplimiento Ley LGMDFP DOF Nov 2025. FastAPI, Cifrado biométrico AES-256-GCM, Dual-Engine SQLite contingente.', userId: adminId, userName: 'Ing. Ballesteros (SuperAdmin)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-INV-2026] CPO Investigaciones — Estudios Socioeconómicos Domiciliarios & Monitoreo GPS',
        groupId: groupOperaciones.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: carlosId,
        status: 'Completed',
        priority: 'Alta',
        budget: 360000,
        timerSeconds: 340 * 3600,
        dueDate: new Date('2026-10-01T18:00:00Z'),
        attachments: attInvestigaciones ? JSON.stringify([attInvestigaciones]) : null,
        comments: JSON.stringify([{ id: 'c-108', text: '🎯 RESUMEN EJECUTIVO: +18,140 investigaciones socioeconómicas domiciliarias georreferenciadas. Vite SPA, React Native, Redis 7 y PostgreSQL 15.', userId: carlosId, userName: 'Lic. Carlos Mendoza (Analista de Procesos)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.item.create({
      data: {
        title: '[PRJ-CPO-BOT-2026] Barrio Bot Suite — Generador Automatizado de Formato de Entrega a Contraloría',
        groupId: groupOperaciones.id,
        boardId: masterBoard.id,
        createdById: adminId,
        assignedToId: carlosId,
        status: 'Completed',
        priority: 'Alta',
        budget: 0,
        timerSeconds: 144 * 3600,
        dueDate: new Date('2026-08-26T18:00:00Z'),
        attachments: attBarrioBot ? JSON.stringify([attBarrioBot]) : null,
        comments: JSON.stringify([{ id: 'c-109', text: '🎯 RESUMEN EJECUTIVO: Procesamiento Excel +14MB a PDF en <3 segundos (99.8% más rápido) con 100% exactitud en auditoría de Contraloría. 100% Client-Side Offline.', userId: carlosId, userName: 'Lic. Carlos Mendoza (Analista de Procesos)', createdAt: new Date().toISOString() }]),
      },
    });

    await prisma.automation.create({
      data: {
        title: '📢 Notificar a Dirección y PMO al liberar versión a PRODUCCIÓN',
        boardId: masterBoard.id,
        triggerType: 'ITEM_STATUS_CHANGED',
        conditions: JSON.stringify([{ field: 'status', operator: 'equals', value: 'Completed' }]),
        actions: JSON.stringify([
          {
            type: 'NOTIFY_TEAMS',
            payload: {
              channel: 'Comité de Dirección & PMO CPO',
              message: '🚀 ¡Hito Concluido! El desarrollo ha superado todas las pruebas y se encuentra operativo en PRODUCCIÓN.',
            },
          },
        ]),
      },
    });

    await prisma.meeting.create({
      data: {
        title: 'Comité Directivo: Cierre de Entregables de Software & Consolidación Q3/Q4',
        boardId: masterBoard.id,
        calendarEventId: 'outlook-evt-cpo-pmo-oct2026',
        startTime: new Date('2026-10-02T16:00:00Z'),
        endTime: new Date('2026-10-02T17:30:00Z'),
        summary: 'Presentación formal de los 9 proyectos de desarrollo de software y gobernanza tecnológica. Aprobación unánime de los dossiers ejecutivos de entrega y paso a régimen de producción continua.',
        actionItems: {
          create: [
            { text: 'Difundir manuales de usuario del Tabulador Salarial con Recursos Humanos', assigneeId: sofiaId, isConverted: true },
            { text: 'Mantener monitoreo de latencia en la réplica dual Dokploy/Supabase de Cobranza', assigneeId: diegoId, isConverted: true },
            { text: 'Formalizar entrega de cumplimiento regulatorio PUI ante la CNBV', assigneeId: adminId, isConverted: true },
          ],
        },
      },
    });
  }

  // =========================================================================
  // CREACIÓN DE LOS TABLEROS OPERATIVOS RESTANTES
  // =========================================================================

  // Tablero: 📊 Tabulador Salarial
  let boardTabulador = await prisma.board.findFirst({ where: { title: { contains: 'Tabulador Salarial' } } });
  if (!boardTabulador) {
    boardTabulador = await prisma.board.create({
      data: {
        title: '📊 Tabulador Salarial & Control Presupuestal CPO',
        description: 'Estandarización de 10 niveles, 428 colaboradores, salario diario y motor de simulación presupuestal.',
        icon: 'layout',
        teamId: teamPMO.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Paquete de Trabajo / Módulo', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const f1 = await prisma.group.create({ data: { title: 'WP-01 & WP-02: Normalización Salarial & Motor ETL', color: '#3B82F6', position: 0, boardId: boardTabulador.id } });
    const f2 = await prisma.group.create({ data: { title: 'WP-03 & WP-04: Frontend UX & Simulación Financiera', color: '#8B5CF6', position: 1, boardId: boardTabulador.id } });
    const f3 = await prisma.group.create({ data: { title: 'WP-05 & WP-06: Seguridad RBAC & Despliegue Docker (8085)', color: '#10B981', position: 2, boardId: boardTabulador.id } });
    await prisma.item.create({ data: { title: 'Estructuración matemática de 10 niveles con amplitudes del 50% y progresión probada', groupId: f1.id, boardId: boardTabulador.id, createdById: adminId, assignedToId: sofiaId, status: 'Completed', priority: 'Crítica', timerSeconds: 90 * 3600 } });
    await prisma.item.create({ data: { title: 'Cálculo del Salario Diario (SD = Sueldo/30) y sincronización de 428 colaboradores', groupId: f1.id, boardId: boardTabulador.id, createdById: adminId, assignedToId: carlosId, status: 'Completed', priority: 'Crítica', timerSeconds: 90 * 3600 } });
    await prisma.item.create({ data: { title: 'Interfaz gráfica reactiva React/Tailwind con KPIs en tiempo real de masa salarial', groupId: f2.id, boardId: boardTabulador.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Alta', timerSeconds: 50 * 3600 } });
    await prisma.item.create({ data: { title: 'Despliegue en contenedor Docker (Puerto 8085), script batch y respaldo UTF-8 BOM', groupId: f3.id, boardId: boardTabulador.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Crítica', timerSeconds: 50 * 3600 } });
  }

  // Tablero: 🚚 GC-CPO
  let boardGCCPO = await prisma.board.findFirst({ where: { title: { contains: 'GC-CPO & Vesta Track' } } });
  if (!boardGCCPO) {
    boardGCCPO = await prisma.board.create({
      data: {
        title: '🚚 GC-CPO & Vesta Track 2.0 (Dokploy VPS)',
        description: 'Recuperación de cartera en campo, backend NestJS, web Next.js 14 y móvil APK en VPS propio.',
        icon: 'layout',
        teamId: teamSistemas.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Entregable de Arquitectura', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const m1 = await prisma.group.create({ data: { title: 'Fase 1: Web de Supervisión & Asignación de Cartera', color: '#3B82F6', position: 0, boardId: boardGCCPO.id } });
    const m2 = await prisma.group.create({ data: { title: 'Fase 2: Backend NestJS & App Móvil Vesta Track 2.0', color: '#10B981', position: 1, boardId: boardGCCPO.id } });
    const m3 = await prisma.group.create({ data: { title: 'Fase 3: Triggers PL/pgSQL & Migración a Dokploy VPS', color: '#8B5CF6', position: 2, boardId: boardGCCPO.id } });
    await prisma.item.create({ data: { title: 'Portal directivo en Next.js 14 con filtros multicriterio por gestor y zona', groupId: m1.id, boardId: boardGCCPO.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Crítica', timerSeconds: 120 * 3600 } });
    await prisma.item.create({ data: { title: 'Compilación y distribución de APK móvil Vesta Track 2.0 con geolocalización de visitas', groupId: m2.id, boardId: boardGCCPO.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Crítica', timerSeconds: 150 * 3600 } });
    await prisma.item.create({ data: { title: 'Desacoplamiento total de Supabase y migración a Dokploy VPS PostgreSQL 15', groupId: m3.id, boardId: boardGCCPO.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Crítica', timerSeconds: 130 * 3600 } });
  }

  // Tablero: ⚖️ Cobranza Legal Abogados
  let boardAbogados = await prisma.board.findFirst({ where: { title: { contains: 'Cobranza Legal' } } });
  if (!boardAbogados) {
    boardAbogados = await prisma.board.create({
      data: {
        title: '⚖️ Cobranza Legal y Recuperación de Abogados',
        description: 'Gestión detallada de Sprints, consultas Zero-Locks (SIF) y expediente 360° para 12 despachos jurídicos.',
        icon: 'layout',
        teamId: teamSistemas.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Entregable / Historia de Usuario', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const s1 = await prisma.group.create({ data: { title: 'Sprint 1: Base de Datos Zero-Locks & Stored Procedures', color: '#3B82F6', position: 0, boardId: boardAbogados.id } });
    const s2 = await prisma.group.create({ data: { title: 'Sprint 2: Backend Node.js 20 & Motor de Sincronización', color: '#8B5CF6', position: 1, boardId: boardAbogados.id } });
    const s3 = await prisma.group.create({ data: { title: 'Sprint 3: Frontend Analítico Vite/React & Expediente 360°', color: '#10B981', position: 2, boardId: boardAbogados.id } });
    const s4 = await prisma.group.create({ data: { title: 'Sprint 4: Registro de Compromisos y Auditoría en Firme', color: '#F59E0B', position: 3, boardId: boardAbogados.id } });
    await prisma.item.create({ data: { title: 'Diseño de SPs con NOLOCK para lectura masiva sin bloqueos en Core SIF (172.28.155.13)', groupId: s1.id, boardId: boardAbogados.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Crítica', timerSeconds: 88 * 3600 } });
    await prisma.item.create({ data: { title: 'Pipeline asíncrono de extracción y normalización de 5,108 cuentas judiciales', groupId: s2.id, boardId: boardAbogados.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Crítica', timerSeconds: 90 * 3600 } });
    await prisma.item.create({ data: { title: 'Desarrollo de interfaz de visualización analítica Grafana-Style con Vite y React 18', groupId: s3.id, boardId: boardAbogados.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Alta', timerSeconds: 94 * 3600 } });
    await prisma.item.create({ data: { title: 'Módulo forense de captura de convenios de pago y cálculo de recuperación real', groupId: s4.id, boardId: boardAbogados.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Alta', timerSeconds: 80 * 3600 } });
  }

  // Tablero: ⚡ Bridge ETL SIF
  let boardETL = await prisma.board.findFirst({ where: { title: { contains: 'Bridge ETL SIF' } } });
  if (!boardETL) {
    boardETL = await prisma.board.create({
      data: {
        title: '⚡ Bridge ETL SIF & Sincronización Dual de Cobranza',
        description: 'Pipeline ETL asíncrono, réplica espejo Dokploy VPS y Supabase Cloud con cero huérfanos (<25s).',
        icon: 'layout',
        teamId: teamSistemas.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Pipeline / Componente', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const e1 = await prisma.group.create({ data: { title: 'Pipeline 1: Extracción Core SIF SQL Server', color: '#F59E0B', position: 0, boardId: boardETL.id } });
    const e2 = await prisma.group.create({ data: { title: 'Pipeline 2: Réplica Espejo Dual Dokploy / Supabase', color: '#3B82F6', position: 1, boardId: boardETL.id } });
    const e3 = await prisma.group.create({ data: { title: 'Pipeline 3: Seguridad RLS & Sanitización Excel', color: '#10B981', position: 2, boardId: boardETL.id } });
    await prisma.item.create({ data: { title: 'Extractor asíncrono de 3,600+ cuentas de cartera activa desde Core SIF en ciclos <25s', groupId: e1.id, boardId: boardETL.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Crítica', timerSeconds: 80 * 3600 } });
    await prisma.item.create({ data: { title: 'Worker de sincronización en tiempo real y algoritmo de conciliación de cero huérfanos', groupId: e2.id, boardId: boardETL.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Crítica', timerSeconds: 80 * 3600 } });
    await prisma.item.create({ data: { title: 'Políticas RLS en PostgreSQL y protección contra inyección de fórmulas en exportaciones', groupId: e3.id, boardId: boardETL.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Alta', timerSeconds: 60 * 3600 } });
  }

  // Tablero: 📱 GeoAuth
  let boardGeoAuth = await prisma.board.findFirst({ where: { title: { contains: 'GeoAuth' } } });
  if (!boardGeoAuth) {
    boardGeoAuth = await prisma.board.create({
      data: {
        title: '📱 GeoAuth WhatsApp OTP & Geocodificación Territorial',
        description: 'Ciclos de desarrollo Agile (6 Sprints), Graph API de WhatsApp, triangulación GPS W3C y hardening.',
        icon: 'layout',
        teamId: teamSistemas.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Módulo / Tarea Técnica', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const g1 = await prisma.group.create({ data: { title: 'Sprints 1 & 2: Identidad Prisma & WhatsApp Cloud API', color: '#10B981', position: 0, boardId: boardGeoAuth.id } });
    const g2 = await prisma.group.create({ data: { title: 'Sprints 3 & 4: Motor OTP Criptográfico & Geolocalización W3C/OSM', color: '#3B82F6', position: 1, boardId: boardGeoAuth.id } });
    const g3 = await prisma.group.create({ data: { title: 'Sprints 5 & 6: Seguridad Anti-Fraude, Docker & Producción', color: '#8B5CF6', position: 2, boardId: boardGeoAuth.id } });
    await prisma.item.create({ data: { title: 'Configuración de Templates de Autenticación en Meta Graph API y Webhooks en tiempo real', groupId: g1.id, boardId: boardGeoAuth.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Crítica', timerSeconds: 160 * 3600 } });
    await prisma.item.create({ data: { title: 'Implementación de algoritmo criptográfico OTP con tiempo de vida (TTL) y Reverse Geocoding OSM Nominatim', groupId: g2.id, boardId: boardGeoAuth.id, createdById: adminId, assignedToId: sofiaId, status: 'Completed', priority: 'Alta', timerSeconds: 160 * 3600 } });
    await prisma.item.create({ data: { title: 'Shift-Left Security: Rate limiting por IP/Teléfono, Dockerfile Enterprise y entrega a Producción', groupId: g3.id, boardId: boardGeoAuth.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Crítica', timerSeconds: 160 * 3600 } });
  }

  // Tablero: 🏢 IntegraHR
  let boardIntegraHR = await prisma.board.findFirst({ where: { title: { contains: 'IntegraHR' } } });
  if (!boardIntegraHR) {
    boardIntegraHR = await prisma.board.create({
      data: {
        title: '🏢 IntegraHR — Sincronización Biométrica & Capital Humano',
        description: 'Monitoreo de 57 sucursales Hikvision ISAPI, motor de deduplicación y reglas catorcenales.',
        icon: 'layout',
        teamId: teamPMO.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Hito Operativo', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const ih1 = await prisma.group.create({ data: { title: 'Fase 1: Red Privada & 57 Biométricos Hikvision ISAPI', color: '#F59E0B', position: 0, boardId: boardIntegraHR.id } });
    const ih2 = await prisma.group.create({ data: { title: 'Fase 2: Motor de Deduplicación 24/7 & PostgreSQL 16', color: '#3B82F6', position: 1, boardId: boardIntegraHR.id } });
    const ih3 = await prisma.group.create({ data: { title: 'Fase 3: Parametrización de Asistencia & Vales de Despensa', color: '#10B981', position: 2, boardId: boardIntegraHR.id } });
    await prisma.item.create({ data: { title: 'Sincronización de reloj y conciliación de husos horarios (CST vs MST) en las 57 sucursales', groupId: ih1.id, boardId: boardIntegraHR.id, createdById: adminId, assignedToId: sofiaId, status: 'Completed', priority: 'Crítica', timerSeconds: 120 * 3600 } });
    await prisma.item.create({ data: { title: 'Deduplicación continua y migración de base legada MySQL asistenciaiv a PostgreSQL 16', groupId: ih2.id, boardId: boardIntegraHR.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Alta', timerSeconds: 130 * 3600 } });
    await prisma.item.create({ data: { title: 'Motor de cálculo automático de incidencias y cierre de prenómina catorcenal en 4 horas', groupId: ih3.id, boardId: boardIntegraHR.id, createdById: adminId, assignedToId: sofiaId, status: 'Completed', priority: 'Crítica', timerSeconds: 130 * 3600 } });
  }

  // Tablero: 🔍 CPO Investigaciones
  let boardInv = await prisma.board.findFirst({ where: { title: { contains: 'CPO Investigaciones' } } });
  if (!boardInv) {
    boardInv = await prisma.board.create({
      data: {
        title: '🔍 CPO Investigaciones Domiciliarias & Auditoría Socioeconómica',
        description: 'Digitalización y monitoreo GPS de +18,140 estudios socioeconómicos para Solicitantes y Avales.',
        icon: 'layout',
        teamId: teamPMO.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Módulo / Capa del Sistema', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const i1 = await prisma.group.create({ data: { title: 'Fase 1: Infraestructura Dokploy PostgreSQL 15 & Redis 7', color: '#8B5CF6', position: 0, boardId: boardInv.id } });
    const i2 = await prisma.group.create({ data: { title: 'Fase 2: App Móvil para Investigadores de Campo', color: '#10B981', position: 1, boardId: boardInv.id } });
    const i3 = await prisma.group.create({ data: { title: 'Fase 3: Mesa de Control & Dictamen de Crédito', color: '#3B82F6', position: 2, boardId: boardInv.id } });
    await prisma.item.create({ data: { title: 'Modelo relacional y capa de caché en Redis para aceleración de consultas de investigaciones', groupId: i1.id, boardId: boardInv.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Alta', timerSeconds: 110 * 3600 } });
    await prisma.item.create({ data: { title: 'Aplicación React Native con captura de georreferencia, formularios dinámicos y fotos', groupId: i2.id, boardId: boardInv.id, createdById: adminId, assignedToId: carlosId, status: 'Completed', priority: 'Crítica', timerSeconds: 130 * 3600 } });
    await prisma.item.create({ data: { title: 'Portal web Vite SPA para auditoría, dictaminación y descarga ejecutiva de expedientes', groupId: i3.id, boardId: boardInv.id, createdById: adminId, assignedToId: carlosId, status: 'Completed', priority: 'Alta', timerSeconds: 100 * 3600 } });
  }

  // Tablero: 🏛️ Plataforma Única de Identidad (PUI)
  let boardPUI = await prisma.board.findFirst({ where: { title: { contains: 'Plataforma Única de Identidad' } } });
  if (!boardPUI) {
    boardPUI = await prisma.board.create({
      data: {
        title: '🏛️ Plataforma Única de Identidad (PUI CNBV/SEGOB)',
        description: 'Cumplimiento normativo oficial de la Ley LGMDFP (DOF Nov 2025). Webhooks, búsqueda 3 fases y AES-256-GCM.',
        icon: 'layout',
        teamId: teamSistemas.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Requerimiento Regulatorio / Módulo', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const p1 = await prisma.group.create({ data: { title: 'Sprint 1 & 2: Especificación SEGOB & Webhooks FastAPI', color: '#10B981', position: 0, boardId: boardPUI.id } });
    const p2 = await prisma.group.create({ data: { title: 'Sprint 3: Motor de Búsqueda Tripartita (Inmediata/12 Años/Continua)', color: '#3B82F6', position: 1, boardId: boardPUI.id } });
    const p3 = await prisma.group.create({ data: { title: 'Sprint 4 & 5: Cifrado AES-256-GCM & Dual-Engine SQLite Fallback', color: '#8B5CF6', position: 2, boardId: boardPUI.id } });
    await prisma.item.create({ data: { title: 'Implementación de receptor de webhooks FastAPI con validación criptográfica de firma', groupId: p1.id, boardId: boardPUI.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Crítica', timerSeconds: 50 * 3600 } });
    await prisma.item.create({ data: { title: 'Algoritmo de búsqueda automática en bases financieras de 12 años históricos', groupId: p2.id, boardId: boardPUI.id, createdById: adminId, assignedToId: adminId, status: 'Completed', priority: 'Crítica', timerSeconds: 46 * 3600 } });
    await prisma.item.create({ data: { title: 'Cifrado de campos sensibles y arquitectura dual-engine con SQLite de contingencia', groupId: p3.id, boardId: boardPUI.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Crítica', timerSeconds: 40 * 3600 } });
  }

  // Tablero: 🤖 Barrio Bot Suite
  let boardBarrioBot = await prisma.board.findFirst({ where: { title: { contains: 'Barrio Bot Suite' } } });
  if (!boardBarrioBot) {
    boardBarrioBot = await prisma.board.create({
      data: {
        title: '🤖 Barrio Bot Suite — Formato de Entrega a Contraloría',
        description: 'Procesamiento masivo de archivos Excel multi-hoja (+14MB) a PDF en <3 segundos. 100% Client-Side Offline ($0 OPEX).',
        icon: 'layout',
        teamId: teamPMO.id,
        createdById: adminId,
        columns: {
          create: [
            { title: 'Entregable Scrumban', type: 'TEXT', position: 0, width: 280 },
            { title: 'Responsable', type: 'USER', position: 1, width: 170 },
            { title: 'Estatus', type: 'STATUS', position: 2, width: 140, settingsJson: statusColumnSettings },
            { title: 'Prioridad', type: 'TEXT', position: 3, width: 120 },
            { title: 'Fecha Límite', type: 'DATE', position: 4, width: 140 },
          ],
        },
      },
    });
    const b1 = await prisma.group.create({ data: { title: 'Fase 1: Parser Multi-Hoja & Auditoría Contable', color: '#F59E0B', position: 0, boardId: boardBarrioBot.id } });
    const b2 = await prisma.group.create({ data: { title: 'Fase 2: Motor Vectorial PDF Instantáneo (<3s)', color: '#3B82F6', position: 1, boardId: boardBarrioBot.id } });
    const b3 = await prisma.group.create({ data: { title: 'Fase 3: Validación Contraloría & Cero Costo OPEX ($0.00)', color: '#10B981', position: 2, boardId: boardBarrioBot.id } });
    await prisma.item.create({ data: { title: 'Motor de extracción y cálculo de pólizas sin margen de error en subtotales o folios', groupId: b1.id, boardId: boardBarrioBot.id, createdById: adminId, assignedToId: carlosId, status: 'Completed', priority: 'Alta', timerSeconds: 60 * 3600 } });
    await prisma.item.create({ data: { title: 'Generación directa de formato de entrega oficial en PDF vectorizado de alta fidelidad', groupId: b2.id, boardId: boardBarrioBot.id, createdById: adminId, assignedToId: diegoId, status: 'Completed', priority: 'Alta', timerSeconds: 50 * 3600 } });
    await prisma.item.create({ data: { title: 'Certificación operativa por Contraloría y empaquetado autónomo 100% offline', groupId: b3.id, boardId: boardBarrioBot.id, createdById: adminId, assignedToId: carlosId, status: 'Completed', priority: 'Media', timerSeconds: 34 * 3600 } });
  }

  console.log('✅ Base de datos verificada y poblada con 10 tableros reales.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
