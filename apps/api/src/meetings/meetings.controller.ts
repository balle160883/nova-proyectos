import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MeetingsService, CreateMeetingDto } from './meetings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get('board/:boardId')
  @ApiOperation({ summary: 'Obtener reuniones y minutas de un tablero' })
  findByBoard(@Param('boardId') boardId: string) {
    return this.meetingsService.findByBoard(boardId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar nueva reunión / minuta' })
  create(@Body() dto: CreateMeetingDto) {
    return this.meetingsService.create(dto);
  }

  @Post('action-items/:id/convert')
  @ApiOperation({ summary: 'Convertir acuerdo de minuta directamente en tarea asignable en el tablero' })
  convertActionItem(
    @Param('id') id: string,
    @Body() body: { groupId: string; createdById: string; assigneeId?: string },
  ) {
    return this.meetingsService.convertActionItemToTask(id, body.groupId, body.createdById, body.assigneeId);
  }
}
