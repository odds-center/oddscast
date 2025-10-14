# 💳 구독 결제 시스템

**AI 예측권 월 구독 서비스** (19,800원/월)

---

## 📋 개요

### 비즈니스 모델

Golden Race는 **AI 예측 정보 구독 서비스**입니다.

| 항목      | 내용                                     |
| --------- | ---------------------------------------- |
| 서비스    | AI 예측 정보 제공 (합법적 정보 서비스)   |
| 구독료    | LIGHT: 월 9,900원 / PREMIUM: 월 19,800원 |
| 제공 내용 | LIGHT: 월 11장 / PREMIUM: 월 24장        |
| 결제 방식 | 카드 정기 결제 (자동 갱신)               |
| 실제 베팅 | 한국마사회 등 외부에서 사용자 직접       |

> **중요**: 본 앱은 AI 예측 정보만 제공합니다. 실제 마권 구매는 한국마사회 공식 채널에서 사용자가 직
> 접 진행합니다.

---

## 🏗️ 시스템 아키텍처

```
구독 결제 시스템
│
├── 💳 결제 게이트웨이
│   └── 토스페이먼츠 (정기 결제)
│
├── 📋 구독 관리
│   ├── 구독 시작/취소
│   ├── 자동 갱신 (매월 1일)
│   └── 예측권 발급 (30장)
│
├── 🎫 예측권 시스템
│   ├── 발급/사용/만료
│   ├── AI 예측 연동
│   └── 정확도 기록
│
└── 📊 통계 및 알림
    ├── 구독자 통계
    ├── 매출 분석
    └── 결제 알림
```

---

## 💎 구독 플랜

### 프리미엄 플랜

```typescript
const SUBSCRIPTION_PLANS = {
  LIGHT: {
    name: 'AI 예측권 라이트',
    price: 9900, // 월 9,900원
    currency: 'KRW',
    billingCycle: 'MONTHLY',
    ticketsPerMonth: 11, // 월 11장 (10+1)
    features: ['월 11장 AI 예측권', '평균 70%+ 정확도', '상세 예측 근거'],
  },
  PREMIUM: {
    name: 'AI 예측권 프리미엄',
    price: 19800, // 월 19,800원
    currency: 'KRW',
    billingCycle: 'MONTHLY',
    ticketsPerMonth: 24, // 월 24장 (20+4)
    features: [
      '월 24장 AI 예측권',
      '평균 70%+ 정확도',
      '상세 예측 근거',
      '신뢰도 점수',
      '맞춤 알림 서비스',
    ],
  },
};
```

---

## 🗄️ 데이터베이스

### Subscriptions 테이블

```sql
CREATE TABLE subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,

    -- 구독 정보
    plan VARCHAR(20) DEFAULT 'PREMIUM',
    price DECIMAL(10,2) DEFAULT 19800.00,
    status ENUM('ACTIVE', 'CANCELLED', 'EXPIRED') DEFAULT 'ACTIVE',

    -- 기간
    start_date DATETIME NOT NULL,
    next_billing_date DATETIME NOT NULL,

    -- 결제 정보 (암호화 저장)
    billing_key VARCHAR(200) NOT NULL COMMENT '토스 빌링키',
    card_last4 VARCHAR(4) COMMENT '카드 뒷 4자리',

    -- 예측권 관리
    tickets_per_month INT DEFAULT 30,
    tickets_remaining INT DEFAULT 30,

    -- 설정
    auto_renew BOOLEAN DEFAULT TRUE,

    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_billing_date (next_billing_date)
);
```

### Prediction_Tickets 테이블

```sql
CREATE TABLE prediction_tickets (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    race_id VARCHAR(50),

    -- 예측권 상태
    status ENUM('AVAILABLE', 'USED', 'EXPIRED') DEFAULT 'AVAILABLE',
    issue_date DATETIME NOT NULL,
    expiry_date DATETIME NOT NULL,
    used_date DATETIME,

    -- AI 예측 (사용 시 생성)
    ai_prediction JSON COMMENT '{"winner":"3","top3":["3","5","1"],"confidence":85}',
    prediction_reasoning TEXT,

    -- 결과 (경주 종료 후)
    actual_result JSON,
    is_correct BOOLEAN,
    accuracy_score DECIMAL(5,2),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
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

    -- PG사 정보
    pg_transaction_id VARCHAR(100),
    pg_provider VARCHAR(20) DEFAULT 'TOSS',

    -- 상태
    status ENUM('SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',
    error_message TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);
```

---

## 💳 구독 결제 흐름

### 1. 구독 시작

```
[사용자] "프리미엄 구독" 선택
    ↓
[앱] 결제 페이지 표시
    ↓
[사용자] 카드 정보 입력
    ↓
[서버] 토스페이먼츠로 빌링키 발급
    ↓
[서버] 첫 결제 (19,800원)
    ↓
[DB] 구독 정보 저장
    ↓
[서버] 예측권 30장 즉시 발급
    ↓
[사용자] 구독 활성화 완료!
```

### 2. 매월 자동 갱신

```
[Cron] 매월 1일 00:00 실행
    ↓
[서버] 활성 구독자 조회
    ↓
[서버] 빌링키로 자동 결제 (19,800원)
    ↓
[결제 성공?]
    ↓ YES
[서버] 새로운 예측권 30장 발급
[알림] "예측권 30장이 충전되었습니다"
    ↓ NO
[서버] 결제 재시도 (최대 3회)
[알림] "결제 실패, 카드 정보를 확인해주세요"
```

### 3. 예측권 사용

```
[사용자] 경주 선택 → "AI 예측 보기"
    ↓
[서버] 예측권 1장 차감 (29장 남음)
    ↓
[AI] 해당 경주 예측 생성
    ↓
[앱] AI 예측 정보 표시
    - 1위: 3번 (28%)
    - 상위 3위: 3, 5, 1
    - 신뢰도: 85%
    - 근거: 최근 성적 우수
    ↓
[사용자] 이 정보를 참고하여
         한국마사회 앱에서 직접 마권 구매
```

---

## 🔧 구현 코드

### SubscriptionService

```typescript
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    private tossService: TossPaymentService,
    private ticketService: PredictionTicketService
  ) {}

  /**
   * 구독 시작
   */
  async subscribe(userId: string, cardInfo: CardInfo) {
    // 1. 빌링키 발급
    const billingKey = await this.tossService.issueBillingKey({
      customerKey: userId,
      ...cardInfo,
    });

    // 2. 첫 결제
    const payment = await this.tossService.charge({
      billingKey,
      amount: 19800,
      orderName: 'AI 예측권 프리미엄 (첫 결제)',
    });

    if (!payment.success) {
      throw new BadRequestException('결제 실패');
    }

    // 3. 구독 생성
    const subscription = this.subscriptionRepo.create({
      userId,
      plan: 'PREMIUM',
      price: 19800,
      status: 'ACTIVE',
      startDate: new Date(),
      nextBillingDate: this.getNextMonthDate(),
      billingKey: await this.encrypt(billingKey),
      cardLast4: cardInfo.cardNumber.slice(-4),
      ticketsPerMonth: 30,
      ticketsRemaining: 30,
      autoRenew: true,
    });

    await this.subscriptionRepo.save(subscription);

    // 4. 예측권 30장 발급
    await this.ticketService.issueTickets(userId, subscription.id, 30);

    return {
      subscriptionId: subscription.id,
      ticketsIssued: 30,
      nextBillingDate: subscription.nextBillingDate,
    };
  }

  /**
   * 매월 자동 결제 (Cron Job)
   */
  @Cron('0 0 1 * *') // 매월 1일 00:00
  async processMonthlyBilling() {
    const activeSubscriptions = await this.subscriptionRepo.find({
      where: { status: 'ACTIVE', autoRenew: true },
    });

    for (const sub of activeSubscriptions) {
      try {
        const billingKey = await this.decrypt(sub.billingKey);

        // 정기 결제
        const payment = await this.tossService.charge({
          billingKey,
          amount: 19800,
          orderName: `AI 예측권 구독 ${this.getMonthString()}`,
        });

        if (payment.success) {
          // 새 예측권 30장 발급
          await this.ticketService.issueTickets(sub.userId, sub.id, 30);

          // 구독 정보 업데이트
          sub.nextBillingDate = this.getNextMonthDate();
          sub.ticketsRemaining = 30;
          await this.subscriptionRepo.save(sub);

          // 성공 알림
          await this.sendNotification(sub.userId, '예측권 30장이 충전되었습니다! 🎉');
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
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId, userId },
    });

    subscription.status = 'CANCELLED';
    subscription.autoRenew = false;
    await this.subscriptionRepo.save(subscription);

    return {
      message: '구독이 취소되었습니다. 남은 예측권은 만료일까지 사용 가능합니다.',
      remainingTickets: subscription.ticketsRemaining,
      expiryDate: subscription.nextBillingDate,
    };
  }

  private getNextMonthDate(): Date {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}
```

---

## 🎫 예측권 시스템

### PredictionTicketService

```typescript
@Injectable()
export class PredictionTicketService {
  /**
   * 예측권 발급
   */
  async issueTickets(userId: string, subscriptionId: string, count: number) {
    const expiryDate = this.getNextMonthDate();
    const tickets = [];

    for (let i = 0; i < count; i++) {
      tickets.push({
        id: uuid(),
        subscriptionId,
        userId,
        status: 'AVAILABLE',
        issueDate: new Date(),
        expiryDate,
      });
    }

    await this.ticketRepo.save(tickets);
    return tickets;
  }

  /**
   * 예측권 사용 (AI 예측 보기)
   */
  async useTicket(userId: string, raceId: string) {
    // 1. 사용 가능한 예측권 조회
    const ticket = await this.ticketRepo.findOne({
      where: { userId, status: 'AVAILABLE' },
      order: { issueDate: 'ASC' },
    });

    if (!ticket) {
      throw new BadRequestException('사용 가능한 예측권이 없습니다.');
    }

    // 2. AI 예측 생성
    const aiPrediction = await this.aiService.predictRace(raceId);

    // 3. 예측권 사용 처리
    ticket.status = 'USED';
    ticket.raceId = raceId;
    ticket.usedDate = new Date();
    ticket.aiPrediction = aiPrediction;
    await this.ticketRepo.save(ticket);

    // 4. 구독 정보 업데이트
    await this.updateSubscriptionTickets(ticket.subscriptionId, -1);

    return {
      ticketId: ticket.id,
      aiPrediction,
      remainingTickets: await this.getRemainingCount(userId),
    };
  }

  /**
   * 경주 결과 확인 및 정확도 기록
   */
  async checkResult(ticketId: string, actualResult: string[]) {
    const ticket = await this.ticketRepo.findOne(ticketId);

    const prediction = ticket.aiPrediction;
    const isCorrect = prediction.winner === actualResult[0];
    const accuracy = this.calculateAccuracy(prediction.top3, actualResult);

    ticket.actualResult = actualResult;
    ticket.isCorrect = isCorrect;
    ticket.accuracyScore = accuracy;

    await this.ticketRepo.save(ticket);

    return { isCorrect, accuracy };
  }

  private calculateAccuracy(predicted: string[], actual: string[]): number {
    let score = 0;
    if (predicted[0] === actual[0]) score += 50; // 1위 맞춤
    if (predicted.includes(actual[1])) score += 30; // 2위 포함
    if (predicted.includes(actual[2])) score += 20; // 3위 포함
    return score;
  }
}
```

---

## 💳 토스페이먼츠 연동

### 설치

```bash
npm install @tosspayments/payment-sdk
```

### 환경 변수

```bash
# .env
TOSS_CLIENT_KEY=test_ck_YOUR_CLIENT_KEY
TOSS_SECRET_KEY=test_sk_YOUR_SECRET_KEY
TOSS_SUCCESS_URL=https://your-domain.com/payment/success
TOSS_FAIL_URL=https://your-domain.com/payment/fail
```

### TossPaymentService

```typescript
@Injectable()
export class TossPaymentService {
  private apiUrl = 'https://api.tosspayments.com/v1';

  /**
   * 빌링키 발급 (정기 결제용)
   */
  async issueBillingKey(data: {
    customerKey: string;
    cardNumber: string;
    cardExpirationYear: string;
    cardExpirationMonth: string;
    cardPassword: string;
    customerBirthday: string;
  }): Promise<string> {
    const response = await axios.post(
      `${this.apiUrl}/billing/authorizations/card`,
      {
        customerKey: data.customerKey,
        cardNumber: data.cardNumber,
        cardExpirationYear: data.cardExpirationYear,
        cardExpirationMonth: data.cardExpirationMonth,
        cardPassword: data.cardPassword,
        customerBirthday: data.customerBirthday,
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString(
            'base64'
          )}`,
        },
      }
    );

    return response.data.billingKey;
  }

  /**
   * 빌링키로 결제 (정기 결제)
   */
  async charge(data: {
    billingKey: string;
    amount: number;
    orderName: string;
  }): Promise<PaymentResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/billing/${data.billingKey}`,
        {
          amount: data.amount,
          orderName: data.orderName,
          customerKey: data.customerKey,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString(
              'base64'
            )}`,
          },
        }
      );

      return {
        success: response.data.status === 'DONE',
        paymentKey: response.data.paymentKey,
        approvedAt: response.data.approvedAt,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}
```

---

## 📱 모바일 UI

### 구독 화면

```typescript
function SubscriptionScreen() {
  return (
    <View>
      <Text style={styles.title}>🎯 AI 예측권 프리미엄</Text>

      <View style={styles.priceCard}>
        <Text style={styles.price}>월 19,800원</Text>
        <Text style={styles.subtitle}>매월 30장 AI 예측권</Text>
      </View>

      <View style={styles.features}>
        <Feature icon='✨' text='월 30장 AI 예측권' />
        <Feature icon='🎯' text='평균 70%+ 정확도' />
        <Feature icon='📊' text='상세 예측 근거' />
        <Feature icon='🔔' text='맞춤 알림 서비스' />
      </View>

      <Button onPress={handleSubscribe}>구독 시작하기</Button>

      <Text style={styles.legal}>
        * AI 예측 정보 제공 서비스입니다.
        {'\n'}* 실제 베팅은 한국마사회에서 직접 진행하세요.
      </Text>
    </View>
  );
}
```

---

## 💰 수익 모델

### 예상 수익

| 구독자  | 월 매출   | 연 매출   |
| ------- | --------- | --------- |
| 100명   | 198만원   | 2,376만원 |
| 500명   | 990만원   | 1.19억원  |
| 1,000명 | 1,980만원 | 2.38억원  |
| 5,000명 | 9,900만원 | 11.88억원 |

### 비용 구조 (예상)

| 항목             | 비용              | 비율     |
| ---------------- | ----------------- | -------- |
| PG 수수료 (3.5%) | ~69,300원 (100명) | 3.5%     |
| 서버 운영 (GCP)  | ~50만원           | 5%       |
| AI 서버          | ~100만원          | 10%      |
| 마케팅           | ~200만원          | 20%      |
| **순이익**       | **~1,178,700원**  | **~59%** |

---

## ⚖️ 법적 안전성

### 합법적인 이유

| 구분            | 설명                                |
| --------------- | ----------------------------------- |
| **서비스 성격** | 정보 제공 서비스 (주식 정보와 동일) |
| **결제 대상**   | AI 예측 정보 구독료                 |
| **베팅 행위**   | 앱 내 베팅 없음 (정보만 제공)       |
| **책임**        | 실제 베팅은 사용자 책임             |

### 명시 사항

```
✅ AI 예측 정보 구독 서비스입니다
✅ 구독료는 정보 서비스 이용료입니다
✅ 실제 마권 구매는 한국마사회 공식 채널에서
❌ 본 앱에서는 베팅을 중개하지 않습니다
❌ 예측 정확도를 보장하지 않습니다
```

---

## 🔗 관련 문서

- [AI 구독 모델](AI_SUBSCRIPTION_MODEL.md) - 구독 서비스 상세
- [베팅 vs 예측](BETTING_VS_PREDICTION.md) - 개념 구분
- [법적 고지](../../../LEGAL_NOTICE.md) - 법적 안내

---

**마지막 업데이트**: 2025년 10월 10일
