# 🏇 Golden Race

**AI 기반 한국 경마 예측 게임 플랫폼**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

> 머신러닝과 데이터 분석을 활용한 혁신적인 경마 예측 시뮬레이션

---

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [빠른 시작](#-빠른-시작)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [문서](#-문서)
- [법적 고지](#-법적-고지)

---

## 🎯 프로젝트 소개

Golden Race는 **AI/ML 기술**을 활용하여 한국 경마의 승부를 예측하는 **교육 및 엔터테인먼트 플랫
폼**입니다.

### 핵심 가치

| 특징               | 설명                                    |
| ------------------ | --------------------------------------- |
| 🤖 **AI 예측**     | 머신러닝 기반 경주 결과 예측            |
| 📊 **데이터 분석** | 한국마사회 공식 API 연동 및 데이터 학습 |
| 🎮 **게임화**      | 재미있는 예측 경쟁 및 랭킹 시스템       |
| 📚 **교육**        | AI/ML 및 데이터 분석 학습               |

---

## ✨ 주요 기능

### 사용자 기능

- 🔐 **Google OAuth** 소셜 로그인
- 🏇 **경주 정보** 실시간 조회
- 🎯 **예측 참여** 게임 플레이
- ⭐ **즐겨찾기** 경주/말 관리
- 📈 **통계 분석** 개인 성적 및 랭킹
- 🎁 **포인트 시스템** 가상 화폐

### 시스템 기능

- 📡 **자동 데이터 수집** 매일 경주 정보 동기화
- 💾 **로컬 DB 캐싱** 빠른 응답 속도
- 🔄 **배치 작업** 경주계획/결과/배당율 자동 수집
- 📊 **통계 생성** 경주마/기수/조교사 분석

---

## 🚀 빠른 시작

### 사전 요구사항

```bash
Node.js 18+
Docker & Docker Compose
MySQL 8.0+
npm or yarn
```

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/goldenrace.git
cd goldenrace
```

### 2. 서버 실행

```bash
cd server

# 환경 변수 설정
cp env.example .env
# .env 파일에서 필요한 값 설정

# 의존성 설치
npm install

# Docker로 MySQL 시작
docker-compose up -d

# 개발 서버 시작
npm run start:dev
```

서버가 `http://localhost:3002`에서 실행됩니다.

### 3. 모바일 앱 실행

```bash
cd mobile

# 의존성 설치
npm install

# Expo 개발 서버 시작
npx expo start
```

Expo Go 앱에서 QR 코드를 스캔하여 앱을 실행하세요.

### 4. 동작 확인

```bash
# 서버 상태 확인
curl http://localhost:3002/api/health

# KRA API 상태 확인
curl http://localhost:3002/kra-api/status
```

---

## 🛠️ 기술 스택

### Backend (NestJS)

```typescript
Framework: NestJS 10.x
Language: TypeScript
Database: MySQL 8.0 + TypeORM
Authentication: Passport.js + JWT
API: RESTful + Swagger
```

### Mobile (React Native)

```typescript
Framework: React Native + Expo
Language: TypeScript
State: TanStack Query + Redux Toolkit
Navigation: Expo Router
UI: Custom Components + Theming
```

### Infrastructure

```yaml
Container: Docker + Docker Compose
Database: MySQL 8.0
Cache: Local DB (향후 Redis)
Scheduler: NestJS Schedule
```

### AI/ML (계획 중)

```python
Language: Python
Framework: TensorFlow / PyTorch
Models: XGBoost / LightGBM
API: FastAPI
```

---

## 📁 프로젝트 구조

```
goldenrace/
├── 📱 mobile/                 # React Native 모바일 앱
│   ├── app/                   # Expo Router 화면
│   │   ├── (app)/            # 인증 후 화면
│   │   └── (auth)/           # 인증 화면
│   ├── components/            # 재사용 컴포넌트
│   ├── lib/                   # API 클라이언트 & 훅
│   └── constants/             # 상수 & 테마
│
├── 🖥️ server/                 # NestJS 백엔드 서버
│   ├── src/
│   │   ├── auth/             # 인증 모듈
│   │   ├── users/            # 사용자 관리
│   │   ├── kra-api/          # 한국마사회 API 통합
│   │   ├── races/            # 경주 정보
│   │   ├── results/          # 경주 결과
│   │   ├── bets/             # 예측(베팅)
│   │   ├── batch/            # 배치 작업
│   │   └── points/           # 포인트 시스템
│   └── mysql/                 # DB 스키마
│
└── 📖 docs/                   # 프로젝트 문서
    ├── setup/                 # 설치 가이드
    ├── guides/                # 사용 가이드
    └── reference/             # API 레퍼런스
```

---

## 🤖 AI 예측 시스템

### 현재 진행 상황

| 단계        | 상태      | 설명                    |
| ----------- | --------- | ----------------------- |
| 데이터 수집 | ✅ 완료   | 한국마사회 API 4개 통합 |
| 데이터 저장 | ✅ 완료   | MySQL 데이터베이스 구축 |
| 자동화      | ✅ 완료   | 배치 작업 스케줄링      |
| 특징 추출   | 🔄 진행중 | 경주마/기수 통계 추출   |
| 모델 학습   | 📅 예정   | ML 모델 개발            |
| 예측 API    | 📅 예정   | FastAPI 서버 구축       |

### 데이터 소스 (한국마사회 공식 API)

- **경주계획표** (API72_2): 예정 경주 일정
- **경주기록** (API4_3): 과거 경주 결과 (50,000+ 레코드)
- **출전표** (API26_2): 출전 말 상세 정보 (500,000+ 레코드)
- **확정배당율** (API160): 배당률 정보

---

## 📚 문서

### 문서 허브

**📚 [통합 문서 허브](docs/README.md)** - 모든 문서를 한 곳에서!

### 빠른 링크

#### 시작하기

- [빠른 시작](docs/setup/QUICK_START.md) - 5분 안에 실행
- [Docker 설정](docs/setup/DOCKER_SETUP.md) - 컨테이너 환경
- [환경 변수](docs/setup/ENVIRONMENT.md) - 설정 관리

#### 아키텍처

- [프로젝트 개요](docs/architecture/PROJECT_OVERVIEW.md) - 전체 비전
- [모바일 아키텍처](docs/architecture/mobile/) - 앱 구조
- [서버 아키텍처](docs/architecture/server/) - DB 및 엔티티

#### 개발 가이드

- [모바일 개발](docs/guides/mobile/) - UI, 테마
- [서버 개발](docs/guides/server/) - 데이터 수집, KRA API
- [인증](docs/guides/authentication/) - Google OAuth

#### 기능 및 API

- [AI 시스템](docs/features/ai/) - AI 예측
- [게임 시스템](docs/features/game/) - 베팅, 포인트
- [API 문서](docs/api/) - REST & KRA API

#### 참고

- [경마 용어](docs/reference/HORSE_RACING_TERMINOLOGY.md) - 용어 사전
- [법적 고지](LEGAL_NOTICE.md) - 중요 법적 정보

---

## ⚠️ 법적 고지

### 서비스 성격

본 서비스는 **교육 및 엔터테인먼트 목적**의 예측 게임이며, 다음을 준수합니다:

| 허용 ✅                  | 금지 ❌        |
| ------------------------ | -------------- |
| 게임 내 가상 포인트 사용 | 현금 충전/환전 |
| 예측 시뮬레이션 및 경쟁  | 실제 도박/베팅 |
| 무료 포인트 지급         | 현금 거래      |
| 랭킹 시스템              | 포인트 현금화  |

### 포인트 정책

- 포인트는 **현금 가치가 없으며** 게임 플레이에만 사용
- 포인트의 **충전/환전/입출금 일체 금지**
- 포인트는 **환불/교환 불가**

**자세한 내용**: [법적 고지사항](LEGAL_NOTICE.md)

---

## 🤝 기여

기여를 환영합니다! 다음 방법으로 참여할 수 있습니다:

1. 이슈 등록 - 버그 리포트 또는 기능 제안
2. Pull Request - 코드 개선 제안
3. 문서 개선 - 오타 수정 또는 설명 추가

---

## 📄 라이선스

본 프로젝트는 교육 및 연구 목적으로 제공됩니다.

---

## 📞 연락처

- **이메일**: vcjsm2283@gmail.com
- **프로젝트**: Golden Race
- **문서**: [docs/](docs/)

---

<div align="center">

**⚖️ Golden Race는 게임 내 가상 화폐를 사용하는 예측 게임입니다.**  
**실제 도박/베팅과 무관하며, 포인트는 어떠한 형태로도 현금화될 수 없습니다.**

**마지막 업데이트**: 2025년 10월 10일

</div>
