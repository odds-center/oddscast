import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PgService } from '../database/pg.service';
import { CreatePickDto, PICK_TYPE_HORSE_COUNTS } from './dto/pick.dto';
import { PickType } from '../database/db-enums';
import { serializeItemsWithRace } from '../common/serializers/kra.serializer';

@Injectable()
export class PicksService {
  constructor(private readonly db: PgService) {}

  async create(userId: number, dto: CreatePickDto) {
    const raceCheck = await this.db.query('SELECT id FROM races WHERE id = $1', [
      dto.raceId,
    ]);
    if (!raceCheck.rows[0]) throw new NotFoundException('경주를 찾을 수 없습니다');

    const requiredCount = PICK_TYPE_HORSE_COUNTS[dto.pickType];
    if (!dto.hrNos || dto.hrNos.length !== requiredCount) {
      throw new BadRequestException(
        `${dto.pickType}은(는) ${requiredCount}마리를 선택해야 합니다.`,
      );
    }

    const hrNames = dto.hrNames ?? dto.hrNos.map(() => '');

    const existing = await this.db.query(
      'SELECT * FROM user_picks WHERE "userId" = $1 AND "raceId" = $2',
      [userId, dto.raceId],
    );
    const existingRow = existing.rows[0] as { id: number } | undefined;

    if (existingRow) {
      await this.db.query(
        `UPDATE user_picks SET "pickType" = $1, "hrNos" = $2, "hrNames" = $3 WHERE id = $4`,
        [dto.pickType, dto.hrNos, hrNames, existingRow.id],
      );
      const updated = await this.db.query(
        `SELECT up.*, r.id AS "race_id", r.meet AS "race_meet", r."rcDate" AS "race_rcDate", r."rcNo" AS "race_rcNo", r."rcName" AS "race_rcName"
         FROM user_picks up LEFT JOIN races r ON r.id = up."raceId" WHERE up.id = $1`,
        [existingRow.id],
      );
      const row = updated.rows[0] as Record<string, unknown>;
      const withRace = {
        ...row,
        race: row.race_id != null
          ? { id: row.race_id, meet: row.race_meet, rcDate: row.race_rcDate, rcNo: row.race_rcNo, rcName: row.race_rcName }
          : null,
      };
      return serializeItemsWithRace([withRace] as Parameters<typeof serializeItemsWithRace>[0])[0] ?? withRace;
    }

    const inserted = await this.db.query<{ id: number }>(
      `INSERT INTO user_picks ("userId", "raceId", "pickType", "hrNos", "hrNames") VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, dto.raceId, dto.pickType, dto.hrNos, hrNames],
    );
    const id = inserted.rows[0]?.id;
    if (id == null) throw new Error('User pick insert failed');
    const created = await this.db.query(
      `SELECT up.*, r.id AS "race_id", r.meet AS "race_meet", r."rcDate" AS "race_rcDate", r."rcNo" AS "race_rcNo", r."rcName" AS "race_rcName"
       FROM user_picks up LEFT JOIN races r ON r.id = up."raceId" WHERE up.id = $1`,
      [id],
    );
    const row = created.rows[0] as Record<string, unknown>;
    const withRace = {
      ...row,
      race: row.race_id != null
        ? { id: row.race_id, meet: row.race_meet, rcDate: row.race_rcDate, rcNo: row.race_rcNo, rcName: row.race_rcName }
        : null,
    };
    return serializeItemsWithRace([withRace] as Parameters<typeof serializeItemsWithRace>[0])[0] ?? withRace;
  }

  async findByUser(userId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [countRes, rowsRes] = await Promise.all([
      this.db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM user_picks WHERE "userId" = $1',
        [userId],
      ),
      this.db.query(
        `SELECT up.*, r.id AS "race_id", r.meet AS "race_meet", r."rcDate" AS "race_rcDate", r."rcNo" AS "race_rcNo", r."rcName" AS "race_rcName"
         FROM user_picks up LEFT JOIN races r ON r.id = up."raceId" WHERE up."userId" = $1 ORDER BY up."createdAt" DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
    ]);
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    const picks = rowsRes.rows.map((row: Record<string, unknown>) => ({
      ...row,
      race: row.race_id != null
        ? { id: row.race_id, meet: row.race_meet, rcDate: row.race_rcDate, rcNo: row.race_rcNo, rcName: row.race_rcName }
        : null,
    }));
    return {
      picks: serializeItemsWithRace(picks as Parameters<typeof serializeItemsWithRace>[0]),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByRace(raceId: number, userId?: number) {
    const conditions = ['up."raceId" = $1'];
    const params: unknown[] = [raceId];
    if (userId !== undefined) {
      conditions.push('up."userId" = $2');
      params.push(userId);
    }
    const { rows } = await this.db.query<{
      race_id: number | null;
      race_meet: string | null;
      race_rcDate: string | null;
      race_rcNo: string | null;
      race_rcName: string | null;
    }>(
      `SELECT up.*, r.id AS "race_id", r.meet AS "race_meet", r."rcDate" AS "race_rcDate", r."rcNo" AS "race_rcNo", r."rcName" AS "race_rcName"
       FROM user_picks up LEFT JOIN races r ON r.id = up."raceId" WHERE ${conditions.join(' AND ')} LIMIT 1`,
      params,
    );
    const pick = rows[0];
    if (!pick) return null;
    const withRace = {
      ...pick,
      race: pick.race_id != null
        ? { id: pick.race_id, meet: pick.race_meet, rcDate: pick.race_rcDate, rcNo: pick.race_rcNo, rcName: pick.race_rcName }
        : null,
    };
    return serializeItemsWithRace([withRace] as Parameters<typeof serializeItemsWithRace>[0])[0] ?? withRace;
  }

  async delete(userId: number, raceId: number) {
    const { rows } = await this.db.query(
      'SELECT id FROM user_picks WHERE "userId" = $1 AND "raceId" = $2',
      [userId, raceId],
    );
    if (!rows[0]) throw new NotFoundException('기록을 찾을 수 없습니다');
    const id = (rows[0] as { id: number }).id;
    await this.db.query('DELETE FROM user_picks WHERE id = $1', [id]);
    return { message: '삭제되었습니다' };
  }

  async getCorrectCount(userId: number): Promise<number> {
    const { rows: picks } = await this.db.query<{
      pickType: string;
      hrNos: string[];
      raceId: number;
    }>('SELECT "pickType", "hrNos", "raceId" FROM user_picks WHERE "userId" = $1', [
      userId,
    ]);

    let correct = 0;
    for (const pick of picks) {
      const res = await this.db.query<{ hrNo: string; ord: string | null }>(
        'SELECT "hrNo", ord FROM race_results WHERE "raceId" = $1 ORDER BY "ordInt" ASC, ord ASC',
        [pick.raceId],
      );
      const results = res.rows;
      if (results.length === 0) continue;
      const isHit = this.checkPickHit(
        pick.pickType as PickType,
        Array.isArray(pick.hrNos) ? pick.hrNos : [],
        results,
      );
      if (isHit) correct++;
    }
    return correct;
  }

  async getCorrectCountByUser(): Promise<Map<number, number>> {
    const { rows: picks } = await this.db.query<{
      userId: number;
      pickType: string;
      hrNos: string[];
      raceId: number;
    }>('SELECT "userId", "pickType", "hrNos", "raceId" FROM user_picks');

    const map = new Map<number, number>();
    for (const pick of picks) {
      const res = await this.db.query<{ hrNo: string; ord: string | null }>(
        'SELECT "hrNo", ord FROM race_results WHERE "raceId" = $1 ORDER BY "ordInt" ASC, ord ASC',
        [pick.raceId],
      );
      const results = res.rows;
      if (results.length === 0) continue;
      const isHit = this.checkPickHit(
        pick.pickType as PickType,
        Array.isArray(pick.hrNos) ? pick.hrNos : [],
        results,
      );
      if (isHit) {
        map.set(pick.userId, (map.get(pick.userId) ?? 0) + 1);
      }
    }
    return map;
  }

  checkPickHit(
    pickType: PickType,
    hrNos: string[],
    results: { hrNo: string; ord: string | null }[],
  ): boolean {
    const rank1 = results.find((r) => (r.ord ?? '') === '1');
    const rank2 = results.find((r) => (r.ord ?? '') === '2');
    const rank3 = results.find((r) => (r.ord ?? '') === '3');
    const top3 = [rank1, rank2, rank3].filter(Boolean).map((r) => r!.hrNo);

    switch (pickType) {
      case 'SINGLE':
        return rank1 !== undefined && hrNos[0] === rank1.hrNo;
      case 'PLACE':
        return rank1 !== undefined && top3.includes(hrNos[0]);
      case 'QUINELLA': {
        if (!rank1 || !rank2) return false;
        const set12 = new Set([rank1.hrNo, rank2.hrNo]);
        const setPickQ = new Set(hrNos);
        return set12.size === 2 && setPickQ.size === 2 && [...set12].every((h) => setPickQ.has(h));
      }
      case 'EXACTA':
        return (
          rank1 !== undefined &&
          rank2 !== undefined &&
          hrNos[0] === rank1.hrNo &&
          hrNos[1] === rank2.hrNo
        );
      case 'QUINELLA_PLACE':
        return top3.length >= 2 && hrNos.every((h) => top3.includes(h));
      case 'TRIFECTA': {
        if (!rank1 || !rank2 || !rank3) return false;
        const set123 = new Set([rank1.hrNo, rank2.hrNo, rank3.hrNo]);
        const setPick = new Set(hrNos);
        return set123.size === 3 && setPick.size === 3 && [...set123].every((h) => setPick.has(h));
      }
      case 'TRIPLE':
        return (
          rank1 !== undefined &&
          rank2 !== undefined &&
          rank3 !== undefined &&
          hrNos[0] === rank1.hrNo &&
          hrNos[1] === rank2.hrNo &&
          hrNos[2] === rank3.hrNo
        );
      default:
        return false;
    }
  }
}
