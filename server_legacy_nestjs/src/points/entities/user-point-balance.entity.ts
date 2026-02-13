import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('user_point_balances')
export class UserPointBalance extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // 현재 포인트 잔액
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'current_balance',
    default: 0,
  })
  currentPoints!: number; // 현재 포인트

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_earned',
    default: 0,
  })
  totalPointsEarned!: number; // 총 획득 포인트

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_spent',
    default: 0,
  })
  totalPointsSpent!: number; // 총 사용 포인트

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_bonus',
    default: 0,
  })
  bonusPoints!: number; // 보너스 포인트

  // 포인트 통계 (데이터베이스에 없는 필드들은 제거)

  // 메타데이터
  @Column({
    type: 'varchar',
    length: 20,
    name: 'api_version',
    default: '1.0.0',
  })
  apiVersion!: string; // API 버전

  @Column({
    type: 'varchar',
    length: 50,
    name: 'data_source',
    default: 'INTERNAL',
  })
  dataSource!: string; // 데이터 출처

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({
    type: 'datetime',
    name: 'last_updated',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUpdated!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // 관계 설정
  @OneToOne(() => User, user => user.pointBalance)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
