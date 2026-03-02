import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WeeklyPreview } from '../database/entities/weekly-preview.entity';
import { Race } from '../database/entities/race.entity';

export interface WeeklyPreviewContent {
  highlights?: string;
  horsesToWatch?: string[];
  trackConditions?: string;
  raceDates?: string[];
}

function getNextFriSatSun(from: Date): [string, string, string] {
  const d = new Date(from);
  const day = d.getDay();
  let daysUntilFri = 5 - day;
  if (daysUntilFri <= 0) daysUntilFri += 7;
  const fri = new Date(d);
  fri.setDate(d.getDate() + daysUntilFri);
  const sat = new Date(fri);
  sat.setDate(fri.getDate() + 1);
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  const fmt = (x: Date) => x.toISOString().slice(0, 10).replace(/-/g, '');
  return [fmt(fri), fmt(sat), fmt(sun)];
}

function getThursdayLabel(from: Date): string {
  const d = new Date(from);
  const day = d.getDay();
  const thu = new Date(d);
  thu.setDate(d.getDate() - day + (day >= 4 ? 4 : 4 - 7));
  return thu.toISOString().slice(0, 10);
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
    const [fri, sat, sun] = getNextFriSatSun(from);
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

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
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
      this.logger.log(`[WeeklyPreview] Generated for week ${weekLabel}`);
      return { weekLabel, content };
    } catch (err: unknown) {
      this.logger.error('[WeeklyPreview] Gemini failed', err);
      const fallback: WeeklyPreviewContent = {
        highlights: `${fri}~${sun} 주말 ${races.length}경주 예정. (AI 요약 생성에 실패했습니다.)`,
        horsesToWatch: [],
        trackConditions: '—',
        raceDates: [fri, sat, sun],
      };
      await this.upsert(weekLabel, fallback);
      return { weekLabel, content: fallback };
    }
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
