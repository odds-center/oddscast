import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WeeklyPreview } from '../database/entities/weekly-preview.entity';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
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
    @InjectRepository(RaceEntry)
    private readonly entryRepo: Repository<RaceEntry>,
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
      select: [
        'id',
        'rcNo',
        'rcDate',
        'meetName',
        'meet',
        'rcDist',
        'rank',
        'rcName',
        'rcPrize',
      ],
      order: { rcDate: 'ASC', rcNo: 'ASC' },
    });

    // Load top entries for high-grade races to enrich the prompt
    const highGradeRaces = races.filter(
      (r) =>
        r.rank &&
        ['국제', 'G1', 'G2', 'G3', '1', '2', '별정'].some((g) =>
          (r.rank ?? '').includes(g),
        ),
    );
    const raceIds = races.map((r) => r.id);
    const entries =
      raceIds.length > 0
        ? await this.entryRepo.find({
            where: { raceId: In(raceIds) },
            select: ['raceId', 'hrName', 'jkName', 'rating', 'chulNo'],
            order: { rating: 'DESC' },
          })
        : [];
    const entriesByRace = new Map<number, typeof entries>();
    for (const e of entries) {
      const list = entriesByRace.get(e.raceId) ?? [];
      list.push(e);
      entriesByRace.set(e.raceId, list);
    }

    const raceSummary = races
      .slice(0, 50)
      .map((r) => {
        const meetLabel = r.meetName ?? r.meet;
        let line = `${r.rcDate} ${meetLabel} ${r.rcNo}R ${r.rcDist ?? ''}m ${r.rank ?? ''}`;
        if (r.rcName) line += ` "${r.rcName}"`;
        if (r.rcPrize) line += ` 상금${r.rcPrize}만원`;
        // Add top-rated entries for high-grade races
        if (highGradeRaces.some((hg) => hg.id === r.id)) {
          const topEntries = (entriesByRace.get(r.id) ?? []).slice(0, 5);
          if (topEntries.length > 0) {
            line +=
              ' 출전: ' +
              topEntries
                .map(
                  (e) =>
                    `${e.hrName}(${e.jkName ?? '기수미정'}${e.rating ? ` R${e.rating}` : ''})`,
                )
                .join(', ');
          }
        }
        return line;
      })
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

    const meetSummary = races.reduce(
      (acc, r) => {
        const m = r.meetName ?? r.meet ?? '기타';
        acc[m] = (acc[m] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const meetLine = Object.entries(meetSummary)
      .map(([m, c]) => `${m} ${c}경주`)
      .join(', ');

    const prompt = `You are a Korean horse racing (KRA) analyst writing a weekend preview for OddsCast users.

## Weekend Schedule
- Dates: ${fri.slice(0, 4)}년 ${fri.slice(4, 6)}월 ${fri.slice(6)}일(금) ~ ${sun.slice(4, 6)}월 ${sun.slice(6)}일(일)
- Total: ${races.length}경주 (${meetLine})

## Race Details
${raceSummary || 'No races found.'}

## Instructions
Write a compelling Korean-language preview. Be specific — mention actual race names, horse names, jockeys, distances, and grades from the data above. Do NOT be generic.

Reply with ONLY a valid JSON object (no markdown fences) with exactly these keys:
- "highlights": string — 3-5 sentences covering: key races by grade, notable matchups, distance/class highlights. Mention specific race numbers and names.
- "horsesToWatch": string[] — 3-5 entries, each formatted as "마명 (기수) - 이유" using actual horse/jockey names from the data.
- "trackConditions": string — 1-2 sentences about general track expectations for each venue, or "주로 상태 정보 없음" if unknown.

Example:
{"highlights":"이번 주말 서울 10R '한국경마대상'(G1, 2000m)에서 최강마들의 격돌이 예상됩니다. 부산경남에서는 6경주에 걸쳐 단거리 스프린트 레이스가 집중됩니다.","horsesToWatch":["번개호 (김기수) - 최근 3연승 중, G1 첫 도전","질풍 (이기수) - 작년 대상 우승마, 2000m 전문"],"trackConditions":"서울 양호한 주로 상태 예상. 부산경남은 주말 강수 가능성에 따라 함수 주로 가능."}`;

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
