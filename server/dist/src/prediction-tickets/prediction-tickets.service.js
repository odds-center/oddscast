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
exports.PredictionTicketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const predictions_service_1 = require("../predictions/predictions.service");
let PredictionTicketsService = class PredictionTicketsService {
    constructor(prisma, predictionsService) {
        this.prisma = prisma;
        this.predictionsService = predictionsService;
    }
    async useTicket(userId, dto) {
        const raceId = Number(dto.raceId);
        const lastUsed = await this.prisma.predictionTicket.findFirst({
            where: { userId, raceId, status: 'USED', usedAt: { not: null } },
            orderBy: { usedAt: 'desc' },
            select: { usedAt: true },
        });
        if (lastUsed?.usedAt) {
            const elapsed = Date.now() - new Date(lastUsed.usedAt).getTime();
            const COOLDOWN_MS = 60_000;
            if (elapsed < COOLDOWN_MS) {
                const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
                throw new common_1.BadRequestException(`${remaining}초 후 다시 예측할 수 있습니다`);
            }
        }
        const ticket = await this.prisma.predictionTicket.findFirst({
            where: { userId, status: 'AVAILABLE', expiresAt: { gte: new Date() } },
            orderBy: { expiresAt: 'asc' },
        });
        if (!ticket)
            throw new common_1.BadRequestException('사용 가능한 예측권이 없습니다');
        let prediction = await this.prisma.prediction.findFirst({
            where: { raceId: Number(dto.raceId), status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
        });
        if (!prediction || dto.regenerate) {
            prediction = await this.predictionsService.generatePrediction(Number(dto.raceId));
        }
        const updated = await this.prisma.predictionTicket.update({
            where: { id: ticket.id },
            data: {
                status: 'USED',
                usedAt: new Date(),
                predictionId: prediction.id,
                raceId: Number(dto.raceId),
            },
        });
        return { ticket: updated, prediction };
    }
    async getBalance(userId) {
        const [available, used, expired] = await Promise.all([
            this.prisma.predictionTicket.count({
                where: { userId, status: 'AVAILABLE', expiresAt: { gte: new Date() } },
            }),
            this.prisma.predictionTicket.count({ where: { userId, status: 'USED' } }),
            this.prisma.predictionTicket.count({
                where: {
                    userId,
                    OR: [
                        { status: 'EXPIRED' },
                        { status: 'AVAILABLE', expiresAt: { lt: new Date() } },
                    ],
                },
            }),
        ]);
        return { available, used, expired, total: available + used + expired };
    }
    async getHistory(userId, page = 1, limit = 20) {
        const [tickets, total] = await Promise.all([
            this.prisma.predictionTicket.findMany({
                where: { userId },
                include: { prediction: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { issuedAt: 'desc' },
            }),
            this.prisma.predictionTicket.count({ where: { userId } }),
        ]);
        return { tickets, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const ticket = await this.prisma.predictionTicket.findUnique({
            where: { id },
            include: { prediction: true, subscription: true },
        });
        if (!ticket)
            throw new common_1.NotFoundException('예측권을 찾을 수 없습니다');
        return ticket;
    }
    async checkMatrixAccess(userId, date) {
        const normalized = date.replace(/-/g, '').slice(0, 8);
        const ticket = await this.prisma.predictionTicket.findFirst({
            where: {
                userId,
                type: 'MATRIX',
                status: 'USED',
                matrixDate: normalized,
                expiresAt: { gte: new Date() },
            },
        });
        return { hasAccess: !!ticket, expiresAt: ticket?.expiresAt };
    }
    async useMatrixTicket(userId, date) {
        const normalized = date.replace(/-/g, '').slice(0, 8);
        const existing = await this.prisma.predictionTicket.findFirst({
            where: {
                userId,
                type: 'MATRIX',
                status: 'USED',
                matrixDate: normalized,
                expiresAt: { gte: new Date() },
            },
        });
        if (existing) {
            return { ticket: existing, alreadyUsed: true };
        }
        const ticket = await this.prisma.predictionTicket.findFirst({
            where: {
                userId,
                type: 'MATRIX',
                status: 'AVAILABLE',
                expiresAt: { gte: new Date() },
            },
            orderBy: { expiresAt: 'asc' },
        });
        if (!ticket) {
            throw new common_1.BadRequestException('사용 가능한 종합 예측권이 없습니다');
        }
        const updated = await this.prisma.predictionTicket.update({
            where: { id: ticket.id },
            data: { status: 'USED', usedAt: new Date(), matrixDate: normalized },
        });
        return { ticket: updated, alreadyUsed: false };
    }
    async getMatrixBalance(userId) {
        const available = await this.prisma.predictionTicket.count({
            where: {
                userId,
                type: 'MATRIX',
                status: 'AVAILABLE',
                expiresAt: { gte: new Date() },
            },
        });
        const used = await this.prisma.predictionTicket.count({
            where: { userId, type: 'MATRIX', status: 'USED' },
        });
        return { available, used, total: available + used };
    }
    async purchaseMatrixTickets(userId, count) {
        if (count < 1 || count > 10) {
            throw new common_1.BadRequestException('구매 수량은 1~10장 사이여야 합니다');
        }
        const PRICE_PER_TICKET = 1000;
        const totalPrice = PRICE_PER_TICKET * count;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const tickets = await this.prisma.$transaction(Array.from({ length: count }, () => this.prisma.predictionTicket.create({
            data: {
                userId,
                type: 'MATRIX',
                status: 'AVAILABLE',
                expiresAt,
            },
        })));
        return {
            purchased: tickets.length,
            totalPrice,
            pricePerTicket: PRICE_PER_TICKET,
            expiresAt,
            tickets,
        };
    }
    async grantTickets(userId, count, expiresInDays = 30, type = 'RACE') {
        if (count < 1 || count > 100) {
            throw new common_1.BadRequestException('지급 수량은 1~100장 사이여야 합니다');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Math.min(365, Math.max(1, expiresInDays)));
        const tickets = await this.prisma.$transaction(Array.from({ length: count }, () => this.prisma.predictionTicket.create({
            data: {
                userId,
                subscriptionId: null,
                predictionId: null,
                raceId: null,
                type,
                status: 'AVAILABLE',
                expiresAt,
            },
        })));
        return { granted: tickets.length, type, tickets };
    }
};
exports.PredictionTicketsService = PredictionTicketsService;
exports.PredictionTicketsService = PredictionTicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        predictions_service_1.PredictionsService])
], PredictionTicketsService);
//# sourceMappingURL=prediction-tickets.service.js.map