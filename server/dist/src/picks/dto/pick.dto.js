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
exports.CreatePickDto = exports.PICK_TYPE_HORSE_COUNTS = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
exports.PICK_TYPE_HORSE_COUNTS = {
    SINGLE: 1,
    PLACE: 1,
    QUINELLA: 2,
    EXACTA: 2,
    QUINELLA_PLACE: 2,
    TRIFECTA: 3,
    TRIPLE: 3,
};
class CreatePickDto {
}
exports.CreatePickDto = CreatePickDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '경주 ID' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePickDto.prototype, "raceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [
            'SINGLE',
            'PLACE',
            'QUINELLA',
            'EXACTA',
            'QUINELLA_PLACE',
            'TRIFECTA',
            'TRIPLE',
        ],
    }),
    (0, class_validator_1.IsEnum)([
        'SINGLE',
        'PLACE',
        'QUINELLA',
        'EXACTA',
        'QUINELLA_PLACE',
        'TRIFECTA',
        'TRIPLE',
    ]),
    __metadata("design:type", String)
], CreatePickDto.prototype, "pickType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '고른 마번 배열', example: ['1', '5'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePickDto.prototype, "hrNos", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '마명 배열 (표시용)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePickDto.prototype, "hrNames", void 0);
//# sourceMappingURL=pick.dto.js.map