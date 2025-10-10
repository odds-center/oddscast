# KRA API 마이그레이션 가이드

## 📋 변경 사항 요약

### 기존 구조

```
external-apis/kra/  (삭제됨)
└── 분산된 서비스 파일들
```

### 새 구조

```
kra-api/
├── constants/                    # API 상수 관리
│   ├── kra.constants.ts         # 엔드포인트, 코드, 설정
│   └── index.ts
├── utils/                       # 유틸리티 함수
│   ├── kra.utils.ts            # 날짜, 변환, 검증
│   └── index.ts
├── services/                    # 개별 API 서비스
│   ├── kra-race-records.service.ts      # API4_3 - 경주기록
│   ├── kra-entry-sheet.service.ts       # API26_2 - 출전표
│   ├── kra-dividend-rates.service.ts    # API160 - 확정배당율
│   ├── kra-race-plans.service.ts        # API72_2 - 경주계획표
│   └── index.ts
├── kra-api-integrated.service.ts # 통합 서비스
├── kra-api.controller.ts        # REST API 컨트롤러
├── kra-api.module.ts            # NestJS 모듈
└── README.md                    # 사용 가이드
```

## 🔄 코드 마이그레이션

### Before (기존)

```typescript
import { KraApiService } from '../external-apis/kra/kra-api.service';

constructor(private readonly kraApi: KraApiService) {}

// 사용
const data = await this.kraApi.getRaceRecords(date, meet, rcNo);
```

### After (신규)

```typescript
import { KraApiIntegratedService } from '../kra-api/kra-api-integrated.service';

constructor(private readonly kraApi: KraApiIntegratedService) {}

// 사용
const data = await this.kraApi.getDailyRaceRecords(dateStr, meet);
```

## 📊 API 변경 사항

### 1. 경주기록 API

**Before:**

```typescript
getRaceRecords(date, meet, rcNo, pageNo, numOfRows) => { success, data }
```

**After:**

```typescript
// 개별 메서드로 분리
getRaceRecords(params) => ProcessedRaceRecord[]
getRaceResults(rcDate, meet, rcNo) => ProcessedRaceRecord[]
getDailyRaceRecords(rcDate, meet?) => ProcessedRaceRecord[]
```

### 2. 출전표 API

**Before:**

```typescript
getEntryDetails(date, meet) => { success, data }
```

**After:**

```typescript
getEntrySheet(params) => ProcessedEntrySheet[]
getRaceEntries(rcDate, meet, rcNo) => ProcessedEntrySheet[]
getDailyEntrySheets(rcDate, meet?) => ProcessedEntrySheet[]
getHorseEntries(hrNo, rcDate?) => ProcessedEntrySheet[]
```

### 3. 확정배당율 API

**Before:**

```typescript
getDividendRates(date, meet, pool, pageNo, numOfRows) => DividendRate[]
```

**After:**

```typescript
getDividendRates(params) => ProcessedDividendRate[]
getRaceDividends(rcDate, meet, rcNo) => ProcessedDividendRate[]
getDailyDividendRates(rcDate, meet?) => ProcessedDividendRate[]
getGroupedDividends(rcDate, meet?) => RaceDividends[]
```

### 4. 경주계획표 API

**Before:**

```typescript
getRacePlans(date, meet, pageNo, numOfRows) => { success, data }
```

**After:**

```typescript
getRacePlans(params) => ProcessedRacePlan[]
getRacePlan(rcDate, meet, rcNo) => ProcessedRacePlan | null
getDailyRacePlans(rcDate, meet?) => ProcessedRacePlan[]
getRaceSchedule(rcDate) => RaceSchedule
getUpcomingRacePlans(days?) => RaceSchedule[]
```

## 🔗 Mobile API 연동

### /races 엔드포인트 (Mobile에서 사용)

Mobile 앱이 사용하는 엔드포인트들이 자동으로 KRA API와 연결됩니다:

```typescript
GET /races/schedule?date=20250110      // 경주 일정
GET /races/:raceId/results             // 경주 결과
GET /races/:raceId/dividends           // 배당율
GET /races/:raceId/entries             // 출전표
GET /races/statistics?date=20250110    // 통계
GET /races/calendar?year=2025          // 캘린더
GET /races/search?q=서울               // 검색
```

### 날짜 형식 자동 변환

Mobile에서 보내는 다양한 날짜 형식을 자동으로 처리합니다:

- `2025-01-10` → `20250110`
- `20250110` → 그대로 사용

## 🗄️ 데이터베이스 스키마

### 주요 테이블

1. **races** - 경주 정보
2. **race_plans** - 경주 계획
3. **results** - 경주 결과
4. **dividend_rates** - 확정 배당율
5. **entry_details** - 출전표

### 필드 매핑

#### 경주기록 → results

```typescript
hrNo      → hr_no
hrName    → hr_name
jkName    → jk_name
rcTime    → rc_time
ord       → ord
```

#### 출전표 → entry_details

```typescript
hrNo      → hr_no
hrName    → hr_name
jkName    → jk_name
gateNo    → entry_number
```

#### 배당율 → dividend_rates

```typescript
winType         → pool
winTypeName     → pool_name
dividendRate    → odds
firstHorseNo    → chul_no
secondHorseNo   → chul_no2
thirdHorseNo    → chul_no3
```

## ⚙️ 환경 변수

`.env` 파일에 다음을 설정하세요:

```env
# KRA API 키 (공공데이터포털에서 발급)
KRA_API_KEY=your_encoded_api_key_here

# 배치 작업 설정
BATCH_ENABLED=true
BATCH_TIMEZONE=Asia/Seoul
BATCH_DAILY_SYNC_TIME=06:00
```

## 🚀 사용 예제

### 1. 경주 완전 정보 조회

```typescript
const raceInfo = await kraApiService.getCompleteRaceInfo(
  '20250110', // 경주일
  '1', // 서울
  '5' // 5경주
);

console.log('계획:', raceInfo.plan);
console.log('출전:', raceInfo.entries.length, '두');
console.log('결과:', raceInfo.results.length, '개');
console.log('배당:', raceInfo.dividends.length, '개');
```

### 2. 일일 전체 경주 정보

```typescript
const dailyRaces = await kraApiService.getDailyCompleteRaceInfo('20250110');

for (const race of dailyRaces) {
  console.log(`${race.meetName} ${race.rcNo}R: ${race.rcName}`);
  console.log(`  출전: ${race.statistics.entryCount}두`);
  console.log(`  결과: ${race.statistics.hasResults ? '확정' : '미확정'}`);
}
```

### 3. API 상태 체크

```typescript
const status = await kraApiService.checkApiStatus();

console.log('전체 상태:', status.isHealthy ? '✅' : '❌');
console.log('경주기록:', status.services.raceRecords.responseTime, 'ms');
console.log('출전표:', status.services.entrySheet.responseTime, 'ms');
console.log('배당율:', status.services.dividendRates.responseTime, 'ms');
console.log('계획표:', status.services.racePlans.responseTime, 'ms');
```

## 🎯 주요 개선사항

### 1. 타입 안전성

- 모든 API 응답에 완전한 TypeScript 타입 정의
- 컴파일 타임 에러 감지

### 2. 코드 구조

- Constants, Utils, Services로 명확한 분리
- 각 API별로 독립적인 서비스 클래스
- 재사용 가능한 유틸리티 함수

### 3. 에러 처리

- 모든 API 호출에 try-catch
- 상세한 에러 로깅
- API 키 자동 마스킹

### 4. 성능

- 응답 시간 측정
- 요청/응답 로깅
- 재시도 메커니즘

### 5. 확장성

- 새로운 API 추가 용이
- 모듈화된 구조
- 통합 서비스를 통한 복잡한 조회

## 🧪 테스트

### API 상태 확인

```bash
curl http://localhost:3002/kra-api/status
```

### 경주 일정 조회

```bash
curl http://localhost:3002/races/schedule?date=20250110
```

### 경주 완전 정보 조회

```bash
curl http://localhost:3002/kra-api/race/1/20250110/5
```

## 📝 체크리스트

- [x] external-apis/kra 폴더 삭제
- [x] 새로운 kra-api 모듈 생성
- [x] Constants 파일 생성
- [x] Utils 파일 생성
- [x] 4개 API 서비스 생성
- [x] 통합 서비스 생성
- [x] 컨트롤러 업데이트
- [x] app.module.ts import 경로 수정
- [x] batch 모듈 업데이트
- [x] data-source 모듈 업데이트
- [x] races 컨트롤러 확장 (Mobile 연동)
- [x] kra-data-mapper 제거

## 🎉 완료!

모든 KRA API 서비스가 새로운 구조로 마이그레이션되었습니다.
Server와 Mobile이 완벽하게 연결되어 있습니다.

---

**마지막 업데이트**: 2025년 10월 10일
