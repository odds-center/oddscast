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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RacesService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_service_1 = require("../prisma/prisma.service");
let RacesService = class RacesService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async findAll(filters) {
        const { page = 1, limit = 20, date, meet, status } = filters;
        const where = {};
        if (date)
            where.rcDate = date;
        if (meet)
            where.meet = meet;
        if (status)
            where.status = status;
        const [races, total] = await Promise.all([
            this.prisma.race.findMany({
                where,
                include: { entries: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ rcDate: 'desc' }, { rcNo: 'asc' }],
            }),
            this.prisma.race.count({ where }),
        ]);
        return { races, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const cacheKey = `race:${id}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const race = await this._findOneRaw(id);
        if (!race)
            throw new common_1.NotFoundException('경주를 찾을 수 없습니다');
        await this.cache.set(cacheKey, race, 60 * 5 * 1000);
        return race;
    }
    async _findOneRaw(id) {
        return this.prisma.race.findUnique({
            where: { id },
            include: { entries: true, results: true, predictions: true },
        });
    }
    async create(dto) {
        return this.prisma.race.create({ data: dto, include: { entries: true } });
    }
    async update(id, dto) {
        const race = await this.prisma.race.update({
            where: { id },
            data: dto,
            include: { entries: true },
        });
        await this.cache.del(`race:${id}`);
        return race;
    }
    async remove(id) {
        await this.prisma.race.delete({ where: { id } });
        await this.cache.del(`race:${id}`);
        return { message: '경주가 삭제되었습니다' };
    }
    async getSchedule(filters) {
        const where = {};
        if (filters.dateFrom && filters.dateTo) {
            where.rcDate = { gte: filters.dateFrom, lte: filters.dateTo };
        }
        if (filters.meet)
            where.meet = filters.meet;
        return this.prisma.race.findMany({
            where,
            include: { entries: true },
            orderBy: [{ rcDate: 'asc' }, { rcNo: 'asc' }],
        });
    }
    async getTodayRaces() {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return this.getRacesByDate(today);
    }
    async getRacesByDate(date) {
        const rcDate = date.replace(/-/g, '').slice(0, 8);
        return this.prisma.race.findMany({
            where: { rcDate },
            include: { entries: { where: { isScratched: false } } },
            orderBy: [{ rcNo: 'asc' }],
        });
    }
    async getRaceResult(raceId) {
        const results = await this.prisma.raceResult.findMany({
            where: { raceId },
            orderBy: { rcRank: 'asc' },
        });
        if (!results.length)
            throw new common_1.NotFoundException('결과를 찾을 수 없습니다');
        return results;
    }
    async createEntry(raceId, dto) {
        return this.prisma.raceEntry.create({ data: { ...dto, raceId } });
    }
    async createBulkEntries(raceId, entries) {
        const created = await this.prisma.raceEntry.createMany({
            data: entries.map((e) => ({ ...e, raceId })),
        });
        return { count: created.count };
    }
    async getAnalysis(raceId) {
        const prediction = await this.prisma.prediction.findFirst({
            where: { raceId, status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
        });
        return prediction || null;
    }
};
exports.RacesService = RacesService;
exports.RacesService = RacesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Function])
], RacesService);
//# sourceMappingURL=races.service.js.map