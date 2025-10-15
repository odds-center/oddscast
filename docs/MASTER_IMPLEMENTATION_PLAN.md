# 🚀 Golden Race 전체 구현 계획서

**작성일**: 2025년 10월 15일  
**목표**: MVP → 베타 테스트 → 정식 런칭  
**예상 기간**: 6주 (단계별)

---

## 📊 현재 완성도

| 영역               | 완성도 | 상태                   |
| ------------------ | ------ | ---------------------- |
| **서버 백엔드**    | 80%    | ✅ 대부분 완료         |
| **모바일 앱**      | 60%    | 🔄 핵심 기능 추가 필요 |
| **Admin 패널**     | 95%    | ✅ 거의 완료           |
| **AI 예측 시스템** | 100%   | ✅ 완료                |
| **인증 시스템**    | 100%   | ✅ 완료                |
| **결제 시스템**    | 0%     | ❌ 구현 필요           |
| **알림 시스템**    | 30%    | 🔄 Push 알림 필요      |

---

## 🎯 Phase 1: 수익화 시스템 완성 (Week 1-2) ⭐ 최우선

### Week 1: 결제 시스템 (Toss Payments)

#### 서버 (3일)

- [ ] **Toss Payments SDK 설치 및 설정**
  - `npm install @tosspayments/payment-sdk`
  - 환경 변수 설정 (TOSS_SECRET_KEY)
- [ ] **PaymentsModule 구현**
  - `src/payments/payments.module.ts`
  - `src/payments/payments.service.ts`
  - `src/payments/toss.service.ts`
- [ ] **빌링키 발급 API**
  - `POST /api/payments/billing-key` - 카드 정보로 빌링키 발급
  - `POST /api/payments/charge` - 빌링키로 결제
  - `GET /api/payments/history` - 결제 내역
- [ ] **Subscription 자동 결제 Cron**
  - 매월 1일 00:00 자동 결제
  - 결제 실패 시 재시도 (3회)
  - 알림 발송

#### 모바일 (2일)

- [ ] **구독 플랜 화면 개선**
  - `app/(app)/mypage/subscription/plans.tsx`
  - Light/Premium 플랜 선택
  - 가격, 혜택 표시
- [ ] **결제 화면 구현**
  - `app/(app)/mypage/subscription/payment.tsx`
  - 토스페이먼츠 WebView 연동
  - 결제 성공/실패 처리
- [ ] **구독 관리 화면**
  - `app/(app)/mypage/subscription/manage.tsx`
  - 구독 상태, 다음 결제일
  - 구독 취소 기능

#### Admin (1일)

- [ ] **결제 관리 대시보드**
  - `admin/src/pages/payments.tsx`
  - 일일 매출, 월간 매출
  - 결제 실패 건 모니터링

---

### Week 2: 예측권 시스템 완성

#### 서버 (2일)

- [ ] **예측권 발급 로직 개선**
  - `src/prediction-tickets/prediction-tickets.service.ts`
  - 구독 시작 시 즉시 발급
  - 개별 구매 시 즉시 발급
- [ ] **예측권 만료 Cron**
  - 매일 자정 만료 처리
  - 사용자 알림
- [ ] **예측권 사용 로그**
  - `src/prediction-tickets/entities/ticket-usage-log.entity.ts`
  - 사용 이력 추적

#### 모바일 (2일)

- [ ] **예측권 잔액 표시**
  - 홈 화면 상단에 잔액 Badge
  - MyPage에 상세 내역
- [ ] **예측권 사용 확인 Modal**
  - 사용 전 확인 메시지
  - 남은 예측권 표시
- [ ] **예측권 구매 유도 UI**
  - 예측권 없을 때 구독/구매 유도
  - 할인 혜택 강조

#### Admin (1일)

- [ ] **예측권 통계 대시보드**
  - 발급/사용/만료 통계
  - 일일/월간 사용량

---

## 🎯 Phase 2: 베팅 기록 자동화 (Week 3) ⭐ UX 핵심

### 베팅 기록 자동 검증 (3일)

#### 서버

- [ ] **베팅 결과 자동 확인 Cron**
  - `src/bets/bets.service.ts`
  - 매 경주 종료 5분 후 자동 확인
  - 7가지 승식별 승패 판정
- [ ] **승패 판정 로직**
  - 단승식, 복승식, 연승식, 복연승식
  - 쌍승식, 삼복승식, 삼쌍승식
- [ ] **통계 자동 업데이트**
  - 사용자 승률, ROI 자동 계산
  - 베팅 타입별 통계

#### 모바일

- [ ] **베팅 기록 등록 개선**
  - `app/betting-register/index.tsx`
  - 승식 선택 개선 (7가지)
  - 마번 선택 UI 개선
  - 금액 입력 검증
- [ ] **자동 결과 알림**
  - 경주 종료 시 Push 알림
  - "3R 단승 당첨! +5,000원"
- [ ] **베팅 내역 화면 개선**
  - `app/(app)/records.tsx`
  - 승/패 필터
  - 승식별 필터
  - 통계 카드

---

## 🎯 Phase 3: 모바일 화면 완성 (Week 4) ⭐ 완성도

### 경주 상세 화면 (2일)

#### 모바일

- [ ] **경주 상세 화면 구현**
  - `app/race-detail/[raceId].tsx` 개선
  - 경주 정보 (시간, 거리, 등급)
  - 출전마 목록 (마번, 이름, 기수, 배당률)
  - AI 예측 미리보기 (블러)
  - "AI 예측 보기" 버튼
- [ ] **출전마 상세 정보**
  - 최근 성적
  - 기수/조교사 정보
  - 적성 정보

### 결과 화면 개선 (2일)

#### 모바일

- [ ] **경주 결과 상세**
  - `app/(app)/results.tsx` 개선
  - 1,2,3위 강조
  - 배당률 표시
  - 영상 하이라이트 (향후)
- [ ] **내 베팅 결과 연동**
  - 베팅 기록과 결과 매칭
  - 당첨/낙첨 표시
  - 수익 계산

### 홈 화면 개선 (1일)

#### 모바일

- [ ] **오늘의 추천 경주**
  - AI 신뢰도 높은 경주 추천
  - "지금 예측 가능" Badge
- [ ] **빠른 액션**
  - 최근 본 경주
  - 즐겨찾기 경주
  - 예측권 충전 버튼

---

## 🎯 Phase 4: 알림 시스템 (Week 5) ⭐ 리텐션

### Push 알림 (3일)

#### 서버

- [ ] **Firebase Cloud Messaging (FCM) 설정**
  - Firebase 프로젝트 생성
  - 서비스 계정 키 발급
  - `src/notifications/fcm.service.ts` 구현
- [ ] **알림 발송 서비스**
  - `src/notifications/notifications.service.ts`
  - 경주 시작 30분 전 알림
  - 베팅 결과 알림
  - 예측권 만료 알림
  - 구독 갱신 알림
- [ ] **알림 Cron**
  - 경주 시작 30분 전
  - 경주 종료 5분 후
  - 매월 1일 (구독 갱신)

#### 모바일

- [ ] **FCM 설정**
  - `npm install @react-native-firebase/app @react-native-firebase/messaging`
  - google-services.json 설정
- [ ] **Device Token 등록**
  - 로그인 시 토큰 서버 전송
  - `POST /api/users/device-token`
- [ ] **알림 수신 처리**
  - Foreground 알림 (Toast)
  - Background 알림 (시스템)
  - Deep Link 처리

---

## 🎯 Phase 5: 통계 & 분석 (Week 6) ⭐ 가치 제공

### 통계 대시보드 (3일)

#### 모바일

- [ ] **개인 통계 화면**
  - `app/(app)/mypage/stats.tsx`
  - 승률, ROI 차트
  - 승식별 성과
  - 경마장별 성과
  - AI 예측 정확도
- [ ] **랭킹 화면**
  - `app/ranking.tsx` 개선
  - 전체 랭킹
  - 친구 랭킹 (향후)

#### Admin

- [ ] **전체 통계 대시보드**
  - 일일 활성 사용자 (DAU)
  - 월간 활성 사용자 (MAU)
  - 구독 전환율
  - AI 예측 정확도 추이
  - 매출 분석

---

## 🎯 Phase 6: 마무리 & 테스트 (배포 전)

### 테스트 & QA (3일)

- [ ] **TypeScript 에러 제로**
  - 서버, 모바일, Admin 모두
- [ ] **통합 테스트**
  - 구독 → 예측권 발급 → 사용 → 결과
  - 베팅 기록 → 결과 확인 → 통계
- [ ] **결제 테스트**
  - 토스 테스트 결제
  - 정기 결제 시뮬레이션
- [ ] **성능 테스트**
  - 동시 접속 100명
  - API 응답 속도
  - 배치 예측 소요 시간

### 배포 준비 (2일)

- [ ] **환경 변수 최종 확인**
  - OpenAI API 키
  - Toss Payments 키
  - Firebase 설정
  - Redis 설정
- [ ] **마이그레이션 실행**
  - AI 예측 테이블
  - 구독 테이블
  - 예측권 테이블
- [ ] **문서 업데이트**
  - API 문서
  - 배포 가이드
  - 운영 매뉴얼

---

## 📁 구현 파일 맵

### 서버 (NestJS) - 신규 구현 필요

```
server/src/
├── payments/                    # ⭐ 신규 (Week 1)
│   ├── payments.module.ts
│   ├── payments.service.ts
│   ├── payments.controller.ts
│   ├── toss.service.ts         # Toss Payments 연동
│   └── entities/
│       └── billing-history.entity.ts
│
├── prediction-tickets/          # 🔄 개선 (Week 2)
│   ├── prediction-tickets.service.ts  # 발급/사용 로직 개선
│   └── entities/
│       └── ticket-usage-log.entity.ts  # 신규
│
├── bets/                        # 🔄 개선 (Week 3)
│   ├── bets.service.ts          # 자동 검증 로직 추가
│   └── utils/
│       └── bet-validator.ts     # 7가지 승식 판정
│
└── notifications/               # 🔄 개선 (Week 5)
    ├── fcm.service.ts           # Firebase Cloud Messaging
    ├── notifications.service.ts  # 알림 발송
    └── notification-cron.service.ts  # 알림 스케줄러
```

### 모바일 (React Native) - 신규 구현 필요

```
mobile/
├── app/(app)/
│   ├── mypage/
│   │   ├── subscription/
│   │   │   ├── plans.tsx        # 🔄 개선 (Week 1)
│   │   │   ├── payment.tsx      # ⭐ 신규 (Week 1)
│   │   │   └── manage.tsx       # ⭐ 신규 (Week 1)
│   │   └── stats.tsx            # ⭐ 신규 (Week 6)
│   │
│   └── race-detail/
│       └── [raceId].tsx         # 🔄 대폭 개선 (Week 4)
│
├── lib/
│   ├── api/
│   │   ├── payments.ts          # ⭐ 신규 (Week 1)
│   │   └── notifications.ts     # ⭐ 신규 (Week 5)
│   └── hooks/
│       ├── usePayments.ts       # ⭐ 신규 (Week 1)
│       └── useNotifications.ts  # ⭐ 신규 (Week 5)
│
└── services/
    └── fcm.service.ts           # ⭐ 신규 (Week 5)
```

### Admin (Next.js) - 추가 구현

```
admin/src/pages/
├── payments.tsx                 # ⭐ 신규 (Week 1)
├── subscriptions.tsx            # 🔄 개선
├── analytics.tsx                # 🔄 개선 (Week 6)
└── notifications.tsx            # ⭐ 신규 (Week 5)
```

---

## 📋 상세 체크리스트

### 🔴 최우선 (수익화)

#### 1. Toss Payments 연동 ⭐⭐⭐

- [ ] 서버: Toss SDK 설치 및 설정
- [ ] 서버: 빌링키 발급 API
- [ ] 서버: 정기 결제 API
- [ ] 서버: Webhook 처리 (결제 완료 알림)
- [ ] 모바일: 결제 화면 (WebView)
- [ ] 모바일: 결제 성공/실패 처리
- [ ] Admin: 결제 대시보드

#### 2. 구독 & 예측권 연동 ⭐⭐⭐

- [ ] 서버: 구독 시작 시 예측권 자동 발급
- [ ] 서버: 매월 1일 자동 결제 + 예측권 충전
- [ ] 모바일: 예측권 잔액 UI (홈 상단 Badge)
- [ ] 모바일: 예측권 사용 흐름 완성
- [ ] 모바일: 구독 관리 화면

---

### 🟡 중요 (UX 핵심)

#### 3. 베팅 기록 자동 검증 ⭐⭐

- [ ] 서버: 경주 종료 감지 Cron
- [ ] 서버: 7가지 승식 판정 로직
- [ ] 서버: 통계 자동 업데이트
- [ ] 모바일: 자동 결과 알림
- [ ] 모바일: 승/패 표시 개선

#### 4. Push 알림 시스템 ⭐⭐

- [ ] 서버: FCM 설정 및 알림 발송
- [ ] 서버: 알림 Cron (경주 시작 30분 전, 결과 확인)
- [ ] 모바일: FCM 설정 및 수신
- [ ] 모바일: 알림 설정 화면
- [ ] 모바일: Deep Link 처리

---

### 🟢 필요 (완성도)

#### 5. 경주 상세 화면 ⭐

- [ ] 모바일: 출전마 정보 상세
- [ ] 모바일: AI 예측 미리보기 (블러)
- [ ] 모바일: 배당률 정보
- [ ] 모바일: "베팅 기록하기" 버튼

#### 6. 통계 & 분석 ⭐

- [ ] 모바일: 개인 통계 화면
- [ ] 모바일: 차트 (승률, ROI)
- [ ] Admin: 전체 통계 대시보드
- [ ] Admin: AI 예측 성과 분석

---

## 🗓️ 주차별 계획

### Week 1: 결제 시스템 (Toss Payments)

**목표**: 구독 결제 가능  
**산출물**:

- ✅ 토스 결제 연동 완료
- ✅ 구독 시작 가능
- ✅ 예측권 자동 발급

### Week 2: 예측권 시스템

**목표**: 예측권 완전 작동  
**산출물**:

- ✅ 예측권 발급/사용/만료 완성
- ✅ 개별 구매 가능
- ✅ 잔액 UI 완성

### Week 3: 베팅 자동화

**목표**: 베팅 결과 자동 확인  
**산출물**:

- ✅ 7가지 승식 판정
- ✅ 자동 통계 업데이트
- ✅ 결과 알림

### Week 4: 모바일 완성

**목표**: 모든 화면 고도화  
**산출물**:

- ✅ 경주 상세 화면
- ✅ 베팅 기록 UI 개선
- ✅ 홈 화면 추천 기능

### Week 5: 알림 시스템

**목표**: Push 알림 완성  
**산출물**:

- ✅ FCM 설정
- ✅ 경주 알림
- ✅ 결과 알림
- ✅ 구독 알림

### Week 6: 통계 & 테스트

**목표**: 배포 준비 완료  
**산출물**:

- ✅ 통계 대시보드
- ✅ 통합 테스트
- ✅ 배포 준비

---

## 🎯 MVP 정의 (Week 1-3 완료 시)

### MVP에 포함되는 것

- ✅ 사용자 인증 (Google)
- ✅ 경주 정보 조회
- ✅ AI 예측 시스템 (완료)
- ✅ 구독 결제 (Toss) ← Week 1
- ✅ 예측권 시스템 ← Week 2
- ✅ 베팅 기록 및 자동 검증 ← Week 3
- ✅ 기본 알림

### MVP에 포함되지 않는 것 (향후)

- ❌ 소셜 기능 (친구, 팔로우)
- ❌ 랭킹 시스템
- ❌ 영상 하이라이트
- ❌ 커뮤니티 기능

---

## 💰 예상 비용 (MVP 런칭 후)

### 월간 운영 비용 (사용자 100명 기준)

| 항목                | 비용           | 설명                 |
| ------------------- | -------------- | -------------------- |
| **Railway (서버)**  | ₩27,080        | Hobby Plan           |
| **Redis (Railway)** | ₩13,540        | 캐싱                 |
| **MySQL (Railway)** | ₩13,540        | 데이터베이스         |
| **OpenAI API**      | ₩7,500         | AI 예측 (캐싱 99%)   |
| **Firebase (FCM)**  | ₩0             | 무료 (월 10M 메시지) |
| **Cloudflare**      | ₩0             | 무료 플랜            |
| **Toss PG 수수료**  | ₩6,930         | 매출의 3.5%          |
| **합계**            | **₩68,590/월** |                      |

### 월간 수익 (사용자 100명 기준)

| 항목          | 수익              | 설명              |
| ------------- | ----------------- | ----------------- |
| **구독 수익** | ₩1,980,000        | 100명 × ₩19,800   |
| **개별 구매** | ₩200,000          | 월 200장 × ₩1,000 |
| **합계**      | **₩2,180,000/월** |                   |

### 순이익

```
매출: ₩2,180,000
비용: ₩68,590
순이익: ₩2,111,410 (97% 마진)
```

---

## 🔑 배포 전 필수 설정

### 1. API 키 발급

- [ ] **OpenAI API Key** ([platform.openai.com](https://platform.openai.com))
- [ ] **Toss Payments** ([developers.tosspayments.com](https://developers.tosspayments.com))
- [ ] **Firebase Project** ([console.firebase.google.com](https://console.firebase.google.com))
- [ ] **Google OAuth 2.0** ([console.cloud.google.com](https://console.cloud.google.com))

### 2. 인프라 설정

- [ ] **Railway 프로젝트 생성**
  - MySQL 8.0 서비스
  - Redis 서비스
  - NestJS 서버 배포
- [ ] **Cloudflare 설정**
  - DNS 설정
  - SSL 인증서
  - CDN 활성화

### 3. 데이터베이스 마이그레이션

- [ ] **MySQL 마이그레이션 실행**
  ```bash
  # server/migrations/ 폴더의 SQL 파일들
  - create-ai-caching-tables.sql
  - create-ai-config-table.sql
  - add-device-token-to-users.sql
  ```

### 4. 모바일 앱 빌드

- [ ] **Android APK 빌드**
  ```bash
  cd mobile
  npx expo run:android --variant release
  ```
- [ ] **iOS IPA 빌드** (향후)
  ```bash
  eas build --platform ios --profile production
  ```

---

## 📊 성공 지표 (KPI)

### MVP 런칭 후 1개월

| 지표                 | 목표    | 측정 방법               |
| -------------------- | ------- | ----------------------- |
| **다운로드 수**      | 500+    | App Store Analytics     |
| **DAU**              | 100+    | Firebase Analytics      |
| **구독 전환율**      | 10%+    | (구독자 / 전체 사용자)  |
| **AI 예측 정확도**   | 65%+    | 1위 예측 적중률         |
| **평균 예측권 사용** | 15장/월 | Ticket Usage Analytics  |
| **구독 유지율**      | 80%+    | (유지 구독 / 전체 구독) |
| **월 매출**          | ₩200만+ | 결제 시스템 통계        |

---

## 🎯 우선순위 매트릭스

### Critical (빨간색) - 즉시 구현

1. **Toss Payments 연동** (Week 1) ← 수익화 필수
2. **예측권 시스템 완성** (Week 2) ← 비즈니스 모델 핵심
3. **베팅 자동 검증** (Week 3) ← UX 차별화

### High (주황색) - 빠른 시일 내

4. **경주 상세 화면** (Week 4) ← 정보 가치
5. **Push 알림** (Week 5) ← 리텐션

### Medium (노란색) - 순차적으로

6. **통계 대시보드** (Week 6) ← 가치 제공
7. **Admin 통계** (Week 6) ← 운영 편의

### Low (초록색) - 향후

8. 소셜 기능
9. 랭킹 시스템
10. 커뮤니티

---

## 📚 관련 문서

### 설계 문서

- `docs/features/game/AI_SUBSCRIPTION_MODEL.md` - 구독 모델
- `docs/features/game/PAYMENT_INTEGRATION.md` - 결제 시스템
- `docs/features/game/BETTING_SYSTEM.md` - 베팅 시스템
- `docs/features/mobile/IMPLEMENTATION_PLAN.md` - 모바일 계획

### 기술 문서

- `docs/features/ai/AI_CACHING_STRATEGY.md` - AI 캐싱 (완료)
- `docs/guides/deployment/RAILWAY_DETAILED_GUIDE.md` - 배포 가이드
- `docs/setup/QUICK_START.md` - 빠른 시작

### 일일 로그

- `docs/daily/2025-10-14-mobile-ui-improvement.md` - 모바일 UI 개선
- `docs/daily/2025-10-15-ai-prediction-system-complete.md` - AI 시스템 완성
- `docs/daily/2025-10-15-types-centralization-claude-removal.md` - 타입 정리

---

## 🎉 마일스톤

### 🏁 Milestone 1: MVP 완성 (Week 3)

- ✅ 사용자가 구독하고 예측권을 받을 수 있음
- ✅ AI 예측을 보고 베팅할 수 있음
- ✅ 베팅 결과가 자동으로 확인됨

### 🏁 Milestone 2: 베타 런칭 (Week 5)

- ✅ Push 알림 작동
- ✅ 모든 화면 고도화 완료
- ✅ 100명 베타 테스터 모집

### 🏁 Milestone 3: 정식 런칭 (Week 6)

- ✅ 통합 테스트 완료
- ✅ 성능 최적화 완료
- ✅ App Store 심사 통과

---

**이 계획을 따라 6주 안에 MVP를 완성하고 정식 런칭합니다!** 🚀
