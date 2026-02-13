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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const { page = 1, limit = 20, role, search } = filters;
        const where = {};
        if (role)
            where.role = role;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { nickname: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    nickname: true,
                    avatar: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                avatar: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다');
        return user;
    }
    async update(id, dto) {
        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                avatar: true,
                role: true,
                isActive: true,
            },
        });
    }
    async remove(id) {
        await this.prisma.user.update({ where: { id }, data: { isActive: false } });
        return { message: '사용자가 비활성화되었습니다' };
    }
    async getStats(id) {
        const [ticketCount, favCount] = await Promise.all([
            this.prisma.predictionTicket.count({ where: { userId: id } }),
            this.prisma.favorite.count({ where: { userId: id } }),
        ]);
        const usedTickets = await this.prisma.predictionTicket.count({
            where: { userId: id, status: 'USED' },
        });
        return {
            totalTickets: ticketCount,
            usedTickets,
            availableTickets: ticketCount - usedTickets,
            totalFavorites: favCount,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map