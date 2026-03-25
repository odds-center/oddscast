# 앱 스토어 출시 가이드

## 비용 요약

| 플랫폼 | 프로그램 | 비용 | 주기 |
|--------|----------|------|------|
| Google Play | Google Play Console | $25 (~35,000원) | 평생 1회 |
| Apple App Store | Apple Developer Program | $99/년 (~135,000원) | 매년 갱신 |

> 첫 해 합산: 약 **17만원** / 이후 매년: 약 **13.5만원** (Apple만)

---

## Google Play (Android)

### 등록 절차
1. [Google Play Console](https://play.google.com/console) 계정 생성
2. $25 일회성 등록비 결제 (신용카드)
3. 개발자 프로필 작성 (이름, 이메일, 전화번호)
4. 앱 등록 → APK/AAB 업로드 → 스토어 등록 정보 작성
5. 검토 후 출시 (보통 1~3일 소요)

### 준비물
- APK 또는 AAB 빌드 파일
- 앱 아이콘 (512×512 PNG)
- 스크린샷 (최소 2장, 권장 8장)
- 앱 소개 텍스트 (짧은 설명 80자, 상세 설명 4000자)
- 개인정보처리방침 URL (필수)

### OddsCast 빌드
```bash
cd mobile
npx react-native build-android --mode=release
# 또는
cd android && ./gradlew bundleRelease
# 결과물: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Apple App Store (iOS)

### 등록 절차
1. [Apple Developer](https://developer.apple.com) 계정 생성 (Apple ID 필요)
2. Apple Developer Program 가입 → $99/년 결제
3. Xcode에서 앱 빌드 및 서명 (Provisioning Profile, Certificate)
4. App Store Connect에서 앱 등록
5. TestFlight 베타 테스트 (선택)
6. 심사 제출 → 출시 (보통 1~7일 소요, 초기 심사는 더 걸릴 수 있음)

### 준비물
- Mac + Xcode (iOS 빌드는 Mac 필수)
- 앱 아이콘 (1024×1024 PNG)
- 스크린샷 (iPhone 6.5인치, 5.5인치 필수)
- 앱 소개 텍스트
- 개인정보처리방침 URL (필수)
- 연령 등급 설정

### 주의사항
- **매년 갱신 필수** — 미납 시 앱 자동 내려감
- Apple 심사 기준이 Google보다 엄격함
- 인앱결제가 있으면 Apple 30% 수수료 적용 (구독은 첫 해 30%, 이후 15%)
- OddsCast는 TossPayments 웹결제 사용 → Apple 인앱결제 아님 (WebView 기반)

---

## 참고 링크

- Google Play Console: https://play.google.com/console
- Apple Developer Program: https://developer.apple.com/programs
- App Store Connect: https://appstoreconnect.apple.com
