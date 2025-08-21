# Golden Race - 모바일 앱 개요

## 📱 프로젝트 개요

Golden Race는 경마 애호가들을 위한 모바일 애플리케이션으로, 실시간 경주 정보, 베팅 시스템, 그리고 사
용자 맞춤형 서비스를 제공합니다.

**프론트엔드**: React Native + Expo (TypeScript) **상태 관리**: React Query (TanStack Query) +
Zustand **인증**: Google OAuth 2.0 + JWT **UI/UX**: NativeBase + 커스텀 테마

## 📱 현재 구현 상태 (2024년 3월 기준)

### ✅ 완료된 기능

#### 모바일 앱 (React Native)

- [x] Expo 기반 프로젝트 구조
- [x] Google 로그인 연동
- [x] 기본 네비게이션 구조
- [x] 테마 시스템 (라이트/다크 모드)
- [x] 사용자 인증 컨텍스트
- [x] React Query 설정
- [x] 기본 UI 컴포넌트
- [x] 마이페이지 화면들

### 🚧 진행 중인 기능

- [ ] KRA API 실시간 데이터 연동
- [ ] 베팅 시스템 구현
- [ ] 실시간 알림 시스템
- [ ] 경주 결과 처리 로직

### ❌ 미구현 기능

- [ ] 베팅 엔티티 및 API 연동
- [ ] 실시간 WebSocket 연결
- [ ] 푸시 알림 서비스
- [ ] 통계 및 분석 기능
- [ ] 결제 시스템 연동

## 🎯 주요 기능 계획

### 1. 사용자 인증 및 프로필 ✅

- **Google 소셜 로그인**: Google 계정 기반의 사용자 인증 ✅
- **프로필 관리**: 사용자 정보 및 설정 관리 ✅
- **개인화**: 사용자 선호도에 따른 맞춤형 서비스 ✅

### 2. 경주 정보 🚧

- **경주 목록 조회**: 서버에서 가져온 예정된 경주 리스트를 날짜와 장소별로 확인 🚧
- **경주 상세 정보**: 각 경주의 상세 정보, 출마 말 정보, 배당률 등 🚧
- **실시간 업데이트**: 경주 상태 및 결과의 실시간 업데이트 ❌

### 3. 베팅 시스템 ❌

- **베팅 플레이스**: 사용자가 원하는 말에 베팅할 수 있는 시스템 ❌
- **베팅 내역**: 사용자의 베팅 기록 및 결과 확인 ❌
- **배당률 계산**: 실시간 배당률 계산 및 표시 ❌

### 4. 결과 및 통계 ❌

- **경주 결과**: 완료된 경주의 결과 및 순위 🚧
- **통계 분석**: 말, 기수, 조교사별 성적 통계 ❌
- **히스토리**: 과거 경주 결과 및 베팅 내역 ❌

## 🔧 기술적 특징

### 1. 아키텍처 ✅

- **모듈화된 구조**: 기능별로 분리된 컴포넌트 구조 ✅
- **타입 안전성**: TypeScript를 통한 타입 안전성 ✅
- **상태 관리**: React Query + Zustand를 통한 효율적인 상태 관리 ✅

### 2. UI/UX ✅

- **크로스 플랫폼**: iOS/Android 동시 지원 ✅
- **테마 시스템**: 라이트/다크 모드 지원 ✅
- **반응형 디자인**: 다양한 화면 크기 대응 ✅
- **접근성**: 스크린 리더 및 접근성 기능 지원 🚧

### 3. 성능 최적화 🚧

- **이미지 최적화**: 효율적인 이미지 로딩 및 캐싱 🚧
- **메모리 관리**: 메모리 누수 방지 및 최적화 🚧
- **번들 최적화**: 앱 크기 최적화 ❌

## 📱 화면 구조

### 메인 네비게이션

```
Tab Navigator
├── Home (경주 목록)
├── Races (경주 정보)
├── Betting (베팅)
├── Results (결과)
└── MyPage (마이페이지)
```

### 화면별 상세

```
Home/
├── 오늘의 경주
├── 추천 경주
├── 빠른 베팅
└── 공지사항

Races/
├── 경주 목록
├── 경주 상세
├── 출마 말 정보
└── 배당률 정보

Betting/
├── 베팅 선택
├── 베팅 확인
├── 베팅 내역
└── 베팅 결과

Results/
├── 경주 결과
├── 베팅 결과
├── 통계 정보
└── 히스토리

MyPage/
├── 프로필
├── 베팅 내역
├── 즐겨찾기
├── 알림 설정
└── 앱 설정
```

## 🎨 UI/UX 가이드라인

### 디자인 원칙

- **사용자 중심**: 직관적이고 쉬운 사용성
- **일관성**: 전체 앱에서 일관된 디자인 언어
- **접근성**: 모든 사용자가 사용할 수 있는 인터페이스
- **성능**: 빠르고 부드러운 사용자 경험

### 색상 시스템

- **Primary**: 경마의 역동성을 표현하는 파란색 계열
- **Secondary**: 승리를 상징하는 금색 계열
- **Success**: 성공/승리를 나타내는 초록색
- **Warning**: 주의/경고를 나타내는 주황색
- **Error**: 오류/실패를 나타내는 빨간색

### 타이포그래피

- **Heading**: 경주 제목, 섹션 제목
- **Body**: 일반 텍스트, 설명
- **Caption**: 작은 텍스트, 라벨
- **Button**: 버튼 텍스트

## 📊 데이터 모델

### 경주 정보

```typescript
interface Race {
  id: string;
  meetCode: string; // 경마장 코드
  raceDate: string; // 경주일
  raceNumber: number; // 경주 번호
  raceName: string; // 경주명
  distance: number; // 거리
  grade: string; // 등급
  prize: number; // 상금
  horses: Horse[]; // 출마 말 목록
  status: RaceStatus; // 경주 상태
}
```

### 말 정보

```typescript
interface Horse {
  id: string;
  number: number; // 출주 번호
  name: string; // 말 이름
  age: number; // 나이
  sex: string; // 성별
  weight: number; // 부담중량
  jockey: string; // 기수
  trainer: string; // 조교사
  odds: number; // 배당률
}
```

### 베팅 정보

```typescript
interface Bet {
  id: string;
  userId: string; // 사용자 ID
  raceId: string; // 경주 ID
  horseId: string; // 말 ID
  betType: BetType; // 베팅 유형
  amount: number; // 베팅 금액
  odds: number; // 배당률
  status: BetStatus; // 베팅 상태
  createdAt: Date; // 베팅 시간
}
```

## 🚀 개발 로드맵

### Phase 1: MVP (2-3주)

- [ ] 경주 화면 완성
- [ ] 베팅 화면 구현
- [ ] 기본 알림 시스템
- [ ] 결과 화면 완성

### Phase 2: 고급 기능 (2-3주)

- [ ] 실시간 기능
- [ ] 고급 UI/UX
- [ ] 오프라인 지원

### Phase 3: 최적화 (1-2주)

- [ ] 성능 최적화
- [ ] 테스트 완성
- [ ] 앱 스토어 배포

## 🔗 관련 문서

### 서버 API 문서

- [KRA API 연동 가이드](../../server/docs/KRA_API_INTEGRATION.md)
- [에러 처리 시스템](../../server/docs/ERROR_HANDLING_SYSTEM.md)
- [API 가이드라인](../../server/docs/API_GUIDELINES.md)

### 모바일 앱 문서

- [구현 계획서](./IMPLEMENTATION_PLAN.md)
- [UI 컴포넌트 가이드](./UI_COMPONENTS.md)
- [네비게이션 가이드](./NAVIGATION.md)
- [테마 시스템](./Theming.md)
- [인증 시스템](./Authentication.md)

### 전체 프로젝트 문서

- [프로젝트 개요](../PROJECT_OVERVIEW.md)
- [아키텍처 개요](../ARCHITECTURE_OVERVIEW.md)
- [개발 가이드](../DEVELOPMENT_GUIDE.md)

---

> 📱 **참고**: 이 문서는 모바일 앱의 기능과 구조에만 집중합니다. 서버 구현은 별도 문서를 참조하세요.
