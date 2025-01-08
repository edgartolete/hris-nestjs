import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Membership } from './membership.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @CreateDateColumn()
  createdAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Membership, (membership) => membership.group)
  memberships: Membership[];
}
