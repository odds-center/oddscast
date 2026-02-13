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
exports.BetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let BetsService = class BetsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        return this.prisma.bet.create({
            data: {
                userId,
                raceId: dto.raceId,
                betType: dto.betType,
                betName: dto.betName,
                betDescription: dto.betDescription,
                betAmount: dto.betAmount,
                selections: dto.selections,
                betReason: dto.betReason,
                confidenceLevel: dto.confidenceLevel,
                analysisData: dto.analysisData,
                betStatus: client_1.BetStatus.PENDING,
            },
        });
    }
    async findAll(userId, filters) {
        const where = { userId };
        if (filters.raceId)
            where.raceId = filters.raceId;
        if (filters.betType)
            where.betType = filters.betType;
        if (filters.betStatus)
            where.betStatus = filters.betStatus;
        if (filters.betResult)
            where.betResult = filters.betResult;
        if (filters.dateFrom)
            where.betTime = { ...where.betTime, gte: new Date(filters.dateFrom) };
        if (filters.dateTo)
            where.betTime = { ...where.betTime, lte: new Date(filters.dateTo) };
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 20;
        const [bets, total] = await Promise.all([
            this.prisma.bet.findMany({
                where,
                orderBy: { betTime: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { race: true },
            }),
            this.prisma.bet.count({ where }),
        ]);
        return { bets, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const bet = await this.prisma.bet.findUnique({
            where: { id },
            include: { race: true },
        });
        if (!bet)
            throw new common_1.NotFoundException('Bet not found');
        return bet;
    }
    async update(id, dto) {
        return this.prisma.bet.update({
            where: { id },
            data: dto,
        });
    }
    async cancel(id) {
        return this.prisma.bet.update({
            where: { id },
            data: { betStatus: client_1.BetStatus.CANCELLED },
        });
    }
    async processResult(id, result, actualWin) {
        let status = client_1.BetStatus.COMPLETED;
        if (result === client_1.BetResult.WIN || result === client_1.BetResult.PARTIAL_WIN)
            status = client_1.BetStatus.WON;
        if (result === client_1.BetResult.LOSE)
            status = client_1.BetStatus.LOST;
        return this.prisma.bet.update({
            where: { id },
            data: {
                betResult: result,
                betStatus: status,
                actualWin,
                resultTime: new Date(),
            },
        });
    }
    async createSlip(userId, dto) {
        const totalAmount = dto.bets.reduce((sum, b) => sum + (b.amount || 0), 0);
        return this.prisma.betSlip.create({
            data: {
                userId,
                raceId: dto.raceId,
                bets: dto.bets,
                totalAmount,
            },
        });
    }
    async getStatistics(userId) {
        const bets = await this.prisma.bet.findMany({
            where: {
                userId,
                betStatus: { in: [client_1.BetStatus.WON, client_1.BetStatus.LOST, client_1.BetStatus.COMPLETED] },
            },
        });
        const totalBets = bets.length;
        const wonBets = bets.filter((b) => b.betStatus === client_1.BetStatus.WON).length;
        const lostBets = bets.filter((b) => b.betStatus === client_1.BetStatus.LOST).length;
        const totalWinnings = bets.reduce((sum, b) => sum + (b.actualWin || 0), 0);
        const totalAmount = bets.reduce((sum, b) => sum + b.betAmount, 0);
        return {
            totalBets,
            wonBets,
            lostBets,
            winRate: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
            totalWinnings,
            totalLosses: totalAmount - totalWinnings,
            roi: totalAmount > 0
                ? ((totalWinnings - totalAmount) / totalAmount) * 100
                : 0,
            averageBetAmount: totalBets > 0 ? totalAmount / totalBets : 0,
        };
    }
};
exports.BetsService = BetsService;
exports.BetsService = BetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BetsService);
//# sourceMappingURL=bets.service.js.map