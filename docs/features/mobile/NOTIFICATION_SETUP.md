# 알림 시스템 설정 가이드

## ✅ 완료된 작업

### 1. 데이터베이스 스키마

**User 테이블에 추가된 컬럼:**

```sql
device_token      TEXT         -- Expo Push Token
device_platform   VARCHAR(20)  -- 'ios' or 'android'
token_updated_at  DATETIME     -- 토큰 업데이트 시간

-- 인덱스
idx_users_device_token
idx_users_device_platform
```

✅ **마이그레이션 실행 완료**

### 2. Server API

**엔드포인트:**

```
POST /api/notifications/push-subscribe
Body: {
  "deviceToken": "ExponentPushToken[xxx]",
  "platform": "ios" | "android"
}
```

**동작:**

1. 사용자 인증 (JWT)
2. User 테이블에 deviceToken 저장
3. platform, tokenUpdatedAt 저장
4. 성공 응답 반환

**구독 해제:**

```
POST /api/notifications/push-unsubscribe
Body: { "deviceToken": "..." }
```

### 3. Mobile App 설정

#### app.json

```json
{
  "ios": {
    "infoPlist": {
      "NSUserNotificationsUsageDescription": "앱 서비스 알림을 받으려면 권한이 필요합니다.",
      "UIBackgroundModes": ["remote-notification"],
      "aps-environment": "development"
    },
    "notification": {
      "iosDisplayInForeground": true,
      "foregroundPresentation": {
        "badge": true,
        "sound": true,
        "banner": true,
        "list": true
      }
    }
  },
  "android": {
    "useNextNotificationsApi": true,
    "permissions": [
      "NOTIFICATIONS",
      "POST_NOTIFICATIONS", // Android 13+
      "RECEIVE_BOOT_COMPLETED", // 재부팅 후 알림
      "VIBRATE" // 진동
    ],
    "notification": {
      "androidShowInForeground": true,
      "priority": "high"
    }
  }
}
```

#### 제거된 불필요한 권한

- ❌ NSPhotoLibraryUsageDescription
- ❌ NSPhotoLibraryAddUsageDescription
- ❌ NSCameraUsageDescription
- ❌ NSMicrophoneUsageDescription
- ❌ READ_EXTERNAL_STORAGE
- ❌ WRITE_EXTERNAL_STORAGE
- ❌ expo-media-library plugin

### 4. 알림 플로우

```
사용자 → 알림 설정 페이지
  ↓
권한 상태 배너 클릭
  ↓
알림 권한 페이지
  ↓
"알림 권한 허용하기" 버튼 클릭
  ↓
시스템 권한 다이얼로그
  ↓
허용 → Expo Push Token 발급
  ↓
서버에 Token 전송
  ↓
User 테이블에 저장
  ↓
완료!
```

## 📱 알림 채널 (Android)

| 채널 ID      | 이름      | 우선순위 | 용도           |
| ------------ | --------- | -------- | -------------- |
| default      | 기본 알림 | MAX      | 일반 알림      |
| race_results | 경주 결과 | HIGH     | 경주 결과 정보 |
| bet_wins     | 기록 적중 | MAX      | 중요 알림      |
| favorites    | 즐겨찾기  | DEFAULT  | 즐겨찾기 정보  |
| promotions   | 프로모션  | LOW      | 이벤트 알림    |

## 🍎 알림 카테고리 (iOS)

| 카테고리 ID   | 액션 버튼       |
| ------------- | --------------- |
| race_result   | 결과 보기, 닫기 |
| bet_win       | 기록 보기, 공유 |
| favorite_race | 경주 보기       |

## 🔧 사용 방법

### 1. 권한 요청

```typescript
import { useNotificationPermission } from '@/lib/hooks/useNotificationPermission';

const { hasPermission, requestPermission } = useNotificationPermission();

// 권한 요청
await requestPermission();
```

### 2. 로컬 알림 테스트

```typescript
import { showImmediateNotification } from '@/lib/utils/notifications';

await showImmediateNotification('경주 종료', '1경주가 종료되었습니다.', { screen: '/records' });
```

### 3. 서버에서 푸시 발송

```typescript
// 특정 사용자에게 알림 발송
const user = await userRepo.findOne({ where: { id: userId } });
if (user?.deviceToken) {
  // Expo Push API로 전송
  await sendExpoPushNotification({
    to: user.deviceToken,
    title: '경주 종료',
    body: '1경주가 종료되었습니다.',
    data: { screen: '/records' },
  });
}

// 여러 사용자에게 알림 발송
const users = await userRepo.find({
  where: { deviceToken: Not(IsNull()) },
});
const tokens = users.map((u) => u.deviceToken);
```

## 🚨 주의사항

### 1. 네이티브 모듈 에러 해결

만약 `Cannot find native module 'ExpoPushTokenManager'` 에러 발생 시:

```bash
# 개발 클라이언트 재빌드 필요
cd mobile
npx expo prebuild --clean
npx expo run:ios
# 또는
npx expo run:android
```

### 2. 권한 요청 타이밍

- ✅ 사용자가 직접 권한 페이지에서 요청
- ❌ 앱 시작 시 자동 요청 (제거됨)

### 3. Token 갱신

- 앱 재설치 시 Token 변경됨
- 주기적으로 Token 갱신 필요
- useNotificationPermission 훅이 자동 처리

### 4. 테스트

**로컬 알림 (권한만 있으면 가능):**

```typescript
import { scheduleLocalNotification } from '@/lib/utils/notifications';

await scheduleLocalNotification('테스트 알림', '3초 후 알림이 표시됩니다', { test: true }, 3);
```

**푸시 알림 (서버 설정 필요):**

- Expo Push Notifications API 사용
- https://expo.dev/notifications
- 또는 Firebase Cloud Messaging

## 📊 데이터베이스 쿼리

### 알림 활성화된 사용자 조회

```sql
SELECT id, name, email, device_platform, token_updated_at
FROM users
WHERE device_token IS NOT NULL
  AND is_active = 1;
```

### 플랫폼별 사용자 수

```sql
SELECT
  device_platform,
  COUNT(*) as user_count
FROM users
WHERE device_token IS NOT NULL
GROUP BY device_platform;
```

### 최근 토큰 업데이트

```sql
SELECT id, name, device_platform, token_updated_at
FROM users
WHERE device_token IS NOT NULL
ORDER BY token_updated_at DESC
LIMIT 10;
```

## 🎯 다음 단계

### 필수

- [ ] Expo Push Notifications API 키 발급
- [ ] 서버에 푸시 발송 로직 구현
- [ ] 알림 템플릿 정의
- [ ] 알림 발송 큐 시스템 (선택)

### 선택

- [ ] Firebase Cloud Messaging 연동
- [ ] Apple Push Notification 인증서
- [ ] 알림 발송 스케줄러
- [ ] 알림 통계 대시보드

## 🔗 참고 링크

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)

---

**작성일:** 2025-10-11  
**버전:** 1.0.0
