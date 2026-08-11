import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationEvaluatorService } from './automation-evaluator.service';
import { AutomationExecutorService } from './automation-executor.service';

export interface CreateAutomationDto {
  title: string;
  boardId: string;
  triggerType: string;
  triggerConfig?: any;
  conditions?: any;
  actions: any;
}

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluator: AutomationEvaluatorService,
    private readonly executor: AutomationExecutorService,
  ) {}

  async findByBoard(boardId: string) {
    return this.prisma.automation.findMany({
      where: { boardId },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateAutomationDto) {
    return this.prisma.automation.create({
      data: {
        title: dto.title,
        boardId: dto.boardId,
        triggerType: dto.triggerType,
        triggerConfig: dto.triggerConfig ? JSON.stringify(dto.triggerConfig) : null,
        conditions: dto.conditions ? JSON.stringify(dto.conditions) : null,
        actions: JSON.stringify(dto.actions),
      },
    });
  }

  async toggle(id: string, isEnabled: boolean) {
    return this.prisma.automation.update({
      where: { id },
      data: { isEnabled },
    });
  }

  async remove(id: string) {
    return this.prisma.automation.delete({
      where: { id },
    });
  }

  // Trigger evaluation hook called on item change/create
  async handleItemEvent(event: 'ITEM_STATUS_CHANGED' | 'ITEM_CREATED' | 'ITEM_ASSIGNED', item: any) {
    const automations = await this.prisma.automation.findMany({
      where: {
        boardId: item.boardId,
        triggerType: event,
        isEnabled: true,
      },
    });

    this.logger.log(`Found ${automations.length} active automation(s) for event ${event} on board ${item.boardId}`);

    for (const auto of automations) {
      const match = this.evaluator.evaluateConditions(auto.conditions, item);
      if (match) {
        this.logger.log(`Automation rule '${auto.title}' matched! Triggering actions...`);
        await this.executor.executeActions(auto.actions, item, auto.id);
      } else {
        this.logger.log(`Automation rule '${auto.title}' conditions did not match. Skipping.`);
      }
    }
  }

  getTemplates() {
    return [
      {
        id: 'tmpl-1',
        title: 'Cuando el estatus cambia a "Bloqueado" → Notificar en Microsoft Teams',
        triggerType: 'ITEM_STATUS_CHANGED',
        conditions: [{ field: 'status', operator: 'equals', value: 'Bloqueado' }],
        actions: [
          {
            type: 'NOTIFY_TEAMS',
            payload: {
              channel: 'General / Proyectos',
              message: '🚨 ¡Atención! Una tarea ha sido marcada como BLOQUEADA.',
            },
          },
        ],
      },
      {
        id: 'tmpl-2',
        title: 'Cuando se crea una tarea → Crear evento recordatorio en Outlook Calendar',
        triggerType: 'ITEM_CREATED',
        conditions: [],
        actions: [
          {
            type: 'CREATE_OUTLOOK_EVENT',
            payload: {},
          },
        ],
      },
      {
        id: 'tmpl-3',
        title: 'Cuando la tarea pasa a "Completado" → Mover al grupo "Entregados"',
        triggerType: 'ITEM_STATUS_CHANGED',
        conditions: [{ field: 'status', operator: 'equals', value: 'Completado' }],
        actions: [
          {
            type: 'MOVE_ITEM_GROUP',
            payload: { groupId: 'completed-group-id' },
          },
        ],
      },
    ];
  }
}
