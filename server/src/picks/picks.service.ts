import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePickDto, PICK_TYPE_HORSE_COUNTS } from './dto/pick.dto';
import { PickType } from '@prisma/client';

@Injectable()
export class PicksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePickDto) {
    const race = await this.prisma.race.findUnique({
      where: { id: dto.raceId },
    });
    if (!race) throw new NotFoundException('경주를 찾을 수 없습니다');

    const requiredCount = PICK_TYPE_HORSE_COUNTS[dto.pickType];
    if (!dto.hrNos || dto.hrNos.length !== requiredCount) {
      throw new BadRequestException(
        `${dto.pickType}은(는) ${requiredCount}마리를 선택해야 합니다.`,
      );
    }

    const hrNames = dto.hrNames ?? dto.hrNos.map(() => '');

    const existing = await this.prisma.userPick.findUnique({
      where: {
        userId_raceId: { userId, raceId: dto.raceId },
      },
    });
    if (existing) {
      return this.prisma.userPick.update({
        where: { id: existing.id },
        data: {
          pickType: dto.pickType,
          hrNos: dto.hrNos,
          hrNames,
        },
        include: { race: true },
      });
    }

    return this.prisma.userPick.create({
      data: {
        userId,
        raceId: dto.raceId,
        pickType: dto.pickType,
        hrNos: dto.hrNos,
        hrNames,
      },
      include: { race: true },
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [picks, total] = await Promise.all([
      this.prisma.userPick.findMany({
        where: { userId },
        include: { race: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.userPick.count({ where: { userId } }),
    ]);

    return { picks, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findByRace(raceId: string, userId?: string) {
    const where: { raceId: string; userId?: string } = { raceId };
    if (userId) where.userId = userId;

    const pick = await this.prisma.userPick.findFirst({
      where,
      include: { race: true },
    });
    return pick;
  }

  async delete(userId: string, raceId: string) {
    const pick = await this.prisma.userPick.findFirst({
      where: { userId, raceId },
    });
    if (!pick) throw new NotFoundException('기록을 찾을 수 없습니다');
    await this.prisma.userPick.delete({ where: { id: pick.id } });
    return { message: '삭제되었습니다' };
  }

  /**
   * 맞춘 횟수 계산 (SINGLE: 1등, PLACE: 1~3등, 그 외 승식별)
   */
  async getCorrectCount(userId: string): Promise<number> {
    const picks = await this.prisma.userPick.findMany({
      where: { userId },
      include: {
        race: {
          include: {
            results: { orderBy: { rcRank: 'asc' } },
          },
        },
      },
    });

    let correct = 0;
    for (const pick of picks) {
      const results = pick.race?.results ?? [];
      if (results.length === 0) continue;

      const isHit = this.checkPickHit(pick.pickType, pick.hrNos, results);
      if (isHit) correct++;
    }
    return correct;
  }

  /**
   * 유저별 맞춘 횟수 집계 (랭킹용)
   */
  async getCorrectCountByUser(): Promise<Map<string, number>> {
    const picks = await this.prisma.userPick.findMany({
      include: {
        race: {
          include: {
            results: { orderBy: { rcRank: 'asc' } },
          },
        },
      },
    });

    const map = new Map<string, number>();
    for (const pick of picks) {
      const results = pick.race?.results ?? [];
      if (results.length === 0) continue;
      const isHit = this.checkPickHit(pick.pickType, pick.hrNos, results);
      if (isHit) {
        map.set(pick.userId, (map.get(pick.userId) ?? 0) + 1);
      }
    }
    return map;
  }

  /**
   * 적중 여부 판정 (승식별)
   */
  checkPickHit(pickType: PickType, hrNos: string[], results: { hrNo: string; rcRank: string | null }[]): boolean {
    const rank1 = results.find((r) => (r.rcRank ?? '') === '1');
    const rank2 = results.find((r) => (r.rcRank ?? '') === '2');
    const rank3 = results.find((r) => (r.rcRank ?? '') === '3');
    const top3 = [rank1, rank2, rank3].filter(Boolean).map((r) => r!.hrNo);

    switch (pickType) {
      case 'SINGLE':
        return rank1 !== undefined && hrNos[0] === rank1.hrNo;
      case 'PLACE':
        return rank1 !== undefined && top3.includes(hrNos[0]);
      case 'QUINELLA':
        if (!rank1 || !rank2) return false;
        const set12 = new Set([rank1.hrNo, rank2.hrNo]);
        const setPickQ = new Set(hrNos);
        return set12.size === 2 && setPickQ.size === 2 &&
          [...set12].every((h) => setPickQ.has(h));
      case 'EXACTA':
        return rank1 !== undefined && rank2 !== undefined &&
          hrNos[0] === rank1.hrNo && hrNos[1] === rank2.hrNo;
      case 'QUINELLA_PLACE':
        return top3.length >= 2 && hrNos.every((h) => top3.includes(h));
      case 'TRIFECTA':
        if (!rank1 || !rank2 || !rank3) return false;
        const set123 = new Set([rank1.hrNo, rank2.hrNo, rank3.hrNo]);
        const setPick = new Set(hrNos);
        return set123.size === 3 && setPick.size === 3 &&
          [...set123].every((h) => setPick.has(h));
      case 'TRIPLE':
        return rank1 !== undefined && rank2 !== undefined && rank3 !== undefined &&
          hrNos[0] === rank1.hrNo && hrNos[1] === rank2.hrNo && hrNos[2] === rank3.hrNo;
      default:
        return false;
    }
  }
}
