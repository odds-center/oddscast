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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async subscribe(userId, dto) {
        const plan = dto.planId
            ? await this.prisma.subscriptionPlan.findUnique({
                where: { id: dto.planId },
            })
            : await this.prisma.subscriptionPlan.findFirst({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
            });
        if (!plan)
            throw new common_1.NotFoundException('플랜을 찾을 수 없습니다');
        return this.prisma.subscription.create({
            data: {
                userId,
                planId: plan.id,
                price: plan.totalPrice,
                billingKey: dto.billingKey,
                status: 'PENDING',
            },
            include: { plan: true },
        });
    }
    async activate(id, dto) {
        return this.prisma.subscription.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                billingKey: dto.billingKey,
                startedAt: new Date(),
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            include: { plan: true },
        });
    }
    async cancel(id, dto) {
        return this.prisma.subscription.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: dto.reason,
            },
            include: { plan: true },
        });
    }
    async getStatus(userId) {
        const sub = await this.prisma.subscription.findFirst({
            where: { userId, status: 'ACTIVE' },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
        });
        if (!sub) {
            return { isActive: false, planId: null, monthlyTickets: 0, daysUntilRenewal: null };
        }
        const monthlyTickets = sub.plan?.totalTickets ?? sub.plan?.baseTickets ?? 0;
        let daysUntilRenewal = null;
        if (sub.nextBillingDate) {
            daysUntilRenewal = Math.ceil((new Date(sub.nextBillingDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        }
        return {
            isActive: true,
            planId: sub.plan?.displayName ?? sub.plan?.planName ?? sub.planId,
            monthlyTickets,
            daysUntilRenewal: daysUntilRenewal !== null && daysUntilRenewal >= 0 ? daysUntilRenewal : null,
            subscription: sub,
        };
    }
    async cancelByUserId(userId, reason) {
        const sub = await this.prisma.subscription.findFirst({
            where: { userId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
        });
        if (!sub)
            throw new common_1.NotFoundException('활성 구독이 없습니다.');
        return this.cancel(sub.id, { reason });
    }
    async getHistory(userId) {
        return this.prisma.subscription.findMany({
            where: { userId },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPlans() {
        return this.prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getPlansAdmin() {
        return this.prisma.subscriptionPlan.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }
    async updatePlan(id, data) {
        return this.prisma.subscriptionPlan.update({
            where: { id },
            data,
        });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map