import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { TenantKeys } from 'src/utils/tenantKeys';

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource(TenantKeys.PSE_ANALYZER)
    private dataSource: DataSource,
  ) {}

  async create(createUser: CreateUserDto) {
    return await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ ...createUser })
      .execute();
  }

  async findAll() {
    return await this.dataSource
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .execute();
  }

  async findOneById(id: number): Promise<User | null> {
    return await this.dataSource
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findOneByName(username: string): Promise<User | null> {
    return await this.dataSource
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.username = :username', { username })
      .getOne();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.dataSource
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findOne(id: number) {
    return await this.dataSource
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('user.id = :id', { id })
      .getOne();
  }

  update(id: number) {
    return `This action updates a #${id} user`;
  }

  async updatePassword(id: number, password: string) {
    return await this.dataSource
      .createQueryBuilder()
      .update(User)
      .set({ password })
      .where('id = :id', { id })
      .execute();
  }
  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async updateEmailVerifiedStatus(id: number, newVerifiedStatus: boolean) {
    return await this.dataSource
      .createQueryBuilder()
      .update(User)
      .set({
        isVerified: newVerifiedStatus,
        isEmailVerified: newVerifiedStatus,
      })
      .where('id = :id', { id })
      .execute();
  }
}
