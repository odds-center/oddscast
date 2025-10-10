# Golden Race - 베팅 시스템 설계

## 🎯 개요

Golden Race의 핵심 기능인 베팅 시스템의 설계 및 구현 가이드를 제공합니다. 공정하고 투명한 베팅 시스
템을 통해 사용자에게 안전하고 즐거운 경마 베팅 경험을 제공하는 것이 목표입니다.

## 🏗️ 베팅 시스템 아키텍처

### 전체 구조

```
베팅 시스템 계층
├── 🎲 베팅 엔진
│   ├── 베팅 규칙 검증
│   ├── 배당률 계산
│   ├── 베팅 수락/거부
│   └── 결과 처리
├── 💰 결제 시스템
│   ├── 베팅 금액 검증
│   ├── 잔액 관리
│   ├── 수수료 계산
│   └── 정산 처리
├── 📊 베팅 관리
│   ├── 베팅 내역
│   ├── 통계 분석
│   ├── 리스크 관리
│   └── 규정 준수
└── 🔐 보안 시스템
    ├── 사용자 인증
    ├── 베팅 제한
    ├── 사기 방지
    └── 감사 로그
```

### 기술 스택

- **백엔드**: NestJS + TypeORM + MySQL
- **베팅 엔진**: 커스텀 베팅 규칙 엔진
- **결제**: 결제 게이트웨이 연동
- **보안**: JWT + RBAC + 암호화
- **모니터링**: 로깅 + 메트릭 + 알림

## 🎲 베팅 유형 및 규칙

### 단승식 (Win)

가장 기본적인 베팅 유형으로, 선택한 말이 1등을 할 것으로 예상하는 베팅입니다.

```typescript
interface WinBet {
  type: 'WIN';
  horseId: string;
  amount: number;
  odds: number;
  potentialWin: number;
}

// 배당률 계산
const calculateWinBet = (bet: WinBet, finalOdds: number): BetResult => {
  if (bet.horseId === winningHorseId) {
    return {
      status: 'WON',
      payout: bet.amount * finalOdds,
      profit: bet.amount * finalOdds - bet.amount,
    };
  }

  return {
    status: 'LOST',
    payout: 0,
    profit: -bet.amount,
  };
};
```

### 연승식 (Place)

선택한 말이 1등, 2등, 3등 중 하나를 할 것으로 예상하는 베팅입니다.

```typescript
interface PlaceBet {
  type: 'PLACE';
  horseId: string;
  amount: number;
  odds: number;
  potentialWin: number;
}

// 배당률 계산 (일반적으로 단승식의 1/3~1/2)
const calculatePlaceBet = (bet: PlaceBet, finalOdds: number): BetResult => {
  const placeOdds = finalOdds * 0.4; // 40% 배당률

  if (isInTopThree(bet.horseId)) {
    return {
      status: 'WON',
      payout: bet.amount * placeOdds,
      profit: bet.amount * placeOdds - bet.amount,
    };
  }

  return {
    status: 'LOST',
    payout: 0,
    profit: -bet.amount,
  };
};
```

### 복합 베팅 (Exacta, Trifecta)

여러 말의 순서를 예측하는 복잡한 베팅 유형입니다.

```typescript
interface ExactaBet {
  type: 'EXACTA';
  firstHorseId: string;
  secondHorseId: string;
  amount: number;
  odds: number;
}

interface TrifectaBet {
  type: 'TRIFECTA';
  firstHorseId: string;
  secondHorseId: string;
  thirdHorseId: string;
  amount: number;
  odds: number;
}

// 복합 베팅 결과 계산
const calculateExactaBet = (bet: ExactaBet, result: RaceResult): BetResult => {
  const isCorrect = result.first === bet.firstHorseId && result.second === bet.secondHorseId;

  if (isCorrect) {
    return {
      status: 'WON',
      payout: bet.amount * bet.odds,
      profit: bet.amount * bet.odds - bet.amount,
    };
  }

  return {
    status: 'LOST',
    payout: 0,
    profit: -bet.amount,
  };
};
```

## 💰 베팅 금액 및 수수료

### 베팅 금액 제한

```typescript
interface BettingLimits {
  minBet: number; // 최소 베팅 금액
  maxBet: number; // 최대 베팅 금액
  maxDailyBet: number; // 일일 최대 베팅 금액
  maxBetPerRace: number; // 경주당 최대 베팅 금액
}

const DEFAULT_BETTING_LIMITS: BettingLimits = {
  minBet: 1000, // 1,000원
  maxBet: 1000000, // 1,000,000원
  maxDailyBet: 5000000, // 5,000,000원
  maxBetPerRace: 2000000, // 2,000,000원
};
```

### 수수료 시스템

```typescript
interface BettingFees {
  baseFee: number; // 기본 수수료 (베팅 금액의 %)
  premiumFee: number; // 프리미엄 수수료 (고액 베팅)
  taxRate: number; // 세금 (당첨금의 %)
}

const DEFAULT_BETTING_FEES: BettingFees = {
  baseFee: 0.05, // 5%
  premiumFee: 0.08, // 8% (100만원 이상)
  taxRate: 0.22, // 22% (당첨금에 대한 세금)
};

// 수수료 계산
const calculateBettingFees = (betAmount: number): number => {
  let fee = betAmount * DEFAULT_BETTING_FEES.baseFee;

  if (betAmount >= 1000000) {
    fee = betAmount * DEFAULT_BETTING_FEES.premiumFee;
  }

  return Math.floor(fee);
};

// 세금 계산
const calculateTax = (payout: number): number => {
  return Math.floor(payout * DEFAULT_BETTING_FEES.taxRate);
};
```

## 🔐 베팅 보안 및 검증

### 베팅 규칙 검증

```typescript
interface BettingValidation {
  validateBetAmount: (amount: number, limits: BettingLimits) => ValidationResult;
  validateUserBalance: (userId: string, amount: number) => Promise<ValidationResult>;
  validateBettingTime: (raceId: string) => ValidationResult;
  validateUserEligibility: (userId: string) => ValidationResult;
}

class BettingValidator implements BettingValidation {
  async validateBetAmount(amount: number, limits: BettingLimits): Promise<ValidationResult> {
    if (amount < limits.minBet) {
      return {
        isValid: false,
        error: `최소 베팅 금액은 ${limits.minBet.toLocaleString()}원입니다.`,
        code: 'BET_AMOUNT_TOO_SMALL',
      };
    }

    if (amount > limits.maxBet) {
      return {
        isValid: false,
        error: `최대 베팅 금액은 ${limits.maxBet.toLocaleString()}원입니다.`,
        code: 'BET_AMOUNT_TOO_LARGE',
      };
    }

    return { isValid: true };
  }

  async validateUserBalance(userId: string, amount: number): Promise<ValidationResult> {
    const user = await this.userService.findById(userId);
    const currentBalance = user.balance;

    if (currentBalance < amount) {
      return {
        isValid: false,
        error: '잔액이 부족합니다.',
        code: 'INSUFFICIENT_BALANCE',
      };
    }

    return { isValid: true };
  }

  validateBettingTime(raceId: string): ValidationResult {
    const race = this.raceService.findById(raceId);
    const now = new Date();
    const raceStartTime = new Date(race.startTime);
    const bettingDeadline = new Date(raceStartTime.getTime() - 5 * 60 * 1000); // 5분 전

    if (now > bettingDeadline) {
      return {
        isValid: false,
        error: '베팅 마감 시간이 지났습니다.',
        code: 'BETTING_CLOSED',
      };
    }

    return { isValid: true };
  }

  async validateUserEligibility(userId: string): Promise<ValidationResult> {
    const user = await this.userService.findById(userId);

    if (user.status !== 'ACTIVE') {
      return {
        isValid: false,
        error: '계정이 비활성화되었습니다.',
        code: 'ACCOUNT_INACTIVE',
      };
    }

    if (user.isSuspended) {
      return {
        isValid: false,
        error: '베팅이 일시 정지되었습니다.',
        code: 'BETTING_SUSPENDED',
      };
    }

    return { isValid: true };
  }
}
```

### 사기 방지 시스템

```typescript
interface FraudDetection {
  detectUnusualPatterns: (userId: string, bet: Bet) => Promise<FraudAlert[]>;
  detectMultipleAccounts: (userId: string) => Promise<FraudAlert[]>;
  detectBettingBots: (userId: string, bettingHistory: Bet[]) => Promise<FraudAlert[]>;
}

class FraudDetector implements FraudDetection {
  async detectUnusualPatterns(userId: string, bet: Bet): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    // 갑작스러운 베팅 금액 증가 감지
    const recentBets = await this.betService.findRecentBets(userId, 24);
    const avgAmount = recentBets.reduce((sum, b) => sum + b.amount, 0) / recentBets.length;

    if (bet.amount > avgAmount * 10) {
      alerts.push({
        type: 'UNUSUAL_BET_AMOUNT',
        severity: 'HIGH',
        message: '갑작스러운 베팅 금액 증가가 감지되었습니다.',
        userId,
        betId: bet.id,
      });
    }

    // 비정상적인 베팅 시간 패턴 감지
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      alerts.push({
        type: 'UNUSUAL_BETTING_TIME',
        severity: 'MEDIUM',
        message: '비정상적인 시간에 베팅이 발생했습니다.',
        userId,
        betId: bet.id,
      });
    }

    return alerts;
  }

  async detectMultipleAccounts(userId: string): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    // IP 주소 기반 다중 계정 감지
    const userSessions = await this.sessionService.findByUserId(userId);
    const uniqueIPs = new Set(userSessions.map((s) => s.ipAddress));

    if (uniqueIPs.size > 3) {
      alerts.push({
        type: 'MULTIPLE_ACCOUNTS_SUSPECTED',
        severity: 'HIGH',
        message: '다중 계정 사용이 의심됩니다.',
        userId,
      });
    }

    return alerts;
  }

  async detectBettingBots(userId: string, bettingHistory: Bet[]): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    // 봇 패턴 감지 (너무 빠른 연속 베팅)
    const recentBets = bettingHistory.slice(-10);
    const timeIntervals = [];

    for (let i = 1; i < recentBets.length; i++) {
      const interval = recentBets[i].createdAt.getTime() - recentBets[i - 1].createdAt.getTime();
      timeIntervals.push(interval);
    }

    const avgInterval =
      timeIntervals.reduce((sum, interval) => sum + interval, 0) / timeIntervals.length;

    if (avgInterval < 5000) {
      // 5초 미만
      alerts.push({
        type: 'BOT_ACTIVITY_SUSPECTED',
        severity: 'HIGH',
        message: '봇 활동이 의심됩니다.',
        userId,
      });
    }

    return alerts;
  }
}
```

## 📊 베팅 결과 처리

### 결과 계산 엔진

```typescript
interface ResultProcessor {
  processRaceResult: (raceId: string, result: RaceResult) => Promise<void>;
  calculatePayouts: (bets: Bet[], result: RaceResult) => Promise<PayoutResult[]>;
  updateUserBalances: (payouts: PayoutResult[]) => Promise<void>;
}

class BettingResultProcessor implements ResultProcessor {
  async processRaceResult(raceId: string, result: RaceResult): Promise<void> {
    // 1. 베팅 상태 업데이트
    const bets = await this.betService.findByRaceId(raceId);

    for (const bet of bets) {
      const betResult = this.calculateBetResult(bet, result);
      await this.betService.updateBetResult(bet.id, betResult);
    }

    // 2. 배당금 계산 및 지급
    const payouts = await this.calculatePayouts(bets, result);
    await this.updateUserBalances(payouts);

    // 3. 통계 업데이트
    await this.updateBettingStats(raceId, result, bets);

    // 4. 알림 발송
    await this.sendResultNotifications(payouts);
  }

  private calculateBetResult(bet: Bet, result: RaceResult): BetResult {
    switch (bet.type) {
      case 'WIN':
        return this.calculateWinBet(bet, result);
      case 'PLACE':
        return this.calculatePlaceBet(bet, result);
      case 'EXACTA':
        return this.calculateExactaBet(bet, result);
      case 'TRIFECTA':
        return this.calculateTrifectaBet(bet, result);
      default:
        throw new Error(`Unknown bet type: ${bet.type}`);
    }
  }

  async calculatePayouts(bets: Bet[], result: RaceResult): Promise<PayoutResult[]> {
    const payouts: PayoutResult[] = [];

    for (const bet of bets) {
      const betResult = this.calculateBetResult(bet, result);

      if (betResult.status === 'WON') {
        const payout = this.calculatePayout(bet, betResult);
        payouts.push({
          userId: bet.userId,
          betId: bet.id,
          amount: payout.amount,
          tax: payout.tax,
          netAmount: payout.netAmount,
        });
      }
    }

    return payouts;
  }

  private calculatePayout(bet: Bet, betResult: BetResult): PayoutCalculation {
    const grossAmount = betResult.payout;
    const tax = calculateTax(grossAmount);
    const netAmount = grossAmount - tax;

    return {
      amount: grossAmount,
      tax,
      netAmount,
    };
  }

  async updateUserBalances(payouts: PayoutResult[]): Promise<void> {
    for (const payout of payouts) {
      await this.userService.addBalance(payout.userId, payout.netAmount);

      // 거래 내역 기록
      await this.transactionService.create({
        userId: payout.userId,
        type: 'BETTING_WIN',
        amount: payout.netAmount,
        description: `베팅 당첨금: ${payout.amount.toLocaleString()}원`,
        referenceId: payout.betId,
      });
    }
  }
}
```

## 🎯 베팅 통계 및 분석

### 사용자 베팅 패턴 분석

```typescript
interface BettingAnalytics {
  getUserBettingStats: (userId: string) => Promise<UserBettingStats>;
  getPopularHorses: (timeRange: TimeRange) => Promise<HorseBettingStats[]>;
  getBettingTrends: (timeRange: TimeRange) => Promise<BettingTrend[]>;
  getRiskAnalysis: (userId: string) => Promise<RiskAnalysis>;
}

class BettingAnalyticsService implements BettingAnalytics {
  async getUserBettingStats(userId: string): Promise<UserBettingStats> {
    const bets = await this.betService.findByUserId(userId);

    const totalBets = bets.length;
    const totalAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const wonBets = bets.filter((bet) => bet.result?.status === 'WON');
    const totalWinnings = wonBets.reduce((sum, bet) => sum + (bet.result?.payout || 0), 0);

    const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0;
    const roi = totalAmount > 0 ? ((totalWinnings - totalAmount) / totalAmount) * 100 : 0;

    return {
      totalBets,
      totalAmount,
      winRate,
      totalWinnings,
      roi,
      averageBetAmount: totalBets > 0 ? totalAmount / totalBets : 0,
      favoriteBetType: this.getFavoriteBetType(bets),
      favoriteHorses: this.getFavoriteHorses(bets),
    };
  }

  async getPopularHorses(timeRange: TimeRange): Promise<HorseBettingStats[]> {
    const bets = await this.betService.findByTimeRange(timeRange);

    const horseStats = new Map<string, HorseBettingStats>();

    for (const bet of bets) {
      const horseId = this.getHorseIdFromBet(bet);
      if (!horseStats.has(horseId)) {
        horseStats.set(horseId, {
          horseId,
          totalBets: 0,
          totalAmount: 0,
          winRate: 0,
        });
      }

      const stats = horseStats.get(horseId)!;
      stats.totalBets++;
      stats.totalAmount += bet.amount;
    }

    // 승률 계산
    for (const [horseId, stats] of horseStats) {
      const horseBets = bets.filter((bet) => this.getHorseIdFromBet(bet) === horseId);
      const wonBets = horseBets.filter((bet) => bet.result?.status === 'WON');
      stats.winRate = horseBets.length > 0 ? (wonBets.length / horseBets.length) * 100 : 0;
    }

    return Array.from(horseStats.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getRiskAnalysis(userId: string): Promise<RiskAnalysis> {
    const userStats = await this.getUserBettingStats(userId);
    const recentBets = await this.betService.findRecentBets(userId, 30); // 최근 30일

    // 베팅 중독 위험도 평가
    const dailyBettingAmounts = this.groupBetsByDate(recentBets);
    const averageDailyAmount =
      dailyBettingAmounts.reduce((sum, amount) => sum + amount, 0) / dailyBettingAmounts.length;

    let riskLevel: RiskLevel = 'LOW';
    let riskFactors: string[] = [];

    if (userStats.roi < -20) {
      riskLevel = 'HIGH';
      riskFactors.push('높은 손실률');
    }

    if (averageDailyAmount > 100000) {
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
      riskFactors.push('높은 일일 베팅 금액');
    }

    if (userStats.totalBets > 100) {
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
      riskFactors.push('과도한 베팅 빈도');
    }

    return {
      riskLevel,
      riskFactors,
      recommendations: this.getRiskRecommendations(riskLevel, riskFactors),
    };
  }
}
```

## 🔄 베팅 시스템 모니터링

### 실시간 모니터링

```typescript
interface BettingMonitoring {
  monitorBettingVolume: () => void;
  monitorUserBehavior: () => void;
  monitorSystemHealth: () => void;
  generateAlerts: (alert: BettingAlert) => void;
}

class BettingMonitor implements BettingMonitoring {
  private monitoringInterval: NodeJS.Timeout;

  startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.monitorBettingVolume();
      this.monitorUserBehavior();
      this.monitorSystemHealth();
    }, 60000); // 1분마다
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  private async monitorBettingVolume(): Promise<void> {
    const currentHour = new Date().getHours();
    const currentBets = await this.betService.findByTimeRange({
      start: new Date(Date.now() - 60 * 60 * 1000), // 1시간 전
      end: new Date(),
    });

    const totalVolume = currentBets.reduce((sum, bet) => sum + bet.amount, 0);

    // 비정상적인 베팅 볼륨 감지
    if (totalVolume > this.getExpectedVolume(currentHour) * 2) {
      this.generateAlerts({
        type: 'UNUSUAL_BETTING_VOLUME',
        severity: 'HIGH',
        message: `비정상적인 베팅 볼륨이 감지되었습니다: ${totalVolume.toLocaleString()}원`,
        data: { volume: totalVolume, expectedVolume: this.getExpectedVolume(currentHour) },
      });
    }
  }

  private async monitorUserBehavior(): Promise<void> {
    const suspiciousUsers = await this.fraudDetector.detectSuspiciousUsers();

    for (const user of suspiciousUsers) {
      this.generateAlerts({
        type: 'SUSPICIOUS_USER_BEHAVIOR',
        severity: 'MEDIUM',
        message: `의심스러운 사용자 행동이 감지되었습니다: ${user.id}`,
        data: { userId: user.id, behavior: user.suspiciousBehavior },
      });
    }
  }

  private async monitorSystemHealth(): Promise<void> {
    const systemMetrics = await this.getSystemMetrics();

    if (systemMetrics.responseTime > 2000) {
      // 2초 이상
      this.generateAlerts({
        type: 'SYSTEM_PERFORMANCE_DEGRADED',
        severity: 'MEDIUM',
        message: '시스템 성능이 저하되었습니다.',
        data: { responseTime: systemMetrics.responseTime },
      });
    }

    if (systemMetrics.errorRate > 0.05) {
      // 5% 이상
      this.generateAlerts({
        type: 'HIGH_ERROR_RATE',
        severity: 'HIGH',
        message: '높은 오류율이 감지되었습니다.',
        data: { errorRate: systemMetrics.errorRate },
      });
    }
  }

  generateAlerts(alert: BettingAlert): void {
    // 로그 기록
    this.logger.log('Betting Alert', alert);

    // 알림 발송
    this.notificationService.sendAlert(alert);

    // 대시보드 업데이트
    this.dashboardService.updateAlert(alert);
  }
}
```

## 📚 관련 문서

- [결제 시스템 연동](./PAYMENT_INTEGRATION.md) - 결제 시스템 연동 가이드
- [도박 규제 준수](./GAMBLING_COMPLIANCE.md) - 도박 규제 준수 가이드
- [보안 시스템](./SECURITY_SYSTEM.md) - 보안 및 인증 시스템
- [모니터링 시스템](./MONITORING.md) - 시스템 모니터링 가이드

---

> 🎯 **공정하고 투명한 베팅 시스템으로 사용자에게 안전하고 즐거운 경마 베팅 경험을 제공합니다.**
