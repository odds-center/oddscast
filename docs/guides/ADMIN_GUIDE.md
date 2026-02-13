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
│   │   ├── kra.tsx                # KRA 데이터 관리 (출전표 수동 동기화)
│   │   ├── races/
│   │   ├── results/
│   │   ├── users/
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
| `/kra` | **KRA 데이터 관리** — 출전표·경주 결과·상세정보 수동 동기화, 동기화 로그 |
| `/races` | 경주 관리 — 경주 목록, KRA 동기화 버튼 |
| `/races/[id]` | 경주 상세 — 출전마 데이터 동기화 링크 |
| `/results` | 경기 결과 |
| `/users` | 회원 관리 |
| `/subscription-plans` | 구독 플랜 관리 (가격, 티켓 수, 할인율) |
| `/single-purchase-config` | 예측권 개별 판매 가격, VAT |
| `/ai-config` | LLM 모델, 캐싱, 배치 스케줄, 비용 한도 |
| `/analytics` | 예측 정확도, 포지션별 성능 |
| `/revenue` | 매출/비용/순이익, 월별 추이 |

### KRA 데이터 관리 (`/kra`)

웹앱에서 **출전마 정보가 없습니다**가 뜰 때 사용:

1. 사이드바 → **KRA 데이터** 이동
2. 날짜 선택 후 **출전표 동기화** 버튼 클릭
3. KRA 출전표(경주 + 출전마)가 DB에 적재됨

| 버튼 | 설명 |
|------|------|
| 출전표 동기화 | 경주 계획 + 출전마(말·기수·조교사) |
| 경주 결과 | 당일 경주 결과 |
| 상세정보 | 훈련·장구·체중 등 |
| 기수 전적 | 기수 통산전적 |
| 전체 적재 | 출전표 → 결과 → 상세 → 기수 순 실행 |
| 샘플 경주 적재 | KRA 키 없이 개발용 mock |
| 과거 데이터 적재 | 기간 지정 일괄 백업 |

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
