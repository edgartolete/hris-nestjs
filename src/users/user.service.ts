import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUser: CreateUserDto) {
    return await this.userRepository
      .createQueryBuilder()
      .insert()
      .into('user')
      .values({ ...createUser })
      .execute();
  }

  findAll() {
    return this.userRepository.find();
    // return `This action returns all users`;
  }

  async findUserByname(username: string): Promise<User | null> {
    return await this.userRepository.findOneBy({
      username: username.toLowerCase(),
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
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
}
