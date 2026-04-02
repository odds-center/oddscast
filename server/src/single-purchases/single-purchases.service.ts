import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SinglePurchase } from '../database/entities/single-purchase.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { GlobalConfigService } from '../config/config.service';
import { TicketStatus, TicketType } from '../database/db-enums';
import { PurchaseDto } from '../common/dto/payment.dto';
import { DiscordService } from '../discord/discord.service';

@Injectable()
export class SinglePurchasesService {
  constructor(
    @InjectRepository(SinglePurchase)
    private readonly singlePurchaseRepo: Repository<SinglePurchase>,
    @InjectRepository(PredictionTicket)
    private readonly predictionTicketRepo: Repository<PredictionTicket>,
    private readonly configService: GlobalConfigService,
    private readonly discordService: DiscordService,
  ) {}

  private readonly DEFAULT_PRICE_PER_TICKET = 550;

  private async getPricePerTicket(): Promise<number> {
    const raw = await this.configService.get('single_purchase_config');
    if (raw) {
      try {
        const cfg = JSON.parse(raw) as Record<string, unknown>;
        if (typeof cfg.originalPrice === 'number') {
          return Math.round(cfg.originalPrice * 1.1);
        }
        if (typeof cfg.totalPrice === 'number') return cfg.totalPrice;
      } catch {
        /* ignore */
      }
    }
    return this.DEFAULT_PRICE_PER_TICKET;
  }

  async purchase(userId: number, dto: PurchaseDto) {
    const quantity = dto.quantity || 1;
    const unitPrice = await this.getPricePerTicket();
    const totalAmount = quantity * unitPrice;

    const purchase = await this.singlePurchaseRepo.save(
      this.singlePurchaseRepo.create({
        userId,
        quantity,
        totalAmount,
        paymentMethod: dto.paymentMethod ?? null,
        pgTransactionId: dto.pgTransactionId ?? null,
        purchasedAt: new Date(),
      }),
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const now = new Date();

    for (let i = 0; i < quantity; i++) {
      await this.predictionTicketRepo.save(
        this.predictionTicketRepo.create({
          userId,
          type: TicketType.RACE,
          status: TicketStatus.AVAILABLE,
          expiresAt,
          issuedAt: now,
        }),
      );
    }

    void this.discordService.notifyTicketPurchase({
      userId,
      quantity,
      totalAmount,
      pgTransactionId: dto.pgTransactionId ?? null,
    });

    return { purchase, ticketsIssued: quantity };
  }

  async getConfig() {
    const raw = await this.configService.get('single_purchase_config');
    if (raw) {
      try {
        const cfg = JSON.parse(raw) as Record<string, unknown>;
        if (cfg.originalPrice != null) {
          const originalPrice = Number(cfg.originalPrice);
          const vat = (cfg.vat as number) ?? Math.round(originalPrice * 0.1);
          const total = (cfg.totalPrice as number) ?? originalPrice + vat;
          return {
            id: (cfg.id as string) ?? 'default',
            configName: (cfg.configName as string) ?? 'single_purchase',
            displayName: (cfg.displayName as string) ?? '예측권 개별 구매',
            description: (cfg.description as string) ?? '',
            originalPrice,
            vat,
            totalPrice: total,
            isActive: cfg.isActive !== false,
          };
        }
      } catch {
        /* ignore */
      }
    }
    const price = this.DEFAULT_PRICE_PER_TICKET;
    const originalPrice = Math.round(price / 1.1);
    const vat = price - originalPrice;
    return {
      id: 'default',
      configName: 'single_purchase',
      displayName: '예측권 개별 구매',
      description: '1장 단위 예측권 구매',
      originalPrice,
      vat,
      totalPrice: price,
      isActive: true,
    };
  }

  async updateConfig(data: {
    id?: string;
    originalPrice?: number;
    vat?: number;
    totalPrice?: number;
    displayName?: string;
    description?: string;
    isActive?: boolean;
  }) {
    const current = await this.getConfig();
    const merged = {
      ...current,
      ...data,
      vat:
        data.originalPrice != null
          ? Math.round(data.originalPrice * 0.1)
          : current.vat,
      totalPrice:
        data.originalPrice != null
          ? data.originalPrice + Math.round(data.originalPrice * 0.1)
          : current.totalPrice,
    };
    await this.configService.set(
      'single_purchase_config',
      JSON.stringify(merged),
    );
    return this.getConfig();
  }

  async calculatePrice(quantity: number) {
    const unitPrice = await this.getPricePerTicket();
    const discount = 0;
    const subtotal = quantity * unitPrice;
    const discountAmount = Math.floor(subtotal * discount);
    return {
      unitPrice,
      quantity,
      subtotal,
      discount: discount * 100,
      discountAmount,
      total: subtotal - discountAmount,
    };
  }

  async getHistory(userId: number, page = 1, limit = 20) {
    const [purchases, total] = await this.singlePurchaseRepo.findAndCount({
      where: { userId },
      order: { purchasedAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return {
      purchases,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTotalSpent(userId: number) {
    const result = await this.singlePurchaseRepo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.totalAmount), 0)', 'sum')
      .addSelect('COUNT(*)', 'count')
      .where('s.userId = :userId', { userId })
      .getRawOne<{ sum: string; count: string }>();

    const sum = result?.sum ?? '0';
    const count = result?.count ?? '0';
    return {
      totalSpent: parseInt(String(sum), 10),
      totalPurchases: parseInt(String(count), 10),
    };
  }
}
