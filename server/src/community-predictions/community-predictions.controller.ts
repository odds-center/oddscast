import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CommunityPredictionsService } from './community-predictions.service';
import { SubmitCommunityPredictionDto } from './dto/community-prediction.dto';

@ApiTags('Community Predictions')
@Controller('community-predictions')
export class CommunityPredictionsController {
  constructor(private readonly service: CommunityPredictionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit community prediction for a race' })
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  submit(@CurrentUser() user: JwtPayload, @Body() dto: SubmitCommunityPredictionDto) {
    return this.service.submit(user.sub, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my community predictions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyPredictions(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.getMyPredictions(user.sub, page, limit);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get community prediction leaderboard' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'alltime'] })
  @ApiQuery({ name: 'limit', required: false })
  getLeaderboard(
    @Query('period') period: 'weekly' | 'monthly' | 'alltime' = 'weekly',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.getLeaderboard(period, limit);
  }

  @Get('race/:raceId')
  @ApiOperation({ summary: 'Get community predictions for a race' })
  getRacePredictions(@Param('raceId', ParseIntPipe) raceId: number) {
    return this.service.getRacePredictions(raceId);
  }
}
