import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AuthModule } from './auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { AutomationsModule } from './automations/automations.module';
import { GraphModule } from './graph/graph.module';
import { MeetingsModule } from './meetings/meetings.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    BoardsModule,
    AutomationsModule,
    GraphModule,
    MeetingsModule,
    HealthModule,
  ],
})
export class AppModule {}
