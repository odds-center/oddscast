import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * 예측 요청 DTO
 */
export class PredictionRequestDto {
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
}
