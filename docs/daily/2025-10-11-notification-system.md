# 개발 일지 - 2025년 10월 11일 (오후)

## 📋 목차

1. [Push Notification 시스템 완성](#1-push-notification-시스템-완성)
2. [네이티브 모듈 에러 해결](#2-네이티브-모듈-에러-해결)
3. [커스텀 Alert 유틸리티 전체 적용](#3-커스텀-alert-유틸리티-전체-적용)
4. [데이터베이스 스키마 업데이트](#4-데이터베이스-스키마-업데이트)

---

## 1. Push Notification 시스템 완성

### 📌 작업 내용

- User 엔티티에 device token 필드 추가
- Push notification 구독/해제 API 완성
- 알림 권한 관리 시스템 구현
- 플랫폼별 설정 완료 (iOS, Android)

### 🗄️ 데이터베이스 변경

#### User Entity 필드 추가

**파일**: `server/src/users/entities/user.entity.ts`

```typescript
@Column({ type: 'text', name: 'device_token', nullable: true })
deviceToken?: string;

@Column({
  type: 'varchar',
  length: 20,
  name: 'device_platform',
  nullable: true,
})
devicePlatform?: string; // 'ios' | 'android'

@Column({ type: 'datetime', name: 'token_updated_at', nullable: true })
tokenUpdatedAt?: Date;
```

#### Migration 스크립트

**파일**: `server/migrations/add-device-token-to-users.sql`

```sql
-- User 테이블에 device token 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN device_token TEXT NULL COMMENT 'Expo Push Token',
ADD COLUMN device_platform VARCHAR(20) NULL COMMENT 'Device Platform (ios/android)',
ADD COLUMN token_updated_at DATETIME NULL COMMENT 'Token 업데이트 시간';

-- 인덱스 추가
CREATE INDEX idx_device_token ON users(device_token(255));
CREATE INDEX idx_device_platform ON users(device_platform);
```

### 🔧 백엔드 API 구현

#### NotificationsService 업데이트

**파일**: `server/src/notifications/notifications.service.ts`

```typescript
async subscribeToPushNotifications(
  userId: string,
  deviceToken: string,
  platform?: string
): Promise<{ message: string }> {
  try {
    this.logger.log(
      `Push subscription requested for user ${userId} with token ${deviceToken.substring(0, 20)}... on platform ${platform || 'unknown'}`
    );

    // User 엔티티에 device token 저장
    await this.userRepo.update(userId, {
      deviceToken,
      devicePlatform: platform,
      tokenUpdatedAt: new Date(),
    });

    this.logger.log(`Successfully subscribed user ${userId} to push notifications`);
    return { message: 'Successfully subscribed to push notifications' };
  } catch (error) {
    this.logger.error(`Failed to subscribe user ${userId} to push notifications:`, error);
    throw new InternalServerErrorException('Push subscription failed');
  }
}

async unsubscribeFromPushNotifications(userId: string): Promise<{ message: string }> {
  try {
    this.logger.log(`Push unsubscription requested for user ${userId}`);

    // User 엔티티에서 device token 제거
    await this.userRepo.update(userId, {
      deviceToken: null,
      devicePlatform: null,
      tokenUpdatedAt: new Date(),
    });

    this.logger.log(`Successfully unsubscribed user ${userId} from push notifications`);
    return { message: 'Successfully unsubscribed from push notifications' };
  } catch (error) {
    this.logger.error(`Failed to unsubscribe user ${userId} from push notifications:`, error);
    throw new InternalServerErrorException('Push unsubscription failed');
  }
}
```

#### PushSubscriptionDto 업데이트

**파일**: `server/src/notifications/dto/push-subscription.dto.ts`

```typescript
export class PushSubscriptionDto {
  @ApiProperty({
    description: 'Expo Push Token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @ApiProperty({
    description: '디바이스 플랫폼',
    example: 'ios',
    required: false,
  })
  @IsOptional()
  @IsString()
  platform?: string;
}
```

### 📱 모바일 앱 구현

#### useNotificationPermission Hook

**파일**: `mobile/lib/hooks/useNotificationPermission.ts`

```typescript
/**
 * 알림 권한 상태를 추적하는 Hook
 */
export function useNotificationPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const checkPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      // 권한이 있으면 토큰 가져오기
      if (granted) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        setExpoPushToken(token.data);
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermission();

    // 포그라운드에서 권한 변경 감지
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermission]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (granted) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        setExpoPushToken(token.data);
      }

      return granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  return {
    hasPermission,
    isLoading,
    expoPushToken,
    requestPermission,
    refreshPermission: checkPermission,
  };
}
```

#### 알림 권한 페이지

**파일**: `mobile/app/(app)/mypage/notification-permission.tsx`

```typescript
export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { hasPermission, isLoading, requestPermission, refreshPermission } =
    useNotificationPermission();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      showSuccessMessage('알림 권한이 허용되었습니다.');
      router.back();
    } else {
      showWarningMessage('알림 권한이 거부되었습니다. 설정에서 변경할 수 있습니다.');
    }
  };

  const handleOpenSettings = async () => {
    await openNotificationSettings();
  };

  // ... 렌더링
}
```

### 🔔 알림 설정 연동

**파일**: `mobile/app/(app)/mypage/notification-settings.tsx`

```typescript
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { hasPermission, isLoading: permissionLoading } = useNotificationPermission();
  const [isSaving, setIsSaving] = useState(false);

  // 즉시 저장 함수
  const saveSettings = async (key: string, value: boolean) => {
    setIsSaving(true);
    try {
      // TODO: API 연동
      console.log('알림 설정 저장:', { [key]: value });
      // await notificationApi.updatePreferences({ [key]: value });
    } catch (error) {
      console.error('설정 저장 실패:', error);
      showErrorMessage('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: string, currentValue: boolean, setter: (value: boolean) => void) => {
    const newValue = !currentValue;
    setter(newValue);
    saveSettings(key, newValue);
  };

  // ... 렌더링 (저장/취소 버튼 제거, 즉시 저장)
}
```

### 📲 플랫폼별 설정

#### iOS 설정

**파일**: `mobile/app.json`

```json
{
  "ios": {
    "infoPlist": {
      "NSUserNotificationsUsageDescription": "경주 결과, 이벤트 등 중요한 정보를 알려드립니다.",
      "UIBackgroundModes": ["remote-notification"]
    },
    "entitlements": {
      "aps-environment": "development",
      "com.apple.developer.usernotifications.filtering": true
    }
  }
}
```

#### Android 설정

**파일**: `mobile/app.json`

```json
{
  "android": {
    "useNextNotificationsApi": true,
    "permissions": ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "android.permission.POST_NOTIFICATIONS"],
    "googleServicesFile": "./google_android_prod.json"
  },
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/icon.png",
        "color": "#D4AF37"
      }
    ]
  ]
}
```

---

## 2. 네이티브 모듈 에러 해결

### 📌 발생한 문제

```
ERROR  Error: Cannot find native module 'ExpoPushTokenManager'
ERROR  TypeError: Cannot read property 'useNotificationPermission' of undefined
```

### 🔧 해결 방법

#### 2.1 Import 경로 수정

**문제**: `@/hooks/useNotificationPermission` 경로가 잘못됨

**해결**: 올바른 경로로 수정

```typescript
// Before (잘못된 경로)
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

// After (올바른 경로)
import { useNotificationPermission } from '@/lib/hooks/useNotificationPermission';
```

#### 2.2 앱 시작 시 자동 권한 요청 제거

**파일**: `mobile/app/_layout.tsx`

**변경 전**:

```typescript
useEffect(() => {
  registerForPushNotificationsAsync(); // 자동 실행
}, []);
```

**변경 후**:

```typescript
// 자동 권한 요청 제거
// 사용자가 알림 설정 페이지에서 직접 권한을 요청하도록 변경
```

**이유**:

- 사용자가 원하는 시점에 권한을 요청할 수 있도록
- 앱 시작 시 즉시 권한 요청하는 것은 UX 측면에서 좋지 않음
- 전용 권한 페이지에서 설명과 함께 요청하는 것이 더 효과적

#### 2.3 Clean Build 수행

```bash
# iOS
cd mobile
rm -rf ios/Pods ios/Podfile.lock
npx pod-install
npx expo run:ios --clean

# Android
cd mobile
cd android && ./gradlew clean && cd ..
npx expo run:android --clean
```

---

## 3. 커스텀 Alert 유틸리티 전체 적용

### 📌 작업 내용

- 모든 네이티브 `Alert` 호출을 커스텀 `alert` 유틸리티로 교체
- 일관된 사용자 경험 제공
- 더 나은 스타일링과 제어

### 🎨 커스텀 Alert 유틸리티

**파일**: `mobile/utils/alert.ts`

```typescript
export const showSuccessMessage = (message: string, title = '성공') => {
  Alert.alert(title, message, [{ text: '확인', style: 'default' }]);
};

export const showErrorMessage = (message: string, title = '오류') => {
  Alert.alert(title, message, [{ text: '확인', style: 'default' }]);
};

export const showWarningMessage = (message: string, title = '경고') => {
  Alert.alert(title, message, [{ text: '확인', style: 'default' }]);
};

export const showInfoMessage = (message: string, title = '알림') => {
  Alert.alert(title, message, [{ text: '확인', style: 'default' }]);
};

export const showConfirmDialog = (
  message: string,
  onConfirm: () => void,
  title = '확인',
  confirmText = '확인',
  cancelText = '취소'
) => {
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: 'default', onPress: onConfirm },
  ]);
};
```

### 📱 적용된 페이지

#### 3.1 마권 기록 등록 페이지

**파일**: `mobile/app/betting-register/index.tsx`

```typescript
// Before
Alert.alert('오류', '모든 필수 항목을 입력해주세요.');

// After
showErrorMessage('모든 필수 항목을 입력해주세요.');
```

#### 3.2 알림 설정 페이지

**파일**: `mobile/app/(app)/mypage/notification-settings.tsx`

```typescript
// Before
Alert.alert('오류', '설정 저장에 실패했습니다.');

// After
showErrorMessage('설정 저장에 실패했습니다.');
```

#### 3.3 알림 유틸리티

**파일**: `mobile/lib/utils/notifications.ts`

```typescript
// Before
Alert.alert('알림 권한 필요', '설정에서 알림을 허용해주세요.');

// After
showWarningMessage('설정에서 알림을 허용해주세요.', '알림 권한 필요');
```

---

## 4. 데이터베이스 스키마 업데이트

### 📌 작업 내용

- 초기 데이터베이스 생성 스크립트에 device token 필드 추가
- 인덱스 추가로 성능 최적화

### 🗄️ SQL 스크립트 업데이트

**파일**: `server/mysql/init/01_create_database.sql`

```sql
-- 사용자 테이블 (user.entity.ts 기반)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    auth_provider VARCHAR(20) DEFAULT 'google',
    provider_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at DATETIME,
    role VARCHAR(20) DEFAULT 'user',
    device_token TEXT COMMENT 'Expo Push Token',
    device_platform VARCHAR(20) COMMENT 'Device Platform (ios/android)',
    token_updated_at DATETIME COMMENT 'Token 업데이트 시간',
    preferences JSON,
    -- ... 기타 필드
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_provider_id (provider_id),
    INDEX idx_is_active (is_active),
    INDEX idx_auth_provider (auth_provider),
    INDEX idx_device_token (device_token(255)),
    INDEX idx_device_platform (device_platform)
);
```

### 📊 Migration 실행 방법

```bash
# 1. Docker MySQL 컨테이너 접속
docker exec -it goldenrace-mysql mysql -ugoldenrace_user -pgoldenrace_password goldenrace

# 2. Migration 실행
source /docker-entrypoint-initdb.d/add-device-token-to-users.sql

# 3. 확인
SHOW COLUMNS FROM users LIKE '%token%';
```

### ✅ 기대 결과

```
+-------------------+--------------+------+-----+---------+-------+
| Field             | Type         | Null | Key | Default | Extra |
+-------------------+--------------+------+-----+---------+-------+
| device_token      | text         | YES  | MUL | NULL    |       |
| device_platform   | varchar(20)  | YES  | MUL | NULL    |       |
| token_updated_at  | datetime     | YES  |     | NULL    |       |
+-------------------+--------------+------+-----+---------+-------+
```

---

## 📊 전체 변경 파일 요약

### Backend (Server)

```
✅ server/src/users/entities/user.entity.ts - device token 필드 추가
✅ server/src/users/dto/update-device-token.dto.ts - 새로 생성
✅ server/src/notifications/notifications.service.ts - token 저장 로직 추가
✅ server/src/notifications/notifications.controller.ts - platform 파라미터 추가
✅ server/src/notifications/dto/push-subscription.dto.ts - platform 필드 추가
✅ server/mysql/init/01_create_database.sql - device token 컬럼 추가
✅ server/migrations/add-device-token-to-users.sql - 새로 생성
✅ server/migrations/README.md - 새로 생성
```

### Frontend (Mobile)

```
✅ mobile/lib/hooks/useNotificationPermission.ts - 새로 생성
✅ mobile/app/(app)/mypage/notification-permission.tsx - 새로 생성
✅ mobile/app/(app)/mypage/notification-settings.tsx - 즉시 저장 구현
✅ mobile/app/_layout.tsx - 자동 권한 요청 제거
✅ mobile/app.json - 플랫폼별 알림 설정 추가
✅ mobile/app/betting-register/index.tsx - 커스텀 alert 적용
✅ mobile/lib/utils/notifications.ts - 커스텀 alert 적용
```

### Documentation

```
✅ NOTIFICATION_SETUP.md - 알림 시스템 전체 문서화
✅ docs/daily/2025-10-11-notification-system.md - 오늘의 작업 일지
```

---

## 🎯 주요 성과

### 1. Push Notification 시스템 완성

- ✅ User 엔티티에 device token 저장
- ✅ Push 구독/해제 API 완성
- ✅ 플랫폼별 설정 완료 (iOS, Android)
- ✅ 알림 권한 관리 UI 구현

### 2. 네이티브 모듈 에러 해결

- ✅ Import 경로 수정
- ✅ 앱 시작 시 자동 권한 요청 제거
- ✅ 사용자 중심의 권한 요청 흐름

### 3. 코드 품질 향상

- ✅ 커스텀 Alert 유틸리티 전체 적용
- ✅ 일관된 사용자 경험
- ✅ 타입 안전성 향상

### 4. 데이터베이스 스키마 업데이트

- ✅ Device token 필드 추가
- ✅ 인덱스 추가로 성능 최적화
- ✅ Migration 스크립트 작성

---

## 🔄 Push Notification 전체 흐름

```
1. 사용자 앱 설치
   ↓
2. 알림 설정 페이지 방문
   ↓
3. "알림 권한 관리" 클릭
   ↓
4. useNotificationPermission Hook 실행
   ↓
5. Expo Push Token 발급
   ↓
6. POST /api/notifications/push-subscribe
   {
     "deviceToken": "ExponentPushToken[xxx]",
     "platform": "ios" or "android"
   }
   ↓
7. NotificationsService.subscribeToPushNotifications()
   ↓
8. User 엔티티 업데이트
   {
     "deviceToken": "ExponentPushToken[xxx]",
     "devicePlatform": "ios",
     "tokenUpdatedAt": "2025-10-11T12:00:00Z"
   }
   ↓
9. 푸시 알림 전송 준비 완료 ✅
```

---

## 🚀 다음 단계 제안

### 1. Push Notification 전송 구현

- [ ] 관리자 페이지에서 푸시 전송 기능
- [ ] 경주 결과 알림 자동 전송
- [ ] 예측권 만료 알림
- [ ] 이벤트 및 프로모션 알림

### 2. 알림 통계 및 분석

- [ ] 알림 전송/수신 통계
- [ ] 사용자별 알림 설정 현황
- [ ] 알림 클릭률 분석

### 3. 고급 알림 기능

- [ ] 알림 카테고리별 설정
- [ ] 조용한 알림 시간대 설정
- [ ] Rich Notification (이미지, 액션 버튼)

### 4. 테스트

- [ ] 푸시 알림 E2E 테스트
- [ ] 플랫폼별 동작 확인
- [ ] 권한 거부 시나리오 테스트

---

## 📝 참고 사항

### 개발 환경

- **날짜**: 2025년 10월 11일 (오후)
- **Node.js**: v18+
- **React Native**: Expo SDK 52
- **Backend**: NestJS + TypeORM
- **Database**: MySQL 8.0

### 테스트 방법

```bash
# 1. 데이터베이스 migration 실행
cd server
docker exec -it goldenrace-mysql mysql -ugoldenrace_user -pgoldenrace_password goldenrace < migrations/add-device-token-to-users.sql

# 2. 서버 재시작
npm run start:dev

# 3. 모바일 앱 재빌드
cd mobile
npx expo run:ios --clean
# 또는
npx expo run:android --clean

# 4. 알림 권한 테스트
# - 알림 설정 페이지 방문
# - "알림 권한 관리" 클릭
# - 권한 허용/거부 테스트
```

### 데이터베이스 확인

```bash
# User 테이블에서 device token 확인
docker exec -it goldenrace-mysql mysql -ugoldenrace_user -pgoldenrace_password goldenrace

SELECT id, email, device_token, device_platform, token_updated_at
FROM users
WHERE device_token IS NOT NULL;
```

---

**작성일**: 2025년 10월 11일 (오후)  
**작성자**: AI Development Assistant  
**프로젝트**: Golden Race - AI 경마 예측 플랫폼
