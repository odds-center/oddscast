# KRA API 통합 가이드

## 📋 개요

한국마사회(KRA) Open API를 활용한 경마 데이터 연동 시스템입니다. 중앙화된 설정 관리, 체계적인 에러 처리, 그리고 안정적인 데이터 수집을 제공합니다.

## 🏗️ 아키텍처

### 폴더 구조

```
server/src/external-apis/kra/
├── config/
│   └── kra-api.config.ts          # 중앙화된 API 설정
├── constants/
│   └── kra-error-codes.ts         # KRA 에러 코드 상수
├── dto/
│   ├── kra-race-plan.dto.ts       # 경주계획표 DTO
│   └── kra-dividend.dto.ts        # 확정배당율 DTO
├── error-handlers/
│   └── kra-error.handler.ts       # 전용 에러 처리기
├── services/
│   └── kra-dividend.service.ts    # 확정배당율 전용 서비스
├── kra-api.service.ts             # 메인 KRA API 서비스
├── kra-api.controller.ts          # REST API 컨트롤러
├── kra-api.module.ts              # NestJS 모듈
└── kra-scheduler.service.ts       # 자동 데이터 수집 스케줄러
```

## 🔧 주요 기능

### 1. 중앙화된 설정 관리

**파일**: `config/kra-api.config.ts`

```typescript
export const KRA_API_ENDPOINTS = {
  RACE_PLANS: {
    name: 'Race Plans API',
    url: 'http://apis.data.go.kr/B551015/API2_2/raceSchedule',
    description: '경주계획표 API',
    dailyLimit: 10000,
    rateLimit: 100, // 분당 100회
  },
  DIVIDEND_RATES: {
    name: 'Dividend Rates API',
    url: 'http://apis.data.go.kr/B551015/API160/integratedInfo',
    description: '확정배당율 API',
    dailyLimit: 10000,
    rateLimit: 100,
  },
  // ... 기타 엔드포인트
};
```

**특징**:

- 모든 KRA API 엔드포인트 중앙 관리
- 일일/분당 요청 제한 설정
- 환경변수 기반 동적 설정

### 2. 체계적인 에러 처리

**파일**: `constants/kra-error-codes.ts`, `error-handlers/kra-error.handler.ts`

#### KRA API 에러 코드 매핑

```typescript
export const KRA_ERROR_CODES = {
  APPLICATION_ERROR: {
    code: '1',
    message: 'APPLICATION_ERROR',
    description: '어플리케이션 에러',
    retryable: false,
    action: '관리자에게 문의',
    retryDelay: 0,
  },
  LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR: {
    code: '22',
    message: 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR',
    description: '서비스 요청제한횟수 초과에러',
    retryable: true,
    action: '일일 요청 제한 확인, 다음날 재시도',
    retryDelay: 24 * 60 * 60 * 1000, // 24시간
  },
  // ... 기타 에러 코드
};
```

#### 에러 카테고리 분류

- **AUTHENTICATION**: 인증 관련 에러 (30, 31, 32)
- **RATE_LIMIT**: 요청 제한 에러 (22)
- **VALIDATION**: 파라미터 검증 에러 (10)
- **SERVICE**: 서비스 관련 에러 (12, 20)
- **SYSTEM**: 시스템 에러 (1, 99)

### 3. 확정배당율 API 연동

**파일**: `dto/kra-dividend.dto.ts`, `services/kra-dividend.service.ts`

#### API160_1 명세 준수

```typescript
export class KraDividendItem {
  meet: string; // 시행경마장명 (서울, 제주, 부산)
  rcDate: string; // 경주일자 (YYYYMMDD)
  rcNo: string; // 경주번호
  pool: string; // 승식 (단승식, 연승식)
  chulNo: string; // 1착마출주번호
  chulNo2: string; // 2착마출주번호
  chulNo3: string; // 3착마출주번호
  odds: string; // 확정배당율
}
```

#### 다양한 조회 메서드

- `getDividendRatesByMeet()`: 경마장별 조회
- `getDividendRatesByRace()`: 특정 경주 조회
- `getDividendRatesByPool()`: 승식별 조회
- `getDividendRatesByMonth()`: 월별 조회

### 4. 자동 데이터 수집

**파일**: `kra-scheduler.service.ts`

#### 스케줄링 작업

```typescript
@Cron('0 0 * * *') // 매일 자정
async resetDailyUsage() {
  this.dailyUsage.clear();
  this.logger.log('Daily API usage reset completed');
}

@Cron('0 9-18 * * *') // 평일 9시-18시 매시간
async collectRacePlans() {
  await this.collectRacePlansForAllMeets();
}
```

**특징**:

- 일일 API 사용량 자동 리셋
- 운영시간 내 자동 데이터 수집
- API 제한 준수

## 📊 API 명세

### 확정배당율 API (API160_1)

#### 기본 정보

- **엔드포인트**: `http://apis.data.go.kr/B551015/API160/integratedInfo`
- **응답시간**: 평균 500ms
- **초당 트랜잭션**: 30 tps
- **일일 제한**: 10,000회

#### 요청 파라미터

| 항목명     | 설명              | 타입   | 필수 | 예시                      |
| ---------- | ----------------- | ------ | ---- | ------------------------- |
| ServiceKey | API 서비스 인증키 | string | ✅   | -                         |
| numOfRow   | 페이지 당 건수    | number | ✅   | 10                        |
| pageNo     | 페이지 번호       | number | ✅   | 1                         |
| pool       | 승식구분          | string | ❌   | WIN, PLC                  |
| rc_date    | 경주일            | string | ❌   | 20190504                  |
| rc_month   | 경주월            | string | ❌   | 201905                    |
| rc_no      | 경주번호          | string | ❌   | 1                         |
| meet       | 시행경마장구분    | string | ❌   | 1(서울), 2(제주), 3(부산) |

#### 응답 파라미터

| 항목명  | 설명          | 타입   | 예시     |
| ------- | ------------- | ------ | -------- |
| meet    | 시행경마장명  | string | 서울     |
| rcDate  | 경주일자      | string | 20190504 |
| rcNo    | 경주번호      | string | 1        |
| pool    | 승식          | string | 단승식   |
| chulNo  | 1착마출주번호 | string | 1        |
| chulNo2 | 2착마출주번호 | string | 0        |
| chulNo3 | 3착마출주번호 | string | 0        |
| odds    | 확정배당율    | string | 1.9      |

## 🔄 사용 예시

### 1. 확정배당율 조회

```typescript
// 서비스 주입
constructor(private kraDividendService: KraDividendService) {}

// 특정 경마장의 오늘 배당율 조회
const todayDividends = await this.kraDividendService.getDividendRatesByMeet(
  '1', // 서울
  '20240315', // 2024년 3월 15일
  'WIN' // 단승식
);

// 특정 경주의 모든 배당율 조회
const raceDividends = await this.kraDividendService.getDividendRatesByRace(
  '20240315',
  '1'
);
```

### 2. 에러 처리

```typescript
try {
  const result = await this.kraDividendService.getDividendRates(query);

  if (!result.success) {
    // 에러 정보 확인
    console.log('Error Code:', result.error.code);
    console.log('Error Message:', result.error.message);
    console.log('Should Retry:', result.error.details.retryable);
  }
} catch (error) {
  // 자동 에러 처리 및 재시도 로직 적용됨
}
```

## ⚙️ 설정

### 환경변수

```bash
# .env 파일
KRA_API_KEY=your_api_key_here
KRA_API_TIMEOUT=10000
KRA_API_MAX_RETRIES=3
KRA_API_DAILY_LIMIT=10000
KRA_API_RATE_LIMIT=100
```

### NestJS 모듈 등록

```typescript
// app.module.ts
import { KraApiModule } from './external-apis/kra/kra-api.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // 스케줄러 활성화
    KraApiModule,
    // ... 기타 모듈
  ],
})
export class AppModule {}
```

## 📈 모니터링

### API 사용량 추적

```typescript
// 일일 사용량 확인
const usage = kraSchedulerService.getDailyUsageInfo();
console.log(`Today's usage: ${usage.count}/${usage.limit}`);

// 에러 통계 확인
const errorStats = kraErrorHandler.getErrorStatistics();
```

### 로그 레벨

- **INFO**: 정상 API 호출
- **WARN**: 재시도 가능한 에러
- **ERROR**: 재시도 불가능한 에러

## 🚀 확장 계획

### Phase 2: 추가 API 연동

- **경주기록 API (API4_3)**: 경주 결과 데이터
- **출전표 상세정보 API**: 출마 말 정보

### Phase 3: 고급 기능

- **캐싱 시스템**: Redis 기반 데이터 캐싱
- **실시간 알림**: WebSocket 기반 실시간 업데이트
- **예측 모델**: AI 기반 경주 결과 예측

## 🔐 보안 고려사항

1. **API 키 보안**
   - 환경변수를 통한 키 관리
   - 키 로테이션 지원

2. **요청 제한 준수**
   - 일일/분당 요청 제한 자동 관리
   - 백오프 전략 적용

3. **에러 정보 보안**
   - 민감한 정보 로그 제외
   - 구조화된 에러 응답

## 📝 변경 이력

### 2024.03.15

- ✅ 중앙화된 KRA API 설정 구축
- ✅ 확정배당율 API (API160_1) 완전 연동
- ✅ 체계적인 에러 처리 시스템 구축
- ✅ 자동 데이터 수집 스케줄러 구현
- ✅ 폴더 아키텍처 개선 (`external-apis` 구조)

### 주요 개선사항

1. **BaseURL 중앙 관리**: 모든 KRA API 엔드포인트를 `kra-api.config.ts`에서 관리
2. **에러 코드 표준화**: KRA API 에러 코드를 상수로 정의하고 재시도 로직 자동화
3. **타입 안전성**: TypeScript DTO로 API 응답 구조 보장
4. **모듈화**: 기능별 서비스 분리 및 의존성 주입

## 🛠️ 개발자 가이드

### 새로운 KRA API 추가 방법

1. **DTO 정의** (`dto/` 폴더)
2. **엔드포인트 설정** (`config/kra-api.config.ts`)
3. **서비스 구현** (`services/` 폴더)
4. **모듈 등록** (`kra-api.module.ts`)

### 에러 처리 커스터마이징

```typescript
// 새로운 에러 코드 추가
export const NEW_ERROR_CODE = {
  code: 'XX',
  message: 'NEW_ERROR',
  description: '새로운 에러',
  retryable: true,
  action: '해결 방안',
  retryDelay: 60000, // 1분
};
```

## 📊 성능 최적화

### 캐싱 전략

- **메모리 캐싱**: 자주 조회되는 데이터
- **데이터베이스 캐싱**: 변경 빈도가 낮은 데이터
- **TTL 설정**: 데이터 특성에 맞는 캐시 만료 시간

### API 호출 최적화

- **배치 처리**: 여러 요청을 묶어서 처리
- **지연 로딩**: 필요한 시점에만 데이터 요청
- **압축**: 응답 데이터 압축 활용

## 🧪 테스트

### 단위 테스트

```typescript
describe('KraDividendService', () => {
  it('should fetch dividend rates successfully', async () => {
    const result = await service.getDividendRatesByMeet('1');
    expect(result.success).toBe(true);
  });
});
```

### 통합 테스트

- API 엔드포인트 연결 테스트
- 에러 처리 시나리오 테스트
- 스케줄러 동작 테스트

## 📞 지원

### 문제 해결

1. **API 키 문제**: 환경변수 `KRA_API_KEY` 확인
2. **네트워크 에러**: 방화벽 및 DNS 설정 확인
3. **요청 제한**: 일일 사용량 모니터링

### 로그 분석

```bash
# KRA API 관련 로그 확인
grep "KraApi" logs/application.log

# 에러 로그만 확인
grep "ERROR.*KRA" logs/application.log
```

---

> 💡 **참고**: 이 문서는 한국마사회 Open API 활용가이드 v1.0을 기준으로 작성되었습니다.
