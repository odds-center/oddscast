# 📂 프로젝트 구조 (Project Structure)

> **각 디렉토리와 모듈의 역할 정의**

---

## 전체 구조

```
goldenrace/
├── server/                     # 🖥️ NestJS 백엔드 (메인 서버, port 3001)
├── webapp/                     # 🌐 Next.js 웹앱 (메인 클라이언트, Desktop/Mobile 반응형, port 3000)
├── mobile/                     # 📱 React Native Expo 앱 (WebView → WebApp 로드, Metro port 3006)
├── admin/                      # 🔧 Next.js 관리자 패널 (port 3002)
├── shared/                     # 📦 공유 타입 (webapp, mobile, admin, server)
│   └── types/                  # api, auth, user, race, bet, favorite, point, result, prediction, subscription, notification
├── docs/                       # 📚 프로젝트 문서
│   ├── architecture/           # 아키텍처 문서 (이 파일들)
│   ├── specs/                  # 기술 명세
│   └── legal/                  # 법적 고지
├── server_legacy_nestjs/       # 🗂️ 레거시 서버 (참고용)
├── .cursorrules                # 🤖 AI 에이전트 규칙
└── README.md                   # 프로젝트 README
```

### 연동 구조

```
Mobile (Expo)  →  WebView  →  WebApp (반응형)  →  Server (/api)
Admin (Next.js)  →  Server (/api)
WebApp          →  Server (/api)
```

**WebApp ↔ Mobile 상세:** [WEBAPP_MOBILE_INTEGRATION.md](./WEBAPP_MOBILE_INTEGRATION.md)

---

## Server (`server/`)

> NestJS + Prisma + PostgreSQL 백엔드

```
server/
├── src/
│   ├── main.ts                          # 앱 부트스트랩 (포트, CORS, Swagger, GlobalPrefix)
│   ├── app.module.ts                    # 루트 모듈 (모든 모듈 import)
│   ├── app.controller.ts               # 헬스체크 컨트롤러
│   ├── app.service.ts                   # 헬스체크 서비스
│   │
│   ├── common/                          # 🔧 공통 유틸리티
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts  # @CurrentUser() + JwtPayload
│   │   ├── dto/
│   │   │   └── payment.dto.ts             # PurchaseDto, PaymentSubscribeDto 등
│   │   └── interceptors/
│   │       └── response.interceptor.ts    # 응답 래핑 { data, status }
│   │
│   ├── prisma/                          # 📦 Prisma 서비스
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── auth/                            # 🔐 인증 모듈
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts           # /auth/* 엔드포인트
│   │   ├── auth.service.ts              # JWT 발급, bcrypt 검증
│   │   ├── dto/auth.dto.ts              # RegisterDto, LoginDto 등
│   │   ├── guards/jwt-auth.guard.ts     # JwtAuthGuard
│   │   └── strategies/jwt.strategy.ts   # Passport JWT Strategy
│   │
│   ├── races/                           # 🏇 경기 모듈
│   │   ├── races.module.ts
│   │   ├── races.controller.ts          # /races/* 엔드포인트
│   │   ├── races.service.ts
│   │   └── dto/race.dto.ts
│   │
│   ├── results/                         # 📊 경주 결과 모듈
│   │   ├── results.module.ts
│   │   ├── results.controller.ts        # /results/* 엔드포인트
│   │   ├── results.service.ts
│   │   └── dto/result.dto.ts
│   │
│   ├── kra/                             # 🏇 KRA 연동 (경주계획표·출전표·결과·Cron)
│   │   ├── kra.module.ts
│   │   ├── kra.controller.ts            # /kra/* (Admin용)
│   │   ├── kra.service.ts               # API72_2, API26_2, Cron 스케줄
│   │   └── constants.ts
│   │
│   ├── predictions/                     # 🤖 AI 예측 모듈
│   │   ├── predictions.module.ts
│   │   ├── predictions.controller.ts    # /predictions/* 엔드포인트
│   │   ├── predictions.service.ts       # Python 실행 + Gemini 호출
│   │   └── dto/prediction.dto.ts
│   │
│   ├── users/                           # 👤 사용자 모듈
│   │   ├── users.module.ts
│   │   ├── users.controller.ts          # /users/* 엔드포인트
│   │   ├── users.service.ts
│   │   └── dto/user.dto.ts
│   │
│   ├── favorites/                       # ⭐ 즐겨찾기 모듈
│   │   ├── favorites.module.ts
│   │   ├── favorites.controller.ts
│   │   ├── favorites.service.ts
│   │   └── dto/favorite.dto.ts
│   │
│   ├── notifications/                   # 🔔 알림 모듈
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── dto/notification.dto.ts
│   │
│   ├── subscriptions/                   # 💳 구독 모듈
│   │   ├── subscriptions.module.ts
│   │   ├── subscriptions.controller.ts
│   │   ├── subscriptions.service.ts
│   │   └── dto/subscription.dto.ts
│   │
│   ├── payments/                        # 💰 결제 모듈
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   └── payments.service.ts
│   │
│   ├── prediction-tickets/              # 🎫 예측권 모듈
│   │   ├── prediction-tickets.module.ts
│   │   ├── prediction-tickets.controller.ts
│   │   └── prediction-tickets.service.ts
│   │
│   ├── picks/                           # 📌 내가 고른 말 (승식별) — 서비스에서 제외, API만 존재
│   │   ├── picks.module.ts
│   │   ├── picks.controller.ts
│   │   ├── picks.service.ts
│   │   └── dto/pick.dto.ts
│   │
│   ├── points/                          # 💎 포인트 (적중 지급, 예측권 구매)
│   │   ├── points.module.ts
│   │   ├── points.controller.ts
│   │   ├── points.service.ts
│   │   └── dto/point.dto.ts
│   │
│   ├── rankings/                        # 🏆 랭킹 모듈
│   │   ├── rankings.module.ts
│   │   ├── rankings.controller.ts
│   │   └── rankings.service.ts
│   │
│   └── single-purchases/               # 🛒 개별 구매 모듈
│       ├── single-purchases.module.ts
│       ├── single-purchases.controller.ts
│       └── single-purchases.service.ts
│
├── prisma/
│   └── schema.prisma                    # DB 스키마 정의 (12 모델)
│
├── scripts/                             # 🐍 Python 분석 스크립트 (예정)
│   ├── analysis.py                      # 메인 분석 로직
│   └── requirements.txt                 # pandas, numpy 등
│
├── tsconfig.json
├── package.json
└── .env                                 # 환경 변수
```

---

## WebApp (`webapp/`)

> Next.js — Desktop/Mobile 웹 페이지. Mobile WebView에서 로드. 반응형 + Safe Area 대응.

```
webapp/
├── pages/
│   ├── index.tsx                     # 경주 목록
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── 404.tsx                       # 맞춤 NotFound
│   ├── legal/
│   │   ├── terms.tsx                 # 서비스 이용 약관
│   │   └── privacy.tsx               # 개인정보 처리방침
│   ├── profile/
│   │   ├── index.tsx                 # 포인트, 예측권, 구독 요약
│   │   └── edit.tsx
│   ├── ranking.tsx
│   ├── results.tsx               # 경주 결과 (같은 경기 1·2·3위 행 묶음)
│   ├── settings.tsx
│   ├── settings/
│   │   └── notifications.tsx         # 알림 설정 (푸시는 mobile만)
│   ├── races/
│   │   └── [id].tsx                  # 경주 상세, 승식 선택
│   ├── predictions/
│   │   └── matrix.tsx                 # 종합예상표, AI/전문가 코멘트
│   ├── picks.tsx                     # (제외) 내부 리다이렉트 — 서비스에서 제외
│   └── mypage/
│       ├── index.tsx                 # 마이페이지 메뉴 허브
│       ├── picks.tsx                 # (제외) 내가 고른 말 — 메뉴 미노출
│       ├── subscriptions.tsx         # 구독 플랜
│       ├── subscription-checkout.tsx  # ?planId= 쿼리로 결제
│       ├── ticket-history.tsx        # 예측권 이력
│       ├── point-transactions.tsx    # 포인트 거래 내역
│       └── notifications.tsx
├── components/
│   ├── Layout.tsx                    # 반응형 헤더/푸터/모바일 하단 네비
│   ├── RaceCard.tsx                  # 반응형
│   ├── LoadingSpinner.tsx
│   ├── EmptyState.tsx
│   ├── GoogleSignInButton.tsx        # GSI 구글 로그인 버튼
│   ├── icons.tsx                     # Lucide 아이콘
│   ├── page/                         # 페이지 공통 (docs/features/UI_PATTERNS.md 참조)
│   │   ├── PageHeader.tsx            # 아이콘 + 제목 + 설명
│   │   ├── SectionCard.tsx           # 카드 섹션
│   │   ├── MenuList.tsx              # 메뉴 링크 목록
│   │   ├── DataFetchState.tsx        # 로딩/에러/빈 상태 처리
│   │   ├── RequireLogin.tsx          # 로그인 필요 안내
│   │   ├── FormInput.tsx             # 폼 입력 필드
│   │   ├── FilterDateBar.tsx         # 필터 칩 + 날짜 선택
│   │   ├── FilterChips.tsx          # 필터 칩
│   │   ├── Pagination.tsx            # 여러 페이지 이동 (1 … 2 3 4 … 5)
│   │   ├── BackLink.tsx              # 뒤로가기 링크 (ChevronLeft 아이콘)
│   │   └── PageContent.tsx           # 페이지 콘텐츠 래퍼
│   └── ui/                           # 범용 UI 컴포넌트
│       ├── Card.tsx
│       ├── DataTable.tsx             # 공용 테이블 (columns 기반)
│       ├── Badge.tsx
│       ├── TabBar.tsx                # 세그먼트 탭 (variant: filled|subtle)
│       ├── LinkBadge.tsx             # 테이블 내 경주/결과 링크
│       ├── StatusBadge.tsx           # 경주 상태 배지
│       ├── RankBadge.tsx             # 1·2·3등 배지
│       ├── SectionTitle.tsx
│       ├── Tooltip.tsx              # CSS 기반 경량 툴팁 (경마 용어 설명)
│       ├── Toggle.tsx
│       └── Dropdown.tsx
│   ├── race/                         # HorseEntryTable, RaceHeaderCard, PredictionSymbol
│   ├── results/                      # ResultCard
│   └── predictions/                  # PredictionMatrixTable, CommentaryFeed, HitRecordBanner
├── lib/
│   ├── api/                          # Server API 클라이언트
│   ├── store/
│   │   └── authStore.ts              # Zustand 인증 상태
│   ├── hooks/
│   │   └── useIsNativeApp.ts         # Mobile WebView 감지 (푸시 토글 노출용)
│   ├── routes.ts                     # 라우트 중앙 관리
│   ├── config.ts
│   ├── theme.ts                      # 금색/검정 테마
│   └── bridge.ts                     # Native ↔ WebView
<｜tool▁call▁end｜><｜tool▁call▁begin｜>
└── styles/
    └── globals.css                   # 라이트 테마(#fafafa, #c9a227), max-width 1200px, 스크롤바 6px
```

## Mobile (`mobile/`)

> React Native (Expo) — WebView로 WebApp URL 로드. **모든 기능은 WebApp에서 처리.**

```
mobile/
├── app/
│   ├── index.tsx                # /webview로 리다이렉트
│   ├── webview.tsx              # WebView (WebApp URL 로드, Google 로그인 토큰 전달)
│   ├── _layout.tsx              # 최소 레이아웃 (Stack)
│   └── +not-found.tsx
│
├── android/                     # Android 네이티브
├── ios/                         # iOS 네이티브
├── assets/                      # 앱 아이콘, 스플래시
└── app.config.js
```

**참고:** lib/api, lib/hooks, components, context, store 등은 WebApp으로 이전되어 제거됨.

---

## Shared (`shared/`)

> 서버/모바일 공유 타입 정의

```
shared/
└── types/
    ├── index.ts              # Re-exports
    ├── race.types.ts         # Race, RaceEntry 공유 타입
    ├── notification.types.ts # NotificationPreferenceFlags (알림 설정)
    ├── prediction.types.ts   # Prediction 공유 타입
    ├── subscription.types.ts # Subscription 공유 타입
    ├── user.types.ts         # User 공유 타입
    └── bet.types.ts          # (레거시)
```

---

## Admin (`admin/`)

> Next.js 관리자 패널 — Server `/api` 직접 호출

```
admin/
├── src/
│   ├── lib/api/
│   │   ├── client.ts            # apiClient (auth)
│   │   ├── auth.ts             # /api/auth/admin/login
│   │   └── admin.ts            # admin Races, Users, Results 등
│   └── pages/
│       ├── login.tsx
│       ├── index.tsx             # 대시보드
│       ├── kra.tsx               # KRA 데이터 관리 (경주계획표·출전표 수동/Cron)
│       ├── races/
│       ├── users/
│       └── ...
└── .env.example                # NEXT_PUBLIC_API_URL
```

---

## Docs (`docs/`)

```
docs/
├── architecture/              # 아키텍처 문서
│   ├── ARCHITECTURE.md        # 시스템 아키텍처
│   ├── CHANGELOG.md           # 변경 이력 (2026-02-12)
│   ├── DATABASE_SCHEMA.md     # DB 스키마
│   ├── API_SPECIFICATION.md   # API 명세
│   ├── BUSINESS_LOGIC.md      # 비즈니스 로직
│   └── PROJECT_STRUCTURE.md   # 프로젝트 구조 (이 파일)
├── specs/
│   ├── HORSE_RACING_SPEC.md   # 기술 명세서
│   └── COST_ANALYSIS.md       # 비용 분석
└── legal/
    └── LEGAL_NOTICE.md        # 법적 고지
```

---

## 모듈 우선순위

| 우선순위              | 모듈                                                              | 설명                            |
| --------------------- | ----------------------------------------------------------------- | ------------------------------- |
| **P0 (Core)**         | Auth, Races, Results, Predictions                                 | 핵심 기능 — 이것 없이는 앱 불가 |
| **P1 (Features)**     | Users, Favorites, PredictionTickets, ~~Picks(제외)~~               | 사용자 경험 향상                |
| **P2 (Monetization)** | Points, Subscriptions, Payments, SinglePurchases, Notifications, Rankings | 수익화 + 소셜                   |
