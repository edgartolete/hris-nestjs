import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { DataSource, InsertResult, UpdateResult } from 'typeorm';
import { Session } from './session.entity';
import { FindSessionDto } from './dto/find-session.dto';
import { LoggerService } from 'src/logger/logger.service';
import { config } from 'src/config';

@Injectable()
export class SessionsService {
  constructor(
    private dataSource: DataSource,
    private logger: LoggerService,
  ) {}

  async create(
    createSessionDto: CreateSessionDto,
  ): Promise<[string | null, InsertResult]> {
    try {
      const res = await this.dataSource
        .createQueryBuilder()
        .insert()
        .into(Session)
        .values([
          { ...createSessionDto, user: { id: createSessionDto.userId } },
        ])
        .execute();

      if (!Array.isArray(res.identifiers) || res.identifiers.length === 0) {
        throw new Error('Inserting failed');
      }

      return [null, res];
    } catch (err) {
      const errorLog = {
        context: 'updateStoredRefreshToken failed.',
        error: err,
        userId: createSessionDto.userId,
        method: 'sessionService.create',
        input: createSessionDto,
      };

      await this.logger.add(errorLog);

      return [errorLog.context, null];
    }
  }

  async deactivate(refreshToken: string) {
    if (config.session.softDelete) {
      return await this.dataSource
        .createQueryBuilder()
        .update(Session)
        .set({ isActive: false })
        .where('refreshToken = :refreshToken', { refreshToken })
        .execute();
    }

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

  async updateStoredRefreshToken(
    updateStoredRTokenDto: CreateSessionDto,
  ): Promise<[string | null, UpdateResult]> {
    try {
      const { userId = 0, userAgent, ...rest } = updateStoredRTokenDto;

      return await this.dataSource
        .createQueryBuilder()
        .update(Session)
        .set({ ...rest, isActive: true })
        .where('user.id = :userId AND userAgent = :userAgent', {
          userId,
          userAgent,
        })
        .execute()
        .then((res) => [null, res]);
    } catch (err) {
      const errorLog = {
        context: 'updateStoredRefreshToken failed.',
        error: err,
        userId: updateStoredRTokenDto.userId,
        method: 'sessionService.updateStoredRefreshToken',
        input: updateStoredRTokenDto,
      };

      await this.logger.add(errorLog);

      return [errorLog.context, null];
    }
  }

  remove(id: number) {
    return `This action removes a #${id} session`;
  }
}
