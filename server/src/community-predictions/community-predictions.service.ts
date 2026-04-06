import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CommunityPrediction } from '../database/entities/community-prediction.entity';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { User } from '../database/entities/user.entity';
import { SubmitCommunityPredictionDto } from './dto/community-prediction.dto';
import { RaceStatus } from '../database/db-enums';

@Injectable()
export class CommunityPredictionsService {
  private readonly logger = new Logger(CommunityPredictionsService.name);

  constructor(
    @InjectRepository(CommunityPrediction)
    private readonly cpRepo: Repository<CommunityPrediction>,
    @InjectRepository(Race)
    private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceResult)
    private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async submit(userId: number, dto: SubmitCommunityPredictionDto): Promise<CommunityPrediction> {
    const race = await this.raceRepo.findOne({ where: { id: dto.raceId } });
    if (!race) throw new NotFoundException('Race not found');
    if (race.status === RaceStatus.COMPLETED) {
      throw new BadRequestException('Cannot submit prediction for a completed race');
    }

    const existing = await this.cpRepo.findOne({ where: { userId, raceId: dto.raceId } });
    if (existing) throw new ConflictException('Already submitted prediction for this race');

    const cp = this.cpRepo.create({
      userId,
      raceId: dto.raceId,
      predictedHrNos: dto.predictedHrNos.slice(0, 3),
    });
    return this.cpRepo.save(cp);
  }

  async getMyPredictions(userId: number, page = 1, limit = 20) {
    const safeLimit = Math.min(50, Math.max(1, limit));
    const safePage = Math.max(1, page);
    const [items, total] = await this.cpRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { items, total, page: safePage, limit: safeLimit };
  }

  async getRacePredictions(raceId: number) {
    return this.cpRepo.find({
      where: { raceId },
      order: { score: 'DESC', createdAt: 'ASC' },
      take: 50,
    });
  }

  async scoreRacePredictions(raceId: number): Promise<void> {
    // Get actual top-3 finishers sorted by ordInt ASC NULLS LAST
    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .select(['rr.hrNo', 'rr.ordInt'])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC', 'NULLS LAST')
      .addOrderBy('rr.ord', 'ASC')
      .limit(3)
      .getMany();

    if (results.length === 0) {
      this.logger.warn(`No results found for race ${raceId}, skipping community prediction scoring`);
      return;
    }

    const actualTop3 = results.map((r) => r.hrNo).filter(Boolean);
    const predictions = await this.cpRepo.find({ where: { raceId } });

    if (predictions.length === 0) return;

    const now = new Date();
    for (const pred of predictions) {
      const matches = pred.predictedHrNos.filter((hrNo) => actualTop3.includes(hrNo)).length;
      pred.score = matches;
      pred.scoredAt = now;
    }
    await this.cpRepo.save(predictions);
    this.logger.log(
      `Scored ${predictions.length} community predictions for race ${raceId} (top3: [${actualTop3.join(',')}])`,
    );
  }

  async getLeaderboard(period: 'weekly' | 'monthly' | 'alltime' = 'weekly', limit = 20) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const now = new Date();
    let since: Date | undefined;
    if (period === 'weekly') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const qb = this.cpRepo
      .createQueryBuilder('cp')
      .select('cp.user_id', 'userId')
      .addSelect('SUM(cp.score)', 'totalScore')
      .addSelect('COUNT(cp.id)', 'predictionCount')
      .addSelect('SUM(CASE WHEN cp.score = 3 THEN 1 ELSE 0 END)', 'perfectPredictions')
      .where('cp.scored_at IS NOT NULL')
      .groupBy('cp.user_id')
      .orderBy('"totalScore"', 'DESC')
      .addOrderBy('"predictionCount"', 'ASC')
      .limit(safeLimit);

    if (since) {
      qb.andWhere('cp.created_at >= :since', { since });
    }

    const rows = await qb.getRawMany<{
      userId: string;
      totalScore: string;
      predictionCount: string;
      perfectPredictions: string;
    }>();

    const userIds = rows.map((r) => Number(r.userId));
    const users =
      userIds.length > 0
        ? await this.userRepo.findBy({ id: In(userIds) })
        : [];
    const displayMap = new Map(
      users.map((u) => [u.id, u.nickname ?? u.name ?? '사용자']),
    );

    return {
      entries: rows.map((r, idx) => ({
        userId: Number(r.userId),
        displayName: displayMap.get(Number(r.userId)) ?? '사용자',
        totalScore: Number(r.totalScore),
        predictionCount: Number(r.predictionCount),
        perfectPredictions: Number(r.perfectPredictions),
        rank: idx + 1,
      })),
      period,
      generatedAt: new Date(),
    };
  }
}
