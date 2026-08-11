import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';

export interface CreateMeetingDto {
  title: string;
  boardId: string;
  startTime: string;
  endTime: string;
  summary?: string;
  actionItems?: string[];
}

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardsService: BoardsService,
  ) {}

  async findByBoard(boardId: string) {
    return this.prisma.meeting.findMany({
      where: { boardId },
      include: { actionItems: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async create(dto: CreateMeetingDto) {
    const meeting = await this.prisma.meeting.create({
      data: {
        title: dto.title,
        boardId: dto.boardId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        summary: dto.summary,
        calendarEventId: `outlook-evt-${Date.now()}`,
        actionItems: {
          create: (dto.actionItems || []).map((text) => ({ text })),
        },
      },
      include: { actionItems: true },
    });

    return meeting;
  }

  async convertActionItemToTask(actionItemId: string, groupId: string, createdById: string, assigneeId?: string) {
    const actionItem = await this.prisma.meetingActionItem.findUnique({
      where: { id: actionItemId },
      include: { meeting: true },
    });

    if (!actionItem) throw new NotFoundException('Action item not found');

    // Create item in board
    const item = await this.boardsService.createItem({
      title: actionItem.text,
      boardId: actionItem.meeting.boardId,
      groupId,
      createdById,
      assignedToId: assigneeId,
      status: 'Not Started',
    });

    // Mark action item as converted
    await this.prisma.meetingActionItem.update({
      where: { id: actionItemId },
      data: {
        isConverted: true,
        itemId: item.id,
      },
    });

    return {
      message: 'Acuerdo de junta convertido en tarea asignable exitosamente',
      item,
    };
  }
}
