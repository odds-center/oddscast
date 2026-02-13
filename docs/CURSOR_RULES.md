# Golden Race 프로젝트 AI 규칙

> `.cursorrules`와 동기화. Cursor AI 에이전트가 참조하는 프로젝트 규칙 문서.

---

## 최우선 원칙: 문서 우선 (Documentation First)

**모든 Planning 단계 시작 전, 반드시 `docs/` 폴더 내의 관련 문서를 먼저 읽으세요.**
사용자의 요구사항이 문서에 정의된 내용과 일치하는지 확인하고, 기존 아키텍처나 규칙을 준수해야 합니다.

---

## 프로젝트 핵심 문서

| 구분 | 문서 | 용도 |
|------|------|------|
| 서비스 명세 | `docs/SERVICE_SPECIFICATION.md` | 서비스 개요, 기능 총괄, 플로우, 체크리스트 |
| 아키텍처 | `docs/architecture/ARCHITECTURE.md` | 시스템 아키텍처, 데이터 흐름, 인증 플로우 |
| 아키텍처 | `docs/architecture/DATABASE_SCHEMA.md` | Prisma 12개 모델, ERD, Enum |
| 아키텍처 | `docs/architecture/API_SPECIFICATION.md` | 전체 API 엔드포인트 명세 |
| 아키텍처 | `docs/architecture/BUSINESS_LOGIC.md` | AI 예측, 예측권, 구독, 결제, 알림 규칙 |
| 아키텍처 | `docs/architecture/PROJECT_STRUCTURE.md` | 디렉토리 구조, 모듈별 역할 |
| 기술 명세 | `docs/specs/HORSE_RACING_SPEC.md` | 기술 스택, T-N-P-P 전략 |
| 기술 명세 | `docs/specs/COST_ANALYSIS.md` | Gemini API 비용, 캐싱 전략 |
| UI 패턴 | `docs/features/UI_PATTERNS.md` | 공용 컴포넌트, 테이블, 페이지네이션, 탭바, 테마(라이트) |
| 데이터 적재 | `docs/DATA_LOADING.md` | KRA 동기화, 출전마, Admin 수동 적재 |
| 법적 | `docs/legal/LEGAL_NOTICE.md` | 서비스 법적 고지사항 |

---

## 작업별 필수 참조 문서

| 작업 유형 | 반드시 읽어야 할 문서 |
|-----------|----------------------|
| 새 기능 기획/추가 | `SERVICE_SPECIFICATION.md` + `BUSINESS_LOGIC.md` |
| 서버 API 추가/수정 | `API_SPECIFICATION.md` + `ARCHITECTURE.md` |
| DB 스키마 변경 | `DATABASE_SCHEMA.md` + `BUSINESS_LOGIC.md` |
| 모바일 API 호출 추가 | `API_SPECIFICATION.md` + `PROJECT_STRUCTURE.md` |
| 비즈니스 로직 변경 | `BUSINESS_LOGIC.md` + `ARCHITECTURE.md` |
| UI 컴포넌트 추가/수정 | `UI_PATTERNS.md` + `PROJECT_STRUCTURE.md` |
| 결제/구독 관련 | `BUSINESS_LOGIC.md` + `COST_ANALYSIS.md` |
| AI 예측 관련 | `BUSINESS_LOGIC.md` + `HORSE_RACING_SPEC.md` |
| 알림 설정 관련 | `features/NOTIFICATION_SETTINGS.md` + `API_SPECIFICATION.md` |
| 즐겨찾기 관련 | `BUSINESS_LOGIC.md` + `API_SPECIFICATION.md` |
| 출전마/KRA 데이터 적재 | `DATA_LOADING.md` + `guides/ADMIN_GUIDE.md` |

---

## 기술 스택 (T-N-P-P)

| 구분 | 기술 |
|------|------|
| App | React Native (Expo) — TypeScript |
| Backend | NestJS (Node.js) — API 서버 + Control Tower |
| Analysis | Python (pandas, numpy) — python-shell로 실행 |
| Database | PostgreSQL — Prisma ORM |
| AI | Google Gemini API |
| Admin | Next.js |
| WebApp | Next.js — 메인 클라이언트 |

---

## 디렉토리 구조

```
goldenrace/
├── server/                     # NestJS 백엔드
├── webapp/                     # Next.js 웹앱 (메인 클라이언트)
├── mobile/                     # React Native Expo (WebView → webapp)
├── admin/                      # Next.js 관리자 패널
├── shared/                     # 공용 타입
├── docs/                       # 문서
│   ├── architecture/
│   ├── features/
│   ├── specs/
│   └── legal/
└── server_legacy_nestjs/       # 참고용
```

---

## 주의사항 (필수 준수)

1. **NestJS가 Control Tower** — Python 스크립트는 `python-shell`로 실행
2. **Python은 순수 계산만** — DB 접근 없음
3. **Server-Side Caching** — 스케줄러로 Gemini 분석 미리 실행, DB 저장
4. **Prisma ORM** — `prisma/schema.prisma` 관리
5. **Global API Prefix** — 모든 라우트 `/api` prefix
6. **응답 포맷** — `{ data, status, message? }`
7. **사행성 제거** — 베팅/배팅 없음, AI 콘텐츠 제공만
8. **폼** — `react-hook-form` 사용

---

## 핵심 규칙 요약

### 즐겨찾기
- type은 `RACE`만 지원

### 알림 설정
- 이메일 없음, 푸시만
- 푸시 토글: mobile(native WebView)에서만 UI 노출

### WebApp 클라이언트
- `lib/routes.ts` 라우트 중앙 관리
- `Layout`, `PageHeader`, `BackLink` 등 공통 컴포넌트 사용

### 타입
- 공통 타입: `shared/types/`
- 웹앱 전용: `webapp/lib/types/`

---

## TypeScript / 코드 규칙

- **any 금지** — `unknown` + type guard
- **에러**: `catch (err: unknown)` + `getErrorMessage(err)`
- **인덱스 시그니처**: `Record<string, unknown>`

---

## 코드 컨벤션

### 네이밍
- React 컴포넌트: PascalCase
- 함수·변수: camelCase
- 상수: UPPER_SNAKE
- CSS 클래스: 케밥 케이스 (`btn-primary`, `data-table`)

### 스타일
- 테이블: `data-table`, `data-table-wrapper`, 셀 내 `LinkBadge`
- 탭바: `TabBar` (variant: filled|subtle, size: sm|md)
- 뒤로가기: `BackLink`
- 버튼: `btn-primary`, `btn-secondary`

### 컴포넌트 구조
- **page/**: PageHeader, SectionCard, DataFetchState, FormInput, BackLink, FilterDateBar, FilterChips, Pagination
- **ui/**: Card, Badge, TabBar, LinkBadge, StatusBadge, RankBadge, Toggle, Dropdown, SectionTitle

---

## 상세 규칙

전체 규칙은 `.cursorrules`를 참조하세요.
