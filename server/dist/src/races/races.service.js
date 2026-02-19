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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RacesService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_service_1 = require("../prisma/prisma.service");
const dayjs_1 = __importDefault(require("dayjs"));
const constants_1 = require("../kra/constants");
const kra_serializer_1 = require("../common/serializers/kra.serializer");
const prisma_includes_1 = require("../common/prisma-includes");
const shared_1 = require("@goldenrace/shared");
let RacesService = class RacesService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async findAll(filters) {
        const page = Math.max(1, Number(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
        const { q, date, dateFrom, dateTo, meet, status } = filters;
        const where = {};
        if (date) {
            where.rcDate = date.replace(/-/g, '').slice(0, 8);
        }
        else if (dateFrom && dateTo) {
            const from = dateFrom.replace(/-/g, '').slice(0, 8);
            const to = dateTo.replace(/-/g, '').slice(0, 8);
            where.rcDate = { gte: from, lte: to };
        }
        if (meet)
            where.meet = (0, constants_1.toKraMeetName)(meet);
        if (status)
            where.status = status;
        if (q && q.trim()) {
            const term = q.trim();
            where.OR = [
                { rcName: { contains: term, mode: 'insensitive' } },
                { meet: { contains: term, mode: 'insensitive' } },
                { rcNo: { contains: term, mode: 'insensitive' } },
            ];
        }
        const [races, total] = await Promise.all([
            this.prisma.race.findMany({
                where,
                include: prisma_includes_1.RACE_INCLUDE_ENTRIES,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ rcDate: 'desc' }, { rcNo: 'asc' }],
            }),
            this.prisma.race.count({ where }),
        ]);
        return {
            races: (0, kra_serializer_1.serializeRaces)(races),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const cacheKey = `race:${id}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            const hasEntries = (cached.entries?.length ?? 0) > 0;
            if (!hasEntries) {
                const fresh = await this._findOneRaw(id);
                if (fresh && Array.isArray(fresh.entries) && fresh.entries.length > 0) {
                    const serialized = (0, kra_serializer_1.serializeRace)(fresh);
                    await this.cache.set(cacheKey, fresh, 60 * 5 * 1000);
                    return serialized ?? fresh;
                }
            }
            return (0, kra_serializer_1.serializeRace)(cached) ?? cached;
        }
        const race = await this._findOneRaw(id);
        if (!race)
            throw new common_1.NotFoundException('경주를 찾을 수 없습니다');
        const serialized = (0, kra_serializer_1.serializeRace)(race);
        await this.cache.set(cacheKey, race, 60 * 5 * 1000);
        return serialized ?? race;
    }
    async _findOneRaw(id) {
        return this.prisma.race.findUnique({
            where: { id },
            include: prisma_includes_1.RACE_INCLUDE_FULL,
        });
    }
    async create(dto) {
        const data = { ...dto, meet: (0, shared_1.toKraMeetForDb)(dto.meet) ?? dto.meet };
        const created = await this.prisma.race.create({
            data,
            include: prisma_includes_1.RACE_INCLUDE_ENTRIES,
        });
        return (0, kra_serializer_1.serializeRace)(created) ?? created;
    }
    async update(id, dto) {
        const data = dto.meet != null
            ? { ...dto, meet: (0, shared_1.toKraMeetForDb)(dto.meet) ?? dto.meet }
            : dto;
        const race = await this.prisma.race.update({
            where: { id },
            data,
            include: prisma_includes_1.RACE_INCLUDE_ENTRIES,
        });
        await this.cache.del(`race:${id}`);
        return (0, kra_serializer_1.serializeRace)(race) ?? race;
    }
    async remove(id) {
        await this.prisma.race.delete({ where: { id } });
        await this.cache.del(`race:${id}`);
        return { message: '경주가 삭제되었습니다' };
    }
    async getSchedule(filters) {
        const where = {};
        if (filters.dateFrom && filters.dateTo) {
            const from = filters.dateFrom.replace(/-/g, '').slice(0, 8);
            const to = filters.dateTo.replace(/-/g, '').slice(0, 8);
            where.rcDate = { gte: from, lte: to };
        }
        if (filters.meet)
            where.meet = (0, constants_1.toKraMeetName)(filters.meet);
        const races = await this.prisma.race.findMany({
            where,
            include: prisma_includes_1.RACE_INCLUDE_ENTRIES,
            orderBy: [{ rcDate: 'asc' }, { rcNo: 'asc' }],
        });
        return (0, kra_serializer_1.serializeRaces)(races);
    }
    async getTodayRaces() {
        const today = (0, dayjs_1.default)().format('YYYYMMDD');
        return this.getRacesByDate(today);
    }
    async getRacesByDate(date) {
        const rcDate = date.replace(/-/g, '').slice(0, 8);
        const races = await this.prisma.race.findMany({
            where: { rcDate },
            include: prisma_includes_1.RACE_INCLUDE_ENTRIES_ACTIVE,
            orderBy: [{ rcNo: 'asc' }],
        });
        return (0, kra_serializer_1.serializeRaces)(races);
    }
    async getRaceResult(raceId) {
        const results = await this.prisma.raceResult.findMany({
            where: { raceId },
            select: {
                id: true,
                ord: true,
                chulNo: true,
                hrNo: true,
                hrName: true,
                jkName: true,
                rcTime: true,
            },
            orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }],
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
    async getStatistics(filters) {
        const where = {};
        if (filters.meet)
            where.meet = (0, constants_1.toKraMeetName)(filters.meet);
        if (filters.date) {
            where.rcDate = filters.date.replace(/-/g, '').slice(0, 8);
        }
        else if (filters.year && filters.month) {
            const m = String(filters.month).padStart(2, '0');
            const prefix = `${filters.year}${m}`;
            where.rcDate = { gte: `${prefix}01`, lte: `${prefix}31` };
        }
        else if (filters.year) {
            where.rcDate = {
                gte: `${filters.year}0101`,
                lte: `${filters.year}1231`,
            };
        }
        const [total, byStatus] = await Promise.all([
            this.prisma.race.count({ where }),
            this.prisma.race.groupBy({
                by: ['status'],
                where,
                _count: { id: true },
            }),
        ]);
        const statusCounts = {
            SCHEDULED: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            CANCELLED: 0,
        };
        for (const g of byStatus) {
            statusCounts[g.status] = g._count.id;
        }
        return {
            total,
            byStatus: statusCounts,
        };
    }
};
exports.RacesService = RacesService;
exports.RacesService = RacesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Function])
], RacesService);
//# sourceMappingURL=races.service.js.map