import { IsString, IsBoolean, IsNumber, IsOptional, IsEnum, IsArray, Min, Max } from 'class-validator';

/**
 * AI 설정 업데이트 DTO
 */
export class UpdateAIConfigDto {
  @IsOptional()
  @IsEnum(['openai', 'claude'])
  llmProvider?: string;

  @IsOptional()
  @IsString()
  primaryModel?: string;

  @IsOptional()
  @IsArray()
  fallbackModels?: string[];

  @IsOptional()
  @IsEnum(['premium', 'balanced', 'budget', 'hybrid'])
  costStrategy?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4000)
  maxTokens?: number;

  @IsOptional()
  @IsBoolean()
  enableCaching?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cacheTTL?: number;

  @IsOptional()
  @IsBoolean()
  enableBatchPrediction?: boolean;

  @IsOptional()
  @IsString()
  batchCronSchedule?: string;

  @IsOptional()
  @IsBoolean()
  enableAutoUpdate?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  updateIntervalMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  oddsChangeThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyCostLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyCostLimit?: number;

  @IsOptional()
  @IsString()
  promptVersion?: string;

  @IsOptional()
  @IsString()
  systemPromptTemplate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

