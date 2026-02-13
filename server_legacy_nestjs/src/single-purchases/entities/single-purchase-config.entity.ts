import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 개별 구매 설정 Entity
 * - DB에서 가격 관리
 * - Admin에서 수정 가능
 */
@Entity('single_purchase_config')
export class SinglePurchaseConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'config_name' })
  @Index()
  configName: string; // SINGLE_TICKET

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName: string; // 개별 예측권

  @Column({ type: 'text', nullable: true })
  description: string; // 설명

  // 가격 정보
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'original_price' })
  originalPrice: number; // 원가 (VAT 전)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  vat: number; // 부가세 (10%)

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number; // 최종 가격

  // 상태
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 총 가격 계산 (할인 없음, 고정 가격)
   */
  calculateTotalPrice(quantity: number): {
    originalPrice: number;
    vat: number;
    totalPrice: number;
    pricePerTicket: number;
  } {
    const totalOriginal = this.originalPrice * quantity;
    const totalVat = this.vat * quantity;
    const total = this.totalPrice * quantity;

    return {
      originalPrice: totalOriginal,
      vat: totalVat,
      totalPrice: total,
      pricePerTicket: this.totalPrice,
    };
  }
}
