import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { KraService } from './kra.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('KRA Integration')
@Controller('kra')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class KraController {
  private readonly logger = new Logger(KraController.name);

  constructor(
    private readonly kraService: KraService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('sync-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'KRA API 동기화 로그 조회' })
  async getSyncLogs(
    @Query('endpoint') endpoint?: string,
    @Query('rcDate') rcDate?: string,
    @Query('limit') limit?: number,
  ) {
    const take = Math.min(Number(limit) || 50, 100);
    const logs = await this.prisma.kraSyncLog.findMany({
      where: {
        ...(endpoint && { endpoint }),
        ...(rcDate && { rcDate }),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { logs, total: logs.length };
  }

  @Post('sync/schedule')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Restrict to admin in real world, or just auth
  @ApiOperation({ summary: 'KRA 경주 계획/출전표 수동 동기화' })
  async syncSchedule(@Query('date') date: string) {
    // date format: YYYYMMDD
    return this.kraService.syncEntrySheet(date);
  }

  @Post('sync/results')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'KRA 경주 결과 수동 동기화' })
  async syncResults(@Query('date') date: string) {
    return this.kraService.fetchRaceResults(date);
  }

  @Post('sync/details')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'KRA 상세/훈련정보 수동 동기화 (Group B)' })
  async syncDetails(@Query('date') date: string) {
    return this.kraService.syncAnalysisData(date);
  }

  @Post('sync/jockeys')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'KRA 기수 통산전적 수동 동기화' })
  async syncJockeys(@Query('meet') meet?: string) {
    return this.kraService.fetchJockeyTotalResults(meet);
  }
}
