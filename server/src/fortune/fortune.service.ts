import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
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
  constructor(private prisma: PrismaService) {}

  private getTodayDate(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  async getOrCreateToday(userId: number): Promise<TodaysFortuneDto> {
    const date = this.getTodayDate();
    const existing = await this.prisma.userDailyFortune.findUnique({
      where: { userId_date: { userId, date } },
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
    const created = await this.prisma.userDailyFortune.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        messageOverall,
        messageRace,
        messageAdvice,
        luckyNumbers: luckyNumbers as Prisma.InputJsonValue,
        luckyColor: luckyColorItem.name,
        luckyColorHex: luckyColorItem.hex ?? null,
        keyword,
      },
      update: {
        messageOverall,
        messageRace,
        messageAdvice,
        luckyNumbers: luckyNumbers as Prisma.InputJsonValue,
        luckyColor: luckyColorItem.name,
        luckyColorHex: luckyColorItem.hex ?? null,
        keyword,
      },
    });
    return this.toDto(created);
  }

  private toDto(row: {
    date: string;
    messageOverall: string;
    messageRace: string;
    messageAdvice: string;
    luckyNumbers: unknown;
    luckyColor: string;
    luckyColorHex: string | null;
    keyword: string | null;
  }): TodaysFortuneDto {
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
