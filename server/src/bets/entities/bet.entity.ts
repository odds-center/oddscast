import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Race } from '../../races/entities/race.entity';
import { DividendRate } from '../../results/entities/dividend-rate.entity';

export enum BetType {
  WIN = 'WIN', // 단승식
  PLACE = 'PLACE', // 복승식
  QUINELLA = 'QUINELLA', // 연승식
  QUINELLA_PLACE = 'QUINELLA_PLACE', // 복연승식
  EXACTA = 'EXACTA', // 쌍승식
  TRIFECTA = 'TRIFECTA', // 삼복승식
  TRIPLE = 'TRIPLE', // 삼쌍승식
}

export enum BetStatus {
  PENDING = 'PENDING', // 대기중
  CONFIRMED = 'CONFIRMED', // 확정
  CANCELLED = 'CANCELLED', // 취소
  COMPLETED = 'COMPLETED', // 완료
  WON = 'WON', // 당첨
  LOST = 'LOST', // 미당첨
}

export enum BetResult {
  PENDING = 'PENDING', // 대기중
  WIN = 'WIN', // 당첨
  LOSE = 'LOSE', // 미당첨
  PARTIAL_WIN = 'PARTIAL_WIN', // 부분당첨
  VOID = 'VOID', // 무효
}

@Entity('bets')
export class Bet extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // 사용자 정보 (외래키)
  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId!: string;

  // 경주 정보 (외래키)
  @Column({ type: 'varchar', length: 50, name: 'race_id' })
  @Index()
  raceId!: string;

  // 마권 기본 정보
  @Column({ type: 'enum', enum: BetType })
  betType!: BetType; // 승식

  @Column({ type: 'varchar', length: 100, name: 'bet_name' })
  betName!: string; // 마권명 (예: "1번마 단승식")

  @Column({ type: 'text', name: 'bet_description', nullable: true })
  betDescription?: string; // 마권 설명

  // 마권 금액 (포인트)
  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'bet_amount' })
  betAmount!: number; // 마권 금액 (포인트)

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'potential_win',
    nullable: true,
  })
  potentialWin?: number; // 예상 당첨금

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'odds',
    nullable: true,
  })
  odds?: number; // 배당률

  // 마권 선택 정보
  @Column({ type: 'json', name: 'selections' })
  selections!: {
    horses: string[]; // 선택한 마번들
    positions?: number[]; // 순서 (쌍승식 마권의 경우)
    combinations?: string[][]; // 조합 (복합 마권의 경우)
  };

  // 마권 상태
  @Column({ type: 'enum', enum: BetStatus, default: BetStatus.PENDING })
  @Index()
  betStatus!: BetStatus; // 마권 상태

  @Column({ type: 'enum', enum: BetResult, default: BetResult.PENDING })
  @Index()
  betResult!: BetResult; // 마권 결과

  // 마권 시간
  @Column({ type: 'datetime', name: 'bet_time' })
  @Index()
  betTime!: Date; // 마권 구매 시간

  @Column({ type: 'datetime', name: 'race_time', nullable: true })
  raceTime?: Date; // 경주 시간

  @Column({ type: 'datetime', name: 'result_time', nullable: true })
  resultTime?: Date; // 결과 확인 시간

  // 결과 정보
  @Column({ type: 'json', name: 'race_result', nullable: true })
  raceResult?: {
    winner: string; // 1착마
    second: string; // 2착마
    third: string; // 3착마
    finishOrder: string[]; // 완주 순서
  };

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'actual_win',
    nullable: true,
  })
  actualWin?: number; // 실제 당첨금

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'actual_odds',
    nullable: true,
  })
  actualOdds?: number; // 실제 배당률

  // 마권 분석 정보
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'confidence_level',
    nullable: true,
  })
  confidenceLevel?: number; // 신뢰도 (0-100)

  @Column({ type: 'text', name: 'bet_reason', nullable: true })
  betReason?: string; // 마권 구매 이유

  @Column({ type: 'json', name: 'analysis_data', nullable: true })
  analysisData?: {
    horseForm: Record<string, any>; // 경주마 상태
    trackCondition: string; // 주로 상태
    weather: string; // 날씨
    jockeyForm: Record<string, any>; // 기수 상태
    trainerForm: Record<string, any>; // 조교사 상태
    historicalPerformance: Record<string, any>; // 과거 성적
  };

  // 메타데이터
  @Column({
    type: 'varchar',
    length: 20,
    name: 'api_version',
    default: '1.0.0',
  })
  apiVersion!: string; // API 버전

  @Column({
    type: 'varchar',
    length: 20,
    name: 'data_source',
    default: 'INTERNAL',
  })
  dataSource!: string; // 데이터 출처

  @Column({ type: 'varchar', length: 100, name: 'ip_address', nullable: true })
  ipAddress?: string; // 마권 구매 IP 주소

  @Column({ type: 'varchar', length: 100, name: 'user_agent', nullable: true })
  userAgent?: string; // 사용자 에이전트

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes?: string; // 메모

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // 관계 설정
  @ManyToOne(() => User, user => user.bets)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Race, race => race.bets)
  @JoinColumn({ name: 'race_id' })
  race!: Race;

  // 가상 컬럼 (계산된 값)
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'roi',
    nullable: true,
  })
  roi?: number; // 투자수익률

  @Column({ type: 'varchar', length: 20, name: 'risk_level', nullable: true })
  riskLevel?: string; // 위험도 (LOW, MEDIUM, HIGH)

  @Column({ type: 'boolean', name: 'is_favorite', default: false })
  isFavorite?: boolean; // 즐겨찾기 여부
}
