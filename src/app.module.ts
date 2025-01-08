import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { SessionsModule } from './sessions/sessions.module';
import { Session } from './sessions/session.entity';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UtilsService } from './utils/utils.service';
import { LoggerService } from './logger/logger.service';
import { Logger } from './logger/logger.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron/cron.service';
import { RolesModule } from './roles/roles.module';
import { GroupsModule } from './groups/groups.module';
import { PermissionsModule } from './permissions/permissions.module';
import { Role } from './roles/entities/role.entity';
import { Permission } from './permissions/entities/permission.entity';
import { Group } from './groups/entities/group.entity';
import { Membership } from './memberships/entities/membership.entity';
import { MembershipsModule } from './memberships/memberships.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      // importing it on top level will make it available to all modules/services
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('MYSQL_ROOT_PASSWORD'),
        database: configService.get('MYSQL_DATABASE'),
        entities: [User, Session, Logger, Role, Permission, Group, Membership],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    AuthModule,
    UsersModule,
    SessionsModule,
    RolesModule,
    GroupsModule,
    PermissionsModule,
    MembershipsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    UtilsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    CronService,
  ],
})
export class AppModule {}
