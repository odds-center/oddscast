import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RacesService } from '../races/races.service';

/**
 * Admin 전용 Races API — /api/admin/races/*
 * Admin 클라이언트 baseURL이 /api/admin 이므로 경로: /races, /races/:id
 */
@ApiTags('Admin Races')
@Controller('admin/races')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminRacesController {
  constructor(private racesService: RacesService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] 경주 목록 조회' })
  findAll(@Query() filters: any) {
    return this.racesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] 경주 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.findOne(id);
  }
}
