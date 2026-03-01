import { Injectable } from '@nestjs/common';
import { PgService } from '../database/pg.service';
import { GlobalConfigService } from '../config/config.service';
import { TicketStatus } from '../database/db-enums';
import { PurchaseDto } from '../common/dto/payment.dto';

@Injectable()
export class SinglePurchasesService {
  constructor(
    private readonly db: PgService,
    private readonly configService: GlobalConfigService,
  ) {}

  private readonly DEFAULT_PRICE_PER_TICKET = 550;

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

    const { rows } = await this.db.query<{ id: number }>(
      `INSERT INTO single_purchases ("userId", quantity, "totalAmount", "paymentMethod", "pgTransactionId") VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, quantity, totalAmount, dto.paymentMethod ?? null, dto.pgTransactionId ?? null],
    );
    const purchaseId = rows[0]?.id;
    if (purchaseId == null) throw new Error('Single purchase insert failed');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    for (let i = 0; i < quantity; i++) {
      await this.db.query(
        `INSERT INTO prediction_tickets ("userId", type, status, "expiresAt") VALUES ($1, 'RACE', $2, $3)`,
        [userId, TicketStatus.AVAILABLE, expiresAt],
      );
    }

    const purchase = await this.db.query('SELECT * FROM single_purchases WHERE id = $1', [
      purchaseId,
    ]);
    return { purchase: purchase.rows[0], ticketsIssued: quantity };
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
    const offset = (page - 1) * limit;
    const [countRes, rowsRes] = await Promise.all([
      this.db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM single_purchases WHERE "userId" = $1',
        [userId],
      ),
      this.db.query(
        'SELECT * FROM single_purchases WHERE "userId" = $1 ORDER BY "purchasedAt" DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset],
      ),
    ]);
    const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
    return { purchases: rowsRes.rows, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getTotalSpent(userId: number) {
    const { rows } = await this.db.query<{ sum: string; count: string }>(
      'SELECT COALESCE(SUM("totalAmount"), 0)::text AS sum, COUNT(*)::text AS count FROM single_purchases WHERE "userId" = $1',
      [userId],
    );
    const r = rows[0];
    return {
      totalSpent: parseInt(r?.sum ?? '0', 10),
      totalPurchases: parseInt(r?.count ?? '0', 10),
    };
  }
}
