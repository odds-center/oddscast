import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Result } from './result.entity';
import { DividendRate } from './dividend-rate.entity';
import { EntryDetail } from './entry-detail.entity';
import { Bet } from './bet.entity';

@Entity('races')
export class Race {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  // 경주 기본 정보
  @Column({ type: 'varchar', length: 10 })
  @Index()
  meet!: string; // 시행경마장구분 (1:서울, 2:제주, 3:부산)

  @Column({ type: 'varchar', length: 100, name: 'meet_name' })
  meetName!: string; // 시행경마장명

  @Column({ type: 'varchar', length: 20, name: 'rc_date' })
  @Index()
  rcDate!: string; // 경주일자 (YYYYMMDD)

  @Column({ type: 'varchar', length: 10, name: 'rc_no' })
  @Index()
  rcNo!: string; // 경주번호

  @Column({ type: 'varchar', length: 255, name: 'rc_name' })
  rcName!: string; // 경주명

  @Column({ type: 'varchar', length: 20, name: 'rc_dist' })
  rcDist!: string; // 경주거리 (미터)

  @Column({ type: 'varchar', length: 50, name: 'rc_grade' })
  rcGrade!: string; // 등급조건

  @Column({ type: 'varchar', length: 20, name: 'rc_condition' })
  rcCondition!: string; // 부담구분

  @Column({ type: 'decimal', precision: 15, scale: 0, name: 'rc_prize' })
  rcPrize!: number; // 1착상금

  // 경주 조건
  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_rating_min',
    nullable: true,
  })
  rcRatingMin?: string; // 레이팅하한조건

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_rating_max',
    nullable: true,
  })
  rcRatingMax?: string; // 레이팅상한조건

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_age_condition',
    nullable: true,
  })
  rcAgeCondition?: string; // 연령조건

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_sex_condition',
    nullable: true,
  })
  rcSexCondition?: string; // 상별조건

  // 경주 일정
  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_start_time',
    nullable: true,
  })
  rcStartTime?: string; // 발주예정시각

  @Column({ type: 'varchar', length: 20, name: 'rc_end_time', nullable: true })
  rcEndTime?: string; // 경주종료예정시각

  @Column({ type: 'varchar', length: 20, name: 'rc_day', nullable: true })
  rcDay?: string; // 경주일수

  @Column({ type: 'varchar', length: 20, name: 'rc_weekday', nullable: true })
  rcWeekday?: string; // 경주요일

  // 경주 환경
  @Column({ type: 'varchar', length: 20, name: 'rc_weather', nullable: true })
  rcWeather?: string; // 날씨

  @Column({ type: 'varchar', length: 20, name: 'rc_track', nullable: true })
  rcTrack?: string; // 주로

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_track_condition',
    nullable: true,
  })
  rcTrackCondition?: string; // 트랙상태

  // 상금 정보
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_2',
    nullable: true,
  })
  rcPrize2?: number; // 2착상금

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_3',
    nullable: true,
  })
  rcPrize3?: number; // 3착상금

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_4',
    nullable: true,
  })
  rcPrize4?: number; // 4착상금

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_5',
    nullable: true,
  })
  rcPrize5?: number; // 5착상금

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_bonus1',
    nullable: true,
  })
  rcPrizeBonus1?: number; // 1착부가상금

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_bonus2',
    nullable: true,
  })
  rcPrizeBonus2?: number; // 2착부가상금

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_bonus3',
    nullable: true,
  })
  rcPrizeBonus3?: number; // 3착부가상금

  // 추가 정보
  @Column({ type: 'text', name: 'rc_remarks', nullable: true })
  rcRemarks?: string; // 비고사항

  @Column({
    type: 'varchar',
    length: 20,
    name: 'api_version',
    default: 'API72_2',
  })
  apiVersion!: string; // API 버전

  @Column({ type: 'varchar', length: 20, name: 'data_source', default: 'KRA' })
  dataSource!: string; // 데이터 출처

  // 사용자 정보
  @Column({ type: 'varchar', length: 36, name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @ManyToOne(() => User, user => user.createdRaces)
  @JoinColumn({ name: 'created_by' })
  user?: User;

  @OneToMany(() => Result, result => result.race)
  results?: Result[];

  @OneToMany(() => DividendRate, dividendRate => dividendRate.race)
  dividendRates?: DividendRate[];

  @OneToMany(() => EntryDetail, entryDetail => entryDetail.race)
  entryDetails?: EntryDetail[];

  @OneToMany(() => Bet, bet => bet.race)
  bets?: Bet[];

  // 가상 컬럼 (계산된 값)
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'total_prize',
    nullable: true,
  })
  totalPrize?: number; // 총 상금

  @Column({ type: 'int', name: 'total_entries', nullable: true })
  totalEntries?: number; // 총 출주마 수

  @Column({
    type: 'varchar',
    length: 20,
    name: 'race_status',
    default: 'SCHEDULED',
  })
  raceStatus!: string; // 경주 상태 (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
}
