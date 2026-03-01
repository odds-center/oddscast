import { Injectable } from '@nestjs/common';
import { PgService } from '../database/pg.service';

export interface HorseProfileDto {
  hrNo: string;
  hrName: string;
  sex: string | null;
  age: string | null;
  totalRaces: number;
  winCount: number;
  placeCount: number;
  winRate: number;
  placeRate: number;
  recentForm: number[];
}

export interface HorseHistoryItemDto {
  raceId: number;
  rcDate: string;
  meet: string;
  meetName: string | null;
  rcNo: string;
  rcDist: string | null;
  ord: string | null;
  ordInt: number | null;
  chulNo: string | null;
  jkName: string | null;
  rcTime: string | null;
}

@Injectable()
export class HorsesService {
  constructor(private readonly db: PgService) {}

  /**
   * Horse profile aggregated from RaceResult (and latest RaceEntry for name/age/sex).
   * Win = 1st, Place = top 3 (ordInt 1,2,3 with NORMAL type).
   */
  async getProfile(hrNo: string): Promise<HorseProfileDto | null> {
    const resultsRes = await this.db.query<{
      hrName: string;
      sex: string | null;
      age: number | null;
      ord: string | null;
      ordInt: number | null;
      ordType: string | null;
    }>(
      'SELECT "hrName", sex, age, ord, "ordInt", "ordType" FROM race_results WHERE "hrNo" = $1 ORDER BY "createdAt" DESC LIMIT 100',
      [hrNo],
    );
    const results = resultsRes.rows;

    if (results.length === 0) {
      const entryRes = await this.db.query<{ hrName: string; sex: string | null; age: number | null }>(
        'SELECT "hrName", sex, age FROM race_entries WHERE "hrNo" = $1 LIMIT 1',
        [hrNo],
      );
      const entry = entryRes.rows[0];
      if (!entry) return null;
      return {
        hrNo,
        hrName: entry.hrName ?? '',
        sex: entry.sex ?? null,
        age: entry.age != null ? String(entry.age) : null,
        totalRaces: 0,
        winCount: 0,
        placeCount: 0,
        winRate: 0,
        placeRate: 0,
        recentForm: [],
      };
    }

    const latest = results[0]!;
    const normalResults = results.filter((r) => {
      const t = r.ordType ?? '';
      const ordN = r.ordInt ?? (r.ord ? parseInt(String(r.ord), 10) : NaN);
      return t === 'NORMAL' || (!t && !Number.isNaN(ordN) && ordN < 90);
    });
    const totalRaces = normalResults.length;
    const winCount = normalResults.filter((r) => (r.ordInt ?? 0) === 1).length;
    const placeCount = normalResults.filter((r) => {
      const n = r.ordInt ?? 0;
      return n >= 1 && n <= 3;
    }).length;
    const winRate =
      totalRaces > 0 ? Math.round((winCount / totalRaces) * 10000) / 100 : 0;
    const placeRate =
      totalRaces > 0 ? Math.round((placeCount / totalRaces) * 10000) / 100 : 0;
    const recentForm = normalResults
      .slice(0, 10)
      .map((r) => r.ordInt ?? 0)
      .reverse();

    return {
      hrNo,
      hrName: latest.hrName,
      sex: latest.sex ?? null,
      age: latest.age != null ? String(latest.age) : null,
      totalRaces,
      winCount,
      placeCount,
      winRate,
      placeRate,
      recentForm,
    };
  }

  /**
   * Paginated race history for this horse (from RaceResult + Race).
   */
  async getHistory(
    hrNo: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: HorseHistoryItemDto[];
    total: number;
    totalPages: number;
  }> {
    const [itemsRes, countRes] = await Promise.all([
      this.db.query<{
        raceId: number;
        ord: string | null;
        ordInt: number | null;
        chulNo: string | null;
        jkName: string | null;
        rcTime: string | null;
        rcDate: string;
        meet: string;
        meetName: string | null;
        rcNo: string;
        rcDist: string | null;
      }>(
        `SELECT rr."raceId", rr.ord, rr."ordInt", rr."chulNo", rr."jkName", rr."rcTime",
                r."rcDate", r.meet, r."meetName", r."rcNo", r."rcDist"
         FROM race_results rr JOIN races r ON r.id = rr."raceId" WHERE rr."hrNo" = $1 ORDER BY r."rcDate" DESC LIMIT $2 OFFSET $3`,
        [hrNo, limit, (page - 1) * limit],
      ),
      this.db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM race_results WHERE "hrNo" = $1', [hrNo]),
    ]);
    const items = itemsRes.rows;
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    const dtos: HorseHistoryItemDto[] = items.map((r) => ({
      raceId: r.raceId,
      rcDate: r.rcDate,
      meet: r.meet,
      meetName: r.meetName ?? null,
      rcNo: r.rcNo,
      rcDist: r.rcDist ?? null,
      ord: r.ord,
      ordInt: r.ordInt,
      chulNo: r.chulNo,
      jkName: r.jkName ?? null,
      rcTime: r.rcTime ?? null,
    }));

    return {
      items: dtos,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
