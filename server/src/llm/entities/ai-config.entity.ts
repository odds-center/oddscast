import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * AI 설정 Entity
 */
@Entity('ai_config')
export class AIConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'config_key', type: 'varchar', length: 50, unique: true })
  configKey: string;

  // LLM Provider 설정
  @Column({ name: 'llm_provider', type: 'varchar', length: 20, default: 'openai' })
  llmProvider: string;

  // 모델 설정
  @Column({ name: 'primary_model', type: 'varchar', length: 50, default: 'gpt-4-turbo' })
  primaryModel: string;

  @Column({ name: 'fallback_models', type: 'json', nullable: true })
  fallbackModels: string[];

  // 비용 최적화 전략
  @Column({ name: 'cost_strategy', type: 'varchar', length: 20, default: 'balanced' })
  costStrategy: string;

  // 모델 파라미터
  @Column({ name: 'temperature', type: 'decimal', precision: 3, scale: 2, default: 0.70 })
  temperature: number;

  @Column({ name: 'max_tokens', type: 'int', default: 1000 })
  maxTokens: number;

  // 캐싱 설정
  @Column({ name: 'enable_caching', type: 'boolean', default: true })
  enableCaching: boolean;

  @Column({ name: 'cache_ttl', type: 'int', default: 3600 })
  cacheTTL: number;

  // 배치 예측 설정
  @Column({ name: 'enable_batch_prediction', type: 'boolean', default: true })
  enableBatchPrediction: boolean;

  @Column({ name: 'batch_cron_schedule', type: 'varchar', length: 50, default: '0 9 * * *' })
  batchCronSchedule: string;

  // 자동 업데이트 설정
  @Column({ name: 'enable_auto_update', type: 'boolean', default: true })
  enableAutoUpdate: boolean;

  @Column({ name: 'update_interval_minutes', type: 'int', default: 10 })
  updateIntervalMinutes: number;

  @Column({ name: 'odds_change_threshold', type: 'decimal', precision: 5, scale: 2, default: 10.00 })
  oddsChangeThreshold: number;

  // 비용 한도
  @Column({ name: 'daily_cost_limit', type: 'decimal', precision: 10, scale: 2, default: 5000.00 })
  dailyCostLimit: number;

  @Column({ name: 'monthly_cost_limit', type: 'decimal', precision: 10, scale: 2, default: 100000.00 })
  monthlyCostLimit: number;

  // 프롬프트 설정
  @Column({ name: 'prompt_version', type: 'varchar', length: 20, default: 'v1.0.0' })
  promptVersion: string;

  @Column({ name: 'system_prompt_template', type: 'text', nullable: true })
  systemPromptTemplate: string;

  // 관리 정보
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'updated_by', type: 'varchar', length: 36, nullable: true })
  updatedBy: string;

  // 타임스탬프
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

