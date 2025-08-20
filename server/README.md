# Golden Race Server

한국마사회 API를 통합하는 NestJS 기반 서버입니다.

## 🚀 기술 스택

- **Framework**: NestJS
- **Database**: MySQL 8.0
- **ORM**: TypeORM
- **API Documentation**: Swagger
- **Container**: Docker & Docker Compose

## 📋 요구사항

- Node.js 18+
- Docker & Docker Compose
- npm 또는 yarn

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
# 개발 환경
cp env.example .env

# 프로덕션 환경
cp env.prod .env
```

### 3. 데이터베이스 실행

```bash
# MySQL만 실행 (개발용)
npm run docker:mysql

# 전체 개발 환경 실행
npm run docker:dev

# 프로덕션 환경 실행
npm run docker:prod
```

### 4. 애플리케이션 실행

```bash
# 개발 모드 (핫 리로드)
npm run start:dev

# 프로덕션 모드
npm run build
npm run start:prod
```

## 🐳 Docker 명령어

### 개발 환경

```bash
# 개발 환경 시작
npm run docker:dev

# 개발 환경 중지
npm run docker:dev:down

# 개발용 이미지 빌드
npm run docker:build:dev
```

### 프로덕션 환경

```bash
# 프로덕션 환경 시작
npm run docker:prod

# 프로덕션 환경 중지
npm run docker:prod:down

# 프로덕션용 이미지 빌드
npm run docker:build:prod
```

### MySQL 관리

```bash
# MySQL 시작
npm run docker:mysql

# MySQL 중지
npm run docker:mysql:down

# 데이터베이스 초기화
npm run db:reset
```

## 📊 API 엔드포인트

- **헬스체크**: `GET /api/health`
- **API 문서**: `GET /api/docs`
- **경마 목록**: `GET /api/races`
- **경마 결과**: `GET /api/results`
- **경주계획표**: `GET /api/race-plans`
- **KRA API**: `GET /api/kra-api/*`

## 🗄️ 데이터베이스

### 연결 정보

- **Host**: localhost
- **Port**: 3306
- **Database**: goldenrace
- **Username**: goldenrace_user
- **Password**: goldenrace_password

### phpMyAdmin

- **URL**: http://localhost:8080
- **Username**: root
- **Password**: rootpassword

## 🔧 개발 도구

### 스크립트

```bash
# 개발
npm run dev              # 개발 모드 (핫 리로드)
npm run start:dev        # 개발 모드 (핫 리로드)

# 빌드
npm run build            # 프로덕션 빌드
npm run start:prod       # 프로덕션 모드

# 테스트
npm run test             # 테스트 실행
npm run test:watch       # 테스트 감시 모드
npm run test:cov         # 커버리지 포함 테스트

# 코드 품질
npm run lint             # ESLint 검사
npm run format           # Prettier 포맷팅
```

### 환경변수

| 변수명        | 설명                  | 기본값                |
| ------------- | --------------------- | --------------------- |
| `NODE_ENV`    | 실행 환경             | `development`         |
| `PORT`        | 서버 포트             | `3002`                |
| `DB_HOST`     | 데이터베이스 호스트   | `localhost`           |
| `DB_PORT`     | 데이터베이스 포트     | `3306`                |
| `DB_USERNAME` | 데이터베이스 사용자   | `goldenrace_user`     |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | `goldenrace_password` |
| `DB_DATABASE` | 데이터베이스 이름     | `goldenrace`          |
| `KRA_API_KEY` | 한국마사회 API 키     | 공공데이터 포털 키    |

## 📁 프로젝트 구조

```
src/
├── entities/           # TypeORM 엔티티
│   ├── race.entity.ts
│   ├── result.entity.ts
│   └── race-plan.entity.ts
├── health/             # 헬스체크 모듈
├── kra-api/            # KRA API 모듈
├── races/              # 경마 모듈
├── results/            # 경마 결과 모듈
├── race-plans/         # 경주계획표 모듈
├── app.module.ts       # 루트 모듈
└── main.ts             # 애플리케이션 진입점
```

## 🚀 배포

### Docker 이미지 빌드

```bash
# 개발용 이미지
docker build -f Dockerfile.dev -t goldenrace-server:dev .

# 프로덕션용 이미지
docker build -f Dockerfile -t goldenrace-server:prod .
```

### 프로덕션 실행

```bash
# 환경변수 설정
export NODE_ENV=production
export DB_PASSWORD=your-secure-password

# 프로덕션 환경 시작
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 문제 해결

### 포트 충돌

```bash
# 3306 포트 사용 중인 프로세스 확인
sudo lsof -i :3306

# MySQL 서비스 중지 (macOS)
sudo brew services stop mysql

# 프로세스 강제 종료
sudo pkill -f mysqld
```

### 데이터베이스 연결 오류

```bash
# MySQL 컨테이너 상태 확인
docker ps | grep mysql

# MySQL 로그 확인
docker logs goldenrace-mysql

# 데이터베이스 연결 테스트
docker exec goldenrace-mysql mysql -u goldenrace_user -pgoldenrace_password goldenrace -e "SELECT 1;"
```

## 📝 라이선스

MIT License

## 👥 팀

Golden Race Team
