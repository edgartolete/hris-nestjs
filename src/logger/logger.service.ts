import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Logger } from './logger.entity';
import { CreateLogDto } from './logger.dto';

@Injectable()
export class LoggerService {
  constructor(private dataSource: DataSource) {}

  async add(errorLog: CreateLogDto) {
    const { userId = null, ...rest } = errorLog;

    return await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(Logger)
      .values({ ...rest, user: { id: userId } })
      .execute();
  }
}
