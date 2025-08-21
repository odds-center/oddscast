import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { clamp, compact, inRange, mean, round, sum, uniq } from 'es-toolkit';
import { DataSource, Repository } from 'typeorm';
import { PointsService } from '../points/points.service';
import { Race } from '../races/entities/race.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { User } from '../users/entities/user.entity';
import { Bet, BetResult, BetStatus, BetType } from './entities/bet.entity';

export interface CreateBetDto {
  userId: string;
  raceId: string;
  betType: BetType;
  betName: string;
  betDescription?: string;
  betAmount: number;
  selections: {
    horses: string[];
    positions?: number[];
    combinations?: string[][];
  };
  betReason?: string;
  confidenceLevel?: number;
  analysisData?: any;
}

export interface UpdateBetDto {
  betStatus?: BetStatus;
  betResult?: BetResult;
  actualWin?: number;
  actualOdds?: number;
  raceResult?: any;
  notes?: string;
}

@Injectable()
export class BetsService {
  private readonly logger = new Logger(BetsService.name);

  constructor(
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Race)
    private readonly raceRepository: Repository<Race>,
    @InjectRepository(DividendRate)
    private readonly dividendRateRepository: Repository<DividendRate>,
    private readonly dataSource: DataSource,
    private readonly pointsService: PointsService
  ) {}

  /**
   * 마권 구매 생성
   */
  async createBet(createBetDto: CreateBetDto): Promise<Bet> {
    const { userId, raceId, betAmount } = createBetDto;

    // 사용자 확인
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // 경주 확인
    const race = await this.raceRepository.findOne({ where: { id: raceId } });
    if (!race) {
      throw new BadRequestException('경주를 찾을 수 없습니다.');
    }

    // 마권 유효성 검사
    await this.validateBet(createBetDto);

    // 배당률 계산
    const odds = await this.calculateOdds(createBetDto);

    // 예상 당첨금 계산
    const potentialWin = betAmount * odds;

    // 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 마권 생성
      const bet = this.betRepository.create({
        ...createBetDto,
        odds,
        potentialWin,
        betTime: new Date(),
        raceTime: race.rcStartTime ? new Date(race.rcStartTime) : undefined,
        betStatus: BetStatus.PENDING,
        betResult: BetResult.PENDING,
      });

      const savedBet = await queryRunner.manager.save(bet);

      // 포인트 차감
      await this.pointsService.usePoints(
        createBetDto.userId,
        createBetDto.betAmount,
        `베팅: ${bet.id}`
      );

      // 마권 통계 업데이트
      user.totalBets += 1;
      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
      this.logger.log(`마권 구매 완료: ${savedBet.id}`);

      return savedBet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('마권 구매 실패:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 마권 조회
   */
  async getBet(betId: string): Promise<Bet> {
    const bet = await this.betRepository.findOne({
      where: { id: betId },
      relations: ['user', 'race'],
    });

    if (!bet) {
      throw new BadRequestException('마권을 찾을 수 없습니다.');
    }

    return bet;
  }

  /**
   * 사용자 마권 목록 조회
   */
  async getUserBets(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: BetStatus,
    result?: BetResult
  ): Promise<{ bets: Bet[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.betRepository
      .createQueryBuilder('bet')
      .leftJoinAndSelect('bet.race', 'race')
      .where('bet.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('bet.betStatus = :status', { status });
    }

    if (result) {
      queryBuilder.andWhere('bet.betResult = :result', { result });
    }

    queryBuilder.orderBy('bet.betTime', 'DESC');

    const total = await queryBuilder.getCount();
    const bets = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      bets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 경주별 마권 목록 조회
   */
  async getRaceBets(raceId: string): Promise<Bet[]> {
    return this.betRepository.find({
      where: { raceId },
      relations: ['user'],
      order: { betTime: 'ASC' },
    });
  }

  /**
   * 마권 업데이트
   */
  async updateBet(betId: string, updateBetDto: UpdateBetDto): Promise<Bet> {
    const bet = await this.getBet(betId);

    // 마권 결과가 변경된 경우 포인트 처리
    if (updateBetDto.betResult && updateBetDto.betResult !== bet.betResult) {
      await this.processBetResult(
        bet,
        updateBetDto.betResult,
        updateBetDto.actualWin
      );
    }

    Object.assign(bet, updateBetDto);
    bet.updatedAt = new Date();

    if (
      updateBetDto.betResult &&
      updateBetDto.betResult !== BetResult.PENDING
    ) {
      bet.resultTime = new Date();
    }

    return this.betRepository.save(bet);
  }

  /**
   * 마권 취소
   */
  async cancelBet(betId: string): Promise<Bet> {
    const bet = await this.getBet(betId);

    if (bet.betStatus !== BetStatus.PENDING) {
      throw new BadRequestException('취소할 수 없는 마권입니다.');
    }

    // 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 마권 상태 변경
      bet.betStatus = BetStatus.CANCELLED;
      bet.betResult = BetResult.VOID;
      bet.updatedAt = new Date();
      await queryRunner.manager.save(bet);

      // 포인트 환불
      await this.pointsService.addPoints(bet.userId, {
        amount: bet.betAmount,
        type: 'REFUNDED',
        description: `베팅 취소 환불: ${bet.id}`,
      });

      // 마권 통계 업데이트
      const user = await queryRunner.manager.findOne(User, {
        where: { id: bet.userId },
      });
      user.totalBets -= 1;
      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
      this.logger.log(`마권 취소 완료: ${betId}`);

      return bet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('마권 취소 실패:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 마권 통계 조회
   */
  async getBetStatistics(userId: string): Promise<{
    totalBets: number;
    wonBets: number;
    lostBets: number;
    winRate: number;
    totalWinnings: number;
    totalLosses: number;
    roi: number;
    averageBetAmount: number;
    favoriteBetType: string;
    recentPerformance: any[];
  }> {
    const bets = await this.betRepository.find({
      where: { userId },
      order: { betTime: 'DESC' },
    });

    const totalBets = bets.length;
    const wonBets = bets.filter(bet => bet.betResult === BetResult.WIN).length;
    const lostBets = bets.filter(
      bet => bet.betResult === BetResult.LOSE
    ).length;
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

    const totalWinnings = bets
      .filter(bet => bet.actualWin && bet.actualWin > 0)
      .reduce((sum, bet) => sum + bet.actualWin!, 0);

    const totalLosses = bets
      .filter(bet => bet.betResult === BetResult.LOSE)
      .reduce((sum, bet) => sum + bet.betAmount, 0);

    const totalSpent = bets.reduce((sum, bet) => sum + bet.betAmount, 0);
    const roi =
      totalSpent > 0 ? ((totalWinnings - totalSpent) / totalSpent) * 100 : 0;

    const averageBetAmount = totalBets > 0 ? totalSpent / totalBets : 0;

    // 가장 많이 사용한 승식
    const betTypeCounts = bets.reduce(
      (acc, bet) => {
        acc[bet.betType] = (acc[bet.betType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const favoriteBetType = Object.entries(betTypeCounts).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ['', 0]
    )[0];

    // 최근 성과 (최근 10개 마권)
    const recentPerformance = bets.slice(0, 10).map(bet => ({
      id: bet.id,
      betType: bet.betType,
      betAmount: bet.betAmount,
      result: bet.betResult,
      actualWin: bet.actualWin,
      betTime: bet.betTime,
    }));

    return {
      totalBets,
      wonBets,
      lostBets,
      winRate,
      totalWinnings,
      totalLosses,
      roi,
      averageBetAmount,
      favoriteBetType,
      recentPerformance,
    };
  }

  /**
   * 마권 유효성 검사
   */
  private async validateBet(createBetDto: CreateBetDto): Promise<void> {
    const { betType, selections, betAmount } = createBetDto;

    // 마권 금액 검사
    if (betAmount <= 0) {
      throw new BadRequestException('마권 금액은 0보다 커야 합니다.');
    }

    if (betAmount < 100) {
      throw new BadRequestException('최소 마권 금액은 100포인트입니다.');
    }

    // 승식별 선택 검사
    this.validateBetSelections(betType, selections);
  }

  private validateBetSelections(
    betType: BetType,
    selections: CreateBetDto['selections']
  ): void {
    // null/undefined 값 제거하고 유효한 선택지만 필터링
    const validHorses = compact(selections.horses);
    const uniqueHorses = uniq(validHorses);

    // 중복 제거 후 실제 선택된 말의 수
    const actualHorseCount = uniqueHorses.length;

    if (actualHorseCount === 0) {
      throw new BadRequestException('최소 1마리의 말을 선택해야 합니다.');
    }

    switch (betType) {
      case BetType.WIN:
      case BetType.PLACE:
        if (actualHorseCount !== 1) {
          throw new BadRequestException(
            '단승식/복승식 마권은 1마리를 선택해야 합니다.'
          );
        }
        break;
      case BetType.QUINELLA:
      case BetType.QUINELLA_PLACE:
        if (actualHorseCount !== 2) {
          throw new BadRequestException(
            '연승식 마권은 2마리를 선택해야 합니다.'
          );
        }
        break;
      case BetType.EXACTA:
        if (actualHorseCount !== 2) {
          throw new BadRequestException(
            '쌍승식 마권은 2마리를 선택해야 합니다.'
          );
        }
        if (
          !selections.positions ||
          compact(selections.positions).length !== 2
        ) {
          throw new BadRequestException(
            '쌍승식 마권은 순서를 지정해야 합니다.'
          );
        }
        break;
      case BetType.TRIFECTA:
        if (actualHorseCount !== 3) {
          throw new BadRequestException(
            '삼복승식 마권은 3마리를 선택해야 합니다.'
          );
        }
        break;
      default:
        throw new BadRequestException('지원하지 않는 승식입니다.');
    }
  }

  /**
   * 배당률 계산
   */
  private async calculateOdds(createBetDto: CreateBetDto): Promise<number> {
    // 실제 배당률은 KRA API에서 가져와야 하지만, 여기서는 기본값 사용
    const baseOdds = {
      [BetType.WIN]: 3.5, // 단승식
      [BetType.PLACE]: 1.8, // 복승식
      [BetType.QUINELLA]: 8.0, // 연승식
      [BetType.QUINELLA_PLACE]: 3.2, // 복연승식
      [BetType.EXACTA]: 12.0, // 쌍승식
      [BetType.TRIFECTA]: 25.0, // 삼복승식
      [BetType.TRIPLE]: 35.0, // 삼쌍승식
    };

    return baseOdds[createBetDto.betType] || 2.0;
  }

  /**
   * 마권 결과 처리
   */
  private async processBetResult(
    bet: Bet,
    result: BetResult,
    actualWin?: number
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: bet.userId },
      relations: ['pointBalance'],
    });
    if (!user) return;

    // 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (result === BetResult.WIN && actualWin && actualWin > 0) {
        // 당첨 처리 - 새로운 포인트 서비스 사용
        await this.pointsService.addPoints(bet.userId, {
          amount: actualWin,
          type: 'EARNED',
          description: `베팅 당첨: ${bet.id}`,
        });

        // 마권 통계 업데이트
        user.totalWinnings += actualWin;
        user.wonBets += 1;
      } else if (result === BetResult.LOSE) {
        // 미당첨 처리
        user.lostBets += 1;
        user.totalLosses += bet.betAmount;
      }

      // 단승률 및 ROI 계산
      const totalBets = sum([user.wonBets, user.lostBets]);
      user.winRate =
        totalBets > 0 ? round((user.wonBets / totalBets) * 100, 2) : 0;

      // totalPointsSpent를 UserPointBalance에서 가져오기
      const totalPointsSpent = user.pointBalance?.totalPointsSpent || 0;
      user.roi =
        totalPointsSpent > 0
          ? round(
              ((user.totalWinnings - totalPointsSpent) / totalPointsSpent) *
                100,
              2
            )
          : 0;

      // 값 범위 제한 (0-100%)
      user.winRate = clamp(user.winRate, 0, 100);

      // 평균 당첨금 계산 (당첨이 있는 경우)
      if (user.wonBets > 0) {
        const avgWinning = mean([user.totalWinnings / user.wonBets]);
        // 평균 당첨금이 합리적인 범위 내에 있는지 확인
        if (!inRange(avgWinning, 0, 1000000)) {
          // 0원 ~ 100만원 범위
          this.logger.warn(`비정상적인 평균 당첨금: ${avgWinning}원`);
        }
      }

      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('마권 결과 처리 실패:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
