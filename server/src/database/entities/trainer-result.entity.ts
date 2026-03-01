import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'trainer_results', schema: 'oddscast' })
export class TrainerResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  meet!: string;

  @Column({ name: 'trNo', type: 'text' })
  trNo!: string;

  @Column({ name: 'trName', type: 'text' })
  trName!: string;

  @Column({ name: 'rcCntT', type: 'int' })
  rcCntT!: number;

  @Column({ name: 'ord1CntT', type: 'int' })
  ord1CntT!: number;

  @Column({ name: 'ord2CntT', type: 'int' })
  ord2CntT!: number;

  @Column({ name: 'ord3CntT', type: 'int' })
  ord3CntT!: number;

  @Column({ name: 'winRateTsum', type: 'float' })
  winRateTsum!: number;

  @Column({ name: 'quRateTsum', type: 'float' })
  quRateTsum!: number;

  @Column({ name: 'plRateTsum', type: 'float', nullable: true })
  plRateTsum!: number | null;

  @Column({ name: 'rcCntY', type: 'int', nullable: true })
  rcCntY!: number | null;

  @Column({ name: 'ord1CntY', type: 'int', nullable: true })
  ord1CntY!: number | null;

  @Column({ name: 'ord2CntY', type: 'int', nullable: true })
  ord2CntY!: number | null;

  @Column({ name: 'ord3CntY', type: 'int', nullable: true })
  ord3CntY!: number | null;

  @Column({ name: 'winRateY', type: 'float', nullable: true })
  winRateY!: number | null;

  @Column({ name: 'quRateY', type: 'float', nullable: true })
  quRateY!: number | null;

  @Column({ name: 'plRateY', type: 'float', nullable: true })
  plRateY!: number | null;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
