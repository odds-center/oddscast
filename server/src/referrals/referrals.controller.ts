import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { ReferralsService } from './referrals.service';
import { ClaimReferralDto } from './dto/referral.dto';

@ApiTags('Referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my referral code and usage stats' })
  getMyReferral(@CurrentUser() user: JwtPayload) {
    return this.referralsService.getMyReferral(user.sub);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim a referral code' })
  claimCode(@CurrentUser() user: JwtPayload, @Body() dto: ClaimReferralDto) {
    return this.referralsService.claimCode(user.sub, dto.code);
  }
}
