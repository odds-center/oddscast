# GoldenRace Admin

GoldenRace 경마 플랫폼 관리자 페이지

## 기술 스택

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **API Client**: Axios
- **Data Fetching**: React Query
- **Icons**: Lucide React

## 시작하기

### 전제 조건

- Node.js 18 이상
- pnpm 8 이상

pnpm이 설치되어 있지 않다면:

```bash
npm install -g pnpm
```

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_APP_NAME=GoldenRace Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001)을 열어 확인하세요.

## 프로젝트 구조

```
admin/
├── src/
│   ├── pages/              # Next.js 페이지
│   │   ├── _app.tsx        # App 컴포넌트
│   │   ├── _document.tsx   # Document 컴포넌트
│   │   ├── index.tsx       # 대시보드
│   │   └── login.tsx       # 로그인
│   ├── components/         # 컴포넌트
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   ├── common/         # 공통 컴포넌트
│   │   └── dashboard/      # 대시보드 컴포넌트
│   ├── lib/                # 라이브러리
│   │   ├── api/            # API 클라이언트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── types/          # 타입 정의
│   │   └── utils.ts        # 유틸리티 함수
│   └── styles/             # 스타일
│       └── globals.css     # 전역 스타일
├── public/                 # 정적 파일
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 주요 기능

### 인증

- 관리자 로그인/로그아웃
- JWT 기반 인증
- 자동 토큰 갱신

### 대시보드

- 실시간 통계
- 주요 지표 모니터링
- 최근 활동 내역

### 회원 관리

- 회원 목록 조회
- 회원 정보 수정
- 회원 차단/해제

### 경주 관리

- 경주 일정 관리
- 경주 정보 수정
- 경주 결과 입력

### 베팅 관리

- 베팅 내역 조회
- 베팅 통계
- 이상 베팅 모니터링

### 통계

- 매출 통계
- 사용자 통계
- 경주 통계

## 개발 가이드

### 새로운 페이지 추가

1. `src/pages/` 디렉토리에 새 파일 생성
2. Layout 컴포넌트로 감싸기
3. Sidebar에 메뉴 추가

예시:

```tsx
import Layout from '@/components/layout/Layout';

export default function NewPage() {
  return (
    <Layout>
      <h1>새 페이지</h1>
    </Layout>
  );
}
```

### API 클라이언트 사용

```tsx
import { usersApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });

  // ...
}
```

### 인증 상태 사용

```tsx
import { useAuth } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuth();

  // ...
}
```

## 빌드

프로덕션 빌드를 생성하려면:

```bash
pnpm build
pnpm start
```

## 유용한 명령어

```bash
# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린트 체크
pnpm lint

# 타입 체크
pnpm type-check

# 캐시 정리 및 재설치
pnpm reinstall
```

## 환경 변수

| 변수                      | 설명              | 기본값                  |
| ------------------------- | ----------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`     | 백엔드 API URL    | `http://localhost:3000` |
| `NEXT_PUBLIC_API_TIMEOUT` | API 타임아웃 (ms) | `30000`                 |
| `NEXT_PUBLIC_APP_NAME`    | 앱 이름           | `GoldenRace Admin`      |
| `NEXT_PUBLIC_APP_VERSION` | 앱 버전           | `1.0.0`                 |

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
