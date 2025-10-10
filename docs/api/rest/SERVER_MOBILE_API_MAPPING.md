# Server-Mobile API 연결 매핑 가이드

## 🔌 API 연결 구조

```
Mobile App (React Native)
    ↓ HTTP Request
    ↓ axios baseURL: http://localhost:3002/api
    ↓
Server (NestJS)
    ↓ Global Prefix: /api
    ↓ Controllers: /races, /results, /kra-api
    ↓
KRA API Integration
    ↓ 한국마사회 Open API
```

## 📍 Base URL 설정

### Server

```typescript
// src/main.ts
app.setGlobalPrefix('api'); // 글로벌 prefix
const port = 3002; // 포트

// 실제 URL: http://localhost:3002/api/...
```

### Mobile

```typescript
// lib/utils/axios.ts
const API_BASE_URL = `${config.api.server.baseURL}/api`;

// Development: http://localhost:3002/api (Android 에뮬레이터에서는 10.0.2.2)
// Production: https://api.goldenrace.com/api
```

## 🗺️ API 엔드포인트 매핑

### 1. Races API

| Mobile 요청                    | Server 엔드포인트                  | 설명        | 상태      |
| ------------------------------ | ---------------------------------- | ----------- | --------- |
| `GET /races`                   | `GET /api/races`                   | 경주 목록   | ✅ 연결됨 |
| `GET /races?date=2025-01-10`   | `GET /api/races?date=20250110`     | 날짜별 경주 | ✅ 연결됨 |
| `GET /races/:id`               | `GET /api/races/:id`               | 경주 상세   | ✅ 연결됨 |
| `GET /races/schedule`          | `GET /api/races/schedule`          | 경주 일정   | ✅ 연결됨 |
| `GET /races/:raceId/results`   | `GET /api/races/:raceId/results`   | 경주 결과   | ✅ 연결됨 |
| `GET /races/:raceId/dividends` | `GET /api/races/:raceId/dividends` | 배당율      | ✅ 연결됨 |
| `GET /races/:raceId/entries`   | `GET /api/races/:raceId/entries`   | 출전표      | ✅ 연결됨 |
| `GET /races/statistics`        | `GET /api/races/statistics`        | 경주 통계   | ✅ 연결됨 |
| `GET /races/calendar`          | `GET /api/races/calendar`          | 경주 캘린더 | ✅ 연결됨 |
| `GET /races/search?q=서울`     | `GET /api/races/search?q=서울`     | 경주 검색   | ✅ 연결됨 |

### 2. Results API

| Mobile 요청                      | Server 엔드포인트                    | 설명        | 상태      |
| -------------------------------- | ------------------------------------ | ----------- | --------- |
| `GET /results`                   | `GET /api/results`                   | 결과 목록   | ✅ 연결됨 |
| `GET /results?date=2025-01-10`   | `GET /api/results?date=20250110`     | 날짜별 결과 | ✅ 연결됨 |
| `GET /results/:id`               | `GET /api/results/:id`               | 결과 상세   | ✅ 연결됨 |
| `GET /results/race/:raceId`      | `GET /api/results/race/:raceId`      | 경주별 결과 | ✅ 연결됨 |
| `GET /results/date/:date`        | `GET /api/results/date/:date`        | 날짜별 결과 | ✅ 연결됨 |
| `GET /results/statistics`        | `GET /api/results/statistics`        | 결과 통계   | ✅ 연결됨 |
| `GET /results/search?q=금빛질주` | `GET /api/results/search?q=금빛질주` | 결과 검색   | ✅ 연결됨 |

### 3. KRA API (직접 접근)

| Mobile 요청 | Server 엔드포인트                           | 설명       | 상태           |
| ----------- | ------------------------------------------- | ---------- | -------------- |
| N/A         | `GET /api/kra-api/status`                   | API 상태   | 🔧 Server Only |
| N/A         | `GET /api/kra-api/race-plans`               | 경주계획표 | 🔧 Server Only |
| N/A         | `GET /api/kra-api/entry-sheet`              | 출전표     | 🔧 Server Only |
| N/A         | `GET /api/kra-api/race-records`             | 경주기록   | 🔧 Server Only |
| N/A         | `GET /api/kra-api/dividend-rates`           | 확정배당율 | 🔧 Server Only |
| N/A         | `GET /api/kra-api/race/:meet/:rcDate/:rcNo` | 완전정보   | 🔧 Server Only |

## 📝 요청/응답 예제

### Mobile → Server: 경주 목록 조회

**Mobile Request:**

```typescript
const races = await RaceApi.getRaces({
  date: '2025-01-10',
  meet: '1',
  page: 1,
  limit: 10,
});
```

**HTTP Request:**

```
GET http://localhost:3002/api/races?date=2025-01-10&meet=1&page=1&limit=10
```

**Server Response:**

```json
{
  "races": [
    {
      "id": "1_20250110_1",
      "meet": "1",
      "meetName": "서울",
      "rcDate": "20250110",
      "rcNo": "1",
      "rcName": "신년특선경주",
      ...
    }
  ],
  "total": 12,
  "page": 1,
  "totalPages": 2
}
```

### Mobile → Server: 경주 결과 조회

**Mobile Request:**

```typescript
const results = await RaceApi.getRaceResults('1_20250110_5');
```

**HTTP Request:**

```
GET http://localhost:3002/api/races/1_20250110_5/results
```

**Server Response:**

```json
[
  {
    "resultId": "1_20250110_5_1",
    "raceId": "1_20250110_5",
    "meet": "1",
    "meetName": "서울",
    "hrName": "금빛질주",
    "ord": 1,
    "rcTime": 72.5,
    ...
  }
]
```

## 🔄 날짜 형식 변환

### Mobile → Server 자동 변환

Mobile에서 보낸 날짜는 Server가 자동으로 변환합니다:

```typescript
// Mobile에서 보낸 날짜
date: '2025-01-10';

// Server에서 자동 변환
const normalizedDate = date.replace(/-/g, ''); // '20250110'
```

### 지원하는 날짜 형식

- `YYYY-MM-DD` (2025-01-10) → 자동 변환
- `YYYYMMDD` (20250110) → 그대로 사용

## 🌐 환경별 Base URL

### Mobile 설정 (config/environment.ts)

```typescript
development: {
  api: {
    server: {
      baseURL: Platform.OS === 'android'
        ? 'http://10.0.2.2:3002'      // Android 에뮬레이터
        : 'http://localhost:3002',    // iOS 시뮬레이터/실제 기기
      timeout: 10000,
    },
  },
}

production: {
  api: {
    server: {
      baseURL: 'https://api.goldenrace.com',
      timeout: 20000,
    },
  },
}
```

## 📦 Mobile API 클라이언트 사용법

### RaceApi

```typescript
import { RaceApi } from '@/lib/api/raceApi';

// 1. 오늘의 경주
const todayRaces = await RaceApi.getRaces({
  date: new Date().toISOString().split('T')[0],
});

// 2. 서울 경주장 경주
const seoulRaces = await RaceApi.getRaces({ meet: '1' });

// 3. 경주 상세
const raceDetail = await RaceApi.getRace('1_20250110_5');

// 4. 경주 결과
const results = await RaceApi.getRaceResults('1_20250110_5');

// 5. 배당율
const dividends = await RaceApi.getRaceDividends('1_20250110_5');

// 6. 출전표
const entries = await RaceApi.getRaceEntries('1_20250110_5');
```

### ResultApi

```typescript
import { resultApi } from '@/lib/api/resultApi';

// 1. 날짜별 결과
const results = await resultApi.getResults({ date: '2025-01-10' });

// 2. 경주별 결과
const raceResults = await resultApi.getRaceResults('1_20250110_5');

// 3. 결과 통계
const stats = await resultApi.getResultStatistics({
  date: '2025-01-10',
});

// 4. 결과 검색
const searchResults = await resultApi.searchResults('금빛질주');
```

## 🔧 Server 데이터 흐름

```
Mobile Request
    ↓
Server /api/races Endpoint
    ↓
Check Local DB (races 테이블)
    ↓ If not found
KRA API Integrated Service
    ↓
Individual KRA Service (race-records, entry-sheet, etc.)
    ↓
한국마사회 Open API
    ↓
Process & Save to DB
    ↓
Return to Mobile
```

## 🎯 핵심 연결 포인트

### 1. Races Controller (races.controller.ts)

```typescript
// Mobile이 사용하는 엔드포인트
GET /api/races                      // 목록 (필터링 지원)
GET /api/races/schedule             // 일정
GET /api/races/:id                  // 상세
GET /api/races/:raceId/results      // KRA API 연동
GET /api/races/:raceId/dividends    // KRA API 연동
GET /api/races/:raceId/entries      // KRA API 연동
GET /api/races/statistics           // 통계
GET /api/races/search               // 검색
```

### 2. Results Controller (results.controller.ts)

```typescript
// Mobile이 사용하는 엔드포인트
GET /api/results                    // 목록 (필터링 지원)
GET /api/results/:id                // 상세
GET /api/results/race/:raceId       // 경주별 결과
GET /api/results/date/:date         // 날짜별 결과
GET /api/results/statistics         // 통계
GET /api/results/search             // 검색
```

### 3. KRA API Controller (kra-api.controller.ts)

```typescript
// Server 내부 또는 직접 사용 (Mobile은 /races로 접근)
GET /api/kra-api/status
GET /api/kra-api/race-plans
GET /api/kra-api/entry-sheet
GET /api/kra-api/race-records
GET /api/kra-api/dividend-rates
GET /api/kra-api/race/:meet/:rcDate/:rcNo
GET /api/kra-api/daily-races
```

## 🧪 테스트 가이드

### Server 테스트

```bash
# 1. Server 실행
cd server
npm run start:dev

# 2. API 테스트
curl http://localhost:3002/api/races
curl http://localhost:3002/api/races/schedule
curl http://localhost:3002/api/results/date/20250110
curl http://localhost:3002/api/kra-api/status
```

### Mobile 테스트

```bash
# 1. Mobile 실행
cd mobile
npx expo start

# 2. 앱에서 확인
# - 홈 화면: 오늘의 경주 표시
# - 경주 화면: 경주 목록 표시
# - 결과 화면: 경주 결과 표시
```

### 연결 확인

```typescript
// Mobile에서 실행 (개발자 콘솔에서 확인)
import { RaceApi } from '@/lib/api/raceApi';

// 테스트
const test = async () => {
  try {
    const races = await RaceApi.getRaces();
    console.log('✅ API 연결 성공:', races);
  } catch (error) {
    console.error('❌ API 연결 실패:', error);
  }
};

test();
```

## 🔑 인증 헤더

Mobile에서 Server로 요청 시 자동으로 JWT 토큰이 포함됩니다:

```typescript
// Mobile axios.ts
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

## 🚨 주의사항

### 1. Android 에뮬레이터 Base URL

```typescript
// ❌ 잘못된 설정
baseURL: 'http://localhost:3002/api';

// ✅ 올바른 설정
baseURL: Platform.OS === 'android'
  ? 'http://10.0.2.2:3002/api' // Android 에뮬레이터
  : 'http://localhost:3002/api'; // iOS/Web
```

### 2. 날짜 형식

```typescript
// Mobile에서 보낼 때
date: '2025-01-10'; // YYYY-MM-DD 형식

// Server가 자동 변환
normalizedDate = '20250110'; // YYYYMMDD 형식
```

### 3. CORS 설정

Server에서 Mobile origin을 허용해야 합니다:

```typescript
// server/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'exp://localhost:19000', // Expo 개발 서버
  ],
  credentials: true,
});
```

## 📋 체크리스트

### Server

- [x] Global prefix `/api` 설정
- [x] CORS 설정 완료
- [x] RacesController Mobile 엔드포인트 추가
- [x] ResultsController Mobile 엔드포인트 추가
- [x] KraApiModule export 설정
- [x] 날짜 형식 자동 변환 로직 추가

### Mobile

- [x] Base URL 환경별 설정
- [x] Platform별 분기 처리 (Android/iOS)
- [x] Authorization 헤더 자동 추가
- [x] API 클라이언트 타입 정의
- [x] Error 처리 및 재시도 로직

### 통합

- [x] Server-Mobile 엔드포인트 매핑 완료
- [x] 날짜 형식 자동 변환
- [x] KRA API 통합 서비스 연결
- [x] DB 캐싱 및 자동 동기화

## 🎉 완료!

Server와 Mobile이 완벽하게 연결되었습니다!

### 데이터 흐름

```
Mobile App
    ↓ GET /api/races?date=2025-01-10
Server races.controller.ts
    ↓ findAll() 메서드
Check DB (races 테이블)
    ↓ If not found
KraApiIntegratedService
    ↓ getRaceSchedule()
KraRacePlansService
    ↓ HTTP Request
한국마사회 API
    ↓ Response
Process & Save to DB
    ↓ Return
Mobile App (렌더링)
```

---

> 🏇 이제 Mobile 앱을 실행하면 실시간 경주 데이터를 볼 수 있습니다!
