import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { ConfigifyModule } from '@itgorillaz/configify';

@Module({
  imports: [RedisModule, UsersModule, AuthModule, ConfigifyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
