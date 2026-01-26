# 🏇 Golden Race

**AI 기반 경마 예측 정보 구독 서비스**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

> LLM AI를 활용한 경마 예측 정보 제공 플랫폼

---

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [비즈니스 모델](#-비즈니스-모델)
- [주요 기능](#-주요-기능)
- [빠른 시작](#-빠른-시작)
- [기술 스택](#-기술-스택)
- [문서](#-문서)
- [법적 고지](#-법적-고지)

---

## 🎯 프로젝트 소개

Golden Race는 **AI 기반 경마 예측 정보 구독 서비스**입니다.

### 비즈니스 모델

| 특징               | 설명                                        |
| ------------------ | ------------------------------------------- |
| 🤖 **AI 예측**     | LLM 기반 경주 결과 예측 정보 (GPT-4/Claude) |
| 💎 **구독 서비스** | 월 19,800원 - 30장 AI 예측권                |
| 🎫 **개별 구매**   | 1,000원/장 (예측권 소진 시)                 |
| 📝 **베팅 기록**   | 외부 구매 마권 기록 및 통계 관리            |
| ✅ **합법 서비스** | 정보 제공 서비스 (베팅 중개 아님)           |

### 핵심 가치

- 🤖 **LLM AI 예측**: GPT-4/Claude 기반 정확한 예측 정보
- 📊 **데이터 분석**: 50,000+ 경주 데이터 기반 프롬프트
- 💎 **구독 모델**: 월 19,800원 (30장) 또는 개별 1,000원/장
- 📝 **기록 관리**: 외부 마권 기록 및 통계

---

## 💎 비즈니스 모델

### AI 예측권 구독

| 플랜              | 가격        | 포함 내용   | 장당 단가 | 할인    |
| ----------------- | ----------- | ----------- | --------- | ------- |
| **프리미엄 구독** | 19,800원/월 | 24장 (20+4) | 825원     | **25%** |
| **라이트 구독**   | 9,900원/월  | 11장 (10+1) | 900원     | **18%** |
| 개별 구매 (1장)   | 1,100원     | 1장         | 1,100원   | -       |

> **💡 추천**: 월 11장 이상 사용 시 라이트 구독, 24장 이상 사용 시 프리미엄 구독이 유리합니다!

**자세한 내용**: [AI 구독 모델](docs/features/game/AI_SUBSCRIPTION_MODEL.md)

---

## ✨ 주요 기능

### AI 예측권 (유료)

- 💎 **프리미엄 구독** 월 19,800원 (30장) 또는 **개별 구매** 1,000원/장
- 🤖 **LLM AI 예측** GPT-4/Claude 기반 예측 정보
- 📊 **상세 분석** 예측 근거, 신뢰도, 과거 성적
- 🎯 **평균 70%+ 정확도** 목표

### 베팅 기록 관리 (무료)

- 📝 **외부 마권 기록** 한국마사회 구매 마권 추적
- 🔍 **자동 결과 확인** 경주 종료 시 자동 판정
- 📈 **개인 통계** 승률, ROI, 선호 승식 분석
- ⭐ **즐겨찾기** 관심 경주/경주마 관리

### 경주 정보 (무료)

- 🏇 **실시간 정보** 경주 일정, 출전표, 배당률
- 📊 **과거 데이터** 50,000+ 경주 기록
- 🔍 **검색 기능** 경주/경주마/기수/조교사 검색
- 📡 **자동 수집** 매일 한국마사회 API에서 동기화

### 시스템 기능

- 📡 **KRA API 통합** 한국마사회 공식 API 4개 연동
- 💾 **로컬 DB 캐싱** 빠른 응답 속도
- 🔄 **배치 작업** 매일 06:00 자동 데이터 수집
- 🤖 **LLM AI** 프롬프트 엔지니어링 기반 예측

---

## 🚀 빠른 시작

### 사전 요구사항

```bash
Node.js 18+
Supabase Account (무료)
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

# 환경변수 설정 (ENV_SETUP.md 참고)
# 시스템 환경변수로 설정
export SUPABASE_DB_HOST=db.your-project.supabase.co
export SUPABASE_DB_PASSWORD=your-password
# ... 나머지 환경변수

# 의존성 설치
npm install

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
Language: TypeScript 5.x
Database: Supabase PostgreSQL + TypeORM
Authentication: Passport.js + JWT (Google OAuth)
API: RESTful + Swagger
Payment: 토스페이먼츠 (정기 결제)
AI: OpenAI GPT-4 / Anthropic Claude
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
Database: Supabase PostgreSQL 15
Cache: Redis (예정)
Scheduler: NestJS Schedule (매일 06:00)
Payment: 토스페이먼츠
AI: OpenAI API / Anthropic API
```

---

## 📁 프로젝트 구조

```
goldenrace/
├── 📱 mobile/                 # React Native 모바일 앱
│   ├── app/                   # Expo Router 화면
│   ├── components/            # 재사용 컴포넌트
│   ├── lib/                   # API 클라이언트 & 훅
│   └── constants/             # 상수 & 테마
│
├── 🖥️ server/                 # NestJS 백엔드 서버
│   ├── src/
│   │   ├── auth/             # Google OAuth 인증
│   │   ├── users/            # 사용자 관리
│   │   ├── kra-api/          # 한국마사회 API 통합
│   │   ├── races/            # 경주 정보
│   │   ├── subscriptions/    # 구독 관리 (신규)
│   │   ├── prediction-tickets/ # 예측권 관리 (신규)
│   │   ├── ai/               # LLM AI 예측 (신규)
│   │   ├── bets/             # 베팅 기록
│   │   ├── batch/            # 배치 작업
│   │   └── points/           # 포인트 시스템 (폐지 예정)
│   └── mysql/                 # DB 스키마
│
├── 📊 admin/                  # Next.js 관리자 패널 ⭐ 완전 재구축
│   ├── src/pages/             # Pages Router
│   ├── src/lib/               # API 클라이언트 & 유틸
│   └── src/components/        # UI 컴포넌트
│
└── 📖 docs/                   # 통합 문서 (65개) ⭐ 확장
    ├── daily/                 # 개발 일지 (3개) ⭐ 신규
    ├── setup/                 # 설치 가이드 (4개)
    ├── architecture/          # 시스템 구조 (6개)
    ├── features/              # 기능 설계 (18개)
    ├── guides/                # 개발 가이드 (17개) ⭐ Admin 추가
    ├── api/                   # API 문서 (4개)
    ├── reference/             # 레퍼런스 (4개)
    └── archive/               # 아카이브 (9개)
```

---

## 🤖 AI 예측 시스템

### LLM 기반 예측

| 구분            | 내용                              |
| --------------- | --------------------------------- |
| **AI 모델**     | OpenAI GPT-4 / Anthropic Claude   |
| **예측 방식**   | 프롬프트 엔지니어링 + 과거 데이터 |
| **정확도 목표** | 평균 70%+                         |
| **응답 시간**   | 3-5초                             |
| **비용**        | 예측당 약 130원 (GPT-4 기준)      |

### 데이터 소스 (한국마사회 공식 API)

- **경주계획표** (API72_2): 예정 경주 일정
- **경주기록** (API4_3): 과거 경주 결과 (50,000+ 레코드)
- **출전표** (API26_2): 출전 말 상세 정보 (500,000+ 레코드)
- **확정배당율** (API160): 배당률 정보

**자세한 내용**: [AI 기능 설계](docs/features/ai/AI_FEATURES.md)

---

## 📚 문서

**📚 [통합 문서 허브](docs/README.md)** - 모든 문서를 한 곳에서!

### 🆕 최신 업데이트 (2025-10-14)

> **Admin Panel 완전 재구축 완료!** 🎉
>
> - ✅ React Hook Form + Zod 전면 적용
> - ✅ React Hot Toast 알림 시스템
> - ✅ AI Config DB 저장
> - ✅ 성능 90% 향상
>
> 📄 [상세 보기](docs/DOCUMENTATION_UPDATE_2025-10-14.md) | 📅 [개발 일지](docs/daily/2025-10-14-admin-panel-complete.md)

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
- [Admin 개발](docs/guides/admin/) - 관리자 패널 ⭐ 신규
- [인증](docs/guides/authentication/) - Google OAuth
- [배포](docs/guides/deployment/) - Railway, EC2, Cloudflare

#### 기능 및 API

- [AI 시스템](docs/features/ai/) - LLM 예측, 비용 모델
- [구독 시스템](docs/features/game/) - 구독, 결제, 예측권
- [API 문서](docs/api/) - REST & KRA API

#### 참고

- [구현 로드맵](IMPLEMENTATION_ROADMAP.md) - 8주 개발 계획 ⭐
- [경마 용어](docs/reference/HORSE_RACING_TERMINOLOGY.md) - 용어 사전
- [법적 고지](LEGAL_NOTICE.md) - 중요 법적 정보

---

## ⚠️ 법적 고지

### 서비스 성격

본 서비스는 **AI 예측 정보 제공 서비스**입니다:

| 제공하는 것 ✅             | 제공하지 않는 것 ❌ |
| -------------------------- | ------------------- |
| AI 예측 정보 (구독 서비스) | 앱 내 마권 구매     |
| 베팅 기록 관리 도구        | 베팅 중개           |
| 경주 정보 조회             | 현금 송금           |
| 자동 결과 확인             | 배당금 지급         |

### 구독 및 결제 정책

- 💎 **구독료**: 월 19,800원 (AI 예측 정보 서비스 요금)
- 🎫 **예측권**: 정보 열람권 (현금 가치 없음)
- 💳 **개별 구매**: 1,000원/장 (예측권 소진 시)
- ❌ **앱 내 베팅**: 불가능 (정보 제공만)
- ✅ **실제 베팅**: 한국마사회 공식 채널에서 사용자 직접

**자세한 내용**: [법적 고지사항](LEGAL_NOTICE.md)

---

## 🤝 기여

기여를 환영합니다!

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

**⚖️ Golden Race는 AI 예측 정보를 제공하는 구독 서비스입니다.**  
**실제 마권 구매는 한국마사회 공식 채널에서 사용자가 직접 진행합니다.**

**마지막 업데이트**: 2026년 1월 26일 - Supabase PostgreSQL 마이그레이션 완료

---

**총 문서**: 65개 | **총 코드**: 50,000+ 줄 | **기술 스택**: NestJS + React Native + Next.js

</div>
