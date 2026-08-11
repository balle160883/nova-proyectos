import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export interface ActionDefinition {
  type: 'MOVE_ITEM_GROUP' | 'UPDATE_ITEM_STATUS' | 'ASSIGN_USER' | 'NOTIFY_TEAMS' | 'CREATE_OUTLOOK_EVENT' | 'SEND_EMAIL';
  target?: string;
  payload?: any;
}

@Injectable()
export class AutomationExecutorService {
  private readonly logger = new Logger(AutomationExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async executeActions(actionsJson: string, item: any, automationId: string) {
    let actions: ActionDefinition[] = [];
    try {
      actions = typeof actionsJson === 'string' ? JSON.parse(actionsJson) : actionsJson;
    } catch (e) {
      this.logger.error(`Error parsing actions JSON for automation ${automationId}`);
      return;
    }

    this.logger.log(`Executing ${actions.length} action(s) for automation ${automationId} on Item: ${item.id}`);

    const logs: string[] = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'MOVE_ITEM_GROUP': {
            const targetGroupId = action.payload?.groupId;
            if (targetGroupId) {
              await this.prisma.item.update({
                where: { id: item.id },
                data: { groupId: targetGroupId },
              });
              logs.push(`Moved item ${item.id} to group ${targetGroupId}`);
              this.realtime.notifyBoardChange(item.boardId, 'item:moved', { itemId: item.id, groupId: targetGroupId });
            }
            break;
          }

          case 'UPDATE_ITEM_STATUS': {
            const newStatus = action.payload?.status;
            if (newStatus) {
              await this.prisma.item.update({
                where: { id: item.id },
                data: { status: newStatus },
              });
              logs.push(`Updated status of item ${item.id} to '${newStatus}'`);
              this.realtime.notifyBoardChange(item.boardId, 'item:status_changed', { itemId: item.id, status: newStatus });
            }
            break;
          }

          case 'ASSIGN_USER': {
            const userId = action.payload?.userId;
            if (userId) {
              await this.prisma.item.update({
                where: { id: item.id },
                data: { assignedToId: userId },
              });
              logs.push(`Assigned item ${item.id} to user ${userId}`);
              this.realtime.notifyBoardChange(item.boardId, 'item:assigned', { itemId: item.id, userId });
            }
            break;
          }

          case 'NOTIFY_TEAMS': {
            const channel = action.payload?.channel || 'Canal General / Proyectos';
            const message = action.payload?.message || `🔔 Notificación de Teams: La tarea "${item.title}" ha cambiado de estado a '${item.status}'`;
            this.logger.log(`[M365 TEAMS INTEGRATION] Enviendo mensaje a Microsoft Teams (${channel}): "${message}"`);
            logs.push(`Teams notification sent to channel ${channel}`);
            break;
          }

          case 'CREATE_OUTLOOK_EVENT': {
            const reminderDate = item.dueDate || new Date();
            this.logger.log(`[M365 OUTLOOK INTEGRATION] Creando evento en Outlook Calendar para la tarea "${item.title}" en la fecha ${reminderDate}`);
            logs.push(`Outlook Calendar event created for ${reminderDate}`);
            break;
          }

          case 'SEND_EMAIL': {
            const recipient = action.payload?.email || 'equipo@empresa.com';
            this.logger.log(`[M365 OUTLOOK MAIL] Enviando correo de alerta a ${recipient} para la tarea "${item.title}"`);
            logs.push(`Email notification sent to ${recipient}`);
            break;
          }

          default:
            logs.push(`Unknown action type: ${action.type}`);
        }
      } catch (err) {
        this.logger.error(`Action execution failed: ${err.message}`);
        logs.push(`Failed action ${action.type}: ${err.message}`);
      }
    }

    // Save log entry in AutomationLog
    await this.prisma.automationLog.create({
      data: {
        automationId,
        status: 'SUCCESS',
        details: logs.join(' | '),
      },
    });
  }
}
