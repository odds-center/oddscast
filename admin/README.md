# GoldenRace Admin

Golden Race 프로젝트의 관리자 대시보드입니다.

## 기술 스택

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **UI Icons**: Lucide React

## 프로젝트 구조

\`\`\` admin/ ├── src/ │ ├── pages/ # Next.js Pages │ │ ├── index.tsx # 대시보드 │ │ ├──
subscription-plans.tsx │ │ ├── single-purchase-config.tsx │ │ ├── ai-config.tsx │ │ ├──
analytics.tsx │ │ ├── revenue.tsx │ │ └── ... │ ├── components/ # React 컴포넌트 │ │ ├── layout/ #
레이아웃 컴포넌트 │ │ └── common/ # 공통 컴포넌트 │ ├── lib/ │ │ ├── api/ # API 클라이언트 │ │ │ └──
admin.ts # Admin API (클래스 기반) │ │ ├── utils/ # 유틸리티 │ │ │ └── axios.ts # Axios 인스턴스 설
정 │ │ └── types/ # TypeScript 타입 정의 │ └── styles/ # 스타일 └── public/ # 정적 파일 \`\`\`

## 설치 및 실행

\`\`\`bash

# 의존성 설치

pnpm install

# 환경변수 설정

cp .env.example .env.local

# 개발 서버 실행 (포트 3001)

pnpm dev

# 프로덕션 빌드

pnpm build

# 프로덕션 실행

pnpm start \`\`\`

## API 패턴

Mobile 앱과 동일한 패턴을 사용합니다:

\`\`\`typescript // lib/utils/axios.ts - Axios 인스턴스 생성 export const axiosInstance =
createApiClient();

// lib/api/admin.ts - 클래스 기반 API export class AdminDashboardApi { static async getStats():
Promise<DashboardStats> { try { const response = await
axiosInstance.get('/admin/statistics/dashboard'); return handleApiResponse(response); } catch
(error) { throw handleApiError(error); } } }

// 컴포넌트에서 TanStack Query 사용 const { data, isLoading } = useQuery({ queryKey:
['dashboard-stats'], queryFn: () => adminDashboardApi.getStats(), }); \`\`\`

## 주요 페이지

### 📊 대시보드 (/)

- 전체 통계 요약
- 사용자, 경주, 베팅, 구독 현황

### 📋 구독 플랜 (/subscription-plans)

- 라이트/프리미엄 플랜 관리
- 가격, 티켓 수, 할인율 수정

### 🎫 개별 구매 설정 (/single-purchase-config)

- 예측권 개별 판매 가격 관리
- VAT 자동 계산

### 🤖 AI 설정 (/ai-config)

- LLM 모델 선택 (GPT-4 시리즈)
- 캐싱 설정 (비용 99% 절감)
- 배치 예측 스케줄
- 비용 한도 관리

### 📊 AI 분석 (/analytics)

- 예측 정확도 대시보드
- 포지션별 성능
- 제공자별 비교
- 실패 원인 분석

### 💰 수익 대시보드 (/revenue)

- 매출/비용/순이익
- 수익 구성 (구독 vs 개별)
- 월별 추이
- 구독자 규모별 시뮬레이션

## 환경변수

\`\`\`.env.local

# 서버 API URL

NEXT_PUBLIC_API_URL=http://localhost:3000/api \`\`\`

## 라이브러리

- **@tanstack/react-query** - 서버 상태 관리
- **axios** - HTTP 클라이언트
- **lodash** - 유틸리티
- **qs** - 쿼리스트링 파싱
- **date-fns** - 날짜 처리
- **clsx** - 클래스 유틸리티
- **lucide-react** - 아이콘

## 배포

\`\`\`bash

# Vercel 배포

vercel

# 또는 Railway 배포

railway up \`\`\`

## 개발 가이드

### API 추가

1. \`lib/types/admin.ts\`에 타입 정의
2. \`lib/api/admin.ts\`에 API 클래스 추가
3. 컴포넌트에서 \`useQuery\` 또는 \`useMutation\` 사용

### 새 페이지 추가

1. \`src/pages/\`에 페이지 파일 생성
2. \`components/layout/Sidebar.tsx\`에 메뉴 항목 추가
3. Layout 컴포넌트 사용

## 기여

자세한 내용은 프로젝트 루트의 [CONTRIBUTING.md](../CONTRIBUTING.md)를 참고하세요.

## 라이센스

MIT License
