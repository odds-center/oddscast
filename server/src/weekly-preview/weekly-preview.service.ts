import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WeeklyPreview } from '../database/entities/weekly-preview.entity';
import { Race } from '../database/entities/race.entity';
import { kst } from '../common/utils/kst';

export interface WeeklyPreviewContent {
  highlights?: string;
  horsesToWatch?: string[];
  trackConditions?: string;
  raceDates?: string[];
}

/**
 * Returns the Fri/Sat/Sun of the relevant weekend as YYYYMMDD strings in KST.
 * - Mon–Thu: returns the upcoming (next) Fri/Sat/Sun
 * - Fri/Sat/Sun: returns the current (this) Fri/Sat/Sun
 */
function getWeekendDates(from: Date): [string, string, string] {
  const d = kst(from);
  const day = d.day(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  let fri;
  if (day === 5) {
    // Friday → this Friday
    fri = d;
  } else if (day === 6) {
    // Saturday → yesterday (Friday)
    fri = d.subtract(1, 'day');
  } else if (day === 0) {
    // Sunday → 2 days ago (Friday)
    fri = d.subtract(2, 'day');
  } else {
    // Mon–Thu → next Friday
    fri = d.add(5 - day, 'day');
  }

  return [
    fri.format('YYYYMMDD'),
    fri.add(1, 'day').format('YYYYMMDD'),
    fri.add(2, 'day').format('YYYYMMDD'),
  ];
}

/** Returns the Thursday label (YYYY-MM-DD) of the current/previous week in KST. */
function getThursdayLabel(from: Date): string {
  const d = kst(from);
  const day = d.day(); // 0=Sun … 4=Thu … 6=Sat
  const daysToThursday = day >= 4 ? day - 4 : day + 3;
  return d.subtract(daysToThursday, 'day').format('YYYY-MM-DD');
}

@Injectable()
export class WeeklyPreviewService {
  private readonly logger = new Logger(WeeklyPreviewService.name);

  constructor(
    @InjectRepository(WeeklyPreview)
    private readonly previewRepo: Repository<WeeklyPreview>,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
  ) {}

  async getLatest(): Promise<{
    weekLabel: string;
    content: WeeklyPreviewContent;
  } | null> {
    const row = await this.previewRepo.find({
      select: ['weekLabel', 'content'],
      order: { createdAt: 'DESC' },
      take: 1,
    });
    const first = row[0];
    if (!first) return null;
    return {
      weekLabel: first.weekLabel,
      content: (first.content as WeeklyPreviewContent) ?? {},
    };
  }

  async getByWeek(
    weekLabel: string,
  ): Promise<{ weekLabel: string; content: WeeklyPreviewContent } | null> {
    const row = await this.previewRepo.findOne({
      where: { weekLabel },
      select: ['weekLabel', 'content'],
    });
    if (!row) return null;
    return {
      weekLabel: row.weekLabel,
      content: (row.content as WeeklyPreviewContent) ?? {},
    };
  }

  async generate(opts?: {
    fromDate?: Date;
  }): Promise<{ weekLabel: string; content: WeeklyPreviewContent }> {
    const from = opts?.fromDate ?? new Date();
    const [fri, sat, sun] = getWeekendDates(from);
    const weekLabel = getThursdayLabel(from);

    const races = await this.raceRepo.find({
      where: { rcDate: In([fri, sat, sun]) },
      select: ['id', 'rcNo', 'rcDate', 'meetName', 'meet', 'rcDist', 'rank'],
      order: { rcDate: 'ASC', rcNo: 'ASC' },
    });

    const raceSummary = races
      .slice(0, 50)
      .map(
        (r) =>
          `${r.rcDate} ${r.meetName ?? r.meet} ${r.rcNo}경주 ${r.rcDist ?? ''} ${r.rank ?? ''}`,
      )
      .join('\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not set; saving placeholder weekly preview',
      );
      const placeholder: WeeklyPreviewContent = {
        highlights: `${fri}-${sun} 주말 ${races.length}경주 예정. (AI 요약은 Gemini 설정 후 생성됩니다.)`,
        horsesToWatch: [],
        trackConditions: '—',
        raceDates: [fri, sat, sun],
      };
      await this.upsert(weekLabel, placeholder);
      return { weekLabel, content: placeholder };
    }

    const prompt = `You are a horse racing analyst. Based on the following upcoming weekend races (Korea Racing Authority), write a SHORT weekly preview in Korean.

Upcoming races (date, meet, race no, distance, grade):
${raceSummary || 'No races found for this weekend.'}

Reply with ONLY a valid JSON object (no markdown, no extra text) with exactly these keys:
- "highlights": string (2-4 sentences: key races, themes, or notable points)
- "horsesToWatch": string[] (0-5 horse names or short phrases to watch)
- "trackConditions": string (1-2 sentences about expected track/weather if known, or "—")

Example: {"highlights":"...", "horsesToWatch":["...","..."], "trackConditions":"..."}`;

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    let lastError: unknown;
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = this.parseJsonResponse(text);
        const defaultHighlights = `${fri}~${sun} 주말 ${races.length}경주 예정입니다.`;
        const content: WeeklyPreviewContent = {
          highlights:
            typeof parsed?.highlights === 'string'
              ? parsed.highlights
              : defaultHighlights,
          horsesToWatch: Array.isArray(parsed?.horsesToWatch)
            ? parsed.horsesToWatch
            : [],
          trackConditions:
            typeof parsed?.trackConditions === 'string'
              ? parsed.trackConditions
              : '—',
          raceDates: [fri, sat, sun],
        };
        await this.upsert(weekLabel, content);
        this.logger.log(
          `[WeeklyPreview] Generated for week ${weekLabel} using ${modelName}`,
        );
        return { weekLabel, content };
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[WeeklyPreview] ${modelName} failed: ${msg}. Trying next model...`,
        );
      }
    }

    this.logger.error('[WeeklyPreview] All Gemini models failed', lastError);
    const fallback: WeeklyPreviewContent = {
      highlights: `${fri}~${sun} 주말 ${races.length}경주 예정. (AI 요약 생성에 실패했습니다.)`,
      horsesToWatch: [],
      trackConditions: '—',
      raceDates: [fri, sat, sun],
    };
    await this.upsert(weekLabel, fallback);
    return { weekLabel, content: fallback };
  }

  private parseJsonResponse(text: string): Record<string, unknown> | null {
    const trimmed = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```\s*$/, '');
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private async upsert(
    weekLabel: string,
    content: WeeklyPreviewContent,
  ): Promise<void> {
    const now = new Date();
    await this.previewRepo.upsert(
      {
        weekLabel,
        content: content as unknown as Record<string, unknown>,
        createdAt: now,
        updatedAt: now,
      } as Parameters<Repository<WeeklyPreview>['upsert']>[0],
      { conflictPaths: ['weekLabel'] },
    );
  }
}
