# Golden Race Server Architecture

## 개요

Golden Race Server는 Domain-Driven Design (DDD) 패턴을 적용한 TypeScript Express 서버입니다. 한국마사회 API와 Supabase를 연동하여 경마 데이터를 관리합니다.

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    Interfaces Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Controllers │ │   Routes    │ │ Middleware  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Services  │ │ Use Cases   │ │   DTOs      │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Entities   │ │ Repositories│ │   Services  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Repositories│ │   Services  │ │   External  │           │
│  │             │ │             │ │     APIs    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 레이어별 설명

### 1. Interfaces Layer (인터페이스 레이어)

**목적**: 외부 시스템과의 통신을 담당

**구성요소**:

- **Controllers**: HTTP 요청/응답 처리
- **Routes**: API 엔드포인트 정의
- **Middleware**: 요청 전처리 (인증, 검증, 로깅 등)
- **Types**: API 응답 타입 정의

**파일 구조**:

```
src/interfaces/
├── controllers/
│   └── DataController.ts
├── routes/
│   └── DataRoutes.ts
├── middleware/
│   ├── validation.ts
│   └── rateLimiter.ts
└── types/
    └── ApiResponse.ts
```

### 2. Application Layer (애플리케이션 레이어)

**목적**: 비즈니스 로직 조율 및 유스케이스 구현

**구성요소**:

- **Services**: 도메인 서비스 조합
- **Use Cases**: 특정 비즈니스 시나리오
- **DTOs**: 데이터 전송 객체

**파일 구조**:

```
src/application/
└── services/
    └── DataSyncService.ts
```

### 3. Domain Layer (도메인 레이어)

**목적**: 핵심 비즈니스 로직과 규칙 정의

**구성요소**:

- **Entities**: 비즈니스 엔티티 (Race, RaceResult)
- **Value Objects**: 값 객체 (RaceId, Venue 등)
- **Repositories**: 데이터 접근 인터페이스
- **Domain Services**: 도메인 특화 서비스

**파일 구조**:

```
src/domain/
├── entities/
│   ├── Race.ts
│   └── RaceResult.ts
├── repositories/
│   ├── IRaceRepository.ts
│   └── IRaceResultRepository.ts
└── services/
    └── IKraApiService.ts
```

### 4. Infrastructure Layer (인프라스트럭처 레이어)

**목적**: 외부 시스템과의 통신 및 데이터 저장

**구성요소**:

- **Repository Implementations**: 실제 데이터 접근 구현
- **External Services**: 외부 API 연동
- **Database**: 데이터베이스 연결 및 쿼리

**파일 구조**:

```
src/infrastructure/
├── repositories/
│   └── SupabaseRaceRepository.ts
└── services/
    └── KraApiService.ts
```

### 5. Shared Layer (공유 레이어)

**목적**: 모든 레이어에서 공통으로 사용되는 유틸리티

**구성요소**:

- **Interfaces**: 공통 인터페이스
- **Utils**: 유틸리티 함수
- **Types**: 공통 타입 정의

**파일 구조**:

```
src/shared/
├── interfaces/
│   └── ILogger.ts
└── utils/
    └── WinstonLogger.ts
```

## 의존성 규칙

### 1. 의존성 방향

- **Interfaces** → **Application** → **Domain** ← **Infrastructure**
- **Shared**는 모든 레이어에서 사용 가능

### 2. 의존성 주입

- 모든 의존성은 생성자를 통해 주입
- 인터페이스를 통한 느슨한 결합 유지

### 3. 레이어 간 통신

- 상위 레이어는 하위 레이어의 인터페이스만 참조
- 하위 레이어는 상위 레이어를 참조하지 않음

## 도메인 모델

### 1. Race (경마) 엔티티

```typescript
class Race {
  constructor(
    public readonly id: RaceId,
    public readonly raceNumber: RaceNumber,
    public readonly raceName: RaceName,
    public readonly date: RaceDate,
    public readonly venue: Venue,
    public readonly horses: Horse[] = []
  ) {}
}
```

### 2. RaceResult (경마 결과) 엔티티

```typescript
class RaceResult {
  constructor(
    public readonly id: RaceResultId,
    public readonly raceName: string,
    public readonly venue: string,
    public readonly date: Date,
    public readonly winner: Winner,
    public readonly results: HorseResult[]
  ) {}
}
```

## 패턴 적용

### 1. Repository Pattern

- 데이터 접근 로직을 추상화
- 도메인 로직과 데이터 접근 로직 분리

### 2. Service Layer Pattern

- 비즈니스 로직을 서비스 클래스에 캡슐화
- 트랜잭션 관리 및 도메인 서비스 조합

### 3. Dependency Injection

- 의존성을 외부에서 주입
- 테스트 용이성 및 유연성 향상

### 4. Value Object Pattern

- 도메인 개념을 값 객체로 표현
- 불변성 보장

## 확장성 고려사항

### 1. 새로운 도메인 추가

1. Domain Layer에 엔티티 및 리포지토리 인터페이스 정의
2. Infrastructure Layer에 구현체 작성
3. Application Layer에 서비스 추가
4. Interfaces Layer에 컨트롤러 및 라우트 추가

### 2. 새로운 외부 API 연동

1. Domain Layer에 서비스 인터페이스 정의
2. Infrastructure Layer에 구현체 작성
3. Application Layer에서 사용

### 3. 데이터베이스 변경

1. Infrastructure Layer의 Repository 구현체만 수정
2. 다른 레이어는 변경 불필요

## 테스트 전략

### 1. 단위 테스트

- Domain Layer: 엔티티 및 도메인 서비스
- Application Layer: 애플리케이션 서비스
- Infrastructure Layer: 리포지토리 구현체

### 2. 통합 테스트

- API 엔드포인트 테스트
- 데이터베이스 연동 테스트

### 3. E2E 테스트

- 전체 워크플로우 테스트
- 외부 API 연동 테스트
