import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import { KraService } from './kra.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../database/db-enums';

@ApiTags('KRA Integration')
@Controller('kra')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class KraController {
  private readonly logger = new Logger(KraController.name);

  constructor(
    private readonly kraService: KraService,
    @InjectRepository(KraSyncLog)
    private readonly kraSyncLogRepo: Repository<KraSyncLog>,
  ) {}

  @Get('batch-schedules')
  @ApiBearerAuth()
  @ApiOperation({ summary: '배치 스케줄 목록 (예정/완료/실패)' })
  async getBatchSchedules(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.kraService.getBatchSchedules({ status, limit });
  }

  @Get('sync-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'KRA API 동기화 로그 조회' })
  async getSyncLogs(
    @Query('endpoint') endpoint?: string,
    @Query('rcDate') rcDate?: string,
    @Query('limit') limit?: number,
  ) {
    const take = Math.min(Number(limit) || 50, 100);
    const qb = this.kraSyncLogRepo
      .createQueryBuilder('k')
      .orderBy('k.createdAt', 'DESC')
      .take(take);
    if (endpoint != null && endpoint !== '') {
      qb.andWhere('k.endpoint = :endpoint', { endpoint });
    }
    if (rcDate != null && rcDate !== '') {
      qb.andWhere('k.rcDate = :rcDate', { rcDate });
    }
    const logs = await qb.getMany();
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

  @Post('sync/dividends')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'KRA 확정배당율 동기화 (7승식: 단승/연승/복승/쌍승/복연승/삼복승/삼쌍승)',
  })
  async syncDividends(@Query('date') date: string) {
    return this.kraService.fetchDividends(date);
  }
}
