import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  create() {
    return 'This action adds a new user';
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

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
