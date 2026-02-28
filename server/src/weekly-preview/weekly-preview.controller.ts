import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WeeklyPreviewService } from './weekly-preview.service';

@ApiTags('Weekly Preview')
@Controller('weekly-preview')
export class WeeklyPreviewController {
  constructor(private weeklyPreviewService: WeeklyPreviewService) {}

  @Get()
  @ApiOperation({ summary: 'Get latest or specific week preview' })
  async get(@Query('week') week?: string) {
    if (week?.trim()) {
      const data = await this.weeklyPreviewService.getByWeek(week.trim());
      return data ?? { weekLabel: null, content: null };
    }
    const data = await this.weeklyPreviewService.getLatest();
    return data ?? { weekLabel: null, content: null };
  }
}
