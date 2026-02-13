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
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FavoritesService = class FavoritesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, filters) {
        const { page = 1, limit = 20, type = 'RACE' } = filters;
        const where = { userId };
        where.type = (type || 'RACE');
        const [favorites, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.favorite.count({ where }),
        ]);
        return { favorites, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const fav = await this.prisma.favorite.findUnique({ where: { id } });
        if (!fav)
            throw new common_1.NotFoundException('즐겨찾기를 찾을 수 없습니다');
        return fav;
    }
    async create(userId, dto) {
        return this.prisma.favorite.create({
            data: {
                userId,
                type: dto.type,
                targetId: dto.targetId,
                targetName: dto.targetName,
                targetData: dto.targetData,
                memo: dto.memo,
                priority: dto.priority,
                tags: dto.tags,
            },
        });
    }
    async update(id, dto) {
        return this.prisma.favorite.update({
            where: { id },
            data: {
                targetName: dto.targetName,
                targetData: dto.targetData,
                memo: dto.memo,
                priority: dto.priority,
                tags: dto.tags,
            },
        });
    }
    async remove(id) {
        await this.prisma.favorite.delete({ where: { id } });
        return { message: '즐겨찾기가 삭제되었습니다' };
    }
    async toggle(userId, dto) {
        const existing = await this.prisma.favorite.findUnique({
            where: {
                userId_type_targetId: {
                    userId,
                    type: dto.type,
                    targetId: dto.targetId,
                },
            },
        });
        if (existing) {
            await this.prisma.favorite.delete({ where: { id: existing.id } });
            return { action: 'REMOVED' };
        }
        else {
            const fav = await this.prisma.favorite.create({
                data: {
                    userId,
                    type: dto.type,
                    targetId: dto.targetId,
                    targetName: dto.targetName,
                    targetData: dto.targetData,
                    priority: dto.priority,
                    tags: dto.tags,
                },
            });
            return { action: 'ADDED', favorite: fav };
        }
    }
    async check(userId, type, targetId) {
        const fav = await this.prisma.favorite.findUnique({
            where: {
                userId_type_targetId: {
                    userId,
                    type: type,
                    targetId,
                },
            },
        });
        return { isFavorite: !!fav, favorite: fav || undefined };
    }
    async getStatistics(userId) {
        const counts = await this.prisma.favorite.groupBy({
            by: ['type'],
            where: { userId },
            _count: true,
        });
        return {
            byType: counts,
            total: counts.reduce((sum, c) => sum + c._count, 0),
        };
    }
    async search(userId, query) {
        return this.prisma.favorite.findMany({
            where: {
                userId,
                type: 'RACE',
                OR: [
                    { targetName: { contains: query, mode: 'insensitive' } },
                    { memo: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async export(userId) {
        return this.prisma.favorite.findMany({
            where: { userId, type: 'RACE' },
        });
    }
    async bulkAdd(userId, items) {
        const raceItems = items.filter((item) => item.type === 'RACE');
        return this.prisma.favorite.createMany({
            data: raceItems.map((item) => ({
                userId,
                type: 'RACE',
                targetId: item.targetId,
                targetName: item.targetName,
                targetData: item.targetData,
                memo: item.memo,
                priority: item.priority,
                tags: item.tags,
            })),
            skipDuplicates: true,
        });
    }
    async bulkDelete(userId, ids) {
        return this.prisma.favorite.deleteMany({
            where: {
                userId,
                id: { in: ids },
            },
        });
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map