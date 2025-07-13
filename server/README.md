# Golden Race Server

한국마사회 공공데이터 API를 활용한 경마 데이터 제공 서버입니다.

## 🚀 주요 기능

- **한국마사회 API 연동**: 경마 일정, 결과, 경주계획표 데이터 제공
- **RESTful API**: 표준화된 API 엔드포인트 제공
- **TypeScript**: 타입 안전성과 개발 생산성 향상
- **간단한 구조**: 유지보수하기 쉬운 모듈화된 구조

## 📁 프로젝트 구조

```
server/
├── src/
│   ├── api/                    # API 라우트
│   │   └── routes/
│   │       ├── index.ts        # API 라우트 통합
│   │       ├── health/         # 헬스체크 라우트
│   │       ├── races/          # 경마 일정 라우트
│   │       ├── results/        # 경마 결과 라우트
│   │       └── racePlans/      # 경주계획표 라우트
│   ├── services/               # 비즈니스 로직 서비스
│   │   ├── dataSyncService.ts  # 데이터 동기화 서비스
│   │   └── kraApiService.ts    # 한국마사회 API 서비스
│   ├── config/                 # 설정 파일
│   │   └── supabase.ts         # Supabase 설정
│   ├── utils/                  # 유틸리티
│   │   └── logger.ts           # 로깅 유틸리티
│   └── index.ts                # 메인 서버 파일
├── docs/                       # 문서
├── logs/                       # 로그 파일
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **External API**: 한국마사회 공공데이터 API
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📋 API 엔드포인트

### 헬스체크

- `GET /api/health` - 기본 서버 상태 확인
- `GET /api/health/detailed` - 상세 서버 상태 확인
- `GET /api/health/ready` - 서버 준비 상태 확인
- `GET /api/health/live` - 서버 생존 상태 확인

### 경마 데이터 API

- `GET /api/races` - 경마 일정 데이터 조회
- `GET /api/results` - 경마 결과 데이터 조회
- `GET /api/race-plans` - 경주계획표 데이터 조회

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
# .env 파일을 생성하고 다음 내용을 설정하세요
touch .env
```

`.env` 파일에 다음 변수들을 설정하세요:

```env
# 환경 설정 (development | staging | production)
NODE_ENV=development

# 서버 설정
PORT=3000

# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 한국마사회 API 설정
KRA_API_KEY=your_kra_api_key
```

**환경별 자동 설정:**

- `NODE_ENV` 값에 따라 CORS, 로깅, 보안 설정이 자동으로 조정됩니다
- 개발 환경: localhost 도메인 허용, 상세 로깅, 완화된 보안
- 스테이징 환경: staging 도메인 허용, 중간 수준 로깅 및 보안
- 프로덕션 환경: 프로덕션 도메인 허용, 최소 로깅, 최고 수준 보안

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 프로덕션 빌드 및 실행

```bash
npm run build
npm start
```

## 📝 스크립트

- `npm run dev` - 개발 서버 실행 (핫 리로드)
- `npm run build` - TypeScript 컴파일
- `npm start` - 프로덕션 서버 실행
- `npm run test` - 테스트 실행
- `npm run lint` - 코드 린팅
- `npm run format` - 코드 포맷팅
- `npm run type-check` - 타입 체크

## 🛡️ 보안

- **Helmet**: 보안 헤더 설정
- **CORS**: 교차 출처 리소스 공유 제어
- **Rate Limiting**: 요청 제한 (15분당 100회)
- **Input Validation**: 입력 데이터 검증
- **Error Handling**: 안전한 에러 처리

## 📊 모니터링

- **Winston 로깅**: 구조화된 로그 출력
- **헬스체크 엔드포인트**: 서버 상태 모니터링
- **API 상태 확인**: 한국마사회 API 연결 상태 확인

## 🚀 배포

### 로컬 배포

```bash
npm run build
npm start
```
