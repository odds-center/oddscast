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
exports.RankingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const picks_service_1 = require("../picks/picks.service");
let RankingsService = class RankingsService {
    constructor(prisma, picksService) {
        this.prisma = prisma;
        this.picksService = picksService;
    }
    async getRankings(type = 'overall', limit = 20) {
        const correctCountMap = await this.picksService.getCorrectCountByUser();
        const userIds = [...correctCountMap.keys()];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds }, isActive: true },
            select: { id: true, name: true, nickname: true, avatar: true },
        });
        const rankings = users
            .map((user) => ({
            id: user.id,
            name: user.nickname || user.name,
            avatar: user.avatar || '',
            correctCount: correctCountMap.get(user.id) || 0,
            isCurrentUser: false,
        }))
            .filter((r) => r.correctCount > 0)
            .sort((a, b) => b.correctCount - a.correctCount)
            .slice(0, limit)
            .map((r, i) => ({ ...r, rank: i + 1 }));
        return { data: rankings, total: rankings.length, type };
    }
    async getMyRanking(userId, _type = 'overall') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, nickname: true, avatar: true },
        });
        const correctCount = await this.picksService.getCorrectCount(userId);
        return {
            data: {
                id: userId,
                rank: 0,
                name: user?.nickname || user?.name || '',
                avatar: user?.avatar || '',
                correctCount,
                isCurrentUser: true,
            },
        };
    }
};
exports.RankingsService = RankingsService;
exports.RankingsService = RankingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        picks_service_1.PicksService])
], RankingsService);
//# sourceMappingURL=rankings.service.js.map