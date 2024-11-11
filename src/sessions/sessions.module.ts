import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session], 'sessionConnection')],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
