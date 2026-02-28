import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { ClaimReferralDto } from './dto/claim-referral.dto';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get or create my referral code' })
  getMyCode(@CurrentUser() user: JwtPayload) {
    return this.referralsService.getOrCreateMyCode(user.sub);
  }

  @Post('claim')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Claim a referral code (referred user)' })
  claim(@CurrentUser() user: JwtPayload, @Body() dto: ClaimReferralDto) {
    return this.referralsService.claim(user.sub, dto.code);
  }
}
