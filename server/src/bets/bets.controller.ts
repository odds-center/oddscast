import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BetsService } from './bets.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import {
  CreateBetDto,
  UpdateBetDto,
  BetFilterDto,
  CreateBetSlipDto,
} from './dto/bet.dto';
import { BetResult } from '@prisma/client';

@ApiTags('Bets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bets')
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Post()
  @ApiOperation({ summary: '베팅 생성' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBetDto) {
    return this.betsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: '베팅 목록 조회' })
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: BetFilterDto) {
    return this.betsService.findAll(user.sub, filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: '베팅 통계 조회' })
  getStatistics(@CurrentUser() user: JwtPayload) {
    return this.betsService.getStatistics(user.sub);
  }

  @Post('slip')
  @ApiOperation({ summary: '베팅 슬립 생성' })
  createSlip(@CurrentUser() user: JwtPayload, @Body() dto: CreateBetSlipDto) {
    return this.betsService.createSlip(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '베팅 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.betsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '베팅 수정' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBetDto) {
    return this.betsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '베팅 삭제 (취소)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.betsService.cancel(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '베팅 취소' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.betsService.cancel(id);
  }

  @Patch(':id/result')
  @ApiOperation({ summary: '베팅 결과 처리 (테스트용)' })
  processResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { result: BetResult; actualWin?: number },
  ) {
    return this.betsService.processResult(id, body.result, body.actualWin);
  }
}
