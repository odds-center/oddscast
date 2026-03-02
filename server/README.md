# OddsCast Server

NestJS 기반 경마 예측 API 서버 (PostgreSQL, TypeORM, Python/Gemini)

## 빠른 시작

```bash
pnpm install
# DB: 루트에서 ./scripts/setup.sh (env + Postgres + 스키마) 후
pnpm run dev
# → http://localhost:3001, Swagger: /docs
```

**DB/TypeORM:** [docs/guides/TYPEORM_SETUP.md](../docs/guides/TYPEORM_SETUP.md), [docs/db/schema.sql](../docs/db/schema.sql)
