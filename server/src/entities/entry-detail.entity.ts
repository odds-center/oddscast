import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('entry_details')
export class EntryDetail {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  entry_id!: string;

  @Column({ type: 'varchar', length: 10 })
  meet!: string;

  @Column({ type: 'varchar', length: 100, name: 'meet_name' })
  meetName!: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_date' })
  rcDate!: string;

  @Column({ type: 'varchar', length: 10, name: 'rc_no' })
  rcNo!: string;

  @Column({ type: 'varchar', length: 255, name: 'rc_name' })
  rcName!: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_day', nullable: true })
  rcDay?: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_weekday', nullable: true })
  rcWeekday?: string;

  @Column({ type: 'varchar', length: 20, name: 'hr_no' })
  hrNo!: string;

  @Column({ type: 'varchar', length: 255, name: 'hr_name' })
  hrName!: string;

  @Column({ type: 'varchar', length: 255, name: 'jk_name' })
  jkName!: string;

  @Column({ type: 'varchar', length: 20, name: 'jk_no' })
  jkNo!: string;

  @Column({ type: 'varchar', length: 255, name: 'tr_name' })
  trName!: string;

  @Column({ type: 'varchar', length: 20, name: 'tr_no' })
  trNo!: string;

  @Column({ type: 'varchar', length: 255, name: 'ow_name' })
  owName!: string;

  @Column({ type: 'varchar', length: 20, name: 'ow_no' })
  owNo!: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_dist', nullable: true })
  rcDist?: string;

  @Column({ type: 'varchar', length: 50, name: 'rc_grade', nullable: true })
  rcGrade?: string;

  @Column({ type: 'varchar', length: 50, name: 'rc_prize', nullable: true })
  rcPrize?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
