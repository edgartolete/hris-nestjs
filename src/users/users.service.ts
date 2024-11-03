import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type User = {
  userId: number;
  username: string;
  password: string;
};

const userList: User[] = [
  {
    userId: 1,
    username: 'Alice',
    password: 'topsecret',
  },
  {
    userId: 2,
    username: 'Bob',
    password: '123abc',
  },
];

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  async findUserByname(username: string): Promise<User | null> {
    return userList.find((user) => user.username === username) ?? null;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
