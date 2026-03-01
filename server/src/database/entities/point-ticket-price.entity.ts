import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'point_ticket_prices', schema: 'oddscast' })
export class PointTicketPrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'pointsPerTicket', type: 'int', default: 1200 })
  pointsPerTicket!: number;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'effectiveFrom', type: 'timestamp', precision: 3 })
  effectiveFrom!: Date;

  @Column({ name: 'effectiveTo', type: 'timestamp', precision: 3, nullable: true })
  effectiveTo!: Date | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
