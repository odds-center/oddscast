import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserPointBalance } from '../entities/user-point-balance.entity';
import {
  UserPoints,
  PointTransactionType,
  PointStatus,
} from '../entities/user-points.entity';
import { User } from '../entities/user.entity';

export interface CreatePointTransactionDto {
  userId: string;
  transactionType: PointTransactionType;
  amount: number;
  description: string;
  details?: string;
  metadata?: any;
  isExpirable?: boolean;
  expiryDate?: Date;
}

export interface UpdatePointBalanceDto {
  currentPoints?: number;
  totalPointsEarned?: number;
  totalPointsSpent?: number;
  bonusPoints?: number;
  regularPoints?: number;
}

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    @InjectRepository(UserPointBalance)
    private readonly pointBalanceRepository: Repository<UserPointBalance>,
    @InjectRepository(UserPoints)
    private readonly pointTransactionRepository: Repository<UserPoints>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * 사용자 포인트 잔액 조회
   */
  async getUserPointBalance(userId: string): Promise<UserPointBalance> {
    let pointBalance = await this.pointBalanceRepository.findOne({
      where: { userId },
    });

    if (!pointBalance) {
      // 포인트 잔액이 없으면 생성
      pointBalance = this.pointBalanceRepository.create({
        userId,
        currentPoints: 0,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
        bonusPoints: 0,
        regularPoints: 0,
        totalTransactions: 0,
        bonusTransactions: 0,
        regularTransactions: 0,
        lockedPoints: 0,
        pointStatus: 'ACTIVE',
      });
      await this.pointBalanceRepository.save(pointBalance);
    }

    return pointBalance;
  }

  /**
   * 포인트 거래 생성
   */
  async createPointTransaction(
    createTransactionDto: CreatePointTransactionDto
  ): Promise<UserPoints> {
    const { userId, amount, transactionType } = createTransactionDto;

    // 사용자 확인
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 포인트 잔액 조회 또는 생성
    let pointBalance = await this.getUserPointBalance(userId);

    // 거래 금액 검증
    if (transactionType === PointTransactionType.BET_PLACED) {
      if (pointBalance.currentPoints < Math.abs(amount)) {
        throw new BadRequestException('포인트가 부족합니다.');
      }
    }

    // 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 포인트 거래 기록 생성
      const transaction = this.pointTransactionRepository.create({
        ...createTransactionDto,
        balanceAfter: pointBalance.currentPoints + amount,
        transactionTime: new Date(),
        isExpirable: createTransactionDto.isExpirable || false,
        expiryDate: createTransactionDto.expiryDate,
        isBonus: [
          PointTransactionType.SIGNUP_BONUS,
          PointTransactionType.DAILY_LOGIN,
          PointTransactionType.REFERRAL_BONUS,
          PointTransactionType.EVENT_BONUS,
        ].includes(transactionType),
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      // 포인트 잔액 업데이트
      pointBalance.currentPoints += amount;

      if (amount > 0) {
        pointBalance.totalPointsEarned += amount;
        if (transaction.isBonus) {
          pointBalance.bonusPoints += amount;
          pointBalance.bonusTransactions += 1;
        } else {
          pointBalance.regularPoints += amount;
          pointBalance.regularTransactions += 1;
        }
      } else {
        pointBalance.totalPointsSpent += Math.abs(amount);
        pointBalance.regularTransactions += 1;
      }

      pointBalance.totalTransactions += 1;
      pointBalance.lastTransactionTime = new Date();
      pointBalance.lastTransactionType = transactionType;
      pointBalance.lastTransactionAmount = amount;

      // 만료 정보 업데이트
      if (transaction.isExpirable && transaction.expiryDate) {
        if (
          !pointBalance.nextExpiryDate ||
          transaction.expiryDate < pointBalance.nextExpiryDate
        ) {
          pointBalance.nextExpiryDate = transaction.expiryDate;
        }
        pointBalance.expiringPoints += amount;
      }

      // 사용 가능한 포인트 계산
      pointBalance.availablePoints =
        pointBalance.currentPoints - pointBalance.lockedPoints;

      await queryRunner.manager.save(pointBalance);

      await queryRunner.commitTransaction();
      this.logger.log(`포인트 거래 생성 완료: ${savedTransaction.id}`);

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('포인트 거래 생성 실패:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 포인트 잔액 업데이트
   */
  async updatePointBalance(
    userId: string,
    updateDto: UpdatePointBalanceDto
  ): Promise<UserPointBalance> {
    const pointBalance = await this.getUserPointBalance(userId);

    Object.assign(pointBalance, updateDto);
    pointBalance.updatedAt = new Date();

    // 사용 가능한 포인트 재계산
    pointBalance.availablePoints =
      pointBalance.currentPoints - pointBalance.lockedPoints;

    return this.pointBalanceRepository.save(pointBalance);
  }

  /**
   * 포인트 차감 (베팅 시)
   */
  async deductPoints(
    userId: string,
    amount: number,
    betId: string
  ): Promise<UserPoints> {
    const pointBalance = await this.getUserPointBalance(userId);

    if (pointBalance.currentPoints < amount) {
      throw new BadRequestException('포인트가 부족합니다.');
    }

    // 베팅 중인 포인트로 잠금
    pointBalance.lockedPoints += amount;
    pointBalance.availablePoints =
      pointBalance.currentPoints - pointBalance.lockedPoints;

    await this.pointBalanceRepository.save(pointBalance);

    // 포인트 거래 기록
    return this.createPointTransaction({
      userId,
      transactionType: PointTransactionType.BET_PLACED,
      amount: -amount,
      description: `베팅: ${amount} 포인트 차감`,
      details: `베팅 ID: ${betId}`,
      metadata: { betId },
    });
  }

  /**
   * 포인트 환불 (베팅 취소 시)
   */
  async refundPoints(
    userId: string,
    amount: number,
    betId: string
  ): Promise<UserPoints> {
    const pointBalance = await this.getUserPointBalance(userId);

    // 베팅 중인 포인트 잠금 해제
    pointBalance.lockedPoints = Math.max(0, pointBalance.lockedPoints - amount);
    pointBalance.availablePoints =
      pointBalance.currentPoints - pointBalance.lockedPoints;

    await this.pointBalanceRepository.save(pointBalance);

    // 포인트 거래 기록
    return this.createPointTransaction({
      userId,
      transactionType: PointTransactionType.BET_PLACED,
      amount: amount,
      description: `베팅 취소 환불: ${amount} 포인트`,
      details: `베팅 ID: ${betId}`,
      metadata: { betId },
    });
  }

  /**
   * 포인트 지급 (베팅 당첨 시)
   */
  async awardPoints(
    userId: string,
    amount: number,
    betId: string
  ): Promise<UserPoints> {
    const pointBalance = await this.getUserPointBalance(userId);

    // 베팅 중인 포인트 잠금 해제
    pointBalance.lockedPoints = Math.max(0, pointBalance.lockedPoints - amount);
    pointBalance.availablePoints =
      pointBalance.currentPoints - pointBalance.lockedPoints;

    await this.pointBalanceRepository.save(pointBalance);

    // 포인트 거래 기록
    return this.createPointTransaction({
      userId,
      transactionType: PointTransactionType.BET_WON,
      amount: amount,
      description: `베팅 당첨: ${amount} 포인트`,
      details: `베팅 ID: ${betId}`,
      metadata: { betId },
    });
  }

  /**
   * 사용자 포인트 거래 내역 조회
   */
  async getUserPointTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
    transactionType?: PointTransactionType
  ): Promise<{
    transactions: UserPoints[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.pointTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId });

    if (transactionType) {
      queryBuilder.andWhere('transaction.transactionType = :transactionType', {
        transactionType,
      });
    }

    queryBuilder.orderBy('transaction.transactionTime', 'DESC');

    const total = await queryBuilder.getCount();
    const transactions = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 포인트 통계 조회
   */
  async getPointStatistics(userId: string): Promise<{
    currentPoints: number;
    totalEarned: number;
    totalSpent: number;
    bonusPoints: number;
    regularPoints: number;
    totalTransactions: number;
    averageTransactionAmount: number;
    monthlyEarnings: number;
    monthlySpending: number;
  }> {
    const pointBalance = await this.getUserPointBalance(userId);
    const transactions = await this.pointTransactionRepository.find({
      where: { userId },
      order: { transactionTime: 'DESC' },
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    const averageTransactionAmount =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // 이번 달 통계
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactions = transactions.filter(
      t => t.transactionTime >= startOfMonth
    );

    const monthlyEarnings = monthlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySpending = monthlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      currentPoints: pointBalance.currentPoints,
      totalEarned: pointBalance.totalPointsEarned,
      totalSpent: pointBalance.totalPointsSpent,
      bonusPoints: pointBalance.bonusPoints,
      regularPoints: pointBalance.regularPoints,
      totalTransactions: pointBalance.totalTransactions,
      averageTransactionAmount,
      monthlyEarnings,
      monthlySpending,
    };
  }

  /**
   * 포인트 만료 처리
   */
  async processExpiringPoints(): Promise<void> {
    const now = new Date();

    // 만료 예정인 포인트 조회
    const expiringTransactions = await this.pointTransactionRepository.find({
      where: {
        isExpirable: true,
        expiryDate: now,
        status: PointStatus.ACTIVE,
      },
    });

    for (const transaction of expiringTransactions) {
      try {
        // 포인트 만료 처리
        await this.createPointTransaction({
          userId: transaction.userId,
          transactionType: PointTransactionType.EXPIRY,
          amount: -transaction.amount,
          description: `포인트 만료: ${transaction.amount} 포인트`,
          details: `만료된 거래 ID: ${transaction.id}`,
          metadata: { expiredTransactionId: transaction.id },
        });

        // 원래 거래 상태 변경
        transaction.status = PointStatus.EXPIRED;
        await this.pointTransactionRepository.save(transaction);

        this.logger.log(`포인트 만료 처리 완료: ${transaction.id}`);
      } catch (error) {
        this.logger.error(`포인트 만료 처리 실패: ${transaction.id}`, error);
      }
    }
  }

  /**
   * 신규 사용자 포인트 초기화
   */
  async initializeUserPoints(userId: string): Promise<UserPointBalance> {
    // 가입 보너스 지급
    await this.createPointTransaction({
      userId,
      transactionType: PointTransactionType.SIGNUP_BONUS,
      amount: 10000, // 10,000 포인트 가입 보너스
      description: '가입 보너스',
      details: '신규 가입 축하 포인트',
      isExpirable: false,
    });

    return this.getUserPointBalance(userId);
  }
}
