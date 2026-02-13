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
let PredictionTicketsService = class PredictionTicketsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async useTicket(userId, dto) {
        const ticket = await this.prisma.predictionTicket.findFirst({
            where: { userId, status: 'AVAILABLE', expiresAt: { gte: new Date() } },
            orderBy: { expiresAt: 'asc' },
        });
        if (!ticket)
            throw new common_1.BadRequestException('사용 가능한 예측권이 없습니다');
        const prediction = await this.prisma.prediction.findFirst({
            where: { raceId: Number(dto.raceId), status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
        });
        if (!prediction)
            throw new common_1.NotFoundException('해당 경주의 예측이 없습니다');
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
};
exports.PredictionTicketsService = PredictionTicketsService;
exports.PredictionTicketsService = PredictionTicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PredictionTicketsService);
//# sourceMappingURL=prediction-tickets.service.js.map