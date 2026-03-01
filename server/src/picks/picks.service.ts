import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPick } from '../database/entities/user-pick.entity';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { CreatePickDto, PICK_TYPE_HORSE_COUNTS } from './dto/pick.dto';
import { PickType } from '../database/db-enums';
import { serializeItemsWithRace } from '../common/serializers/kra.serializer';

@Injectable()
export class PicksService {
  constructor(
    @InjectRepository(UserPick) private readonly userPickRepo: Repository<UserPick>,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceResult) private readonly resultRepo: Repository<RaceResult>,
  ) {}

  async create(userId: number, dto: CreatePickDto) {
    const race = await this.raceRepo.findOne({ where: { id: dto.raceId } });
    if (!race) throw new NotFoundException('경주를 찾을 수 없습니다');

    const requiredCount = PICK_TYPE_HORSE_COUNTS[dto.pickType];
    if (!dto.hrNos || dto.hrNos.length !== requiredCount) {
      throw new BadRequestException(
        `${dto.pickType}은(는) ${requiredCount}마리를 선택해야 합니다.`,
      );
    }

    const hrNames = dto.hrNames ?? dto.hrNos.map(() => '');

    const existing = await this.userPickRepo.findOne({
      where: { userId, raceId: dto.raceId },
    });

    if (existing) {
      existing.pickType = dto.pickType as PickType;
      existing.hrNos = dto.hrNos;
      existing.hrNames = hrNames;
      await this.userPickRepo.save(existing);
      const updated = await this.userPickRepo.findOne({
        where: { id: existing.id },
        relations: ['race'],
      });
      const item = updated
        ? {
            ...updated,
            race: updated.race
              ? {
                  id: updated.race.id,
                  meet: updated.race.meet,
                  rcDate: updated.race.rcDate,
                  rcNo: updated.race.rcNo,
                  rcName: updated.race.rcName,
                }
              : null,
          }
        : null;
      return item ? serializeItemsWithRace([item])[0] ?? item : null;
    }

    const created = await this.userPickRepo.save({
      userId,
      raceId: dto.raceId,
      pickType: dto.pickType as PickType,
      hrNos: dto.hrNos,
      hrNames,
    });
    const withRace = await this.userPickRepo.findOne({
      where: { id: created.id },
      relations: ['race'],
    });
    const item = withRace
      ? {
          ...withRace,
          race: withRace.race
            ? {
                id: withRace.race.id,
                meet: withRace.race.meet,
                rcDate: withRace.race.rcDate,
                rcNo: withRace.race.rcNo,
                rcName: withRace.race.rcName,
              }
            : null,
        }
      : null;
    return item ? serializeItemsWithRace([item])[0] ?? item : null;
  }

  async findByUser(userId: number, page = 1, limit = 20) {
    const [picks, total] = await this.userPickRepo.findAndCount({
      where: { userId },
      relations: ['race'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    const items = picks.map((p) => ({
      ...p,
      race: p.race
        ? {
            id: p.race.id,
            meet: p.race.meet,
            rcDate: p.race.rcDate,
            rcNo: p.race.rcNo,
            rcName: p.race.rcName,
          }
        : null,
    }));
    return {
      picks: serializeItemsWithRace(items as Parameters<typeof serializeItemsWithRace>[0]),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByRace(raceId: number, userId?: number) {
    const where: { raceId: number; userId?: number } = { raceId };
    if (userId !== undefined) where.userId = userId;
    const pick = await this.userPickRepo.findOne({
      where,
      relations: ['race'],
    });
    if (!pick) return null;
    const item = {
      ...pick,
      race: pick.race
        ? {
            id: pick.race.id,
            meet: pick.race.meet,
            rcDate: pick.race.rcDate,
            rcNo: pick.race.rcNo,
            rcName: pick.race.rcName,
          }
        : null,
    };
    return serializeItemsWithRace([item] as Parameters<typeof serializeItemsWithRace>[0])[0] ?? item;
  }

  async delete(userId: number, raceId: number) {
    const pick = await this.userPickRepo.findOne({
      where: { userId, raceId },
    });
    if (!pick) throw new NotFoundException('기록을 찾을 수 없습니다');
    await this.userPickRepo.delete(pick.id);
    return { message: '삭제되었습니다' };
  }

  async getCorrectCount(userId: number): Promise<number> {
    const picks = await this.userPickRepo.find({
      where: { userId },
      select: ['pickType', 'hrNos', 'raceId'],
    });

    let correct = 0;
    for (const pick of picks) {
      const results = await this.resultRepo.find({
        where: { raceId: pick.raceId },
        order: { ordInt: 'ASC', ord: 'ASC' },
        select: ['hrNo', 'ord'],
      });
      if (results.length === 0) continue;
      const isHit = this.checkPickHit(
        pick.pickType,
        Array.isArray(pick.hrNos) ? pick.hrNos : [],
        results.map((r) => ({ hrNo: r.hrNo, ord: r.ord })),
      );
      if (isHit) correct++;
    }
    return correct;
  }

  async getCorrectCountByUser(): Promise<Map<number, number>> {
    const picks = await this.userPickRepo.find({
      select: ['userId', 'pickType', 'hrNos', 'raceId'],
    });

    const map = new Map<number, number>();
    for (const pick of picks) {
      const results = await this.resultRepo.find({
        where: { raceId: pick.raceId },
        order: { ordInt: 'ASC', ord: 'ASC' },
        select: ['hrNo', 'ord'],
      });
      if (results.length === 0) continue;
      const isHit = this.checkPickHit(
        pick.pickType,
        Array.isArray(pick.hrNos) ? pick.hrNos : [],
        results.map((r) => ({ hrNo: r.hrNo, ord: r.ord })),
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
