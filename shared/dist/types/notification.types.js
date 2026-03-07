"use strict";
/**
 * 알림 설정 공통 타입
 * 서버·webapp·mobile에서 동일한 플래그 구조 사용
 *
 * 채널(수신 방법): push
 * 유형(알림 종류): race, prediction, subscription, system, promotion
 *
 * 플랫폼별 노출:
 * - pushEnabled: mobile(native) 전용 (푸시는 네이티브 앱만 지원)
 * - 그 외: webapp, mobile 공통
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_PREFERENCE_DEFAULTS = void 0;
exports.NOTIFICATION_PREFERENCE_DEFAULTS = {
    pushEnabled: true,
    raceEnabled: true,
    predictionEnabled: true,
    subscriptionEnabled: true,
    systemEnabled: true,
    promotionEnabled: false,
};
