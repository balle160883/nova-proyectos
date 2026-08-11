import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AutomationsService, CreateAutomationDto } from './automations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get('board/:boardId')
  @ApiOperation({ summary: 'Obtener automatizaciones por tablero' })
  findByBoard(@Param('boardId') boardId: string) {
    return this.automationsService.findByBoard(boardId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Obtener plantillas de automatizaciones reutilizables' })
  getTemplates() {
    return this.automationsService.getTemplates();
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva regla de automatización' })
  create(@Body() dto: CreateAutomationDto) {
    return this.automationsService.create(dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activar/desactivar regla de automatización' })
  toggle(@Param('id') id: string, @Body('isEnabled') isEnabled: boolean) {
    return this.automationsService.toggle(id, isEnabled);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar regla de automatización' })
  remove(@Param('id') id: string) {
    return this.automationsService.remove(id);
  }
}
