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
exports.PointsController = void 0;
const common_1 = require("@nestjs/common");
const points_service_1 = require("./points.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const point_dto_1 = require("./dto/point.dto");
let PointsController = class PointsController {
    constructor(pointsService) {
        this.pointsService = pointsService;
    }
    getPromotions(filters) {
        return this.pointsService.getPromotions(filters);
    }
    getExpirySettings() {
        return this.pointsService.getExpirySettings();
    }
    getTicketPrice() {
        return this.pointsService.getTicketPrice();
    }
    getMyBalance(user) {
        return this.pointsService.getBalance(user.sub);
    }
    getMyTransactions(user, page, limit, type) {
        return this.pointsService.getTransactions(user.sub, {
            page: page || 1,
            limit: limit || 20,
            type,
        });
    }
    purchaseTicket(user, dto) {
        return this.pointsService.purchaseTicket(user.sub, dto);
    }
    transfer(user, dto) {
        return this.pointsService.transfer(user.sub, dto);
    }
    getBalance(userId) {
        return this.pointsService.getBalance(userId);
    }
    getTransactions(userId, filters) {
        return this.pointsService.getTransactions(userId, filters);
    }
    createTransaction(userId, dto) {
        return this.pointsService.createTransaction(userId, dto);
    }
    applyPromotion(userId, promotionId) {
        return this.pointsService.applyPromotion(userId, promotionId);
    }
};
exports.PointsController = PointsController;
__decorate([
    (0, common_1.Get)('promotions'),
    (0, swagger_1.ApiOperation)({ summary: '프로모션 목록 조회' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getPromotions", null);
__decorate([
    (0, common_1.Get)('expiry-settings'),
    (0, swagger_1.ApiOperation)({ summary: '포인트 만료 설정 조회' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getExpirySettings", null);
__decorate([
    (0, common_1.Get)('ticket-price'),
    (0, swagger_1.ApiOperation)({ summary: '포인트 예측권 가격 조회' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getTicketPrice", null);
__decorate([
    (0, common_1.Get)('me/balance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '내 포인트 잔액 조회' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getMyBalance", null);
__decorate([
    (0, common_1.Get)('me/transactions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '내 포인트 거래 내역 조회' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Number, Number, String]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getMyTransactions", null);
__decorate([
    (0, common_1.Post)('purchase-ticket'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '포인트로 예측권 구매' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload,
        point_dto_1.PurchaseTicketDto]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "purchaseTicket", null);
__decorate([
    (0, common_1.Post)('transfer'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '포인트 이체' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, point_dto_1.PointTransferDto]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "transfer", null);
__decorate([
    (0, common_1.Get)(':userId/balance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '포인트 잔액 조회' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)(':userId/transactions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '포인트 트랜잭션 조회' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)(':userId/transactions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '포인트 트랜잭션 생성 (관리자용?)' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, point_dto_1.CreatePointTransactionDto]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Post)(':userId/promotions/:promotionId/apply'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '프로모션 적용' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('promotionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], PointsController.prototype, "applyPromotion", null);
exports.PointsController = PointsController = __decorate([
    (0, swagger_1.ApiTags)('Points'),
    (0, common_1.Controller)('points'),
    __metadata("design:paramtypes", [points_service_1.PointsService])
], PointsController);
//# sourceMappingURL=points.controller.js.map