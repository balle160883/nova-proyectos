import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GraphService, SyncCalendarDto } from './graph.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('microsoft-graph')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Post('calendar/sync-item')
  @ApiOperation({ summary: 'Sincronizar tarea con Outlook Calendar vía Microsoft Graph API' })
  syncCalendar(@Body() dto: SyncCalendarDto) {
    return this.graphService.syncTaskToOutlookCalendar(dto);
  }

  @Post('teams/notify')
  @ApiOperation({ summary: 'Enviar mensaje de notificación a canal de Microsoft Teams' })
  notifyTeams(@Body() body: { channelId: string; message: string }) {
    return this.graphService.sendTeamsNotification(body.channelId, body.message);
  }

  @Get('sharepoint/files')
  @ApiOperation({ summary: 'Obtener archivos sincronizados de SharePoint/OneDrive' })
  getFiles(@Query('folder') folder?: string) {
    return this.graphService.getSharePointFiles(folder);
  }
}
