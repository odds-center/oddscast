# 🎯 AI 예측권 구독 서비스

**비즈니스 모델**: AI 예측 정보 제공 서비스 (합법적 정보 서비스)

---

## 📋 서비스 개요

### 핵심 컨셉

Golden Race는 **AI 예측 정보를 제공하는 구독 서비스**입니다.

- ✅ **AI 예측권 판매**: 월 정기 구독
- ✅ **정보 제공 서비스**: 예측 정보 제공 (합법)
- ✅ **베팅은 외부에서**: 한국마사회 등에서 사용자가 직접
- ❌ **앱 내 베팅 없음**: 예측 정보만 제공

---

## 💳 구독 및 구매 모델

### 월간 구독 (권장)

| 항목            | 내용                      |
| --------------- | ------------------------- |
| **구독명**      | AI 예측권 프리미엄        |
| **가격**        | 19,800원/월               |
| **포함 내용**   | 월 30장의 AI 예측권       |
| **장당 단가**   | 660원/장                  |
| **결제 방식**   | 정기 결제 (자동 갱신)     |
| **예측 방식**   | LLM AI (GPT-4, Claude 등) |
| **예측 정확도** | 평균 70%+ (목표)          |

### 개별 구매 (예측권 소진 시)

| 항목          | 내용                      |
| ------------- | ------------------------- |
| **상품명**    | AI 예측권 (낱개)          |
| **가격**      | 1,000원/장                |
| **사용 기한** | 구매일로부터 30일         |
| **결제 방식** | 즉시 결제 (카드/간편결제) |

> **💡 팁**: 구독하면 장당 660원으로 **34% 할인**!

### 예측권 사용

```typescript
interface AIPredictionTicket {
  id: string;
  userId: string;
  subscriptionId: string;
  raceId: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  prediction: {
    winner: string; // AI 예측 1위
    top3: string[]; // AI 예측 상위 3위
    confidence: number; // 신뢰도 (0-100%)
    reasoning: string; // 예측 근거
  };
  result?: {
    actual: string[]; // 실제 결과
    isCorrect: boolean; // 정확도
    accuracy: number; // 정확도 점수
  };
}
```

### 예측권 시스템

```typescript
class PredictionTicketService {
  /**
   * 구독 시작 시 30장 발급
   */
  async issueMonthlyTickets(userId: string, subscriptionId: string) {
    const tickets = [];
    const today = new Date();
    const expiryDate = new Date(today.setMonth(today.getMonth() + 1));

    for (let i = 0; i < 30; i++) {
      tickets.push({
        id: generateId(),
        userId,
        subscriptionId,
        raceId: null, // 나중에 사용 시 지정
        issueDate: new Date(),
        expiryDate,
        status: 'AVAILABLE',
        prediction: null, // 사용 시 AI 예측 생성
      });
    }

    await this.ticketRepository.save(tickets);
    return tickets;
  }

  /**
   * 예측권 사용 (특정 경주에 사용)
   */
  async usePredictionTicket(ticketId: string, raceId: string) {
    const ticket = await this.ticketRepository.findOne(ticketId);

    if (ticket.status !== 'AVAILABLE') {
      throw new Error('이미 사용되었거나 만료된 예측권입니다.');
    }

    // AI 예측 생성
    const aiPrediction = await this.aiService.predictRace(raceId);

    ticket.raceId = raceId;
    ticket.status = 'USED';
    ticket.prediction = aiPrediction;

    await this.ticketRepository.save(ticket);
    return ticket;
  }

  /**
   * 경주 결과 확인 및 정확도 기록
   */
  async checkPredictionResult(ticketId: string, actualResult: string[]) {
    const ticket = await this.ticketRepository.findOne(ticketId);

    const isCorrect = ticket.prediction.winner === actualResult[0];
    const accuracy = this.calculateAccuracy(ticket.prediction.top3, actualResult);

    ticket.result = {
      actual: actualResult,
      isCorrect,
      accuracy,
    };

    await this.ticketRepository.save(ticket);

    // 사용자 통계 업데이트
    await this.updateUserStats(ticket.userId, accuracy);

    return ticket;
  }
}
```

---

## 💰 구독 결제 시스템

### 정기 결제 흐름

```
1. 사용자: "프리미엄 구독" 선택
    ↓
2. 결제 정보 입력 (카드)
    ↓
3. 정기 결제 등록
    ↓
4. 즉시 30장 예측권 발급
    ↓
5. 매월 자동 결제 + 30장 재발급
```

### 구독 엔티티

```typescript
interface Subscription {
  id: string;
  userId: string;
  plan: 'PREMIUM'; // 현재는 하나만
  price: number; // 19,800원
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startDate: Date;
  nextBillingDate: Date;
  billingCycle: 'MONTHLY';
  paymentMethod: {
    type: 'CARD';
    cardLast4: string; // 카드 뒷 4자리
    billingKey: string; // PG사 빌링키
  };
  ticketsPerMonth: number; // 30장
  ticketsUsed: number; // 이번 달 사용한 개수
  ticketsRemaining: number; // 남은 개수
  autoRenew: boolean; // 자동 갱신
}
```

### 결제 구현

```typescript
class SubscriptionService {
  /**
   * 구독 시작
   */
  async startSubscription(userId: string, paymentInfo: PaymentInfo) {
    // 1. 결제 게이트웨이로 빌링키 발급
    const billingKey = await this.paymentGateway.issueBillingKey(paymentInfo);

    // 2. 첫 결제
    const payment = await this.paymentGateway.charge({
      billingKey,
      amount: 19800,
      orderName: 'AI 예측권 프리미엄 구독',
    });

    if (!payment.success) {
      throw new Error('결제 실패');
    }

    // 3. 구독 생성
    const subscription = await this.subscriptionRepository.create({
      userId,
      plan: 'PREMIUM',
      price: 19800,
      status: 'ACTIVE',
      startDate: new Date(),
      nextBillingDate: this.getNextMonthDate(),
      billingCycle: 'MONTHLY',
      paymentMethod: {
        type: 'CARD',
        cardLast4: paymentInfo.cardNumber.slice(-4),
        billingKey,
      },
      ticketsPerMonth: 30,
      ticketsUsed: 0,
      ticketsRemaining: 30,
      autoRenew: true,
    });

    // 4. 예측권 30장 발급
    await this.ticketService.issueMonthlyTickets(userId, subscription.id);

    return subscription;
  }

  /**
   * 매월 자동 결제 (Cron Job)
   */
  @Cron('0 0 1 * *') // 매월 1일 00:00
  async processMonthlyBilling() {
    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { status: 'ACTIVE', autoRenew: true },
    });

    for (const sub of activeSubscriptions) {
      try {
        // 정기 결제
        const payment = await this.paymentGateway.charge({
          billingKey: sub.paymentMethod.billingKey,
          amount: sub.price,
          orderName: `AI 예측권 구독 (${this.getCurrentMonth()})`,
        });

        if (payment.success) {
          // 새로운 예측권 30장 발급
          await this.ticketService.issueMonthlyTickets(sub.userId, sub.id);

          // 구독 정보 업데이트
          sub.nextBillingDate = this.getNextMonthDate();
          sub.ticketsUsed = 0;
          sub.ticketsRemaining = 30;
          await this.subscriptionRepository.save(sub);
        } else {
          // 결제 실패 처리
          await this.handleBillingFailure(sub);
        }
      } catch (error) {
        this.logger.error(`구독 결제 실패: ${sub.id}`, error);
      }
    }
  }

  /**
   * 구독 취소
   */
  async cancelSubscription(userId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne(subscriptionId);

    subscription.status = 'CANCELLED';
    subscription.autoRenew = false;

    await this.subscriptionRepository.save(subscription);

    // 남은 예측권은 만료일까지 사용 가능
    return {
      message: '구독이 취소되었습니다. 남은 예측권은 만료일까지 사용 가능합니다.',
      remainingTickets: subscription.ticketsRemaining,
      expiryDate: subscription.nextBillingDate,
    };
  }
}
```

---

## 🎮 사용자 경험

### 구독 전 (무료 체험)

```
사용자 상태: FREE
- ✅ 경주 정보 조회
- ✅ 과거 결과 확인
- ✅ AI 예측 샘플 보기 (일부)
- ❌ 전체 AI 예측 보기
- ❌ 상세 분석 보기
```

### 구독 후 (프리미엄)

```
사용자 상태: PREMIUM
- ✅ 월 30장 AI 예측권
- ✅ 전체 AI 예측 보기
- ✅ 예측 근거 및 분석
- ✅ 신뢰도 점수
- ✅ 과거 정확도 통계
- ✅ 맞춤 알림
```

---

## 📱 UI 구조

### 구독 화면

```
┌─────────────────────────────────────┐
│  🎯 AI 예측권 프리미엄               │
├─────────────────────────────────────┤
│                                      │
│  💎 월 19,800원                      │
│                                      │
│  ✨ 포함 내용:                       │
│  • 월 30장 AI 예측권                 │
│  • 평균 70%+ 정확도                  │
│  • 상세 예측 근거                    │
│  • 신뢰도 점수 제공                  │
│  • 맞춤 알림 서비스                  │
│                                      │
│  [구독 시작하기]                     │
│                                      │
│  ─────────────────────────           │
│                                      │
│  현재 구독 상태: 활성                │
│  남은 예측권: 23 / 30장              │
│  다음 결제일: 2025.11.01             │
│                                      │
│  [구독 관리]                         │
└─────────────────────────────────────┘
```

### 예측권 사용 화면

```
┌─────────────────────────────────────┐
│  🏇 서울 1R - 오후 2:00              │
├─────────────────────────────────────┤
│                                      │
│  🤖 AI 예측 (예측권 1장 필요)        │
│                                      │
│  1위: 3번 천둥번개 (28%)             │
│  2위: 5번 질풍 (22%)                 │
│  3위: 1번 번개 (18%)                 │
│                                      │
│  📊 예측 근거:                       │
│  • 최근 5경주 평균 2.3등              │
│  • 이 경마장 승률 34%                │
│  • 기수 승률 28%                     │
│  • 주로 상태: 유리함                 │
│                                      │
│  신뢰도: ⭐⭐⭐⭐ (85%)              │
│                                      │
│  [예측권 사용하기] (남은 개수: 23)   │
│                                      │
│  ─────────────────────────           │
│  💡 이 예측을 참고하여 한국마사회    │
│     앱/웹사이트에서 직접 마권 구매   │
└─────────────────────────────────────┘
```

---

## 🗄️ 데이터베이스 구조

### Subscriptions 테이블

```sql
CREATE TABLE subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,

    -- 구독 정보
    plan VARCHAR(20) DEFAULT 'PREMIUM',
    price DECIMAL(10,2) DEFAULT 19800.00,
    status ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'),

    -- 기간
    start_date DATETIME NOT NULL,
    next_billing_date DATETIME NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',

    -- 결제 정보
    payment_method_type VARCHAR(20),        -- 'CARD', 'SIMPLE_PAY'
    payment_method_id VARCHAR(100),         -- 결제 수단 ID
    billing_key VARCHAR(200),               -- PG사 빌링키 (암호화)
    card_last4 VARCHAR(4),                  -- 카드 뒷 4자리

    -- 예측권
    tickets_per_month INT DEFAULT 30,
    tickets_used INT DEFAULT 0,
    tickets_remaining INT DEFAULT 30,

    -- 설정
    auto_renew BOOLEAN DEFAULT TRUE,

    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at DATETIME,

    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_next_billing (next_billing_date, status)
);
```

### Prediction_Tickets 테이블

```sql
CREATE TABLE prediction_tickets (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    race_id VARCHAR(50),

    -- 예측권 정보
    issue_date DATETIME NOT NULL,
    expiry_date DATETIME NOT NULL,
    used_date DATETIME,
    status ENUM('AVAILABLE', 'USED', 'EXPIRED') DEFAULT 'AVAILABLE',

    -- AI 예측 내용
    predicted_winner VARCHAR(20),
    predicted_top3 JSON,
    confidence_score DECIMAL(5,2),
    prediction_reasoning TEXT,

    -- 결과 (경주 종료 후)
    actual_result JSON,
    is_correct BOOLEAN,
    accuracy_score DECIMAL(5,2),
    result_checked_at DATETIME,

    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_race (race_id)
);
```

### Billing_History 테이블

```sql
CREATE TABLE billing_history (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,

    -- 결제 정보
    amount DECIMAL(10,2) NOT NULL,
    billing_date DATETIME NOT NULL,
    payment_method VARCHAR(20),

    -- PG사 정보
    pg_provider VARCHAR(50),            -- 'TOSS', 'IAMPORT'
    pg_transaction_id VARCHAR(100),

    -- 상태
    status ENUM('SUCCESS', 'FAILED', 'REFUNDED'),
    error_message TEXT,

    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_date (user_id, billing_date),
    INDEX idx_status (status)
);
```

---

## 🔄 비즈니스 흐름

### 1. 구독 시작

```
사용자 → "구독 시작" 클릭
  ↓
결제 정보 입력
  ↓
19,800원 결제
  ↓
빌링키 발급 (정기 결제용)
  ↓
구독 활성화
  ↓
예측권 30장 즉시 발급
  ↓
사용 가능!
```

### 2. 예측권 사용

```
오늘의 경주 선택
  ↓
"AI 예측 보기" 클릭
  ↓
예측권 1장 차감 (29장 남음)
  ↓
AI 예측 정보 표시
  - 1위 예측
  - 상위 3위 예측
  - 신뢰도 점수
  - 예측 근거
  ↓
사용자가 이 정보를 참고
  ↓
한국마사회 앱/웹에서 직접 마권 구매
  ↓
경주 종료 후
  ↓
앱에서 결과 확인
  ↓
AI 예측 정확도 기록
```

### 3. 매월 자동 갱신

```
매월 1일 00:00 (Cron Job)
  ↓
활성 구독자 조회
  ↓
빌링키로 자동 결제 (19,800원)
  ↓
결제 성공?
  ↓ YES
새로운 예측권 30장 발급
  ↓
사용자에게 알림
  ↓ NO
결제 재시도 (3회)
  ↓ 실패
구독 일시 정지
  ↓
사용자에게 알림
```

---

## 💳 결제 게이트웨이 연동

### 토스페이먼츠 (권장)

```typescript
import { TossPayments } from '@tosspayments/payment-sdk';

class TossPaymentService {
  private tossPayments: TossPayments;

  constructor() {
    this.tossPayments = new TossPayments(process.env.TOSS_CLIENT_KEY, process.env.TOSS_SECRET_KEY);
  }

  /**
   * 빌링키 발급 (정기 결제용)
   */
  async issueBillingKey(cardInfo: CardInfo) {
    const response = await this.tossPayments.issueBillingKey({
      customerKey: cardInfo.userId,
      cardNumber: cardInfo.cardNumber,
      cardExpirationYear: cardInfo.expiryYear,
      cardExpirationMonth: cardInfo.expiryMonth,
      cardPassword: cardInfo.password,
      customerBirthday: cardInfo.birthday,
    });

    return response.billingKey;
  }

  /**
   * 정기 결제
   */
  async chargeWithBillingKey(billingKey: string, amount: number) {
    const response = await this.tossPayments.requestBillingPayment({
      billingKey,
      amount,
      orderName: 'AI 예측권 월 구독',
      customerEmail: user.email,
      customerName: user.name,
    });

    return {
      success: response.status === 'DONE',
      transactionId: response.paymentKey,
      paidAt: response.approvedAt,
    };
  }
}
```

---

## 📊 수익 모델

### 예상 수익

#### 구독 수익

| 구독자 수 | 월 매출   | 연 매출        |
| --------- | --------- | -------------- |
| 100명     | 198만원   | 2,376만원      |
| 500명     | 990만원   | 1억 1,880만원  |
| 1,000명   | 1,980만원 | 2억 3,760만원  |
| 5,000명   | 9,900만원 | 11억 8,800만원 |

#### 개별 구매 수익 (추가)

| 월 판매량 | 단가    | 월 매출 | 연 매출   |
| --------- | ------- | ------- | --------- |
| 100장     | 1,000원 | 10만원  | 120만원   |
| 500장     | 1,000원 | 50만원  | 600만원   |
| 1,000장   | 1,000원 | 100만원 | 1,200만원 |

#### 예상 수익 믹스 (100명 구독 + 월 200장 개별 판매)

| 항목      | 월 매출     | 연 매출       |
| --------- | ----------- | ------------- |
| 구독 수익 | 198만원     | 2,376만원     |
| 개별 판매 | 20만원      | 240만원       |
| **합계**  | **218만원** | **2,616만원** |

### 비용 구조

| 항목             | 비용                       | 비율     |
| ---------------- | -------------------------- | -------- |
| **LLM API 비용** | **~30만원/월**             | **~14%** |
| 서버 운영 (GCP)  | ~20만원/월                 | 9%       |
| PG 수수료 (3.5%) | ~7.6만원/월 (218만원 기준) | 3.5%     |
| 마케팅           | ~50만원/월                 | 23%      |
| **순이익**       | **~110만원/월**            | **~50%** |

> **LLM API 비용**: GPT-4 기준 예측당 약 $0.10 = 130원  
> 월 2,300회 예측 시 약 30만원 (100명 × 월 23장 평균 사용)

---

## ⚖️ 법적 안전성

### 이 모델이 합법적인 이유

1. **정보 제공 서비스**

   - ✅ AI 예측 정보 판매 (합법)
   - ✅ 데이터 분석 서비스 (합법)
   - ❌ 앱 내 베팅 없음

2. **현금 거래는 정보 구독료만**

   - ✅ 구독료 결제 (정보 서비스 요금)
   - ❌ 베팅 금액 아님
   - ❌ 배당금 지급 없음

3. **실제 베팅은 외부**
   - ✅ 사용자가 한국마사회에서 직접
   - ✅ 앱은 정보만 제공
   - ✅ 책임은 사용자

### 명시 사항

```
📝 서비스 약관에 명시:

"본 서비스는 AI 기반 경주 예측 정보를 제공하는
정보 서비스입니다. 실제 마권 구매는 사용자가
한국마사회 공식 채널에서 직접 진행하며,
본 서비스는 어떠한 베팅 행위도 중개하지 않습니다."
```

---

## 🔗 관련 문서

- [BETTING_VS_PREDICTION.md](BETTING_VS_PREDICTION.md) - 개념 구분
- [AI_FEATURES.md](../ai/AI_FEATURES.md) - AI 예측 시스템
- [AI_PREDICTION_ROADMAP.md](../ai/AI_PREDICTION_ROADMAP.md) - AI 로드맵

---

## 🚀 구현 우선순위

### Phase 1: MVP (4주)

1. ✅ 구독 시스템 구축
2. ✅ 토스페이먼츠 연동
3. ✅ 예측권 발급/관리
4. ✅ AI 예측 표시

### Phase 2: 고도화 (4주)

1. 🔄 AI 모델 정확도 향상
2. 🔄 상세 분석 제공
3. 🔄 맞춤 알림
4. 🔄 통계 대시보드

### Phase 3: 확장 (계속)

1. 📅 다양한 구독 플랜
2. 📅 예측권 선물 기능
3. 📅 단체 구독 할인

---

**마지막 업데이트**: 2025년 10월 10일
