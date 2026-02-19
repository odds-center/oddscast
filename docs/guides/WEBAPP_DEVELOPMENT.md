# WebApp 개발 가이드

> WebApp (`webapp/`) UI/UX, API 연동, 모바일 최적화 가이드

---

## 1. 실행 방법

```bash
# 터미널 1: 서버 실행
cd server && npm run dev

# 터미널 2: WebApp 실행
cd webapp
npm run dev
# → http://localhost:3000
```

**환경 변수**: `webapp/.env.local` 또는 `.env`에 `NEXT_PUBLIC_API_URL` 설정 (기본: `http://localhost:3001/api`)

---

## 2. Form — react-hook-form

모든 폼은 `react-hook-form`을 사용합니다. (`.cursorrules` 규칙 8)

| 페이지 | 적용 |
|--------|------|
| `auth/login.tsx` | useForm, register, handleSubmit, setError |
| `auth/register.tsx` | useForm + 비밀번호 minLength 검증 |
| `auth/forgot-password.tsx` | useForm + watch |
| `profile/edit.tsx` | 프로필/비밀번호 각각 useForm, validate로 비밀번호 확인 검증 |

---

## 3. 공통 UI 컴포넌트

### 기본 컴포넌트

```tsx
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

<LoadingSpinner size={24} label='로딩 중...' />
<EmptyState icon='ClipboardList' title='데이터가 없습니다' description='설명' action={<button>다시 시도</button>} />
```

### 페이지 공통 컴포넌트 (`components/page/`)

**직접 import** — barrel index 사용 안 함. 각 파일에서 `export default`.

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| PageHeader | `@/components/page/PageHeader` | 아이콘 + 제목 + 설명/부제 |
| SectionCard | `@/components/page/SectionCard` | 카드 섹션 (title, accent 옵션) |
| MenuList | `@/components/page/MenuList` | 메뉴 링크 목록 (items) |
| FilterChips | `@/components/page/FilterChips` | 필터 칩 (전체, 오늘 등) |
| FormInput | `@/components/page/FormInput` | 라벨 + 입력 + 에러 |
| Pagination | `@/components/page/Pagination` | 여러 페이지 이동 (1 … 2 3 4 … 5) |
| BackLink | `@/components/page/BackLink` | "← XXX로" 링크 |

```tsx
import PageHeader from '@/components/page/PageHeader';
import SectionCard from '@/components/page/SectionCard';
import MenuList from '@/components/page/MenuList';
import FilterChips from '@/components/page/FilterChips';
import FormInput from '@/components/page/FormInput';
import Pagination from '@/components/page/Pagination';
import BackLink from '@/components/page/BackLink';

<PageHeader icon='Horse' title='실시간 경마' description='설명' />
<SectionCard title='예측권' accent>...</SectionCard>
<MenuList items={[{ href: '/profile', icon: 'User', label: '내 정보' }]} />
<FilterChips options={[{ value: '', label: '전체' }]} value={val} onChange={setVal} />
<FormInput label='이메일' {...register('email')} error={errors.email?.message} />
<Pagination page={1} totalPages={5} onPageChange={(p) => setPage(p)} />
<BackLink href='/profile' label='내 정보로' />
```

---

## 4. 모바일 레이아웃 & CSS

### Safe Area (노치/라운드 대응)

- **헤더**: `pt-[env(safe-area-inset-top)]`
- **콘텐츠**: `pl/pr [max(1rem, env(safe-area-inset-*))]`
- **하단 네비**: `pb-[env(safe-area-inset-bottom)]`
- **메타**: `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-*`

### 터치 UX

- **터치 타겟**: 버튼/링크 최소 44×44px
- **touch-manipulation**: `touch-action: manipulation`, 탭 하이라이트 제거
- **input**: `font-size: 16px` (iOS 줌 방지)
- **nav-item-mobile**: 56px 높이, 5개 메뉴 균등 배치 (홈/경주/종합/결과/내 정보)

### 모바일 전용 CSS (`globals.css`)

- `overflow-x: hidden` — 가로 스크롤 방지
- `.touch-manipulation` — 더블탭 줌 지연 제거
- `.nav-item-mobile` — 하단 네비 스타일
- `@media (max-width: 767px)` — 카드 패딩, 버튼 크기 조정

---

## 5. 타입 안전성 (TypeScript)

### any 금지
- **`any` 사용 금지.** 변수·매개변수·반환값에 구체적 타입 필수.
- 에러: `catch (err: unknown)` + `getErrorMessage(err)` (`lib/utils/error.ts`).
- mutation 에러: `getErrorMessage(mutation.error)`.
- 인덱스 시그니처: `[key: string]: unknown`.

### API 응답 처리
- `handleApiResponse<T>(response)` 제네릭으로 반환 타입 명시.
- `(response.data as { data?: T })?.data ?? (response.data as T)` 패턴.

---

## 6. 페이지별 API & 상태 처리

| 페이지 | API | 로딩 | 에러 | 빈 상태 |
|--------|-----|------|------|---------|
| Home | RaceApi.getRaces | LoadingSpinner | EmptyState + refetch | EmptyState |
| Results | ResultApi.getResults | LoadingSpinner | EmptyState + refetch | EmptyState |
| Ranking | RankingApi.getRankings | LoadingSpinner | EmptyState + refetch | EmptyState |
| Prediction | PredictionApi.getPredictions | LoadingSpinner | EmptyState + refetch | EmptyState |
| Profile | PointApi, TicketApi, SubscriptionApi | LoadingSpinner | — | — |
| mypage/notifications | NotificationApi.getNotifications | LoadingSpinner | EmptyState + refetch | EmptyState |
| mypage/subscriptions | SubscriptionPlansApi.getSubscriptionPlans | LoadingSpinner | EmptyState + refetch | EmptyState |
| mypage/subscription-checkout | SubscriptionApi.subscribe, PaymentApi.processSubscription, activate | LoadingSpinner | — | — |
| settings/notifications | NotificationApi.getNotificationPreferences, updateNotificationPreferences | LoadingSpinner | msg-error | — |
| races/[id] | RaceApi, FavoriteApi, PredictionApi | LoadingSpinner | — | — |

---

## 7. 구독 결제 플로우

플랜 선택 → 결제 → 활성화 순서:

1. **플랜 선택**: `mypage/subscriptions`에서 플랜 선택 → `mypage/subscription-checkout/[planId]`
2. **subscribe**: `SubscriptionApi.subscribe(planId)` — 구독 요청
3. **결제**: `PaymentApi.processSubscription(subscriptionId)` — 결제 처리
4. **activate**: `SubscriptionApi.activate(subscriptionId)` — 구독 활성화
5. **라우트**: `routes.mypage.subscriptionsCheckout(planId)` → `/mypage/subscription-checkout/[planId]`

---

## 8. 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `NEXT_PUBLIC_API_URL` | NestJS 서버 API URL | `http://localhost:3001/api` |
| `NEXT_PUBLIC_WEBAPP_URL` | WebApp 배포 URL (선택) | `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Sign-In Web Client ID | — |

---

## 9. 알림 설정 (settings/notifications)

- **경로**: `/settings/notifications` — `routes.settingsNotifications`
- **API**: `NotificationApi.getNotificationPreferences()`, `updateNotificationPreferences()`
- **플랫폼**: `useIsNativeApp()` — Mobile WebView에서 `window.__IS_NATIVE_APP__=true` 감지 시 푸시 토글 노출
- **컴포넌트**: `Toggle` (components/ui/Toggle.tsx), `SectionCard`
- **문서**: [NOTIFICATION_SETTINGS.md](../features/NOTIFICATION_SETTINGS.md)

---

## 10. Mobile WebView 연동

Mobile 앱은 WebView로 WebApp을 로드합니다.

| 환경 | URL |
|------|-----|
| Dev Android | `http://10.0.2.2:3000` |
| Dev iOS | `http://localhost:3000` |
| Prod | `https://gold-race-webapp.vercel.app` |

### 플랫폼 감지 (알림 설정 푸시 토글)

Mobile WebView가 `injectedJavaScriptBeforeContentLoaded="window.__IS_NATIVE_APP__=true"`를 주입. WebApp의 `useIsNativeApp()` 훅이 이를 감지하여 푸시 알림 토글을 mobile에서만 표시.

### 구글 로그인 (WebView 내)

- **웹**: Google GSI (accounts.google.com/gsi/client) 사용
- **WebView**: Native Bridge 사용 — `bridge.send('LOGIN_GOOGLE')` → Native 앱이 구글 로그인 → `LOGIN_SUCCESS` { token } 수신 후 `AuthApi.googleLogin(token)` 호출
- **Bridge 초기화**: `_app.tsx`에서 `import '@/lib/bridge'`로 앱 로드 시 초기화

### 모바일 UX (7번과 연계)

- **viewport**: Layout Head에 `viewport-fit=cover`, `user-scalable=no`
- **스크롤**: `-webkit-overflow-scrolling: touch`, `overscroll-behavior-y: contain`
- **키보드**: `input font-size: 16px` (iOS 줌 방지), `100dvh` (동적 뷰포트)
- **터치**: `touch-action: manipulation`, 터치 타겟 최소 44px

---

## 참조

- [CHANGELOG](../architecture/CHANGELOG.md) — 변경 이력
- [API_SPECIFICATION](../architecture/API_SPECIFICATION.md) — API 명세
- [webapp/README.md](../../webapp/README.md) — WebApp README
