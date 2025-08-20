import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('dividend_rates')
export class DividendRate {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  dividend_id!: string;

  @Column({ type: 'varchar', length: 10 })
  meet!: string;

  @Column({ type: 'varchar', length: 100, name: 'meet_name' })
  meetName!: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_date' })
  rcDate!: string;

  @Column({ type: 'varchar', length: 10, name: 'rc_no' })
  rcNo!: string;

  @Column({ type: 'varchar', length: 10, name: 'win_type' })
  winType!: string;

  @Column({ type: 'varchar', length: 50, name: 'win_type_name' })
  winTypeName!: string;

  @Column({ type: 'varchar', length: 20, name: 'first_horse_no', nullable: true })
  firstHorseNo?: string;

  @Column({ type: 'varchar', length: 20, name: 'second_horse_no', nullable: true })
  secondHorseNo?: string;

  @Column({ type: 'varchar', length: 20, name: 'third_horse_no', nullable: true })
  thirdHorseNo?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'dividend_rate', nullable: true })
  dividendRate?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
} 