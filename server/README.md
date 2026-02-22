# OddsCast Server

NestJS 기반 경마 예측 API 서버 (PostgreSQL, Prisma, Python/Gemini)

## 빠른 시작

```bash
npm install
cp .env.example .env   # DATABASE_URL, PORT 등 설정
npm run db:generate
npm run db:init
npm run dev
# → http://localhost:3001, Swagger: /docs
```

**상세 가이드:** [docs/guides/PRISMA_SETUP.md](../docs/guides/PRISMA_SETUP.md)
