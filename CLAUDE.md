# OddsCast - AI 경마 예측 서비스

## 프로젝트 개요

NestJS + Python + PostgreSQL + Next.js 기반 AI 경마 예측 플랫폼.
공공데이터포털 경마 데이터 + Python 수학 분석 + Gemini AI 추론으로 승부 예측.
pnpm 모노레포 구조. 패키지 매니저는 반드시 pnpm 사용.

## 브랜치 규칙 (MANDATORY)

**모든 개발 작업은 반드시 `develop` 브랜치에서 진행한다.**
- 새 기능, 버그픽스, 리팩토링 등 모든 변경은 `develop` 브랜치에 커밋/푸시
- `master` 브랜치에는 절대 직접 푸시하지 않는다
- `master` 업데이트는 사용자가 명시적으로 "master에 머지해줘" 요청할 때만 `develop → master` 머지
- `master`는 Railway 프로덕션 배포 브랜치이므로 함부로 변경 금지

## 필수 원칙 (Documentation First)

**모든 작업 전 `docs/` 관련 문서를 먼저 읽고 기존 아키텍처/규칙을 준수할 것.**

### 작업별 필수 참조 문서

| 작업 | 문서 |
|------|------|
| 새 기능 | `docs/SERVICE_SPECIFICATION.md` + `docs/architecture/BUSINESS_LOGIC.md` |
| API 추가/수정 | `docs/architecture/API_SPECIFICATION.md` + `docs/architecture/ARCHITECTURE.md` |
| DB 스키마 변경 | `docs/architecture/DATABASE_SCHEMA.md` + `docs/db/schema.sql` |
| 비즈니스 로직 | `docs/architecture/BUSINESS_LOGIC.md` |
| UI 작업 | `docs/features/UI_PATTERNS.md` + `docs/features/RACE_DETAIL_UI_SPEC.md` |
| KRA 데이터 | `docs/DATA_LOADING.md` + `docs/specs/KRA_*.md` |
| 배포/인프라 | `docs/TODO_CONTINUE.md` + `docs/RAILWAY_DEPLOYMENT.md` |
| 다음 할 일 | `docs/TODO_CONTINUE.md` (Planning 시 반드시 먼저 확인) |

### 문서 갱신 규칙 (MANDATORY)

기능/API/스키마/비즈니스 로직 변경 시 해당 `docs/` 문서를 **반드시 함께 갱신**.
갱신 대상: `TODO_CONTINUE.md`, `API_SPECIFICATION.md`, `DATABASE_SCHEMA.md`, `BUSINESS_LOGIC.md`, `WEBAPP_ADMIN_GAPS.md`, 관련 feature/spec 문서.

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| WebApp | Next.js (port 3000) | 16.1.6, React 19.2.3 |
| Server | NestJS (port 3001) | 11.1.14, Node >=20.19.0 |
| Admin | Next.js (port 3002) | 14.2.0, React 18.3.0 |
| Mobile | React Native CLI + WebView | RN 0.79.5 |
| DB | PostgreSQL + TypeORM | TypeORM 0.3.28 |
| AI | Google Gemini API | @google/generative-ai 0.24.1 |
| Analysis | Python (pandas, numpy) | python-shell |
| Shared | `@oddscast/shared` 공용 타입/DTO | workspace |
| State | Zustand (webapp 5.0, admin 4.5) | Redux 사용 금지 |
| Data | TanStack React Query | v5.90 |
| Forms | react-hook-form | 7.53.0 |
| Styling | Tailwind CSS | webapp 4.1, admin 3.4 |
| Icons | Lucide React | 0.563.0 |
| Utils | es-toolkit (lodash 대체) | 1.38.0 |
| Date | date-fns (webapp), dayjs (admin) | |
| HTTP | axios | 1.12+ |
| Fonts | Pretendard (본문), Outfit+Syne (display) | |

## 디렉토리 구조

```
oddscast/
├── server/          # NestJS 백엔드 (25+ modules in src/)
├── webapp/          # Next.js 웹앱 (40+ pages, 70+ components)
├── mobile/          # React Native CLI (WebView shell -> webapp)
├── admin/           # Next.js 관리자 (21 pages, 14 API classes)
├── shared/          # @oddscast/shared (13 type files, 5 DTOs)
├── docs/            # 프로젝트 문서 (architecture/, features/, specs/, db/)
├── scripts/         # setup.sh (env + Docker Postgres + schema)
├── CLAUDE.md        # 이 파일 (Claude Code 메인 규칙)
└── .claude/rules/   # 상세 규칙 파일들
```

## 핵심 아키텍처 규칙

1. **NestJS = Control Tower**: Python/Gemini/KRA API 호출은 모두 NestJS가 관리
2. **Python은 순수 계산**: DB 접근 없이 JSON 입출력만
3. **Server-Side Caching**: Cron으로 Gemini 분석 미리 실행 -> DB 캐싱 -> 사용자는 DB만 읽음
4. **Global API Prefix**: `app.setGlobalPrefix('api')` - 모든 라우트에 `/api` prefix (health 제외)
5. **응답 포맷**: ResponseInterceptor가 `{ data, status, message? }` 래핑
6. **사행성 제거**: 베팅/배팅 없음. AI 분석 콘텐츠 제공 서비스
7. **TypeORM**: `synchronize: false`, DDL은 `docs/db/schema.sql`
8. **Rate Limiting**: @nestjs/throttler (120 req/min, 2000 req/hour)

## 코드 규칙 (필수)

### TypeScript (최우선)
- **`any` 금지** - `unknown` + type guard 또는 구체적 타입만 사용
- **`as any` 금지** - 필요 시 `as unknown as Type`
- 에러: `catch (err: unknown)` -> `getErrorMessage(err)` 패턴
- API 응답: `ApiResponseDto<T>` 또는 shared DTO
- 공통 타입: `shared/types/`, 웹앱 전용: `webapp/lib/types/`
- 인덱스 시그니처: `[key: string]: unknown` (never `any`)

### 네이밍
- 컴포넌트/클래스: PascalCase (`Layout.tsx`, `RaceApi`)
- 함수/변수: camelCase (`getRankings`, `isLoggedIn`)
- 상수: UPPER_SNAKE (`PICK_TYPE_HORSE_COUNTS`)
- CSS: kebab-case (`btn-primary`, `data-table`)
- 라우트: kebab-case (`/ticket-history`)
- API 파일: camelCase (`authApi.ts`, `raceApi.ts`)
- 주석/커밋 메시지: **영어로 작성** (한글 금지)
- 커밋 형식: `type: short description`

### Import 순서
1. React / Next.js
2. 외부 라이브러리 (alphabetical)
3. 내부 컴포넌트 (`@/components`, `@/lib`)
4. 타입 (`import type`)

## 비즈니스 핵심 규칙

- **즐겨찾기**: RACE만 지원 (WebApp UI 제거됨, Server API만)
- **Picks (내가 고른 말)**: 서비스에서 제외 (UI 미노출, API만 존재)
- **알림**: 이메일 없음, 푸시 mobile 전용 (`window.__IS_NATIVE_APP__` 감지)
- **예측권**: RACE(경주별) + MATRIX(종합, 1일 1장 1,000원)
- **구독**: LIGHT/STANDARD/PREMIUM 3플랜, 취소 시 기간 끝까지 유지
- **Preview 검수**: `previewApproved=true` + `status=COMPLETED`인 예측만 무료 노출
- **경주 상태**: COMPLETED는 KRA 결과 적재 시에만 (날짜 기반 변경 금지)
- **로그인 보너스**: 7일 연속 로그인 시 RACE 티켓 1장 (Points 모듈 제거됨, 포인트 지급 없음)

## 빌드/실행

```bash
pnpm install                    # 의존성 설치
./scripts/setup.sh              # env 생성 + Docker Postgres + DB 스키마
cd server && pnpm run dev       # Server (3001), Swagger: /docs
pnpm run dev:webapp             # WebApp (3000)
pnpm run dev:admin              # Admin (3002)
pnpm run build                  # 전체 빌드 (server + webapp + admin)
cd server && pnpm test          # 서버 테스트
```

## 세부 규칙 파일

상세 규칙은 `.claude/rules/` 디렉토리 참조:
- `server.md` - NestJS 서버 모듈/컨트롤러/서비스/DTO/인증/Cron 규칙
- `webapp.md` - WebApp 페이지/컴포넌트/API클라이언트/스타일/테마 규칙
- `admin.md` - Admin 패널 페이지/API/컴포넌트/인증 규칙
- `database.md` - TypeORM 엔티티/스키마/마이그레이션/Enum 규칙
- `components.md` - 전체 컴포넌트 카탈로그 및 사용 패턴
- `testing.md` - 테스트/CI 규칙
- `workflow.md` - 작업 흐름/문서 갱신/커밋/배포 규칙
