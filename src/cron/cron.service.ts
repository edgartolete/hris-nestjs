import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LoggerService } from 'src/logger/logger.service';
import { Session } from 'src/sessions/session.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class CronService {
  constructor(
    private dataSource: DataSource,
    private log: LoggerService,
  ) {}

  @Cron('0 0 1 * *')
  async cleanUpSession() {
    try {
      const today = new Date();

      const res = await this.dataSource
        .createQueryBuilder()
        .update(Session)
        .set({ isActive: false })
        .where('expiryDate < :today AND isActive = :isActive', {
          today,
          isActive: true,
        })
        .execute();

      this.log.add({
        context: 'Cron: Monthly Session Cleanup',
        input: { affected: res.affected },
        isResolved: true,
      });
    } catch (err) {
      this.log.add({
        context: 'Cron: Monthly Session Cleanup Failed!',
        error: err,
        method: 'cron.service',
      });
    }
  }
}
