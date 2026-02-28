import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ClaimReferralDto {
  @ApiProperty({
    example: 'ABC12XYZ',
    description: 'Referral code from another user',
  })
  @IsString()
  @MinLength(4, { message: '추천 코드를 정확히 입력하세요' })
  code: string;
}
