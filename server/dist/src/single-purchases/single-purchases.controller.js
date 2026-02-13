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
exports.SinglePurchasesController = void 0;
const common_1 = require("@nestjs/common");
const single_purchases_service_1 = require("./single-purchases.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const payment_dto_1 = require("../common/dto/payment.dto");
let SinglePurchasesController = class SinglePurchasesController {
    constructor(singlePurchasesService) {
        this.singlePurchasesService = singlePurchasesService;
    }
    purchase(user, dto) {
        return this.singlePurchasesService.purchase(user.sub, dto);
    }
    purchaseAlias(user, dto) {
        return this.singlePurchasesService.purchase(user.sub, dto);
    }
    getConfig() {
        return this.singlePurchasesService.getConfig();
    }
    calculatePrice(quantity = 1) {
        return this.singlePurchasesService.calculatePrice(Number(quantity));
    }
    calculatePriceAlias(quantity = 1) {
        return this.singlePurchasesService.calculatePrice(Number(quantity));
    }
    getHistory(user, page, limit) {
        return this.singlePurchasesService.getHistory(user.sub, page, limit);
    }
    getTotalSpent(user) {
        return this.singlePurchasesService.getTotalSpent(user.sub);
    }
};
exports.SinglePurchasesController = SinglePurchasesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '예측권 개별 구매' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, payment_dto_1.PurchaseDto]),
    __metadata("design:returntype", void 0)
], SinglePurchasesController.prototype, "purchase", null);
__decorate([
    (0, common_1.Post)('purchase'),
    (0, swagger_1.ApiOperation)({ summary: '예측권 개별 구매 (alias)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, payment_dto_1.PurchaseDto]),
    __metadata("design:returntype", void 0)
], SinglePurchasesController.prototype, "purchaseAlias", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({ summary: '구매 설정 조회' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SinglePurchasesController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('price'),
    (0, swagger_1.ApiOperation)({ summary: '가격 계산' }),
    __param(0, (0, common_1.Query)('quantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SinglePurchasesController.prototype, "calculatePrice", null);
__decorate([
    (0, common_1.Get)('calculate-price'),
    (0, swagger_1.ApiOperation)({ summary: '가격 계산 (alias)' }),
    __param(0, (0, common_1.Query)('quantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SinglePurchasesController.prototype, "calculatePriceAlias", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: '구매 이력' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Number, Number]),
    __metadata("design:returntype", void 0)
], SinglePurchasesController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('total-spent'),
    (0, swagger_1.ApiOperation)({ summary: '총 지출 금액' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload]),
    __metadata("design:returntype", void 0)
], SinglePurchasesController.prototype, "getTotalSpent", null);
exports.SinglePurchasesController = SinglePurchasesController = __decorate([
    (0, swagger_1.ApiTags)('Single Purchases'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('single-purchases'),
    __metadata("design:paramtypes", [single_purchases_service_1.SinglePurchasesService])
], SinglePurchasesController);
//# sourceMappingURL=single-purchases.controller.js.map