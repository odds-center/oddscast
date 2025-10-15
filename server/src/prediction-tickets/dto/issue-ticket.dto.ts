import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * 예측권 발급 DTO
 */
export class IssueTicketDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number; // 발급 개수 (기본 1개)

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  validDays?: number; // 유효 기간 (일, 기본 30일)

  @IsOptional()
  @IsString()
  source?: 'subscription' | 'single_purchase' | 'bonus'; // 발급 출처
}
