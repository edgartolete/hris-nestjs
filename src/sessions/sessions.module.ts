import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { LoggerService } from 'src/logger/logger.service';

@Module({
  providers: [SessionsService, LoggerService],
  exports: [SessionsService],
})
export class SessionsModule {}
