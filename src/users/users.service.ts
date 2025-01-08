import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}

  async create(createUser: CreateUserDto) {
    return await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ ...createUser })
      .execute();
  }

  findAll() {
    return `This action returns all users`;
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

  async updateVerifiedStatus(id: number, newVerifiedStatus: boolean) {
    return await this.dataSource
      .createQueryBuilder()
      .update(User)
      .set({
        isVerified: newVerifiedStatus,
      })
      .where('id = :id', { id })
      .execute();
  }
}
