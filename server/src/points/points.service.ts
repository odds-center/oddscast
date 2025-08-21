import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserPointBalance,
  UserPoints,
  TransactionType,
  TransactionStatus,
} from './entities';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    @InjectRepository(UserPointBalance)
    private readonly pointBalanceRepository: Repository<UserPointBalance>,
    @InjectRepository(UserPoints)
    private readonly pointsRepository: Repository<UserPoints>
  ) {}

  /**
   * 사용자의 포인트 잔액을 조회합니다.
   */
  async getUserPointBalance(userId: string): Promise<UserPointBalance> {
    const balance = await this.pointBalanceRepository.findOne({
      where: { userId },
    });

    if (!balance) {
      throw new NotFoundException(
        `사용자 포인트 잔액을 찾을 수 없습니다: ${userId}`
      );
    }

    return balance;
  }

  /**
   * 사용자의 포인트 거래 내역을 조회합니다.
   */
  async getUserPointHistory(userId: string): Promise<UserPoints[]> {
    return await this.pointsRepository.find({
      where: { userId },
      order: { transactionTime: 'DESC' },
    });
  }

  /**
   * 포인트를 적립합니다.
   */
  async addPoints(
    userId: string,
    transactionData: {
      amount: number;
      type: string;
      description: string;
      referenceId?: string;
      referenceType?: string;
    }
  ): Promise<UserPoints> {
    const { amount, type, description, referenceId, referenceType } =
      transactionData;

    // 포인트 거래 내역 생성
    const pointTransaction = this.pointsRepository.create({
      userId,
      amount,
      transactionType: this.mapTransactionType(type),
      description,
      balanceAfter: amount,
      transactionTime: new Date(),
      status: TransactionStatus.ACTIVE,
      metadata: {
        betId: referenceType === 'BET' ? referenceId : undefined,
        raceId: referenceType === 'RACE' ? referenceId : undefined,
        adminNote: referenceType === 'ADMIN' ? referenceId : undefined,
      },
    });

    const savedTransaction = await this.pointsRepository.save(pointTransaction);

    // 포인트 잔액 업데이트
    await this.updatePointBalance(userId, amount);

    this.logger.log(
      `포인트 적립: 사용자 ${userId}, 금액 ${amount}, 사유 ${description}`
    );
    return savedTransaction;
  }

  /**
   * 포인트를 사용합니다.
   */
  async usePoints(
    userId: string,
    amount: number,
    reason: string
  ): Promise<UserPoints> {
    const balance = await this.getUserPointBalance(userId);

    if (balance.currentPoints < amount) {
      throw new Error('포인트가 부족합니다.');
    }

    // 포인트 거래 내역 생성
    const pointTransaction = this.pointsRepository.create({
      userId,
      amount: -amount,
      transactionType: TransactionType.BET_PLACED,
      description: reason,
      balanceAfter: balance.currentPoints - amount,
    });

    const savedTransaction = await this.pointsRepository.save(pointTransaction);

    // 포인트 잔액 업데이트
    await this.updatePointBalance(userId, -amount);

    this.logger.log(
      `포인트 사용: 사용자 ${userId}, 금액 ${amount}, 사유 ${reason}`
    );
    return savedTransaction;
  }

  /**
   * 사용자 포인트 거래 내역을 조회합니다.
   */
  async getUserPointTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: string
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.pointsRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.transactionTime', 'DESC')
      .skip(skip)
      .take(limit);

    if (type) {
      queryBuilder.andWhere('transaction.transactionType = :type', { type });
    }

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 사용자 포인트 통계를 조회합니다.
   */
  async getUserPointStatistics(userId: string) {
    const balance = await this.getUserPointBalance(userId);
    const transactions = await this.pointsRepository.find({
      where: { userId },
    });

    const totalTransactions = transactions.length;
    const totalEarned = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );
    const averageTransaction =
      totalTransactions > 0
        ? (totalEarned + totalSpent) / totalTransactions
        : 0;
    const lastTransaction = transactions[0]; // 이미 DESC로 정렬되어 있음

    return {
      totalTransactions,
      totalEarned,
      totalSpent,
      currentBalance: balance.currentPoints,
      averageTransaction,
      lastTransactionDate: lastTransaction?.transactionTime || null,
    };
  }

  /**
   * 거래 타입을 매핑합니다.
   */
  private mapTransactionType(type: string): TransactionType {
    switch (type.toUpperCase()) {
      case 'EARNED':
        return TransactionType.ADMIN_ADJUSTMENT;
      case 'SPENT':
        return TransactionType.BET_PLACED;
      case 'REFUNDED':
        return TransactionType.BET_WON; // 환불은 당첨으로 처리
      case 'BONUS':
        return TransactionType.EVENT_BONUS; // 보너스는 이벤트 보너스로 처리
      case 'EXPIRED':
        return TransactionType.EXPIRY; // 만료는 EXPIRY로 처리
      default:
        return TransactionType.ADMIN_ADJUSTMENT;
    }
  }

  /**
   * 포인트 잔액을 업데이트합니다.
   */
  private async updatePointBalance(
    userId: string,
    amount: number
  ): Promise<void> {
    let balance = await this.pointBalanceRepository.findOne({
      where: { userId },
    });

    if (!balance) {
      // 새 포인트 잔액 생성
      balance = this.pointBalanceRepository.create({
        userId,
        currentPoints: amount,
        totalPointsEarned: amount > 0 ? amount : 0,
        totalPointsSpent: amount < 0 ? Math.abs(amount) : 0,
      });
    } else {
      // 기존 잔액 업데이트
      balance.currentPoints += amount;
      if (amount > 0) {
        balance.totalPointsEarned += amount;
      } else {
        balance.totalPointsSpent += Math.abs(amount);
      }
    }

    await this.pointBalanceRepository.save(balance);
  }
}
