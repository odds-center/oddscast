import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Prediction } from './prediction.entity';

/**
 * 사용자 피드백 유형
 */
export enum FeedbackType {
  ACCURATE = 'accurate', // 정확했음
  INACCURATE = 'inaccurate', // 부정확
  HELPFUL = 'helpful', // 도움됨
  NOT_HELPFUL = 'not_helpful', // 도움 안됨
}

/**
 * 사용자 예측 피드백
 * - AI 예측에 대한 사용자 평가
 * - 지속적 개선에 활용
 */
@Entity('user_prediction_feedback')
@Index(['userId', 'createdAt'])
export class UserPredictionFeedback extends BaseEntity {
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'prediction_id', type: 'varchar', length: 36 })
  @Index()
  predictionId: string;

  @ManyToOne(() => Prediction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prediction_id' })
  prediction: Prediction;

  // 피드백
  @Column({
    name: 'feedback_type',
    type: 'enum',
    enum: FeedbackType,
  })
  feedbackType: FeedbackType;

  @Column({ type: 'int', nullable: true, comment: '별점 (1-5)' })
  rating: number;

  @Column({ type: 'text', nullable: true, comment: '피드백 내용' })
  comment: string;

  // 사용자 자체 예측
  @Column({ name: 'user_predicted_first', type: 'int', nullable: true })
  userPredictedFirst: number;

  @Column({ name: 'user_predicted_second', type: 'int', nullable: true })
  userPredictedSecond: number;

  @Column({ name: 'user_predicted_third', type: 'int', nullable: true })
  userPredictedThird: number;

  // 사용자 예측 정확도
  @Column({ name: 'user_was_correct', type: 'boolean', nullable: true })
  userWasCorrect: boolean;

  @Column({
    name: 'user_accuracy_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  userAccuracyScore: number;

  // 타임스탬프
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  /**
   * AI vs 사용자 비교
   */
  compareWithAI(
    aiCorrect: boolean,
    aiScore: number
  ): {
    winner: 'ai' | 'user' | 'tie';
    aiScore: number;
    userScore: number;
  } {
    const userScore = this.userAccuracyScore || 0;

    if (aiScore > userScore) {
      return { winner: 'ai', aiScore, userScore };
    } else if (userScore > aiScore) {
      return { winner: 'user', aiScore, userScore };
    } else {
      return { winner: 'tie', aiScore, userScore };
    }
  }
}
