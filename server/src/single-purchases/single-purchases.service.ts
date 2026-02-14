import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalConfigService } from '../config/config.service';
import { TicketStatus } from '@prisma/client';
import { PurchaseDto } from '../common/dto/payment.dto';

@Injectable()
export class SinglePurchasesService {
  constructor(
    private prisma: PrismaService,
    private configService: GlobalConfigService,
  ) {}

  private readonly DEFAULT_PRICE_PER_TICKET = 1000;

  private async getPricePerTicket(): Promise<number> {
    const raw = await this.configService.get('single_purchase_config');
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
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

    const purchase = await this.prisma.singlePurchase.create({
      data: {
        userId,
        quantity,
        totalAmount,
        paymentMethod: dto.paymentMethod,
        pgTransactionId: dto.pgTransactionId,
      },
    });

    // 예측권 발급
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const ticketData = Array.from({ length: quantity }, () => ({
      userId,
      status: 'AVAILABLE' as TicketStatus,
      expiresAt,
    }));

    await this.prisma.predictionTicket.createMany({ data: ticketData });

    return { purchase, ticketsIssued: quantity };
  }

  async getConfig() {
    const raw = await this.configService.get('single_purchase_config');
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
        if (cfg.originalPrice != null) {
          const vat = cfg.vat ?? Math.round(cfg.originalPrice * 0.1);
          const total = cfg.totalPrice ?? cfg.originalPrice + vat;
          return {
            id: cfg.id ?? 'default',
            configName: cfg.configName ?? 'single_purchase',
            displayName: cfg.displayName ?? '예측권 개별 구매',
            description: cfg.description ?? '',
            originalPrice: cfg.originalPrice,
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

  async getHistory(userId: number, page: number = 1, limit: number = 20) {
    const [purchases, total] = await Promise.all([
      this.prisma.singlePurchase.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { purchasedAt: 'desc' },
      }),
      this.prisma.singlePurchase.count({ where: { userId } }),
    ]);

    return { purchases, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getTotalSpent(userId: number) {
    const result = await this.prisma.singlePurchase.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      totalSpent: result._sum?.totalAmount ?? 0,
      totalPurchases: result._count,
    };
  }
}
