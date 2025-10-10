# Golden Race 모바일 앱 구현 계획서

## 📱 프로젝트 현황 요약

**현재 상태**: 기본 인프라, 인증 시스템, UI 컴포넌트 완성 (약 40% 완성) **목표**: MVP 완성 후 베타
테스트 진행 **예상 완성 기간**: 2-3주 (단축됨)

## 🎯 Phase 1: 핵심 기능 완성 (1-2주)

### 모바일 앱 작업

#### 1. 경주 화면 완성 (3-4일)

**구현 작업**:

- [x] 기본 네비게이션 구조
- [x] 경주 목록 화면 기본 UI
- [ ] 경주 목록 화면 UI/UX 개선
- [ ] 경주 상세 화면 구현
- [ ] 출마 말 정보 표시
- [ ] 실시간 데이터 연동

**필요 파일**:

- `mobile/app/races/races.tsx` - 경주 목록 화면
- `mobile/app/races/[raceId].tsx` - 경주 상세 화면
- `mobile/components/races/RaceCard.tsx` - 경주 카드 컴포넌트
- `mobile/components/races/RaceDetail.tsx` - 경주 상세 컴포넌트

#### 2. 베팅 화면 구현 (4-5일)

**구현 작업**:

- [ ] 베팅 선택 화면
- [ ] 베팅 확인 화면
- [ ] 베팅 내역 화면
- [ ] 베팅 결과 화면

**필요 파일**:

- `mobile/app/betting/betting.tsx` - 베팅 선택 화면
- `mobile/app/betting/confirm.tsx` - 베팅 확인 화면
- `mobile/app/betting/history.tsx` - 베팅 내역 화면
- `mobile/components/betting/BettingForm.tsx` - 베팅 폼 컴포넌트
- `mobile/components/betting/BettingCard.tsx` - 베팅 카드 컴포넌트

#### 3. 기본 알림 시스템 (2-3일)

**구현 작업**:

- [x] 알림 설정 화면
- [ ] 푸시 알림 권한 요청
- [ ] 로컬 알림 구현
- [ ] 알림 설정 저장

**필요 파일**:

- `mobile/app/mypage/notifications.tsx` - 알림 설정 (기존)
- `mobile/services/NotificationService.ts` - 알림 서비스
- `mobile/hooks/useNotifications.ts` - 알림 훅

#### 4. 결과 화면 완성 (2-3일)

**구현 작업**:

- [x] 기본 결과 화면 구조
- [ ] 경주 결과 상세 표시
- [ ] 베팅 결과 연동
- [ ] 통계 정보 표시

**필요 파일**:

- `mobile/app/results/results.tsx` - 결과 목록 화면
- `mobile/components/results/ResultCard.tsx` - 결과 카드 컴포넌트
- `mobile/components/results/Statistics.tsx` - 통계 컴포넌트

### 기술적 개선

#### 1. 상태 관리 최적화

- [x] React Query 설정
- [x] Zustand 스토어 설정
- [ ] API 캐싱 전략 구현
- [ ] 오프라인 지원

#### 2. 성능 최적화

- [ ] 이미지 최적화
- [ ] 리스트 가상화
- [ ] 메모리 누수 방지
- [ ] 번들 크기 최적화

## 🚀 Phase 2: 고급 기능 구현 (2-3주)

### 1. 실시간 기능

- [ ] WebSocket 연결
- [ ] 실시간 경주 상태 업데이트
- [ ] 실시간 배당률 변경
- [ ] 실시간 베팅 현황

### 2. 고급 UI/UX

- [ ] 애니메이션 효과
- [ ] 제스처 기반 인터랙션
- [ ] 다크/라이트 테마 전환
- [ ] 접근성 개선

### 3. 오프라인 지원

- [ ] 데이터 캐싱
- [ ] 오프라인 모드
- [ ] 동기화 메커니즘

## 📱 화면별 상세 계획

### 경주 화면 (`/races`)

```
races/
├── 목록 화면
│   ├── 날짜별 필터
│   ├── 경마장별 필터
│   ├── 검색 기능
│   └── 정렬 옵션
├── 상세 화면
│   ├── 경주 정보
│   ├── 출마 말 목록
│   ├── 배당률 정보
│   └── 베팅 버튼
└── 컴포넌트
    ├── RaceCard
    ├── RaceDetail
    ├── HorseList
    └── OddsDisplay
```

### 베팅 화면 (`/betting`)

```
betting/
├── 선택 화면
│   ├── 말 선택
│   ├── 베팅 유형 선택
│   ├── 금액 입력
│   └── 예상 배당률
├── 확인 화면
│   ├── 베팅 정보 요약
│   ├── 최종 확인
│   └── 결제 연동
└── 내역 화면
    ├── 진행 중 베팅
    ├── 완료된 베팅
    └── 통계 정보
```

### 마이페이지 (`/mypage`)

```
mypage/
├── 프로필
│   ├── 사용자 정보
│   ├── 설정 변경
│   └── 계정 관리
├── 베팅 내역
│   ├── 전체 내역
│   ├── 필터링
│   └── 상세 정보
├── 즐겨찾기
│   ├── 말 즐겨찾기
│   ├── 경마장 즐겨찾기
│   └── 알림 설정
└── 설정
    ├── 알림 설정
    ├── 개인정보 설정
    └── 앱 설정
```

## 🔧 기술 스택

### 프론트엔드

- **React Native**: 크로스 플랫폼 개발
- **Expo**: 개발 환경 및 배포
- **TypeScript**: 타입 안전성
- **React Navigation**: 네비게이션
- **React Query**: 서버 상태 관리
- **Zustand**: 클라이언트 상태 관리

### UI/UX

- **NativeBase**: UI 컴포넌트 라이브러리
- **React Native Reanimated**: 애니메이션
- **React Native Gesture Handler**: 제스처
- **React Native Vector Icons**: 아이콘

### 개발 도구

- **ESLint**: 코드 품질
- **Prettier**: 코드 포맷팅
- **Husky**: Git 훅
- **Jest**: 테스트

## 📊 성능 목표

### 로딩 시간

- **앱 시작**: < 3초
- **화면 전환**: < 500ms
- **데이터 로딩**: < 2초

### 메모리 사용량

- **최대 메모리**: < 200MB
- **백그라운드**: < 50MB

### 배터리 효율성

- **백그라운드 실행**: 최소화
- **네트워크 요청**: 최적화
- **로컬 처리**: 최대화

## 🧪 테스트 계획

### 단위 테스트

- [ ] 컴포넌트 테스트
- [ ] 훅 테스트
- [ ] 유틸리티 함수 테스트

### 통합 테스트

- [ ] 화면 간 네비게이션
- [ ] API 연동 테스트
- [ ] 상태 관리 테스트

### E2E 테스트

- [ ] 사용자 플로우 테스트
- [ ] 베팅 프로세스 테스트
- [ ] 에러 처리 테스트

## 📱 배포 계획

### 개발 단계

O1. **개발 환경**: Expo Go 앱으로 테스트
2. **스테이징**: TestFlight (iOS) / Internal Testing (Android)
3. **프로덕션**: App Store / Google Play Store

### 버전 관리

- **v1.0.0**: MVP 릴리즈
- **v1.1.0**: 베팅 시스템 완성
- **v1.2.0**: 실시간 기능 추가
- **v2.0.0**: 고급 기능 완성

## 🔗 관련 문서

### 서버 API 문서

- [KRA API 연동 가이드](../../server/docs/KRA_API_INTEGRATION.md)
- [에러 처리 시스템](../../server/docs/ERROR_HANDLING_SYSTEM.md)
- [API 가이드라인](../../server/docs/API_GUIDELINES.md)

### 전체 프로젝트 문서

- [프로젝트 개요](../PROJECT_OVERVIEW.md)
- [아키텍처 개요](../ARCHITECTURE_OVERVIEW.md)
- [개발 가이드](../DEVELOPMENT_GUIDE.md)

---

> 📱 **참고**: 이 문서는 모바일 앱 구현에만 집중합니다. 서버 구현은 별도 문서를 참조하세요.
