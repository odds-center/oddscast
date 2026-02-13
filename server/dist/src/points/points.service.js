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
exports.PointsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const picks_service_1 = require("../picks/picks.service");
const client_1 = require("@prisma/client");
const PICK_TYPE_CONFIG_KEYS = {
    SINGLE: 'SINGLE_MULTIPLIER',
    PLACE: 'PLACE_MULTIPLIER',
    QUINELLA: 'QUINELLA_MULTIPLIER',
    EXACTA: 'EXACTA_MULTIPLIER',
    QUINELLA_PLACE: 'QUINELLA_PLACE_MULTIPLIER',
    TRIFECTA: 'TRIFECTA_MULTIPLIER',
    TRIPLE: 'TRIPLE_MULTIPLIER',
};
let PointsService = class PointsService {
    constructor(prisma, picksService) {
        this.prisma = prisma;
        this.picksService = picksService;
    }
    async getBalance(userId) {
        const transactions = await this.prisma.pointTransaction.findMany({
            where: { userId, status: 'ACTIVE' },
        });
        const totalEarned = transactions
            .filter((t) => [
            'EARNED',
            'BONUS',
            'PROMOTION',
            'TRANSFER_IN',
            'ADMIN_ADJUSTMENT',
        ].includes(t.transactionType))
            .reduce((sum, t) => sum + t.amount, 0);
        const totalSpent = transactions
            .filter((t) => ['SPENT', 'TRANSFER_OUT', 'EXPIRED'].includes(t.transactionType))
            .reduce((sum, t) => sum + t.amount, 0);
        return {
            userId,
            currentPoints: totalEarned - totalSpent,
            totalPointsEarned: totalEarned,
            totalPointsSpent: totalSpent,
            bonusPoints: 0,
            expiringPoints: 0,
            lastUpdated: new Date(),
        };
    }
    async getTransactions(userId, filters) {
        const where = { userId };
        if (filters.type)
            where.transactionType = filters.type;
        if (filters.status)
            where.status = filters.status;
        const [transactions, total] = await Promise.all([
            this.prisma.pointTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (filters.page - 1) * filters.limit || 0,
                take: filters.limit || 20,
            }),
            this.prisma.pointTransaction.count({ where }),
        ]);
        return {
            transactions,
            total,
            page: filters.page || 1,
            totalPages: Math.ceil(total / (filters.limit || 20)),
        };
    }
    async createTransaction(userId, dto) {
        const currentBalance = (await this.getBalance(userId)).currentPoints;
        let balanceAfter = currentBalance;
        if (['SPENT', 'TRANSFER_OUT'].includes(dto.type)) {
            balanceAfter -= dto.amount;
        }
        else {
            balanceAfter += dto.amount;
        }
        return this.prisma.pointTransaction.create({
            data: {
                userId,
                transactionType: dto.type,
                amount: dto.amount,
                balanceAfter,
                description: dto.description,
                metadata: dto.metadata,
                status: client_1.PointStatus.ACTIVE,
            },
        });
    }
    async transfer(fromUserId, dto) {
        const fromBalance = await this.getBalance(fromUserId);
        if (fromBalance.currentPoints < dto.amount) {
            throw new common_1.BadRequestException('잔액이 부족합니다.');
        }
        const toUserId = Number(dto.toUserId);
        return this.prisma.$transaction(async (prisma) => {
            await prisma.pointTransaction.create({
                data: {
                    userId: fromUserId,
                    transactionType: client_1.PointTransactionType.TRANSFER_OUT,
                    amount: dto.amount,
                    balanceAfter: fromBalance.currentPoints - dto.amount,
                    description: `Transfer to ${toUserId}: ${dto.description}`,
                    status: client_1.PointStatus.ACTIVE,
                },
            });
            const toBalance = await this.getBalance(toUserId);
            await prisma.pointTransaction.create({
                data: {
                    userId: toUserId,
                    transactionType: client_1.PointTransactionType.TRANSFER_IN,
                    amount: dto.amount,
                    balanceAfter: toBalance.currentPoints + dto.amount,
                    description: `Transfer from ${fromUserId}: ${dto.description}`,
                    status: client_1.PointStatus.ACTIVE,
                },
            });
            return { status: 'COMPLETED' };
        });
    }
    async getPromotions(_filters) {
        return this.prisma.pointPromotion.findMany({
            where: { isActive: true },
        });
    }
    async applyPromotion(userId, promotionId) {
        const promotion = await this.prisma.pointPromotion.findUnique({
            where: { id: promotionId },
        });
        if (!promotion || !promotion.isActive) {
            throw new common_1.NotFoundException('프로모션을 찾을 수 없거나 만료되었습니다.');
        }
        await this.createTransaction(userId, {
            type: client_1.PointTransactionType.PROMOTION,
            amount: promotion.points,
            description: `Promotion applied: ${promotion.name}`,
        });
        return {
            message: '프로모션이 적용되었습니다.',
            pointsEarned: promotion.points,
        };
    }
    async getExpirySettings() {
        return {
            defaultExpiryDays: 365,
            allowExtension: true,
            maxExtensionDays: 30,
        };
    }
    async getTicketPrice() {
        const price = await this.prisma.pointTicketPrice.findFirst({
            where: { isActive: true, effectiveTo: null },
            orderBy: { effectiveFrom: 'desc' },
        });
        return { pointsPerTicket: price?.pointsPerTicket ?? 1200 };
    }
    async purchaseTicket(userId, dto) {
        const { pointsPerTicket } = await this.getTicketPrice();
        const totalCost = pointsPerTicket * dto.quantity;
        const balance = await this.getBalance(userId);
        if (balance.currentPoints < totalCost) {
            throw new common_1.BadRequestException(`포인트가 부족합니다. 필요: ${totalCost}pt, 보유: ${balance.currentPoints}pt`);
        }
        const tickets = [];
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        return this.prisma.$transaction(async (tx) => {
            await tx.pointTransaction.create({
                data: {
                    userId,
                    transactionType: client_1.PointTransactionType.SPENT,
                    amount: totalCost,
                    balanceAfter: balance.currentPoints - totalCost,
                    description: `예측권 ${dto.quantity}장 구매 (포인트)`,
                    metadata: { quantity: dto.quantity },
                    status: client_1.PointStatus.ACTIVE,
                },
            });
            for (let i = 0; i < dto.quantity; i++) {
                const ticket = await tx.predictionTicket.create({
                    data: {
                        userId,
                        status: 'AVAILABLE',
                        expiresAt,
                    },
                });
                tickets.push(ticket);
            }
            const newBalance = await this.getBalance(userId);
            return {
                tickets,
                pointsSpent: totalCost,
                remainingPoints: newBalance.currentPoints,
            };
        });
    }
    async awardPickPointsForRace(raceId) {
        const picks = await this.prisma.userPick.findMany({
            where: { raceId },
            include: {
                race: { include: { results: { orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }] } } },
            },
        });
        const configMap = await this.getPointConfigMap();
        const basePoints = parseInt(configMap['BASE_POINTS'] ?? '100', 10);
        let awardedCount = 0;
        for (const pick of picks) {
            if (pick.pointsAwarded != null && pick.pointsAwarded > 0)
                continue;
            const results = pick.race?.results ?? [];
            if (results.length === 0)
                continue;
            const isHit = this.picksService.checkPickHit(pick.pickType, pick.hrNos, results.map((r) => ({ hrNo: r.hrNo, ord: r.ord })));
            if (!isHit)
                continue;
            const multKey = PICK_TYPE_CONFIG_KEYS[pick.pickType];
            const mult = parseFloat(configMap[multKey] ?? '1');
            const points = Math.round(basePoints * mult);
            const balance = await this.getBalance(pick.userId);
            await this.prisma.pointTransaction.create({
                data: {
                    userId: pick.userId,
                    transactionType: client_1.PointTransactionType.EARNED,
                    amount: points,
                    balanceAfter: balance.currentPoints + points,
                    description: `경주 적중 보상 (${pick.pickType})`,
                    metadata: { raceId, pickId: pick.id },
                    status: client_1.PointStatus.ACTIVE,
                },
            });
            await this.prisma.userPick.update({
                where: { id: pick.id },
                data: { pointsAwarded: points },
            });
            awardedCount++;
        }
        return { awarded: awardedCount };
    }
    async getPointConfigMap() {
        const configs = await this.prisma.pointConfig.findMany();
        return Object.fromEntries(configs.map((c) => [c.configKey, c.configValue]));
    }
};
exports.PointsService = PointsService;
exports.PointsService = PointsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        picks_service_1.PicksService])
], PointsService);
//# sourceMappingURL=points.service.js.map