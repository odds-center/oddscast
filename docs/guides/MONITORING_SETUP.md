# 모니터링 설정 가이드

에러 추적(Sentry), 헬스체크, 업타임 모니터링 도입 시 참고.  
**관련:** [TODO_CONTINUE.md](../TODO_CONTINUE.md) Section 2.

**Last updated:** 2026-02-24

---

## 1. 에러 모니터링 (Sentry)

### 서버 (NestJS)

1. [Sentry](https://sentry.io)에서 프로젝트 생성 후 DSN 복사.
2. 설치: `cd server && pnpm add @sentry/node`
3. `main.ts` 상단에서 `Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV })` (SENTRY_DSN 있을 때만).
4. 예외 필터에서 `Sentry.captureException(err)` 호출.
5. Railway 등 환경 변수에 `SENTRY_DSN` 추가.

### WebApp (Next.js)

- `@sentry/nextjs` 설정. `SENTRY_DSN`을 빌드/런타임 env에 설정.

### 비용

- 무료 티어: 월 약 5,000 에러. 소규모에 충분.

---

## 2. 헬스체크 / 업타임

- 서버: `GET /api/health` (또는 `GET /health`) 사용.
- UptimeRobot, Better Uptime 등에서 5분 간격 URL 모니터링 + 다운 시 알림 설정.

---

## 3. 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| SENTRY_DSN (server) | □ | server/.env, Railway Variables |
| Sentry init (main.ts) | □ | 조건부 초기화 |
| SENTRY_DSN (webapp) | □ | 선택 |
| 업타임 모니터링 URL | □ | /api/health |
| 알림 채널 | □ | Slack/이메일 등 |

완료 후 [TODO_CONTINUE.md](../TODO_CONTINUE.md) Section 2 상태 갱신.
