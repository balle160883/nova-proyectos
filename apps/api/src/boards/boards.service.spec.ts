import { Test, TestingModule } from '@nestjs/testing';
import { BoardsService } from './boards.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationsService } from '../automations/automations.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotFoundException } from '@nestjs/common';

describe('BoardsService (Unit Tests)', () => {
  let service: BoardsService;
  let prismaMock: any;
  let automationsMock: any;
  let realtimeMock: any;

  beforeEach(async () => {
    prismaMock = {
      board: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      item: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    automationsMock = {
      evaluateAndExecute: jest.fn(),
    };

    realtimeMock = {
      notifyBoardChange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AutomationsService, useValue: automationsMock },
        { provide: RealtimeGateway, useValue: realtimeMock },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('debe retornar un tablero cuando existe', async () => {
      const mockBoard = { id: 'board-1', title: 'Tablero Proyectos', groups: [], columns: [] };
      prismaMock.board.findUnique.mockResolvedValue(mockBoard);

      const result = await service.findOne('board-1');
      expect(result).toEqual(mockBoard);
      expect(prismaMock.board.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'board-1' } }),
      );
    });

    it('debe lanzar NotFoundException cuando el tablero no existe', async () => {
      prismaMock.board.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
