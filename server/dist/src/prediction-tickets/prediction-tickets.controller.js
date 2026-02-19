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
exports.PredictionTicketsController = void 0;
const common_1 = require("@nestjs/common");
const prediction_tickets_service_1 = require("./prediction-tickets.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const payment_dto_1 = require("../common/dto/payment.dto");
let PredictionTicketsController = class PredictionTicketsController {
    constructor(ticketsService) {
        this.ticketsService = ticketsService;
    }
    useTicket(user, dto) {
        return this.ticketsService.useTicket(user.sub, dto);
    }
    getBalance(user) {
        return this.ticketsService.getBalance(user.sub);
    }
    checkMatrixAccess(user, date) {
        return this.ticketsService.checkMatrixAccess(user.sub, date || new Date().toISOString().slice(0, 10));
    }
    useMatrixTicket(user, body) {
        return this.ticketsService.useMatrixTicket(user.sub, body.date || new Date().toISOString().slice(0, 10));
    }
    getMatrixBalance(user) {
        return this.ticketsService.getMatrixBalance(user.sub);
    }
    purchaseMatrixTicket(user, body) {
        const count = Math.min(10, Math.max(1, Number(body.count) || 1));
        return this.ticketsService.purchaseMatrixTickets(user.sub, count);
    }
    getMatrixPrice() {
        return { pricePerTicket: 1000, currency: 'KRW', maxPerPurchase: 10 };
    }
    getHistory(user, page, limit) {
        return this.ticketsService.getHistory(user.sub, page, limit);
    }
    findOne(id) {
        return this.ticketsService.findOne(id);
    }
};
exports.PredictionTicketsController = PredictionTicketsController;
__decorate([
    (0, common_1.Post)('use'),
    (0, swagger_1.ApiOperation)({ summary: '예측권 사용' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, payment_dto_1.UseTicketDto]),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "useTicket", null);
__decorate([
    (0, common_1.Get)('balance'),
    (0, swagger_1.ApiOperation)({ summary: '예측권 잔여 수량' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload]),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('matrix/access'),
    (0, swagger_1.ApiOperation)({ summary: '종합 예측권 접근 권한 확인' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, String]),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "checkMatrixAccess", null);
__decorate([
    (0, common_1.Post)('matrix/use'),
    (0, swagger_1.ApiOperation)({ summary: '종합 예측권 사용' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Object]),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "useMatrixTicket", null);
__decorate([
    (0, common_1.Get)('matrix/balance'),
    (0, swagger_1.ApiOperation)({ summary: '종합 예측권 잔액' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload]),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "getMatrixBalance", null);
__decorate([
    (0, common_1.Post)('matrix/purchase'),
    (0, swagger_1.ApiOperation)({ summary: '종합 예측권 개별 구매 (1,000원/장)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Object]),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "purchaseMatrixTicket", null);
__decorate([
    (0, common_1.Get)('matrix/price'),
    (0, swagger_1.ApiOperation)({ summary: '종합 예측권 가격 정보' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "getMatrixPrice", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: '예측권 사용 이력' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Number, Number]),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '예측권 상세 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PredictionTicketsController.prototype, "findOne", null);
exports.PredictionTicketsController = PredictionTicketsController = __decorate([
    (0, swagger_1.ApiTags)('Prediction Tickets'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('prediction-tickets'),
    __metadata("design:paramtypes", [prediction_tickets_service_1.PredictionTicketsService])
], PredictionTicketsController);
//# sourceMappingURL=prediction-tickets.controller.js.map