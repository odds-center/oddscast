import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BugReport, BugReportCategory, BugReportStatus } from '../database/entities';
import { DiscordService } from '../discord/discord.service';
import { CreateBugReportDto } from './dto/create-bug-report.dto';

@Injectable()
export class BugReportsService {
  private readonly logger = new Logger(BugReportsService.name);

  constructor(
    @InjectRepository(BugReport) private readonly bugReportRepo: Repository<BugReport>,
    private readonly discordService: DiscordService,
  ) {}

  async create(dto: CreateBugReportDto, userId?: number): Promise<BugReport> {
    const report = this.bugReportRepo.create({
      userId: userId ?? null,
      title: dto.title,
      description: dto.description,
      category: dto.category ?? BugReportCategory.OTHER,
      status: BugReportStatus.OPEN,
      pageUrl: dto.pageUrl ?? null,
      userAgent: dto.userAgent ?? null,
    });
    const saved = await this.bugReportRepo.save(report);

    // Discord notification — fire and forget
    this.discordService.notifyBugReport(saved).catch((err: unknown) => {
      this.logger.warn(
        `Discord bug report notification failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return saved;
  }

  async findAll(status?: BugReportStatus): Promise<{ data: BugReport[]; total: number }> {
    const qb = this.bugReportRepo
      .createQueryBuilder('br')
      .leftJoinAndSelect('br.user', 'user')
      .orderBy('br.createdAt', 'DESC');

    if (status) {
      qb.where('br.status = :status', { status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async updateStatus(id: string, status: BugReportStatus): Promise<void> {
    await this.bugReportRepo.update(id, { status });
  }
}
