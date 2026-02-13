import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PicksService } from '../picks/picks.service';

@Injectable()
export class RankingsService {
  constructor(
    private prisma: PrismaService,
    private picksService: PicksService,
  ) {}

  /**
   * 랭킹 = 맞춘 횟수 (많이 맞춘 유저 순).
   * UserPick + RaceResult 승식별 적중 판정.
   */
  async getRankings(type: string = 'overall', limit: number = 20) {
    const correctCountMap = await this.picksService.getCorrectCountByUser();
    const userIds = [...correctCountMap.keys()];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true },
      select: { id: true, name: true, nickname: true, avatar: true },
    });

    const rankings = users
      .map((user) => ({
        id: user.id,
        name: user.nickname || user.name,
        avatar: user.avatar || '',
        correctCount: correctCountMap.get(user.id) || 0,
        isCurrentUser: false,
      }))
      .filter((r) => r.correctCount > 0)
      .sort((a, b) => b.correctCount - a.correctCount)
      .slice(0, limit)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    return { data: rankings, total: rankings.length, type };
  }

  async getMyRanking(userId: number, _type: string = 'overall') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, nickname: true, avatar: true },
    });

    const correctCount = await this.picksService.getCorrectCount(userId);

    return {
      data: {
        id: userId,
        rank: 0,
        name: user?.nickname || user?.name || '',
        avatar: user?.avatar || '',
        correctCount,
        isCurrentUser: true,
      },
    };
  }
}
