import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:board')
  handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    if (data?.boardId) {
      client.join(`board:${data.boardId}`);
      this.logger.log(`Client ${client.id} joined room board:${data.boardId}`);
      return { status: 'joined', boardId: data.boardId };
    }
  }

  @SubscribeMessage('leave:board')
  handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    if (data?.boardId) {
      client.leave(`board:${data.boardId}`);
      return { status: 'left', boardId: data.boardId };
    }
  }

  notifyBoardChange(boardId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`board:${boardId}`).emit(event, payload);
    }
  }
}
