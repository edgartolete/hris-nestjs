import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { DataSource, Repository } from 'typeorm';
import { Session } from './session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindSessionDto } from './dto/find-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private dataSource: DataSource,
  ) {}

  async create(createSessionDto: CreateSessionDto) {
    return await this.sessionRepository
      .createQueryBuilder()
      .insert()
      .into(Session)
      .values([{ ...createSessionDto, user: { id: createSessionDto.userId } }])
      .execute();
  }

  async deactivate(refreshToken: string) {
    return await this.sessionRepository.delete({ refreshToken });
    // return await this.sessionRepository
    //   .createQueryBuilder()
    //   .update(Session)
    //   .set({ isActive: false })
    //   .where('refreshToken = :refreshToken', { refreshToken })
    //   .execute();
  }

  async searchByRefreshToken(refreshToken: string): Promise<FindSessionDto[]> {
    return await this.dataSource
      .createQueryBuilder()
      .select()
      .from(Session, 'session')
      .where('refreshToken = :refreshToken', { refreshToken })
      .execute();
  }

  update(id: number, updateSessionDto: UpdateSessionDto) {
    return `This action updates a #${id} session ${updateSessionDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} session`;
  }
}
