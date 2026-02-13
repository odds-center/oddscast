import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * 빌링키 엔티티 (정기 결제용)
 */
@Entity('billing_keys')
@Index(['userId'])
@Index(['billingKey'], { unique: true })
export class BillingKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 사용자
  @Column({ type: 'varchar', length: 36 })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 빌링키 정보 (Toss Payments)
  @Column({ type: 'varchar', length: 200, unique: true })
  @Index()
  billingKey: string; // Toss 빌링키

  @Column({ type: 'varchar', length: 100 })
  customerKey: string; // 고객 키 (userId와 매핑)

  @Column({ type: 'varchar', length: 50, nullable: true })
  cardNumber: string | null; // 카드 번호 (마스킹)

  @Column({ type: 'varchar', length: 50, nullable: true })
  cardCompany: string | null; // 카드사

  @Column({ type: 'varchar', length: 20, nullable: true })
  cardType: string | null; // 카드 타입 (신용/체크)

  // 상태
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  deactivatedAt: Date | null;

  // 타임스탬프
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 빌링키 비활성화
   */
  deactivate(): void {
    this.isActive = false;
    this.deactivatedAt = new Date();
  }
}
