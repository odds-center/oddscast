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
var AdminController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const kra_service_1 = require("../kra/kra.service");
const users_service_1 = require("../users/users.service");
const config_service_1 = require("../config/config.service");
const prisma_service_1 = require("../prisma/prisma.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const notifications_service_1 = require("../notifications/notifications.service");
const single_purchases_service_1 = require("../single-purchases/single-purchases.service");
const prediction_tickets_service_1 = require("../prediction-tickets/prediction-tickets.service");
let AdminController = AdminController_1 = class AdminController {
    constructor(kraService, usersService, configService, prisma, subscriptionsService, notificationsService, singlePurchasesService, predictionTicketsService) {
        this.kraService = kraService;
        this.usersService = usersService;
        this.configService = configService;
        this.prisma = prisma;
        this.subscriptionsService = subscriptionsService;
        this.notificationsService = notificationsService;
        this.singlePurchasesService = singlePurchasesService;
        this.predictionTicketsService = predictionTicketsService;
    }
    async syncSchedule(date) {
        const d = date?.replace(/-/g, '').slice(0, 8) ||
            new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return this.kraService.syncEntrySheet(d);
    }
    async syncResults(date) {
        const d = date?.replace(/-/g, '').slice(0, 8) ||
            new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return this.kraService.fetchRaceResults(d);
    }
    async syncDetails(date) {
        const d = date?.replace(/-/g, '').slice(0, 8) ||
            new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return this.kraService.syncAnalysisData(d);
    }
    async getKraStatus() {
        return this.kraService.getKraStatus();
    }
    async getKraSyncLogs(endpoint, rcDate, limit) {
        const take = Math.min(Number(limit) || 50, 100);
        const logs = await this.prisma.kraSyncLog.findMany({
            where: {
                ...(endpoint && { endpoint }),
                ...(rcDate && { rcDate }),
            },
            orderBy: { createdAt: 'desc' },
            take,
        });
        return { logs, total: logs.length };
    }
    async seedSample(date) {
        return this.kraService.seedSampleRaces(date);
    }
    async syncJockeys(meet) {
        return this.kraService.fetchJockeyTotalResults(meet);
    }
    async syncAll(date) {
        const d = date?.replace(/-/g, '').slice(0, 8) ||
            new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return this.kraService.syncAll(d);
    }
    async syncHistorical(dateFrom, dateTo) {
        if (!dateFrom || !dateTo) {
            throw new Error('dateFrom, dateTo (YYYYMMDD) 필수');
        }
        return this.kraService.syncHistoricalBackfill(dateFrom, dateTo);
    }
    async getUsers(page, limit, role, search) {
        const result = await this.usersService.findAll({
            page,
            limit,
            role,
            search,
        });
        return {
            data: result.users,
            meta: {
                total: result.total,
                page: result.page,
                limit: limit ?? 20,
                totalPages: result.totalPages,
            },
        };
    }
    async getUser(id) {
        return this.usersService.findOne(id);
    }
    async updateUser(id, body) {
        return this.usersService.update(id, body);
    }
    async deleteUser(id) {
        return this.usersService.remove(id);
    }
    async activateUser(id) {
        return this.usersService.update(id, { isActive: true });
    }
    async deactivateUser(id) {
        return this.usersService.update(id, { isActive: false });
    }
    async grantTickets(id, body) {
        const count = Math.min(100, Math.max(1, Number(body.count) || 1));
        const expiresInDays = Math.min(365, Math.max(1, Number(body.expiresInDays) || 30));
        return this.predictionTicketsService.grantTickets(id, count, expiresInDays);
    }
    async getAIConfig() {
        const raw = await this.configService.get('ai_config');
        const defaults = {
            llmProvider: 'gemini',
            primaryModel: 'gemini-2.5-flash',
            availableModels: [
                'gemini-2.5-flash',
                'gemini-2.0-flash',
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash',
                'gemini-1.5-flash-8b',
                'gemini-1.5-pro',
                'gemini-1.5-pro-002',
                'gemini-pro',
            ],
            fallbackModels: ['gemini-1.5-flash', 'gemini-pro'],
            costStrategy: 'balanced',
            temperature: 0.7,
            maxTokens: 1000,
            enableCaching: true,
            cacheTTL: 3600,
            enableBatchPrediction: true,
            batchCronSchedule: '0 9 * * 5,6,0',
            enableAutoUpdate: true,
            updateIntervalMinutes: 10,
            oddsChangeThreshold: 10,
            promptVersion: 'v1.0.0',
            systemPromptTemplate: '',
        };
        if (!raw)
            return defaults;
        return { ...defaults, ...JSON.parse(raw) };
    }
    async updateAIConfig(body) {
        await this.configService.set('ai_config', JSON.stringify(body));
        return body;
    }
    async getSystemConfig() {
        const all = await this.configService.getAll();
        return {
            show_google_login: all.show_google_login === 'true' || all.show_google_login === '1',
            kra_base_url_override: all.kra_base_url_override || '',
        };
    }
    async updateSystemConfig(body) {
        if (body.show_google_login !== undefined) {
            await this.configService.set('show_google_login', body.show_google_login ? 'true' : 'false');
        }
        if (body.kra_base_url_override !== undefined) {
            await this.configService.set('kra_base_url_override', String(body.kra_base_url_override));
        }
        return this.getSystemConfig();
    }
    async estimateCost() {
        const raw = await this.configService.get('ai_config');
        const config = raw ? JSON.parse(raw) : {};
        const strategyMonthly = {
            premium: 7200,
            balanced: 3600,
            budget: 1200,
        };
        const rawMonthly = typeof config.primaryModel === 'string' &&
            AdminController_1.MODEL_COST[config.primaryModel] != null
            ? AdminController_1.MODEL_COST[config.primaryModel] *
                AdminController_1.RACES_PER_MONTH
            : (strategyMonthly[config.costStrategy ?? 'balanced'] ?? 3600);
        const modelCost = typeof config.primaryModel === 'string'
            ? (AdminController_1.MODEL_COST[config.primaryModel] ?? 12)
            : rawMonthly / AdminController_1.RACES_PER_MONTH;
        const enableCaching = config.enableCaching ?? true;
        const estimatedMonthlyCost = enableCaching
            ? Math.round(rawMonthly * 0.01)
            : rawMonthly;
        return {
            estimatedMonthlyCost,
            primaryModel: config.primaryModel ?? null,
            costStrategy: config.costStrategy ?? 'balanced',
            enableCaching,
            calculationText: typeof config.primaryModel === 'string'
                ? enableCaching
                    ? `경주당 ₩${modelCost} × ${AdminController_1.RACES_PER_MONTH}경기/월 × 1%(캐싱) ≈ ₩${estimatedMonthlyCost.toLocaleString()}`
                    : `경주당 ₩${modelCost} × ${AdminController_1.RACES_PER_MONTH}경기/월 ≈ ₩${rawMonthly.toLocaleString()} (캐싱 ON 시 99%↓)`
                : `전략 ${config.costStrategy ?? 'balanced'} (캐싱 ${enableCaching ? 'ON' : 'OFF'}) ≈ ₩${estimatedMonthlyCost.toLocaleString()}`,
        };
    }
    async getBets(page, limit, userId, raceId, status) {
        const p = Math.max(1, Number(page) || 1);
        const l = Math.min(100, Math.max(1, Number(limit) || 20));
        const where = {};
        if (userId)
            where.userId = parseInt(userId, 10);
        if (raceId)
            where.raceId = parseInt(raceId, 10);
        if (status)
            where.betStatus = status;
        const [bets, total] = await Promise.all([
            this.prisma.bet.findMany({
                where,
                orderBy: { betTime: 'desc' },
                skip: (p - 1) * l,
                take: l,
                include: { race: true },
            }),
            this.prisma.bet.count({ where }),
        ]);
        return {
            data: bets,
            meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
        };
    }
    async getBet(id) {
        return this.prisma.bet.findUnique({
            where: { id },
            include: {
                race: true,
                user: { select: { id: true, email: true, name: true } },
            },
        });
    }
    async getSubscriptionPlans() {
        return this.subscriptionsService.getPlansAdmin();
    }
    async createSubscriptionPlan(body) {
        return this.subscriptionsService.createPlan(body);
    }
    async getSubscriptionPlan(id) {
        return this.prisma.subscriptionPlan.findUnique({
            where: { id },
        });
    }
    async updateSubscriptionPlan(id, body) {
        return this.subscriptionsService.updatePlan(id, body);
    }
    async deleteSubscriptionPlan(id) {
        return this.subscriptionsService.deletePlan(id);
    }
    async getNotifications(page, limit) {
        return this.notificationsService.findAllAdmin({ page, limit });
    }
    async sendNotification(body) {
        return this.notificationsService.adminSend(body);
    }
    async getSinglePurchaseConfig() {
        return this.singlePurchasesService.getConfig();
    }
    async updateSinglePurchaseConfig(body) {
        return this.singlePurchasesService.updateConfig(body);
    }
    async getDashboardStats() {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const [totalUsers, activeUsers, todayRaces, todayBetsCount, todayBetsAmount, totalBetsAgg, activeSubscriptions,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { isActive: true } }),
            this.prisma.race.count({ where: { rcDate: today } }),
            this.prisma.bet.count({
                where: {
                    betTime: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
            }),
            this.prisma.bet.aggregate({
                where: {
                    betTime: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
                _sum: { betAmount: true },
            }),
            this.prisma.bet.aggregate({
                _count: true,
                _sum: { betAmount: true },
            }),
            this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        ]);
        const todayBets = {
            count: todayBetsCount,
            amount: todayBetsAmount._sum?.betAmount ?? 0,
        };
        const totalBets = {
            count: totalBetsAgg._count,
            amount: totalBetsAgg._sum?.betAmount ?? 0,
            winAmount: 0,
        };
        const winAmountAgg = await this.prisma.bet.aggregate({
            where: { actualWin: { not: null } },
            _sum: { actualWin: true },
        });
        totalBets.winAmount = winAmountAgg._sum?.actualWin ?? 0;
        return {
            totalUsers,
            activeUsers,
            todayRaces,
            todayBets,
            totalBets,
            activeSubscriptions,
        };
    }
    async getRevenueStats(period) {
        const subs = await this.prisma.subscription.findMany({
            where: { status: 'ACTIVE' },
            include: { plan: true },
        });
        const monthlyRevenue = subs.reduce((s, sub) => s + (sub.price ?? 0), 0);
        const singleAgg = await this.prisma.singlePurchase.aggregate({
            _sum: { totalAmount: true },
            _count: { id: true },
        });
        const singleRevenue = singleAgg._sum?.totalAmount ?? 0;
        const singlePurchaseCount = singleAgg._count?.id ?? 0;
        const totalRevenue = monthlyRevenue + singleRevenue;
        const monthlyCost = 0;
        const monthlyProfit = totalRevenue - monthlyCost;
        const margin = totalRevenue > 0 ? (monthlyProfit / totalRevenue) * 100 : 0;
        const subscriptionByPlan = [];
        const planMap = new Map();
        for (const sub of subs) {
            const name = sub.plan?.planName ?? 'Unknown';
            const curr = planMap.get(name) ?? { count: 0, revenue: 0 };
            curr.count++;
            curr.revenue += sub.price ?? 0;
            planMap.set(name, curr);
        }
        planMap.forEach((v, k) => subscriptionByPlan.push({
            planName: k,
            count: v.count,
            revenue: v.revenue,
        }));
        const periodType = period || 'month';
        const rows = [];
        if (periodType === 'day') {
            const today = new Date().toISOString().slice(0, 10);
            const daySingle = await this.prisma.singlePurchase.aggregate({
                where: {
                    purchasedAt: {
                        gte: new Date(today + 'T00:00:00.000Z'),
                        lt: new Date(new Date(today).getTime() + 86400000),
                    },
                },
                _sum: { totalAmount: true },
            });
            const dayRev = daySingle._sum?.totalAmount ?? 0;
            rows.push({
                period: today,
                revenue: dayRev,
                payout: 0,
                profit: dayRev,
            });
        }
        else if (periodType === 'year') {
            const y = new Date().getFullYear();
            const yearSingle = await this.prisma.singlePurchase.aggregate({
                where: {
                    purchasedAt: {
                        gte: new Date(`${y}-01-01`),
                        lt: new Date(`${y + 1}-01-01`),
                    },
                },
                _sum: { totalAmount: true },
            });
            const yearRev = monthlyRevenue * 12 + (yearSingle._sum?.totalAmount ?? 0);
            rows.push({
                period: String(y),
                revenue: yearRev,
                payout: 0,
                profit: yearRev,
            });
        }
        else {
            const now = new Date();
            const m = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            rows.push({
                period: m,
                revenue: totalRevenue,
                payout: monthlyCost,
                profit: monthlyProfit,
            });
            for (let i = 1; i <= 11; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const mp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
                const monthSingle = await this.prisma.singlePurchase.aggregate({
                    where: { purchasedAt: { gte: start, lte: end } },
                    _sum: { totalAmount: true },
                });
                const rev = monthSingle._sum?.totalAmount ?? 0;
                rows.unshift({
                    period: mp,
                    revenue: rev,
                    payout: 0,
                    profit: rev,
                });
            }
        }
        return {
            monthlyRevenue,
            singleRevenue,
            totalRevenue,
            monthlyCost,
            monthlyProfit,
            margin,
            activeSubscribers: subs.length,
            avgRevenuePerUser: subs.length > 0 ? monthlyRevenue / subs.length : 0,
            subscriptionByPlan,
            singlePurchaseCount,
            rows,
        };
    }
    async getUsersGrowth(days) {
        const d = Math.min(90, Math.max(7, Number(days) || 30));
        const start = new Date();
        start.setDate(start.getDate() - d);
        start.setHours(0, 0, 0, 0);
        const users = await this.prisma.user.findMany({
            where: { createdAt: { gte: start } },
            select: { createdAt: true },
        });
        const byDate = {};
        for (let i = 0; i < d; i++) {
            const dt = new Date(start);
            dt.setDate(dt.getDate() + i);
            const key = dt.toISOString().slice(0, 10);
            byDate[key] = 0;
        }
        users.forEach((u) => {
            const key = u.createdAt.toISOString().slice(0, 10);
            if (byDate[key] !== undefined)
                byDate[key]++;
        });
        return Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }));
    }
    async getBetsTrend(days) {
        const d = Math.min(90, Math.max(7, Number(days) || 30));
        const start = new Date();
        start.setDate(start.getDate() - d);
        start.setHours(0, 0, 0, 0);
        const bets = await this.prisma.bet.findMany({
            where: { betTime: { gte: start } },
            select: { betAmount: true, actualWin: true, betTime: true },
        });
        const byDate = {};
        for (let i = 0; i < d; i++) {
            const dt = new Date(start);
            dt.setDate(dt.getDate() + i);
            const key = dt.toISOString().slice(0, 10);
            byDate[key] = { count: 0, amount: 0, winAmount: 0 };
        }
        bets.forEach((b) => {
            const key = b.betTime.toISOString().slice(0, 10);
            if (byDate[key]) {
                byDate[key].count++;
                byDate[key].amount += b.betAmount ?? 0;
                byDate[key].winAmount += b.actualWin ?? 0;
            }
        });
        return Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({ date, ...v }));
    }
};
exports.AdminController = AdminController;
AdminController.MODEL_COST = {
    'gemini-2.5-flash': 5,
    'gemini-2.0-flash-exp': 5,
    'gemini-2.0-flash': 5,
    'gemini-1.5-pro': 12,
    'gemini-1.5-pro-002': 12,
    'gemini-1.5-flash': 4,
    'gemini-1.5-flash-8b': 2,
    'gemini-pro': 8,
};
AdminController.RACES_PER_MONTH = 50;
__decorate([
    (0, common_1.Post)('kra/sync/schedule'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] KRA 경주 계획/출전표 동기화' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "syncSchedule", null);
__decorate([
    (0, common_1.Post)('kra/sync/results'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] KRA 경주 결과 동기화' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "syncResults", null);
__decorate([
    (0, common_1.Post)('kra/sync/details'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] KRA 상세/훈련정보 동기화 (Group B)' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "syncDetails", null);
__decorate([
    (0, common_1.Get)('kra/status'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] KRA 설정 상태 (Base URL, API 키 여부)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getKraStatus", null);
__decorate([
    (0, common_1.Get)('kra/sync-logs'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] KRA 동기화 로그 조회' }),
    __param(0, (0, common_1.Query)('endpoint')),
    __param(1, (0, common_1.Query)('rcDate')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getKraSyncLogs", null);
__decorate([
    (0, common_1.Post)('kra/seed-sample'),
    (0, swagger_1.ApiOperation)({
        summary: '[Admin] 샘플 경주 데이터 적재 (KRA 키 없이 개발용)',
    }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "seedSample", null);
__decorate([
    (0, common_1.Post)('kra/sync/jockeys'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] KRA 기수 통산전적 동기화' }),
    __param(0, (0, common_1.Query)('meet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "syncJockeys", null);
__decorate([
    (0, common_1.Post)('kra/sync/all'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] KRA 전체 적재 (출전표→결과→상세→기수)' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "syncAll", null);
__decorate([
    (0, common_1.Post)('kra/sync/historical'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 과거 경마 기록 적재 (몇 년치 백업용)' }),
    __param(0, (0, common_1.Query)('dateFrom')),
    __param(1, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "syncHistorical", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 사용자 목록 조회' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 사용자 상세 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 사용자 수정' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 사용자 삭제(비활성화)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/activate'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 사용자 활성화' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "activateUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 사용자 비활성화' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deactivateUser", null);
__decorate([
    (0, common_1.Post)('users/:id/grant-tickets'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 사용자에게 예측권 지급' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "grantTickets", null);
__decorate([
    (0, common_1.Get)('ai/config'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] AI 설정 조회 (Gemini)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAIConfig", null);
__decorate([
    (0, common_1.Post)('ai/config'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] AI 설정 저장 (Gemini)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAIConfig", null);
__decorate([
    (0, common_1.Get)('config/system'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 시스템 설정 조회' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemConfig", null);
__decorate([
    (0, common_1.Patch)('config/system'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 시스템 설정 저장' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSystemConfig", null);
__decorate([
    (0, common_1.Get)('ai/estimate-cost'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] AI 예상 비용 (설정 기반)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "estimateCost", null);
__decorate([
    (0, common_1.Get)('bets'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 마권 목록 조회' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('raceId')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBets", null);
__decorate([
    (0, common_1.Get)('bets/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 마권 상세 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBet", null);
__decorate([
    (0, common_1.Get)('subscriptions/plans'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 구독 플랜 목록 (전체)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSubscriptionPlans", null);
__decorate([
    (0, common_1.Post)('subscriptions/plans'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 구독 플랜 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSubscriptionPlan", null);
__decorate([
    (0, common_1.Get)('subscriptions/plans/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 구독 플랜 상세' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSubscriptionPlan", null);
__decorate([
    (0, common_1.Patch)('subscriptions/plans/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 구독 플랜 수정' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSubscriptionPlan", null);
__decorate([
    (0, common_1.Delete)('subscriptions/plans/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 구독 플랜 삭제 또는 비활성화' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSubscriptionPlan", null);
__decorate([
    (0, common_1.Get)('notifications'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 알림 목록 조회' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Post)('notifications/send'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 대상별 알림 발송' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Get)('single-purchase/config'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 개별 구매 설정 조회' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSinglePurchaseConfig", null);
__decorate([
    (0, common_1.Patch)('single-purchase/config'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 개별 구매 설정 수정' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSinglePurchaseConfig", null);
__decorate([
    (0, common_1.Get)('statistics/dashboard'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 대시보드 통계' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('statistics/revenue'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 수익 통계' }),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueStats", null);
__decorate([
    (0, common_1.Get)('statistics/users-growth'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 사용자 증가 추이' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsersGrowth", null);
__decorate([
    (0, common_1.Get)('statistics/bets-trend'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] 마권 트렌드' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBetsTrend", null);
exports.AdminController = AdminController = AdminController_1 = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [kra_service_1.KraService,
        users_service_1.UsersService,
        config_service_1.GlobalConfigService,
        prisma_service_1.PrismaService,
        subscriptions_service_1.SubscriptionsService,
        notifications_service_1.NotificationsService,
        single_purchases_service_1.SinglePurchasesService,
        prediction_tickets_service_1.PredictionTicketsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map