import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SinglePurchase,
  PurchaseStatus,
} from './entities/single-purchase.entity';
import { SinglePurchaseConfig } from './entities/single-purchase-config.entity';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { PurchaseTicketDto, PurchaseResultDto } from './dto';
import * as _ from 'lodash';

/**
 * 개별 구매 서비스 (DB 가격 관리, 할인 없음)
 */
@Injectable()
export class SinglePurchasesService {
  private readonly logger = new Logger(SinglePurchasesService.name);

  constructor(
    @InjectRepository(SinglePurchase)
    private readonly purchaseRepo: Repository<SinglePurchase>,
    @InjectRepository(SinglePurchaseConfig)
    private readonly configRepo: Repository<SinglePurchaseConfig>,
    private readonly ticketsService: PredictionTicketsService
  ) {}

  /**
   * 개별 구매 설정 조회
   */
  async getConfig(): Promise<SinglePurchaseConfig> {
    const config = await this.configRepo.findOne({
      where: { configName: 'SINGLE_TICKET', isActive: true },
    });

    if (!config) {
      throw new NotFoundException('개별 구매 설정을 찾을 수 없습니다');
    }

    return config;
  }

  /**
   * 예측권 구매
   */
  async purchaseTickets(
    userId: string,
    dto: PurchaseTicketDto
  ): Promise<PurchaseResultDto> {
    const quantity = dto.quantity || 1;

    // DB에서 가격 설정 조회
    const config = await this.getConfig();
    const priceInfo = config.calculateTotalPrice(quantity);

    this.logger.log(
      `Purchasing ${quantity} tickets for user: ${userId}, total: ₩${priceInfo.totalPrice}`
    );

    // 1. 예측권 발급
    const tickets = await this.ticketsService.issueTickets({
      userId,
      quantity,
      validDays: 30,
    });

    // 2. 구매 내역 저장 (장당 가격으로 각각 저장)
    const purchases = await Promise.all(
      tickets.map(ticket =>
        this.purchaseRepo.save({
          userId,
          ticketId: ticket.id,
          originalPrice: config.originalPrice,
          vat: config.vat,
          totalPrice: config.totalPrice,
          pgTransactionId: dto.pgTransactionId || null,
          paymentMethod: dto.paymentMethod || 'CARD',
          status: PurchaseStatus.SUCCESS,
        })
      )
    );

    this.logger.log(
      `Purchase completed: ${purchases.length} tickets purchased`
    );

    return {
      purchaseId: purchases[0].id,
      tickets,
      totalAmount: priceInfo.totalPrice,
      paymentMethod: dto.paymentMethod || 'CARD',
      pgTransactionId: dto.pgTransactionId || '',
      purchasedAt: new Date(),
    };
  }

  /**
   * 총 가격 계산 (DB 설정 기반, 할인 없음)
   */
  async calculateTotalPrice(quantity: number): Promise<{
    quantity: number;
    originalPrice: number;
    vat: number;
    totalPrice: number;
    pricePerTicket: number;
  }> {
    const config = await this.getConfig();
    const priceInfo = config.calculateTotalPrice(quantity);

    return {
      quantity,
      ...priceInfo,
    };
  }

  /**
   * 구매 내역 조회
   */
  async getHistory(userId: string, limit = 50, offset = 0) {
    const purchases = await this.purchaseRepo.find({
      where: { userId },
      order: { purchasedAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['ticket'],
    });

    return purchases;
  }

  /**
   * 구매 내역 조회
   */
  async getPurchaseHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<SinglePurchase[]> {
    return this.purchaseRepo.find({
      where: { userId },
      order: { purchasedAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['ticket'],
    });
  }

  /**
   * 총 구매액 조회
   */
  async getTotalSpent(userId: string): Promise<number> {
    const result = await this.purchaseRepo
      .createQueryBuilder('purchase')
      .select('SUM(purchase.total_price)', 'total')
      .where('purchase.user_id = :userId', { userId })
      .andWhere('purchase.status = :status', { status: PurchaseStatus.SUCCESS })
      .getRawOne();

    return _.toNumber(result?.total) || 0;
  }

  /**
   * 환불 처리
   */
  async refundPurchase(purchaseId: string): Promise<SinglePurchase> {
    const purchase = await this.purchaseRepo.findOne({
      where: { id: purchaseId },
      relations: ['ticket'],
    });

    if (!purchase) {
      throw new BadRequestException('Purchase not found');
    }

    purchase.refund();
    const refunded = await this.purchaseRepo.save(purchase);

    this.logger.log(`Purchase refunded: ${purchaseId}`);

    return refunded;
  }
}
