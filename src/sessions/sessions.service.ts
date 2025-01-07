import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { DataSource, UpdateResult } from 'typeorm';
import { Session } from './session.entity';
import { FindSessionDto } from './dto/find-session.dto';
import { ErrorLog } from 'src/types';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class SessionsService {
  constructor(
    private dataSource: DataSource,
    private logger: LoggerService,
  ) {}

  async create(createSessionDto: CreateSessionDto) {
    return await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(Session)
      .values([{ ...createSessionDto, user: { id: createSessionDto.userId } }])
      .execute();
  }

  async deactivate(refreshToken: string) {
    return await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(Session)
      .where('refreshToken = :refreshToken', { refreshToken })
      .execute();
  }

  async searchByRefreshToken(refreshToken: string): Promise<FindSessionDto[]> {
    return await this.dataSource
      .createQueryBuilder()
      .select()
      .from(Session, 'session')
      .where('refreshToken = :refreshToken', { refreshToken })
      .execute();
  }

  async update(updateSessionDto: UpdateSessionDto) {
    const { id, userId, ...rest } = updateSessionDto;
    return await this.dataSource
      .createQueryBuilder()
      .update(Session)
      .set({
        ...rest,
        user: { id: userId },
      })
      .where('id = :id', { id })
      .execute()
      .then((res) => [null, res])
      .catch((err) => [err, null]);
  }

  async updateStoredRefreshToken(updateStoredRTokenDto: CreateSessionDto) {
    try {
      const {
        userId = 0,
        ipAddress,
        userAgent,
        ...rest
      } = updateStoredRTokenDto;

      return await this.dataSource
        .createQueryBuilder()
        .update(Session)
        .set({ ...rest })
        .where(
          'user.id = :userId AND ipAddress = :ipAddress AND userAgent = :userAgent',
          { userId, ipAddress, userAgent },
        )
        .execute()
        .then((res) => [null, res]);
    } catch (err) {
      const errorLog: ErrorLog = {
        userId: updateStoredRTokenDto.userId || null,
        context: 'updateStoredRefreshToken failed.',
        method: 'sessionService.updateStoredRefreshToken',
        input: updateStoredRTokenDto,
        error: err,
      };

      await this.logger.add(errorLog);

      return [err?.message, null];
    }
  }

  remove(id: number) {
    return `This action removes a #${id} session`;
  }
}
