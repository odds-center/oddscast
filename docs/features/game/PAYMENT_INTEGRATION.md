# Golden Race - 결제 시스템 연동

## 💳 개요

Golden Race의 결제 시스템 연동 가이드를 제공합니다. 안전하고 신뢰할 수 있는 결제 시스템을 통해 사용
자의 베팅 자금을 안전하게 관리하고, 다양한 결제 수단을 지원하는 것이 목표입니다.

## 🏗️ 결제 시스템 아키텍처

### 전체 구조

```
결제 시스템 계층
├── 💰 결제 게이트웨이
│   ├── 카드 결제 (신용카드, 체크카드)
│   ├── 간편 결제 (카카오페이, 네이버페이)
│   ├── 계좌 이체 (실시간 계좌이체)
│   └── 가상 계좌 (무통장입금)
├── 🔐 보안 시스템
│   ├── 결제 암호화
│   ├── PCI DSS 준수
│   ├── 3D Secure 인증
│   └── 사기 방지
├── 💾 잔액 관리
│   ├── 사용자 잔액
│   ├── 거래 내역
│   ├── 정산 처리
│   └── 환불 처리
└── 📊 모니터링
    ├── 결제 성공률
    ├── 오류 추적
    ├── 성능 모니터링
    └── 알림 시스템
```

### 기술 스택

- **결제 게이트웨이**: 토스페이먼츠, 아임포트
- **보안**: SSL/TLS, AES-256, RSA-2048
- **데이터베이스**: MySQL + Redis (캐싱)
- **모니터링**: Prometheus + Grafana
- **로깅**: ELK Stack (Elasticsearch, Logstash, Kibana)

## 💳 결제 수단별 구현

### 카드 결제

가장 일반적인 결제 수단으로, 신용카드와 체크카드를 지원합니다.

```typescript
interface CardPayment {
  cardNumber: string; // 카드 번호 (마스킹 처리)
  expiryMonth: string; // 만료 월 (MM)
  expiryYear: string; // 만료 년 (YYYY)
  cardPassword: string; // 카드 비밀번호 (앞 2자리)
  birthDate: string; // 생년월일 (YYYYMMDD)
  amount: number; // 결제 금액
  installment: number; // 할부 개월 (0: 일시불)
}

class CardPaymentService {
  async processCardPayment(payment: CardPayment): Promise<PaymentResult> {
    try {
      // 1. 카드 정보 검증
      const validationResult = await this.validateCardInfo(payment);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // 2. 결제 게이트웨이 호출
      const gatewayResponse = await this.paymentGateway.charge({
        method: 'card',
        card: {
          number: payment.cardNumber,
          expiry: `${payment.expiryMonth}/${payment.expiryYear}`,
          cvc: payment.cardPassword,
          name: payment.cardHolderName,
        },
        amount: payment.amount,
        currency: 'KRW',
        description: 'Golden Race 베팅 충전',
        metadata: {
          userId: payment.userId,
          type: 'BETTING_CHARGE',
        },
      });

      // 3. 결제 성공 처리
      if (gatewayResponse.status === 'success') {
        await this.updateUserBalance(payment.userId, payment.amount);
        await this.createTransactionRecord(payment, gatewayResponse);

        return {
          success: true,
          transactionId: gatewayResponse.transactionId,
          amount: payment.amount,
          timestamp: new Date(),
        };
      } else {
        throw new Error(gatewayResponse.errorMessage);
      }
    } catch (error) {
      await this.handlePaymentError(payment, error);
      throw error;
    }
  }

  private async validateCardInfo(payment: CardPayment): Promise<ValidationResult> {
    // 카드 번호 유효성 검사 (Luhn 알고리즘)
    if (!this.isValidCardNumber(payment.cardNumber)) {
      return {
        isValid: false,
        error: '유효하지 않은 카드 번호입니다.',
      };
    }

    // 만료일 검사
    const expiryDate = new Date(parseInt(payment.expiryYear), parseInt(payment.expiryMonth) - 1);

    if (expiryDate <= new Date()) {
      return {
        isValid: false,
        error: '카드가 만료되었습니다.',
      };
    }

    return { isValid: true };
  }

  private isValidCardNumber(cardNumber: string): boolean {
    // Luhn 알고리즘 구현
    const digits = cardNumber.replace(/\D/g, '').split('').map(Number);
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }
}
```

### 간편 결제

카카오페이, 네이버페이 등 간편 결제 서비스를 지원합니다.

```typescript
interface SimplePayment {
  provider: 'KAKAO' | 'NAVER' | 'PAYPAL';
  amount: number;
  userId: string;
  redirectUrl: string;
}

class SimplePaymentService {
  async initiateSimplePayment(payment: SimplePayment): Promise<SimplePaymentResult> {
    try {
      // 1. 결제 세션 생성
      const session = await this.createPaymentSession(payment);

      // 2. 결제 게이트웨이 호출
      const gatewayResponse = await this.paymentGateway.createPayment({
        method: payment.provider.toLowerCase(),
        amount: payment.amount,
        currency: 'KRW',
        description: 'Golden Race 베팅 충전',
        returnUrl: payment.redirectUrl,
        cancelUrl: `${payment.redirectUrl}?canceled=true`,
        metadata: {
          sessionId: session.id,
          userId: payment.userId,
        },
      });

      // 3. 결제 URL 반환
      return {
        success: true,
        paymentUrl: gatewayResponse.paymentUrl,
        sessionId: session.id,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      await this.handlePaymentError(payment, error);
      throw error;
    }
  }

  async handleSimplePaymentCallback(callbackData: any): Promise<void> {
    const { sessionId, status, transactionId } = callbackData;

    // 1. 세션 검증
    const session = await this.validatePaymentSession(sessionId);
    if (!session) {
      throw new Error('유효하지 않은 결제 세션입니다.');
    }

    // 2. 결제 상태 확인
    if (status === 'success') {
      await this.completePayment(session, transactionId);
    } else {
      await this.cancelPayment(session);
    }
  }

  private async createPaymentSession(payment: SimplePayment): Promise<PaymentSession> {
    const session = await this.paymentSessionService.create({
      userId: payment.userId,
      amount: payment.amount,
      provider: payment.provider,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분 후 만료
    });

    return session;
  }
}
```

### 계좌 이체

실시간 계좌이체를 통한 결제를 지원합니다.

```typescript
interface BankTransfer {
  bankCode: string; // 은행 코드
  accountNumber: string; // 계좌번호
  accountHolder: string; // 예금주명
  amount: number; // 이체 금액
  userId: string;
}

class BankTransferService {
  async processBankTransfer(transfer: BankTransfer): Promise<TransferResult> {
    try {
      // 1. 계좌 정보 검증
      const validationResult = await this.validateBankAccount(transfer);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // 2. 이체 요청
      const transferResponse = await this.bankGateway.transfer({
        fromAccount: this.getSystemAccount(),
        toAccount: {
          bankCode: transfer.bankCode,
          accountNumber: transfer.accountNumber,
          accountHolder: transfer.accountHolder,
        },
        amount: transfer.amount,
        description: 'Golden Race 베팅 충전',
        reference: `GR_${Date.now()}`,
      });

      // 3. 이체 성공 처리
      if (transferResponse.status === 'success') {
        await this.updateUserBalance(transfer.userId, transfer.amount);
        await this.createTransactionRecord(transfer, transferResponse);

        return {
          success: true,
          transferId: transferResponse.transferId,
          amount: transfer.amount,
          timestamp: new Date(),
        };
      } else {
        throw new Error(transferResponse.errorMessage);
      }
    } catch (error) {
      await this.handleTransferError(transfer, error);
      throw error;
    }
  }

  private async validateBankAccount(transfer: BankTransfer): Promise<ValidationResult> {
    // 계좌번호 형식 검증
    if (!this.isValidAccountNumber(transfer.accountNumber)) {
      return {
        isValid: false,
        error: '유효하지 않은 계좌번호입니다.',
      };
    }

    // 예금주명 검증 (실제 은행 API 호출)
    try {
      const accountInfo = await this.bankGateway.getAccountInfo({
        bankCode: transfer.bankCode,
        accountNumber: transfer.accountNumber,
      });

      if (accountInfo.accountHolder !== transfer.accountHolder) {
        return {
          isValid: false,
          error: '예금주명이 일치하지 않습니다.',
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: '계좌 정보를 확인할 수 없습니다.',
      };
    }
  }
}
```

## 🔐 결제 보안 시스템

### PCI DSS 준수

결제 카드 정보 보안을 위한 PCI DSS 표준을 준수합니다.

```typescript
class PaymentSecurityService {
  // 카드 정보 암호화
  encryptCardData(cardData: CardData): EncryptedCardData {
    const encryptedCardNumber = this.encrypt(cardData.cardNumber, this.getEncryptionKey());
    const encryptedCvc = this.encrypt(cardData.cvc, this.getEncryptionKey());

    return {
      encryptedCardNumber,
      encryptedCvc,
      maskedCardNumber: this.maskCardNumber(cardData.cardNumber),
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
    };
  }

  // 카드 정보 복호화
  decryptCardData(encryptedData: EncryptedCardData): CardData {
    const cardNumber = this.decrypt(encryptedData.encryptedCardNumber, this.getEncryptionKey());
    const cvc = this.decrypt(encryptedData.encryptedCvc, this.getEncryptionKey());

    return {
      cardNumber,
      cvc,
      expiryMonth: encryptedData.expiryMonth,
      expiryYear: encryptedData.expiryYear,
    };
  }

  // 카드 번호 마스킹
  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) return cardNumber;

    const lastFour = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 4);

    return masked + lastFour;
  }

  // 암호화 키 관리
  private getEncryptionKey(): string {
    return process.env.PAYMENT_ENCRYPTION_KEY || '';
  }
}
```

### 3D Secure 인증

3D Secure를 통한 추가 보안 인증을 지원합니다.

```typescript
class ThreeDSecureService {
  async initiate3DSecure(payment: CardPayment): Promise<ThreeDSecureResult> {
    try {
      // 1. 3D Secure 인증 요청
      const authResponse = await this.paymentGateway.initiate3DSecure({
        cardNumber: payment.cardNumber,
        amount: payment.amount,
        currency: 'KRW',
        returnUrl: `${process.env.APP_URL}/payment/3ds/callback`,
      });

      // 2. 인증 URL 반환
      return {
        requiresAuthentication: true,
        authenticationUrl: authResponse.authenticationUrl,
        sessionId: authResponse.sessionId,
      };
    } catch (error) {
      // 3D Secure가 지원되지 않는 경우
      return {
        requiresAuthentication: false,
        sessionId: null,
      };
    }
  }

  async complete3DSecure(sessionId: string, authResult: any): Promise<PaymentResult> {
    try {
      // 1. 3D Secure 인증 결과 확인
      if (authResult.status !== 'success') {
        throw new Error('3D Secure 인증에 실패했습니다.');
      }

      // 2. 실제 결제 처리
      const paymentResult = await this.completePayment(sessionId);

      return paymentResult;
    } catch (error) {
      await this.handle3DSecureError(sessionId, error);
      throw error;
    }
  }
}
```

## 💾 잔액 관리 시스템

### 사용자 잔액 관리

```typescript
class BalanceService {
  async getUserBalance(userId: string): Promise<UserBalance> {
    const user = await this.userService.findById(userId);

    return {
      userId,
      currentBalance: user.balance,
      availableBalance: user.balance - user.reservedBalance,
      reservedBalance: user.reservedBalance,
      totalDeposits: user.totalDeposits,
      totalWithdrawals: user.totalWithdrawals,
      lastUpdated: user.balanceUpdatedAt,
    };
  }

  async addBalance(userId: string, amount: number, source: string): Promise<void> {
    const user = await this.userService.findById(userId);

    // 잔액 증가
    user.balance += amount;
    user.totalDeposits += amount;
    user.balanceUpdatedAt = new Date();

    await this.userService.update(user);

    // 거래 내역 기록
    await this.transactionService.create({
      userId,
      type: 'DEPOSIT',
      amount,
      source,
      description: `${source}를 통한 충전`,
      balanceAfter: user.balance,
    });

    // 알림 발송
    await this.notificationService.sendBalanceUpdate(userId, {
      type: 'BALANCE_ADDED',
      amount,
      newBalance: user.balance,
    });
  }

  async deductBalance(userId: string, amount: number, reason: string): Promise<boolean> {
    const user = await this.userService.findById(userId);

    if (user.balance < amount) {
      return false; // 잔액 부족
    }

    // 잔액 차감
    user.balance -= amount;
    user.balanceUpdatedAt = new Date();

    await this.userService.update(user);

    // 거래 내역 기록
    await this.transactionService.create({
      userId,
      type: 'WITHDRAWAL',
      amount: -amount,
      reason,
      description: reason,
      balanceAfter: user.balance,
    });

    return true;
  }

  async reserveBalance(userId: string, amount: number): Promise<boolean> {
    const user = await this.userService.findById(userId);

    if (user.balance - user.reservedBalance < amount) {
      return false; // 사용 가능한 잔액 부족
    }

    // 잔액 예약
    user.reservedBalance += amount;
    await this.userService.update(user);

    return true;
  }

  async releaseReservedBalance(userId: string, amount: number): Promise<void> {
    const user = await this.userService.findById(userId);

    user.reservedBalance = Math.max(0, user.reservedBalance - amount);
    await this.userService.update(user);
  }
}
```

### 거래 내역 관리

```typescript
class TransactionService {
  async createTransaction(transaction: CreateTransactionDto): Promise<Transaction> {
    const newTransaction = await this.transactionRepository.create({
      ...transaction,
      id: this.generateTransactionId(),
      timestamp: new Date(),
      status: 'COMPLETED',
    });

    // 캐시 무효화
    await this.cacheService.invalidate(`user_transactions_${transaction.userId}`);

    return newTransaction;
  }

  async getUserTransactions(
    userId: string,
    filters: TransactionFilters
  ): Promise<PaginatedTransactions> {
    const cacheKey = `user_transactions_${userId}_${JSON.stringify(filters)}`;

    // 캐시에서 조회
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 데이터베이스에서 조회
    const transactions = await this.transactionRepository.findByUserId(userId, filters);

    // 캐시에 저장
    await this.cacheService.set(cacheKey, transactions, 300); // 5분

    return transactions;
  }

  async getTransactionSummary(userId: string, timeRange: TimeRange): Promise<TransactionSummary> {
    const transactions = await this.transactionRepository.findByUserIdAndTimeRange(
      userId,
      timeRange
    );

    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'DEPOSIT') {
          acc.totalDeposits += transaction.amount;
        } else if (transaction.type === 'WITHDRAWAL') {
          acc.totalWithdrawals += Math.abs(transaction.amount);
        }

        acc.transactionCount++;
        return acc;
      },
      {
        totalDeposits: 0,
        totalWithdrawals: 0,
        transactionCount: 0,
      }
    );

    return {
      ...summary,
      netAmount: summary.totalDeposits - summary.totalWithdrawals,
    };
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    return `TXN_${timestamp}_${random}`.toUpperCase();
  }
}
```

## 📊 결제 모니터링 및 알림

### 결제 성공률 모니터링

```typescript
class PaymentMonitoringService {
  async monitorPaymentSuccessRate(): Promise<void> {
    const timeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24시간 전
      end: new Date(),
    };

    const payments = await this.paymentRepository.findByTimeRange(timeRange);

    const totalPayments = payments.length;
    const successfulPayments = payments.filter((p) => p.status === 'SUCCESS').length;
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    // 성공률이 95% 미만인 경우 알림
    if (successRate < 95) {
      await this.sendPaymentAlert({
        type: 'LOW_SUCCESS_RATE',
        severity: 'HIGH',
        message: `결제 성공률이 낮습니다: ${successRate.toFixed(2)}%`,
        data: {
          successRate,
          totalPayments,
          successfulPayments,
          timeRange,
        },
      });
    }

    // 시간대별 성공률 분석
    const hourlyStats = this.analyzeHourlySuccessRate(payments);
    await this.updatePaymentMetrics(hourlyStats);
  }

  private analyzeHourlySuccessRate(payments: Payment[]): HourlyPaymentStats[] {
    const hourlyStats = new Map<number, { total: number; success: number }>();

    for (const payment of payments) {
      const hour = new Date(payment.createdAt).getHours();

      if (!hourlyStats.has(hour)) {
        hourlyStats.set(hour, { total: 0, success: 0 });
      }

      const stats = hourlyStats.get(hour)!;
      stats.total++;

      if (payment.status === 'SUCCESS') {
        stats.success++;
      }
    }

    return Array.from(hourlyStats.entries()).map(([hour, stats]) => ({
      hour,
      totalPayments: stats.total,
      successfulPayments: stats.success,
      successRate: (stats.success / stats.total) * 100,
    }));
  }
}
```

### 오류 추적 및 알림

```typescript
class PaymentErrorTrackingService {
  async trackPaymentError(error: PaymentError): Promise<void> {
    // 오류 로그 기록
    await this.errorLogRepository.create({
      timestamp: new Date(),
      errorType: error.type,
      errorMessage: error.message,
      userId: error.userId,
      paymentData: error.paymentData,
      stackTrace: error.stackTrace,
    });

    // 오류 패턴 분석
    const errorPattern = await this.analyzeErrorPattern(error);

    // 심각한 오류인 경우 즉시 알림
    if (errorPattern.severity === 'CRITICAL') {
      await this.sendImmediateAlert(errorPattern);
    }

    // 오류 통계 업데이트
    await this.updateErrorStatistics(errorPattern);
  }

  private async analyzeErrorPattern(error: PaymentError): Promise<ErrorPattern> {
    const recentErrors = await this.errorLogRepository.findRecentErrors(
      error.type,
      24 // 24시간
    );

    const errorCount = recentErrors.length;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    if (errorCount > 100) {
      severity = 'CRITICAL';
    } else if (errorCount > 50) {
      severity = 'HIGH';
    } else if (errorCount > 20) {
      severity = 'MEDIUM';
    }

    return {
      type: error.type,
      severity,
      errorCount,
      timeRange: 24,
      affectedUsers: new Set(recentErrors.map((e) => e.userId)).size,
      lastOccurrence: new Date(),
    };
  }

  private async sendImmediateAlert(pattern: ErrorPattern): Promise<void> {
    await this.notificationService.sendAlert({
      type: 'PAYMENT_ERROR_CRITICAL',
      severity: pattern.severity,
      message: `결제 시스템에 심각한 오류가 발생했습니다: ${pattern.type}`,
      data: pattern,
      requiresImmediate: true,
    });
  }
}
```

## 📚 관련 문서

- [베팅 시스템 설계](./BETTING_SYSTEM.md) - 베팅 시스템 설계 가이드
- [도박 규제 준수](./GAMBLING_COMPLIANCE.md) - 도박 규제 준수 가이드
- [보안 시스템](./SECURITY_SYSTEM.md) - 보안 및 인증 시스템
- [모니터링 시스템](./MONITORING.md) - 시스템 모니터링 가이드

---

> 💳 **안전하고 신뢰할 수 있는 결제 시스템으로 사용자의 베팅 자금을 안전하게 관리합니다.**
