# 개발 일지 - 2025년 10월 11일

## 📋 목차

1. [데이터베이스 스키마 통일](#1-데이터베이스-스키마-통일)
2. [구독 플랜 시스템 구축](#2-구독-플랜-시스템-구축)
3. [인증 가드 시스템 구현](#3-인증-가드-시스템-구현)
4. [UI/UX 최적화](#4-uiux-최적화)

---

## 1. 데이터베이스 스키마 통일

### 📌 작업 내용

- **문제**: SQL 컬럼명이 카멜케이스로 되어 있어 일관성 부족
- **해결**: 모든 컬럼명을 스네이크케이스로 통일

### 🔧 주요 변경사항

#### 1.1 SQL 스키마 수정

**파일**: `server/mysql/init/02_subscription_plans.sql`

```sql
-- Before (카멜케이스)
`planId`, `ticketsPerMonth`, `pricePerTicket`, `discountPercentage`
`isActive`, `isRecommended`, `createdAt`, `updatedAt`

-- After (스네이크케이스)
`plan_id`, `tickets_per_month`, `price_per_ticket`, `discount_percentage`
`is_active`, `is_recommended`, `created_at`, `updated_at`
```

#### 1.2 TypeORM Entity 매핑

**파일**: `server/src/subscriptions/entities/subscription-plan.entity.ts`

```typescript
@PrimaryColumn({ type: 'varchar', length: 20, name: 'plan_id' })
planId: string;

@Column({ type: 'int', name: 'tickets_per_month' })
ticketsPerMonth: number;

@Column({ type: 'decimal', precision: 8, scale: 2, name: 'price_per_ticket' })
pricePerTicket: number;

@Column({ type: 'int', default: 0, name: 'discount_percentage' })
discountPercentage: number;

@Column({ type: 'boolean', default: true, name: 'is_active' })
isActive: boolean;

@Column({ type: 'boolean', default: false, name: 'is_recommended' })
isRecommended: boolean;

@CreateDateColumn({ name: 'created_at' })
createdAt: Date;

@UpdateDateColumn({ name: 'updated_at' })
updatedAt: Date;
```

#### 1.3 User Entity 수정

**파일**: `server/src/users/entities/user.entity.ts`

```typescript
// 수정: last_login → last_login_at
@Column({ type: 'datetime', name: 'last_login_at', nullable: true })
lastLogin?: Date;
```

### 🗄️ MySQL UTF-8 설정 완료

#### Docker Compose 설정

**파일**: `server/docker-compose.mysql-only.yml`

```yaml
command: --default-authentication-plugin=mysql_native_password
  --character-set-server=utf8mb4
  --collation-server=utf8mb4_unicode_ci
  --init-connect='SET NAMES utf8mb4'
  --skip-character-set-client-handshake
```

#### 결과 확인

```bash
character_set_client      utf8mb4 ✅
character_set_connection  utf8mb4 ✅
character_set_database    utf8mb4 ✅
character_set_results     utf8mb4 ✅
character_set_server      utf8mb4 ✅

collation_connection  utf8mb4_unicode_ci ✅
collation_database    utf8mb4_unicode_ci ✅
collation_server      utf8mb4_unicode_ci ✅
```

### 📝 데이터베이스 초기화 스크립트

**추가된 npm 스크립트**: `server/package.json`

```json
{
  "docker:mysql": "docker-compose -f docker-compose.mysql-only.yml up -d",
  "docker:mysql:stop": "docker-compose -f docker-compose.mysql-only.yml down",
  "init:plans": "ts-node -r tsconfig-paths/register scripts/init-subscription-plans.ts"
}
```

---

## 2. 구독 플랜 시스템 구축

### 📌 작업 내용

- 2개의 구독 플랜 (Light, Premium) 구현
- 데이터베이스 초기화 및 시드 데이터 삽입
- 프리미엄 플랜 보너스 티켓 추가

### 💎 구독 플랜 상세

#### Light 플랜

- **가격**: 9,900원/월
- **예측권**: 월 15장
- **장당 가격**: 660원 (34% 할인)
- **절약액**: 개별 구매 대비 월 5,100원

#### Premium 플랜 (추천)

- **가격**: 19,800원/월
- **예측권**: 월 35장 (보너스 5장 포함)
- **장당 가격**: 566원 (43% 할인)
- **절약액**: 개별 구매 대비 월 15,200원

### 🗃️ 데이터베이스 테이블 생성

**파일**: `server/mysql/init/02_subscription_plans.sql`

```sql
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `plan_id` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `tickets_per_month` int NOT NULL,
  `price_per_ticket` decimal(8,2) NOT NULL,
  `discount_percentage` int DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `is_recommended` tinyint(1) DEFAULT 0,
  `features` json,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 📊 초기 데이터 삽입

```sql
-- Light 플랜
INSERT INTO `subscription_plans` VALUES (
  'LIGHT',
  '라이트 구독',
  '가벼운 사용을 위한 기본 플랜',
  9900.00,
  15,
  660.00,
  34,
  1,
  0,
  JSON_ARRAY('월 15장 AI 예측권', '장당 660원 (34% 할인)', '평균 70%+ 정확도 목표', '자동 갱신')
);

-- Premium 플랜
INSERT INTO `subscription_plans` VALUES (
  'PREMIUM',
  '프리미엄 구독',
  '전체 기능을 사용할 수 있는 최고 플랜',
  19800.00,
  35,
  566.00,
  43,
  1,
  1,
  JSON_ARRAY('월 35장 AI 예측권', '장당 566원 (43% 할인)', '평균 70%+ 정확도 목표', '자동 갱신')
);
```

### 🔧 Entity 및 Module 구성

**새로 생성된 파일**:

- `server/src/subscriptions/entities/subscription-plan.entity.ts`
- `server/scripts/init-subscription-plans.ts`

**수정된 파일**:

- `server/src/subscriptions/subscriptions.module.ts`
- `server/src/app.module.ts`
- `server/src/subscriptions/entities/subscription.entity.ts` (LIGHT enum 추가)

---

## 3. 인증 가드 시스템 구현

### 📌 작업 내용

- 토큰이 없거나 유효하지 않을 때 자동으로 로그인 페이지로 리다이렉트
- 401 Unauthorized 에러 자동 처리
- React Native 호환 EventEmitter 구현

### 🛡️ 구현 컴포넌트

#### 3.1 AuthGuard 컴포넌트

**파일**: `mobile/components/common/AuthGuard.tsx`

```typescript
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // 로그인하지 않았고, 인증 그룹이 아닌 경우 로그인 페이지로
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // 이미 로그인했는데 인증 페이지에 있는 경우 홈으로
      router.replace('/(app)/home');
    }
  }, [user, isLoading, segments, router]);

  // 로딩 중에는 로딩 인디케이터 표시
  if (isLoading) {
    return <ActivityIndicator />;
  }

  return <>{children}</>;
}
```

#### 3.2 EventEmitter 구현

**파일**: `mobile/lib/utils/authEvents.ts`

```typescript
/**
 * 간단한 EventEmitter 구현 (React Native 호환)
 */
class SimpleEventEmitter {
  private events: { [key: string]: ((...args: any[]) => void)[] } = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => {
      listener(...args);
    });
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export const authEvents = new SimpleEventEmitter();

export const AUTH_EVENTS = {
  UNAUTHORIZED: 'auth:unauthorized',
  TOKEN_EXPIRED: 'auth:token_expired',
  LOGOUT: 'auth:logout',
} as const;
```

#### 3.3 Axios 인터셉터 개선

**파일**: `mobile/lib/utils/axios.ts`

```typescript
client.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
    if (error.response?.status === API_CONSTANTS.STATUS_CODES.UNAUTHORIZED) {
      try {
        const isAuthRequest =
          error.config?.url?.includes('/auth') ||
          error.config?.url?.includes('/login') ||
          error.config?.url?.includes('/signin') ||
          error.config?.url?.includes('/google');

        if (!isAuthRequest) {
          console.log('🚫 401 Unauthorized - Token invalid or expired');

          // 토큰 제거
          await tokenManager.removeToken();

          // 글로벌 이벤트 발송 (AuthProvider가 리스닝)
          authEvents.emit(AUTH_EVENTS.UNAUTHORIZED);
        }
      } catch (storageError) {
        console.error('Token removal error:', storageError);
      }
    }

    return Promise.reject(error);
  }
);
```

#### 3.4 AuthProvider 업데이트

**파일**: `mobile/context/AuthProvider.tsx`

```typescript
// 401 Unauthorized 이벤트 리스너 (axios에서 발송)
useEffect(() => {
  const handleUnauthorized = async () => {
    console.log('🚫 Received unauthorized event - logging out');
    await signOut();
  };

  authEvents.on(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);

  return () => {
    authEvents.off(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
  };
}, []);
```

### 🔄 인증 흐름

```
1. 앱 시작
   ↓
2. AuthProvider가 저장된 토큰 확인
   ↓
3. AuthGuard가 사용자 상태 확인
   ↓
4. 토큰 없음 → 로그인 페이지
   토큰 있음 → 앱 메인 화면

API 호출 중 401 에러 발생 시:
1. Axios 인터셉터가 401 감지
   ↓
2. 토큰 제거
   ↓
3. authEvents.emit(UNAUTHORIZED)
   ↓
4. AuthProvider가 이벤트 수신
   ↓
5. signOut() 호출
   ↓
6. AuthGuard가 상태 변화 감지
   ↓
7. 로그인 페이지로 리다이렉트
```

---

## 4. UI/UX 최적화

### 📌 작업 내용

- 탭 전환 시 화면 깜빡임 제거
- 모든 페이지에 PageLayout 적용
- PageHeader 사용 페이지의 패딩 중복 제거
- 일관된 스타일링 적용

### 🎨 탭 전환 최적화

#### 4.1 CustomTabs 설정

**파일**: `mobile/components/navigation/CustomTabs.tsx`

```typescript
<Tabs
  screenOptions={{
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textTertiary,
    headerShown: false,
    lazy: false,              // 탭을 미리 로드하여 깜빡임 방지
    freezeOnBlur: false,      // 탭을 벗어나도 화면 상태 유지
    animation: 'none',        // 애니메이션 제거로 즉각적인 전환
    // ... 기타 설정
  }}
>
```

**최적화 효과**:

- ✅ 탭을 미리 로드하여 전환 시 지연 없음
- ✅ 탭 전환 시 화면 상태 유지
- ✅ 애니메이션 제거로 즉각적인 화면 전환
- ✅ 흰색 화면 깜빡임 제거

#### 4.2 PageLayout 최적화

**파일**: `mobile/components/common/PageLayout.tsx`

```typescript
const scrollViewProps = scrollable
  ? {
      showsVerticalScrollIndicator,
      removeClippedSubviews: true, // 성능 최적화
      keyboardShouldPersistTaps: 'handled' as const,
    }
  : {};
```

**최적화 효과**:

- ✅ 보이지 않는 뷰를 제거하여 성능 향상
- ✅ 키보드 처리 최적화

### 📱 페이지 레이아웃 통일

#### 4.3 모든 탭 페이지에 PageLayout 적용

**적용된 페이지**:

- ✅ 홈 (`home.tsx`)
- ✅ 경주 (`races.tsx` → `RacesScreen.tsx`)
- ✅ 기록 (`records.tsx`)
- ✅ 결과 (`results.tsx` → `ResultsScreen.tsx`) - **새로 적용**
- ✅ 마이페이지 (모든 하위 페이지)

**ResultsScreen 수정사항**:

```typescript
// Before
<ThemedView style={styles.container}>
  <ScrollView style={styles.content}>
    {/* 내용 */}
  </ScrollView>
</ThemedView>

// After
<PageLayout>
  <View style={styles.header}>
    {/* 헤더 */}
  </View>
  <View style={styles.content}>
    {/* 내용 - PageLayout이 스크롤 제공 */}
  </View>
</PageLayout>
```

### 🎯 PageHeader 패딩 중복 제거

#### 4.4 문제 상황

- `PageLayout`의 `paddingTop: 60`
- `PageHeader`의 자체 패딩
- **결과**: 총 2배의 상단 여백

#### 4.5 해결 방법

**적용된 모든 페이지**:

```typescript
// Before
<PageLayout>
  <PageHeader title="제목" />
  {/* 내용 */}
</PageLayout>

// After
<PageLayout style={{ paddingTop: 0 }}>
  <PageHeader title="제목" />
  {/* 내용 */}
</PageLayout>
```

**수정된 페이지 목록**:

1. ✅ `/mypage/subscription/plans.tsx` - AI 예측권 구독
2. ✅ `/mypage/subscription/dashboard.tsx` - 구독 관리 (2개소)
3. ✅ `/mypage/subscription/payment.tsx` - 구독 결제
4. ✅ `/mypage/purchase/single.tsx` - AI 예측권 구매

### 🎨 일관된 스타일링

#### 4.6 ThemedText 최적화

**파일**: `mobile/components/ThemedText.tsx`

```typescript
<Text
  style={[
    {
      color: textColor,
      backgroundColor: 'transparent',
      textShadowColor: 'transparent',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 0,
      elevation: 0,
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
    },
    // ... 기타 스타일
  ]}
  allowFontScaling={false}
  {...rest}
/>
```

**효과**:

- ✅ 텍스트 배경 아티팩트 제거
- ✅ 그림자 효과 제거
- ✅ 일관된 텍스트 렌더링

---

## 📊 전체 변경 파일 요약

### Backend (Server)

```
✅ server/mysql/init/01_create_database.sql - 컬럼명 확인
✅ server/mysql/init/02_subscription_plans.sql - 새로 생성, 스네이크케이스
✅ server/docker-compose.mysql-only.yml - UTF-8 설정 추가
✅ server/package.json - npm 스크립트 추가
✅ server/src/users/entities/user.entity.ts - last_login_at 수정
✅ server/src/subscriptions/entities/subscription.entity.ts - LIGHT enum 추가
✅ server/src/subscriptions/entities/subscription-plan.entity.ts - 새로 생성
✅ server/src/subscriptions/subscriptions.module.ts - SubscriptionPlanEntity 등록
✅ server/src/app.module.ts - Entity 등록
✅ server/scripts/init-subscription-plans.ts - 새로 생성
✅ server/scripts/init-db.sh - 컨테이너명 수정
```

### Frontend (Mobile)

```
✅ mobile/components/common/AuthGuard.tsx - 새로 생성
✅ mobile/lib/utils/authEvents.ts - 새로 생성
✅ mobile/lib/utils/axios.ts - 401 처리 개선
✅ mobile/context/AuthProvider.tsx - 이벤트 리스너 추가
✅ mobile/app/_layout.tsx - AuthGuard 통합
✅ mobile/components/navigation/CustomTabs.tsx - 성능 최적화
✅ mobile/components/common/PageLayout.tsx - 성능 최적화
✅ mobile/components/common/PageHeader.tsx - 스타일 조정
✅ mobile/components/ThemedText.tsx - 배경 아티팩트 제거
✅ mobile/components/screens/results/ResultsScreen.tsx - PageLayout 적용
✅ mobile/app/(app)/mypage/subscription/plans.tsx - paddingTop 제거
✅ mobile/app/(app)/mypage/subscription/dashboard.tsx - paddingTop 제거
✅ mobile/app/(app)/mypage/subscription/payment.tsx - paddingTop 제거
✅ mobile/app/(app)/mypage/purchase/single.tsx - paddingTop 제거
```

---

## 🎯 주요 성과

### 1. 데이터베이스

- ✅ 일관된 스네이크케이스 네이밍 컨벤션
- ✅ 완벽한 UTF-8 인코딩 지원
- ✅ 구독 플랜 시스템 완성

### 2. 인증 시스템

- ✅ 자동 로그인/로그아웃 처리
- ✅ 401 에러 자동 대응
- ✅ React Native 호환 EventEmitter

### 3. UI/UX

- ✅ 탭 전환 시 깜빡임 제거
- ✅ 모든 페이지 레이아웃 통일
- ✅ 일관된 패딩 및 스타일링

### 4. 코드 품질

- ✅ 타입 안전성 향상 (TypeORM 매핑)
- ✅ 재사용 가능한 컴포넌트 구조
- ✅ 명확한 에러 처리

---

## 🚀 다음 단계 제안

### 1. 구독 시스템 완성

- [ ] 실제 결제 연동 (Toss Payments)
- [ ] 구독 상태 관리 API 구현
- [ ] 예측권 사용 내역 추적

### 2. 성능 최적화

- [ ] React Query 캐싱 전략 최적화
- [ ] 이미지 최적화 및 Lazy Loading
- [ ] 번들 크기 최적화

### 3. 테스트

- [ ] 인증 플로우 E2E 테스트
- [ ] 구독 시스템 단위 테스트
- [ ] UI 컴포넌트 스냅샷 테스트

### 4. 문서화

- [ ] API 문서 업데이트
- [ ] 컴포넌트 Storybook 작성
- [ ] 배포 가이드 작성

---

## 📝 참고 사항

### 개발 환경

- **날짜**: 2025년 10월 11일
- **Node.js**: v18+
- **React Native**: Expo Router
- **Backend**: NestJS + TypeORM
- **Database**: MySQL 8.0 (Docker)
- **Mobile**: React Native + Expo

### 실행 방법

```bash
# MySQL만 Docker로 실행
cd server
npm run docker:mysql

# 구독 플랜 초기화
npm run init:plans

# NestJS 서버 실행 (로컬)
npm run start:dev

# Mobile 앱 실행
cd mobile
npx expo run:android  # 또는 npx expo run:ios
```

### 데이터베이스 확인

```bash
# MySQL 접속
docker exec -it goldenrace-mysql mysql -u root -p'rootpassword' goldenrace

# 구독 플랜 확인
SELECT plan_id, name, tickets_per_month, price_per_ticket, discount_percentage
FROM subscription_plans;
```

---

**작성일**: 2025년 10월 11일  
**작성자**: AI Development Assistant  
**프로젝트**: Golden Race - AI 경마 예측 플랫폼
