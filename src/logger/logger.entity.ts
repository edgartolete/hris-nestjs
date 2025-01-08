import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Logger {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  context: string;

  @Column({ nullable: true })
  method: string;

  @Column({ nullable: true, type: 'json' })
  input: Record<string, any>;

  @Column({ nullable: true, type: 'json' })
  error: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isResolved: boolean;
}
