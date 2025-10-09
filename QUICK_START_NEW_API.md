# 🚀 Golden Race - 새로운 API 빠른 시작 가이드

## 📋 완료된 작업 요약

### ✅ Server (Backend)

1. **KRA API 완전 재구성**

   - 4개의 독립적인 API 서비스 (경주기록, 출전표, 확정배당율, 경주계획표)
   - Constants와 Utils로 체계적인 코드 관리
   - 통합 서비스로 복잡한 조회 지원

2. **Mobile 연동 완료**

   - `/races` 엔드포인트 확장
   - 자동 날짜 형식 변환
   - KRA API와 완벽한 통합

3. **코드 정리**
   - 중복 파일 제거 (external-apis 폴더)
   - 사용하지 않는 파일 삭제
   - Import 경로 모두 업데이트

### ✅ Mobile (Frontend)

1. **Theme 시스템 통합**
   - GOLD_THEME 기반 일관된 디자인
   - 모든 화면 통일된 스타일
   - 재사용 가능한 컴포넌트 스타일

## 🏃 시작하기

### 1. Server 실행

```bash
cd server

# 환경 변수 확인
# .env 파일에 KRA_API_KEY가 있는지 확인

# 의존성 설치
npm install

# 데이터베이스 시작
npm run docker:mysql

# 데이터베이스 초기화
npm run db:complete

# 서버 실행
npm run start:dev
```

### 2. API 테스트

```bash
# API 상태 확인
curl http://localhost:3002/kra-api/status

# 오늘 경주 일정 확인
curl http://localhost:3002/races/schedule

# 특정 경주 완전 정보
curl http://localhost:3002/kra-api/race/1/20250110/5
```

### 3. Mobile 실행

```bash
cd mobile

# 의존성 설치
npm install

# 개발 서버 실행
npx expo start
```

## 📊 주요 API 엔드포인트

### Server - KRA API

| 엔드포인트                              | 설명          | 예시                      |
| --------------------------------------- | ------------- | ------------------------- |
| `GET /kra-api/status`                   | API 상태 확인 | -                         |
| `GET /kra-api/race-plans`               | 경주 계획표   | `?rcDate=20250110`        |
| `GET /kra-api/entry-sheet`              | 출전표        | `?rcDate=20250110&meet=1` |
| `GET /kra-api/race-records`             | 경주 기록     | `?rcDate=20250110`        |
| `GET /kra-api/dividend-rates`           | 확정 배당율   | `?rcDate=20250110`        |
| `GET /kra-api/race/:meet/:rcDate/:rcNo` | 완전 정보     | `/1/20250110/5`           |

### Server - Races (Mobile 연동)

| 엔드포인트                     | 설명      | Mobile 사용 |
| ------------------------------ | --------- | ----------- |
| `GET /races`                   | 모든 경주 | ✅          |
| `GET /races/schedule`          | 경주 일정 | ✅          |
| `GET /races/:id`               | 경주 상세 | ✅          |
| `GET /races/:raceId/results`   | 경주 결과 | ✅          |
| `GET /races/:raceId/dividends` | 배당율    | ✅          |
| `GET /races/:raceId/entries`   | 출전표    | ✅          |
| `GET /races/statistics`        | 통계      | ✅          |
| `GET /races/search`            | 검색      | ✅          |

## 🎯 사용 예제

### Server - TypeScript

```typescript
import { KraApiIntegratedService } from './kra-api/kra-api-integrated.service';

// 1. 오늘의 경주 일정
const schedule = await kraApi.getRaceSchedule('20250110');

// 2. 특정 경주 완전 정보
const race = await kraApi.getCompleteRaceInfo('20250110', '1', '5');

// 3. 향후 7일 일정
const upcoming = await kraApi.getUpcomingRacePlans(7);

// 4. API 상태 체크
const status = await kraApi.checkApiStatus();
```

### Mobile - TypeScript

```typescript
import { RaceApi } from '@/lib/api/raceApi';

// 1. 오늘의 경주
const races = await RaceApi.getRaces({
  date: '2025-01-10',
});

// 2. 경주 일정
const schedule = await RaceApi.getRaceSchedule({
  date: '2025-01-10',
});

// 3. 경주 결과
const results = await RaceApi.getRaceResults('1_20250110_5');

// 4. 배당율
const dividends = await RaceApi.getRaceDividends('1_20250110_5');
```

## 📂 새로운 파일 구조

### Server

```
server/src/kra-api/
├── constants/
│   ├── kra.constants.ts      ⭐ 새로 생성
│   └── index.ts              ⭐ 새로 생성
├── utils/
│   ├── kra.utils.ts          ⭐ 새로 생성
│   └── index.ts              ⭐ 새로 생성
├── services/
│   ├── kra-race-records.service.ts     ⭐ 새로 생성
│   ├── kra-entry-sheet.service.ts      ⭐ 새로 생성
│   ├── kra-dividend-rates.service.ts   ⭐ 새로 생성
│   ├── kra-race-plans.service.ts       ⭐ 새로 생성
│   └── index.ts              ⭐ 새로 생성
├── kra-api-integrated.service.ts  ⭐ 새로 생성
├── kra-api.controller.ts     ✏️ 업데이트
├── kra-api.module.ts         ✏️ 업데이트
└── README.md                 ⭐ 새로 생성
```

### Mobile

```
mobile/constants/
└── theme.ts                  ✏️ 확장 (공통 스타일 추가)

mobile/app/(app)/
├── home.tsx                  ✏️ Theme 적용
├── betting.tsx               ✏️ Theme 적용
├── races.tsx                 → RacesScreen
└── results.tsx               → ResultsScreen

mobile/components/screens/
├── races/RacesScreen.tsx     ✏️ Theme 적용
├── results/ResultsScreen.tsx ✏️ Theme 적용
└── mypage/MyPageScreen.tsx   ✏️ Theme 적용
```

## 🔍 주요 변경사항

### API 응답 형식

**Before (기존):**

```json
{
  "success": true,
  "data": [...],
  "timestamp": "..."
}
```

**After (신규):**

```json
// 직접 배열 반환
[
  {
    "raceId": "1_20250110_5",
    "meet": "1",
    "meetName": "서울",
    ...
  }
]
```

### 날짜 형식

**Server는 YYYYMMDD만 사용:**

- `20250110` ✅
- `2025-01-10` → 자동 변환

**Mobile은 둘 다 가능:**

- Server가 자동 변환 처리

## 💡 팁

### 1. API 키 설정

```bash
# Server
echo "KRA_API_KEY=your_key_here" >> server/.env

# 또는 환경 변수로
export KRA_API_KEY=your_key_here
```

### 2. 데이터 수집

```bash
# 오늘 데이터 수집
curl -X POST http://localhost:3002/batch/manual-sync?date=20250110

# 과거 데이터 수집 스크립트
cd server
npm run collect:historical
```

### 3. 로그 확인

```bash
# Server 로그
tail -f server/logs/combined.log

# KRA API 로그만
tail -f server/logs/combined.log | grep "KRA API"
```

## 🎉 결과

- ✅ **Server**: 완벽하게 구조화된 KRA API 시스템
- ✅ **Mobile**: 통일된 Theme와 API 연동
- ✅ **통합**: Server-Mobile 완벽한 연결
- ✅ **정리**: 중복 파일 제거, 깔끔한 코드베이스

## 📚 관련 문서

- [KRA API 마이그레이션 가이드](/server/KRA_API_MIGRATION_GUIDE.md)
- [API 통합 요약](/API_INTEGRATION_SUMMARY.md)
- [KRA API 사용 가이드](/server/src/kra-api/README.md)
- [Server README](/server/README.md)
- [Mobile README](/mobile/README.md)

---

> 모든 작업이 완료되었습니다! 이제 서버를 실행하고 Mobile 앱을 테스트하세요! 🚀
