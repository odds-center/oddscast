# Legacy OddsCast Server (server_legacy_nestjs)

> **참고용.** 현재 메인 서버는 `server/` (Prisma + PostgreSQL)입니다.

---

## 개요

TypeScript + PostgreSQL + TypeORM 기반 NestJS 백엔드.  
MySQL → PostgreSQL 마이그레이션 완료 버전.

---

## 주요 기능

- Google OAuth 2.0, JWT, Refresh Token
- KRA API 4개 (경주계획표, 경주기록, 출전표, 확정배당율)
- 배치 자동 수집 (매일 06:00)
- 예측(베팅) 7승식, 포인트 시스템

---

## 기술 스택

- NestJS 10, TypeScript 5, Node.js 18+
- PostgreSQL 15, TypeORM
- Passport, Winston, Docker

---

## 관련 문서 (이 폴더)

- [LEGACY_SUPABASE_SETUP.md](LEGACY_SUPABASE_SETUP.md) — PostgreSQL 설정 (레거시)
- [LEGACY_ENV_SETUP.md](LEGACY_ENV_SETUP.md) — 환경변수
- [LEGACY_MIGRATIONS.md](LEGACY_MIGRATIONS.md) — MySQL 마이그레이션
- [LEGACY_KRA_API.md](LEGACY_KRA_API.md) — KRA API 모듈
