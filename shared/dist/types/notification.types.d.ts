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
export type NotificationPreferenceKey = 'pushEnabled' | 'raceEnabled' | 'predictionEnabled' | 'subscriptionEnabled' | 'systemEnabled' | 'promotionEnabled';
export interface NotificationPreferenceFlags {
    pushEnabled: boolean;
    raceEnabled: boolean;
    predictionEnabled: boolean;
    subscriptionEnabled: boolean;
    systemEnabled: boolean;
    promotionEnabled: boolean;
}
export declare const NOTIFICATION_PREFERENCE_DEFAULTS: NotificationPreferenceFlags;
/** 노출 플랫폼: 'web' = webapp 브라우저, 'mobile' = native WebView */
export type NotificationPreferencePlatform = 'web' | 'mobile';
//# sourceMappingURL=notification.types.d.ts.map