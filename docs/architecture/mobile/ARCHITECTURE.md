# 아키텍처 (Architecture)

본 문서는 Golden Race 앱의 전체적인 아키텍처와 데이터 흐름에 대해 설명합니다.

## 1. 전체 아키텍처 개요

Golden Race 앱은 React Native 기반의 모바일 애플리케이션으로, 백엔드 API와 통신하여 경마 정보를 제공하고 사용자 인증을 처리합니다.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Backend API   │    │   MySQL DB      │
│     Mobile App  │◄──►│   (NestJS)      │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Google Auth   │    │   KRA API       │    │   File Storage  │
│                 │    │   (한국마사회)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 2. 프론트엔드 아키텍처

### 2.1. 디렉토리 구조

```
app/
├── app/                    # Expo Router 기반 화면
│   ├── (app)/             # 인증된 사용자 화면
│   │   ├── mypage/        # 마이페이지
│   │   ├── races/         # 경주 목록/상세
│   │   └── results/       # 경주 결과
│   └── (auth)/            # 인증 화면
│       └── login.tsx      # 로그인
├── components/             # 재사용 가능한 컴포넌트
│   ├── common/            # 공통 컴포넌트
│   ├── screens/           # 화면별 컴포넌트
│   └── ui/                # UI 기본 컴포넌트
├── context/                # React Context
│   ├── AuthProvider.tsx   # 인증 상태 관리
│   └── AppThemeProvider.tsx # 테마 관리
├── lib/                    # 라이브러리 및 유틸리티
│   ├── api/               # API 클라이언트
│   ├── hooks/             # 커스텀 훅
│   └── queryClient.ts     # React Query 설정
├── constants/              # 상수 정의
└── utils/                  # 유틸리티 함수
```

### 2.2. 상태 관리

- **React Context**: 인증 상태, 테마 설정 등 전역 상태
- **React Query**: 서버 상태 관리 및 캐싱
- **Local State**: 컴포넌트별 로컬 상태

## 3. 백엔드 아키텍처

### 3.1. 기술 스택

- **Framework**: NestJS
- **Database**: MySQL
- **Authentication**: JWT + Google OAuth 2.0
- **API**: RESTful API

### 3.2. 주요 모듈

```
server/src/
├── auth/                   # 인증 모듈
├── users/                  # 사용자 관리
├── races/                  # 경주 정보
├── results/                # 경주 결과
├── race-plans/             # 경주 계획
├── kra-api/                # 한국마사회 API 연동
└── health/                 # 헬스체크
```

## 4. 데이터 흐름

### 4.1. 인증 흐름

1. **Google Sign-In**: 사용자가 Google 계정으로 로그인
2. **ID Token 획득**: Google에서 ID 토큰 발급
3. **백엔드 인증**: ID 토큰을 백엔드로 전송하여 JWT 발급
4. **세션 유지**: JWT를 사용하여 인증된 요청 처리

### 4.2. 데이터 동기화

1. **경주 데이터**: 한국마사회 API에서 정기적으로 데이터 수집
2. **사용자 데이터**: 로그인 시 사용자 정보 생성/업데이트
3. **베팅 데이터**: 사용자 베팅 내역 실시간 저장

## 5. API 설계

### 5.1. RESTful API 구조

```
/api/auth/
├── POST /google/login      # Google 로그인
├── POST /logout           # 로그아웃
└── POST /refresh          # 토큰 갱신

/api/users/
├── GET /profile           # 사용자 프로필
└── PUT /profile           # 프로필 업데이트

/api/races/
├── GET /                  # 경주 목록
├── GET /:id               # 경주 상세
└── GET /:id/results       # 경주 결과

/api/bets/
├── GET /                  # 베팅 내역
├── POST /                 # 베팅 생성
└── PUT /:id               # 베팅 수정
```

### 5.2. 응답 형식

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

## 6. 보안

### 6.1. 인증 및 권한

- **JWT 토큰**: 사용자 인증 상태 관리
- **토큰 만료**: 보안을 위한 자동 토큰 만료
- **권한 검증**: API 엔드포인트별 접근 권한 확인

### 6.2. 데이터 보호

- **HTTPS**: 모든 통신 암호화
- **입력 검증**: 사용자 입력 데이터 검증
- **SQL Injection 방지**: 파라미터화된 쿼리 사용

## 7. 성능 최적화

### 7.1. 프론트엔드

- **React Query**: 서버 상태 캐싱 및 동기화
- **Lazy Loading**: 화면별 지연 로딩
- **Image Optimization**: 이미지 최적화

### 7.2. 백엔드

- **Database Indexing**: 쿼리 성능 최적화
- **Connection Pooling**: 데이터베이스 연결 풀링
- **Caching**: 자주 사용되는 데이터 캐싱

## 8. 배포 및 운영

### 8.1. 환경별 설정

- **Development**: 로컬 개발 환경
- **Staging**: 테스트 환경
- **Production**: 운영 환경

### 8.2. 모니터링

- **Health Check**: 서비스 상태 모니터링
- **Logging**: 구조화된 로깅
- **Error Tracking**: 오류 추적 및 알림

---

**마지막 업데이트**: 2025년 10월 10일
