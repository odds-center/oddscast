# 앱 스토어 출시 체크리스트 — OddsCast

> **현재 상태 (2026-04-06 기준):**
> - Android: React Native CLI 빌드 완료, Play Console 계정 미등록
> - iOS: React Native CLI 구성 완료, Xcode 빌드 미시작, Apple Developer 계정 미등록
>
> **참고 문서:** `docs/APP_STORE_PUBLISH.md` (비용 안내)

---

## Phase 0 — 사전 준비 (공통)

### 법적 준비

- [ ] 개인정보처리방침 URL 확정 및 접근 가능 여부 확인
  - URL: `https://oddscast-webapp.vercel.app/legal/privacy`
- [ ] 이용약관 URL 확정
  - URL: `https://oddscast-webapp.vercel.app/legal/terms`
- [ ] 환불 정책 페이지 확인
  - URL: `https://oddscast-webapp.vercel.app/legal/refund`
- [ ] 사업자등록번호 확보 (스토어 등록 시 필요)
- [ ] 결제 대행사(TossPayments) 계약 현황 확인

### 브랜드 에셋 준비

- [ ] 앱 아이콘 PNG 제작
  - Android: 512×512 px (고해상도)
  - iOS: 1024×1024 px (투명 배경 없음, 둥근 모서리 불필요 — OS가 자동 처리)
- [ ] Feature Graphic 제작 (Google Play용, 1024×500 px)
- [ ] 스크린샷 준비
  - Android: 1080×1920 px 최소 2장 (권장 8장)
  - iOS iPhone 6.9인치: 1320×2868 px 최소 3장 (권장 8장)
  - iOS iPhone 6.5인치: 1284×2778 px
- [ ] 스크린샷 캡션 오버레이 텍스트 확정 (`GOOGLE_PLAY_LISTING.md` 참고)
- [ ] 앱 미리보기 영상 제작 (선택, 최대 30초, MP4)

### 기술 사전 점검

- [ ] 릴리즈 빌드에서 API URL이 프로덕션 서버를 가리키는지 확인
  - `mobile/src/config.ts` → `PROD_URL` 값 점검
- [ ] TossPayments 웹결제 프로덕션 키 적용 여부 확인
- [ ] Sentry DSN 프로덕션 환경 적용 확인
- [ ] 앱 최초 실행 → 로그인 → 경주 조회 → AI 예측 사용 전체 플로우 테스트
- [ ] 푸시 알림 테스트 (실제 기기에서 수신 확인)
- [ ] 딥링크 테스트 (알림 탭 → 해당 경주 페이지 이동)

---

## Phase 1 — Android (Google Play)

### 1-1. Google Play Console 계정 설정

- [ ] [Google Play Console](https://play.google.com/console) 접속
- [ ] Google 계정으로 등록 (개발자 계정 생성)
- [ ] 등록비 $25(약 35,000원) 결제 (신용카드, 일회성)
- [ ] 개발자 프로필 작성
  - 개발자 이름 (서비스명 또는 회사명)
  - 이메일 주소
  - 전화번호
  - 웹사이트 URL

### 1-2. 앱 빌드 — Android AAB

```bash
cd /Users/risingcore/Desktop/work/oddscast/mobile
cd android

# 릴리즈 키스토어 생성 (최초 1회)
keytool -genkey -v -keystore oddscast-release.keystore \
  -alias oddscast -keyalg RSA -keysize 2048 -validity 10000

# 릴리즈 AAB 빌드
./gradlew bundleRelease

# 결과물 위치:
# android/app/build/outputs/bundle/release/app-release.aab
```

- [ ] 키스토어 파일 안전한 곳에 백업 (분실 시 업데이트 불가)
- [ ] `android/gradle.properties`에 키스토어 설정 추가
- [ ] AAB 빌드 성공 확인
- [ ] 빌드된 AAB를 실제 기기에서 테스트 (Firebase App Distribution 또는 직접 설치)

### 1-3. 스토어 등록 정보 작성

Play Console → 앱 만들기 → 기본 스토어 등록 정보

- [ ] 앱 이름: `OddsCast - AI 경마 분석`
- [ ] 짧은 설명 (최대 80자) 입력 → `GOOGLE_PLAY_LISTING.md` 참고
- [ ] 전체 설명 (최대 4,000자) 입력 → `GOOGLE_PLAY_LISTING.md` 참고
- [ ] 앱 아이콘 업로드 (512×512 PNG)
- [ ] Feature Graphic 업로드 (1024×500 PNG)
- [ ] 스크린샷 업로드 (최소 2장)
- [ ] 앱 카테고리: 스포츠 선택
- [ ] 연락처 이메일: `support@oddscast.com`
- [ ] 개인정보처리방침 URL 입력

### 1-4. 앱 콘텐츠 설문 (정책 준수)

- [ ] IARC 연령 등급 설문 완료
  - "도박 및 배팅" → **없음** 선택 (앱 내 베팅 기능 없음)
  - "폭력", "성적 콘텐츠" → 없음 선택
  - 예상 등급: 성인(18+) 또는 12+
- [ ] 개인정보 보호 설문 완료
  - 수집 데이터: 이메일, 기기 식별자 응답
- [ ] 광고 포함 여부: 없음
- [ ] 인앱결제 여부: 있음 (웹결제 방식 설명 준비)

### 1-5. 출시

- [ ] 내부 테스트 트랙에 AAB 업로드 후 내부 테스터 검토
- [ ] 프로덕션 트랙으로 이동
- [ ] 출시 검토 제출
- [ ] 검토 승인 대기 (보통 1~3일)
- [ ] 출시 확인 — Play Store에서 앱 검색·설치 가능 여부 확인

---

## Phase 2 — iOS (Apple App Store)

### 2-1. Apple Developer 계정 설정

- [ ] [Apple Developer Program](https://developer.apple.com/programs) 가입
- [ ] $99/년 결제 (매년 갱신 필요)
- [ ] 개발자 계정 활성화 (최대 48시간 소요)
- [ ] [App Store Connect](https://appstoreconnect.apple.com) 접속 확인

### 2-2. iOS 빌드 환경 준비 (Mac 필수)

- [ ] Mac + Xcode 최신 버전 설치 확인
- [ ] Apple Developer 계정을 Xcode에 연결
- [ ] Provisioning Profile 생성
  - App ID 등록: `com.oddscast.app` (또는 원하는 번들 ID)
  - Distribution Certificate 생성
  - App Store 배포용 Provisioning Profile 다운로드
- [ ] `mobile/ios/` 프로젝트 Xcode에서 열기
- [ ] Bundle Identifier, Team, Signing 설정 확인

### 2-3. iOS 릴리즈 빌드

```bash
cd /Users/risingcore/Desktop/work/oddscast/mobile

# CocoaPods 의존성 설치
cd ios && pod install && cd ..

# Xcode에서 Archive 빌드
# Product → Archive → Distribute App → App Store Connect
```

- [ ] Archive 빌드 성공
- [ ] App Store Connect에 빌드 업로드 완료
- [ ] TestFlight 베타 테스트 (선택, 최소 1~2명)

### 2-4. App Store Connect 등록 정보

App Store Connect → 나의 앱 → 새 앱 만들기

- [ ] 앱 이름: `OddsCast - AI 경마 분석` (최대 30자)
- [ ] 부제목: `경주 예측 정보 구독 서비스` (최대 30자)
- [ ] 번들 ID 선택 (위에서 등록한 App ID)
- [ ] 기본 언어: 한국어
- [ ] SKU: `com.oddscast.app`

### 2-5. 앱 정보 입력

- [ ] 홍보 텍스트 (최대 170자) → `APP_STORE_LISTING.md` 참고
- [ ] 앱 설명 (최대 4,000자) → `APP_STORE_LISTING.md` 참고
- [ ] 키워드 (최대 100자) → `APP_STORE_LISTING.md` 참고
- [ ] 지원 URL: `https://oddscast-webapp.vercel.app/legal/terms`
- [ ] 개인정보처리방침 URL 입력
- [ ] 스크린샷 업로드 (iPhone 6.9인치 필수)
- [ ] 카테고리: 스포츠 (주), 라이프스타일 (부)

### 2-6. 연령 등급 설정

- [ ] 연령 등급 설문 완료
  - "도박 및 경연 대회" → 없음 (앱 내 베팅 없음)
  - "성적 콘텐츠·폭력" → 없음
  - 예상 등급: 17+
- [ ] 연령 등급 확인

### 2-7. 심사 제출

- [ ] 심사 노트(Review Notes) 작성 → `APP_STORE_LISTING.md` 심사 노트 섹션 참고
  - 서비스 성격 설명 (정보 서비스, 베팅 없음)
  - 테스트 계정 제공 (테스트용 이메일·비밀번호)
- [ ] 심사 제출
- [ ] 심사 대기 (첫 심사: 1~7일 소요, 이후 1~3일)

### 2-8. 심사 리젝 대응 (예상 시나리오)

| 리젝 사유 | 대응 방법 |
|-----------|-----------|
| 도박 정책 위반 (4.3) | 심사 노트에 정보 서비스 성격 재강조. 앱 내 베팅 기능 없음 증명. |
| 인앱결제 미사용 (3.1) | 구독 CTA를 외부 웹(Safari)으로 유도하는 방식으로 변경. 앱 내 직접 결제 UI 제거 검토. |
| 단순 WebView 앱 (4.2) | 네이티브 푸시 알림, 네이티브 인증 브릿지 기능 강조. WebView만으로 구성된 앱이 아님을 설명. |
| 개인정보처리방침 미흡 | 방침 URL 접근 가능 여부 재확인. 수집 항목 상세 기재. |

---

## Phase 3 — 법적 검토 및 사행성 심사 통과 전략

### 핵심 포지셔닝: "정보 서비스"

앱 스토어 심사에서 경마 관련 앱이 거절되는 가장 큰 이유는
"도박/사행성 게임"으로 분류되는 것입니다.
OddsCast는 다음 전략으로 정보 서비스임을 명확히 합니다.

**포지셔닝 문구 (심사 노트·설명에 반복 사용):**
```
OddsCast is an AI-powered information and analysis service for horse racing enthusiasts.

Similar to stock market analysis newsletters or sports statistics platforms,
this app provides data-driven AI analysis reports — NOT betting or gambling services.

Key distinguishing factors:
1. No in-app betting, wagering, or gambling features
2. No real money or virtual currency for gambling purposes
3. No payout or reward tied to race outcomes
4. Payment is for an "information subscription" (like a newsletter subscription)
5. All horse racing bets must be placed at Korea Racing Authority (KRA) official channels
```

### 법적 고지 체크리스트

- [ ] 앱 설명에 "정보 제공 서비스" 문구 명시
- [ ] 앱 설명에 "앱 내 베팅 불가" 문구 명시
- [ ] 앱 첫 실행 시 면책 고지 표시 확인 (Welcome 페이지 또는 온보딩)
- [ ] 예측 화면마다 "AI 예측은 참고용입니다" 문구 노출 확인
- [ ] 개인정보처리방침 최신화 (수집 항목·보관 기간 명시)
- [ ] 만 18세 미만 이용 제한 고지 포함

### 국내 법령 준수 확인

- [ ] 정보통신망 이용촉진 및 정보보호 등에 관한 법률 준수
- [ ] 사행행위 등 규제 및 처벌 특례법 — 사행 행위 없음 확인
- [ ] 전자상거래 등에서의 소비자보호에 관한 법률 — 환불 정책 고지
- [ ] 개인정보보호법 — 개인정보처리방침 등록

---

## Phase 4 — 출시 후 운영

### 리뷰 수집 전략

- [ ] 앱 내 리뷰 요청 다이얼로그 구현
  - 트리거 시점: 경주 AI 분석 열람 후 3회 이상 사용 시
  - React Native: `react-native-in-app-review` 라이브러리 사용 권장
- [ ] 초기 리뷰 목표: 출시 2주 내 10개 이상 4점+ 리뷰 확보
- [ ] 부정 리뷰 발생 시 24시간 내 공식 답변 작성

### 업데이트 주기 권장

| 업데이트 유형 | 권장 주기 | 내용 |
|--------------|-----------|------|
| 핫픽스 (버그) | 발견 즉시 | 크래시, 결제 오류 등 |
| 마이너 업데이트 | 격주 | UI 개선, 기능 추가 |
| 메이저 업데이트 | 분기별 | 신규 기능, 리디자인 |

- [ ] 앱 버전 명세 규칙 확정 (예: `1.0.0` → 메이저.마이너.패치)
- [ ] 업데이트 출시 노트 템플릿 준비 (한국어)

```
버전 [X.X.X] 업데이트 내용

• [신규] [기능 이름] — [한 줄 설명]
• [개선] [항목] — [한 줄 설명]
• [수정] [버그 설명] — 수정 완료

언제나 더 좋은 OddsCast를 만들기 위해 노력하겠습니다.
이용해 주셔서 감사합니다.
```

### 출시 후 모니터링

- [ ] Sentry 앱 크래시 모니터링 확인 (mobile Sentry DSN 설정)
- [ ] 스토어 리뷰 주 1회 이상 확인
- [ ] Play Console / App Store Connect Analytics 주간 확인
  - 설치 수, DAU, 리텐션, 구독 전환율

### ASO (앱 스토어 최적화) 주기적 점검

- [ ] 키워드 순위 월 1회 점검 (MobileAction, AppFollow 등 도구 활용)
- [ ] 경쟁 앱 동향 분기별 확인
- [ ] 스크린샷·설명 업데이트 (메이저 기능 추가 시)

---

## 체크리스트 요약 (Quick Reference)

### Android 최소 준비물
1. Google Play Console 계정 ($25)
2. 서명된 AAB 빌드 파일
3. 앱 아이콘 (512×512)
4. 스크린샷 최소 2장
5. 개인정보처리방침 URL
6. 짧은 설명 + 전체 설명 텍스트

### iOS 최소 준비물
1. Mac + Xcode + Apple Developer 계정 ($99/년)
2. 서명된 IPA 빌드 (Xcode Archive)
3. 앱 아이콘 (1024×1024, 투명 배경 없음)
4. iPhone 6.9인치 스크린샷 최소 3장
5. 개인정보처리방침 URL
6. 심사 노트 (영문)

---

_Last updated: 2026-04-06_
