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
const BILLING_PERIOD_DAYS = 30;
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async subscribe(userId, dto) {
        const hasActive = await this.prisma.subscription.findFirst({
            where: { userId, status: 'ACTIVE' },
        });
        if (hasActive) {
            throw new common_1.BadRequestException('이미 활성 구독이 있습니다. 취소 후 다시 신청해 주세요.');
        }
        const plan = await this.resolvePlan(dto.planId);
        if (!plan.isActive) {
            throw new common_1.BadRequestException('선택한 플랜은 현재 제공되지 않습니다.');
        }
        return this.prisma.subscription.create({
            data: {
                userId,
                planId: plan.id,
                price: plan.totalPrice,
                billingKey: dto.billingKey ?? undefined,
                status: 'PENDING',
            },
            include: { plan: true },
        });
    }
    async activate(id, userId, dto) {
        const sub = await this.prisma.subscription.findUnique({
            where: { id },
            include: { plan: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('구독을 찾을 수 없습니다.');
        if (sub.userId !== userId) {
            throw new common_1.BadRequestException('본인의 구독만 활성화할 수 있습니다.');
        }
        if (sub.status !== 'PENDING') {
            throw new common_1.BadRequestException(`이미 ${sub.status} 상태입니다. PENDING 구독만 활성화할 수 있습니다.`);
        }
        const startedAt = new Date();
        const nextBillingDate = new Date(startedAt);
        nextBillingDate.setDate(nextBillingDate.getDate() + BILLING_PERIOD_DAYS);
        const ticketsToIssue = sub.plan.totalTickets;
        const matrixTicketsToIssue = sub.plan.matrixTickets ?? 0;
        const ticketExpiresAt = new Date(nextBillingDate);
        const raceTicketData = Array.from({ length: ticketsToIssue }, () => ({
            userId: sub.userId,
            subscriptionId: sub.id,
            type: 'RACE',
            status: 'AVAILABLE',
            expiresAt: ticketExpiresAt,
        }));
        const matrixTicketData = Array.from({ length: matrixTicketsToIssue }, () => ({
            userId: sub.userId,
            subscriptionId: sub.id,
            type: 'MATRIX',
            status: 'AVAILABLE',
            expiresAt: ticketExpiresAt,
        }));
        const [updated] = await this.prisma.$transaction([
            this.prisma.subscription.update({
                where: { id },
                data: {
                    status: 'ACTIVE',
                    billingKey: dto.billingKey ?? sub.billingKey,
                    startedAt,
                    nextBillingDate,
                },
                include: { plan: true },
            }),
            this.prisma.predictionTicket.createMany({
                data: [...raceTicketData, ...matrixTicketData],
            }),
        ]);
        return {
            ...updated,
            ticketsIssued: ticketsToIssue,
            matrixTicketsIssued: matrixTicketsToIssue,
        };
    }
    async cancel(id, userId, dto) {
        const sub = await this.prisma.subscription.findUnique({
            where: { id },
            include: { plan: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('구독을 찾을 수 없습니다.');
        if (sub.userId !== userId) {
            throw new common_1.BadRequestException('본인의 구독만 취소할 수 있습니다.');
        }
        if (sub.status === 'CANCELLED') {
            throw new common_1.BadRequestException('이미 취소된 구독입니다.');
        }
        if (sub.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('활성 구독만 취소할 수 있습니다.');
        }
        return this.prisma.subscription.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: dto.reason ?? undefined,
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
            return {
                isActive: false,
                planId: null,
                planDisplayName: null,
                monthlyTickets: 0,
                remainingTickets: 0,
                daysUntilRenewal: null,
            };
        }
        const monthlyTickets = sub.plan?.totalTickets ?? sub.plan?.baseTickets ?? 0;
        const remainingTickets = await this.prisma.predictionTicket.count({
            where: {
                userId,
                subscriptionId: sub.id,
                status: 'AVAILABLE',
                expiresAt: { gte: new Date() },
            },
        });
        let daysUntilRenewal = null;
        if (sub.nextBillingDate) {
            const diff = Math.ceil((new Date(sub.nextBillingDate).getTime() - Date.now()) /
                (24 * 60 * 60 * 1000));
            daysUntilRenewal = diff >= 0 ? diff : null;
        }
        return {
            isActive: true,
            planId: sub.plan?.displayName ?? sub.plan?.planName ?? String(sub.planId),
            planDisplayName: sub.plan?.displayName ?? sub.plan?.planName ?? null,
            monthlyTickets,
            remainingTickets,
            daysUntilRenewal,
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
        return this.cancel(sub.id, userId, { reason });
    }
    async getHistory(userId, page = 1, limit = 20) {
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
        const [subscriptions, total] = await Promise.all([
            this.prisma.subscription.findMany({
                where: { userId },
                include: { plan: true },
                orderBy: { createdAt: 'desc' },
                skip: (safePage - 1) * safeLimit,
                take: safeLimit,
            }),
            this.prisma.subscription.count({ where: { userId } }),
        ]);
        return {
            subscriptions,
            total,
            page: safePage,
            totalPages: Math.ceil(total / safeLimit),
        };
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
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id },
        });
        if (!plan)
            throw new common_1.NotFoundException('플랜을 찾을 수 없습니다.');
        return this.prisma.subscriptionPlan.update({
            where: { id },
            data,
        });
    }
    async createPlan(data) {
        const existing = await this.prisma.subscriptionPlan.findUnique({
            where: { planName: data.planName },
        });
        if (existing) {
            throw new common_1.BadRequestException(`플랜 코드 '${data.planName}'가 이미 존재합니다.`);
        }
        return this.prisma.subscriptionPlan.create({
            data: {
                ...data,
                isActive: data.isActive ?? true,
                sortOrder: data.sortOrder ?? 0,
            },
        });
    }
    async deletePlan(id) {
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id },
        });
        if (!plan)
            throw new common_1.NotFoundException('플랜을 찾을 수 없습니다.');
        const subscriptionCount = await this.prisma.subscription.count({
            where: { planId: id },
        });
        if (subscriptionCount > 0) {
            return this.prisma.subscriptionPlan.update({
                where: { id },
                data: { isActive: false },
            });
        }
        return this.prisma.subscriptionPlan.delete({ where: { id } });
    }
    async resolvePlan(planId) {
        if (planId != null && planId !== '') {
            const plan = await this.prisma.subscriptionPlan.findUnique({
                where: { id: Number(planId) },
            });
            if (!plan)
                throw new common_1.NotFoundException('플랜을 찾을 수 없습니다.');
            return plan;
        }
        const plan = await this.prisma.subscriptionPlan.findFirst({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        if (!plan)
            throw new common_1.NotFoundException('활성 플랜이 없습니다.');
        return plan;
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map