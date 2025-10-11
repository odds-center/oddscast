import { Injectable, Logger } from '@nestjs/common';
import { BetsService } from '../bets/bets.service';
import { RacesService } from '../races/races.service';
import { RankingsService } from '../rankings/rankings.service';
import { RankingType } from '../rankings/entities/user-ranking.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  TodayRacesResponseDto,
  UserStatsResponseDto,
  BetStatisticsDto,
} from './dto/index';

/**
 * 홈 화면 서비스
 */
@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    private readonly betsService: BetsService,
    private readonly racesService: RacesService,
    private readonly rankingsService: RankingsService,
    private readonly subscriptionsService: SubscriptionsService
  ) {}

  /**
   * 오늘의 경주 목록 조회
   */
  async getTodayRaces(userId?: string): Promise<TodayRacesResponseDto> {
    this.logger.log('오늘의 경주 목록 조회 시작');

    try {
      // 오늘 날짜 계산
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // 오늘의 경주 목록 조회
      const races = await this.racesService.findByDate(todayStr);

      // 각 경주에 대한 추가 정보 (AI 분석, 트랙 컨디션 등) 추가
      const enrichedRaces = await Promise.all(
        races.slice(0, 10).map(async race => {
          // AI 분석 데이터 추가 (실제로는 AI 서비스에서 가져와야 함)
          const aiAnalysis = {
            confidence: Math.floor(Math.random() * 30) + 70, // 70-100% 랜덤
            recommendation: `${race.rcName}에서는 안정적인 단승을 추천합니다.`,
            factors: [
              {
                name: '최근 실적',
                impact: 9,
                description:
                  '최근 3경주에서 2승 1착으로 뛰어난 폼을 유지하고 있습니다.',
              },
              {
                name: '기수 실력',
                impact: 8,
                description:
                  '박태종 기수는 제주 트랙에서 승률 35%로 최상위권입니다.',
              },
              {
                name: '트랙 컨디션',
                impact: 7,
                description:
                  '빠른 마사는 천리마의 주행 스타일과 완벽하게 맞습니다.',
              },
            ],
          };

          // 트랙 컨디션 데이터 추가
          const trackCondition = {
            weather: ['sunny', 'cloudy', 'rainy'][
              Math.floor(Math.random() * 3)
            ],
            temperature: Math.floor(Math.random() * 10) + 15, // 15-25°C
            humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
            surface: ['fast', 'good', 'soft', 'heavy'][
              Math.floor(Math.random() * 4)
            ],
          };

          // 말들의 베팅 통계 추가 (Race 엔티티에 horses가 없으므로 빈 배열로 설정)
          const horsesWithStats: any[] = [];

          return {
            ...race,
            generateId: race.generateId,
            aiAnalysis,
            trackCondition,
            horses: horsesWithStats,
          };
        })
      );

      return {
        races: enrichedRaces,
        total: enrichedRaces.length,
        date: todayStr,
      };
    } catch (error) {
      this.logger.error('오늘의 경주 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 통계 조회
   */
  async getUserStats(userId: string): Promise<UserStatsResponseDto> {
    this.logger.log(`사용자 통계 조회: userId=${userId}`);

    try {
      // 베팅 통계 조회
      const betStats = await this.betsService.getBetStatistics(userId);

      // 구독 상태 조회
      const subscription =
        await this.subscriptionsService.getActiveSubscription(userId);

      return {
        betStatistics: betStats,
        isSubscribed: !!subscription,
        subscriptionPlan: subscription?.planId || null,
        subscriptionExpiry: subscription?.nextBillingDate || null,
      };
    } catch (error) {
      this.logger.error('사용자 통계 조회 실패:', error);
      // 베팅 통계 조회 실패 시 기본값 반환
      const defaultBetStats: BetStatisticsDto = {
        totalBets: 0,
        wonBets: 0,
        lostBets: 0,
        winRate: 0,
        totalWinnings: 0,
        totalLosses: 0,
        roi: 0,
        averageBetAmount: 0,
        maxWin: 0,
        maxLoss: 0,
        currentStreak: 0,
        maxStreak: 0,
        betsByType: {},
        monthlyStats: [],
      };

      const subscription =
        await this.subscriptionsService.getActiveSubscription(userId);
      return {
        betStatistics: defaultBetStats,
        isSubscribed: !!subscription,
        subscriptionPlan: subscription?.planId || null,
        subscriptionExpiry: subscription?.nextBillingDate || null,
      };
    }
  }

  /**
   * 홈 대시보드 데이터 조회 (모든 데이터를 한 번에)
   */
  async getDashboard(userId: string) {
    this.logger.log(`홈 대시보드 데이터 조회: userId=${userId}`);

    try {
      // 병렬로 모든 데이터 조회
      const [todayRaces, userStats, rankings] = await Promise.all([
        this.getTodayRaces(userId),
        this.getUserStats(userId),
        this.rankingsService.getRankings({
          type: RankingType.OVERALL,
          limit: 3,
          page: 1,
        }),
      ]);

      return {
        todayRaces,
        userStats,
        topRankings: rankings.data || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('홈 대시보드 데이터 조회 실패:', error);
      throw error;
    }
  }
}
