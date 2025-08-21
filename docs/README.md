# Golden Race - 프로젝트 문서

## 📚 문서 개요

Golden Race 프로젝트의 모든 문서를 체계적으로 정리한 중앙 허브입니다. 각 영역별 문서를 쉽게 찾고 참
조할 수 있습니다.

## 🏗️ 프로젝트 구조

```
goldenrace/
├── 📱 mobile/                 # React Native + Expo 앱
├── 🖥️ server/                 # NestJS 백엔드
├── 📖 docs/                   # 전체 프로젝트 문서 (현재 위치)
└── 🔧 scripts/                # 공통 스크립트
```

## 📖 문서 분류

### 🏠 **전체 프로젝트 문서** (현재 위치)

- [📋 프로젝트 개요](./PROJECT_OVERVIEW.md) - 전체 프로젝트 소개 및 비전
- [🏗️ 아키텍처 개요](./ARCHITECTURE_OVERVIEW.md) - 전체 시스템 아키텍처
- [🚀 개발 로드맵](./DEVELOPMENT_ROADMAP.md) - 단계별 개발 계획
- [📱 배포 가이드](./DEPLOYMENT_OVERVIEW.md) - 배포 및 운영 가이드

### 📱 **모바일 앱 문서** (`mobile/docs/`)

- [📱 앱 개요](../mobile/docs/HorseRacingApp.md) - 모바일 앱 기능 및 구조
- [🎯 구현 계획](../mobile/docs/IMPLEMENTATION_PLAN.md) - 모바일 앱 개발 계획
- [🎨 UI 컴포넌트](../mobile/docs/UI_COMPONENTS.md) - UI 컴포넌트 가이드
- [🧭 네비게이션](../mobile/docs/NAVIGATION.md) - 네비게이션 구조
- [🎨 테마 시스템](../mobile/docs/Theming.md) - 테마 및 스타일링
- [🔐 인증 시스템](../mobile/docs/Authentication.md) - 인증 및 보안

### 🖥️ **서버 백엔드 문서** (`server/docs/`)

- [🏗️ 서버 아키텍처](../server/docs/ARCHITECTURE.md) - NestJS 서버 구조
- [🔌 KRA API 연동](../server/docs/KRA_API_INTEGRATION.md) - 한국마사회 API 연동
- [⚠️ 에러 처리 시스템](../server/docs/ERROR_HANDLING_SYSTEM.md) - 에러 처리 및 로깅
- [📁 폴더 구조](../server/docs/FOLDER_ARCHITECTURE.md) - 서버 폴더 아키텍처
- [📋 API 가이드라인](../server/docs/API_GUIDELINES.md) - API 개발 표준
- [💻 코딩 표준](../server/docs/CODING_STANDARDS.md) - 개발 코딩 표준
- [⚙️ 환경 설정](../server/docs/ENVIRONMENT_SETUP.md) - 개발 환경 설정

## 🚀 빠른 시작

### 개발자 가이드

1. [프로젝트 개요](./PROJECT_OVERVIEW.md) 읽기
2. [개발 환경 설정](../server/docs/ENVIRONMENT_SETUP.md) 따라하기
3. [구현 계획](../mobile/docs/IMPLEMENTATION_PLAN.md) 확인하기
4. [코딩 표준](../server/docs/CODING_STANDARDS.md) 숙지하기

### 특정 영역 개발

- **모바일 앱**: [모바일 문서](../mobile/docs/) 참조
- **백엔드 API**: [서버 문서](../server/docs/) 참조
- **KRA API 연동**: [KRA API 가이드](../server/docs/KRA_API_INTEGRATION.md) 참조

## 📋 문서 작성 가이드

### 문서 구조

- **제목**: 명확하고 간결한 제목
- **개요**: 문서의 목적과 범위
- **상세 내용**: 단계별 상세 설명
- **예시 코드**: 실제 사용 가능한 코드 예시
- **관련 문서**: 연관된 다른 문서 링크

### 마크다운 규칙

- **제목**: `#` ~ `######` 사용
- **코드**: ` ` 블록 사용
- **링크**: `[텍스트](경로)` 형식
- **이모지**: 섹션별 적절한 이모지 사용

## 🔄 문서 업데이트

### 업데이트 주기

- **주요 기능**: 기능 완성 시 즉시 업데이트
- **버그 수정**: 수정 완료 시 업데이트
- **정기 검토**: 월 1회 전체 문서 검토

### 업데이트 절차

1. 코드 변경사항 확인
2. 관련 문서 식별
3. 문서 내용 업데이트
4. 변경사항 검토 및 승인
5. 문서 버전 관리

## 🧪 문서 품질 관리

### 품질 기준

- **정확성**: 코드와 문서 내용 일치
- **완성성**: 필요한 모든 정보 포함
- **가독성**: 명확하고 이해하기 쉬운 설명
- **최신성**: 최신 코드 상태 반영

### 검토 프로세스

1. **자동 검사**: 마크다운 문법 검사
2. **동료 검토**: 다른 개발자 검토
3. **사용자 테스트**: 실제 사용자 피드백
4. **정기 감사**: 월 1회 품질 감사

## 📞 지원 및 문의

### 문서 관련 문의

- **GitHub Issues**: 문서 버그 및 개선 제안
- **Pull Request**: 문서 수정 및 추가
- **이메일**: docs@goldenrace.com

### 개발 관련 문의

- **기술 지원**: tech@goldenrace.com
- **기능 제안**: feature@goldenrace.com
- **버그 리포트**: bug@goldenrace.com

## 📈 문서 통계

### 현재 상태

- **총 문서 수**: 15개
- **총 페이지 수**: 약 200페이지
- **코드 예시**: 50+ 개
- **다이어그램**: 10+ 개

### 향후 계획

- **Q1 2024**: 문서 완성도 80% 달성
- **Q2 2024**: 사용자 가이드 추가
- **Q3 2024**: 비디오 튜토리얼 제작
- **Q4 2024**: 다국어 지원

---

> 📚 **문서는 프로젝트의 생명입니다.** 정확하고 최신의 문서를 유지하여 개발 효율성을 높이겠습니다.

**마지막 업데이트**: 2024년 3월 15일 **문서 버전**: v1.0.0
