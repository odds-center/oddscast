# OddsCast Server

NestJS 기반 경마 예측 API 서버 (PostgreSQL, TypeORM, Python/Gemini)

## 빠른 시작

```bash
pnpm install
# DB: docs/DB_SCHEMA_FULL.sql 적용 후 DATABASE_URL 설정
pnpm run db:seed   # 스키마 안내만 출력
pnpm run dev
# → http://localhost:3001, Swagger: /docs
```

**DB/TypeORM:** [docs/guides/TYPEORM_SETUP.md](../docs/guides/TYPEORM_SETUP.md), [docs/DB_SCHEMA_FULL.sql](../docs/DB_SCHEMA_FULL.sql)
