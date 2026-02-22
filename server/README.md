# OddsCast Server

NestJS 기반 경마 예측 API 서버 (PostgreSQL, Prisma, Python/Gemini)

## 빠른 시작

```bash
pnpm install
# 루트에서 env 생성: ../scripts/setup-env.sh (server/.env 생성 + prisma generate)
pnpm run db:init
pnpm run dev
# → http://localhost:3001, Swagger: /docs
```

**상세 가이드:** [docs/guides/PRISMA_SETUP.md](../docs/guides/PRISMA_SETUP.md)
