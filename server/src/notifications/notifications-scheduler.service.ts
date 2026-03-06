import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Race } from '../database/entities/race.entity';
import { RaceStatus } from '../database/db-enums';
import { NotificationsService } from './notifications.service';
import { GlobalConfigService } from '../config/config.service';
import { kst, todayKstYyyymmdd, KST } from '../common/utils/kst';

/** Today YYYYMMDD in KST */
function todayRcDate(): string {
  return todayKstYyyymmdd();
}

/** Parse stTime "HH:mm", "HH:mm:ss", or "출발 :HH:mm" to minutes since midnight */
function parseStTimeMinutes(stTime: string | null): number | null {
  if (!stTime) return null;
  const cleaned = stTime.replace(/^[^\d]*/, '');
  if (!/^\d{1,2}:\d{2}/.test(cleaned)) return null;
  const [h, m] = cleaned.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Race start as Date (rcDate YYYYMMDD + stTime in KST) */
function raceStartKst(rcDate: string, stTime: string | null): Date | null {
  const mins = parseStTimeMinutes(stTime);
  if (mins === null) return null;
  const hour = Math.floor(mins / 60);
  const min = mins % 60;
  return kst(`${rcDate.slice(0, 4)}-${rcDate.slice(4, 6)}-${rcDate.slice(6, 8)}`)
    .hour(hour)
    .minute(min)
    .second(0)
    .millisecond(0)
    .toDate();
}

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    private readonly notificationsService: NotificationsService,
    private readonly config: GlobalConfigService,
  ) {}

  /**
   * Every 15 min on Fri/Sat/Sun (KST): if today's first race is in 25–35 min, send "첫 경주 30분 전" to raceEnabled users.
   */
  @Cron('*/15 9-21 * * 5,6,0', { timeZone: KST })
  async sendFirstRaceReminderIfDue(): Promise<void> {
    const rcDate = todayRcDate();
    const sentKey = `first_race_reminder_${rcDate}`;
    const already = await this.config.get(sentKey);
    if (already === '1') return;

    const first = await this.raceRepo.findOne({
      where: { rcDate, status: RaceStatus.SCHEDULED },
      order: { stTime: 'ASC' },
      select: ['id', 'rcDate', 'meet', 'rcNo', 'stTime', 'rcName'],
    });
    if (!first?.stTime) return;

    const start = raceStartKst(first.rcDate, first.stTime);
    if (!start) return;

    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const diffMin = diffMs / (60 * 1000);
    if (diffMin < 25 || diffMin > 35) return;

    try {
      await this.notificationsService.notifyFirstRaceSoon({
        raceId: first.id,
        rcDate: first.rcDate,
        meet: first.meet ?? '',
        rcNo: first.rcNo ?? '',
        stTime: first.stTime,
      });
      await this.config.set(sentKey, '1');
      this.logger.log(
        `[FirstRaceReminder] sent for ${rcDate} race ${first.id}`,
      );
    } catch (err) {
      this.logger.warn(
        '[FirstRaceReminder] failed:',
        err instanceof Error ? err.message : err,
      );
    }
  }
}
