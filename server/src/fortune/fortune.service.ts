import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserDailyFortune } from '../database/entities/user-daily-fortune.entity';
import { todayKstYyyymmdd } from '../common/utils/kst';
import {
  MESSAGE_OVERALL_POOL,
  MESSAGE_RACE_POOL,
  MESSAGE_ADVICE_POOL,
  LUCKY_NUMBERS_POOL,
  LUCKY_COLOR_POOL,
  KEYWORD_POOL,
} from './fortune-pools';

export interface TodaysFortuneDto {
  date: string;
  messageOverall: string;
  messageRace: string;
  messageAdvice: string;
  luckyNumbers: number[];
  luckyColor: string;
  luckyColorHex?: string;
  keyword?: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

@Injectable()
export class FortuneService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserDailyFortune)
    private readonly fortuneRepo: Repository<UserDailyFortune>,
  ) {}

  private getTodayDate(): string {
    return todayKstYyyymmdd();
  }

  async getOrCreateToday(userId: number): Promise<TodaysFortuneDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const date = this.getTodayDate();
    const existing = await this.fortuneRepo.findOne({
      where: { userId, date },
    });
    if (existing) {
      return this.toDto(existing);
    }
    const messageOverall = pickRandom(MESSAGE_OVERALL_POOL);
    const messageRace = pickRandom(MESSAGE_RACE_POOL);
    const messageAdvice = pickRandom(MESSAGE_ADVICE_POOL);
    const luckyNumbers = pickRandomN(LUCKY_NUMBERS_POOL, 2);
    const luckyColorItem = pickRandom(LUCKY_COLOR_POOL);
    const keyword = pickRandom(KEYWORD_POOL);
    const now = new Date();
    await this.fortuneRepo.upsert(
      {
        userId,
        date,
        messageOverall,
        messageRace,
        messageAdvice,
        luckyNumbers: JSON.parse(JSON.stringify(luckyNumbers)),
        luckyColor: luckyColorItem.name,
        luckyColorHex: luckyColorItem.hex ?? null,
        keyword,
        updatedAt: now,
      } as Parameters<Repository<UserDailyFortune>['upsert']>[0],
      { conflictPaths: ['userId', 'date'] },
    );
    const created = await this.fortuneRepo.findOne({
      where: { userId, date },
    });
    if (!created) throw new Error('Fortune create failed');
    return this.toDto(created);
  }

  private toDto(row: UserDailyFortune): TodaysFortuneDto {
    const numbers = Array.isArray(row.luckyNumbers)
      ? (row.luckyNumbers as number[])
      : [];
    return {
      date: row.date,
      messageOverall: row.messageOverall,
      messageRace: row.messageRace,
      messageAdvice: row.messageAdvice,
      luckyNumbers: numbers,
      luckyColor: row.luckyColor,
      luckyColorHex: row.luckyColorHex ?? undefined,
      keyword: row.keyword ?? undefined,
    };
  }
}
