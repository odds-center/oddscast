import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';
import { BugReportStatus } from '../database/entities';
import { BugReportsService } from './bug-reports.service';
import { CreateBugReportDto } from './dto/create-bug-report.dto';

/** Express request extended with optional JWT user payload (public endpoint). */
interface RequestWithOptionalUser extends Request {
  user?: JwtPayload;
}

@ApiTags('Bug Reports')
@Controller('bug-reports')
export class BugReportsController {
  constructor(private readonly bugReportsService: BugReportsService) {}

  /**
   * Submit a bug report — public endpoint (no auth required).
   * Rate-limited to 5 submissions per minute per IP.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a bug report (public)' })
  async create(
    @Body() dto: CreateBugReportDto,
    @Req() req: RequestWithOptionalUser,
  ) {
    // Capture user-agent from request headers if not provided in body
    if (!dto.userAgent) {
      const ua = req.headers['user-agent'];
      dto.userAgent = ua ? ua.substring(0, 500) : undefined;
    }
    // Extract userId from JWT payload if token was included (optional auth)
    const userId = req.user?.sub;
    return this.bugReportsService.create(dto, userId);
  }

  /**
   * List all bug reports — admin only.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'List all bug reports (admin)' })
  async findAll(@Query('status') status?: BugReportStatus) {
    return this.bugReportsService.findAll(status);
  }

  /**
   * Update status of a bug report — admin only.
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Update bug report status (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BugReportStatus,
  ) {
    await this.bugReportsService.updateStatus(id, status);
    return { message: 'Status updated' };
  }
}
