# 📱 Golden Race Mobile App

**React Native 경마 예측 게임 모바일 애플리케이션**

> Expo + TypeScript 기반 크로스 플랫폼 앱

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [빠른 시작](#-빠른-시작)
- [프로젝트 구조](#-프로젝트-구조)
- [문서](#-문서)

---

## ✨ 주요 기능

### 경주 정보

- 🏇 **실시간 경주 조회** - 오늘/예정 경주 일정
- 📊 **상세 정보** - 출전마, 기수, 조교사 정보
- ⭐ **즐겨찾기** - 관심 경주마/경주 저장
- 🔍 **검색 기능** - 경주/경주마 검색

### 예측 게임 (베팅 시스템)

- 🎯 **7가지 승식 지원**
  - 단승식, 복승식, 연승식
  - 복연승식, 쌍승식
  - 삼복승식, 삼쌍승식
- 💰 **실시간 배당률** - KRA API 연동
- 🎁 **포인트 시스템** - 가상 화폐 관리

### 사용자 관리

- 🔐 **Google OAuth** - 소셜 로그인
- 📈 **개인 통계** - 예측 성적 및 랭킹
- 🎮 **게임 히스토리** - 예측 기록 관리
- 🏆 **리더보드** - 사용자 순위

---

## 🛠️ 기술 스택

### Core

```typescript
Framework: React Native + Expo
Language: TypeScript 5.x
Runtime: Node.js 18+
```

### State Management

```typescript
Global State: Redux Toolkit
Server State: TanStack Query (React Query)
Context: React Context API
```

### UI & Navigation

```typescript
Navigation: Expo Router
UI Components: Custom Themed Components
Icons: @expo/vector-icons
```

### API & Auth

```typescript
HTTP Client: Axios
Authentication: Google OAuth 2.0
Token: JWT (AsyncStorage)
```

---

## 🚀 빠른 시작

### 사전 요구사항

```bash
Node.js 18+
npm or yarn
Expo CLI
```

### 설치 및 실행

```bash
# 프로젝트 디렉토리 이동
cd mobile

# 의존성 설치
npm install

# 개발 서버 시작
npx expo start

# iOS 시뮬레이터 (macOS만 가능)
npm run ios

# Android 에뮬레이터
npm run android

# 웹 브라우저
npm run web
```

### 환경 설정

```bash
# API 서버 URL 설정
# config/environment.ts 파일 수정
export const API_CONFIG = {
  baseURL: 'http://localhost:3002', // 서버 URL
};
```

---

## 📁 프로젝트 구조

```
mobile/
├── 📱 app/                    # Expo Router 화면
│   ├── (app)/                # 인증 후 화면
│   │   ├── home.tsx          # 홈 화면
│   │   ├── betting.tsx       # 베팅 화면
│   │   ├── races.tsx         # 경주 목록
│   │   ├── results.tsx       # 결과 화면
│   │   └── mypage/           # 마이페이지
│   ├── (auth)/               # 인증 화면
│   │   └── login.tsx         # 로그인
│   └── _layout.tsx           # 루트 레이아웃
│
├── 🧩 components/            # 재사용 컴포넌트
│   ├── common/               # 공통 컴포넌트
│   ├── screens/              # 화면별 컴포넌트
│   ├── modals/               # 모달
│   └── ui/                   # UI 기본 컴포넌트
│
├── 📚 lib/                   # 라이브러리
│   ├── api/                  # API 클라이언트
│   ├── hooks/                # 커스텀 훅
│   └── types/                # TypeScript 타입
│
├── 🎨 constants/             # 상수
│   ├── theme.ts              # 테마 설정
│   ├── race.ts               # 경주 관련 상수
│   └── betting.ts            # 베팅 관련 상수
│
├── 🗂️ store/                 # Redux 스토어
│   ├── authSlice.ts          # 인증 상태
│   └── modalSlice.ts         # 모달 상태
│
└── 📖 docs/                  # 문서
    ├── ARCHITECTURE.md       # 아키텍처
    ├── UI_COMPONENTS.md      # UI 컴포넌트
    └── NAVIGATION.md         # 네비게이션
```

---

## 🎯 경마 용어

### 승식 (Bet Types)

| 승식         | 설명                      | 예시                      |
| ------------ | ------------------------- | ------------------------- |
| **단승식**   | 1마리가 1등               | 1번 마 1등                |
| **복승식**   | 1마리가 1~3등             | 1번 마가 3등 안에         |
| **연승식**   | 2마리가 1~2등 (순서 무관) | 1번, 2번 마가 1~2등       |
| **복연승식** | 2마리가 1~3등 (순서 무관) | 1번, 2번 마가 3등 안에    |
| **쌍승식**   | 2마리가 1~2등 (순서 O)    | 1번 1등, 2번 2등          |
| **삼복승식** | 3마리가 1~3등 (순서 무관) | 1, 2, 3번이 3등 안에      |
| **삼쌍승식** | 3마리가 1~3등 (순서 O)    | 1번 1등, 2번 2등, 3번 3등 |

### 승률 (Win Rates)

- **단승률**: 1위 입상률
- **복승률**: 2위 이내 입상률
- **연승률**: 3위 이내 입상률

자세한 용어 설명: [경마 용어 가이드](docs/HORSE_RACING_TERMINOLOGY.md)

---

## 📖 화면 구성

### 주요 화면

| 화면       | 경로            | 설명                |
| ---------- | --------------- | ------------------- |
| 로그인     | `(auth)/login`  | Google OAuth 로그인 |
| 홈         | `(app)/home`    | 오늘의 경주 일정    |
| 경주 목록  | `(app)/races`   | 전체 경주 검색      |
| 베팅       | `(app)/betting` | 예측 참여           |
| 결과       | `(app)/results` | 경주 결과 확인      |
| 마이페이지 | `(app)/mypage`  | 개인 정보 및 통계   |

자세한 네비게이션: [네비게이션 가이드](docs/NAVIGATION.md)

---

## 📚 문서

**통합 문서 허브**: [../docs/](../docs/README.md)

### 빠른 링크

#### 아키텍처

- [모바일 아키텍처](../docs/architecture/mobile/ARCHITECTURE.md) - 앱 구조
- [네비게이션](../docs/architecture/mobile/NAVIGATION.md) - 화면 구조
- [상태 관리](../docs/architecture/mobile/STATE_MANAGEMENT.md) - Redux & React Query

#### 개발 가이드

- [UI 컴포넌트](../docs/guides/mobile/UI_COMPONENTS.md) - 컴포넌트 가이드
- [테마 시스템](../docs/guides/mobile/Theming.md) - 스타일링
- [로컬 DB](../docs/guides/mobile/Database.md) - 데이터 저장

#### 기능 및 배포

- [앱 기능](../docs/features/mobile/HorseRacingApp.md) - 기능 상세
- [구현 계획](../docs/features/mobile/IMPLEMENTATION_PLAN.md) - 로드맵
- [배포 가이드](../docs/guides/deployment/mobile.md) - 앱 스토어

#### 인증 및 참고

- [Google OAuth](../docs/guides/authentication/Authentication.md) - 인증 구현
- [경마 용어](../docs/reference/HORSE_RACING_TERMINOLOGY.md) - 용어 사전

---

## 🧪 테스트

```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 커버리지
npm run test:cov
```

---

## 🔧 개발 도구

### Expo 도구

```bash
# Expo 개발자 도구
npx expo start

# 캐시 삭제 후 시작
npx expo start -c

# TypeScript 검사
npx tsc --noEmit
```

### 디버깅

- **React Native Debugger**: 추천 디버깅 도구
- **Expo Dev Tools**: 내장 디버깅 도구
- **Flipper**: 네트워크 디버깅

---

## 📦 빌드

### 개발 빌드

```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios
```

### 프로덕션 빌드

```bash
# Android
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios
```

자세한 내용: [배포 가이드](docs/Deployment.md)

---

## ⚠️ 법적 고지

본 앱은 **교육 및 엔터테인먼트 목적**의 예측 게임입니다.

- ✅ 게임 내 가상 포인트 사용
- ❌ 현금 충전/환전 금지
- ❌ 실제 도박/베팅 아님

자세한 내용: [법적 고지](../LEGAL_NOTICE.md)

---

## 🤝 기여

기여를 환영합니다!

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/Feature`)
3. Commit Changes (`git commit -m 'Add Feature'`)
4. Push to Branch (`git push origin feature/Feature`)
5. Open Pull Request

---

## 📞 문의

- **이메일**: vcjsm2283@gmail.com
- **프로젝트**: [Golden Race](../README.md)
- **이슈**: GitHub Issues

---

<div align="center">

**마지막 업데이트**: 2025년 10월 10일

🏇 **Golden Race Mobile** - 경마 예측 게임

</div>
