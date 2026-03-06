import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ClaimReferralDto {
  @ApiProperty({ description: 'Referral code to claim' })
  @IsString()
  @Length(1, 20)
  code!: string;
}
