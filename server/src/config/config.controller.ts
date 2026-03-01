import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { GlobalConfigService } from './config.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/db-enums';

/**
 * 글로벌 설정 API — 클라이언트(WebApp/Mobile)에서 기능 플래그 등 조회
 */
@ApiTags('Config')
@Controller('config')
export class ConfigController {
  constructor(private configService: GlobalConfigService) {}

  @Get()
  @ApiOperation({ summary: '전체 설정 조회 (key-value) — Public' })
  async getAll() {
    return this.configService.getAll();
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] 설정 값 변경' })
  async set(@Param('key') key: string, @Body() body: { value: string }) {
    await this.configService.set(key, body.value);
    return { key, value: body.value };
  }
}
