# 폴더 아키텍처 가이드

## 📁 전체 구조 개요

Golden Race 프로젝트의 백엔드는 확장 가능하고 유지보수가 용이한 모듈형 아키텍처를 채택했습니다.

```
server/src/
├── common/                    # 공통 모듈
│   ├── config/               # 전역 설정
│   ├── constants/            # 전역 상수
│   ├── decorators/           # 커스텀 데코레이터
│   ├── filters/              # 예외 필터
│   ├── guards/               # 가드
│   ├── interceptors/         # 인터셉터
│   ├── pipes/                # 파이프
│   └── utils/                # 유틸리티 함수
├── core/                     # 핵심 모듈
│   ├── database/             # 데이터베이스 설정
│   ├── cache/                # 캐시 설정
│   └── queue/                # 큐 설정
├── modules/                  # 비즈니스 로직 모듈
│   ├── auth/                 # 인증/인가
│   ├── users/                # 사용자 관리
│   ├── races/                # 경주 관리
│   ├── results/              # 결과 관리
│   ├── race-plans/           # 경주계획표
│   └── health/               # 헬스체크
├── external-apis/            # 외부 API 연동
│   ├── common/               # 공통 API 유틸리티
│   └── kra/                  # 한국마사회 API
├── shared/                   # 공유 리소스
│   ├── entities/             # 데이터베이스 엔티티
│   ├── types/                # 타입 정의
│   └── interfaces/           # 인터페이스
├── app.module.ts             # 루트 모듈
└── main.ts                   # 애플리케이션 진입점
```

## 🏗️ 폴더별 상세 설명

### 1. `common/` - 공통 모듈

애플리케이션 전반에서 사용되는 공통 기능을 포함합니다.

#### `common/config/`

```typescript
// app.config.ts - 전역 설정
export interface AppConfig {
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  kra: KraApiConfig;
  cache: CacheConfig;
  queue: QueueConfig;
}
```

#### `common/constants/`

```typescript
// app.constants.ts - 전역 상수
export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CACHE_TTL: 300000, // 5분
};
```

#### `common/interceptors/`

```typescript
// retry.interceptor.ts - 재시도 인터셉터
@Injectable()
export class RetryInterceptor implements NestInterceptor {
  // 범용 재시도 로직
}
```

### 2. `core/` - 핵심 모듈

애플리케이션의 핵심 인프라를 담당합니다.

#### `core/database/`

- TypeORM 설정
- 데이터베이스 연결 관리
- 마이그레이션 스크립트

#### `core/cache/`

- Redis 설정
- 캐시 전략 정의
- 캐시 키 관리

### 3. `modules/` - 비즈니스 로직 모듈

각 도메인별 비즈니스 로직을 포함합니다.

#### 모듈 구조 예시 (`modules/races/`)

```
races/
├── dto/                      # 데이터 전송 객체
│   ├── create-race.dto.ts
│   ├── update-race.dto.ts
│   └── race-query.dto.ts
├── entities/                 # 엔티티 (필요시)
│   └── race.entity.ts
├── races.controller.ts       # REST API 컨트롤러
├── races.service.ts          # 비즈니스 로직
├── races.module.ts           # NestJS 모듈
└── races.repository.ts       # 데이터 접근 계층
```

### 4. `external-apis/` - 외부 API 연동

외부 서비스와의 연동을 담당합니다.

#### `external-apis/common/`

```typescript
// api-client.base.ts - 공통 API 클라이언트
export abstract class ApiClientBase {
  protected makeRequest<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>>;
  protected handleError(error: any): ApiResponse<any>;
}
```

#### `external-apis/kra/`

```
kra/
├── config/                   # KRA API 설정
├── constants/                # KRA 상수
├── dto/                      # KRA DTO
├── error-handlers/           # KRA 에러 처리
├── services/                 # KRA 서비스
├── kra-api.service.ts        # 메인 서비스
├── kra-api.controller.ts     # API 컨트롤러
├── kra-api.module.ts         # NestJS 모듈
└── kra-scheduler.service.ts  # 스케줄러
```

### 5. `shared/` - 공유 리소스

여러 모듈에서 공통으로 사용되는 리소스를 포함합니다.

#### `shared/entities/`

```typescript
// race.entity.ts - 경주 엔티티
@Entity('races')
export class Race {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  meetCode: string;

  // ... 기타 필드
}
```

#### `shared/types/`

```typescript
// api.ts - API 관련 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  responseTime?: number;
}
```

## 🎯 설계 원칙

### 1. 관심사의 분리 (Separation of Concerns)

- 각 폴더는 명확한 책임을 가짐
- 비즈니스 로직과 인프라 로직 분리
- 외부 의존성 격리

### 2. 의존성 역전 (Dependency Inversion)

- 인터페이스 기반 설계
- 추상화에 의존, 구현체에 의존하지 않음
- 테스트 가능한 구조

### 3. 단일 책임 원칙 (Single Responsibility)

- 각 클래스는 하나의 책임만 가짐
- 기능별 모듈 분리
- 명확한 API 인터페이스

### 4. 확장성 (Scalability)

- 새로운 기능 추가 용이
- 모듈 간 느슨한 결합
- 플러그인 아키텍처 지원

## 📋 네이밍 컨벤션

### 파일 네이밍

- **서비스**: `*.service.ts`
- **컨트롤러**: `*.controller.ts`
- **모듈**: `*.module.ts`
- **DTO**: `*.dto.ts`
- **엔티티**: `*.entity.ts`
- **인터페이스**: `*.interface.ts`
- **타입**: `*.types.ts`
- **설정**: `*.config.ts`
- **상수**: `*.constants.ts`

### 클래스 네이밍

- **서비스**: `UserService`, `RaceService`
- **컨트롤러**: `UserController`, `RaceController`
- **DTO**: `CreateUserDto`, `UpdateRaceDto`
- **엔티티**: `User`, `Race`

### 폴더 네이밍

- **케밥-케이스**: `race-plans`, `external-apis`
- **복수형**: `users`, `races`, `results`
- **명확한 의미**: `error-handlers`, `constants`

## 🔄 마이그레이션 가이드

### 기존 `kra-api/` → `external-apis/kra/`

1. **파일 이동**

   ```bash
   mv src/kra-api/* src/external-apis/kra/
   ```

2. **Import 경로 수정**

   ```typescript
   // Before
   import { KraApiService } from './kra-api/kra-api.service';

   // After
   import { KraApiService } from './external-apis/kra/kra-api.service';
   ```

3. **모듈 등록 업데이트**
   ```typescript
   // app.module.ts
   import { KraApiModule } from './external-apis/kra/kra-api.module';
   ```

## 🚀 향후 확장 계획

### Phase 2: 추가 외부 API

```
external-apis/
├── common/
├── kra/                      # 한국마사회 (완료)
├── weather/                  # 날씨 API
├── payment/                  # 결제 API
└── notification/             # 알림 API
```

### Phase 3: 마이크로서비스 분리

```
services/
├── auth-service/             # 인증 서비스
├── race-service/             # 경주 서비스
├── betting-service/          # 베팅 서비스
└── notification-service/     # 알림 서비스
```

## 📊 메트릭스

### 코드 품질 지표

- **모듈 응집도**: 높음
- **모듈 결합도**: 낮음
- **순환 의존성**: 없음
- **테스트 커버리지**: 목표 80%+

### 성능 지표

- **API 응답 시간**: 평균 < 500ms
- **에러율**: < 1%
- **가용성**: > 99.9%

---

> 📝 **업데이트**: 2024.03.15 - 중앙화된 외부 API 관리 구조로 개선 완료
