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
│   │   ├── kra.tsx                # KRA 데이터 관리 (경주계획표·출전표 수동/Cron 동기화)
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
| `/` | 대시보드 — 주요 지표(회원·경주·결제·구독) 요약, 빠른 링크 10개 |
| `/kra` | **KRA 데이터 관리** — 단계별 수동 동기화, Cron 자동화 현황, 동기화 로그 |
| `/races` | 경주 관리 — 경주 목록, 빠른 KRA 동기화 패널 |
| `/races/[id]` | 경주 상세 — 출전마 데이터 동기화 링크 |
| `/results` | 경기 결과 — 착순·기록·배당 조회·등록·수정 (매일 17:30 자동 수집) |
| `/users` | 회원 관리 — 전체 회원 조회, 예측권 지급, 계정 활성화/비활성화 |
| `/bets` | 결제 내역 — 사용자별 결제·예측권 구매 기록 |
| `/subscription-plans` | 구독 플랜 관리 — 라이트/스탠다드/프리미엄 (가격, 예측권 수) |
| `/single-purchase-config` | 예측권 개별 판매 가격, VAT |
| `/ai-config` | AI 설정 — LLM 모델·온도·토큰·비용전략·캐싱·배치예측 |
| `/analytics` | AI 분석 — 위치별 정확도, LLM 성능, 실패 원인 추적 |
| `/revenue` | 수익 대시보드 — 구독·개별구매 매출, AI API 비용, 순이익 |
| `/statistics` | 통계 — 사용자 증가 추이, 예측권 사용량 |
| `/notifications` | 알림 관리 — 푸시 알림 전송 (전체/활성/구독자 대상) |
| `/settings` | 설정 — 시스템·AI·KRA Config 링크 |

### 구독 플랜 관리 (`/subscription-plans`)

| 플랜 | 표시명 | 기본 예측권 | 월 가격 |
|------|--------|-------------|---------|
| LIGHT | 라이트 | 10장 | 4,900원 |
| STANDARD | 스탠다드 | 20장 | 9,900원 |
| PREMIUM | 프리미엄 | 30장 (27+3) | 14,900원 |

- 개별 구매: 1장 550원 (Admin → 개별 구매 설정에서 수정 가능)
- 가격·기본/보너스 예측권 수량 수정 가능 (seed.sql upsert 반영)

### KRA 데이터 관리 (`/kra`) — 단계별 가이드

KRA 페이지는 **단계별 구조**로 설계되어 관리자가 순서대로 실행할 수 있습니다.

#### 자동 동기화 (Cron)

| 스케줄 | 작업 | API |
|--------|------|-----|
| 매주 월 03:00 | 미래 경주 계획표 (1년) | API72_2 |
| 매주 수·목 18:00 | 주말 출전표 | API72_2 + API26_2 |
| 매일 17:30 | 당일 경주 결과 | raceResult |
| 매일 18:00 | 상세정보 (훈련·장구·마체중) | 각종 detail API |
| 매주 월 02:00 | 기수 통산전적 | jockeyResult |

#### 수동 동기화 (관리자 조작 필요 시)

| 단계 | 버튼 | 용도 |
|------|------|------|
| **Step 1** | 선택일 출전표 동기화 | 해당 날짜 경주계획표(API72_2) + 출전마(API26_2) |
| **Step 1** | 미래 스케줄 전체 적재 | 오늘~1년 내 금·토·일 전체 (소요: 수분) |
| **Step 2** | 선택일 결과 동기화 | 착순·기록·배당금 |
| **Step 2** | 과거 1년 결과 적재 | 최근 1년 전체 결과 일괄 |
| **Step 3** | 상세정보 동기화 | 훈련기록, 장구(차안대·혀묶개), 마체중 변화 |
| **Step 3** | 기수 전적 동기화 | 경마장별 기수 통산 출전/승리 기록 |
| 통합 | 전체 적재 | Step 1~3 한 번에 실행 (1~2분 소요) |

#### 도움말 카드

- **HelpBox (info/warning/success)**: 각 섹션에 "언제 사용하나요?" 안내 제공
- **StepBadge**: 1→2→3 단계별 번호 표시
- **개발·백업용**: `details/summary`로 접어서 평소에는 숨김

#### 동기화 로그

- 10초마다 자동 갱신
- 엔드포인트 필터 (경주계획표, 출전표, 경주결과, 기수전적 등 11종)
- 상태: 성공/실패/진행중 (한글 + 아이콘)

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
