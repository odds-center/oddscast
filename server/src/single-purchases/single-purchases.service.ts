import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SinglePurchase,
  PurchaseStatus,
} from './entities/single-purchase.entity';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { PurchaseTicketDto, PurchaseResultDto } from './dto';

/**
 * 개별 구매 서비스 (1,000원/장)
 */
@Injectable()
export class SinglePurchasesService {
  private readonly logger = new Logger(SinglePurchasesService.name);
  private readonly PRICE_PER_TICKET = 1000; // 1,000원/장

  constructor(
    @InjectRepository(SinglePurchase)
    private readonly purchaseRepo: Repository<SinglePurchase>,
    private readonly ticketsService: PredictionTicketsService
  ) {}

  /**
   * 예측권 구매
   */
  async purchaseTickets(
    userId: string,
    dto: PurchaseTicketDto
  ): Promise<PurchaseResultDto> {
    const quantity = dto.quantity || 1;
    const totalAmount = this.calculateTotalPrice(quantity);

    this.logger.log(
      `Purchasing ${quantity} tickets for user: ${userId}, total: ₩${totalAmount}`
    );

    // 1. 예측권 발급
    const tickets = await this.ticketsService.issueTickets({
      userId,
      quantity,
      validDays: 30,
    });

    // 2. 구매 내역 저장
    const purchases = await Promise.all(
      tickets.map(ticket =>
        this.purchaseRepo.save({
          userId,
          ticketId: ticket.id,
          amount: this.PRICE_PER_TICKET,
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
      totalAmount,
      paymentMethod: dto.paymentMethod || 'CARD',
      pgTransactionId: dto.pgTransactionId || '',
      purchasedAt: new Date(),
    };
  }

  /**
   * 총 가격 계산 (할인 적용)
   */
  calculateTotalPrice(quantity: number): number {
    let totalPrice = quantity * this.PRICE_PER_TICKET;

    // 5장 이상 구매 시 5% 할인
    if (quantity >= 5) {
      totalPrice = Math.round(totalPrice * 0.95);
    }

    // 10장 이상 구매 시 10% 할인
    if (quantity >= 10) {
      totalPrice = Math.round(totalPrice * 0.9);
    }

    return totalPrice;
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
      .select('SUM(purchase.amount)', 'total')
      .where('purchase.userId = :userId', { userId })
      .andWhere('purchase.status = :status', { status: PurchaseStatus.SUCCESS })
      .getRawOne();

    return result?.total ? parseFloat(result.total) : 0;
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

    // TODO: 예측권도 함께 취소 처리 (미사용인 경우)

    this.logger.log(`Purchase refunded: ${purchaseId}`);

    return refunded;
  }
}
