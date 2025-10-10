# 📚 Golden Race 문서 허브

Golden Race 프로젝트의 모든 문서를 통합 관리하는 중앙 허브입니다.

---

## 📖 문서 구조

```
docs/
├── daily/              # 개발 일지 (NEW!)
├── setup/              # 설치 및 초기 설정
├── architecture/       # 시스템 아키텍처
├── features/           # 기능 설계
├── guides/             # 개발 가이드
├── api/                # API 문서
├── reference/          # 레퍼런스
└── archive/            # 아카이브
```

---

## 🚀 시작하기

### 빠른 시작 가이드

처음 프로젝트를 시작하는 분들을 위한 가이드:

| 문서                                             | 설명                         | 소요 시간 |
| ------------------------------------------------ | ---------------------------- | --------- |
| [구현 로드맵](../IMPLEMENTATION_ROADMAP.md) ⭐   | 8주 개발 계획 및 구현 가이드 | ⏱️ 10분   |
| [빠른 시작](setup/QUICK_START.md)                | 5분 안에 프로젝트 실행하기   | ⏱️ 5분    |
| [Docker 설정](setup/DOCKER_SETUP.md)             | Docker 환경 구축 상세 가이드 | ⏱️ 10분   |
| [Google Cloud 설정](setup/GOOGLE_CLOUD_SETUP.md) | OAuth 인증 설정              | ⏱️ 15분   |
| [환경변수 설정](setup/ENVIRONMENT.md)            | 환경변수 상세 설정           | ⏱️ 5분    |

### 환경별 가이드

- **로컬 개발**: [빠른 시작](setup/QUICK_START.md) → npm으로 실행
- **Docker 개발**: [Docker 설정](setup/DOCKER_SETUP.md) → 컨테이너로 실행
- **프로덕션 배포**: [배포 가이드](guides/deployment/) → 앱/서버 배포

---

## 🎯 역할별 가이드

### 백엔드 개발자

**시작 경로**: [서버 README](../server/README.md) → [서버 아키텍처](architecture/server/) →
[서버 가이드](guides/server/)

**주요 문서**:

- [데이터 저장소](architecture/server/DATA_STORAGE.md) - DB 구조
- [엔티티 상태](architecture/server/ENTITY_STATUS.md) - 엔티티 관리
- [데이터 수집](guides/server/DATA_COLLECTION_GUIDE.md) - KRA API 수집
- [KRA API 마이그레이션](guides/server/KRA_API_MIGRATION_GUIDE.md) - API 통합

### 프론트엔드 개발자

**시작 경로**: [모바일 README](../mobile/README.md) → [모바일 아키텍처](architecture/mobile/) →
[모바일 가이드](guides/mobile/)

**주요 문서**:

- [앱 아키텍처](architecture/mobile/ARCHITECTURE.md) - 앱 구조
- [네비게이션](architecture/mobile/NAVIGATION.md) - 화면 구조
- [상태 관리](architecture/mobile/STATE_MANAGEMENT.md) - Redux + React Query
- [UI 컴포넌트](guides/mobile/UI_COMPONENTS.md) - 컴포넌트
- [테마 시스템](guides/mobile/Theming.md) - 스타일링

### 풀스택 개발자

**시작 경로**: [프로젝트 개요](architecture/PROJECT_OVERVIEW.md) → [전체 아키텍처](architecture/) →
[API 문서](api/)

**주요 문서**:

- [프로젝트 개요](architecture/PROJECT_OVERVIEW.md) - 전체 비전
- [API 매핑](api/rest/SERVER_MOBILE_API_MAPPING.md) - 서버-모바일 연동
- [인증 시스템](guides/authentication/) - OAuth 구현
- [통합 테스트](guides/INTEGRATION_TEST_GUIDE.md) - 테스트

### DevOps / 인프라

**시작 경로**: [Docker 설정](setup/DOCKER_SETUP.md) → [환경변수](setup/ENVIRONMENT.md) →
[배포 가이드](guides/deployment/)

**주요 문서**:

- [Docker 설정](setup/DOCKER_SETUP.md) - 컨테이너 환경
- [환경변수](setup/ENVIRONMENT.md) - 설정 관리
- [Google Cloud](setup/GOOGLE_CLOUD_SETUP.md) - OAuth 설정
- [모바일 배포](guides/deployment/mobile.md) - 앱 스토어

---

## 📂 문서 카테고리

### 📅 개발 일지 ([daily/](daily/))

| 문서                                                  | 설명                                                 |
| ----------------------------------------------------- | ---------------------------------------------------- |
| [2025-10-11](daily/2025-10-11-development-summary.md) | DB 스키마 통일, 구독 시스템, 인증 가드, UI/UX 최적화 |

### 🔧 설정 가이드 ([setup/](setup/))

| 문서                                             | 설명                       |
| ------------------------------------------------ | -------------------------- |
| [빠른 시작](setup/QUICK_START.md)                | 프로젝트 5분 만에 실행하기 |
| [Docker 설정](setup/DOCKER_SETUP.md)             | Docker 환경 구축 및 관리   |
| [Google Cloud 설정](setup/GOOGLE_CLOUD_SETUP.md) | OAuth 2.0 인증 설정        |
| [환경변수 설정](setup/ENVIRONMENT.md)            | 환경변수 상세 가이드       |

### 🏗️ 아키텍처 ([architecture/](architecture/))

| 문서                                              | 설명                            |
| ------------------------------------------------- | ------------------------------- |
| [프로젝트 개요](architecture/PROJECT_OVERVIEW.md) | 프로젝트 전체 개요              |
| [모바일 아키텍처](architecture/mobile/)           | React Native 앱 구조 (3개 문서) |
| [서버 아키텍처](architecture/server/)             | NestJS 서버 구조 (2개 문서)     |

### 🎯 기능 문서 ([features/](features/))

| 문서                            | 설명                                 |
| ------------------------------- | ------------------------------------ |
| [AI 시스템](features/ai/)       | LLM 기반 예측 + 비용 모델 (3개 문서) |
| [게임 시스템](features/game/)   | 구독/결제/베팅 시스템 (5개 문서)     |
| [모바일 기능](features/mobile/) | 앱 기능 상세 (2개 문서)              |

### 📖 개발 가이드 ([guides/](guides/))

| 카테고리                       | 문서 수 | 설명                 |
| ------------------------------ | ------- | -------------------- |
| [인증](guides/authentication/) | 2개     | Google OAuth 구현    |
| [모바일](guides/mobile/)       | 3개     | UI, 테마, DB         |
| [서버](guides/server/)         | 2개     | 데이터 수집, KRA API |
| [배포](guides/deployment/)     | 1개     | 앱/서버 배포         |
| [테스트](guides/)              | 1개     | 통합 테스트          |

### 📡 API 문서 ([api/](api/))

| 카테고리              | 문서 수 | 설명                |
| --------------------- | ------- | ------------------- |
| [REST API](api/rest/) | 1개     | 서버-모바일 API     |
| [KRA API](api/kra/)   | 3개     | 한국마사회 공공 API |

### 📚 레퍼런스 ([reference/](reference/))

| 문서                                               | 설명                  |
| -------------------------------------------------- | --------------------- |
| [경마 용어](reference/HORSE_RACING_TERMINOLOGY.md) | 경마 용어 완전 가이드 |

### 📦 아카이브 ([archive/](archive/))

| 문서                                                | 설명                          |
| --------------------------------------------------- | ----------------------------- |
| [변경 이력](archive/CHANGELOG.md)                   | 과거 변경 사항                |
| [마이그레이션 보고서](archive/MIGRATION_REPORT.md)  | Express → NestJS 마이그레이션 |
| [API 통합 요약](archive/API_INTEGRATION_SUMMARY.md) | KRA API 통합 완료 보고서      |

---

## 🎓 학습 경로

### 초급 (프로젝트 이해)

1. ✅ [프로젝트 개요](architecture/PROJECT_OVERVIEW.md) - 프로젝트 소개
2. ✅ [빠른 시작](setup/QUICK_START.md) - 실행 방법
3. ✅ [법적 고지](../LEGAL_NOTICE.md) - 서비스 정책
4. ✅ [경마 용어](reference/HORSE_RACING_TERMINOLOGY.md) - 용어 학습

### 중급 (기능 개발)

#### 모바일 개발

1. ✅ [모바일 아키텍처](architecture/mobile/ARCHITECTURE.md) - 앱 구조
2. ✅ [네비게이션](architecture/mobile/NAVIGATION.md) - 화면 구조
3. ✅ [UI 컴포넌트](guides/mobile/UI_COMPONENTS.md) - 컴포넌트
4. ✅ [테마 시스템](guides/mobile/Theming.md) - 스타일링

#### 서버 개발

1. ✅ [서버 아키텍처](architecture/server/DATA_STORAGE.md) - DB 구조
2. ✅ [데이터 수집](guides/server/DATA_COLLECTION_GUIDE.md) - KRA API
3. ✅ [엔티티 관리](architecture/server/ENTITY_STATUS.md) - 엔티티

### 고급 (시스템 확장)

1. 🔄 [AI 로드맵](features/ai/AI_PREDICTION_ROADMAP.md) - AI 시스템
2. 🔄 [KRA API 마이그레이션](guides/server/KRA_API_MIGRATION_GUIDE.md) - API 고도화
3. 🔄 [배포 가이드](guides/deployment/) - 프로덕션 배포

---

## 🔗 외부 리소스

### 공식 문서

- [NestJS](https://docs.nestjs.com/) - 백엔드 프레임워크
- [React Native](https://reactnative.dev/) - 모바일 프레임워크
- [Expo](https://docs.expo.dev/) - 개발 도구
- [TypeORM](https://typeorm.io/) - ORM 라이브러리

### 한국마사회 API

- [공공데이터 포털](https://www.data.go.kr/) - KRA API 신청
- [경주기록 API](https://www.data.go.kr/data/15052651/openapi.do) - API4_3
- [출전표 API](https://www.data.go.kr/data/15052660/openapi.do) - API26_2
- [확정배당율 API](https://www.data.go.kr/data/15052679/openapi.do) - API160

---

## 📊 문서 통계

| 카테고리    | 문서 수 | 상태    |
| ----------- | ------- | ------- |
| 개발 일지   | 1개     | 🆕 신규 |
| 설정 가이드 | 4개     | ✅ 완료 |
| 아키텍처    | 6개     | ✅ 완료 |
| 기능 문서   | 10개    | ✅ 완료 |
| 개발 가이드 | 9개     | ✅ 완료 |
| API 문서    | 4개     | ✅ 완료 |
| 레퍼런스    | 1개     | ✅ 완료 |
| 아카이브    | 3개     | ✅ 완료 |

**총 문서 수**: 38개  
**마지막 업데이트**: 2025년 10월 11일

---

## 💬 도움이 필요하신가요?

### 자주 묻는 질문

1. **Q: 서버가 시작되지 않아요**

   - A: [빠른 시작 가이드](setup/QUICK_START.md)의 문제 해결 섹션 확인

2. **Q: Google 로그인이 안 돼요**

   - A: [Google Cloud 설정](setup/GOOGLE_CLOUD_SETUP.md) 가이드 참고

3. **Q: 문서를 어디서 찾나요?**
   - A: [SUMMARY.md](SUMMARY.md)에서 빠른 검색

### 문의하기

- **이메일**: vcjsm2283@gmail.com
- **GitHub Issues**: 이슈 등록
- **프로젝트 README**: [루트 README](../README.md)

---

<div align="center">

📚 **모든 문서가 하나로 통합되었습니다!**

정확하고 최신의 문서로 개발 효율성을 높입니다.

**Golden Race Team** 🏇

</div>
