# 📋 OddsCast 서비스 명세서 (Service Specification)

> **이 문서는 서비스가 무엇인지, 어떤 기능을 제공하는지, 어떻게 동작하는지를 명확히 정의합니다.**
>
> 기능 개발 시 이 문서를 기준으로 요구사항을 파악하고 구현합니다.

---

## 1. 서비스 개요

### 1.1 한 줄 정의

**OddsCast**는 **AI 기반 경마 예측 정보를 제공하는 구독형 콘텐츠 서비스**입니다.

### 1.2 서비스 정체성

| 구분 | 내용 |
|------|------|
| **핵심 가치** | AI 분석 결과를 통해 경주 정보를 이해하기 쉽게 전달 |
| **수익 모델** | 구독료(월 구독) + 예측권 개별 구매 + 종합 예측권 판매 |
| **대상 사용자** | 40~60대, 경마·경주 정보에 관심 있는 사용자 |
| **법적 성격** | 정보 제공 서비스 (주식 투자 정보 서비스와 유사) |

### 1.3 서비스가 하는 일 vs 하지 않는 일

| ✅ 하는 일 | ❌ 하지 않는 일 |
|------------|-----------------|
| AI 예측 정보 제공 | 앱 내 마권 구매 |
| 경주 목록·결과 조회 | 베팅 중개 |
| 예측권 구독·구매 | 배당금 수령 |
| 즐겨찾기(경주) — Server API만, WebApp UI 제거됨 | 사행성 게임 |
| 알림(경주·예측·구독) | 이메일 마케팅(제거됨) |

---

## 2. 제공 기능 총괄

### 2.1 기능 매트릭스

| # | 기능 | 설명 | 클라이언트 | 인증 |
|---|------|------|-----------|------|
| 1 | **경주 목록** | 날짜별/오늘 경주 조회 | WebApp, Mobile | 공개 |
| 2 | **경주 상세** | 출전마, 결과, 예측 미리보기 | WebApp, Mobile | 공개 |
| 3 | **AI 예측 (전체)** | 예측권 사용 시 전체 분석 열람 | WebApp, Mobile | 로그인 |
| 4 | **경주 결과** | 종료된 경주 결과 조회 | WebApp, Mobile | 공개 |
| 5 | **랭킹** | 예측 적중 횟수 순위 | WebApp, Mobile | 공개(목록), 로그인(내 랭킹) |
| 6 | ~~**내가 고른 말**~~ | ~~승식별 선택 기록, 적중 시 포인트~~ | **제외** | — |
| 7 | **즐겨찾기** | 관심 경주 저장 (RACE만) | ~~WebApp~~, Server API | 로그인 |
| 8 | **예측권 (RACE)** | 구독·포인트·개별 구매로 획득, 경주별 예측 열람 | WebApp, Mobile | 로그인 |
| 9 | **종합 예측권 (MATRIX)** | 구독 포함 (5천원당 1장) + 개별 구매 1,000원/장, 일일 종합 예상표 전체 열람 | WebApp, Mobile | 로그인 |
| 10 | **포인트** | 예측권 구매에 사용 (프로모션 등 지급) | WebApp, Mobile | 로그인 |
| 11 | **구독** | 월 정기 구독, 예측권 자동 발급 | WebApp, Mobile | 로그인 |
| 12 | **알림** | 경주·예측·구독·시스템·프로모션 | WebApp, Mobile | 로그인 |
| 13 | **프로필·설정** | 프로필 수정, 알림 설정 | WebApp, Mobile | 로그인 |
| 14 | **기수·말 분석** | 마칠기삼 통합 분석 (선택) | WebApp, Mobile | 공개 |
| 15 | **일일 종합 가이드** | 하루 전체 경주 AI 예상 매트릭스 (용산종합지 스타일) | WebApp, Mobile | 로그인 |

### 2.2 클라이언트 구성

| 클라이언트 | 역할 | 기술 |
|------------|------|------|
| **WebApp** | 메인 클라이언트 (Desktop/Mobile 반응형) | Next.js, Tailwind |
| **Mobile** | WebView로 WebApp 로드 (Native 로그인·푸시) | React Native, Expo |
| **Admin** | 관리자 패널 (KRA 동기화, 사용자, AI 설정) | Next.js |

---

## 3. 기능별 상세 명세

### 3.1 경주·결과·예측 (Core)

#### 경주 목록
- **입력**: 날짜, 필터(오늘/전체)
- **출력**: 경주 카드 목록 (경마장, 경주번호, 거리, 등급, 상태)
- **라우트**: `/` (홈)
- **API**: `GET /api/races`

#### 경주 상세
- **내용**: 경주 정보, 출전마, 경주 결과, 예측 미리보기, AI 전체 분석(예측권 사용 시)
- **라우트**: `/races/[id]`
- **API**: `GET /api/races/:id`, `GET /api/races/:id/results`, `GET /api/predictions/race/:raceId`, `GET /api/analysis/race/:raceId/jockey`

#### 경주 결과
- **내용**: 종료된 경주 결과 목록 (날짜 필터, 페이지네이션). **같은 경기 1·2·3위를 한 행에 묶어 표시** (경주 | 날짜 | 1위 | 2위 | 3위)
- **라우트**: `/results`
- **API**: `GET /api/results`

#### AI 예측
- **무료(Preview)**: 상위 3마리 + 간단 코멘트 (검수 통과 예측만)
- **유료(Full)**: 예측권 1장 소비 → 전체 분석글 + 상세 점수
- **API**: `GET /api/predictions/race/:raceId/preview`, `POST /api/prediction-tickets/use`

#### 일일 종합 가이드 (predictions/matrix) — 리디자인 완료

- **페이지 목적**: 하루의 모든 경주 AI 예상을 한눈에 보는 "일일 종합 가이드"
- **라우트**: `/predictions/matrix`
- **UI 스타일**: 용산종합지 (전통 경마 예상지) 참고, KRA 다크 헤더
- **필터**: 날짜(오늘/어제/날짜 선택), 경마장(전체/서울/제주/부산)
- **탭**: 종합 예상표 | AI 코멘트
- **종합 예상표**: 모든 경주의 AI 예상을 매트릭스 형태로 표시 (경주정보 + 출전번호·말 이름 + AI 종합)
- **잠금 모드**: 종합 예측권 미사용 시 3경주 미리보기 + 잠금 오버레이
- **API**: `GET /api/predictions/matrix`, `GET /api/predictions/commentary`, `GET /api/prediction-tickets/matrix/access`, `POST /api/prediction-tickets/matrix/use`

#### 종합 예측권 (MATRIX Ticket)

- **가격**: 1,000원/장 (개별 판매)
- **사용 규칙**: 1일 1장 사용 → 해당 날짜 전체 종합 예상표 열람
- **중복 방지**: 같은 날짜에 이미 사용한 종합 예측권이 있으면 추가 차감 없이 접근
- **API**: `GET /api/prediction-tickets/matrix/access`, `POST /api/prediction-tickets/matrix/use`, `GET /api/prediction-tickets/matrix/balance`

### 3.2 사용자 기능 (Auth Required)

#### ~~내가 고른 말 (Picks)~~ — **서비스에서 제외**
- 기능 비활성화. Server API는 존재하나 WebApp/Mobile에서 UI·메뉴 노출하지 않음.

#### 즐겨찾기
- **대상**: RACE(경기)만 지원 (Server API)
- **동작**: 토글 (추가/삭제) — **WebApp UI 제거됨**, Server API만 유지
- **라우트**: (없음 — WebApp에서 제거)
- **API**: `POST /api/favorites/toggle`, `GET /api/favorites`

#### 랭킹
- **기준**: 예측 적중 횟수 (correctCount) 내림차순
- **내 랭킹**: 로그인 시 표시
- **라우트**: `/ranking`
- **API**: `GET /api/rankings`, `GET /api/rankings/me`

### 3.3 예측권·포인트·구독 (Monetization)

#### 예측권 획득
| 방법 | 수량 | 만료 |
|------|------|------|
| 구독 | 플랜별 totalTickets/월 | 구독 기간 내 |
| 포인트 구매 | 1장=1200pt | 30일 |
| 개별 결제 | 구매 수량 | 30일 |

#### 포인트
- **획득**: (내가 고른 말 기능 제외 — 프로모션·이벤트 등으로 지급 가능)
- **사용**: 예측권 구매 (1장=1200pt)
- **API**: `GET /api/points/me/balance`, `POST /api/points/purchase-ticket`, `GET /api/points/ticket-price`

#### 구독
- **플로우**: 플랜 선택 → 결제 → 활성화 → 매월 자동 갱신
- **취소**: 결제 기간 끝까지 유지, 남은 예측권 사용 가능
- **라우트**: `/mypage/subscriptions`, `/mypage/subscription-checkout?planId=`
- **API**: `GET /api/subscriptions/plans`, `POST /api/subscriptions/subscribe`, `POST /api/subscriptions/cancel`

**구독 플랜 (3종, 1장=500원 기준):**

| 플랜 | 표시명 | 예측권/월 | 월 가격 |
|------|--------|-----------|---------|
| LIGHT | 라이트 | 10장 | 4,900원 |
| STANDARD | 스탠다드 | 20장 | 9,900원 |
| PREMIUM | 프리미엄 | 30장 (27+3) | 14,900원 |

- 개별 구매: 1장 550원

### 3.4 알림·설정

#### 알림 설정
- **플래그**: pushEnabled(mobile만), raceEnabled, predictionEnabled, subscriptionEnabled, systemEnabled, promotionEnabled
- **이메일**: 없음
- **라우트**: `/settings/notifications`
- **API**: `GET/PUT /api/notifications/preferences`

#### 기타 설정
- **프로필 수정**: 이름, 닉네임
- **비밀번호 변경**: 현재 비밀번호 + 새 비밀번호
- **라우트**: `/profile/edit`, `/settings`

### 3.5 법적·기타 페이지

| 페이지 | 라우트 | 설명 |
|--------|--------|------|
| 이용약관 | `/legal/terms` | 서비스 이용 약관 (제1~14조, 결제·환불·면책 등) |
| 개인정보처리방침 | `/legal/privacy` | 개인정보 수집·이용·보관·제3자·정보주체 권리 등 |
| 환불·결제 정책 | `/legal/refund` | 구독·개별 구매 환불 기준, 전자상거래법 소비자 보호 |
| 404 | (자동) | 맞춤 NotFound |

---

## 4. 사용자 플로우 (대표 시나리오)

### 4.1 신규 사용자

```
1. 앱 접속 → 경주 목록 확인 (공개)
2. 경주 상세 → 출전마, 예측 미리보기 확인 (공개)
3. 전체 AI 분석 보기 → "예측권 필요" 안내
4. 회원가입(구글/이메일) → 로그인
5. 내 정보 → 예측권 0장, 포인트 0 → 구독 또는 포인트 충전 안내
```

### 4.2 구독 사용자

```
1. 구독 플랜 선택 → 결제 → 활성화
2. 매월 예측권 자동 발급
3. 경주 상세 → "예측권 1장 사용" → 전체 AI 분석 열람
```

### 4.3 무구독 사용자

```
1. 예측권 개별 구매 또는 포인트(프로모션 등)로 예측권 확보
2. 경주 상세 → 예측권 1장 사용 → 전체 AI 분석 열람
```

---

## 5. 비즈니스 규칙 요약

| 규칙 | 설명 |
|------|------|
| **사행성 제거** | 베팅/배당 없음. 정보 제공만 |
| **예측권 = 정보 열람권** | 현금 가치 없음, 환불 제한 |
| **Preview 검수** | `previewApproved: true` 예측만 무료 노출 |
| **Gemini 비용 고정** | Cron으로 미리 분석 → 사용자 수와 무관 |
| **즐겨찾기 RACE만** | 말·기수·조교사 즐겨찾기 미지원 |
| **내가 고른 말 제외** | Picks 기능 비활성화. 메뉴·UI 노출 없음 |
| **푸시 설정 mobile만** | WebView에서만 푸시 토글 노출 |
| **이메일 알림 없음** | pushEnabled 등 6개 플래그만 |

---

## 6. 기술 스택 요약

| 구분 | 기술 |
|------|------|
| **클라이언트** | Next.js (WebApp), React Native Expo (Mobile), Next.js (Admin) |
| **서버** | NestJS, TypeORM, PostgreSQL |
| **분석** | Python (pandas, numpy), python-shell |
| **AI** | Google Gemini API |
| **인증** | JWT, Google OAuth (idToken) |

---

## 7. 기능 구현 체크리스트

> 기능 개발 시 이 체크리스트를 참고하여 누락 여부를 확인합니다.

### Core (P0)

| 기능 | Server | WebApp | Mobile | 비고 |
|------|--------|--------|--------|------|
| 경주 목록 | ✅ | ✅ | ✅(WebView) | |
| 경주 상세 | ✅ | ✅ | ✅ | |
| 경주 결과 | ✅ | ✅ | ✅ | |
| AI 예측 Preview | ✅ | ✅ | ✅ | |
| AI 예측 Full | ✅ | ✅ | ✅ | 예측권 사용 |

### Features (P1)

| 기능 | Server | WebApp | Mobile | 비고 |
|------|--------|--------|--------|------|
| 인증 (구글/이메일) | ✅ | ✅ | ✅(Native Bridge) | |
| ~~내가 고른 말~~ | ✅ | ❌ (제외) | ❌ | 서비스에서 제외 |
| 즐겨찾기 | ✅ | ❌ (제거) | - | Server API RACE만 |
| 예측권 (RACE) | ✅ | ✅ | ✅ | 경주별 예측 열람 |
| 종합 예측권 (MATRIX) | ✅ | ✅ | ✅ | 일일 종합 예상표 열람, 1,000원/장 |
| 일일 종합 가이드 | ✅ | ✅ | ✅ | 용산종합지 스타일, 잠금 모드 |
| 프로필 | ✅ | ✅ | ✅ | |

### Monetization (P2)

| 기능 | Server | WebApp | Mobile | 비고 |
|------|--------|--------|--------|------|
| 포인트 | ✅ | ✅ | ✅ | |
| 구독 | ✅ | ✅ | ✅ | |
| 결제 | ✅ | ✅ | ✅ | |
| 종합 예측권 판매 | ✅ | ✅ | ✅ | 1,000원/장, 1일 1장 |
| 알림 설정 | ✅ | ✅ | ✅ | 푸시 mobile만 |
| 랭킹 | ✅ | ✅ | ✅ | |

### 기타

| 기능 | Server | WebApp | Mobile | 비고 |
|------|--------|--------|--------|------|
| 비밀번호 찾기/재설정 | ✅ | ✅ | - | |
| 이용약관·개인정보처리방침 | - | ✅ | ✅ | |
| 404 | - | ✅ | - | |
| 기수·말 분석 (마칠기삼) | ✅ | ✅ | ✅ | 선택 로드 |

---

## 8. 참조 문서

| 문서 | 용도 |
|------|------|
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md) | 시스템 흐름, 인증, 응답 포맷 |
| [API_SPECIFICATION.md](architecture/API_SPECIFICATION.md) | 전체 API 엔드포인트 |
| [BUSINESS_LOGIC.md](architecture/BUSINESS_LOGIC.md) | 상세 비즈니스 규칙 |
| [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md) | DB 스키마 |
| [UI_PATTERNS.md](features/UI_PATTERNS.md) | KRA 스타일 UI 디자인 패턴 |
| [LEGAL_NOTICE.md](legal/LEGAL_NOTICE.md) | 법적 고지사항 |

---

**마지막 업데이트**: 2026-02-19 (KRA 스타일 UI 개편, 종합 예측권 시스템, 일일 종합 가이드 반영)
