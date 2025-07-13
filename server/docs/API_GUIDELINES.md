# RESTful API 가이드라인

## 개요

Golden Race Server의 RESTful API는 일관성 있고 예측 가능한 인터페이스를 제공합니다. 이 문서는 API 설계 원칙과 규칙을 정의합니다.

## 기본 원칙

### 1. RESTful 설계 원칙

- **리소스 중심**: URL은 리소스를 나타냄
- **HTTP 메서드 활용**: GET, POST, PUT, DELETE 적절히 사용
- **상태 없는 통신**: 각 요청은 독립적
- **일관된 응답 형식**: 모든 응답은 동일한 구조

### 2. URL 설계 규칙

- **소문자 사용**: 모든 URL은 소문자
- **복수형 사용**: 리소스는 복수형으로 표현
- **계층 구조**: `/api/version/resource` 형태
- **쿼리 파라미터**: 필터링, 정렬, 페이지네이션에 사용

## URL 구조

### 기본 패턴

```
https://api.goldenrace.com/v1/{resource}/{id}?{query}
```

### 예시

```
GET    /api/v1/races                    # 경마 목록 조회
GET    /api/v1/races/123                # 특정 경마 조회
POST   /api/v1/races                    # 새 경마 생성
PUT    /api/v1/races/123                # 경마 수정
DELETE /api/v1/races/123                # 경마 삭제

GET    /api/v1/races?venue=서울         # 필터링
GET    /api/v1/races?date=2024-12-25    # 날짜별 조회
GET    /api/v1/races?page=1&limit=10    # 페이지네이션

# 경주계획표 API
GET    /api/race-plans/today            # 오늘의 경주계획표
GET    /api/race-plans/date/2024-12-25  # 특정 날짜 경주계획표
GET    /api/race-plans/meet/1/2024-12-25 # 특정 경마장 경주계획표
GET    /api/race-plans/upcoming?days=7  # 향후 경주계획표
GET    /api/race-plans/123              # 특정 경주계획표 상세
POST   /api/race-plans/sync             # 경주계획표 동기화
POST   /api/race-plans/sync/2024-12-25  # 특정 날짜 동기화
```

## HTTP 메서드 사용

### GET

- **목적**: 리소스 조회
- **특징**: 캐시 가능, 멱등성 보장
- **예시**: `GET /api/v1/races`

### POST

- **목적**: 리소스 생성
- **특징**: 새로운 리소스 생성
- **예시**: `POST /api/v1/sync`

### PUT

- **목적**: 리소스 전체 교체
- **특징**: 멱등성 보장
- **예시**: `PUT /api/v1/races/123`

### PATCH

- **목적**: 리소스 부분 수정
- **특징**: 부분 업데이트
- **예시**: `PATCH /api/v1/races/123`

### DELETE

- **목적**: 리소스 삭제
- **특징**: 멱등성 보장
- **예시**: `DELETE /api/v1/races/123`

## 응답 형식

### 성공 응답

```typescript
interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 에러 응답

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  timestamp: string;
}
```

### 예시 응답

#### 성공 응답

```json
{
  "success": true,
  "data": {
    "id": "20241225_1",
    "raceNumber": 1,
    "raceName": "서울 1경주",
    "date": "2024-12-25T00:00:00.000Z",
    "venue": "서울"
  },
  "message": "Race retrieved successfully",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

#### 에러 응답

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Race with id 123 not found",
  "code": "RACE_001",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

## 상태 코드

### 2xx 성공

- **200 OK**: 요청 성공
- **201 Created**: 리소스 생성 성공
- **204 No Content**: 성공했지만 응답 본문 없음

### 4xx 클라이언트 에러

- **400 Bad Request**: 잘못된 요청
- **401 Unauthorized**: 인증 필요
- **403 Forbidden**: 권한 없음
- **404 Not Found**: 리소스 없음
- **409 Conflict**: 리소스 충돌
- **422 Unprocessable Entity**: 검증 실패
- **429 Too Many Requests**: 요청 한도 초과

### 5xx 서버 에러

- **500 Internal Server Error**: 서버 내부 에러
- **502 Bad Gateway**: 게이트웨이 에러
- **503 Service Unavailable**: 서비스 불가

## 쿼리 파라미터

### 필터링

```
GET /api/v1/races?venue=서울&date=2024-12-25
```

### 정렬

```
GET /api/v1/races?sort=date&order=desc
```

### 페이지네이션

```
GET /api/v1/races?page=1&limit=10
```

### 검색

```
GET /api/v1/races?search=서울
```

## 인증 및 보안

### API 키 인증

```http
Authorization: Bearer YOUR_API_KEY
```

### Rate Limiting

- **일반 요청**: 100 requests/15min
- **동기화 요청**: 10 requests/hour
- **API 키 요청**: 1000 requests/15min

### CORS 설정

```typescript
cors({
  origin: ['http://localhost:3000', 'https://goldenrace.com'],
  credentials: true,
});
```

## 검증 규칙

### 날짜 형식

- **형식**: `YYYY-MM-DD`
- **예시**: `2024-12-25`
- **검증**: ISO 8601 표준

### 경마장

- **허용값**: `서울`, `부산`, `제주`, `광주`, `대구`
- **대소문자**: 구분하지 않음

### 페이지네이션

- **page**: 1 이상의 정수
- **limit**: 1-100 사이의 정수

## 에러 코드

### 도메인별 에러 코드

```
RACE_001: Race not found
RACE_002: Invalid race date
RACE_003: Race already exists

SYNC_001: Sync failed
SYNC_002: API rate limit exceeded
SYNC_003: Invalid sync date

API_001: Invalid API key
API_002: Rate limit exceeded
API_003: Validation failed
```

## 버전 관리

### URL 버전 관리

```
/api/v1/races     # 현재 버전
/api/v2/races     # 향후 버전
```

### 버전 호환성

- **하위 호환성**: 새로운 필드 추가는 허용
- **상위 호환성**: 기존 필드 제거는 금지
- **마이그레이션**: 점진적 마이그레이션 지원

## 문서화

### Swagger/OpenAPI

- **URL**: `/api/docs`
- **형식**: OpenAPI 3.0
- **자동 생성**: 코드에서 자동 생성

### 예시 요청/응답

- 모든 엔드포인트에 예시 포함
- 성공/실패 케이스 모두 문서화

## 모니터링

### 로깅

- **요청 로그**: 모든 API 요청 기록
- **에러 로그**: 에러 발생 시 상세 정보 기록
- **성능 로그**: 응답 시간 측정

### 메트릭

- **요청 수**: 엔드포인트별 요청 수
- **응답 시간**: 평균/최대 응답 시간
- **에러율**: 에러 발생 비율

## 테스트

### 단위 테스트

- **컨트롤러 테스트**: 각 엔드포인트 테스트
- **검증 테스트**: 입력 검증 로직 테스트

### 통합 테스트

- **API 테스트**: 전체 API 워크플로우 테스트
- **데이터베이스 테스트**: 데이터베이스 연동 테스트

### 성능 테스트

- **부하 테스트**: 동시 요청 처리 능력 테스트
- **스트레스 테스트**: 한계 상황 테스트
