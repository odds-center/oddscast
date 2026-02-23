# Vercel 임시 배포 (Next + Nest)

> **임시/프로토타입용.** 프로덕션은 `SERVER_DEPLOYMENT_PLAN.md`(EC2 + PM2) 권장.

## 요약

| 앱 | Vercel 적합성 | 비고 |
|----|----------------|------|
| **webapp (Next.js)** | ✅ 적합 | 그냥 등록해서 사용 가능 |
| **server (NestJS)** | ⚠️ 제한적 | 등록 가능하나 **Python 호출·Cron** 있으면 일부 기능 동작 안 함 |

- **Next(webapp)**: Vercel 프로젝트 1개, Root Directory = `webapp`
- **Nest(server)**: Vercel 프로젝트 1개 더 만들고, Root Directory = `server` (선택 시 Python/Cron 제한 있음)

---

## 1. Webapp (Next.js) — Vercel 한 프로젝트

1. [Vercel](https://vercel.com) → New Project → 저장소 연결
2. **Root Directory** → `webapp` 지정
3. Framework: Next.js 자동 감지
4. **Environment Variables** (필요 시):
   - `NEXT_PUBLIC_API_URL` = Nest API 풀 URL (예: `https://oddscast-api.vercel.app/api`)
   - 그 외 `NEXT_PUBLIC_*`, Google Client ID 등
5. Deploy

빌드/설치가 실패하면(모노레포):  
**Install Command**를 `pnpm install`로 두고, 루트에서 설치되도록 **Root Directory**를 비우거나, 또는 Root를 `webapp`으로 두고 `pnpm install`이 워크스페이스 전체를 보게 되는지 확인. (보통 `webapp`에서 `pnpm install` 해도 워크스페이스 루트 기준으로 설치됨)

---

## 2. Server (NestJS) — Vercel에 “임시”로 올리기

Nest는 [Vercel 공식 문서](https://vercel.com/docs/frameworks/backend/nestjs)대로 **서버리스 함수 1개**로 배포 가능. `src/main.ts` 진입점 자동 감지.

### 2.1 배포 절차

1. Vercel에서 **새 프로젝트** 생성 (같은 저장소 사용)
2. **Root Directory** → `server` 지정
3. Build Command: `pnpm run build` (또는 기본값)
4. **Environment Variables**:
   - `DATABASE_URL` (PostgreSQL)
   - `JWT_SECRET`, 기타 Nest에서 쓰는 env
   - (선택) Redis, Gemini API 키 등
5. Deploy

배포 후 나온 URL(예: `https://oddscast-api.vercel.app`)을 webapp의 `NEXT_PUBLIC_API_URL`에  
`https://oddscast-api.vercel.app/api` 형태로 넣으면 됨.

### 2.2 제한사항 (이 프로젝트 기준)

| 항목 | 내용 |
|------|------|
| **Python** | 서버에서 `python3` 스폰(분석/예측) 호출 → **Vercel 서버리스에서는 실행 불가.** 해당 API는 5xx 또는 미동작 가능 |
| **Cron** | Nest `@nestjs/schedule` → 프로세스가 계속 떠 있지 않으므로 **동작 안 함.** Vercel Cron(별도 설정) 또는 외부 스케줄러 필요 |
| **용량** | 함수 번들 250MB 제한 |
| **Cold start** | 첫 요청 지연 가능 |

그래서 **임시로 API·DB 연동만 확인**할 때는 Vercel Nest 배포가 유용하고,  
**Python 분석·Cron·상시 프로세스**가 필요하면 EC2/Railway/Render 등 상시 서버가 맞음.

---

## 3. 한 줄 요약

- **webapp**: Vercel에 그냥 Nest 등록해서 쓰는 것처럼, **Next만 먼저** 한 프로젝트로 올리면 됨.
- **server**: “임시로 Nest도 Vercel에” 쓰려면 **프로젝트 하나 더** 만들어 Root = `server`로 배포 가능하되, **Python/Cron 쓰는 부분은 동작하지 않을 수 있음** → 완전한 임시/테스트용으로만 사용하는 것을 권장.
