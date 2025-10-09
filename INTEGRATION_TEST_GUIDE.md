# 🧪 Server-Mobile 통합 테스트 가이드

## ✅ 완료된 통합 작업

### Server (백엔드)

- ✅ KRA API 4개 서비스 재구성
- ✅ Constants/Utils 체계적 관리
- ✅ Races/Results 컨트롤러 Mobile 엔드포인트 추가
- ✅ 날짜 형식 자동 변환
- ✅ 페이지네이션 및 필터링 지원

### Mobile (프론트엔드)

- ✅ GOLD_THEME 통합 적용
- ✅ API 클라이언트 준비 완료
- ✅ Base URL 환경별 설정
- ✅ Authorization 헤더 자동 추가

### 통합

- ✅ Server-Mobile API 매핑 완료
- ✅ /api prefix 일치
- ✅ 날짜 형식 자동 변환
- ✅ KRA API ↔ Server ↔ Mobile 연결

## 🚀 통합 테스트 절차

### 1단계: Server 실행

```bash
cd server

# 환경 변수 확인
cat .env | grep KRA_API_KEY

# MySQL 시작
npm run docker:mysql

# 데이터베이스 초기화
npm run db:complete

# Server 실행
npm run start:dev
```

**확인사항:**

```bash
✅ Server가 3002 포트에서 실행 중
✅ API 문서: http://localhost:3002/api/docs
✅ Health check: http://localhost:3002/api/health
```

### 2단계: Server API 테스트

```bash
# 1. KRA API 상태 확인
curl http://localhost:3002/api/kra-api/status

# 예상 응답:
# {
#   "isHealthy": true,
#   "services": {
#     "raceRecords": { "isAvailable": true },
#     "entrySheet": { "isAvailable": true },
#     ...
#   }
# }

# 2. 경주 목록 조회
curl http://localhost:3002/api/races

# 예상 응답:
# {
#   "races": [...],
#   "total": 0,
#   "page": 1,
#   "totalPages": 1
# }

# 3. 경주 일정 조회
curl http://localhost:3002/api/races/schedule

# 4. 결과 목록 조회
curl http://localhost:3002/api/results
```

### 3단계: Mobile 실행

```bash
cd mobile

# 의존성 설치 (처음만)
npm install

# Expo 개발 서버 실행
npx expo start
```

**확인사항:**

```bash
✅ Expo DevTools 실행됨
✅ QR 코드 표시됨
✅ Metro bundler 실행 중
```

### 4단계: Mobile 앱 테스트

#### A. 에뮬레이터/시뮬레이터

```bash
# Android 에뮬레이터
a (Expo DevTools에서)

# iOS 시뮬레이터
i (Expo DevTools에서)
```

#### B. 실제 기기

```bash
# Expo Go 앱으로 QR 코드 스캔
# 또는
npx expo start --tunnel
```

### 5단계: 화면별 기능 테스트

#### 홈 화면

- [ ] 사용자 환영 메시지 표시
- [ ] 베팅 통계 표시
- [ ] 오늘의 경주 3개 표시 (KRA API 연동)
- [ ] 빠른 액션 버튼 4개 (베팅, 경주, 포인트, 마이페이지)

#### 경주 화면

- [ ] 지역 필터 (전체, 서울, 부산, 제주)
- [ ] 경주 목록 표시 (KRA API 연동)
- [ ] 경주 카드 클릭 → 상세 페이지
- [ ] 경주 통계 표시

#### 결과 화면

- [ ] 날짜 선택 (최근 30일)
- [ ] 결과 목록 표시 (KRA API 연동)
- [ ] 검색 기능
- [ ] 일별/전체 뷰 모드 전환

#### 베팅 화면

- [ ] 베팅 통계 표시
- [ ] 활성 베팅 / 베팅 내역 탭
- [ ] 새 베팅 버튼

#### 마이페이지

- [ ] 사용자 프로필 표시
- [ ] 포인트 잔액 표시
- [ ] 레벨 및 진행률
- [ ] 설정 메뉴

## 🔍 디버깅 체크리스트

### Server 연결 확인

```bash
# Server 로그 확인
tail -f server/logs/combined.log

# KRA API 호출 확인
tail -f server/logs/combined.log | grep "KRA API"

# 에러 로그만
tail -f server/logs/error.log
```

### Mobile 연결 확인

```typescript
// Mobile에서 실행 (앱 내 console)
import { RaceApi } from '@/lib/api/raceApi';

const testConnection = async () => {
  try {
    console.log('🧪 Server 연결 테스트 시작...');

    // 1. 경주 목록
    const races = await RaceApi.getRaces();
    console.log('✅ 경주 목록:', races);

    // 2. 경주 일정
    const schedule = await RaceApi.getRaceSchedule({});
    console.log('✅ 경주 일정:', schedule);

    console.log('🎉 모든 연결 테스트 성공!');
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
};

testConnection();
```

## 🚨 문제 해결

### 문제 1: Mobile에서 Server 연결 안됨

**증상:**

```
Network Error
Unable to connect to server
```

**해결:**

```bash
# 1. Server가 실행 중인지 확인
curl http://localhost:3002/api/health

# 2. Mobile base URL 확인
# mobile/config/environment.ts
# Android: http://10.0.2.2:3002
# iOS: http://localhost:3002

# 3. CORS 설정 확인
# server/src/main.ts
# origin에 Expo URL 포함되어 있는지 확인
```

### 문제 2: KRA API 데이터가 없음

**증상:**

```
경주 목록이 비어있음
results: []
```

**해결:**

```bash
# 1. KRA API 상태 확인
curl http://localhost:3002/api/kra-api/status

# 2. 배치 작업으로 데이터 수집
curl -X POST http://localhost:3002/api/batch/manual-sync?date=20250110

# 3. 직접 KRA API 호출 테스트
curl "http://localhost:3002/api/kra-api/race-plans?rcDate=20250110"
```

### 문제 3: 날짜 형식 오류

**증상:**

```
Invalid date format
```

**해결:**

```typescript
// Mobile에서 날짜 전송 시
// ✅ 올바른 형식
date: '2025-01-10'; // YYYY-MM-DD
date: '20250110'; // YYYYMMDD

// ❌ 잘못된 형식
date: '2025/01/10';
date: '01-10-2025';
```

### 문제 4: 401 Unauthorized

**증상:**

```
Unauthorized
401 error
```

**해결:**

```typescript
// 1. 로그인 확인
// Mobile 앱에서 로그인 되어 있는지 확인

// 2. 토큰 확인
import { tokenManager } from '@/lib/utils/tokenManager';
const token = await tokenManager.getToken();
console.log('현재 토큰:', token);

// 3. 토큰 재설정
await resetAuth();
```

## 📊 예상 데이터 흐름

### 시나리오 1: 오늘의 경주 조회

```
1. Mobile: Home 화면 로드
   ↓
2. useRaces hook 실행
   ↓
3. RaceApi.getRaces({ date: '2025-01-10' })
   ↓
4. axios GET http://localhost:3002/api/races?date=2025-01-10
   ↓
5. Server: RacesController.findAll()
   ↓
6. RacesService.findAll() → DB 조회
   ↓
7. If empty → KraApiService.getDailyRacePlans()
   ↓
8. 한국마사회 API 호출
   ↓
9. 데이터 처리 및 DB 저장
   ↓
10. Mobile로 응답 반환
    ↓
11. Home 화면에 경주 목록 표시
```

### 시나리오 2: 경주 결과 조회

```
1. Mobile: Results 화면에서 날짜 선택
   ↓
2. useResults('20250110') hook
   ↓
3. resultApi.getResults({ date: '2025-01-10' })
   ↓
4. axios GET http://localhost:3002/api/results?date=2025-01-10
   ↓
5. Server: ResultsController.findAll()
   ↓
6. ResultsService.findAll() → DB 조회
   ↓
7. 날짜 필터링 및 페이지네이션
   ↓
8. Mobile로 결과 반환
   ↓
9. Results 화면에 결과 목록 표시
```

## 🎯 테스트 체크리스트

### Server 테스트

- [ ] MySQL 실행 중
- [ ] Server 실행 중 (포트 3002)
- [ ] API 문서 접근 가능 (http://localhost:3002/api/docs)
- [ ] Health check 성공
- [ ] KRA API 상태 정상
- [ ] 로그 파일 생성 확인

### Mobile 테스트

- [ ] Expo 서버 실행 중
- [ ] Base URL 올바르게 설정
- [ ] 로그인 성공
- [ ] 홈 화면 로드 성공
- [ ] 경주 목록 표시
- [ ] 결과 목록 표시

### 통합 테스트

- [ ] Mobile → Server 통신 성공
- [ ] Server → KRA API 통신 성공
- [ ] 데이터 자동 변환 확인
- [ ] 날짜 형식 변환 정상
- [ ] 에러 처리 정상
- [ ] 로딩 상태 표시

## 📈 성능 테스트

### API 응답 시간 측정

```bash
# Server 로그에서 확인
# [KRA API] 경주계획표 | Items: 12 | Duration: 850ms
```

**목표:**

- KRA API 호출: < 2초
- DB 조회: < 100ms
- 전체 응답: < 3초

### Mobile 렌더링 측정

```typescript
// Mobile 개발자 도구에서 Performance 탭 확인
// React Native Performance Monitor 활성화
```

## 🎉 성공 기준

### Server

1. ✅ 모든 API 엔드포인트 응답 200
2. ✅ KRA API 상태 healthy
3. ✅ 배치 작업 정상 실행
4. ✅ DB에 데이터 저장 확인

### Mobile

1. ✅ 모든 화면 로드 성공
2. ✅ 실시간 데이터 표시
3. ✅ 로딩 상태 표시
4. ✅ 에러 메시지 표시

### 통합

1. ✅ Mobile → Server 통신
2. ✅ Server → KRA API 통신
3. ✅ 데이터 일관성 유지
4. ✅ 캐싱 동작 확인

## 🔧 환경 설정 최종 확인

### Server .env

```env
# 필수
KRA_API_KEY=yyRDa%2FaXc9SsDdY67Iq...
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=goldenrace_user
DB_PASSWORD=goldenrace_password
DB_DATABASE=goldenrace

# 선택
NODE_ENV=development
BATCH_ENABLED=true
DB_LOGGING=false
```

### Mobile utils/Constants.ts

```typescript
export const SERVER_CONFIG = {
  BASE_URL: 'http://10.0.2.2:3002', // Android
  LOCAL_URL: 'http://localhost:3002', // iOS
  TIMEOUT: 10000,
};
```

## 📞 최종 확인

모든 체크리스트를 완료했다면:

```bash
# 1. Server 상태 확인
curl http://localhost:3002/api/health
curl http://localhost:3002/api/kra-api/status

# 2. Mobile 앱 실행
npx expo start

# 3. 앱에서 확인
- 로그인
- 홈 화면에서 오늘의 경주 확인
- 경주 화면에서 목록 확인
- 결과 화면에서 검색 테스트
```

## 🎊 통합 완료!

축하합니다! Server와 Mobile이 완벽하게 연결되었습니다!

---

> 🏇 **Golden Race** - 이제 실시간 경마 데이터를 즐기세요!
