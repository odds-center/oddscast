# KRA API Module

한국마사회 Open API 연동 모듈입니다.

## 📁 구조

```
kra-api/
├── constants/           # API 상수 정의
│   ├── kra.constants.ts # 엔드포인트, 코드, 설정 등
│   └── index.ts
├── utils/              # 유틸리티 함수
│   ├── kra.utils.ts    # 날짜, 변환, 검증 등
│   └── index.ts
├── services/           # 개별 API 서비스
│   ├── kra-race-records.service.ts      # 경주기록 API
│   ├── kra-entry-sheet.service.ts       # 출전표 API
│   ├── kra-dividend-rates.service.ts    # 확정배당율 API
│   ├── kra-race-plans.service.ts        # 경주계획표 API
│   └── index.ts
├── kra-api-integrated.service.ts # 통합 서비스
├── kra-api.controller.ts         # REST API 컨트롤러
├── kra-api.module.ts             # NestJS 모듈
└── README.md                     # 이 파일
```

## 🚀 사용법

### 1. 환경 변수 설정

`.env` 파일에 KRA API 키를 설정하세요:

```env
KRA_API_KEY=your_api_key_here
```

### 2. 모듈 import

```typescript
import { KraApiModule } from './kra-api/kra-api.module';

@Module({
  imports: [KraApiModule],
})
export class AppModule {}
```

### 3. 서비스 사용

```typescript
import { KraApiIntegratedService } from './kra-api/kra-api-integrated.service';

@Injectable()
export class YourService {
  constructor(private readonly kraApi: KraApiIntegratedService) {}

  async example() {
    // 경주 계획 조회
    const plans = await this.kraApi.getRacePlans({
      rcDate: '20250110',
      meet: '1', // 서울
    });

    // 경주 완전 정보 조회
    const raceInfo = await this.kraApi.getCompleteRaceInfo(
      '20250110',
      '1',
      '1'
    );

    // API 상태 확인
    const status = await this.kraApi.checkApiStatus();
  }
}
```

## 📖 API 목록

### 1. 경주계획표 API (API72_2)

- **엔드포인트**: `/B551015/API72_2/racePlan_2`
- **설명**: 전국 경마공원 경주계획표
- **메서드**:
  - `getRacePlans()` - 경주 계획 조회
  - `getRaceSchedule()` - 경주 일정 조회
  - `getUpcomingRacePlans()` - 향후 경주 일정

### 2. 출전표 API (API26_2)

- **엔드포인트**: `/B551015/API26_2/entrySheet_2`
- **설명**: 경주별 출마 말 상세 정보
- **메서드**:
  - `getEntrySheet()` - 출전표 조회
  - `getRaceEntries()` - 특정 경주 출전표
  - `getHorseEntries()` - 특정 말 출전 정보

### 3. 경주기록 API (API4_3)

- **엔드포인트**: `/B551015/API4_3/raceResult_3`
- **설명**: 경주 결과 및 기록 정보
- **메서드**:
  - `getRaceRecords()` - 경주 기록 조회
  - `getRaceResults()` - 특정 경주 결과
  - `getDailyRaceRecords()` - 일일 경주 기록

### 4. 확정배당율 API (API160)

- **엔드포인트**: `/B551015/API160/integratedInfo`
- **설명**: 확정 배당율 통합 정보
- **메서드**:
  - `getDividendRates()` - 배당율 조회
  - `getRaceDividends()` - 특정 경주 배당율
  - `getGroupedDividends()` - 경주별 배당율 그룹화

## 🔧 상수 및 코드

### 경마장 코드

- `1`: 서울
- `2`: 부산경남
- `3`: 제주

### 승식 구분

- `WIN`: 단승식
- `PLC`: 연승식
- `QNL`: 복승식
- `EXA`: 쌍승식
- `QPL`: 복연승식
- `TLA`: 삼복승식
- `TRI`: 삼쌍승식

### 경주 등급

- `S`: 특별
- `1`: 1급
- `2`: 2급
- `3`: 3급
- `O`: 오픈
- `C`: 컨디션

## 📝 예제

### 오늘의 경주 일정 조회

```typescript
const schedule = await kraApi.getRaceSchedule(getCurrentDate());

for (const meet of schedule.meets) {
  console.log(`${meet.meetName}: ${meet.raceCount}개 경주`);

  for (const race of meet.races) {
    console.log(`  ${race.rcNo}R: ${race.rcName} (${race.rcStartTime})`);
  }
}
```

### 특정 경주의 모든 정보 조회

```typescript
const completeInfo = await kraApi.getCompleteRaceInfo(
  '20250110', // 경주일
  '1', // 서울
  '5' // 5경주
);

console.log('경주 정보:', completeInfo.plan);
console.log('출전마:', completeInfo.entries.length, '두');
console.log('결과:', completeInfo.results.length > 0 ? '확정' : '미확정');
console.log('배당율:', completeInfo.dividends.length, '개');
```

### 향후 7일간 경주 일정

```typescript
const upcoming = await kraApi.getUpcomingRacePlans(7);

for (const schedule of upcoming) {
  console.log(`${schedule.rcDate}:`);

  for (const meet of schedule.meets) {
    console.log(`  ${meet.meetName}: ${meet.raceCount}개 경주`);
  }
}
```

## 🔄 에러 처리

모든 서비스 메서드는 에러를 throw하므로 try-catch로 처리하세요:

```typescript
try {
  const plans = await kraApi.getRacePlans();
} catch (error) {
  console.error('API 호출 실패:', error.message);
  // 에러 처리 로직
}
```

## 🧪 API 상태 확인

```typescript
const status = await kraApi.checkApiStatus();

console.log('전체 상태:', status.isHealthy ? '정상' : '오류');
console.log('경주기록 API:', status.services.raceRecords.isAvailable);
console.log('출전표 API:', status.services.entrySheet.isAvailable);
console.log('배당율 API:', status.services.dividendRates.isAvailable);
console.log('계획표 API:', status.services.racePlans.isAvailable);
```

## 📊 성능

- **기본 타임아웃**: 30초
- **최대 재시도**: 3회
- **일일 요청 제한**: 10,000회
- **분당 요청 제한**: 100회
- **초당 최대 트랜잭션**: 30 TPS

## 🔐 보안

- API 키는 환경 변수로 관리
- 요청 로그에서 API 키 자동 마스킹
- 에러 메시지에 민감 정보 미포함

## 📚 참고 문서

- [한국마사회 Open API](https://www.data.go.kr)
- [API 가이드 문서](/docs)
