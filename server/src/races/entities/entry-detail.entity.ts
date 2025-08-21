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

@Entity('entry_details')
export class EntryDetail {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  entry_id!: string;

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

  @Column({ type: 'varchar', length: 20, name: 'rc_day', nullable: true })
  rcDay?: string; // 경주일수

  @Column({ type: 'varchar', length: 20, name: 'rc_weekday', nullable: true })
  rcWeekday?: string; // 경주요일

  @Column({ type: 'varchar', length: 20, name: 'rc_dist', nullable: true })
  rcDist?: string; // 경주거리 (미터)

  @Column({ type: 'varchar', length: 50, name: 'rc_grade', nullable: true })
  rcGrade?: string; // 등급조건

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'rc_prize',
    nullable: true,
  })
  rcPrize?: number; // 1착상금

  // 출전마 정보
  @Column({ type: 'varchar', length: 20, name: 'hr_no' })
  @Index()
  hrNo!: string; // 마번

  @Column({ type: 'varchar', length: 255, name: 'hr_name' })
  hrName!: string; // 마명

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

  // 출전 정보
  @Column({ type: 'varchar', length: 10, name: 'entry_number' })
  @Index()
  entryNumber!: string; // 출전번호

  @Column({
    type: 'varchar',
    length: 20,
    name: 'post_position',
    nullable: true,
  })
  postPosition?: string; // 출발위치

  @Column({
    type: 'varchar',
    length: 20,
    name: 'entry_status',
    default: 'CONFIRMED',
  })
  entryStatus!: string; // 출전 상태 (CONFIRMED, SCRATCHED, PENDING)

  @Column({ type: 'varchar', length: 20, name: 'entry_time', nullable: true })
  entryTime?: string; // 출전 확정 시간

  // 성적 정보
  @Column({
    type: 'varchar',
    length: 20,
    name: 'last_race_date',
    nullable: true,
  })
  lastRaceDate?: string; // 최근 경주일자

  @Column({ type: 'varchar', length: 20, name: 'last_race_no', nullable: true })
  lastRaceNo?: string; // 최근 경주번호

  @Column({
    type: 'varchar',
    length: 20,
    name: 'last_race_rank',
    nullable: true,
  })
  lastRaceRank?: string; // 최근 경주순위

  @Column({
    type: 'varchar',
    length: 20,
    name: 'last_race_time',
    nullable: true,
  })
  lastRaceTime?: string; // 최근 경주기록

  @Column({
    type: 'varchar',
    length: 20,
    name: 'last_race_rating',
    nullable: true,
  })
  lastRaceRating?: string; // 최근 경주레이팅

  // 통계 정보
  @Column({ type: 'int', name: 'total_starts', nullable: true })
  totalStarts?: number; // 통산 총출주회수

  @Column({ type: 'int', name: 'total_wins', nullable: true })
  totalWins?: number; // 통산 1착회수

  @Column({ type: 'int', name: 'total_places', nullable: true })
  totalPlaces?: number; // 통산 2착회수

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'total_win_rate',
    nullable: true,
  })
  totalWinRate?: number; // 통산 단승률

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'total_place_rate',
    nullable: true,
  })
  totalPlaceRate?: number; // 통산 복승률

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'total_prize',
    nullable: true,
  })
  totalPrize?: number; // 통산 착순상금

  // 최근 1년 성적
  @Column({ type: 'int', name: 'year_starts', nullable: true })
  yearStarts?: number; // 최근1년 총출주회수

  @Column({ type: 'int', name: 'year_wins', nullable: true })
  yearWins?: number; // 최근1년 1착회수

  @Column({ type: 'int', name: 'year_places', nullable: true })
  yearPlaces?: number; // 최근1년 2착회수

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'year_win_rate',
    nullable: true,
  })
  yearWinRate?: number; // 최근1년 단승률

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'year_place_rate',
    nullable: true,
  })
  yearPlaceRate?: number; // 최근1년 복승률

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'year_prize',
    nullable: true,
  })
  yearPrize?: number; // 최근1년 착순상금

  // 최근 6개월 성적
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'half_year_prize',
    nullable: true,
  })
  halfYearPrize?: number; // 최근6개월 수득상금

  // 메타데이터
  @Column({
    type: 'varchar',
    length: 20,
    name: 'api_version',
    default: 'API15_2',
  })
  apiVersion!: string; // API 버전

  @Column({ type: 'varchar', length: 20, name: 'data_source', default: 'KRA' })
  dataSource!: string; // 데이터 출처

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @ManyToOne(() => Race, race => race.entryDetails)
  @JoinColumn({ name: 'race_id' })
  race!: Race;

  // 가상 컬럼 (계산된 값)
  @Column({ type: 'varchar', length: 20, name: 'form_rating', nullable: true })
  formRating?: string; // 상태 등급 (A+, A, B+, B, C, D)

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'speed_rating',
    nullable: true,
  })
  speedRating?: number; // 속도 지수

  @Column({ type: 'varchar', length: 20, name: 'class_rating', nullable: true })
  classRating?: string; // 클래스 등급 (HIGH, MEDIUM, LOW)
}
