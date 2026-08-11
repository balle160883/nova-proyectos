import { Module } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { AutomationEvaluatorService } from './automation-evaluator.service';
import { AutomationExecutorService } from './automation-executor.service';

@Module({
  controllers: [AutomationsController],
  providers: [
    AutomationsService,
    AutomationEvaluatorService,
    AutomationExecutorService,
  ],
  exports: [AutomationsService],
})
export class AutomationsModule {}
