import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateBoardDto,
  CreateGroupDto,
  CreateColumnDto,
  CreateItemDto,
  UpdateItemDto,
  SetColumnValueDto,
} from './dto/board.dtos';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tableros' })
  findAll() {
    return this.boardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tablero por ID con grupos, columnas e ítems' })
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(id);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Exportar estructura y métricas del tablero en formato estructurado' })
  exportBoard(@Param('id') id: string) {
    return this.boardsService.exportBoard(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo tablero' })
  createBoard(@Body() dto: CreateBoardDto) {
    return this.boardsService.createBoard(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar título o descripción del tablero' })
  updateBoard(@Param('id') id: string, @Body() body: { title?: string; description?: string; icon?: string }) {
    return this.boardsService.updateBoard(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tablero completo' })
  deleteBoard(@Param('id') id: string) {
    return this.boardsService.deleteBoard(id);
  }

  @Post('groups')
  @ApiOperation({ summary: 'Crear nuevo grupo de tareas en un tablero' })
  createGroup(@Body() dto: CreateGroupDto) {
    return this.boardsService.createGroup(dto);
  }

  @Post('columns')
  @ApiOperation({ summary: 'Agregar nueva columna a un tablero' })
  createColumn(@Body() dto: CreateColumnDto) {
    return this.boardsService.createColumn(dto);
  }

  @Post('items')
  @ApiOperation({ summary: 'Crear nueva tarea / ítem' })
  createItem(@Body() dto: CreateItemDto) {
    return this.boardsService.createItem(dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Actualizar tarea (estatus, asignación, grupo, fecha)' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.boardsService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Eliminar tarea' })
  deleteItem(@Param('id') id: string) {
    return this.boardsService.deleteItem(id);
  }

  @Post('column-values')
  @ApiOperation({ summary: 'Actualizar valor de columna personalizada para un ítem' })
  setColumnValue(@Body() dto: SetColumnValueDto) {
    return this.boardsService.setColumnValue(dto);
  }
}
