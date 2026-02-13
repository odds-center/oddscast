# Golden Race Admin 가이드

> 관리자 대시보드 (Next.js, port 3002)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Next.js 14 (Pages Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | TanStack Query |
| HTTP | Axios |
| Icons | Lucide React |

---

## 프로젝트 구조

```
admin/
├── src/
│   ├── pages/           # Next.js Pages
│   │   ├── index.tsx              # 대시보드
│   │   ├── subscription-plans.tsx
│   │   ├── single-purchase-config.tsx
│   │   ├── ai-config.tsx
│   │   ├── analytics.tsx
│   │   ├── revenue.tsx
│   │   └── ...
│   ├── components/
│   │   ├── layout/
│   │   └── common/
│   ├── lib/
│   │   ├── api/         # admin.ts (클래스 기반)
│   │   ├── utils/       # axios.ts
│   │   └── types/
│   └── styles/
└── public/
```

---

## 설치 및 실행

```bash
pnpm install
cp .env.example .env.local
pnpm dev
# → http://localhost:3002
```

---

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 대시보드 — 전체 통계 요약 |
| `/subscription-plans` | 구독 플랜 관리 (가격, 티켓 수, 할인율) |
| `/single-purchase-config` | 예측권 개별 판매 가격, VAT |
| `/ai-config` | LLM 모델, 캐싱, 배치 스케줄, 비용 한도 |
| `/analytics` | 예측 정확도, 포지션별 성능 |
| `/revenue` | 매출/비용/순이익, 월별 추이 |

---

## 환경변수

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 관리자 계정 생성

1. 일반 회원가입: `POST /api/auth/register` 또는 앱에서 가입
2. DB에서 role 변경: `UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';`

---

## 개발 가이드

### API 추가

1. `lib/types/admin.ts`에 타입 정의
2. `lib/api/admin.ts`에 API 클래스 추가
3. 컴포넌트에서 `useQuery` 또는 `useMutation` 사용

### 새 페이지 추가

1. `src/pages/`에 페이지 파일 생성
2. `components/layout/Sidebar.tsx`에 메뉴 항목 추가

---

## 배포

```bash
vercel
# 또는
railway up
```
