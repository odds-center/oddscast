import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RacePlan } from '../races/entities/race-plan.entity';
import { RacePlansService } from './race-plans.service';

@ApiTags('race-plans')
@Controller('race-plans')
export class RacePlansController {
  constructor(private readonly racePlansService: RacePlansService) {}

  @Get()
  @ApiOperation({ summary: '모든 경주계획표 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '경주계획표 목록',
    type: [RacePlan],
  })
  async findAll(): Promise<RacePlan[]> {
    return this.racePlansService.findAll();
  }

  @Get('date/:date')
  @ApiOperation({ summary: '특정 날짜의 경주계획표 목록 조회' })
  @ApiParam({ name: 'date', description: '날짜 (YYYYMMDD 형식)' })
  @ApiResponse({
    status: 200,
    description: '해당 날짜의 경주계획표 목록',
    type: [RacePlan],
  })
  async findByDate(@Param('date') date: string): Promise<RacePlan[]> {
    return this.racePlansService.findByDate(date);
  }

  @Get('meet/:meet')
  @ApiOperation({ summary: '특정 마사회의 경주계획표 목록 조회' })
  @ApiParam({
    name: 'meet',
    description: '마사회 코드 (1: 서울, 2: 부산, 3: 제주)',
  })
  @ApiResponse({
    status: 200,
    description: '해당 마사회의 경주계획표 목록',
    type: [RacePlan],
  })
  async findByMeet(@Param('meet') meet: string): Promise<RacePlan[]> {
    return this.racePlansService.findByMeet(meet);
  }

  @Get(':planId')
  @ApiOperation({ summary: '특정 경주계획표 상세 조회' })
  @ApiParam({ name: 'planId', description: '계획표 ID' })
  @ApiResponse({
    status: 200,
    description: '경주계획표 상세 정보',
    type: RacePlan,
  })
  async findById(@Param('planId') planId: string): Promise<RacePlan | null> {
    return this.racePlansService.findById(planId);
  }

  @Post()
  @ApiOperation({ summary: '새 경주계획표 생성' })
  @ApiResponse({
    status: 201,
    description: '경주계획표 생성 완료',
    type: RacePlan,
  })
  async create(@Body() racePlanData: Partial<RacePlan>): Promise<RacePlan> {
    return this.racePlansService.create(racePlanData);
  }

  @Put(':planId')
  @ApiOperation({ summary: '경주계획표 정보 수정' })
  @ApiParam({ name: 'planId', description: '계획표 ID' })
  @ApiResponse({
    status: 200,
    description: '경주계획표 수정 완료',
    type: RacePlan,
  })
  async update(
    @Param('planId') planId: string,
    @Body() racePlanData: Partial<RacePlan>
  ): Promise<RacePlan | null> {
    return this.racePlansService.update(planId, racePlanData);
  }

  @Delete(':planId')
  @ApiOperation({ summary: '경주계획표 삭제' })
  @ApiParam({ name: 'planId', description: '계획표 ID' })
  @ApiResponse({ status: 200, description: '경주계획표 삭제 완료' })
  async delete(@Param('planId') planId: string): Promise<void> {
    return this.racePlansService.delete(planId);
  }
}
