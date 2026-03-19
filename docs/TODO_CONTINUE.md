# 계속 해야 할 일 (TODO — 진행 순서 정리)

> 프로젝트에서 **앞으로 진행할 작업**을 한 문서에 정리한 것입니다.  
> 우선순위와 순서는 팀 상황에 맞게 조정해서 사용하세요.  
> **규칙:** Planning 시 이 문서 참조, 작업 완료/추가 시 이 문서 갱신. (`CLAUDE.md`, `.claude/rules/` 반영)

**Last updated:** 2026-03-19 (Points 모듈 제거, 홈페이지 리디자인, Welcome 페이지, shadcn/ui 마이그레이션, 온보딩 DB 저장, Discord 알림, SEO/OG 이미지, on-demand KRA 결과)

---

## 0. 최근 완료된 맥락 (참고)

| 구분 | 상태 | 비고 |
|------|------|------|
| TypeORM 전환 | ✅ 완료 | Prisma/PgService 제거, Entity/Repository/QueryBuilder 전용 |
| 문서 정리 | ✅ 완료 | ARCHITECTURE, DATABASE_SCHEMA, 배포·가이드, CURSOR_RULES 등 Prisma → TypeORM 반영 |
| WebApp Phase A~E | ✅ 완료 | 페이지 점검(시뮬레이터, 구독·결제, 설정·법적·인증 포함) |
| Rate limiting | ✅ 완료 | @nestjs/throttler (120 req/min, 2000 req/hour) |
| CI (lint + build) | ✅ 완료 | .github/workflows/ci.yml — push/PR 시 server 테스트 + server/webapp/admin 빌드 |
| 구독 PG (토스페이먼츠) | ✅ 완료 | 빌링키·첫 결제·정기 결제 크론, 결제창 연동 |
| **종료/예정·KRA 정책** | ✅ 완료 | COMPLETED는 KRA 결과 적재 시에만 설정. 날짜 기반 COMPLETED 제거. WebApp/서버는 status만 사용. [features/RACE_STATUS_AND_KRA.md](features/RACE_STATUS_AND_KRA.md) |
| **배치 스케줄(결과 조회)** | ✅ 완료 | batch_schedules 테이블·Cron 5분마다 due 작업 실행. Admin KRA 페이지에 예정/완료/실패 테이블·집계 표시. |
| **Cron 통합** | ✅ 완료 | syncResultsWhenRacesEnded·syncRealtimeResults 제거. processDueBatchSchedulesCron에 self-healing 로직(ensureResultFetchJobsForEndedRaces) 통합. 경주 종료 감지 시 자동 PENDING 잡 생성. |
| **races.service findAll 최적화** | ✅ 완료 | 5000행 인메모리 정렬→페이지네이션 방식을 DB 레벨 CAST(rcNo::INTEGER) 정렬+skip/take로 교체. |
| **경주 상세 Picks 데드코드 제거** | ✅ 완료 | CONFIG.picksEnabled=false로 실제 렌더되지 않던 HorsePickPanel, 관련 state/mutation/query 전체 제거. |
| **fetchRacePlanScheduleByYearMonth 개선** | ✅ 완료 | 월별 경주 동기화 시 미래 날짜에 대한 배치 스케줄 자동 생성 추가. |
| **bulkCreate 배치 저장** | ✅ 완료 | 결과 1건씩 save→배열 save(chunk:100)로 변경. |
| **results.tsx KST 날짜 버그** | ✅ 완료 | 'today'/'yesterday' 필터 시 UTC 기준 날짜→KST 기준(getTodayKstDate) 날짜 계산으로 수정. |
| **홈페이지 JSX 중복** | ✅ 완료 | isLoggedIn 분기로 4개 섹션 중복 제거. TodaysFortuneCard만 조건부 렌더, 나머지 공통화. |
| **서버 단위 테스트 352개** | ✅ 완료 | 전체 서비스 테스트 완료 (30 suites). referrals/analysis/payments/admin/notifications-scheduler 추가. webapp tsconfig duplicate PagesPageConfig 오류 수정. |
| **모바일 첫 화면** | ✅ 완료 | WebApp에서 네이티브 앱일 때 비로그인 → 로그인 페이지, 로그인 시 홈. AUTH_LOGOUT 연동. |
| **WebApp/Admin 에러·타입** | ✅ 완료 | API catch (err: unknown), Admin any 제거·getErrorMessage, 서버 admin body 타입 정리. |
| **Admin util 중복 제거** | ✅ 완료 | admin/utils.ts에 getTodayKstDate 추가. kra/races/predictions/subscriptions/users 페이지 로컬 함수·instanceof Error 패턴 제거. |
| **WebApp DataFetchState 표준화** | ✅ 완료 | notifications.tsx·subscriptions.tsx LoadingSpinner 직접 사용→DataFetchState로 교체. shared RaceDetailDto alias 필드 @deprecated JSDoc 추가. |
| **시드 스크립트 통일** | ✅ 완료 | `docs/db/seed.sql` (SubscriptionPlan 3종·PointConfig·PointTicketPrice·GlobalConfig). `setup.sh` 5단계: schema→seed→admin 계정 bcrypt 생성. 모두 ON CONFLICT DO NOTHING 멱등 처리. |
| **stTime 파싱 버그 수정** | ✅ 완료 | KRA stTime `"출발 :10:50"` 형식 파싱 버그 수정. admin/utils.ts에서 `replace(/^[^\d]*/, '').replace(/:/g, '')` 적용. |
| **홈 DateHeader 개선** | ✅ 완료 | 경주 종료 후 "오늘의 경주가 열렸습니다" 오류 메시지 제거. DB 기반 다음 경주일 조회로 하드코딩(금/토/일) 대체. `todayAllEnded`를 시간 기반 `isRaceActuallyEnded()`만 사용. |
| **Matrix 예측표 잠금 UX** | ✅ 완료 | 경주 정보(rcNo, meet, 출전 등)는 항상 공개. AI 예측 셀만 잠금(LockedCell 플레이스홀더). 미리보기 2행 허용. |
| **KRA 동기화 시 AI 예측 자동 생성** | ✅ 완료 | `kra.service.ts`에 `generatePredictionsForDate()` 추가. `syncAll()` 최종 단계에서 예측 생성. `processDueBatchSchedules()` 결과 적재 후 fire-and-forget 예측 생성. Admin KRA 페이지에 Step 4 "AI 예측 생성" 카드 추가. |
| **레퍼럴(추천인) 시스템** | ❌ 제거됨 | 서비스 전체 삭제 — 엔티티·모듈·API·웹앱 UI·어드민 설정·DB 스키마·seed 모두 제거. |
| **races + results 탭 통합** | ✅ 완료 | `/races?view=results` 탭으로 합침. `/results` 301 redirect. routes.ts·Layout AppBar 활성 상태·e2e 픽스처 URL/응답 구조 버그 수정. |
| **Railway 배포** | ✅ 완료 | Server + PostgreSQL Railway 배포 완료. DB oddscast 스키마(36개 테이블) 확인. 어드민 기본 계정(admin/admin1234!) 설정. |
| **모바일 UI 개선** | ✅ 완료 | chulNo(출전마 번호) 전 영역 표시. 개별/종합 예측권 분리 표기. AppBar 스크롤 hide/show 애니메이션. flex-col 버튼 레이아웃. Matrix 컴팩트 뷰 4컬럼. |
| **KRA 크론 타임존 수정** | ✅ 완료 | `@Cron` 3개에 `{ timeZone: 'Asia/Seoul' }` 누락 수정(UTC→KST). 수·목 출전표 sync 시 분석데이터도 함께 적재. |
| **경주 결과 순위 정렬 버그** | ✅ 완료 | `ordInt` 정렬에 `NULLS LAST` 추가 — 낙마/실격(ordInt=null) 말들이 1위 앞에 표시되던 문제 수정. |
| **출전마 번호(chulNo) 보존** | ✅ 완료 | entry 업데이트 시 null로 기존 chulNo 덮어쓰던 버그 수정. 출전표 sync·결과 sync 모두 적용. |
| **Discord 알림 모듈** | ✅ 완료 | DiscordModule(Global). 회원가입·서버 에러(5xx) 채널별 알림. Bot token + channel ID 방식. AllExceptionsFilter를 APP_FILTER 등록(DI 지원). |
| **당일 다경주 피로 감지** | ✅ 완료 | 12번째 분석 요소 `sdf` (same_day_fatigue). Python `_same_day_fatigue_score()` 추가. 가중치 0.03. W_HORSE 합 = 1.0 유지. |
| **AI 주관적 분석 강화** | ✅ 완료 | Gemini 프롬프트에 "분석 방침" 섹션 추가. 기수-마필 궁합, 페이스 전개, 주로 바이어스, 날씨 영향, 클래스 변경 주관 평가 등 정성적 분석 지시. |
| **Matrix previewApproved 필터 제거** | ✅ 완료 | 종합예상표는 유료 기능이므로 `previewApproved` 체크 불필요. `status=COMPLETED`인 예측 모두 표시. |
| **실시간 개별예측** | ✅ 완료 | RACE 티켓 사용 시 KRA 실시간 데이터(마체중·날씨·장비·취소) 재조회 후 fresh 예측 생성. skipCache + realtime 프롬프트. 종합예측은 배치 캐시 유지. |
| **종합예상표 한눈에 7승식** | ✅ 완료 | compact view에서 4승식→7승식 전체 표시. 가로 스크롤 + 68px+repeat(7,1fr) 그리드. |
| **KRA 동기화 NULL 덮어쓰기 수정** | ✅ 완료 | buildRaceUpsertPayload 외 6곳에서 nullable 필드 conditional spread 적용. 서로 다른 API 소스 간 데이터 보존. |
| **syncAll 출전표 재보강** | ✅ 완료 | fetchRaceResults 후 syncEntrySheet 재실행하여 결과 API에서만 생성된 entry를 출전표 데이터로 보충. |
| **syncHistoricalBackfill 강화** | ✅ 완료 | 기존 trackInfo만 → fetchDividends + syncAnalysisData(전체) 추가. 출전표 재보강 포함. |
| **연도별 전체 적재** | ✅ 완료 | POST /api/admin/kra/sync/year-stream — 경주계획표(12개월) + 과거 날짜 출전표·결과·배당률·상세정보 일괄 적재. SSE 스트리밍. |
| **어드민 경주 목록 빈 화면 수정** | ✅ 완료 | 날짜 필터 기본값이 오늘(경주 없는 평일→0건)이던 것을 빈 문자열(전체)로 변경. 필터 초기화 버튼 양쪽 뷰에서 표시. |
| **Points 모듈 전체 제거** | ✅ 완료 | 서버 모듈·컨트롤러·서비스·DTO 삭제. 엔티티 4개 삭제(PointTransaction, PointConfig, PointPromotion, PointTicketPrice). shared/types/point.types.ts 삭제. webapp/pointApi.ts·point-transactions 페이지 삭제. 로그인 보너스는 auth.service에서 직접 처리. |
| **홈페이지 리디자인** | ✅ 완료 | AIPredictionSection, WhyOddsCastSection 추가. 기존 섹션 UI 개선. |
| **Welcome 페이지** | ✅ 완료 | `/welcome` — 신규 사용자 환영 페이지. |
| **shadcn/ui 마이그레이션** | ✅ 완료 | webapp/components/ui/에 shadcn 컴포넌트 14개 추가 (Button, Badge, Card, Input, Tooltip, Switch, Select, Dialog, Tabs, Label, Separator, Alert, Skeleton, AlertDialog, Table). 기존 Badge.tsx, Card.tsx, Tooltip.tsx, Dropdown.tsx 제거. |
| **온보딩 DB 저장** | ✅ 완료 | User.hasSeenOnboarding 컬럼 추가. localStorage → DB 기반 온보딩 완료 추적. 회원가입 시 hasSeenOnboarding=false, 완료 시 API로 true 갱신. |
| **Discord 알림 모듈** | ✅ 완료 | server/src/discord/ — Global 모듈. 회원가입·서버 에러(AllExceptionsFilter) 채널별 알림. Bot token + channel ID. |
| **OG 이미지 + SEO** | ✅ 완료 | 전체 페이지 OG meta 태그 + 1200x630 OG 이미지. 페이지별 SEO 설명 추가. |
| **On-demand KRA 결과 조회** | ✅ 완료 | races.service에서 경주 상세 조회 시 결과 없으면 KRA API 직접 호출해 결과 on-demand fetch. Gemini AI 예측 생성은 KRA sync와 디커플링. |
| **Resend 메일 모듈** | ✅ 완료 | server/src/mail/ — Resend API 기반 이메일 발송 (비밀번호 리셋, 이메일 인증). RESEND_API_KEY 없으면 graceful skip. |
| **성능·SEO 최적화** | ✅ 완료 | 글자 크기·대비 감사(23 파일), 폰트 최적화, deep performance optimization. |
| **Mobile Expo→RN CLI 전환** | ✅ 완료 | React Native CLI 0.79.5 + WebView. Expo 의존성 제거. |

**관련 문서:** [TYPEORM_MIGRATION.md](TYPEORM_MIGRATION.md), [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md), [features/RACE_STATUS_AND_KRA.md](features/RACE_STATUS_AND_KRA.md)

---

## 1. 배포·인프라 (우선 권장)

| 순서 | 항목 | 상태 | 상세 |
|------|------|------|------|
| 1 | **Railway 배포** | ✅ 완료 | Server + DB Railway 배포 완료. KRA 데이터 적재, 어드민 계정 설정 완료. |
| 2 | **CD 파이프라인** | ✅ 완료 | `.github/workflows/deploy.yml` + `RAILWAY_TOKEN` 설정 완료. push 시 자동 배포 동작 확인. |
| 3 | **DB 백업** | ✅ 완료 | `.github/workflows/db-backup.yml` — 매일 03:00 KST `pg_dump` → GitHub Artifacts(90일). GitHub Secret `PROD_DATABASE_URL` 등록 필요. S3 선택적. [guides/DB_BACKUP.md](guides/DB_BACKUP.md) |
| 4 | **앱 스토어** | 중기 | iOS / Google Play 출시 (필요 시 별도 체크리스트) |

---

## 2. 품질·운영 (모니터링·안정성)

| 순서 | 항목 | 상태 | 상세 |
|------|------|------|------|
| 1 | **에러 모니터링** | ✅ 완료 | Sentry 서버+웹앱 모두 동작 확인. `SENTRY_DSN` 환경변수 설정 완료. |
| 2 | **업타임/지연 모니터링** | 가이드 추가 | [guides/MONITORING_SETUP.md](guides/MONITORING_SETUP.md) — GET /health, GET /health/detailed (prefix 제외). [API_SPECIFICATION.md](architecture/API_SPECIFICATION.md) §0 Health 명세 |
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
| **푸시 타이밍 개선** | ✅ 완료 | 첫 경주 30분 전 알림 (NotificationsSchedulerService, 금/토/일 15분마다) |
| **AI 신뢰도 표시** | ✅ 완료 | 경주 상세 예측 영역에 신뢰도(높음/보통/낮음) + winProb % 표시 |
| **이미지 최적화** | 선택 | 경주/말 사진 추가 시 next/image + alt 적용 ([FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) §5.4) |

### 중기 (3–4개월)

| 항목 | 상태 | 비고 |
|------|------|------|
| **Push Deep Link (Mobile)** | ✅ 완료 | 알림 탭 시 getLastNotificationResponseAsync → WebView initialUrl로 해당 페이지 로드 |
| **Smart Alert 확장** | ✅ 완료 | FIRST_RACE_SOON(첫 경주 30분 전) 구현. BIG_RACE는 추후 확장 시 data.type 추가 |

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
| **시드 스크립트 통일** | ✅ 완료 | `docs/db/seed.sql` 추가 (SubscriptionPlan·PointConfig·PointTicketPrice·GlobalConfig). `setup.sh` 5단계 확장(seed 적용 + bcrypt admin 계정 생성). |
| **문서 동기화** | 진행 중 | 기능 추가/변경 시 FEATURE_ROADMAP, API_SPECIFICATION, DATABASE_SCHEMA 등 해당 문서 갱신. 프로젝트/저장소·디렉터리명은 **oddscast** 통일. 최근: API 명세(Horses·Fortune·Referrals·WeeklyPreview·Activity), SERVER_COMPLETENESS, PROJECT_STRUCTURE 서버/웹앱 구조 보완, WEBAPP_COMPLETENESS·GAPS 갱신 |

---

## 5. 지금 당장 추천 순서

> 핵심 인프라(Railway, Sentry, CD, DB 백업)는 모두 완료 ✅
> 남은 선택 작업 기준으로 우선순위 정렬:

1. **앱 스토어 출시** — iOS/Google Play 배포 (별도 체크리스트)
2. **업타임 모니터링** — BetterUptime / UptimeRobot 등 `/health` 엔드포인트 등록
3. **E2E·통합 테스트 보강** — 중요 플로우 추가 (구독 결제, 매트릭스 잠금/해제)
4. **Phase 3 기능** — 커뮤니티 예측, 고급 분석 대시보드 (장기)

---

## 5.1 Plan → Todos 매핑 (작업 이어가기용)

| ID | 항목 | 출처 |
|----|------|------|
| infra-1 | Railway 배포 | §1 배포·인프라 |
| infra-2 | CD (RAILWAY_TOKEN) | §1 |
| infra-3 | DB 백업 자동화 | §1 |
| ops-1 | SENTRY_DSN 에러 모니터링 | §2 품질·운영 |
| ops-2 | 업타임 모니터링 (/health) | §2 |
| ops-3 | E2E/통합 테스트 | §2 — ✅ 완료. Playwright 설치, 228개 테스트 10파일 (auth/races/subscriptions/settings/navigation/profile/mypage/results/predictions/detail-pages). CI e2e 잡 추가. |
| feat-1 | 푸시 타이밍 개선 | §3 단기 — ✅ 완료 |
| feat-2 | AI 신뢰도 표시 | §3 — ✅ 완료 |
| feat-3 | Push Deep Link (Mobile) | §3 중기 — ✅ 완료 |
| feat-4 | 이미지 최적화 (선택) | §3 |
| tech-1 | TypeORM 마이그레이션 CLI (선택) | §4 |
| tech-2 | 시드 스크립트 통일 | §4 — ✅ 완료 |
| gap-1 | Admin 페이지별 권한/가드 점검 | WEBAPP_ADMIN_GAPS §2.1 — ✅ Layout useRequireAuth 적용 |
| gap-2 | WebApp 터치 영역·44px 점검 | WEBAPP_ADMIN_GAPS §1.3 — ✅ 완료 |
| doc-1 | 문서 동기화 유지 | §4 |

작업 완료 시 이 문서와 WEBAPP_ADMIN_GAPS 등 해당 섹션 상태를 갱신한다.

---

## 6. 참고 문서 요약

| 문서 | 용도 |
|------|------|
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
- **작업 완료 시:** 해당 항목의 **상태**를 갱신하고, 관련 **docs도 함께 갱신**한다. (문서 갱신 규칙: `CLAUDE.md` 참고.)
- **새 작업 추가 시:**  
  - 해당 섹션(1 배포·인프라 / 2 품질·운영 / 3 기능·콘텐츠 / 4 기술·유지보수)에 행을 추가하고,  
  - 필요하면 [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md)에도 맞춰 적는다.
- **우선순위 변경 시:** §5 추천 순서와 각 표의 순서를 팀 상황에 맞게 조정한다.
- **세부 체크리스트가 필요하면:** 이 문서에 하위 항목을 추가하거나, 별도 파일(예: `docs/tasks/railway-checklist.md`)로 나눠도 된다.

이 규칙은 `CLAUDE.md` 및 `.claude/rules/`에 반영되어 있으며, AI 에이전트와 개발자 모두 이 문서를 기준으로 진행할 일을 관리한다.
