# 계속 해야 할 일 (TODO — 진행 순서 정리)

> 프로젝트에서 **앞으로 진행할 작업**을 한 문서에 정리한 것입니다.  
> 우선순위와 순서는 팀 상황에 맞게 조정해서 사용하세요.  
> **규칙:** Planning 시 이 문서 참조, 작업 완료/추가 시 이 문서 갱신. (`.cursorrules`, `CURSOR_RULES.md` 반영)

**Last updated:** 2026-02-24 (Admin 배치 스케줄 UI 추가)

---

## 0. 최근 완료된 맥락 (참고)

| 구분 | 상태 | 비고 |
|------|------|------|
| TypeORM 전환 | ✅ 완료 | Prisma/PgService 제거, Entity/Repository/QueryBuilder 전용 |
| 문서 정리 | ✅ 완료 | ARCHITECTURE, DATABASE_SCHEMA, 배포·가이드, CURSOR_RULES 등 Prisma → TypeORM 반영 |
| WebApp Phase A~E | ✅ 완료 | 페이지 점검(시뮬레이터, 구독·결제, 설정·법적·인증 포함) |
| Rate limiting | ✅ 완료 | @nestjs/throttler (120 req/min, 2000 req/hour) |
| CI (lint + build) | ✅ 완료 | .github/workflows/ci.yml — push/PR 시 server + webapp 빌드 |
| 구독 PG (토스페이먼츠) | ✅ 완료 | 빌링키·첫 결제·정기 결제 크론, 결제창 연동 |
| **종료/예정·KRA 정책** | ✅ 완료 | COMPLETED는 KRA 결과 적재 시에만 설정. 날짜 기반 COMPLETED 제거. WebApp/서버는 status만 사용. [features/RACE_STATUS_AND_KRA.md](features/RACE_STATUS_AND_KRA.md) |
| **배치 스케줄(결과 조회)** | ✅ 완료 | batch_schedules 테이블·Cron 5분마다 due 작업 실행. Admin KRA 페이지에 예정/완료/실패 테이블·집계 표시. |

**관련 문서:** [TYPEORM_MIGRATION.md](TYPEORM_MIGRATION.md), [NEXT_TASKS.md](NEXT_TASKS.md), [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md), [features/RACE_STATUS_AND_KRA.md](features/RACE_STATUS_AND_KRA.md)

---

## 1. 배포·인프라 (우선 권장)

| 순서 | 항목 | 상태 | 상세 |
|------|------|------|------|
| 1 | **Railway 배포** | 준비됨 | Server + DB 띄워 실제 URL로 웹앱 연동 테스트. [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) 참고 (Docker/Nixpacks) |
| 2 | **CD 파이프라인** | 준비됨 | `.github/workflows/deploy.yml` 추가됨. `RAILWAY_TOKEN` 시크릿 설정 후 push 시 자동 배포. [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) §4.2 |
| 3 | **DB 백업** | 가이드 추가 | [guides/DB_BACKUP.md](guides/DB_BACKUP.md). pg_dump 수동 실행 또는 cron 연동은 환경별 적용 |
| 4 | **앱 스토어** | 중기 | iOS / Google Play 출시 (필요 시 별도 체크리스트) |

---

## 2. 품질·운영 (모니터링·안정성)

| 순서 | 항목 | 상태 | 상세 |
|------|------|------|------|
| 1 | **에러 모니터링** | 준비됨 | 서버 `main.ts`에 Sentry 조건부 초기화 적용. `SENTRY_DSN` 설정 시 동작. [guides/MONITORING_SETUP.md](guides/MONITORING_SETUP.md) |
| 2 | **업타임/지연 모니터링** | 가이드 추가 | [guides/MONITORING_SETUP.md](guides/MONITORING_SETUP.md) — /api/health + UptimeRobot 등 |
| 3 | **E2E/통합 테스트 보강** | 선택 | 중요 플로우(로그인, 경주 조회, 예측권) E2E 또는 API 통합 테스트 추가 |
| 4 | **부하 테스트** | 선택 | 경주일 트래픽 스파이크 시뮬레이션 |
| 5 | **정적 자산 CDN** | 선택 | CloudFront / Vercel Edge 등 (웹앱 정적 리소스) |

---

## 3. 기능·콘텐츠 (로드맵 기준)

> 상세 기획은 [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) 참고.

### 단기 (1–2개월)

| 항목 | 상태 | 비고 |
|------|------|------|
| **일일 로그인 보너스** | ✅ 완료 | `DAILY_LOGIN_BONUS_POINTS`(기본 10pt), 로그인 시 1일 1회 지급 |
| **연속 로그인 보상** | ✅ 완료 | 7일 연속 시 RACE 예측권 1장 지급. 프로필/로그인 응답에 연속 일수 노출 |
| **푸시 타이밍 개선** | 선택 | 첫 경주 30분 전 알림 등 |
| **AI 신뢰도 표시** | 선택 | 예측별 confidence(low/medium/high), 모델 버전·방법론 노출 |
| **이미지 최적화** | 선택 | 경주/말 사진 추가 시 next/image + alt 적용 ([FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) §5.4) |

### 중기 (3–4개월)

| 항목 | 상태 | 비고 |
|------|------|------|
| **Push Deep Link (Mobile)** | 서버 완료 | 모바일에서 알림 탭 시 해당 경주/페이지로 이동 — Expo deep link + WebView 연동 남음 |
| **Smart Alert 확장** | 선택 | BIG_RACE, FIRST_RACE_SOON 등 추가 알림 타입 |

### 장기 (Phase 3)

- 커뮤니티 예측 (사용자 예측 제출·리더보드)
- 고급 분석 대시보드
- 다국어 (영/일)
- AI 경주 해설

---

## 4. 기술·유지보수 (선택)

| 항목 | 상태 | 상세 |
|------|------|------|
| **TypeORM 마이그레이션 CLI 정비** | 선택 | 스키마 변경 시 `migration:generate` / `migration:run` 워크플로 정리. [TYPEORM_SETUP.md](guides/TYPEORM_SETUP.md) |
| **시드 스크립트 통일** | 선택 | PointConfig, SubscriptionPlan 등 초기 데이터 삽입 스크립트/SQL 한곳에서 관리 |
| **문서 동기화** | 진행 중 | 기능 추가/변경 시 FEATURE_ROADMAP, API_SPECIFICATION, DATABASE_SCHEMA 등 해당 문서 갱신. 프로젝트/저장소·디렉터리명은 **oddscast** 통일. 최근: 경주 상태·출전번호·로그인 보너스 반영 |

---

## 5. 지금 당장 추천 순서

1. **Railway 배포** — 서버 + DB 띄워서 실제 URL로 웹앱 연동 테스트
2. **에러 모니터링** — Sentry 등 도입
3. **CD** — push 시 자동 배포 (Railway 등 연동)
4. **DB 백업** — 프로덕션 일일 백업 자동화

---

## 6. 참고 문서 요약

| 문서 | 용도 |
|------|------|
| [NEXT_TASKS.md](NEXT_TASKS.md) | 배포·WebApp·콘텐츠·장기 할 일 요약 |
| [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) | 기능 로드맵·우선순위·구현 상태 |
| [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) | Railway 배포 절차 (GitHub Actions §4.2) |
| [SERVER_DEPLOYMENT_PLAN.md](SERVER_DEPLOYMENT_PLAN.md) | AWS/PM2/Nginx 등 상세 배포 계획 |
| [TYPEORM_SETUP.md](guides/TYPEORM_SETUP.md) | TypeORM·마이그레이션·CI/배포 |
| [MONITORING_SETUP.md](guides/MONITORING_SETUP.md) | Sentry·업타임 모니터링 설정 |
| [DB_BACKUP.md](guides/DB_BACKUP.md) | PostgreSQL 백업·pg_dump·cron |
| [WEBAPP_COMPLETENESS.md](features/WEBAPP_COMPLETENESS.md) | WebApp 완성도·배포 전 점검 |
| [WEBAPP_PAGES_PLAN.md](features/WEBAPP_PAGES_PLAN.md) | WebApp 전체 페이지 계획·실행 순서 |
| [RACE_STATUS_AND_KRA.md](features/RACE_STATUS_AND_KRA.md) | 경주 종료/예정 표시 정책·KRA 결과 적재와 COMPLETED 설정 |

---

## 7. 규칙 (Rules) — 이 문서 사용법

- **Planning / "다음에 할 일" 논의 시:** 이 문서(`TODO_CONTINUE.md`)를 먼저 확인한다.
- **작업 완료 시:** 해당 항목의 **상태**를 갱신하고, 관련 **docs도 함께 갱신**한다. (문서 갱신 규칙: `.cursorrules` §문서 갱신(Docs Update) 참고.)
- **새 작업 추가 시:**  
  - 해당 섹션(1 배포·인프라 / 2 품질·운영 / 3 기능·콘텐츠 / 4 기술·유지보수)에 행을 추가하고,  
  - 필요하면 [NEXT_TASKS.md](NEXT_TASKS.md) 또는 [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md)에도 맞춰 적는다.
- **우선순위 변경 시:** §5 추천 순서와 각 표의 순서를 팀 상황에 맞게 조정한다.
- **세부 체크리스트가 필요하면:** 이 문서에 하위 항목을 추가하거나, 별도 파일(예: `docs/tasks/railway-checklist.md`)로 나눠도 된다.

이 규칙은 `.cursorrules` 및 `docs/CURSOR_RULES.md`에 반영되어 있으며, AI 에이전트와 개발자 모두 이 문서를 기준으로 진행할 일을 관리한다.
