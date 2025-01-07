import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['refreshToken'])
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  refreshToken: string;

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @Column()
  expiryDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
