import { Injectable } from '@nestjs/common';
import { PgService } from '../database/pg.service';

export interface TrainerProfileDto {
  trName: string;
  totalRaces: number;
  winCount: number;
  placeCount: number;
  winRate: number;
  placeRate: number;
  recentForm: number[];
  byMeet: { meet: string; count: number; winRate: number; placeRate: number }[];
}

export interface TrainerHistoryItemDto {
  raceId: number;
  rcDate: string;
  meet: string;
  meetName: string | null;
  rcNo: string;
  rcDist: string | null;
  ord: string | null;
  ordInt: number | null;
  hrName: string | null;
  rcTime: string | null;
}

@Injectable()
export class TrainersService {
  constructor(private readonly db: PgService) {}

  async getProfile(trName: string): Promise<TrainerProfileDto | null> {
    const res = await this.db.query<{
      trName: string | null;
      ord: string | null;
      ordInt: number | null;
      ordType: string | null;
      meet: string;
    }>(
      `SELECT rr."trName", rr.ord, rr."ordInt", rr."ordType", r.meet
       FROM race_results rr JOIN races r ON r.id = rr."raceId" WHERE rr."trName" = $1 ORDER BY rr."createdAt" DESC LIMIT 200`,
      [trName],
    );
    const results = res.rows;
    if (results.length === 0) return null;

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

    const meetMap = new Map<
      string,
      { wins: number; places: number; count: number }
    >();
    for (const r of normalResults) {
      const meet = r.meet ?? 'unknown';
      const cur = meetMap.get(meet) ?? { wins: 0, places: 0, count: 0 };
      cur.count += 1;
      if ((r.ordInt ?? 0) === 1) cur.wins += 1;
      if ((r.ordInt ?? 0) >= 1 && (r.ordInt ?? 0) <= 3) cur.places += 1;
      meetMap.set(meet, cur);
    }
    const byMeet = Array.from(meetMap.entries()).map(([meet, v]) => ({
      meet,
      count: v.count,
      winRate: v.count > 0 ? Math.round((v.wins / v.count) * 10000) / 100 : 0,
      placeRate:
        v.count > 0 ? Math.round((v.places / v.count) * 10000) / 100 : 0,
    }));

    return {
      trName,
      totalRaces,
      winCount,
      placeCount,
      winRate,
      placeRate,
      recentForm,
      byMeet,
    };
  }

  async getHistory(
    trName: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: TrainerHistoryItemDto[];
    total: number;
    totalPages: number;
  }> {
    const [itemsRes, countRes] = await Promise.all([
      this.db.query<{
        raceId: number;
        ord: string | null;
        ordInt: number | null;
        hrName: string | null;
        rcTime: string | null;
        rcDate: string;
        meet: string;
        meetName: string | null;
        rcNo: string;
        rcDist: string | null;
      }>(
        `SELECT rr."raceId", rr.ord, rr."ordInt", rr."hrName", rr."rcTime",
                r."rcDate", r.meet, r."meetName", r."rcNo", r."rcDist"
         FROM race_results rr JOIN races r ON r.id = rr."raceId" WHERE rr."trName" = $1 ORDER BY r."rcDate" DESC LIMIT $2 OFFSET $3`,
        [trName, limit, (page - 1) * limit],
      ),
      this.db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM race_results WHERE "trName" = $1', [trName]),
    ]);
    const items = itemsRes.rows;
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    const dtos: TrainerHistoryItemDto[] = items.map((r) => ({
      raceId: r.raceId,
      rcDate: r.rcDate,
      meet: r.meet,
      meetName: r.meetName ?? null,
      rcNo: r.rcNo,
      rcDist: r.rcDist ?? null,
      ord: r.ord,
      ordInt: r.ordInt,
      hrName: r.hrName ?? null,
      rcTime: r.rcTime ?? null,
    }));

    return {
      items: dtos,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
