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
exports.UpdateNotificationPreferenceDto = exports.PushUnsubscribeDto = exports.PushSubscribeDto = exports.BulkSendDto = exports.UpdateNotificationDto = exports.CreateNotificationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateNotificationDto {
}
exports.CreateNotificationDto = CreateNotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateNotificationDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['SYSTEM', 'RACE', 'PREDICTION', 'PROMOTION', 'SUBSCRIPTION'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['GENERAL', 'URGENT', 'INFO', 'MARKETING'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateNotificationDto.prototype, "data", void 0);
class UpdateNotificationDto {
}
exports.UpdateNotificationDto = UpdateNotificationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateNotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateNotificationDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationDto.prototype, "isRead", void 0);
class BulkSendDto {
}
exports.BulkSendDto = BulkSendDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkSendDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Number] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], BulkSendDto.prototype, "recipients", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], BulkSendDto.prototype, "variables", void 0);
class PushSubscribeDto {
}
exports.PushSubscribeDto = PushSubscribeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Expo Push Token (ExponentPushToken[xxx])' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushSubscribeDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '기기 식별자 (중복 등록 방지)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushSubscribeDto.prototype, "deviceId", void 0);
class PushUnsubscribeDto {
}
exports.PushUnsubscribeDto = PushUnsubscribeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Expo Push Token' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PushUnsubscribeDto.prototype, "token", void 0);
class UpdateNotificationPreferenceDto {
}
exports.UpdateNotificationPreferenceDto = UpdateNotificationPreferenceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '푸시 알림' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferenceDto.prototype, "pushEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '경주 알림 (시작/결과)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferenceDto.prototype, "raceEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'AI 예측 관련 알림' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferenceDto.prototype, "predictionEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '구독 관련 알림' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferenceDto.prototype, "subscriptionEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '시스템 공지' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferenceDto.prototype, "systemEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '프로모션/마케팅' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferenceDto.prototype, "promotionEnabled", void 0);
//# sourceMappingURL=notification.dto.js.map