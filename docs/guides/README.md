# 📖 개발 가이드

Golden Race 프로젝트의 개발 가이드 및 튜토리얼 문서입니다.

---

## 📚 문서 목록

### 인증 가이드

| 문서                                                        | 설명                    |
| ----------------------------------------------------------- | ----------------------- |
| [Authentication.md](authentication/Authentication.md)       | Google OAuth 2.0 구현   |
| [GOOGLE_AUTH_USAGE.md](authentication/GOOGLE_AUTH_USAGE.md) | Google 인증 사용 가이드 |

### 모바일 개발 가이드

| 문서                                        | 설명                            |
| ------------------------------------------- | ------------------------------- |
| [UI_COMPONENTS.md](mobile/UI_COMPONENTS.md) | 재사용 가능한 UI 컴포넌트       |
| [Theming.md](mobile/Theming.md)             | 테마 시스템 및 다크 모드        |
| [Database.md](mobile/Database.md)           | 로컬 데이터 저장 (AsyncStorage) |

### 서버 개발 가이드

| 문서                                                            | 설명                        |
| --------------------------------------------------------------- | --------------------------- |
| [DATA_COLLECTION_GUIDE.md](server/DATA_COLLECTION_GUIDE.md)     | KRA API 데이터 수집 방법    |
| [KRA_API_MIGRATION_GUIDE.md](server/KRA_API_MIGRATION_GUIDE.md) | KRA API 마이그레이션 가이드 |

### 배포 가이드

| 문서                              | 설명                                   |
| --------------------------------- | -------------------------------------- |
| [mobile.md](deployment/mobile.md) | 모바일 앱 배포 (App Store, Play Store) |
| server.md (예정)                  | 서버 배포 (Docker, GCP)                |

### 통합 테스트

| 문서                                                   | 설명               |
| ------------------------------------------------------ | ------------------ |
| [INTEGRATION_TEST_GUIDE.md](INTEGRATION_TEST_GUIDE.md) | 통합 테스트 가이드 |

---

## 🎯 가이드별 개요

### 1. 인증 시스템

**Google OAuth 2.0 구현 방법**

- 🔐 Google Cloud Console 설정
- 📱 모바일 앱 통합
- 🖥️ 서버 Passport 전략
- 🎫 JWT 토큰 관리

**문서**: [authentication/](authentication/)

---

### 2. 모바일 개발

**React Native + Expo 앱 개발**

- 🎨 UI 컴포넌트 사용법
- 🌓 테마 시스템 구현
- 💾 로컬 데이터 저장
- 🧪 테스트 가이드

**문서**: [mobile/](mobile/)

---

### 3. 서버 개발

**NestJS 백엔드 개발**

- 📡 KRA API 데이터 수집
- 🗄️ 데이터베이스 관리
- ⏰ 배치 작업 스케줄링
- 🔄 API 마이그레이션

**문서**: [server/](server/)

---

### 4. 배포

**앱 스토어 및 서버 배포**

- 📱 iOS App Store 배포
- 🤖 Google Play Store 배포
- 🐳 Docker 컨테이너 배포
- ☁️ GCP 클라우드 배포

**문서**: [deployment/](deployment/)

---

## 🎓 학습 경로

### 초급 (시작하기)

1. ✅ [빠른 시작](../setup/QUICK_START.md) - 프로젝트 실행
2. ✅ [환경 설정](../setup/ENVIRONMENT.md) - 환경변수 설정
3. ✅ [Google OAuth](authentication/GOOGLE_AUTH_USAGE.md) - 인증 구현

### 중급 (기능 개발)

1. ✅ [UI 컴포넌트](mobile/UI_COMPONENTS.md) - 컴포넌트 개발
2. ✅ [데이터 수집](server/DATA_COLLECTION_GUIDE.md) - 백엔드 데이터
3. ✅ [통합 테스트](INTEGRATION_TEST_GUIDE.md) - 테스트 작성

### 고급 (시스템 확장)

1. 🔄 [KRA API 마이그레이션](server/KRA_API_MIGRATION_GUIDE.md) - API 고도화
2. 🔄 [배포](deployment/) - 프로덕션 배포
3. 🔄 성능 최적화 (향후 추가)

---

## 🔗 관련 문서

- [아키텍처](../architecture/) - 시스템 설계
- [기능](../features/) - 기능 설계
- [API](../api/) - API 문서

---

**마지막 업데이트**: 2025년 10월 10일
