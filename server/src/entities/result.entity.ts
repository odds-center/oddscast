import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Race } from './race.entity';

@Entity('results')
export class Result {
  @PrimaryColumn({ type: 'varchar', length: 100, name: 'result_id' })
  resultId!: string;

  // 경주 정보 (외래키)
  @Column({ type: 'varchar', length: 50, name: 'race_id' })
  @Index()
  raceId!: string;

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

  // 출전마 정보
  @Column({ type: 'varchar', length: 10 })
  @Index()
  ord!: string; // 출주번호

  @Column({ type: 'varchar', length: 255, name: 'hr_name' })
  hrName!: string; // 마명

  @Column({ type: 'varchar', length: 20, name: 'hr_no' })
  @Index()
  hrNo!: string; // 마번

  @Column({ type: 'varchar', length: 255, name: 'hr_name_en', nullable: true })
  hrNameEn?: string; // 영문마명

  @Column({
    type: 'varchar',
    length: 20,
    name: 'hr_nationality',
    nullable: true,
  })
  hrNationality?: string; // 국적

  @Column({ type: 'varchar', length: 10, name: 'hr_age', nullable: true })
  hrAge?: string; // 연령

  @Column({ type: 'varchar', length: 10, name: 'hr_gender', nullable: true })
  hrGender?: string; // 성별

  @Column({ type: 'varchar', length: 20, name: 'hr_weight', nullable: true })
  hrWeight?: string; // 부담중량

  @Column({ type: 'varchar', length: 20, name: 'hr_rating', nullable: true })
  hrRating?: string; // 레이팅(등급)

  // 기수 정보
  @Column({ type: 'varchar', length: 255, name: 'jk_name' })
  jkName!: string; // 기수명

  @Column({ type: 'varchar', length: 20, name: 'jk_no' })
  jkNo!: string; // 기수번호

  @Column({ type: 'varchar', length: 255, name: 'jk_name_en', nullable: true })
  jkNameEn?: string; // 영문기수명

  // 조교사 정보
  @Column({ type: 'varchar', length: 255, name: 'tr_name' })
  trName!: string; // 조교사명

  @Column({ type: 'varchar', length: 20, name: 'tr_no' })
  trNo!: string; // 조교사번호

  @Column({ type: 'varchar', length: 255, name: 'tr_name_en', nullable: true })
  trNameEn?: string; // 영문조교사명

  // 마주 정보
  @Column({ type: 'varchar', length: 255, name: 'ow_name' })
  owName!: string; // 마주명

  @Column({ type: 'varchar', length: 20, name: 'ow_no' })
  owNo!: string; // 마주번호

  @Column({ type: 'varchar', length: 255, name: 'ow_name_en', nullable: true })
  owNameEn?: string; // 영문마주명

  // 경주 결과
  @Column({ type: 'varchar', length: 10, name: 'rc_rank' })
  @Index()
  rcRank!: string; // 순위

  @Column({ type: 'varchar', length: 20, name: 'rc_time' })
  rcTime!: string; // 경주기록

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize',
    nullable: true,
  })
  rcPrize?: number; // 착순상금

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

  // 추가 정보
  @Column({ type: 'varchar', length: 20, name: 'rc_day', nullable: true })
  rcDay?: string; // 경주일수

  @Column({ type: 'varchar', length: 20, name: 'rc_weekday', nullable: true })
  rcWeekday?: string; // 경주요일

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

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_track_condition',
    nullable: true,
  })
  rcTrackCondition?: string; // 트랙상태

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_bonus1',
    nullable: true,
  })
  rcPrizeBonus1?: number; // 부가상금1

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_bonus2',
    nullable: true,
  })
  rcPrizeBonus2?: number; // 부가상금2

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize_bonus3',
    nullable: true,
  })
  rcPrizeBonus3?: number; // 부가상금3

  // 구간별 기록
  @Column({ type: 'varchar', length: 20, name: 'rc_time_400', nullable: true })
  rcTime400?: string; // 400m 기록

  @Column({ type: 'varchar', length: 20, name: 'rc_time_600', nullable: true })
  rcTime600?: string; // 600m 기록

  @Column({ type: 'varchar', length: 20, name: 'rc_time_800', nullable: true })
  rcTime800?: string; // 800m 기록

  @Column({ type: 'varchar', length: 20, name: 'rc_time_1000', nullable: true })
  rcTime1000?: string; // 1000m 기록

  @Column({ type: 'varchar', length: 20, name: 'rc_time_1200', nullable: true })
  rcTime1200?: string; // 1200m 기록

  @Column({ type: 'varchar', length: 20, name: 'rc_time_1400', nullable: true })
  rcTime1400?: string; // 1400m 기록

  @Column({ type: 'varchar', length: 20, name: 'rc_time_1600', nullable: true })
  rcTime1600?: string; // 1600m 기록

  @Column({ type: 'varchar', length: 20, name: 'rc_time_1800', nullable: true })
  rcTime1800?: string; // 1800m 기록

  @Column({ type: 'varchar', length: 20, name: 'rc_time_2000', nullable: true })
  rcTime2000?: string; // 2000m 기록

  // 착차 정보
  @Column({ type: 'varchar', length: 20, name: 'rc_gap', nullable: true })
  rcGap?: string; // 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_400', nullable: true })
  rcGap400?: string; // 400m 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_600', nullable: true })
  rcGap600?: string; // 600m 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_800', nullable: true })
  rcGap800?: string; // 800m 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_1000', nullable: true })
  rcGap1000?: string; // 1000m 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_1200', nullable: true })
  rcGap1200?: string; // 1200m 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_1400', nullable: true })
  rcGap1400?: string; // 1400m 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_1600', nullable: true })
  rcGap1600?: string; // 1600m 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_1800', nullable: true })
  rcGap1800?: string; // 1800m 착차

  @Column({ type: 'varchar', length: 20, name: 'rc_gap_2000', nullable: true })
  rcGap2000?: string; // 2000m 착차

  // 마체중 정보
  @Column({
    type: 'varchar',
    length: 20,
    name: 'hr_weight_before',
    nullable: true,
  })
  hrWeightBefore?: string; // 경주전 마체중

  @Column({
    type: 'varchar',
    length: 20,
    name: 'hr_weight_after',
    nullable: true,
  })
  hrWeightAfter?: string; // 경주후 마체중

  @Column({
    type: 'varchar',
    length: 20,
    name: 'hr_weight_change',
    nullable: true,
  })
  hrWeightChange?: string; // 마체중 변화

  // 메타데이터
  @Column({
    type: 'varchar',
    length: 20,
    name: 'api_version',
    default: 'API4_3',
  })
  apiVersion!: string; // API 버전

  @Column({ type: 'varchar', length: 20, name: 'data_source', default: 'KRA' })
  dataSource!: string; // 데이터 출처

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @ManyToOne(() => Race, race => race.results)
  @JoinColumn({ name: 'race_id' })
  race!: Race;

  // 가상 컬럼 (계산된 값)
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'speed_rating',
    nullable: true,
  })
  speedRating?: number; // 속도 지수

  @Column({
    type: 'varchar',
    length: 20,
    name: 'performance_grade',
    nullable: true,
  })
  performanceGrade?: string; // 성적 등급 (A+, A, B+, B, C, D)
}
