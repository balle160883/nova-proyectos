import { Injectable, Logger, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { signJwt } from '../common/jwt.util';
import * as crypto from 'crypto';

export interface CreateUserDto {
  email: string;
  name: string;
  password?: string;
  role?: string;
  teamId?: string;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  teamId?: string;
  avatarUrl?: string;
}

interface FailedAttempt {
  count: number;
  lockUntil?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private failedAttempts: Map<string, FailedAttempt> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  private hashPassword(password: string, customSalt?: string): string {
    const salt = customSalt || crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  private verifyPassword(password: string, storedHash: string): { isValid: boolean; needsRehash: boolean } {
    if (!storedHash) return { isValid: false, needsRehash: false };

    // Compatibilidad con hashes PBKDF2 antiguos sin salt dinámico
    if (!storedHash.includes(':')) {
      const legacyHash = crypto.pbkdf2Sync(password, 'monday_m365_salt_2026', 10000, 64, 'sha512').toString('hex');
      const isValid = storedHash === legacyHash;
      return { isValid, needsRehash: isValid };
    }

    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return { isValid: false, needsRehash: false };

    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    const bufDerived = Buffer.from(derivedKey, 'hex');
    const bufKey = Buffer.from(key, 'hex');

    if (bufDerived.length !== bufKey.length) {
      return { isValid: false, needsRehash: false };
    }

    const isValid = crypto.timingSafeEqual(bufDerived, bufKey);
    return { isValid, needsRehash: false };
  }

  private sanitizeUser(user: any) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async loginWithPassword(email: string, pass: string) {
    const cleanEmail = email.trim().toLowerCase();

    // Check brute force lockout
    const attempt = this.failedAttempts.get(cleanEmail);
    if (attempt && attempt.lockUntil && Date.now() < attempt.lockUntil) {
      const waitSeconds = Math.ceil((attempt.lockUntil - Date.now()) / 1000);
      throw new UnauthorizedException(`Demasiados intentos fallidos. Cuenta bloqueada temporalmente por ${waitSeconds} segundos.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { organization: true, team: true },
    });

    if (!user) {
      this.recordFailedAttempt(cleanEmail);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.passwordHash) {
      const { isValid, needsRehash } = this.verifyPassword(pass, user.passwordHash);
      if (!isValid) {
        this.recordFailedAttempt(cleanEmail);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Re-hash automático para cuentas legadas
      if (needsRehash) {
        const newHash = this.hashPassword(pass);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      }
    }

    // Reset failed attempts on success
    this.failedAttempts.delete(cleanEmail);

    const safeUser = this.sanitizeUser(user);
    const token = signJwt({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: safeUser,
    };
  }

  private recordFailedAttempt(email: string) {
    const current = this.failedAttempts.get(email) || { count: 0 };
    current.count += 1;

    if (current.count >= 5) {
      current.lockUntil = Date.now() + 5 * 60 * 1000; // 5 minutes lockout
      this.logger.warn(`BRUTE FORCE PROTECTION: Locked account ${email} for 5 minutes after ${current.count} failed attempts.`);
    }

    this.failedAttempts.set(email, current);
  }

  async handleEntraIdLogin(payload: { email: string; name: string; idToken?: string; azureId?: string; avatarUrl?: string }) {
    // PROTECCION DE CIBERSEGURIDAD: Prevenir bypass de autenticacion y suplantacion de identidad
    if (!payload.idToken || process.env.NODE_ENV === 'production') {
      this.logger.warn(`SECURITY ALERT: Intento de inicio de sesion SSO Entra ID no verificado para ${payload.email}. Rechazado.`);
      throw new UnauthorizedException(
        'El inicio de sesion SSO via Microsoft Entra ID requiere validacion criptografica del id_token firmado por Microsoft Azure. Por favor utilice inicio de sesion con correo y contrasena.',
      );
    }
    this.logger.log(`Processing Entra ID SSO login for email: ${payload.email}`);

    let user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      include: { organization: true, team: true },
    });

    if (!user) {
      let org = await this.prisma.organization.findFirst();
      if (!org) {
        org = await this.prisma.organization.create({
          data: { name: 'Caja Oblatos Ahorro y Crédito (CPO)', domain: 'cajaoblatos.com.mx' },
        });
      }

      let team = await this.prisma.team.findFirst();
      if (!team) {
        team = await this.prisma.team.create({
          data: { name: 'Departamento de Investigaciones CPO', organizationId: org.id },
        });
      }

      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          azureId: payload.azureId || `azure-${Date.now()}`,
          avatarUrl: payload.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
          role: 'MEMBER',
          organizationId: org.id,
          teamId: team.id,
        },
        include: { organization: true, team: true },
      });
    }

    const safeUser = this.sanitizeUser(user);
    const token = signJwt({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      accessToken: token,
      tokenType: 'Bearer',
      user: safeUser,
    };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        team: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((u) => this.sanitizeUser(u));
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException(`El correo '${dto.email}' ya está registrado.`);
    }

    let org = await this.prisma.organization.findFirst();
    let team = await this.prisma.team.findFirst();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: dto.password ? this.hashPassword(dto.password) : this.hashPassword('Seguridad2026@'),
        role: dto.role || 'MEMBER',
        avatarUrl: dto.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        organizationId: org?.id,
        teamId: dto.teamId || team?.id,
      },
      include: { team: true, organization: true },
    });

    return this.sanitizeUser(user);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        teamId: dto.teamId,
        avatarUrl: dto.avatarUrl,
        passwordHash: dto.password ? this.hashPassword(dto.password) : undefined,
      },
      include: { team: true, organization: true },
    });

    return this.sanitizeUser(updated);
  }

  async deleteUser(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.user.delete({ where: { id } });
    return { success: true, id };
  }
}
