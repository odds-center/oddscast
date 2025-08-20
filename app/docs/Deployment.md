# 배포 (Deployment)

본 문서는 Golden Race 앱의 배포 과정과 환경 설정에 대해 설명합니다.

## 1. 배포 환경 개요

Golden Race 앱은 다음과 같은 환경으로 배포됩니다:

- **개발 환경 (Development)**: 로컬 개발 및 테스트
- **스테이징 환경 (Staging)**: QA 및 통합 테스트
- **프로덕션 환경 (Production)**: 실제 서비스 운영

## 2. 환경별 설정

### 2.1. 개발 환경

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://localhost:3306/goldenrace_dev
JWT_SECRET=dev_secret_key
KRA_API_KEY=your_dev_kra_api_key
```

### 2.2. 스테이징 환경

```env
NODE_ENV=staging
PORT=3000
DATABASE_URL=mysql://staging_host:3306/goldenrace_staging
JWT_SECRET=staging_secret_key
KRA_API_KEY=your_staging_kra_api_key
```

### 2.3. 프로덕션 환경

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://prod_host:3306/goldenrace_prod
JWT_SECRET=prod_secret_key
KRA_API_KEY=your_prod_kra_api_key
```

## 3. 모바일 앱 배포

### 3.1. EAS Build 설정

Expo Application Services (EAS)를 사용하여 모바일 앱을 빌드하고 배포합니다.

#### 3.1.1. EAS CLI 설치

```bash
npm install -g @expo/eas-cli
```

#### 3.1.2. EAS 프로젝트 설정

```bash
eas build:configure
```

#### 3.1.3. 빌드 프로필 설정

`eas.json` 파일에서 환경별 빌드 설정을 관리합니다:

```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.2. 환경 변수 관리

`.env` 파일에 정의된 환경 변수(예: Google 클라이언트 ID)는 EAS Build 과정에서 안전하게 주입되어야 합니다. EAS Secrets를 사용하여 환경 변수를 관리하는 것이 좋습니다.

#### 3.2.1. EAS Secrets 설정

```bash
# 개발 환경
eas secret:create --scope project --name GOOGLE_CLIENT_ID_DEV --value "your_dev_client_id"

# 프로덕션 환경
eas secret:create --scope project --name GOOGLE_CLIENT_ID_PROD --value "your_prod_client_id"
```

#### 3.2.2. app.config.js에서 환경 변수 사용

```javascript
export default {
  expo: {
    name: 'Golden Race',
    slug: 'goldenrace',
    version: '1.0.0',
    extra: {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
    },
  },
};
```

### 3.3. 빌드 및 배포

#### 3.3.1. 개발용 빌드

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

#### 3.3.2. 프로덕션용 빌드

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

#### 3.3.3. 스토어 제출

```bash
eas submit --platform ios
eas submit --platform android
```

## 4. 백엔드 서버 배포

### 4.1. Docker 배포

#### 4.1.1. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

#### 4.1.2. Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - KRA_API_KEY=${KRA_API_KEY}
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=${DB_NAME}
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - '3306:3306'

volumes:
  mysql_data:
```

### 4.2. 클라우드 배포

#### 4.2.1. Google Cloud Platform

```bash
# 프로젝트 설정
gcloud config set project your-project-id

# 서비스 계정 키 설정
gcloud auth activate-service-account --key-file=service-account-key.json

# Cloud Run 배포
gcloud run deploy goldenrace-api \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated
```

#### 4.2.2. AWS

```bash
# ECR에 이미지 푸시
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.ap-northeast-1.amazonaws.com

docker tag goldenrace-api:latest your-account-id.dkr.ecr.ap-northeast-1.amazonaws.com/goldenrace-api:latest
docker push your-account-id.dkr.ecr.ap-northeast-1.amazonaws.com/goldenrace-api:latest

# ECS 서비스 업데이트
aws ecs update-service --cluster goldenrace-cluster --service goldenrace-api --force-new-deployment
```

## 5. 데이터베이스 배포

### 5.1. MySQL 설정

#### 5.1.1. 데이터베이스 생성

```sql
CREATE DATABASE goldenrace_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'goldenrace_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON goldenrace_prod.* TO 'goldenrace_user'@'%';
FLUSH PRIVILEGES;
```

#### 5.1.2. 마이그레이션 실행

```bash
# 개발 환경
npm run migration:run

# 프로덕션 환경
NODE_ENV=production npm run migration:run
```

### 5.2. 데이터 백업

#### 5.2.1. 자동 백업 스크립트

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u username -p database_name > backup_${DATE}.sql
gzip backup_${DATE}.sql
```

#### 5.2.2. 백업 보관 정책

- 일일 백업: 7일간 보관
- 주간 백업: 4주간 보관
- 월간 백업: 12개월간 보관

## 6. 모니터링 및 로깅

### 6.1. 로깅 설정

#### 6.1.1. Winston 로거 설정

```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.simple(),
    })
  );
}
```

### 6.2. 헬스체크

#### 6.2.1. 헬스체크 엔드포인트

```typescript
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

## 7. 보안 설정

### 7.1. HTTPS 설정

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: fs.readFileSync('path/to/private-key.pem'),
      cert: fs.readFileSync('path/to/certificate.pem'),
    },
  });

  await app.listen(3000);
}
bootstrap();
```

### 7.2. CORS 설정

```typescript
app.enableCors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
});
```

## 8. 배포 체크리스트

### 8.1. 배포 전 확인사항

- [ ] 모든 테스트 통과
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] SSL 인증서 설정 완료
- [ ] 백업 완료

### 8.2. 배포 후 확인사항

- [ ] 서비스 정상 동작 확인
- [ ] 데이터베이스 연결 확인
- [ ] 로그 정상 출력 확인
- [ ] 모니터링 시스템 정상 동작 확인
- [ ] 사용자 테스트 완료

## 9. 롤백 계획

### 9.1. 롤백 트리거

- 서비스 장애 발생
- 성능 저하
- 보안 취약점 발견
- 사용자 불만 증가

### 9.2. 롤백 절차

1. 이전 버전으로 즉시 배포
2. 문제 분석 및 수정
3. 수정된 버전 재배포
4. 사후 분석 및 개선점 도출
