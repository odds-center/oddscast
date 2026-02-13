# 🏇 Golden Race — AI 경마 승부예측 서비스

**NestJS + Python + PostgreSQL + React Native (WebView)** 기반의 경마 AI 예측 플랫폼

> 공공데이터포털 경마 데이터 + Python 수학 분석 + Gemini AI 추론을 결합한 승부 예측 서비스

---

## 🏗️ 아키텍처

```
📱 Mobile (Expo)  ──WebView──→  🌐 WebApp (Next.js)  ──HTTP──→  🖥️ NestJS Server  ──→  🗄️ PostgreSQL
🖥️ Admin (Next.js)  ────────────────────────────────────HTTP──→  🖥️ NestJS Server
```

| 구분         | 기술                  | 역할                            |
| ------------ | --------------------- | ------------------------------- |
| **Mobile**   | React Native (Expo)   | WebView로 WebApp base URL 로드  |
| **WebApp**   | Next.js               | 반응형 웹 (Desktop/Mobile 자동 전환) |
| **Backend**  | NestJS (Node.js)      | API 서버 + Control Tower        |
| **Admin**    | Next.js               | 관리자 대시보드                 |
| **Database** | PostgreSQL (Supabase) | 관계형 데이터 관리              |
| **AI**       | Google Gemini API     | 분석 기반 승부 예측 코멘트      |

---

## 📂 프로젝트 구조

```
goldenrace/
├── server/     # NestJS 백엔드 (port 3001)
├── webapp/     # Next.js 웹앱 - Desktop/Mobile (port 3000)
├── mobile/     # React Native Expo - WebView → WebApp (port 3006)
├── admin/      # Next.js 관리자 패널 (port 3002)
├── shared/     # 공유 타입
└── docs/       # 문서
```

---

## 🚀 시작하기

### 1. Server (NestJS)

```bash
cd server
npm install
cp .env.example .env  # DATABASE_URL, PORT=3001 등 설정
npm run db:generate   # Prisma Client 생성
npm run db:init      # 스키마 반영 + seed.sql 초기 데이터
npm run dev
# → http://localhost:3001
# Swagger: http://localhost:3001/docs
```

### 2. WebApp (Next.js)

```bash
cd webapp
npm install
npm run dev
# → http://localhost:3000
```

### 3. Admin

```bash
cd admin
pnpm install
pnpm dev
# → http://localhost:3002
```

### 4. Mobile (Expo)

```bash
cd mobile
npm install
npm run start
# Metro: port 3006, WebView에서 WebApp 로드 (dev: http://localhost:3000)
```

---

## 📚 문서

- **[문서 인덱스](docs/README.md)** — 전체 문서 목록
- **[기술 명세](docs/specs/HORSE_RACING_SPEC.md)** — NestJS + Python + PostgreSQL 명세
- **[비용 분석](docs/specs/COST_ANALYSIS.md)** — Gemini API 비용 & 서버 캐싱 전략
- **[법적 고지](docs/legal/LEGAL_NOTICE.md)** — 서비스 법적 고지사항

---

## ⚖️ 법적 고지

본 서비스는 **AI 예측 정보 제공 서비스**입니다. 실제 마권 구매는 한국마사회 공식 채널에서만
가능합니다.
