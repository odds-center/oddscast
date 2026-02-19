# Golden Race Documentation

## 📂 Active Documentation

### 📋 서비스 명세 (Planning)

- **[`SERVICE_SPECIFICATION.md`](SERVICE_SPECIFICATION.md)** — **서비스가 무엇인지, 어떤 기능을 제공하는지** 정의. 기능 개발 시 요구사항 파악용.
- **[`MONTHLY_MAINTENANCE_COST.md`](MONTHLY_MAINTENANCE_COST.md)** — **한 달 유지비** (AI, DB, 호스팅, 결제 수수료) 항목별 명세. 예산 산정용.

### 🏗️ Architecture

- [`ARCHITECTURE.md`](architecture/ARCHITECTURE.md) — 시스템 흐름, Mobile WebView → WebApp → Server
- [`PROJECT_STRUCTURE.md`](architecture/PROJECT_STRUCTURE.md) — Server, WebApp, Mobile, Admin 구조
- [`API_SPECIFICATION.md`](architecture/API_SPECIFICATION.md) — API 엔드포인트 명세
- [`DATABASE_SCHEMA.md`](architecture/DATABASE_SCHEMA.md) — Prisma 스키마
- [`BUSINESS_LOGIC.md`](architecture/BUSINESS_LOGIC.md) — 비즈니스 로직

### 📦 Features (기능 명세)

- [`UI_PATTERNS.md`](features/UI_PATTERNS.md) — **공용 UI 패턴** (테이블, 페이지네이션, TabBar, LinkBadge, FilterDateBar 등)
- [`RACE_DETAIL_UI_SPEC.md`](features/RACE_DETAIL_UI_SPEC.md) — **경주 상세 UI** (헤더, 결과 테이블, 배당, TabBar)
- [`NOTIFICATION_SETTINGS.md`](features/NOTIFICATION_SETTINGS.md) — 알림 설정 (플랫폼별 푸시, 플래그 구조)
- [`POINT_PICK_SYSTEM.md`](features/POINT_PICK_SYSTEM.md) — 포인트·승식 시스템

### 📝 Specs (기술 명세)

- [`HORSE_RACING_SPEC.md`](specs/HORSE_RACING_SPEC.md) — NestJS + Python + PostgreSQL 기술 명세
- [`COST_ANALYSIS.md`](specs/COST_ANALYSIS.md) — Gemini API 비용 분석 & 서버 캐싱 전략
- [`PREDICTION_TICKET_PRICING_SIMULATION.md`](specs/PREDICTION_TICKET_PRICING_SIMULATION.md) — 토큰 모의 계산 기반 예측권·구독 가격 권장
- [`ANALYSIS_SPEC.md`](specs/ANALYSIS_SPEC.md) — **Python 분석 알고리즘 총괄** (레이팅·기세·경험·낙마·연쇄 낙마)
- [`KRA_API_ANALYSIS_SPEC.md`](specs/KRA_API_ANALYSIS_SPEC.md) — KRA API 선정 및 활용 전략
- [`KRA_ANALYSIS_STRATEGY.md`](specs/KRA_ANALYSIS_STRATEGY.md) — KRA 마칠기삼·기수 점수·가중치·낙마 리스크
- [`KRA_RACE_PLAN_SPEC.md`](specs/KRA_RACE_PLAN_SPEC.md) — 경주계획표 API (API72_2, 미래 일정)
- [`KRA_ENTRY_SHEET_SPEC.md`](specs/KRA_ENTRY_SHEET_SPEC.md) — 출전표 상세정보 API (API26_2, 경주 2~3일 전)
- [`KRA_EQUIPMENT_BLEEDING_SPEC.md`](specs/KRA_EQUIPMENT_BLEEDING_SPEC.md) — 출전마 장구사용 및 폐출혈 정보 API
- [`KRA_TRAINING_SPEC.md`](specs/KRA_TRAINING_SPEC.md) — 말훈련내역 API
- [`KRA_TRACK_INFO_SPEC.md`](specs/KRA_TRACK_INFO_SPEC.md) — 경주로정보 API
- [`KRA_SECTIONAL_RECORD_SPEC.md`](specs/KRA_SECTIONAL_RECORD_SPEC.md) — 경주 구간별 성적 정보 API
- [`KRA_HORSE_WEIGHT_SPEC.md`](specs/KRA_HORSE_WEIGHT_SPEC.md) — 출전마 체중 정보 API
- [`KRA_HORSE_CANCEL_SPEC.md`](specs/KRA_HORSE_CANCEL_SPEC.md) — 경주마 출전취소 정보 API
- [`KRA_RACE_RESULT_SPEC.md`](specs/KRA_RACE_RESULT_SPEC.md) — 경주성적정보 API
- [`KRA_JOCKEY_RESULT_SPEC.md`](specs/KRA_JOCKEY_RESULT_SPEC.md) — 기수통산전적비교 API
- [`KRA_ODDS_SPEC.md`](specs/KRA_ODDS_SPEC.md) — 확정배당율 통합 정보 API
- [`KRA_RATING_SPEC.md`](specs/KRA_RATING_SPEC.md) — 경주마 레이팅 정보 API
- [`KRA_RACE_HORSE_INFO_SPEC.md`](specs/KRA_RACE_HORSE_INFO_SPEC.md) — 경주마 상세정보 API

### 📖 Guides (개발 가이드)

- [`DATA_LOADING.md`](DATA_LOADING.md) — KRA 데이터 적재 (경주계획표 API72_2 + 출전표 API26_2), Cron·Admin 수동 동기화
- [`PRISMA_SETUP.md`](guides/PRISMA_SETUP.md) — Prisma 7 설정 (Accelerate, 직접 연결, 포트 구성)
- [`WEBAPP_DEVELOPMENT.md`](guides/WEBAPP_DEVELOPMENT.md) — WebApp 페이지 컴포넌트, 모바일 최적화, 구독 플로우
- [`WEBAPP_README.md`](guides/WEBAPP_README.md) — WebApp 요약 (테마, 환경변수, 라우트)
- [`ADMIN_GUIDE.md`](guides/ADMIN_GUIDE.md) — Admin 대시보드 가이드
- [`MOBILE_GUIDE.md`](guides/MOBILE_GUIDE.md) — Mobile (WebView) 앱 가이드
- [`GOOGLE_OAUTH_SETUP.md`](guides/GOOGLE_OAUTH_SETUP.md) — Google OAuth 로그인 설정 (Web + 신규/기존 회원 자동 처리)
- [`guides/authentication/GOOGLE_AUTH_SETUP.md`](guides/authentication/GOOGLE_AUTH_SETUP.md) — Mobile WebView ↔ Native 구글 로그인 흐름

### 📦 Legacy (참고용)

- [`legacy/README.md`](legacy/README.md) — server_legacy_nestjs 문서 (PostgreSQL, KRA API 등)

### ⚖️ Legal (법적 고지)

- [`LEGAL_NOTICE.md`](legal/LEGAL_NOTICE.md) — 서비스 법적 고지사항

### 🤖 AI / 규칙

- [`CURSOR_RULES.md`](CURSOR_RULES.md) — `.cursorrules`와 동기화된 프로젝트 규칙 (요약)
