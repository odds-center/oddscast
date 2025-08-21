import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('race_horse_results')
export class RaceHorseResult {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  result_id!: string;

  // 경주마 기본 정보
  @Column({ type: 'varchar', length: 10 })
  @Index()
  meet!: string; // 시행경마장구분 (1:서울, 2:제주, 3:부산)

  @Column({ type: 'varchar', length: 100, name: 'meet_name' })
  meetName!: string; // 시행경마장명

  @Column({ type: 'varchar', length: 255, name: 'hr_name' })
  @Index()
  hrName!: string; // 마명

  @Column({ type: 'varchar', length: 20, name: 'hr_number' })
  @Index()
  hrNumber!: string; // 마번

  @Column({ type: 'varchar', length: 100, name: 'hr_origin', nullable: true })
  hrOrigin?: string; // 산지

  @Column({ type: 'varchar', length: 10, name: 'hr_sex', nullable: true })
  hrSex?: string; // 성별

  @Column({ type: 'varchar', length: 10, name: 'hr_age', nullable: true })
  hrAge?: string; // 나이

  @Column({
    type: 'varchar',
    length: 20,
    name: 'hr_debut_date',
    nullable: true,
  })
  hrDebutDate?: string; // 데뷔일자

  // 최근 경주 정보
  @Column({ type: 'varchar', length: 20, name: 'rc_date' })
  @Index()
  rcDate!: string; // 최근 경주일자

  @Column({ type: 'varchar', length: 10, name: 'rc_no' })
  @Index()
  rcNo!: string; // 최근 경주번호

  @Column({ type: 'varchar', length: 10, name: 'rc_rank' })
  @Index()
  rcRank!: string; // 최근 경주순위

  @Column({ type: 'varchar', length: 20, name: 'rc_time' })
  rcTime!: string; // 최근 경주기록

  @Column({ type: 'varchar', length: 20, name: 'rc_weight', nullable: true })
  rcWeight?: string; // 최근 경주부담중량

  @Column({ type: 'varchar', length: 20, name: 'rc_rating', nullable: true })
  rcRating?: string; // 최근 경주레이팅

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_horse_weight',
    nullable: true,
  })
  rcHorseWeight?: string; // 최근 경주마체중

  @Column({ type: 'varchar', length: 255, name: 'rc_name', nullable: true })
  rcName?: string; // 최근 경주명

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_burden_type',
    nullable: true,
  })
  rcBurdenType?: string; // 최근 경주부담종류

  @Column({ type: 'varchar', length: 50, name: 'rc_grade', nullable: true })
  rcGrade?: string; // 최근 경주등급

  @Column({ type: 'varchar', length: 20, name: 'rc_distance', nullable: true })
  rcDistance?: string; // 최근 경주거리

  // 통산 성적
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

  // 추가 정보
  @Column({ type: 'varchar', length: 255, name: 'rc_jockey', nullable: true })
  rcJockey?: string; // 최근 경주 기수명

  @Column({ type: 'varchar', length: 255, name: 'rc_trainer', nullable: true })
  rcTrainer?: string; // 최근 경주 조교사명

  @Column({ type: 'varchar', length: 255, name: 'rc_owner', nullable: true })
  rcOwner?: string; // 최근 경주 마주명

  @Column({ type: 'varchar', length: 20, name: 'rc_weather', nullable: true })
  rcWeather?: string; // 최근 경주 날씨

  @Column({ type: 'varchar', length: 20, name: 'rc_track', nullable: true })
  rcTrack?: string; // 최근 경주 주로

  @Column({
    type: 'varchar',
    length: 20,
    name: 'rc_track_condition',
    nullable: true,
  })
  rcTrackCondition?: string; // 최근 경주 주로상태

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

  // 가상 컬럼 (계산된 값)
  @Column({
    type: 'varchar',
    length: 20,
    name: 'performance_grade',
    nullable: true,
  })
  performanceGrade?: string; // 성적 등급 (A+, A, B+, B, C, D)

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'speed_rating',
    nullable: true,
  })
  speedRating?: number; // 속도 지수

  @Column({ type: 'varchar', length: 20, name: 'form_rating', nullable: true })
  formRating?: string; // 상태 등급 (EXCELLENT, GOOD, FAIR, POOR)

  @Column({ type: 'varchar', length: 20, name: 'class_rating', nullable: true })
  classRating?: string; // 클래스 등급 (HIGH, MEDIUM, LOW)

  @Column({ type: 'varchar', length: 20, name: 'age_group', nullable: true })
  ageGroup?: string; // 연령 그룹 (YOUNG, PRIME, MATURE, VETERAN, OLD)

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'consistency_rating',
    nullable: true,
  })
  consistencyRating?: number; // 일관성 지수

  @Column({
    type: 'varchar',
    length: 20,
    name: 'improvement_trend',
    nullable: true,
  })
  improvementTrend?: string; // 향상 추세 (IMPROVING, STABLE, DECLINING)
}
