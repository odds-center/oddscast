import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { PicksService } from '../picks/picks.service';

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly picksService: PicksService,
  ) {}

  async getRankings(type: string = 'overall', limit: number = 20) {
    const correctCountMap = await this.picksService.getCorrectCountByUser();
    const userIds = [...correctCountMap.keys()];
    if (userIds.length === 0) {
      return { data: [], total: 0, type };
    }

    const users = await this.userRepo.find({
      where: { id: In(userIds), isActive: true },
      select: ['id', 'nickname', 'avatar'],
    });

    const rankings = users
      .map((user) => ({
        id: user.id,
        name: user.nickname,
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
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'nickname', 'avatar'],
    });
    const correctCount = await this.picksService.getCorrectCount(userId);

    return {
      data: {
        id: userId,
        rank: 0,
        name: user?.nickname || '',
        avatar: user?.avatar || '',
        correctCount,
        isCurrentUser: true,
      },
    };
  }
}
