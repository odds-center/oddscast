import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * 예측 생성 DTO
 */
export class CreatePredictionDto {
  @IsString()
  raceId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  maxTokens?: number;

  @IsOptional()
  @IsString()
  llmProvider?: 'openai'; // Claude 제거
}
