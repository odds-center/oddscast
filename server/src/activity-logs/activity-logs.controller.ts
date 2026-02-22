import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface TrackEventDto {
  event: string;
  page?: string;
  target?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

interface TrackBatchDto {
  events: TrackEventDto[];
}

@ApiTags('Activity')
@Controller('activity')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Post('track')
  @HttpCode(204)
  @ApiOperation({ summary: 'Track a single user activity event' })
  async trackEvent(@Body() body: TrackEventDto, @Req() req: Request) {
    const userId = this.extractUserId(req);
    await this.activityLogsService.logUserActivity({
      userId,
      sessionId: body.sessionId,
      event: body.event,
      page: body.page,
      target: body.target,
      metadata: body.metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('track/batch')
  @HttpCode(204)
  @ApiOperation({ summary: 'Track multiple user activity events at once' })
  async trackBatch(@Body() body: TrackBatchDto, @Req() req: Request) {
    const userId = this.extractUserId(req);
    const ip = req.ip;
    const ua = req.headers['user-agent'];

    await this.activityLogsService.logUserActivities(
      body.events.map((e) => ({
        userId,
        sessionId: e.sessionId,
        event: e.event,
        page: e.page,
        target: e.target,
        metadata: e.metadata,
        ipAddress: ip,
        userAgent: ua,
      })),
    );
  }

  private extractUserId(req: Request): number | undefined {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return undefined;
      const token = authHeader.slice(7);
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      ) as { sub?: number };
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
