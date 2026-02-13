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
var KraController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KraController = void 0;
const common_1 = require("@nestjs/common");
const kra_service_1 = require("./kra.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const client_1 = require("@prisma/client");
let KraController = KraController_1 = class KraController {
    constructor(kraService, prisma) {
        this.kraService = kraService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(KraController_1.name);
    }
    async getSyncLogs(endpoint, rcDate, limit) {
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
    async syncSchedule(date) {
        return this.kraService.syncEntrySheet(date);
    }
    async syncResults(date) {
        return this.kraService.fetchRaceResults(date);
    }
    async syncDetails(date) {
        return this.kraService.syncAnalysisData(date);
    }
    async syncJockeys(meet) {
        return this.kraService.fetchJockeyTotalResults(meet);
    }
};
exports.KraController = KraController;
__decorate([
    (0, common_1.Get)('sync-logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'KRA API 동기화 로그 조회' }),
    __param(0, (0, common_1.Query)('endpoint')),
    __param(1, (0, common_1.Query)('rcDate')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], KraController.prototype, "getSyncLogs", null);
__decorate([
    (0, common_1.Post)('sync/schedule'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'KRA 경주 계획/출전표 수동 동기화' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KraController.prototype, "syncSchedule", null);
__decorate([
    (0, common_1.Post)('sync/results'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'KRA 경주 결과 수동 동기화' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KraController.prototype, "syncResults", null);
__decorate([
    (0, common_1.Post)('sync/details'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'KRA 상세/훈련정보 수동 동기화 (Group B)' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KraController.prototype, "syncDetails", null);
__decorate([
    (0, common_1.Post)('sync/jockeys'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'KRA 기수 통산전적 수동 동기화' }),
    __param(0, (0, common_1.Query)('meet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KraController.prototype, "syncJockeys", null);
exports.KraController = KraController = KraController_1 = __decorate([
    (0, swagger_1.ApiTags)('KRA Integration'),
    (0, common_1.Controller)('kra'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [kra_service_1.KraService,
        prisma_service_1.PrismaService])
], KraController);
//# sourceMappingURL=kra.controller.js.map