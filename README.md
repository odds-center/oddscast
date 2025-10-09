# 🏇 Golden Race

**AI 기반 한국 경마 예측 게임 플랫폼**

> 머신러닝과 데이터 분석을 활용한 혁신적인 경마 예측 시뮬레이션

## 🎯 프로젝트 비전

Golden Race는 **AI/ML 기술**을 활용하여 한국 경마의 승부를 예측하는 **교육 및 엔터테인먼트 플랫폼**입니다.

### 핵심 가치

- 🤖 **AI 예측**: 머신러닝 기반 경주 결과 예측
- 📊 **데이터 분석**: 과거 데이터 학습 및 패턴 인식
- 🎮 **게임화**: 재미있는 예측 경쟁 및 랭킹 시스템
- 📚 **교육**: AI/ML 및 데이터 분석 학습

## ⚠️ 중요 안내

### 법적 준수

본 서비스는 **교육 및 엔터테인먼트 목적**의 게임이며, 다음을 준수합니다:

- ✅ 게임 내 가상 화폐 (포인트) 사용
- ✅ 예측 시뮬레이션 및 경쟁
- ❌ **현금 거래 일체 금지** (충전/환전/입출금)
- ❌ **실제 도박/베팅 아님**

포인트는 **현금 가치가 없으며**, 게임 플레이에만 사용됩니다.

## 🏗️ 프로젝트 구조

```
goldenrace/
├── mobile/                 # React Native 모바일 앱
│   ├── app/               # Expo Router 기반 화면
│   ├── components/        # 재사용 가능한 컴포넌트
│   ├── lib/              # API 클라이언트 및 훅
│   └── constants/        # 상수 및 테마
│
├── server/                # NestJS 백엔드 서버
│   ├── src/
│   │   ├── kra-api/      # 한국마사회 API 통합
│   │   ├── races/        # 경주 정보 관리
│   │   ├── results/      # 경주 결과 관리
│   │   ├── bets/         # 예측(베팅) 관리
│   │   ├── favorites/    # 즐겨찾기 관리
│   │   ├── points/       # 포인트 시스템
│   │   ├── users/        # 사용자 관리
│   │   └── auth/         # 인증 (Google OAuth)
│   └── mysql/            # 데이터베이스 스키마
│
└── docs/                  # 프로젝트 문서
    ├── AI_FEATURES.md    # AI 기능 설계
    └── AI_PREDICTION_ROADMAP.md  # AI 개발 로드맵
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0+
- npm or yarn

### 서버 실행

```bash
cd server
npm install
docker-compose up -d  # MySQL 시작
npm run start:dev     # 개발 서버 시작
```

### 모바일 앱 실행

```bash
cd mobile
npm install
npx expo start        # Expo 개발 서버
```

## 🤖 AI 예측 시스템 (개발 중)

### 현재 단계

- ✅ **데이터 수집**: 한국마사회 API 통합 완료
- ✅ **데이터 저장**: MySQL 데이터베이스 구축
- ✅ **자동화**: 배치 작업으로 자동 수집
- 🔄 **특징 추출**: 진행 중
- 📅 **모델 학습**: 계획 중
- 📅 **예측 API**: 계획 중

### 예정 기능

- 🎯 경주 결과 예측 (승마 예측)
- 📊 예측 확률 및 신뢰도
- 🧠 예측 근거 설명 (Explainable AI)
- 📈 과거 예측 정확도 추적
- 🏆 AI vs 사용자 경쟁

## 📊 데이터 소스

### 한국마사회 공공 API

- **경주 기록** (API4_3): 과거 경주 결과
- **출전표** (API26_2): 출전 말 상세 정보
- **배당율** (API160): 확정 배당률
- **경주 계획** (API72_2): 예정된 경주 정보

### 데이터 규모

- 경주 기록: 50,000+ 경주
- 출전 기록: 500,000+ 출전
- 경주마: 3,000+ 두
- 기수: 200+ 명
- 조교사: 150+ 명

## 🎮 주요 기능

### 사용자 기능

- 🔐 Google OAuth 로그인
- 🏇 경주 정보 조회
- 🎯 예측 참여 (게임)
- ⭐ 즐겨찾기 관리
- 📈 개인 통계 및 랭킹
- 🎁 포인트 시스템

### AI 기능 (예정)

- 🤖 자동 경주 예측
- 📊 데이터 기반 분석
- 🎯 최적 예측 추천
- 📈 정확도 추적
- 🧠 학습 및 개선

## 🛠️ 기술 스택

### Frontend

- React Native
- Expo
- TypeScript
- TanStack Query
- Redux Toolkit

### Backend

- NestJS
- TypeORM
- MySQL
- Swagger

### AI/ML (계획)

- Python
- TensorFlow / PyTorch
- XGBoost / LightGBM
- scikit-learn
- FastAPI

## 📚 문서

- [AI 기능 설계](./docs/AI_FEATURES.md)
- [AI 예측 로드맵](./AI_PREDICTION_ROADMAP.md)
- [법적 고지사항](./LEGAL_NOTICE.md)
- [프로젝트 개요](./docs/PROJECT_OVERVIEW.md)
- [빠른 시작 가이드](./QUICK_START.md)

## 🤝 기여

AI 모델 개선 및 기능 제안을 환영합니다!

## 📄 라이선스

본 프로젝트는 교육 및 연구 목적으로 제공됩니다.

---

**⚖️ 법적 고지**: 본 서비스는 게임 내 가상 화폐를 사용하는 예측 게임이며, 실제 도박/베팅과 무관합니다. 포인트는 현금 가치가 없으며 어떠한 형태로도 현금화될 수 없습니다.

**마지막 업데이트**: 2025년 10월 9일
