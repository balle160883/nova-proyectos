import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      team: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('loginWithPassword', () => {
    it('debe autenticar correctamente a un usuario con hash de contraseña válido', async () => {
      // Create user with scrypt hash (salt:derivedKey)
      const mockUser = {
        id: 'user-1',
        email: 'test@empresa.com',
        name: 'Usuario Test',
        role: 'ADMIN',
        passwordHash: '8a9f0b1c2d3e4f5a6b7c8d9e0f1a2b3c:4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      // Spy on private verifyPassword
      jest.spyOn(service as any, 'verifyPassword').mockReturnValue({
        isValid: true,
        needsRehash: false,
      });

      const result = await service.loginWithPassword('test@empresa.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('test@empresa.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('debe migrar automáticamente una contraseña legada (PBKDF2) a scrypt tras login exitoso', async () => {
      const mockUser = {
        id: 'user-legacy',
        email: 'legacy@empresa.com',
        name: 'Usuario Legado',
        role: 'MEMBER',
        passwordHash: 'legacy_pbkdf2_hash_without_colon',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      jest.spyOn(service as any, 'verifyPassword').mockReturnValue({
        isValid: true,
        needsRehash: true,
      });

      await service.loginWithPassword('legacy@empresa.com', 'password123');

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-legacy' },
          data: expect.objectContaining({
            passwordHash: expect.stringContaining(':'),
          }),
        }),
      );
    });

    it('debe bloquear temporalmente una cuenta tras 5 intentos fallidos de login', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      // 4 intentos fallidos
      for (let i = 0; i < 4; i++) {
        await expect(service.loginWithPassword('brute@test.com', 'badpass')).rejects.toThrow(UnauthorizedException);
      }

      // El 5to intento debe activar el bloqueo anti brute-force
      await expect(service.loginWithPassword('brute@test.com', 'badpass')).rejects.toThrow(UnauthorizedException);

      // Intentos posteriores dentro del periodo de bloqueo deben denegarse con mensaje de cuenta bloqueada
      await expect(service.loginWithPassword('brute@test.com', 'badpass')).rejects.toThrow(
        /Demasiados intentos fallidos/,
      );
    });
  });
});
