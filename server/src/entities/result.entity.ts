import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('results')
export class Result {
  @PrimaryColumn({ type: 'varchar', length: 100, name: 'result_id' })
  resultId!: string;

  @Column({ type: 'varchar', length: 50, name: 'race_id' })
  raceId!: string;

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

  @Column({ type: 'varchar', length: 10 })
  ord!: string;

  @Column({ type: 'varchar', length: 255, name: 'hr_name' })
  hrName!: string;

  @Column({ type: 'varchar', length: 20, name: 'hr_no' })
  hrNo!: string;

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

  @Column({ type: 'varchar', length: 20, name: 'rc_time', nullable: true })
  rcTime?: string;

  @Column({ type: 'varchar', length: 10, name: 'rc_rank', nullable: true })
  rcRank?: string;

  @Column({ type: 'varchar', length: 20, name: 'rc_prize', nullable: true })
  rcPrize?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
