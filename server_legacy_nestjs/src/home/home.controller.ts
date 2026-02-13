import { Controller, Get, UseGuards, Request, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TodayRacesResponseDto, UserStatsResponseDto } from './dto/index';

/**
 * 홈 화면 API 컨트롤러
 */
@ApiTags('Home')
@Controller('home')
export class HomeController {
  private readonly logger = new Logger(HomeController.name);

  constructor(private readonly homeService: HomeService) {}

  @Get('today-races')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '오늘의 경주 목록 조회',
    description: '홈 화면에 표시할 오늘의 경주 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '오늘의 경주 목록 반환',
    type: TodayRacesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getTodayRaces(@Request() req): Promise<TodayRacesResponseDto> {
    const userId = req.user?.userId;
    this.logger.log(`오늘의 경주 조회 요청: userId=${userId}`);
    return await this.homeService.getTodayRaces(userId);
  }

  @Get('user-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '사용자 통계 조회',
    description: '홈 화면에 표시할 사용자의 베팅 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 통계 반환',
    type: UserStatsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getUserStats(@Request() req): Promise<UserStatsResponseDto> {
    const userId = req.user?.userId;
    this.logger.log(`사용자 통계 조회 요청: userId=${userId}`);
    return await this.homeService.getUserStats(userId);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '홈 대시보드 데이터 조회',
    description: '홈 화면에 필요한 모든 데이터를 한 번에 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '홈 대시보드 데이터 반환',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getDashboard(@Request() req) {
    const userId = req.user?.userId;
    this.logger.log(`홈 대시보드 조회 요청: userId=${userId}`);
    return await this.homeService.getDashboard(userId);
  }
}
