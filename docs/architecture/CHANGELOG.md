# 아키텍처 변경 이력 (Changelog)

> 2025-02-19 작업 내역

---

## 2025-02-19 (수) — 법적 문서 확장, 경주 결과 UI 강화, 구글 로그인 활성화

### 법적 문서

- **서비스 이용약관** (`/legal/terms`): 제1~14조 + 부칙, 결제·환불·면책·회사정보·통지 등 전자상거래법·콘텐츠산업진흥법 반영
- **개인정보처리방침** (`/legal/privacy`): 개인정보보호법 준수, 수집·이용·보관·파기·제3자·위탁·정보주체 권리·책임자·쿠키 등 14조 구성
- **환불 및 결제 정책** (`/legal/refund`): 신규 페이지, 구독·개별 구매 환불 기준, 전자상거래법 소비자 보호

### 경주 결과·경주 상세 UI

- **경주 결과 테이블**: 착차(diffUnit), 단승(winOdds), 복승(plcOdds) 컬럼 추가, ordType(낙마/실격/기권) 표시
- **경주 헤더**: rcDate(날짜), rcPrize(1착상금) 표시
- **배당 섹션**: 카드 그리드 레이아웃, 접기/펼치기
- **결과 페이지**: 모바일 카드형 + 데스크톱 테이블, rcTime·rcDist 표시
- **서버 API**: `getRaceResult`, `findAll(results)`에 rcTime, diffUnit, winOdds, plcOdds, rcDist 반환

### 구글 로그인

- **활성화**: 신규 → 자동 회원가입, 기존 → 로그인 (auth.service.googleLogin)
- **회원가입 페이지**: `text='continue_with'` (Google로 계속하기)
- **Mock 모드**: AuthApi.googleLogin Mock 응답 지원
- **가이드**: `docs/guides/GOOGLE_OAUTH_SETUP.md` 신규 작성

### 문서

- `.cursorrules`: 구글 로그인/OAuth 참조 문서 추가
- `LEGAL_NOTICE.md`: 약관·개인정보·환불정책 링크 갱신

### 종합 예상표·경주 목록

- **predictions/matrix**: 날짜(오늘/어제/날짜 선택), 경마장 필터, URL 동기화
- **URL 동기화**: `?date=`, `?meet=`, `?tab=` 쿼리로 필터·탭 상태 유지
- **API**: `GET /predictions/matrix`, `GET /predictions/commentary`, `GET /predictions/hit-record`
- **서버**: getMatrix — horseScores 1·2위 → AI 종합 컬럼에 복승 형식([top1, top2]) 표시
- **commentary**: meet 파라미터 추가, 경마장별 코멘트 필터
- **코멘트 탭**: DataFetchState 로딩·빈 상태 처리
- **경주 목록** (`/races`): 어제 필터 추가
- **경주 결과** (`/results`): 오늘/어제 필터 추가
- **CommentaryFeed**: rcNo 숫자만 있으면 "1R" 형식 표시

---

## 2026-02-13 (금) — TypeScript `any` 타입 제거 & 규칙 강화

### 변경 사항

- **any 금지 규칙**: `.cursorrules`, `docs/CURSOR_RULES.md`, `docs/COMPATIBILITY_RULES.md`에 **각각의 구체적 타입 필수** 규칙 추가
- **webapp**: `handleApiResponse`/`handleApiError`(axios), API 클라이언트, 페이지(`catch (err: unknown)` + `getErrorMessage`), 타입 정의(`[key: string]: unknown` 등) 수정
- **admin**: `handleApiError(error: unknown)`, `getErrorMessage` 유틸, Table `T extends object`, mutation `onError`/`onSuccess` 타입 수정
- **에러 처리**: `catch (err: any)` → `catch (err: unknown)` + `getErrorMessage(err)` (webapp/lib/utils/error.ts, admin/src/lib/utils.ts)
- **인덱스 시그니처**: `[key: string]: any` → `[key: string]: unknown`
- **타입 단언**: `as any` 금지, 필요한 경우 `as unknown as Type` 사용
- **문서**: CURSOR_RULES, COMPATIBILITY_RULES, WEBAPP_DEVELOPMENT에 타입 안전성 섹션 추가

---

## 2026-02-13 (금) — 구독 플랜 3종 (라이트/스탠다드/프리미엄)

### 변경 사항

- **subscription_plans**: LIGHT, PREMIUM → **LIGHT, STANDARD, PREMIUM** 3플랜
- **표시명**: 라이트 / 스탠다드 / 프리미엄
- **seed.sql**: LIGHT(10장/4,900원), STANDARD(20장/9,900원), PREMIUM(30장 27+3/14,900원), 개별구매 500원/장(550원 VAT포함)
- **webapp mock**: 3플랜 mockSubscriptionPlans
- **admin**: grid md:grid-cols-3 (3열)
- **문서**: PREDICTION_TICKET_PRICING_SIMULATION, DATABASE_SCHEMA, BUSINESS_LOGIC 반영

---

## 2026-02-13 (금) — main·header 패딩 조정

### 변경 사항

- **main 패딩**: 모바일 `1rem` (16px) + safe-area, 데스크 `2rem` (32px) 가로, `1.5rem` 세로
- **내부 div**: `px-0`, `py-4` (모바일) — 가로 패딩은 main에서만 처리
- **CompactPageTitle**: `-mt-4` (div의 py 상쇄), `pt-[max(0.75rem,env(safe-area-inset-top))]`, `mb-3`

---

## 2026-02-13 (금) — BackLink 제거 & CompactPageTitle 모바일 sticky GNB

### 변경 사항

- **BackLink "내 정보로" 제거**: 프로필·알림·예측권 이력·포인트 거래·picks·구독·프로필 수정 등 하위 페이지에서 제거 (CompactPageTitle 뒤로가기로 충분)
- **CompactPageTitle 모바일 sticky**: `max-md:sticky max-md:top-0` — 뒤로가기+제목 상단 고정, GNB 스타일
- **모바일 스타일**: `bg-background/98 backdrop-blur-sm border-b`, safe-area 대응 `pt-[max(0.5rem,env(safe-area-inset-top))]`

---

## 2026-02-13 (금) — 모바일 친화적 UI 강화

### 변경 사항

- **Layout**: 모바일 `px-3 py-3`, `pb-[200px]` (콘텐츠 하단 여백), `pl/pr 0.75rem` (safe area)
- **하단 네비**: `min-height: 48px` 터치 영역, 모바일 패딩·라운드 조정
- **푸터**: 모바일 `text-[11px]`, `gap-x-3`, `px-2`
- **홈**: `gap-4` (모바일), `gap-6` (데스크), 섹션 `mb-5` (모바일)
- **FilterChips**: `min-h-[44px]` (모바일 터치)
- **FilterDateBar**: date input `min-h-[44px]`
- **CompactPageTitle**: 뒤로가기 `w-11 h-11` (모바일), `text-[15px]`
- **SectionTitle**: `text-[15px]` (모바일), 아이콘 `w-8 h-8`
- **BackLink**: `py-2 min-h-[44px]`
- **테이블**: `min-height: 44px` 행, `-webkit-overflow-scrolling: touch` 가로 스크롤
- **globals.css**: `@media (max-width: 768px)` 모바일 전용 스타일 확장

---

## 2026-02-13 (금) — 모바일 네비 5개로 축소 & 페이지네이션 개선

### 모바일·하단 네비 개선

- **5개 고정**: 홈 / 경주 / 종합 / 결과 / 내 정보
- **제외**: 랭킹 → 내 정보 → 메뉴에서 진입 (랭킹을 프로필 메뉴 상단에 배치)
- **라벨 변경**: "종합 예상" → "종합" (모바일 공간 절약)
- **문서**: UI_PATTERNS에 하단 네비 섹션 추가

---

## 2026-02-13 (금) — 페이지네이션 개선 & URL 동기화 (뒤로가기 시 복귀)

### 변경 사항

- **Pagination 컴포넌트**: `onPrev`/`onNext` → `onPageChange(page: number)` 단일 콜백
- **형식**: `< 1 ... 2 3 4 ... 5 >` — 여러 페이지로 직접 이동, `...`로 구간 생략
- **URL 동기화**: 경주 목록(/races), 경주 결과(/results), 내가 고른 말(/mypage/picks) — `page`를 query로 관리
- **뒤로가기 복귀**: 목록 3페이지 → 상세 → 브라우저 뒤로가기 시 3페이지로 복귀
- **적용 페이지**: races/index, results, mypage/picks — `router.replace`로 URL 갱신
- **문서**: UI_PATTERNS, WEBAPP_DEVELOPMENT, PROJECT_STRUCTURE, CHANGELOG 반영

---

## 2026-02-13 (금) — 홈 섹션 리뉴얼 & /races 페이지

### 변경 사항

- **홈 첫 화면**: QuickLinks 제거, 섹션 미리보기 중심 구성
- **섹션 구성**: 오늘의 경주(3), 금주의 경주(3), 경주 결과(3행), 종합 예상지(3행), 경주 예상지(3), 랭킹(3명), 전체 경주(5)
- **인덱스 페이지네이션 제거**: 각 섹션 소수 항목만 표시, 전체보기 링크로 상세 페이지 이동
- **전체 경주 페이지**: `/races` — 필터 + DataTable + 페이지네이션 (BackLink → 홈)
- **라우트**: `routes.races.list = '/races'` 추가
- **Layout 네비**: 홈, 경주(/races), 종합 예상, 결과, 랭킹 분리 (→ 이후 5개로 축소, CHANGELOG 하단 참조)

---

## 2026-02-13 (금) — 빌드·환경·문서 정리

### 변경 사항

- **Picks UI 비노출**: `CONFIG.picksEnabled = false` — 경주 상세 HorsePickPanel·출전마 선택 숨김
- **Server 빌드**: `prisma generate`를 build 스크립트에 포함
- **루트 package.json**: `pnpm run build` — server+webapp+admin 전체 빌드
- **Admin next.config.js**: API rewrite fallback `localhost:3000` → `localhost:3001/api`
- **README.md**: pnpm 기반 실행 방법, 빌드 절차 정리
- **WEBAPP_README.md**: 테마 라이트 (#fafafa, #c9a227) 반영

---

## 2026-02-13 (금) — 내가 고른 말 (Picks) 서비스에서 제외

### 변경 사항

- **내가 고른 말 제외**: WebApp/Mobile에서 메뉴·페이지 미노출
- **Server API 유지**: `POST/GET/DELETE /api/picks` 엔드포인트는 존재하나 클라이언트에서 미사용
- **문서 업데이트**: SERVICE_SPECIFICATION, API_SPECIFICATION, BUSINESS_LOGIC, PROJECT_STRUCTURE, UI_PATTERNS, WEBAPP_README, WEBAPP_DEVELOPMENT, POINT_PICK_SYSTEM, DATABASE_SCHEMA, ARCHITECTURE

---

## 2026-02-13 (금) — WebApp 라이트 테마 & UI/UX & 결과 그룹화 & Admin KRA 전용 페이지

### 1. WebApp 테마 — 다크 → 라이트 전환

- **배경**: `#050508` → `#fafafa`
- **Primary**: `#ffd700` → `#c9a227` (라이트 배경 대비 골드)
- **텍스트**: `#18181b`, `#52525b`
- **카드/테두리**: 흰색·연한 회색
- **Layout**: `theme-color` `#fafafa`, iOS 상태바 `default`
- **globals.css**: shadow, border, badge 등 라이트 대응

### 2. UI/UX 완화 (부드럽게)

- **테두리**: `border-2` → `border` (1px)
- **모서리**: radius 증가 (`radius-lg`, `radius-xl`)
- **트랜지션**: `0.2s ease`
- **버튼·카드·테이블·필터칩·TabBar**: 전반 완화

### 3. 레이아웃·스크롤바

- **콘텐츠 최대 너비**: `max-w-5xl`(1024px) → `max-w-[1200px]`
- **헤더·푸터·메인**: 1200px 통일
- **스크롤바**: 8px → 6px, `scrollbar-width: thin`, hover/active 상태

### 4. 경주 결과 테이블

- **그룹화**: 같은 경기 1·2·3위를 한 행으로 묶음
- **컬럼**: 경주 | 날짜 | 1위 (No 마명 기수) | 2위 | 3위
- **nowrap**: 경주 셀 `whitespace-nowrap`, data-table 전역 `white-space: nowrap`

### 5. Admin KRA 데이터 관리

- **새 페이지**: `/kra` — 출전표·경주 결과·상세정보 수동 동기화
- **출전표 수동 동기화**: 웹앱 출전마 없을 때 Admin에서 날짜 선택 후 실행
- **동기화 로그**: `GET /api/admin/kra/sync-logs` 조회, 최근 30건 표시
- **사이드바**: KRA 데이터 메뉴 추가
- **대시보드**: KRA 데이터 빠른 링크
- **경주 상세**: 출전마 데이터 → KRA 동기화 링크 (`/kra?date=YYYYMMDD`)

### 6. 문서

- **ADMIN_GUIDE.md**: KRA 페이지, 출전표 수동 동기화 안내
- **DATA_LOADING.md**: 출전마 보이지 않을 때 대응, sync-logs
- **UI_PATTERNS.md**: 테마·스크롤·max-width
- **API_SPECIFICATION.md**: `GET /api/admin/kra/sync-logs`

---

## 2026-02-13 (금) — @goldenrace/shared 공용 타입 패키지

### 1. shared 패키지 구성

- **package.json**: `@goldenrace/shared`, `file:../shared` 로컬 참조
- **types/**: api, auth, user, race, result, bet, favorite, point, prediction, prediction-ticket, subscription, notification
- **webapp, mobile, admin, server** package.json에 `@goldenrace/shared` 의존성 추가

### 2. 타입 파일

- `api.types.ts`: ApiResponse, PaginatedResponse, ApiError, ErrorCode
- `auth.types.ts`: AuthTokens, AuthResponse, LoginRequest, RegisterRequest, ...
- `favorite.types.ts`: Favorite, CreateFavoriteRequest (RACE만), FavoriteFilters 확장
- `point.types.ts`: PointTransactionType, PointStatus, UserPointBalance, PointTransaction
- `result.types.ts`: RaceResultItem, ResultListResponse
- `prediction-ticket.types.ts`: TicketHistoryResponse (PredictionTicket은 subscription에서)

### 3. webapp 마이그레이션

- `lib/types/api.ts`: ApiResponse 등 shared에서 재export
- `lib/types/auth.ts`: LoginRequest, RegisterRequest 등 shared + webapp AuthResponse
- `lib/types/favorite.ts`: Favorite 등 shared 기반, FavoriteStatistics/FavoriteRace 등 webapp 확장
- `lib/types/point.ts`: PointTransactionType, PointStatus, UserPointBalance, PointTransaction
- `pages/mypage/favorites.tsx`: memo만 사용 (notes 제거)
- `lib/store/authStore.ts`: User.name optional

### 4. mobile

- `types/shared.ts`: AuthResponse, AuthTokens 재export (브릿지용)

### 5. .cursorrules

- 타입(Shared) 규칙 추가: 새 타입은 `shared/types/`에 정의

---

## 2026-02-13 (금) — FavoriteApi 경로 수정 & 예측권/포인트 이력 페이지 & Server 포인트 API

### 1. WebApp FavoriteApi — 서버 bulk 엔드포인트 연동

- **bulkAddFavorites**: `POST /favorites/bulk-add` → `POST /favorites/bulk`, body를 `{ favorites }`에서 배열로 변경
- **bulkDeleteFavorites**: `DELETE /favorites/bulk-delete` → `DELETE /favorites/bulk`, body `{ favoriteIds }` → `{ ids }`

### 2. WebApp — 예측권 이력·포인트 거래 내역 페이지

- **mypage/ticket-history.tsx**: `PredictionTicketApi.getHistory()` — 예측권 구매·사용·만료 이력
- **mypage/point-transactions.tsx**: `PointApi.getMyTransactions()` — 포인트 적립·사용 거래 내역
- **routes**: `mypage.ticketHistory`, `mypage.pointTransactions` 추가
- **메뉴**: profile, mypage index에 예측권 이력·포인트 거래 내역 링크 추가

### 3. Server — 포인트 거래 내역 API

- **GET /points/me/transactions**: 로그인 사용자 본인 포인트 거래 내역 (page, limit, type 쿼리)

### 4. PointApi

- **getMyTransactions()**: `GET /points/me/transactions` 호출 메서드 추가

### 5. 문서

- **PROJECT_STRUCTURE.md**: ticket-history.tsx, point-transactions.tsx 추가

---

## 2026-02-13 (금) — 404·법적 페이지·구독 이력·설정 메뉴

### 1. 404 & 법적 페이지

- **404.tsx**: 맞춤 NotFound 페이지 (홈으로 링크)
- **legal/terms.tsx**: 서비스 이용 약관 (요약)
- **legal/privacy.tsx**: 개인정보 처리방침 (기본 템플릿)
- **routes.legal**: terms, privacy 라우트 추가
- **Layout footer** (Desktop): 이용약관, 개인정보처리방침 링크
- **Settings**: 이용약관, 개인정보처리방침 메뉴 (로그인 여부 무관)

### 2. 구독 이력

- **Subscriptions 페이지**: 로그인 시 "구독 이력" 섹션 (최근 5건)
- **SubscriptionApi.getHistory** 활용
- 취소 시 history 쿼리 무효화

---

## 2026-02-13 (금) — Server 구독 취소 & WebApp 랭킹·분석·비밀번호 재설정 & Mobile WebView 뒤로가기

### 1. Server — 구독 상태·취소

- **getStatus()**: WebApp 호환 응답 — `planId`, `monthlyTickets`, `daysUntilRenewal` 포함
- **POST /subscriptions/cancel**: 현재 유저의 활성 구독 조회 후 취소 (`cancelByUserId`)
- **파일**: `subscriptions.service.ts`, `subscriptions.controller.ts`

### 2. WebApp — 랭킹·분석·비밀번호 재설정

- **랭킹 페이지**: 로그인 시 "내 랭킹" 섹션 (`RankingApi.getMyRanking()`)
- **경주 상세**: 기수·말 통합 분석 (마칠기삼) — "분석 보기" 클릭 시 `/api/analysis/race/:raceId/jockey` 호출
- **비밀번호 재설정**: `/auth/reset-password?token=...` 페이지, `routes.auth.resetPassword`
- **AnalysisApi**: `lib/api/analysisApi.ts` — `getJockeyAnalysis(raceId)`
- **Config**: `show_google_login` 미설정 시 구글 로그인 표시 (기본 true)
- **아이콘**: Key, Mail 추가 (reset-password 페이지용)

### 3. Mobile WebView — 뒤로가기 UX

- **뒤로가기 우선순위**: WebView 내 history가 있으면 `webView.goBack()`, 없으면 `router.back()`
- **onNavigationStateChange**: `canGoBack` 상태 추적
- **아이콘**: close → arrow-back (뒤로가기 의미 명확화)
- **파일**: `mobile/app/webview.tsx`

---

## 2026-02-13 (금) — 알림 설정 & 즐겨찾기 RACE 전용 & 문서 통합

### 1. 알림 설정 (Notification Preferences)

- **UserNotificationPreference** 모델: `pushEnabled`, `raceEnabled`, `predictionEnabled`, `subscriptionEnabled`, `systemEnabled`, `promotionEnabled` (이메일 없음)
- **API**: `GET/PUT /api/notifications/preferences` — 조회·수정 (없으면 기본값 생성)
- **플랫폼별**: `pushEnabled` 토글은 mobile(native WebView)에서만 노출
- **플랫폼 감지**: Mobile WebView가 `injectedJavaScriptBeforeContentLoaded="window.__IS_NATIVE_APP__=true"` 주입
- **WebApp**: `pages/settings/notifications.tsx`, `lib/hooks/useIsNativeApp.ts`, `components/ui/Toggle.tsx`
- **문서**: [NOTIFICATION_SETTINGS.md](../features/NOTIFICATION_SETTINGS.md)

### 2. 즐겨찾기 RACE 전용

- **DTO**: `CreateFavoriteDto`, `ToggleFavoriteDto` — `@IsIn(['RACE'])` (경주만 지원)
- **서비스**: `findAll` type 기본값 `'RACE'`, `search`/`export`/`bulkAdd` RACE 필터
- **WebApp**: favorites 페이지에서 `type: 'RACE'` 고정

### 3. 문서 업데이트

- **DATABASE_SCHEMA.md**: UserNotificationPreference, Favorite RACE 전용 반영
- **API_SPECIFICATION.md**: 알림 설정 Preferences 상세, Favorites API
- **README.md**: Features 섹션 (NOTIFICATION_SETTINGS, POINT_PICK_SYSTEM)
- **WEBAPP_README.md**, **WEBAPP_DEVELOPMENT.md**: `/settings/notifications` 라우트
- **MOBILE_GUIDE.md**: `__IS_NATIVE_APP__` WebView 주입

---

## 2026-02-13 (금) — WebApp 페이지 컴포넌트 & 모바일 최적화 & 구독 플로우

### 1. 페이지 공통 컴포넌트 (`webapp/components/page/`)

- **직접 import**: barrel (`index.ts`) 제거, 각 파일에서 `export default`로 직접 import
- **컴포넌트**:
  - `PageHeader` — 아이콘 + 제목 + 설명/부제
  - `SectionCard` — 카드 섹션 (title, accent 옵션)
  - `MenuList` — 메뉴 링크 목록 (items)
  - `FilterChips` — 필터 칩 (전체, 오늘 등)
  - `FormInput` — 라벨 + 입력 + 에러 메시지
  - `Pagination` — 여러 페이지 이동 (1 … 2 3 4 … 5), `onPageChange(page)`
  - `BackLink` — "← XXX로" 링크

### 2. 모바일 레이아웃 & CSS

- **Safe Area**: `pt-[env(safe-area-inset-top)]`, `pb-[env(safe-area-inset-bottom)]`, 좌우 패딩
- **메타**: `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-*`
- **터치**: 버튼/링크 최소 44×44px, `touch-action: manipulation`, `.nav-item-mobile` 56px
- **input**: `font-size: 16px` (iOS 줌 방지)
- **globals.css**: `overflow-x: hidden`, `.touch-manipulation`, 모바일 미디어 쿼리

### 3. 구독 결제 플로우

- **경로**: `mypage/subscription-checkout/[planId]`
- **흐름**: 플랜 선택 → `subscribe` → `payments/subscribe` → `activate`
- **라우트**: `routes.mypage.subscriptionsCheckout(planId)`
- **API**: `SubscriptionApi.subscribe/activate`, `PaymentApi.processSubscription`

### 4. 디자인 시스템

- **globals.css**: 금색 그라데이션, 버튼·카드 스타일, 타이포그래피
- **폰트**: Syne (제목), Plus Jakarta Sans (본문)
- **`_document.tsx`**: Google Fonts 로드

---

## 2026-02-13 (금) — 문서·빌드 정리 & 누락 항목 보완

### 1. Admin 빌드 수정

- **Link 컴포넌트**: 대시보드 빠른 링크 `<a>` → `<Link>` (ESLint no-html-link-for-pages)
- **Bet 타입**: `lib/types/admin.ts`에 `betResult`, `potentialWin`, `odds` 등 Prisma 스키마 반영
- **bets/index.tsx**: 로컬 Bet 인터페이스 제거, `@/lib/types/admin` 사용

### 2. Server

- **`.env.example` 생성**: DATABASE_URL, PORT, GOOGLE_CLIENT_ID, GEMINI_API_KEY, JWT_SECRET
- **Admin estimate-cost**: `GET /admin/ai/estimate-cost` 엔드포인트 추가 (설정 기반 예상 비용)

### 3. API 명세서

- **클라이언트 경로**: Mobile → WebApp (Users, Favorites, Notifications, Subscriptions, Payments, Prediction Tickets, Rankings)
- **Predictions**: `GET /predictions/stats/cost` 추가
- **Admin**: `GET /admin/ai/estimate-cost` 추가
- **KRA 모듈**: 섹션 16 추가 (`/api/kra/sync-logs`, `/api/kra/sync/*`)

### 4. Mobile README 업데이트

- WebView 기반 아키텍처 반영 (lib/, components/, store 등 제거됨)
- 삭제된 문서 링크 제거 (architecture/mobile, guides/mobile, features/mobile)
- Native Bridge, WebApp URL 설정 가이드 정리

### 5. 문서 정리

- **README.md**: Mobile WebView URL (`/m` → base URL)
- **PROJECT_STRUCTURE.md**: WebApp tree 오타 수정 (Read → styles/globals.css)

---

## 2026-02-12 (목) — WebApp Mock 모드 & UI/UX 개선

### 1. Mock 데이터 시스템

- **환경 변수**: `NEXT_PUBLIC_USE_MOCK=true` 시 DB 없이 하드코딩 mock 데이터 사용
- **mock 데이터**: `webapp/lib/mocks/data.ts` — races, results, predictions, rankings, points, tickets, subscriptions, notifications, user, config
- **적용 API**: RaceApi, ResultApi, PredictionApi, RankingApi, PicksApi, FavoriteApi, NotificationApi, PointApi, PredictionTicketApi, SubscriptionApi, SubscriptionPlansApi, ConfigApi, AuthApi
- **데모 로그인**: `demo@goldenrace.com` / `demo123`
- **Config**: `webapp/lib/config.ts` — `CONFIG.useMock` 플래그

### 2. Form — react-hook-form 통일

- **규칙**: `.cursorrules` — 모든 폼은 `react-hook-form` 사용 (규칙 8)
- **패키지**: `webapp/package.json` — `react-hook-form@^7.53.0` 추가
- **적용 페이지**:
  - `login.tsx` — useForm, register, handleSubmit, setError
  - `register.tsx` — 동일 + 비밀번호 minLength 검증
  - `forgot-password.tsx` — useForm + watch
  - `profile-edit.tsx` — 프로필/비밀번호 각각 useForm, validate로 비밀번호 확인 검증

### 3. 공통 UI 컴포넌트

- **LoadingSpinner**: `webapp/components/LoadingSpinner.tsx` — size, label, className
- **EmptyState**: `webapp/components/EmptyState.tsx` — icon, title, description, action

### 4. 페이지별 UI/UX 개선

| 페이지 | 변경 내용 |
|--------|-----------|
| **Home** | 에러 처리, EmptyState, 새로고침 버튼 |
| **Results** | 날짜 필터, 페이지네이션, 에러 처리, raceId 중복 제거 |
| **Ranking** | 상위 3명 강조 스타일, 에러 처리, EmptyState |
| **Prediction** | 에러 처리, EmptyState |
| **Profile** | LoadingSpinner, 사용자 이름/닉네임 표시 |
| **Favorites** | LoadingSpinner, EmptyState, 에러 처리 |
| **Picks** | LoadingSpinner, EmptyState, 에러 처리 |
| **Notifications** | LoadingSpinner, EmptyState, 에러 처리 |
| **Subscriptions** | LoadingSpinner, EmptyState, 에러 처리 |
| **races/[id]** | LoadingSpinner 적용 |

### 5. API 연동 가이드

- **Mock 모드**: `NEXT_PUBLIC_USE_MOCK=true` 시 API 호출 없이 mock 데이터 반환
- **실제 서버**: `NEXT_PUBLIC_USE_MOCK=false` 또는 미설정 후, `NEXT_PUBLIC_API_URL`로 서버 URL 설정
- **실행**: `cd server && npm run start:dev` → `cd webapp && npm run dev`
- **Mobile WebView**: Dev Android `http://10.0.2.2:3000`, iOS `http://localhost:3000`, Prod `https://gold-race-webapp.vercel.app`

### 6. README 업데이트

- `webapp/README.md` — `NEXT_PUBLIC_USE_MOCK` 환경 변수, 서버 연동 설명 추가

---

## 2026-02-12 (목) — KRA 연동·DB 저장·Batch·Seed 통합

### 1. Python–NestJS 연결 검증 및 수정

- **문제**: `JockeyResult.meet`은 `"1"`, `"2"`, `"3"`인데 `Race.meet`은 `"Seoul"`, `"Jeju"`, `"Busan"`이라 기수 조회 실패
- **수정**: `AnalysisService.analyzeJockey`에 `meetMap` 추가 (Seoul→1, Jeju→2, Busan→3)
- **파일**: `server/src/analysis/analysis.service.ts`

### 2. Batch 스케줄 (Cron) 검증

- **KraModule**에 `ScheduleModule.forRoot()` 이미 등록됨
- **Cron 스케줄**:
  - **수·목 18:00**: `syncWeeklySchedule` — 주말 출전표 선행 동기화
  - **금·토·일 08:00**: `syncRaceDayMorning` — 당일 출전표 + 상세 분석
  - **금·토·일 10:30–18:00 (30분 간격)**: `syncRealtimeResults` — 결과 + 분석
- **파일**: `server/src/kra/kra.service.ts`

### 3. KraSyncLog 모델 및 KRA API 로깅

- **모델**: `KraSyncLog` — `endpoint`, `meet`, `rcDate`, `status`, `recordCount`, `errorMessage`, `durationMs`
- **로깅 대상**: entrySheet, raceResult, jockeyResult, trackInfo, horseWeight, equipmentBleeding, horseCancel
- **API**: `GET /api/kra/sync-logs` (Admin 전용) — 동기화 로그 조회
- **파일**: `server/prisma/schema.prisma`, `server/src/kra/kra.service.ts`, `server/src/kra/kra.controller.ts`

### 4. KRA API별 DB 저장

| API | 엔드포인트 | 저장 대상 |
|-----|-----------|-----------|
| 경주로정보 | API189_1/Track_1 | `Race.weather`, `Race.trackState` |
| 출전마 체중 | API25_1/entryHorseWeightInfo_1 | `RaceEntry.horseWeight` |
| 장구·폐출혈 | API24_1/horseMedicalAndEquipment_1 | `RaceEntry.equipment`, `RaceEntry.bleedingInfo` |
| 출전취소 | API9_1/raceHorseCancelInfo_1 | `RaceEntry.isScratched` |

- **syncAnalysisData** 흐름: 경주로정보 → 출전마 체중 → 장구·폐출혈 → 출전취소 → 훈련·상세
- **파일**: `server/src/kra/kra.service.ts`

### 5. 날짜별 경기 조회 API

- **API**: `GET /api/races/by-date/:date` — YYYYMMDD 또는 YYYY-MM-DD
- **메서드**: `RacesService.getRacesByDate(date)` — 해당 날짜의 모든 경주, 출전취소(`isScratched`) 제외
- **파일**: `server/src/races/races.service.ts`, `server/src/races/races.controller.ts`

### 6. RaceEntry 스키마 확장

- `horseWeight` (String?) — 마체중, 예: `"502(-2)"`
- `bleedingInfo` (Json?) — 폐출혈 이력 (bleCnt, bleDate, medicalInfo)
- `isScratched` (Boolean) — 출전 취소 여부
- **파일**: `server/prisma/schema.prisma`

### 7. DB 초기화 (마이그레이션 없음, Seed 기본값)

- **전략**: 마이그레이션 없음. `prisma db push`로 스키마 반영 후 `seed.sql`로 기본값 삽입
- **실행**: `npm run db:init` = `prisma db push` + `prisma db execute --file prisma/seed.sql`
- **Seed 기본값**:
  - `point_configs` — 승식별 포인트 배율
  - `point_ticket_prices` — 1장 = 1200pt
  - `subscription_plans` — LIGHT(라이트), STANDARD(스탠다드), PREMIUM(프리미엄)
  - `global_config` — show_google_login 등 기능 플래그
- **멱등성**: `ON CONFLICT DO NOTHING` / `WHERE NOT EXISTS`로 재실행 시 중복 없음
- **파일**: `server/prisma/seed.sql`, `docs/architecture/DATABASE_SCHEMA.md`

---

## 2026-02-12 (목) — KRA 분석 & 예측 저장

### 1. KRA 분석 전략 (Python + NestJS)

- **Python**: `scripts/analysis.py` — `calculate_jockey_score`, `get_weight_ratio`, `analyze_jockey` (마칠기삼)
- **NestJS**: `AnalysisService`, `AnalysisController` — `GET /api/analysis/race/:raceId/jockey`
- **PredictionsService**: Gemini 프롬프트에 기수 분석 결과 포함
- 문서: [KRA_ANALYSIS_STRATEGY.md](../specs/KRA_ANALYSIS_STRATEGY.md)

### 2. 예측 성공 시 DB 저장

- **Prediction.scores** 확장: `horseScores`(Gemini) + `analysisData`(horseScoreResult, jockeyAnalysis)
- **예측 정확도**: `ResultsService.bulkCreate` 시 `updatePredictionAccuracy` 호출 → `Prediction.accuracy` 계산·저장

### 3. Admin 빌드 수정

- `AdminController` activate/deactivate: `UpdateUserDto` 타입 명시

---

## 2026-02-12 (목)

### 1. 포인트 & 승식 시스템 (Picks, Points)

- **UserPick 확장**: `pickType`, `hrNos[]`, `hrNames[]`, `pointsAwarded` 추가
- **승식 7종**: SINGLE, PLACE, QUINELLA, EXACTA, QUINELLA_PLACE, TRIFECTA, TRIPLE
- **PointConfig**: 베이스 포인트, 승식별 배율 (시드: `prisma/seed.sql`)
- **PointTicketPrice**: 포인트 예측권 가격 (1장=1200pt)
- **적중 지급**: Results bulkCreate 시 `awardPickPointsForRace` 호출
- **포인트 구매**: `POST /points/purchase-ticket` — 포인트로 예측권 구매

### 2. WebApp 통일

- **테마**: 금색(#ffd700) & 검정(#0c0c0c) — `lib/theme.ts`, `styles/globals.css`
- **아이콘**: Lucide React (`components/icons.tsx`)
- **페이지**: picks, profile(포인트), ranking, races/[id](승식 선택)
- **API**: picksApi, pointApi (getMyBalance, getTicketPrice, purchaseTicket)

### 3. Mobile → WebApp 중심 전환

- **Mobile**: WebView만 사용 → WebApp URL 로드, Google 로그인 토큰 전달
- **제거**: lib/, components/, context/, store/, mocks/, hooks/, utils/, constants/, config/
- **\_layout.tsx**: Stack + SplashScreen만 유지 (AuthProvider, Redux, React Query, MSW 제거)
- **의존성 정리**: React Query, Redux, MSW, Toast, react-hook-form, Axios 등 제거

### 4. 사행성 제거 (기존)

- 베팅 없음: Picks(내가 고른 말)로 기록만 저장
- previewApproved: 검수 통과 예측만 preview API 반환

### 5. DB 스키마 (마이그레이션 없음)

- `prisma db push` 사용 (초기 설계 단계)

### 6. 구글 로그인 통합 (2026-02-12)

- **Server**: `POST /auth/google` — idToken 검증 후 JWT 발급 (google-auth-library)
- **WebApp (웹)**: `/login`에 Google GSI 버튼 — `GoogleSignInButton` (GSI JavaScript API)
- **WebApp (Mobile)**: Native Bridge `LOGIN_SUCCESS` 시 `AuthApi.googleLogin(idToken)` → JWT 저장
- **Mobile**: `app.config.js` webClientId → `GoogleSignin.configure` — idToken 획득 후 WebApp에 전달
- **설정**: Server `GOOGLE_CLIENT_ID`, WebApp `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, Mobile `app.config.js` — 동일 Web Client ID
- 문서: [docs/guides/authentication/GOOGLE_AUTH_SETUP.md](../guides/authentication/GOOGLE_AUTH_SETUP.md)

---

## 참조 문서

- [포인트 & 승식 기획안](../features/POINT_PICK_SYSTEM.md)
- [비즈니스 로직](BUSINESS_LOGIC.md)
