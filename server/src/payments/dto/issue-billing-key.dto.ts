import { IsString } from 'class-validator';

/**
 * 빌링키 발급 DTO
 */
export class IssueBillingKeyDto {
  @IsString()
  customerKey: string; // 고객 키 (userId)

  @IsString()
  authKey: string; // Toss 인증 키
}
