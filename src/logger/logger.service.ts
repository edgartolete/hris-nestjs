import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateErrorLogDto } from './logger.dto';
import { Logger } from './logger.entity';

@Injectable()
export class LoggerService {
  constructor(private dataSource: DataSource) {}

  async add(errorLog: CreateErrorLogDto) {
    const { userId, ...rest } = errorLog;

    return await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(Logger)
      .values({ ...rest, user: { id: userId } })
      .execute();
  }
}
