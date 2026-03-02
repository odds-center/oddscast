# 알림 설정 (Notification Preferences)

## 개요

사용자별 알림 수신 설정을 플래그(boolean) 형태로 관리합니다. **이메일 알림 없음** — 푸시만 채널로 사용.

## 플랫폼별 동작

| 플래그 | Web (브라우저) | Mobile (WebView) |
|-------|----------------|------------------|
| `pushEnabled` | ❌ 미노출 | ✅ 노출·토글 가능 |
| `raceEnabled` | ✅ | ✅ |
| `predictionEnabled` | ✅ | ✅ |
| `subscriptionEnabled` | ✅ | ✅ |
| `systemEnabled` | ✅ | ✅ |
| `promotionEnabled` | ✅ | ✅ |

- **푸시 알림**: 네이티브 앱(mobile)에서만 on/off 가능. Web에서는 "푸시 알림은 모바일 앱에서만 설정할 수 있습니다" 안내 표시.
- **플랫폼 감지**: Mobile WebView가 `window.__IS_NATIVE_APP__ = true`를 주입하여 webapp이 native 환경을 인식.

## 플래그 구조

```
채널(수신 방법)
└── pushEnabled   — 푸시 (mobile 전용)

유형(알림 종류)
├── raceEnabled       — 경주 시작·결과
├── predictionEnabled — AI 예측·예측권
├── subscriptionEnabled — 구독 결제·만료
├── systemEnabled     — 시스템 공지
└── promotionEnabled  — 프로모션·마케팅
```

## API

- `GET /api/notifications/preferences` — 조회 (없으면 기본값 생성)
- `PUT /api/notifications/preferences` — 수정 (부분 업데이트)

## 공통 타입

`shared/types/notification.types.ts`에 `NotificationPreferenceFlags`, `NOTIFICATION_PREFERENCE_DEFAULTS` 정의.

## 관련 파일

| 구분 | 경로 |
|------|------|
| Server | `server/src/notifications/` (controller, service, dto) |
| DB/엔티티 | `server/src/database/entities/` — UserNotificationPref (TypeORM) |
| WebApp | `webapp/pages/settings/notifications.tsx`, `lib/hooks/useIsNativeApp.ts`, `components/ui/Toggle.tsx` |
| Mobile | `mobile/app/webview.tsx` — injectedJavaScriptBeforeContentLoaded |
