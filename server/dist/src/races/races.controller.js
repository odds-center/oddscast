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
exports.RacesController = void 0;
const common_1 = require("@nestjs/common");
const races_service_1 = require("./races.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const race_dto_1 = require("./dto/race.dto");
let RacesController = class RacesController {
    constructor(racesService) {
        this.racesService = racesService;
    }
    findAll(filters) {
        return this.racesService.findAll(filters);
    }
    getTodayRaces() {
        return this.racesService.getTodayRaces();
    }
    getRacesByDate(date) {
        return this.racesService.getRacesByDate(date);
    }
    getSchedule(dateFrom, dateTo, meet) {
        return this.racesService.getSchedule({ dateFrom, dateTo, meet });
    }
    search(q, meet, grade, distance, status, page, limit) {
        return this.racesService.findAll({
            meet,
            grade,
            distance,
            status,
            page,
            limit,
        });
    }
    getCalendar(year, month) {
        const dateFrom = year && month ? `${year}${String(month).padStart(2, '0')}01` : undefined;
        const dateTo = year && month ? `${year}${String(month).padStart(2, '0')}31` : undefined;
        return this.racesService.getSchedule({ dateFrom, dateTo });
    }
    getStatistics(meet, _date, _month, _year) {
        return this.racesService.findAll({ meet });
    }
    findOne(id) {
        return this.racesService.findOne(id);
    }
    create(dto) {
        return this.racesService.create(dto);
    }
    update(id, dto) {
        return this.racesService.update(id, dto);
    }
    remove(id) {
        return this.racesService.remove(id);
    }
    getRaceResults(id) {
        return this.racesService.getRaceResult(id);
    }
    getRaceResult(id) {
        return this.racesService.getRaceResult(id);
    }
    getEntries(id) {
        return this.racesService.findOne(id);
    }
    getDividends(id) {
        return this.racesService.findOne(id);
    }
    getAnalysis(id) {
        return this.racesService.getAnalysis(id);
    }
    createEntry(raceId, dto) {
        return this.racesService.createEntry(raceId, dto);
    }
    createBulkEntries(raceId, body) {
        return this.racesService.createBulkEntries(raceId, body.entries);
    }
};
exports.RacesController = RacesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '경주 목록 조회' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [race_dto_1.RaceFilterDto]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, swagger_1.ApiOperation)({ summary: '오늘 경주 목록' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getTodayRaces", null);
__decorate([
    (0, common_1.Get)('by-date/:date'),
    (0, swagger_1.ApiOperation)({ summary: '날짜별 경기 목록 (YYYYMMDD 또는 YYYY-MM-DD)' }),
    __param(0, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getRacesByDate", null);
__decorate([
    (0, common_1.Get)('schedule'),
    (0, swagger_1.ApiOperation)({ summary: '경주 일정 조회' }),
    __param(0, (0, common_1.Query)('dateFrom')),
    __param(1, (0, common_1.Query)('dateTo')),
    __param(2, (0, common_1.Query)('meet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: '경주 검색' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('meet')),
    __param(2, (0, common_1.Query)('grade')),
    __param(3, (0, common_1.Query)('distance')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('calendar'),
    (0, swagger_1.ApiOperation)({ summary: '경주 달력' }),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getCalendar", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: '경주 통계' }),
    __param(0, (0, common_1.Query)('meet')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '경주 상세 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '경주 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [race_dto_1.CreateRaceDto]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '경주 수정' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, race_dto_1.UpdateRaceDto]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '경주 삭제' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/results'),
    (0, swagger_1.ApiOperation)({ summary: '경주 결과 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getRaceResults", null);
__decorate([
    (0, common_1.Get)(':id/result'),
    (0, swagger_1.ApiOperation)({ summary: '경주 결과 조회 (singular alias)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getRaceResult", null);
__decorate([
    (0, common_1.Get)(':id/entries'),
    (0, swagger_1.ApiOperation)({ summary: '출전마 목록 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getEntries", null);
__decorate([
    (0, common_1.Get)(':id/dividends'),
    (0, swagger_1.ApiOperation)({ summary: '배당률 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getDividends", null);
__decorate([
    (0, common_1.Get)(':id/analysis'),
    (0, swagger_1.ApiOperation)({ summary: '경주 AI 분석 조회' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "getAnalysis", null);
__decorate([
    (0, common_1.Post)(':id/entries'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '출전마 등록' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, race_dto_1.CreateRaceEntryDto]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "createEntry", null);
__decorate([
    (0, common_1.Post)(':id/entries/bulk'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '출전마 일괄 등록' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RacesController.prototype, "createBulkEntries", null);
exports.RacesController = RacesController = __decorate([
    (0, swagger_1.ApiTags)('Races'),
    (0, common_1.Controller)('races'),
    __metadata("design:paramtypes", [races_service_1.RacesService])
], RacesController);
//# sourceMappingURL=races.controller.js.map