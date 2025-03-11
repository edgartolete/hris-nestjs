import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DataSource } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(private dataSource: DataSource) {}

  async create(createRoleDto: CreateRoleDto) {
    return await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(Role)
      .values({ ...createRoleDto })
      .execute();
  }

  async findAll() {
    return await this.dataSource
      .createQueryBuilder()
      .select('role')
      .from(Role, 'role')
      .execute();
  }

  async findOne(id: number) {
    return await this.dataSource
      .createQueryBuilder()
      .select('role')
      .from(Role, 'role')
      .where('role.id = :id', { id })
      .execute();
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
