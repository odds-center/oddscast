# GoldenRace Mobile App

경마 마권 구매 및 경주 정보 확인을 위한 React Native 모바일 애플리케이션입니다.

## 🚀 주요 기능

### 마권 구매

- **7가지 승식 지원**: 단승식, 복승식, 연승식, 복연승식, 쌍승식, 삼복승식, 삼쌍승식
- **실시간 배당률**: KRA API 연동으로 정확한 배당률 제공
- **마권 관리**: 구매, 취소, 결과 확인 등 종합적인 마권 관리

### 경주 정보

- **실시간 경주 정보**: 출전마, 기수, 조교사 정보
- **경주마 성적**: 단승률, 복승률, 연승률 등 상세한 성적 정보
- **경주 결과**: 실시간 결과 확인 및 당첨금 계산

### 사용자 관리

- **포인트 시스템**: 마권 구매 및 당첨금 지급
- **마권 통계**: 단승률, 수익률 등 개인 통계
- **즐겨찾기**: 관심 있는 경주마 및 경주 저장

## 🏗️ 기술 스택

- **Frontend**: React Native, Expo
- **State Management**: Redux Toolkit
- **API Client**: Axios, React Query
- **UI Components**: Custom Themed Components
- **Navigation**: Expo Router
- **Authentication**: Google OAuth

## 📱 화면 구성

### 주요 화면

- **홈**: 경주 일정 및 주요 정보
- **경주 목록**: 전체 경주 정보 및 검색
- **마권 구매**: 승식 선택 및 마권 구매
- **결과 확인**: 경주 결과 및 당첨금 확인
- **마이페이지**: 개인 정보 및 마권 통계

## 🎯 경마 용어

### 승식 (Bet Types)

- **단승식**: 1마리가 1등으로 들어올 마권
- **복승식**: 1마리가 1등, 2등, 3등 중 하나로 들어올 마권
- **연승식**: 2마리가 1등, 2등으로 들어올 마권 (순서 무관)
- **복연승식**: 2마리가 1등, 2등, 3등 중 두 자리를 하는 마권
- **쌍승식**: 2마리가 정확한 순서로 1등, 2등으로 들어올 마권
- **삼복승식**: 3마리가 1등, 2등, 3등으로 들어올 마권 (순서 무관)
- **삼쌍승식**: 3마리가 정확한 순서로 1등, 2등, 3등으로 들어올 마권

### 승률 (Win Rates)

- **단승률**: 1위 입상률
- **복승률**: 2위 이내 입상률
- **연승률**: 3위 이내 입상률

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn
- Expo CLI
- iOS Simulator 또는 Android Emulator

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start

# iOS 시뮬레이터에서 실행
npm run ios

# Android 에뮬레이터에서 실행
npm run android
```

### 환경 설정

```bash
# 환경 변수 파일 복사
cp .env.example .env

# 환경 변수 설정
# API_BASE_URL=your_api_url
# GOOGLE_CLIENT_ID=your_google_client_id
```

## 📚 문서

- [경마 용어 가이드](./docs/HORSE_RACING_TERMINOLOGY.md)
- [API 가이드](./docs/API_GUIDELINES.md)
- [개발자 가이드](./docs/DEVELOPER_GUIDE.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

_이 앱은 경마 마권 구매를 위한 교육 및 엔터테인먼트 목적으로 제작되었습니다._
