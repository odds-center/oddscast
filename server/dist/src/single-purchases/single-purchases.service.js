"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SinglePurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_service_1 = require("../config/config.service");
let SinglePurchasesService = class SinglePurchasesService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.DEFAULT_PRICE_PER_TICKET = 1000;
    }
    async getPricePerTicket() {
        const raw = await this.configService.get('single_purchase_config');
        if (raw) {
            try {
                const cfg = JSON.parse(raw);
                if (typeof cfg.originalPrice === 'number') {
                    return Math.round(cfg.originalPrice * 1.1);
                }
                if (typeof cfg.totalPrice === 'number')
                    return cfg.totalPrice;
            }
            catch {
            }
        }
        return this.DEFAULT_PRICE_PER_TICKET;
    }
    async purchase(userId, dto) {
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
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const ticketData = Array.from({ length: quantity }, () => ({
            userId,
            status: 'AVAILABLE',
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
            }
            catch {
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
    async updateConfig(data) {
        const current = await this.getConfig();
        const merged = {
            ...current,
            ...data,
            vat: data.originalPrice != null ? Math.round(data.originalPrice * 0.1) : current.vat,
            totalPrice: data.originalPrice != null
                ? data.originalPrice + Math.round(data.originalPrice * 0.1)
                : current.totalPrice,
        };
        await this.configService.set('single_purchase_config', JSON.stringify(merged));
        return this.getConfig();
    }
    async calculatePrice(quantity) {
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
    async getHistory(userId, page = 1, limit = 20) {
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
    async getTotalSpent(userId) {
        const result = await this.prisma.singlePurchase.aggregate({
            where: { userId },
            _sum: { totalAmount: true },
            _count: true,
        });
        return {
            totalSpent: result._sum.totalAmount || 0,
            totalPurchases: result._count,
        };
    }
};
exports.SinglePurchasesService = SinglePurchasesService;
exports.SinglePurchasesService = SinglePurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_service_1.GlobalConfigService])
], SinglePurchasesService);
//# sourceMappingURL=single-purchases.service.js.map