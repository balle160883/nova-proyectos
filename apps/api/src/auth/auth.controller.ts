import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, CreateUserDto, UpdateUserDto } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con Email y Contraseña (ej: ing.ballesteros16@gmail.com)' })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.loginWithPassword(body.email, body.password);
  }

  @Post('sso/entra-id')
  @ApiOperation({ summary: 'Login / Registro SSO vía Microsoft Entra ID (Azure AD)' })
  entraIdLogin(@Body() payload: { email: string; name: string; azureId?: string; avatarUrl?: string }) {
    return this.authService.handleEntraIdLogin(payload);
  }

  @Get('users')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener lista de usuarios registrados' })
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Post('users')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear nuevo usuario (SuperAdmin / Admin)' })
  createUser(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @Patch('users/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Editar usuario (Nombre, Email, Rol, Contraseña)' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar usuario' })
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
