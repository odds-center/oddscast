import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'jockey_results', schema: 'oddscast' })
export class JockeyResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  meet!: string;

  @Column({ name: 'jkNo', type: 'text' })
  jkNo!: string;

  @Column({ name: 'jkName', type: 'text' })
  jkName!: string;

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

  @Column({ name: 'chaksunT', type: 'bigint' })
  chaksunT!: string;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
