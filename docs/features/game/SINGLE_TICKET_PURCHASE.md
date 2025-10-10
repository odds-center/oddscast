# 🎫 개별 예측권 구매

**예측권 소진 시 개별 구매 옵션**

---

## 📋 개요

### 개별 구매 모델

구독 예측권을 모두 사용했거나, 구독하지 않은 사용자를 위한 옵션입니다.

| 항목          | 내용                          |
| ------------- | ----------------------------- |
| **상품명**    | AI 예측권 (낱개)              |
| **가격**      | 1,000원/장                    |
| **사용 기한** | 구매일로부터 30일             |
| **결제 방식** | 즉시 결제 (카드/간편결제)     |
| **할인 안내** | 구독 시 장당 660원 (34% 할인) |

---

## 💳 결제 흐름

### 개별 구매 프로세스

```
사용자: 예측권 없음 확인
  ↓
앱: "예측권 구매" 버튼 표시
  ↓
사용자: "1장 구매 (1,000원)" 선택
  ↓
결제 페이지 (토스페이먼츠)
  ↓
카드/간편결제 선택
  ↓
즉시 결제 (1,000원)
  ↓
예측권 1장 즉시 발급
  ↓
사용 가능! (30일 내 사용)
```

---

## 🗄️ 데이터베이스

### Single_Ticket_Purchases 테이블

```sql
CREATE TABLE single_ticket_purchases (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,

    -- 구매 정보
    ticket_id VARCHAR(36) NOT NULL,
    price DECIMAL(10,2) DEFAULT 1000.00,

    -- 결제 정보
    pg_transaction_id VARCHAR(100),
    payment_method VARCHAR(20),      -- 'CARD', 'KAKAOPAY', 'NAVERPAY'

    -- 상태
    status ENUM('SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',

    -- 타임스탬프
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ticket_id) REFERENCES prediction_tickets(id),
    INDEX idx_user (user_id),
    INDEX idx_purchase_date (purchased_at)
);
```

---

## 🔧 구현 코드

### SingleTicketPurchaseService

```typescript
@Injectable()
export class SingleTicketPurchaseService {
  constructor(
    @InjectRepository(SingleTicketPurchase)
    private purchaseRepo: Repository<SingleTicketPurchase>,
    private tossService: TossPaymentService,
    private ticketService: PredictionTicketService
  ) {}

  /**
   * 개별 예측권 구매
   */
  async purchaseSingleTicket(userId: string, paymentMethod: string) {
    // 1. 즉시 결제 (토스페이먼츠)
    const payment = await this.tossService.instantPayment({
      amount: 1000,
      orderName: 'AI 예측권 1장',
      customerKey: userId,
      paymentMethod, // 'CARD', 'KAKAOPAY', etc.
    });

    if (!payment.success) {
      throw new BadRequestException('결제 실패');
    }

    // 2. 예측권 1장 발급 (30일 만료)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const ticket = await this.ticketService.issueTicket({
      userId,
      subscriptionId: null, // 개별 구매는 구독 없음
      issueDate: new Date(),
      expiryDate,
      status: 'AVAILABLE',
    });

    // 3. 구매 기록 저장
    const purchase = this.purchaseRepo.create({
      id: uuid(),
      userId,
      ticketId: ticket.id,
      price: 1000,
      pgTransactionId: payment.transactionId,
      paymentMethod,
      status: 'SUCCESS',
      purchasedAt: new Date(),
    });

    await this.purchaseRepo.save(purchase);

    return {
      ticketId: ticket.id,
      expiryDate: ticket.expiryDate,
      transactionId: payment.transactionId,
    };
  }

  /**
   * 여러 장 한 번에 구매 (할인 적용 가능)
   */
  async purchaseMultipleTickets(userId: string, quantity: number, paymentMethod: string) {
    const basePrice = 1000;
    let totalPrice = basePrice * quantity;

    // 할인 적용 (5장 이상 구매 시)
    if (quantity >= 5) {
      totalPrice = totalPrice * 0.95; // 5% 할인
    }
    if (quantity >= 10) {
      totalPrice = totalPrice * 0.9; // 10% 할인
    }

    const payment = await this.tossService.instantPayment({
      amount: Math.floor(totalPrice),
      orderName: `AI 예측권 ${quantity}장`,
      customerKey: userId,
      paymentMethod,
    });

    if (!payment.success) {
      throw new BadRequestException('결제 실패');
    }

    // 예측권 발급
    const tickets = await this.ticketService.issueTickets(userId, null, quantity);

    return {
      ticketsIssued: quantity,
      totalPrice: Math.floor(totalPrice),
      perTicketPrice: Math.floor(totalPrice / quantity),
      discount: quantity >= 5 ? (quantity >= 10 ? '10%' : '5%') : '없음',
    };
  }
}
```

---

## 📱 모바일 UI

### 예측권 소진 시 화면

```typescript
function NoTicketsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>예측권이 모두 소진되었습니다</Text>

      {/* 구독 추천 */}
      <Card style={styles.subscriptionCard}>
        <Badge>추천</Badge>
        <Text style={styles.planName}>💎 프리미엄 구독</Text>
        <Text style={styles.price}>월 19,800원</Text>
        <Text style={styles.perTicket}>장당 660원 (34% 할인)</Text>
        <Text style={styles.features}>✨ 월 30장 AI 예측권</Text>
        <Button onPress={handleSubscribe}>구독 시작</Button>
      </Card>

      {/* 개별 구매 */}
      <View style={styles.singlePurchase}>
        <Text style={styles.sectionTitle}>또는 필요한 만큼만 구매</Text>

        <Card style={styles.purchaseCard}>
          <Text style={styles.ticketName}>🎫 AI 예측권 1장</Text>
          <Text style={styles.singlePrice}>1,000원</Text>
          <Text style={styles.validity}>30일간 사용 가능</Text>
          <Button onPress={() => handleBuyTicket(1)}>1장 구매하기</Button>
        </Card>

        {/* 묶음 구매 옵션 */}
        <View style={styles.bulkOptions}>
          <TouchableOpacity onPress={() => handleBuyTicket(5)}>
            <Text>5장 구매 (4,750원) 5% 할인</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleBuyTicket(10)}>
            <Text>10장 구매 (9,000원) 10% 할인</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.comparison}>💡 월 10장 이상 사용하신다면 구독이 더 저렴합니다!</Text>
    </View>
  );
}
```

---

## 💰 가격 정책

### 가격 비교

| 구매 방식 | 가격               | 장당 단가 | 할인율  |
| --------- | ------------------ | --------- | ------- |
| **구독**  | 19,800원/월 (30장) | **660원** | **34%** |
| 1장       | 1,000원            | 1,000원   | -       |
| 5장       | 4,750원            | 950원     | 5%      |
| 10장      | 9,000원            | 900원     | 10%     |

### 손익 분기점

```
월 20장 이상 사용 → 구독이 유리
월 20장 미만 → 개별 구매 가능
```

---

## 📊 수익 예상 (개별 구매 포함)

### 월 수익 구성 (예시: 100명 기준)

| 구분                 | 사용자 | 매출          | 설명          |
| -------------------- | ------ | ------------- | ------------- |
| 프리미엄 구독        | 80명   | 158.4만원     | 월 30장 포함  |
| 개별 구매 (평균 5장) | 50명   | 25만원        | 1장당 1,000원 |
| **총 매출**          | -      | **183.4만원** | -             |

### 비용 구조 (개별 구매 포함)

| 항목             | 비용        | 비율     |
| ---------------- | ----------- | -------- |
| **LLM API**      | ~28만원     | 15%      |
| 서버 운영        | ~20만원     | 11%      |
| PG 수수료 (3.5%) | ~6.4만원    | 3.5%     |
| 마케팅           | ~50만원     | 27%      |
| **순이익**       | **~79만원** | **~43%** |

---

## 🔗 관련 문서

- [구독 모델](AI_SUBSCRIPTION_MODEL.md) - 프리미엄 구독
- [결제 시스템](PAYMENT_INTEGRATION.md) - 결제 구현

---

**마지막 업데이트**: 2025년 10월 10일
