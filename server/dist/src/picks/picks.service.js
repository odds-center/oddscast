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
exports.PicksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pick_dto_1 = require("./dto/pick.dto");
let PicksService = class PicksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const race = await this.prisma.race.findUnique({
            where: { id: dto.raceId },
        });
        if (!race)
            throw new common_1.NotFoundException('경주를 찾을 수 없습니다');
        const requiredCount = pick_dto_1.PICK_TYPE_HORSE_COUNTS[dto.pickType];
        if (!dto.hrNos || dto.hrNos.length !== requiredCount) {
            throw new common_1.BadRequestException(`${dto.pickType}은(는) ${requiredCount}마리를 선택해야 합니다.`);
        }
        const hrNames = dto.hrNames ?? dto.hrNos.map(() => '');
        const existing = await this.prisma.userPick.findUnique({
            where: {
                userId_raceId: { userId, raceId: dto.raceId },
            },
        });
        if (existing) {
            return this.prisma.userPick.update({
                where: { id: existing.id },
                data: {
                    pickType: dto.pickType,
                    hrNos: dto.hrNos,
                    hrNames,
                },
                include: { race: true },
            });
        }
        return this.prisma.userPick.create({
            data: {
                userId,
                raceId: dto.raceId,
                pickType: dto.pickType,
                hrNos: dto.hrNos,
                hrNames,
            },
            include: { race: true },
        });
    }
    async findByUser(userId, page = 1, limit = 20) {
        const [picks, total] = await Promise.all([
            this.prisma.userPick.findMany({
                where: { userId },
                include: { race: true },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.userPick.count({ where: { userId } }),
        ]);
        return { picks, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findByRace(raceId, userId) {
        const where = { raceId };
        if (userId)
            where.userId = userId;
        const pick = await this.prisma.userPick.findFirst({
            where,
            include: { race: true },
        });
        return pick;
    }
    async delete(userId, raceId) {
        const pick = await this.prisma.userPick.findFirst({
            where: { userId, raceId },
        });
        if (!pick)
            throw new common_1.NotFoundException('기록을 찾을 수 없습니다');
        await this.prisma.userPick.delete({ where: { id: pick.id } });
        return { message: '삭제되었습니다' };
    }
    async getCorrectCount(userId) {
        const picks = await this.prisma.userPick.findMany({
            where: { userId },
            include: {
                race: {
                    include: {
                        results: { orderBy: { rcRank: 'asc' } },
                    },
                },
            },
        });
        let correct = 0;
        for (const pick of picks) {
            const results = pick.race?.results ?? [];
            if (results.length === 0)
                continue;
            const isHit = this.checkPickHit(pick.pickType, pick.hrNos, results);
            if (isHit)
                correct++;
        }
        return correct;
    }
    async getCorrectCountByUser() {
        const picks = await this.prisma.userPick.findMany({
            include: {
                race: {
                    include: {
                        results: { orderBy: { rcRank: 'asc' } },
                    },
                },
            },
        });
        const map = new Map();
        for (const pick of picks) {
            const results = pick.race?.results ?? [];
            if (results.length === 0)
                continue;
            const isHit = this.checkPickHit(pick.pickType, pick.hrNos, results);
            if (isHit) {
                map.set(pick.userId, (map.get(pick.userId) ?? 0) + 1);
            }
        }
        return map;
    }
    checkPickHit(pickType, hrNos, results) {
        const rank1 = results.find((r) => (r.rcRank ?? '') === '1');
        const rank2 = results.find((r) => (r.rcRank ?? '') === '2');
        const rank3 = results.find((r) => (r.rcRank ?? '') === '3');
        const top3 = [rank1, rank2, rank3].filter(Boolean).map((r) => r.hrNo);
        switch (pickType) {
            case 'SINGLE':
                return rank1 !== undefined && hrNos[0] === rank1.hrNo;
            case 'PLACE':
                return rank1 !== undefined && top3.includes(hrNos[0]);
            case 'QUINELLA':
                if (!rank1 || !rank2)
                    return false;
                const set12 = new Set([rank1.hrNo, rank2.hrNo]);
                const setPickQ = new Set(hrNos);
                return set12.size === 2 && setPickQ.size === 2 &&
                    [...set12].every((h) => setPickQ.has(h));
            case 'EXACTA':
                return rank1 !== undefined && rank2 !== undefined &&
                    hrNos[0] === rank1.hrNo && hrNos[1] === rank2.hrNo;
            case 'QUINELLA_PLACE':
                return top3.length >= 2 && hrNos.every((h) => top3.includes(h));
            case 'TRIFECTA':
                if (!rank1 || !rank2 || !rank3)
                    return false;
                const set123 = new Set([rank1.hrNo, rank2.hrNo, rank3.hrNo]);
                const setPick = new Set(hrNos);
                return set123.size === 3 && setPick.size === 3 &&
                    [...set123].every((h) => setPick.has(h));
            case 'TRIPLE':
                return rank1 !== undefined && rank2 !== undefined && rank3 !== undefined &&
                    hrNos[0] === rank1.hrNo && hrNos[1] === rank2.hrNo && hrNos[2] === rank3.hrNo;
            default:
                return false;
        }
    }
};
exports.PicksService = PicksService;
exports.PicksService = PicksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PicksService);
//# sourceMappingURL=picks.service.js.map