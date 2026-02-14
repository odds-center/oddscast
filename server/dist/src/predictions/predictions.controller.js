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
exports.PredictionsController = void 0;
const common_1 = require("@nestjs/common");
const predictions_service_1 = require("./predictions.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prediction_dto_1 = require("./dto/prediction.dto");
let PredictionsController = class PredictionsController {
    constructor(predictionsService) {
        this.predictionsService = predictionsService;
    }
    findAll(filters) {
        return this.predictionsService.findAll(filters);
    }
    getDashboard() {
        return this.predictionsService.getDashboard();
    }
    getAccuracyHistory(filters) {
        return this.predictionsService.getAccuracyHistory(filters);
    }
    getAccuracyStats() {
        return this.predictionsService.getDashboard();
    }
    getAnalyticsDashboard() {
        return this.predictionsService.getAnalyticsDashboard();
    }
    getCost() {
        return this.predictionsService.getCostStats();
    }
    getAnalyticsFailures(startDate, endDate) {
        return this.predictionsService.getAnalyticsFailures({ startDate, endDate });
    }
    getPreview(raceId) {
        return this.predictionsService.getPreview(raceId);
    }
    getPreviewAlias(raceId) {
        return this.predictionsService.getPreview(raceId);
    }
    getByRaceHistory(raceId) {
        return this.predictionsService.getByRaceHistory(raceId);
    }
    getByRace(raceId) {
        return this.predictionsService.getByRace(raceId);
    }
    findOne(id) {
        return this.predictionsService.findOne(id);
    }
    create(dto) {
        return this.predictionsService.create(dto);
    }
    calculateDailyStats() {
        return this.predictionsService.getDashboard();
    }
    updateStatus(id, dto) {
        return this.predictionsService.updateStatus(id, dto);
    }
    generate(raceId) {
        return this.predictionsService.generatePrediction(raceId);
    }
};
exports.PredictionsController = PredictionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '예측 목록 조회' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [prediction_dto_1.PredictionFilterDto]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: '예측 대시보드' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('accuracy-history'),
    (0, swagger_1.ApiOperation)({ summary: '예측 정확도 이력' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [prediction_dto_1.AccuracyHistoryFilterDto]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getAccuracyHistory", null);
__decorate([
    (0, common_1.Get)('stats/accuracy'),
    (0, swagger_1.ApiOperation)({ summary: '평균 정확도 통계' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getAccuracyStats", null);
__decorate([
    (0, common_1.Get)('analytics/dashboard'),
    (0, swagger_1.ApiOperation)({ summary: '분석 대시보드' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getAnalyticsDashboard", null);
__decorate([
    (0, common_1.Get)('stats/cost'),
    (0, swagger_1.ApiOperation)({ summary: 'AI 호출 비용 (누적)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getCost", null);
__decorate([
    (0, common_1.Get)('analytics/failures'),
    (0, swagger_1.ApiOperation)({ summary: '실패 원인 분석' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getAnalyticsFailures", null);
__decorate([
    (0, common_1.Get)('preview/:raceId'),
    (0, swagger_1.ApiOperation)({ summary: '예측 미리보기 (무료)' }),
    __param(0, (0, common_1.Param)('raceId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getPreview", null);
__decorate([
    (0, common_1.Get)('race/:raceId/preview'),
    (0, swagger_1.ApiOperation)({ summary: '예측 미리보기 (무료) — alias' }),
    __param(0, (0, common_1.Param)('raceId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getPreviewAlias", null);
__decorate([
    (0, common_1.Get)('race/:raceId/history'),
    (0, swagger_1.ApiOperation)({ summary: '경주별 예측 기록 목록' }),
    __param(0, (0, common_1.Param)('raceId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getByRaceHistory", null);
__decorate([
    (0, common_1.Get)('race/:raceId'),
    (0, swagger_1.ApiOperation)({ summary: '경주별 예측 조회 (최신 1건)' }),
    __param(0, (0, common_1.Param)('raceId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "getByRace", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '예측 상세 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '예측 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [prediction_dto_1.CreatePredictionDto]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('analytics/daily-stats'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '일일 통계 계산' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "calculateDailyStats", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '예측 상태 업데이트' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, prediction_dto_1.UpdatePredictionStatusDto]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('generate/:raceId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '예측 생성 (AI)' }),
    __param(0, (0, common_1.Param)('raceId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PredictionsController.prototype, "generate", null);
exports.PredictionsController = PredictionsController = __decorate([
    (0, swagger_1.ApiTags)('Predictions'),
    (0, common_1.Controller)('predictions'),
    __metadata("design:paramtypes", [predictions_service_1.PredictionsService])
], PredictionsController);
//# sourceMappingURL=predictions.controller.js.map