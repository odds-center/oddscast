import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { UserRanking, RankingType } from './entities/user-ranking.entity';
import { RankingQueryDto } from './dto/ranking-query.dto';
import {
  RankingUserDto,
  RankingsResponseDto,
  MyRankingResponseDto,
} from './dto/ranking-response.dto';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RankingsService {
  private readonly logger = new Logger(RankingsService.name);

  constructor(
    @InjectRepository(UserRanking)
    private readonly rankingRepository: Repository<UserRanking>
  ) {}

  /**
   * 랭킹 목록 조회
   */
  async getRankings(query: RankingQueryDto): Promise<RankingsResponseDto> {
    const { type = RankingType.OVERALL, limit = 10, page = 1 } = query;

    try {
      const { periodStart, periodEnd } = this.getPeriodDates(type);

      const [rankings, total] = await this.rankingRepository.findAndCount({
        where: {
          rankingType: type,
          periodStart,
          periodEnd,
        },
        order: {
          rankPosition: 'ASC',
        },
        take: limit,
        skip: (page - 1) * limit,
        relations: ['user'],
      });

      const data = rankings.map(ranking =>
        this.mapToRankingUserDto(ranking, false)
      );

      return {
        success: true,
        data,
        total,
        type,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`랭킹 조회 실패: ${error.message}`, error.stack);
      // 실패 시 빈 데이터 반환
      return {
        success: false,
        data: [],
        total: 0,
        type,
        page,
        limit,
      };
    }
  }

  /**
   * 내 랭킹 조회
   */
  async getMyRanking(
    userId: string,
    type: RankingType = RankingType.OVERALL
  ): Promise<MyRankingResponseDto> {
    try {
      const { periodStart, periodEnd } = this.getPeriodDates(type);

      const ranking = await this.rankingRepository.findOne({
        where: {
          userId,
          rankingType: type,
          periodStart,
          periodEnd,
        },
        relations: ['user'],
      });

      if (!ranking) {
        this.logger.warn(
          `랭킹 정보를 찾을 수 없습니다. userId: ${userId}, type: ${type}`
        );
        // 랭킹 정보가 없을 경우 기본값 반환
        return {
          success: true,
          data: {
            id: uuidv4(),
            rank: 0,
            userId,
            name: '나',
            avatar: '🎮',
            winRate: 0,
            totalBets: 0,
            totalWinnings: 0,
            isCurrentUser: true,
            score: 0,
            roi: 0,
          },
        };
      }

      return {
        success: true,
        data: this.mapToRankingUserDto(ranking, true),
      };
    } catch (error) {
      this.logger.error(`내 랭킹 조회 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 랭킹 업데이트 (배치 작업용)
   */
  async updateRankings(type: RankingType): Promise<void> {
    this.logger.log(`랭킹 업데이트 시작: ${type}`);

    try {
      // 실제 베팅 데이터 기반으로 랭킹 계산 로직
      // TODO: 베팅 데이터에서 통계 계산 및 랭킹 생성

      this.logger.log(`랭킹 업데이트 완료: ${type}`);
    } catch (error) {
      this.logger.error(`랭킹 업데이트 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 기간별 시작일/종료일 계산
   */
  private getPeriodDates(type: RankingType): {
    periodStart: Date;
    periodEnd: Date;
  } {
    const now = moment();
    let periodStart: moment.Moment;
    let periodEnd: moment.Moment;

    switch (type) {
      case RankingType.WEEKLY:
        periodStart = now.clone().startOf('week');
        periodEnd = now.clone().endOf('week');
        break;

      case RankingType.MONTHLY:
        periodStart = now.clone().startOf('month');
        periodEnd = now.clone().endOf('month');
        break;

      case RankingType.YEARLY:
        periodStart = now.clone().startOf('year');
        periodEnd = now.clone().endOf('year');
        break;

      case RankingType.OVERALL:
      default:
        periodStart = moment('2020-01-01'); // 서비스 시작일
        periodEnd = moment('2099-12-31'); // 충분히 먼 미래
        break;
    }

    return {
      periodStart: periodStart.toDate(),
      periodEnd: periodEnd.toDate(),
    };
  }

  /**
   * 엔티티를 DTO로 변환
   */
  private mapToRankingUserDto(
    ranking: UserRanking,
    isCurrentUser: boolean
  ): RankingUserDto {
    return {
      id: ranking.id,
      rank: ranking.rankPosition,
      userId: ranking.userId,
      name: ranking.user?.name || '알 수 없음',
      avatar: ranking.user?.avatar || '🎮',
      winRate: parseFloat(ranking.winRate.toString()),
      totalBets: ranking.totalBets,
      totalWinnings: parseFloat(ranking.totalWinnings.toString()),
      isCurrentUser,
      score: parseFloat(ranking.score.toString()),
      roi: parseFloat(ranking.roi.toString()),
    };
  }
}
