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
exports.ResultsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const points_service_1 = require("../points/points.service");
const constants_1 = require("../kra/constants");
const kra_serializer_1 = require("../common/serializers/kra.serializer");
let ResultsService = class ResultsService {
    constructor(prisma, pointsService) {
        this.prisma = prisma;
        this.pointsService = pointsService;
    }
    async findAll(filters) {
        const { page = 1, limit = 20, date, meet } = filters;
        const where = {};
        if (date || meet) {
            where.race = {
                ...(date && { rcDate: date }),
                ...(meet && { meet: (0, constants_1.toKraMeetName)(meet) }),
            };
        }
        const [results, total] = await Promise.all([
            this.prisma.raceResult.findMany({
                where,
                select: {
                    id: true,
                    raceId: true,
                    ord: true,
                    chulNo: true,
                    hrNo: true,
                    hrName: true,
                    jkName: true,
                    race: {
                        select: { meet: true, meetName: true, rcNo: true, rcDate: true },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.raceResult.count({ where }),
        ]);
        return {
            results: (0, kra_serializer_1.serializeRaceResults)(results),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const result = await this.prisma.raceResult.findUnique({
            where: { id },
            include: { race: true },
        });
        if (!result)
            throw new common_1.NotFoundException('결과를 찾을 수 없습니다');
        return (0, kra_serializer_1.serializeRaceResults)([result])[0] ?? result;
    }
    async create(dto) {
        return this.prisma.raceResult.create({
            data: dto,
            include: { race: true },
        });
    }
    async update(id, dto) {
        return this.prisma.raceResult.update({
            where: { id },
            data: dto,
            include: { race: true },
        });
    }
    async remove(id) {
        await this.prisma.raceResult.delete({ where: { id } });
        return { message: '결과가 삭제되었습니다' };
    }
    async bulkCreate(dto) {
        const created = await this.prisma.raceResult.createMany({
            data: dto.results,
        });
        const raceId = dto.results[0]?.raceId;
        if (raceId) {
            await this.prisma.race.update({
                where: { id: raceId },
                data: { status: 'COMPLETED' },
            });
            await this.pointsService.awardPickPointsForRace(raceId);
            await this.updatePredictionAccuracy(raceId);
        }
        return { count: created.count };
    }
    async updatePredictionAccuracy(raceId) {
        const prediction = await this.prisma.prediction.findFirst({
            where: { raceId, status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
        });
        if (!prediction?.scores)
            return;
        const scores = prediction.scores;
        const horseScores = scores.horseScores;
        if (!horseScores?.length)
            return;
        const results = await this.prisma.raceResult.findMany({
            where: { raceId },
            orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }],
        });
        if (!results.length)
            return;
        const predictedOrder = horseScores
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .map((h) => String(h.hrNo ?? h.hrName ?? '').trim());
        const actualTop = results
            .slice(0, 3)
            .map((r) => String(r.hrNo ?? r.hrName ?? '').trim());
        const topN = Math.min(3, predictedOrder.length, actualTop.length);
        let matchCount = 0;
        for (let i = 0; i < topN; i++) {
            if (actualTop.includes(predictedOrder[i]))
                matchCount++;
        }
        const accuracy = topN > 0 ? (matchCount / topN) * 100 : 0;
        await this.prisma.prediction.update({
            where: { id: prediction.id },
            data: { accuracy },
        });
    }
    async getByRace(raceId) {
        return this.prisma.raceResult.findMany({
            where: { raceId },
            orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }],
        });
    }
    async getStatistics(filters) {
        const where = {};
        if (filters.dateFrom && filters.dateTo) {
            where.race = {
                rcDate: { gte: filters.dateFrom, lte: filters.dateTo },
            };
        }
        if (filters.meet) {
            where.race = {
                ...where.race,
                meet: (0, constants_1.toKraMeetName)(filters.meet),
            };
        }
        const totalResults = await this.prisma.raceResult.count({ where });
        return { totalResults, filters };
    }
    async exportResults(format, _filters) {
        const results = await this.prisma.raceResult.findMany({
            include: { race: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return { format, count: results.length, data: results };
    }
};
exports.ResultsService = ResultsService;
exports.ResultsService = ResultsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        points_service_1.PointsService])
], ResultsService);
//# sourceMappingURL=results.service.js.map