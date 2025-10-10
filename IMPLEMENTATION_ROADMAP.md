# 🚀 Golden Race 구현 로드맵

**마지막 업데이트**: 2025년 10월 11일

## 📋 목차

1. [개요](#개요)
2. [현재 상태](#현재-상태)
3. [구현 우선순위](#구현-우선순위)
4. [Phase 1: AI 예측 시스템 (2주)](#phase-1-ai-예측-시스템-2주)
5. [Phase 2: 구독 시스템 (2주)](#phase-2-구독-시스템-2주)
6. [Phase 3: 결제 통합 (1주)](#phase-3-결제-통합-1주)
7. [Phase 4: 모바일 UI (2주)](#phase-4-모바일-ui-2주)
8. [Phase 5: 테스트 및 배포 (1주)](#phase-5-테스트-및-배포-1주)

---

## 개요

Golden Race의 핵심 기능들을 8주 안에 구현하여 MVP(Minimum Viable Product)를 완성합니다.

### 목표

- ✅ **LLM 기반 AI 예측 시스템**
- ✅ **구독 기반 수익 모델**
- ✅ **합법적인 정보 제공 서비스**
- ✅ **사용자 친화적인 모바일 앱**

---

## 현재 상태

### ✅ 완료된 기능 (55%)

| 영역            | 기능                 | 상태 | 파일 위치                                  | 완료일     |
| --------------- | -------------------- | ---- | ------------------------------------------ | ---------- |
| **인증**        | Google OAuth 2.0     | ✅   | `server/src/auth/`                         | 2025-10-10 |
| **사용자**      | 사용자 관리          | ✅   | `server/src/users/`                        | 2025-10-10 |
| **경주 정보**   | KRA API 통합         | ✅   | `server/src/kra-api/`                      | 2025-10-10 |
| **경주 데이터** | 경주 계획/결과       | ✅   | `server/src/races/`, `server/src/results/` | 2025-10-10 |
| **베팅 기록**   | 베팅 CRUD            | ✅   | `server/src/bets/`                         | 2025-10-10 |
| **배치 작업**   | 데이터 수집 스케줄러 | ✅   | `server/src/batch/`                        | 2025-10-10 |
| **구독**        | 구독 플랜 시스템     | ✅   | `server/src/subscriptions/`                | 2025-10-11 |
| **인증 가드**   | 자동 로그인/로그아웃 | ✅   | `mobile/components/common/AuthGuard.tsx`   | 2025-10-11 |
| **UI/UX**       | 통일된 레이아웃      | ✅   | `mobile/components/common/PageLayout.tsx`  | 2025-10-11 |

### 🔄 구현 필요 (45%)

| 영역        | 기능               | 우선순위  | 예상 시간 | 상태       |
| ----------- | ------------------ | --------- | --------- | ---------- |
| **AI 예측** | LLM 통합 (GPT-4o)  | 🔥 **P0** | 2주       | 📅 계획 중 |
| **예측권**  | 예측권 관리 시스템 | 🔥 **P0** | 1주       | 📅 계획 중 |
| **결제**    | Toss Payments 통합 | 🔥 **P0** | 1주       | 🔄 진행 중 |
| **모바일**  | AI 예측 UI         | 🔥 **P0** | 1주       | 📅 계획 중 |
| **통계**    | 예측 정확도 추적   | **P1**    | 3일       | 📅 계획 중 |

---

## 구현 우선순위

### 🔥 P0 - 핵심 기능 (MVP 필수)

1. **AI 예측 시스템** - 서비스의 핵심 가치
2. **예측권 시스템** - 비즈니스 모델의 기초
3. **구독 시스템** - 수익 모델
4. **결제 통합** - 구독료 수금
5. **모바일 UI** - 사용자 접점

### ⚠️ P1 - 중요 기능 (출시 후 1개월)

1. 예측 정확도 추적
2. 사용자 통계
3. 알림 시스템

### 📌 P2 - 개선 기능 (출시 후 3개월)

1. 소셜 기능
2. 랭킹 시스템
3. 추천 시스템

---

## Phase 1: AI 예측 시스템 (2주)

### 목표

LLM API를 활용한 경마 예측 정보 생성 시스템 구축

### 백엔드 구현

#### 1.1 LLM 서비스 모듈 (3일)

**파일**: `server/src/llm/`

```typescript
// llm.module.ts
@Module({
  providers: [LlmService, OpenAIService, ClaudeService],
  exports: [LlmService],
})
export class LlmModule {}
```

**작업 목록**:

- [ ] LLM 서비스 인터페이스 정의
- [ ] OpenAI GPT-4o 통합
- [ ] Claude 3.5 Sonnet 통합 (백업)
- [ ] 프롬프트 템플릿 관리
- [ ] 토큰 사용량 추적
- [ ] 에러 핸들링 및 재시도

**주요 파일**:

```
server/src/llm/
├── llm.module.ts
├── llm.service.ts
├── providers/
│   ├── openai.service.ts
│   ├── claude.service.ts
│   └── llm.interface.ts
├── dto/
│   ├── prediction-request.dto.ts
│   └── prediction-response.dto.ts
└── templates/
    └── prediction-prompt.template.ts
```

#### 1.2 예측 서비스 (4일)

**파일**: `server/src/predictions/`

```typescript
// predictions.service.ts
@Injectable()
export class PredictionsService {
  async generatePrediction(raceId: string): Promise<Prediction> {
    // 1. 경주 데이터 수집
    const raceData = await this.collectRaceData(raceId);

    // 2. 프롬프트 생성
    const prompt = this.buildPrompt(raceData);

    // 3. LLM 호출
    const llmResponse = await this.llmService.predict(prompt);

    // 4. 응답 파싱 및 저장
    return this.savePrediction(raceId, llmResponse);
  }
}
```

**작업 목록**:

- [ ] 예측 엔티티 생성
- [ ] 예측 생성 로직
- [ ] 프롬프트 엔지니어링
- [ ] 응답 파싱 및 검증
- [ ] 캐싱 전략
- [ ] API 엔드포인트

**주요 파일**:

```
server/src/predictions/
├── predictions.module.ts
├── predictions.service.ts
├── predictions.controller.ts
├── entities/
│   ├── prediction.entity.ts
│   ├── prediction-horse.entity.ts
│   └── prediction-accuracy.entity.ts
├── dto/
│   ├── create-prediction.dto.ts
│   └── prediction-result.dto.ts
└── utils/
    ├── prompt-builder.ts
    └── response-parser.ts
```

#### 1.3 예측권 시스템 (3일)

**파일**: `server/src/prediction-tickets/`

```typescript
// prediction-tickets.service.ts
@Injectable()
export class PredictionTicketsService {
  async useTicket(userId: string, raceId: string): Promise<Prediction> {
    // 1. 예측권 확인
    const ticket = await this.getAvailableTicket(userId);

    if (!ticket) {
      throw new BadRequestException('예측권이 없습니다');
    }

    // 2. 예측 생성 또는 조회
    let prediction = await this.predictionsService.findByRaceAndUser(raceId, userId);

    if (!prediction) {
      prediction = await this.predictionsService.generatePrediction(raceId);
    }

    // 3. 예측권 사용 처리
    await this.markTicketAsUsed(ticket.id, raceId);

    return prediction;
  }
}
```

**작업 목록**:

- [ ] 예측권 엔티티 생성
- [ ] 예측권 발급 로직
- [ ] 예측권 사용 로직
- [ ] 예측권 만료 처리
- [ ] 예측권 통계

**주요 파일**:

```
server/src/prediction-tickets/
├── prediction-tickets.module.ts
├── prediction-tickets.service.ts
├── prediction-tickets.controller.ts
├── entities/
│   ├── prediction-ticket.entity.ts
│   └── ticket-usage.entity.ts
└── dto/
    ├── use-ticket.dto.ts
    └── ticket-info.dto.ts
```

### 데이터베이스 스키마

```sql
-- 예측 테이블
CREATE TABLE predictions (
  id VARCHAR(36) PRIMARY KEY,
  race_id VARCHAR(36) NOT NULL,

  -- 예측 결과
  first_place INT NOT NULL,
  second_place INT NOT NULL,
  third_place INT NOT NULL,

  -- 분석 내용
  analysis TEXT,
  confidence DECIMAL(5,2),

  -- LLM 정보
  llm_model VARCHAR(50),
  llm_cost DECIMAL(10,2),
  tokens_used INT,

  -- 정확도
  is_accurate BOOLEAN,
  accuracy_score DECIMAL(5,2),

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (race_id) REFERENCES races(id),
  INDEX idx_race_id (race_id)
);

-- 예측권 테이블
CREATE TABLE prediction_tickets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  subscription_id VARCHAR(36),

  -- 상태
  status ENUM('AVAILABLE', 'USED', 'EXPIRED') DEFAULT 'AVAILABLE',

  -- 사용 정보
  used_at DATETIME,
  race_id VARCHAR(36),
  prediction_id VARCHAR(36),

  -- 유효 기간
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  INDEX idx_user_status (user_id, status),
  INDEX idx_expiry (expires_at)
);
```

---

## Phase 2: 구독 시스템 (2주) ✅ 완료

### 목표

월 구독 기반 예측권 발급 시스템 구축

### ✅ 완료 사항 (2025-10-11)

- ✅ 2개 구독 플랜 (Light, Premium) 구현
- ✅ 데이터베이스 스키마 완성 (스네이크케이스)
- ✅ TypeORM Entity 매핑 완료
- ✅ 구독 플랜 UI 구현
- ✅ 구독 관리 대시보드 구현
- ✅ MySQL UTF-8 인코딩 완벽 설정

### 백엔드 구현

#### 2.1 구독 모듈 (4일)

**파일**: `server/src/subscriptions/`

```typescript
// subscriptions.service.ts
@Injectable()
export class SubscriptionsService {
  async createSubscription(userId: string): Promise<Subscription> {
    // 1. 구독 생성
    const subscription = await this.subscriptionRepo.save({
      userId,
      status: 'PENDING',
      planId: 'PREMIUM',
      price: 19800,
      billingDate: new Date(),
    });

    // 2. 예측권 30장 발급
    await this.issueTickets(subscription.id, userId, 30);

    return subscription;
  }

  async renewSubscription(subscriptionId: string): Promise<void> {
    // 정기 결제 로직
    const subscription = await this.findOne(subscriptionId);

    // 1. 결제 처리
    await this.paymentService.processBilling(subscription);

    // 2. 예측권 재발급
    await this.issueTickets(subscriptionId, subscription.userId, 30);

    // 3. 구독 갱신
    await this.updateBillingDate(subscriptionId);
  }
}
```

**작업 목록**:

- [ ] 구독 엔티티 생성
- [ ] 구독 생성/취소 로직
- [ ] 구독 갱신 로직
- [ ] 예측권 자동 발급
- [ ] 구독 상태 관리
- [ ] API 엔드포인트

**주요 파일**:

```
server/src/subscriptions/
├── subscriptions.module.ts
├── subscriptions.service.ts
├── subscriptions.controller.ts
├── entities/
│   ├── subscription.entity.ts
│   └── subscription-history.entity.ts
├── dto/
│   ├── create-subscription.dto.ts
│   ├── cancel-subscription.dto.ts
│   └── subscription-status.dto.ts
└── services/
    ├── billing.service.ts
    └── ticket-issuer.service.ts
```

#### 2.2 개별 구매 모듈 (3일)

**파일**: `server/src/single-purchases/`

```typescript
// single-purchases.service.ts
@Injectable()
export class SinglePurchasesService {
  async purchaseSingleTicket(userId: string): Promise<PurchaseResult> {
    // 1. 결제 처리
    const payment = await this.paymentService.processPayment({
      userId,
      amount: 1000,
      orderName: 'AI 예측권 1장',
    });

    // 2. 예측권 발급
    const ticket = await this.ticketsService.issueTicket({
      userId,
      subscriptionId: null,
      expiryDate: addDays(new Date(), 30),
    });

    // 3. 구매 내역 저장
    await this.savePurchaseHistory(userId, payment, ticket);

    return { payment, ticket };
  }
}
```

**작업 목록**:

- [ ] 개별 구매 엔티티
- [ ] 구매 처리 로직
- [ ] 예측권 즉시 발급
- [ ] 구매 내역 관리
- [ ] API 엔드포인트

**주요 파일**:

```
server/src/single-purchases/
├── single-purchases.module.ts
├── single-purchases.service.ts
├── single-purchases.controller.ts
├── entities/
│   └── single-purchase.entity.ts
└── dto/
    ├── purchase-ticket.dto.ts
    └── purchase-result.dto.ts
```

### 데이터베이스 스키마

```sql
-- 구독 테이블
CREATE TABLE subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,

  -- 구독 정보
  plan_id VARCHAR(20) DEFAULT 'PREMIUM',
  price DECIMAL(10,2) DEFAULT 19800.00,

  -- 상태
  status ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING') DEFAULT 'PENDING',

  -- 결제 정보
  billing_key VARCHAR(100),
  next_billing_date DATE,
  last_billed_at DATETIME,

  -- 타임스탬프
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_status (user_id, status),
  INDEX idx_billing (next_billing_date, status)
);

-- 개별 구매 테이블
CREATE TABLE single_purchases (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  ticket_id VARCHAR(36) NOT NULL,

  -- 결제 정보
  amount DECIMAL(10,2) DEFAULT 1000.00,
  pg_transaction_id VARCHAR(100),
  payment_method VARCHAR(20),

  -- 상태
  status ENUM('SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',

  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (ticket_id) REFERENCES prediction_tickets(id),
  INDEX idx_user (user_id),
  INDEX idx_purchased (purchased_at)
);
```

---

## Phase 3: 결제 통합 (1주)

### 목표

Toss Payments API 통합하여 구독 및 개별 구매 결제 처리

### 백엔드 구현

#### 3.1 결제 모듈 (5일)

**파일**: `server/src/payments/`

```typescript
// toss-payment.service.ts
@Injectable()
export class TossPaymentService {
  // 결제 승인
  async confirmPayment(dto: ConfirmPaymentDto): Promise<Payment> {
    const response = await axios.post(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        paymentKey: dto.paymentKey,
        orderId: dto.orderId,
        amount: dto.amount,
      },
      {
        headers: {
          Authorization: `Basic ${this.getAuthToken()}`,
        },
      }
    );

    return this.savePayment(response.data);
  }

  // 정기 결제 (빌링키)
  async issueBillingKey(dto: IssueBillingKeyDto): Promise<BillingKey> {
    const response = await axios.post(
      'https://api.tosspayments.com/v1/billing/authorizations/issue',
      {
        customerKey: dto.customerKey,
        authKey: dto.authKey,
      },
      {
        headers: {
          Authorization: `Basic ${this.getAuthToken()}`,
        },
      }
    );

    return response.data;
  }

  // 빌링키로 결제
  async payWithBillingKey(billingKey: string, amount: number, orderName: string): Promise<Payment> {
    const response = await axios.post(
      `https://api.tosspayments.com/v1/billing/${billingKey}`,
      {
        amount,
        orderName,
        customerKey: this.getCustomerKey(),
      },
      {
        headers: {
          Authorization: `Basic ${this.getAuthToken()}`,
        },
      }
    );

    return this.savePayment(response.data);
  }
}
```

**작업 목록**:

- [ ] Toss Payments SDK 설치
- [ ] 결제 승인 API
- [ ] 빌링키 발급 (정기 결제)
- [ ] 빌링키 결제 실행
- [ ] 결제 취소/환불
- [ ] 웹훅 처리
- [ ] 결제 내역 저장

**주요 파일**:

```
server/src/payments/
├── payments.module.ts
├── payments.controller.ts
├── services/
│   ├── toss-payment.service.ts
│   ├── payment-webhook.service.ts
│   └── payment-history.service.ts
├── entities/
│   ├── payment.entity.ts
│   └── billing-key.entity.ts
└── dto/
    ├── confirm-payment.dto.ts
    ├── issue-billing-key.dto.ts
    └── payment-webhook.dto.ts
```

### 환경 변수 설정

```bash
# .env
TOSS_SECRET_KEY=your_secret_key
TOSS_CLIENT_KEY=your_client_key
TOSS_WEBHOOK_SECRET=your_webhook_secret
```

---

## Phase 4: 모바일 UI (2주)

### 목표

사용자 친화적인 AI 예측 및 구독 UI 구현

### 4.1 AI 예측 화면 (4일)

**파일**: `mobile/app/(app)/prediction/`

**작업 목록**:

- [ ] 예측권 잔액 표시
- [ ] 경주 선택 화면
- [ ] 예측 요청 버튼
- [ ] 예측 결과 표시
- [ ] 로딩 상태 관리
- [ ] 에러 처리

**주요 컴포넌트**:

```
mobile/
├── app/(app)/prediction/
│   ├── index.tsx              # 예측 메인
│   ├── [raceId].tsx           # 예측 상세
│   └── result.tsx             # 예측 결과
├── components/prediction/
│   ├── PredictionCard.tsx     # 예측 카드
│   ├── TicketBalance.tsx      # 예측권 잔액
│   └── PredictionResult.tsx   # 결과 표시
└── lib/api/
    └── predictions.ts         # 예측 API
```

### 4.2 구독 화면 (4일)

**파일**: `mobile/app/(app)/subscription/`

**작업 목록**:

- [ ] 구독 플랜 표시
- [ ] 가격 비교 UI
- [ ] 구독 신청 플로우
- [ ] 결제 위젯 통합
- [ ] 구독 관리 화면
- [ ] 구독 취소 플로우

**주요 컴포넌트**:

```
mobile/
├── app/(app)/subscription/
│   ├── index.tsx              # 구독 메인
│   ├── plans.tsx              # 플랜 선택
│   ├── payment.tsx            # 결제
│   └── manage.tsx             # 구독 관리
├── components/subscription/
│   ├── PlanCard.tsx           # 플랜 카드
│   ├── PriceComparison.tsx    # 가격 비교
│   └── PaymentWidget.tsx      # Toss 결제 위젯
└── lib/api/
    └── subscriptions.ts       # 구독 API
```

### 4.3 개별 구매 화면 (2일)

**파일**: `mobile/app/(app)/purchase/`

**작업 목록**:

- [ ] 개별 구매 UI
- [ ] 수량 선택
- [ ] 즉시 결제
- [ ] 구매 완료 화면

---

## Phase 5: 테스트 및 배포 (1주)

### 5.1 테스트 (3일)

**작업 목록**:

- [ ] 단위 테스트 (서비스)
- [ ] 통합 테스트 (API)
- [ ] E2E 테스트 (모바일)
- [ ] 결제 테스트 (샌드박스)
- [ ] 부하 테스트

### 5.2 배포 (2일)

**작업 목록**:

- [ ] 서버 배포 (GCP Cloud Run)
- [ ] 데이터베이스 마이그레이션
- [ ] 환경 변수 설정
- [ ] 모바일 앱 빌드
- [ ] 베타 테스트 (TestFlight/내부 테스트)

### 5.3 모니터링 (2일)

**작업 목록**:

- [ ] CloudWatch 설정
- [ ] Sentry 에러 추적
- [ ] 로그 집계
- [ ] 알림 설정

---

## 일정 요약

| Phase       | 기간    | 주요 작업                     |
| ----------- | ------- | ----------------------------- |
| **Phase 1** | 2주     | AI 예측 시스템 (LLM, 예측권)  |
| **Phase 2** | 2주     | 구독 시스템 (구독, 개별 구매) |
| **Phase 3** | 1주     | Toss Payments 통합            |
| **Phase 4** | 2주     | 모바일 UI (예측, 구독)        |
| **Phase 5** | 1주     | 테스트 및 배포                |
| **총 기간** | **8주** | **MVP 완성**                  |

---

## 성공 지표

### 기술적 지표

- [ ] AI 예측 응답 시간 < 5초
- [ ] 예측 정확도 > 65%
- [ ] 시스템 가용성 > 99%
- [ ] API 응답 시간 < 500ms

### 비즈니스 지표

- [ ] 첫 주 구독자 > 20명 (손익분기점)
- [ ] 첫 달 구독자 > 50명
- [ ] 구독 전환율 > 10%
- [ ] 구독 유지율 > 80%

---

## 다음 단계

1. **Phase 1 시작**: LLM 서비스 모듈 구현
2. **개발 환경 설정**: OpenAI API 키 발급
3. **Git 브랜치 전략**: `feature/llm-integration`
4. **일일 스탠드업**: 진행 상황 공유

---

**마지막 업데이트**: 2025년 10월 10일  
**문서 버전**: 1.0.0  
**작성자**: Golden Race Team 🏇
