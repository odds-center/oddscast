# 🎯 베팅 기록 및 예측권 시스템

**Golden Race의 이중 시스템**: 베팅 기록 관리 + AI 예측권 사용

---

## 📋 개요

Golden Race는 두 가지 시스템을 제공합니다:

### 1. 베팅 기록 관리 (무료)

- 📝 외부에서 구매한 마권 기록
- 📊 자동 결과 확인
- 📈 개인 통계 분석

### 2. AI 예측권 시스템 (유료 구독)

- 🎫 월 30장 AI 예측권 (19,800원/월)
- 🤖 AI 예측 정보 제공
- 🎯 예측 정확도 추적

> **중요**: 본 앱에서는 실제 베팅이 불가능합니다. 마권은 한국마사회 공식 채널에서만 구매 가능합니다.

---

## 🏗️ 시스템 구조

```
Golden Race 시스템
│
├── 📝 베팅 기록 시스템 (무료)
│   ├── 외부 마권 기록 입력
│   ├── 자동 결과 확인
│   ├── 승패 판정
│   └── 통계 제공
│
└── 🎫 AI 예측권 시스템 (구독)
    ├── 구독 관리 (19,800원/월)
    ├── 예측권 30장 발급
    ├── AI 예측 정보 제공
    └── 정확도 추적
```

---

## 📝 베팅 기록 시스템

### 개념

**외부에서 구매한 마권을 기록하고 관리하는 도구**

```
사용자 → 한국마사회 앱/웹에서 마권 구매
  ↓
Golden Race 앱에 구매 정보 입력 (기록용)
  ↓
경주 종료 시 자동으로 결과 확인
  ↓
승패 판정 및 통계 업데이트
```

### 7가지 승식 지원

| 승식     | 설명                      | 예시                        |
| -------- | ------------------------- | --------------------------- |
| 단승식   | 1마리가 1등               | "3번이 1등"                 |
| 복승식   | 1마리가 1~3등             | "3번이 3등 안에"            |
| 연승식   | 2마리가 1~2등 (순서 무관) | "3,5번이 1~2등"             |
| 복연승식 | 2마리가 1~3등 (순서 무관) | "3,5번이 3등 안에"          |
| 쌍승식   | 2마리가 1~2등 (순서 O)    | "3번 1등, 5번 2등"          |
| 삼복승식 | 3마리가 1~3등 (순서 무관) | "3,5,1번이 3등 안에"        |
| 삼쌍승식 | 3마리가 1~3등 (순서 O)    | "3번 1등, 5번 2등, 1번 3등" |

### 데이터 모델

```typescript
interface BettingRecord {
  id: string;
  userId: string;
  raceId: string;

  // 마권 정보
  betType: BetType; // 승식
  selectedHorses: string[]; // 선택한 말
  purchaseAmount: number; // 구매 금액 (기록용)
  purchaseLocation: string; // 구매처 (예: "한국마사회 앱")

  // 결과 (경주 종료 후)
  status: 'PENDING' | 'WON' | 'LOST';
  actualResult: string[]; // 실제 결과
  winAmount?: number; // 당첨금 (기록용)

  // 타임스탬프
  purchaseDate: Date;
  raceDate: Date;
  resultDate?: Date;
}
```

### 구현 예시

```typescript
@Injectable()
export class BettingRecordService {
  /**
   * 베팅 기록 추가 (외부 구매 마권 기록)
   */
  async createRecord(userId: string, data: CreateBettingRecordDto) {
    const record = this.recordRepo.create({
      id: uuid(),
      userId,
      raceId: data.raceId,
      betType: data.betType,
      selectedHorses: data.selectedHorses,
      purchaseAmount: data.purchaseAmount, // 기록용
      purchaseLocation: data.purchaseLocation || '한국마사회',
      status: 'PENDING',
      purchaseDate: new Date(),
      raceDate: data.raceDate,
    });

    await this.recordRepo.save(record);
    return record;
  }

  /**
   * 경주 종료 시 자동 결과 확인
   */
  async checkResults(raceId: string) {
    const records = await this.recordRepo.find({
      where: { raceId, status: 'PENDING' },
    });

    const raceResult = await this.raceService.getResult(raceId);

    for (const record of records) {
      const isWon = this.checkIfWon(record.betType, record.selectedHorses, raceResult.rankings);

      record.status = isWon ? 'WON' : 'LOST';
      record.actualResult = raceResult.rankings;
      record.resultDate = new Date();

      await this.recordRepo.save(record);

      // 통계 업데이트
      await this.updateUserStats(record.userId, isWon);
    }
  }

  /**
   * 승패 판정
   */
  private checkIfWon(betType: BetType, selected: string[], actual: string[]): boolean {
    switch (betType) {
      case 'WIN': // 단승식
        return selected[0] === actual[0];

      case 'PLACE': // 복승식
        return actual.slice(0, 3).includes(selected[0]);

      case 'QUINELLA': // 연승식
        return selected.every((h) => actual.slice(0, 2).includes(h));

      // ... 나머지 승식 로직
    }
  }
}
```

---

## 🎫 AI 예측권 시스템

### 개념

**AI 예측 정보를 보기 위한 정보 열람권**

```
프리미엄 구독 (19,800원/월)
  ↓
매월 30장 예측권 발급
  ↓
경주 선택 → "AI 예측 보기"
  ↓
예측권 1장 사용 (29장 남음)
  ↓
AI 예측 정보 표시
  - 1위 예측: 3번 (28%)
  - 상위 3위: 3,5,1번
  - 신뢰도: 85%
  - 예측 근거: "최근 5경주 평균 2.3등..."
  ↓
사용자가 이 정보를 참고
  ↓
한국마사회 앱/웹에서 직접 마권 구매
  ↓
경주 종료 후 AI 예측 정확도 확인
```

### 예측권 사용 흐름

```typescript
// 1. 사용자가 경주 선택
const race = await raceApi.getRace(raceId);

// 2. AI 예측권 사용
const prediction = await predictionApi.usePredictionTicket(raceId);

// 응답:
{
  ticketId: "ticket-123",
  aiPrediction: {
    winner: "3",              // 1위 예측
    top3: ["3", "5", "1"],    // 상위 3위 예측
    confidence: 85,           // 신뢰도 85%
    reasoning: "최근 5경주 평균 2.3등, 이 경마장 승률 34%, 기수 승률 28%"
  },
  remainingTickets: 29        // 남은 예측권
}

// 3. 앱에서 AI 예측 정보 표시
// 4. 사용자가 한국마사회 앱으로 이동하여 직접 마권 구매
// 5. 경주 종료 후 정확도 기록
```

---

## 🎮 사용자 여정

### 무료 사용자

```
✅ 경주 정보 조회
✅ 과거 결과 확인
✅ 샘플 AI 예측 (일부)
✅ 베팅 기록 관리 (무제한)
❌ 전체 AI 예측 보기
❌ 상세 분석 보기
```

### 프리미엄 구독자

```
✅ 모든 무료 기능
✅ 월 30장 AI 예측권
✅ 전체 AI 예측 정보
✅ 예측 근거 및 분석
✅ 신뢰도 점수
✅ 과거 정확도 통계
✅ 맞춤 알림
```

---

## 📊 통계 시스템

### 베팅 기록 통계

```typescript
interface UserBettingStats {
  totalRecords: number; // 총 기록 수
  totalSpent: number; // 총 구매 금액 (기록)
  totalWon: number; // 총 당첨금 (기록)
  winRate: number; // 승률 (%)
  roi: number; // 수익률 (%)
  favoriteTrack: string; // 선호 경마장
  favoriteBetType: string; // 선호 승식
}
```

### AI 예측 통계

```typescript
interface AIPredictionStats {
  totalPredictions: number; // 총 예측 수
  correctPredictions: number; // 맞춘 횟수
  accuracy: number; // 정확도 (%)
  averageConfidence: number; // 평균 신뢰도
  ticketsUsed: number; // 사용한 예측권
  ticketsRemaining: number; // 남은 예측권
}
```

---

## 🔗 관련 문서

### 구독 및 결제

- [AI 구독 모델](AI_SUBSCRIPTION_MODEL.md) - 구독 서비스 상세
- [구독 결제](PAYMENT_INTEGRATION.md) - 결제 시스템

### 개념 및 정책

- [베팅 vs 예측](BETTING_VS_PREDICTION.md) - 개념 명확화
- [법적 고지](../../../LEGAL_NOTICE.md) - 중요 법적 정보

### 기술 문서

- [AI 기능](../ai/AI_FEATURES.md) - AI 예측 시스템
- [AI 로드맵](../ai/AI_PREDICTION_ROADMAP.md) - AI 개발 계획

---

**마지막 업데이트**: 2025년 10월 10일
