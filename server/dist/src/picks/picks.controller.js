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
exports.PicksController = void 0;
const common_1 = require("@nestjs/common");
const picks_service_1 = require("./picks.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const pick_dto_1 = require("./dto/pick.dto");
let PicksController = class PicksController {
    constructor(picksService) {
        this.picksService = picksService;
    }
    create(user, dto) {
        return this.picksService.create(user.sub, dto);
    }
    findByUser(user, page, limit) {
        return this.picksService.findByUser(user.sub, page, limit);
    }
    findByRace(raceId, user) {
        return this.picksService.findByRace(raceId, user.sub);
    }
    delete(raceId, user) {
        return this.picksService.delete(user.sub, raceId);
    }
};
exports.PicksController = PicksController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '내가 고른 말 저장' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, pick_dto_1.CreatePickDto]),
    __metadata("design:returntype", void 0)
], PicksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '내가 고른 말 목록' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [current_user_decorator_1.JwtPayload, Number, Number]),
    __metadata("design:returntype", void 0)
], PicksController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('race/:raceId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '해당 경주에 대한 내 선택' }),
    __param(0, (0, common_1.Param)('raceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, current_user_decorator_1.JwtPayload]),
    __metadata("design:returntype", void 0)
], PicksController.prototype, "findByRace", null);
__decorate([
    (0, common_1.Delete)('race/:raceId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '선택 삭제' }),
    __param(0, (0, common_1.Param)('raceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, current_user_decorator_1.JwtPayload]),
    __metadata("design:returntype", void 0)
], PicksController.prototype, "delete", null);
exports.PicksController = PicksController = __decorate([
    (0, swagger_1.ApiTags)('Picks'),
    (0, common_1.Controller)('picks'),
    __metadata("design:paramtypes", [picks_service_1.PicksService])
], PicksController);
//# sourceMappingURL=picks.controller.js.map