import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { FortuneService } from './fortune.service';

@ApiTags('Fortune')
@Controller('fortune')
export class FortuneController {
  constructor(private fortuneService: FortuneService) {}

  @Get('today')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: '오늘의 경마운세 (로그인 사용자, 유저별·날짜별 1건)',
  })
  getToday(@CurrentUser() user: JwtPayload) {
    return this.fortuneService.getOrCreateToday(user.sub);
  }
}
