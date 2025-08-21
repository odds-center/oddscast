import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Race } from './race.entity';

@Entity('dividend_rates')
export class DividendRate {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  dividend_id!: string;

  // 경주 기본 정보
  @Column({ type: 'varchar', length: 10 })
  meet!: string; // 시행경마장구분 (1:서울, 2:제주, 3:부산)

  @Column({ type: 'varchar', length: 100, name: 'meet_name' })
  meetName!: string; // 시행경마장명

  @Column({ type: 'varchar', length: 20, name: 'rc_date' })
  @Index()
  rcDate!: string; // 경주일 (YYYYMMDD)

  @Column({ type: 'varchar', length: 10, name: 'rc_no' })
  @Index()
  rcNo!: string; // 경주번호

  // 승식구분 및 배당율
  @Column({ type: 'varchar', length: 10, name: 'pool' })
  pool!: string; // 승식구분 (WIN, PLC, QPL, QNL, EXA, TLA, TRI)

  @Column({ type: 'varchar', length: 50, name: 'pool_name' })
  poolName!: string; // 승식구분명

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'odds',
    nullable: true,
  })
  odds?: number; // 확정배당율

  // 출주마 번호
  @Column({ type: 'varchar', length: 20, name: 'chul_no', nullable: true })
  chulNo?: string; // 1착마 출주번호

  @Column({ type: 'varchar', length: 20, name: 'chul_no2', nullable: true })
  chulNo2?: string; // 2착마 출주번호 (복승식 이상)

  @Column({ type: 'varchar', length: 20, name: 'chul_no3', nullable: true })
  chulNo3?: string; // 3착마 출주번호 (삼복승식, 삼쌍승식)

  // 추가 정보
  @Column({ type: 'varchar', length: 100, name: 'race_name', nullable: true })
  raceName?: string; // 경주명

  @Column({
    type: 'varchar',
    length: 20,
    name: 'race_distance',
    nullable: true,
  })
  raceDistance?: string; // 경주거리 (미터)

  @Column({ type: 'varchar', length: 50, name: 'race_grade', nullable: true })
  raceGrade?: string; // 등급조건

  @Column({
    type: 'varchar',
    length: 20,
    name: 'race_condition',
    nullable: true,
  })
  raceCondition?: string; // 부담구분

  @Column({ type: 'varchar', length: 20, name: 'weather', nullable: true })
  weather?: string; // 날씨

  @Column({ type: 'varchar', length: 20, name: 'track', nullable: true })
  track?: string; // 주로

  @Column({
    type: 'varchar',
    length: 20,
    name: 'track_condition',
    nullable: true,
  })
  trackCondition?: string; // 트랙상태

  // 통계 정보
  @Column({ type: 'int', name: 'total_entries', nullable: true })
  totalEntries?: number; // 총 출주마 수

  @Column({ type: 'int', name: 'winning_combinations', nullable: true })
  winningCombinations?: number; // 당첨 조합 수

  // 메타데이터
  @Column({
    type: 'varchar',
    length: 20,
    name: 'api_version',
    default: 'API160_1',
  })
  apiVersion!: string; // API 버전

  @Column({ type: 'varchar', length: 20, name: 'data_source', default: 'KRA' })
  dataSource!: string; // 데이터 출처

  // 경주 정보 (외래키)
  @Column({ type: 'varchar', length: 50, name: 'race_id', nullable: true })
  @Index()
  raceId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @ManyToOne(() => Race, race => race.dividendRates)
  @JoinColumn({ name: 'race_id' })
  race?: Race;

  // 가상 컬럼 (계산된 값)
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'implied_probability',
    nullable: true,
  })
  impliedProbability?: number; // 암시적 확률 (1/배당율)

  @Column({
    type: 'varchar',
    length: 20,
    name: 'profit_margin',
    nullable: true,
  })
  profitMargin?: string; // 수익률 마진
}
