import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationsService } from '../automations/automations.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  CreateBoardDto,
  CreateGroupDto,
  CreateColumnDto,
  CreateItemDto,
  UpdateItemDto,
  SetColumnValueDto,
} from './dto/board.dtos';

@Injectable()
export class BoardsService {
  private readonly logger = new Logger(BoardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsService: AutomationsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async findAll() {
    return this.prisma.board.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        team: true,
        _count: { select: { items: true, groups: true, automations: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        team: true,
        columns: { orderBy: { position: 'asc' } },
        groups: {
          orderBy: { position: 'asc' },
          include: {
            items: {
              orderBy: { position: 'asc' },
              include: {
                assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
                createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
                columnValues: { include: { column: true } },
                subtasks: true,
              },
            },
          },
        },
        automations: true,
      },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    return board;
  }

  async createBoard(dto: CreateBoardDto) {
    const board = await this.prisma.board.create({
      data: {
        title: dto.title,
        description: dto.description,
        icon: dto.icon || 'layout',
        isPublic: dto.isPublic ?? true,
        teamId: dto.teamId,
        createdById: dto.createdById,
        columns: {
          create: [
            { title: 'Tarea / Caso', type: 'TEXT', position: 0, width: 220 },
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
            { title: 'Fecha Límite', type: 'DATE', position: 3, width: 150 },
          ],
        },
        groups: {
          create: [
            { title: 'Por Hacer', color: '#579BFC', position: 0 },
            { title: 'En Progreso', color: '#A54EE1', position: 1 },
            { title: 'Completados', color: '#00C875', position: 2 },
          ],
        },
      },
      include: { columns: true, groups: true },
    });

    return board;
  }

  async updateBoard(id: string, dto: { title?: string; description?: string; icon?: string }) {
    const board = await this.prisma.board.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        icon: dto.icon,
      },
    });
    this.realtime.notifyBoardChange(id, 'board:updated', board);
    return board;
  }

  async deleteBoard(id: string) {
    const board = await this.prisma.board.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Tablero no encontrado');

    try {
      // 1. Delete all nested column values & items
      await this.prisma.columnValue.deleteMany({ where: { item: { boardId: id } } });
      await this.prisma.item.deleteMany({ where: { boardId: id } });
      
      // 2. Delete all groups & columns
      await this.prisma.group.deleteMany({ where: { boardId: id } });
      await this.prisma.column.deleteMany({ where: { boardId: id } });

      // 3. Delete all automations and logs
      await this.prisma.automationLog.deleteMany({ where: { automation: { boardId: id } } });
      await this.prisma.automation.deleteMany({ where: { boardId: id } });

      // 4. Delete all meetings and action items
      await this.prisma.meetingActionItem.deleteMany({ where: { meeting: { boardId: id } } });
      await this.prisma.meeting.deleteMany({ where: { boardId: id } });

      // 5. Delete board itself
      await this.prisma.board.delete({ where: { id } });

      this.logger.log(`Board ${id} deleted cleanly with all child entities.`);
    } catch (err) {
      this.logger.error(`Error deleting board ${id}:`, err);
      // Fallback try deleting board directly if cascade is configured
      await this.prisma.board.delete({ where: { id } });
    }

    this.realtime.notifyBoardChange(id, 'board:deleted', { id });
    return { success: true, id };
  }

  async createGroup(dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        title: dto.title,
        color: dto.color || '#579BFC',
        boardId: dto.boardId,
      },
    });

    this.realtime.notifyBoardChange(dto.boardId, 'group:created', group);
    return group;
  }

  async createColumn(dto: CreateColumnDto) {
    const column = await this.prisma.column.create({
      data: {
        title: dto.title,
        type: dto.type,
        boardId: dto.boardId,
        settingsJson: dto.settingsJson,
      },
    });

    this.realtime.notifyBoardChange(dto.boardId, 'column:created', column);
    return column;
  }

  async createItem(dto: CreateItemDto) {
    const item = await this.prisma.item.create({
      data: {
        title: dto.title,
        groupId: dto.groupId,
        boardId: dto.boardId,
        createdById: dto.createdById,
        assignedToId: dto.assignedToId,
        status: dto.status || 'Not Started',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        parentId: dto.parentId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        columnValues: true,
      },
    });

    this.realtime.notifyBoardChange(dto.boardId, 'item:created', item);

    // Trigger automations for ITEM_CREATED
    await this.automationsService.handleItemEvent('ITEM_CREATED', item);

    return item;
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    const existing = await this.prisma.item.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Item ${id} not found`);

    const statusChanged = dto.status && dto.status !== existing.status;
    const assignedChanged = dto.assignedToId && dto.assignedToId !== existing.assignedToId;

    const item = await this.prisma.item.update({
      where: { id },
      data: {
        title: dto.title,
        groupId: dto.groupId,
        assignedToId: dto.assignedToId,
        status: dto.status,
        priority: dto.priority,
        budget: dto.budget,
        timerSeconds: dto.timerSeconds,
        attachments: dto.attachments,
        comments: dto.comments,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        columnValues: true,
      },
    });

    this.realtime.notifyBoardChange(item.boardId, 'item:updated', item);

    if (statusChanged) {
      this.logger.log(`Item status changed for '${item.title}' (${existing.status} -> ${item.status})`);
      await this.automationsService.handleItemEvent('ITEM_STATUS_CHANGED', item);
    }
    if (assignedChanged) {
      await this.automationsService.handleItemEvent('ITEM_ASSIGNED', item);
    }

    return item;
  }

  async deleteItem(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Item ${id} not found`);

    await this.prisma.item.delete({ where: { id } });
    this.realtime.notifyBoardChange(item.boardId, 'item:deleted', { id });
    return { success: true, id };
  }

  async setColumnValue(dto: SetColumnValueDto) {
    const valString = typeof dto.value === 'object' ? JSON.stringify(dto.value) : String(dto.value);

    const cv = await this.prisma.columnValue.upsert({
      where: {
        itemId_columnId: {
          itemId: dto.itemId,
          columnId: dto.columnId,
        },
      },
      update: {
        textValue: valString,
        jsonValue: typeof dto.value === 'object' ? JSON.stringify(dto.value) : null,
      },
      create: {
        itemId: dto.itemId,
        columnId: dto.columnId,
        textValue: valString,
        jsonValue: typeof dto.value === 'object' ? JSON.stringify(dto.value) : null,
      },
      include: { item: true },
    });

    this.realtime.notifyBoardChange(cv.item.boardId, 'column_value:updated', cv);
    return cv;
  }

  async exportBoard(id: string) {
    const board = await this.findOne(id);
    const groups = board.groups || [];
    const items = groups.flatMap((g) => g.items || []);

    const totalTasks = items.length;
    const completedTasks = items.filter((i) => i.status === 'Completed').length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      boardId: board.id,
      title: board.title,
      description: board.description,
      exportedAt: new Date().toISOString(),
      summary: {
        totalTasks,
        completedTasks,
        completionRatePct: completionRate,
      },
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        assignedTo: item.assignedTo ? item.assignedTo.name : null,
        dueDate: item.dueDate,
        budget: item.budget,
      })),
    };
  }
}
