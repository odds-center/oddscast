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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const subscriptions_service_1 = require("./subscriptions.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const subscription_dto_1 = require("./dto/subscription.dto");
let SubscriptionsController = class SubscriptionsController {
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }
    getPlans() {
        return this.subscriptionsService.getPlans();
    }
    getStatus(user) {
        return this.subscriptionsService.getStatus(user.sub);
    }
    getHistory(user, page, limit, offset) {
        const lim = Math.min(50, Math.max(1, Number(limit) || 20));
        const hasOffset = offset !== undefined && String(offset).trim() !== '';
        const pg = hasOffset
            ? Math.floor(Number(offset) / lim) + 1
            : Math.max(1, Number(page) || 1);
        return this.subscriptionsService.getHistory(user.sub, pg, lim);
    }
    subscribe(user, dto) {
        return this.subscriptionsService.subscribe(user.sub, dto);
    }
    subscribeAlias(user, dto) {
        return this.subscriptionsService.subscribe(user.sub, dto);
    }
    cancelPost(user, dto) {
        return this.subscriptionsService.cancelByUserId(user.sub, dto.reason);
    }
    activate(user, id, dto) {
        return this.subscriptionsService.activate(id, user.sub, dto);
    }
    activatePost(user, id, dto) {
        return this.subscriptionsService.activate(id, user.sub, dto);
    }
    cancel(user, id, dto) {
        return this.subscriptionsService.cancel(id, user.sub, dto);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: '구독 플랜 목록' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '구독 상태 조회' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '구독 이력 조회 (page/limit 또는 offset/limit)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Number, Number, Number]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '구독 신청' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, subscription_dto_1.SubscribeDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '구독 신청 (alias)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, subscription_dto_1.SubscribeDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "subscribeAlias", null);
__decorate([
    (0, common_1.Post)('cancel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '구독 취소 (현재 유저 활성 구독)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, subscription_dto_1.CancelSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "cancelPost", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '구독 활성화 (결제 성공 후)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Number, subscription_dto_1.ActivateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '구독 활성화 (alias)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Number, subscription_dto_1.ActivateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "activatePost", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '구독 취소 (ID 지정)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Number, subscription_dto_1.CancelSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "cancel", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('Subscriptions'),
    (0, common_1.Controller)('subscriptions'),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map