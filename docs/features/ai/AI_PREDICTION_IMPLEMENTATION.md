# 🤖 AI 예측 시스템 구현 가이드

## 📋 개요

Golden Race는 **LLM 기반 경마 예측 정보 제공 서비스**입니다.  
별도의 ML 모델 학습 없이 GPT-4, Claude 등의 LLM API를 활용하여 빠르고 정확한 예측을 제공합니다.

---

## 🎯 왜 LLM 기반인가?

### 기존 ML 방식의 한계

❌ **데이터 부족**: 충분한 학습 데이터 확보 어려움 (수년 간의 데이터 필요)  
❌ **높은 초기 비용**: ML 인프라 구축, 모델 학습, 튜닝에 수개월 소요  
❌ **유지보수 복잡**: 지속적인 재학습, 모니터링, 버전 관리 필요  
❌ **도메인 지식 필요**: 경마 전문가 + ML 엔지니어 조합 필요

### LLM 방식의 장점

✅ **즉시 사용 가능**: API 연동만으로 바로 서비스 시작  
✅ **높은 정확도**: GPT-4, Claude는 이미 방대한 데이터로 학습됨  
✅ **설명 가능성**: 예측 근거를 자연어로 명확히 설명  
✅ **빠른 개선**: 프롬프트만 수정하면 즉시 반영  
✅ **비용 효율**: 초기 투자 없이 사용한 만큼만 과금

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                 User (Mobile App)                        │
│  - 경주 선택                                             │
│  - AI 예측 요청 (예측권 1장 사용)                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓ HTTP Request
┌─────────────────────────────────────────────────────────┐
│              NestJS Backend Server                       │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  PredictionsController                             │ │
│  │  POST /api/predictions                             │ │
│  │  - 예측권 검증 (남은 개수 확인)                   │ │
│  │  - 중복 예측 방지 (이미 예측한 경주인지 확인)    │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  PredictionsService                                │ │
│  │  - 캐시 확인 (Redis)                              │ │
│  │  - 경주 데이터 수집                               │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  RaceDataCollector                                 │ │
│  │  - 경주 정보 조회 (races 테이블)                 │ │
│  │  - 출전표 조회 (entry_details 테이블)            │ │
│  │  - 과거 성적 조회 (results 테이블)               │ │
│  │  - 배당률 조회 (dividend_rates 테이블)           │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  PromptBuilder                                     │ │
│  │  - 데이터 정제 및 요약                            │ │
│  │  - 구조화된 프롬프트 생성                         │ │
│  │  - 시스템 프롬프트 + 사용자 프롬프트             │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  LlmService                                        │ │
│  │  - OpenAI GPT-4 API 호출                         │ │
│  │  - Anthropic Claude API 호출 (백업)              │ │
│  │  - 응답 파싱 및 검증                             │ │
│  │  - 비용 추적 (토큰 사용량)                       │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  PredictionStorage                                 │ │
│  │  - 예측 결과 저장 (predictions 테이블)           │ │
│  │  - 예측권 차감 (prediction_tickets 테이블)       │ │
│  │  - 캐시 저장 (Redis, 1시간 TTL)                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓ JSON Response
┌─────────────────────────────────────────────────────────┐
│              Mobile App - AI 예측 화면                  │
│                                                           │
│  🏆 AI 예측 결과                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               │
│                                                           │
│  1위 예상: 7번 천둥번개 (28.5%)                         │
│  2위 예상: 3번 바람의질주 (22.3%)                       │
│  3위 예상: 5번 황금마차 (18.7%)                         │
│                                                           │
│  📊 신뢰도: 85%                                          │
│                                                           │
│  📝 AI 분석                                              │
│  "7번 천둥번개는 최근 3경주 연속 입상하며            │
│   우수한 폼을 보이고 있습니다. 이번 경주 거리인      │
│   1800m는 과거 5전 4승으로 최적의 거리입니다.        │
│   기수 김철수는 이 말과의 궁합이 좋으며...        │
│                                                           │
│  ⚠️ 주의사항                                             │
│  - 주로 상태가 불량하여 기록 단축 가능성             │
│  - 3번 말의 최근 상승세도 주목할 필요                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 프롬프트 엔지니어링

### System Prompt (시스템 역할 정의)

```
당신은 30년 경력의 경마 전문가입니다.
과거 경주 데이터, 출전마 정보, 기수/조교사 성적을 분석하여
정확한 경주 결과를 예측합니다.

## 분석 기준 (우선순위 순)

1. **최근 폼 (40%)**: 최근 5경주 성적 (1-2-3위 비율)
2. **거리 적성 (25%)**: 해당 거리에서의 과거 성적
3. **기수 궁합 (15%)**: 기수의 승률 및 해당 말과의 조합 성적
4. **주로 상태 (10%)**: 주로 컨디션에 따른 적응력
5. **조교사 실력 (5%)**: 조교사의 최근 관리 성적
6. **기타 (5%)**: 나이, 체중, 휴식 기간 등

## 예측 원칙

- 데이터에 기반한 객관적 분석
- 불확실성이 높으면 신뢰도를 낮게 표시
- 예측 근거를 명확히 설명
- 확률은 반올림하여 소수점 1자리까지 표시

## 응답 형식

반드시 다음 JSON 형식으로만 응답하세요:

{
  "firstPlace": "마번",
  "secondPlace": "마번",
  "thirdPlace": "마번",
  "confidence": 85,
  "analysis": "예측 근거 상세 설명 (200-300자)",
  "warnings": ["주의사항1", "주의사항2"]
}
```

### User Prompt (경주별 데이터 제공)

```typescript
function buildUserPrompt(race: RaceData): string {
  return `
# 경주 정보

- **경마장**: ${race.meetName} (${race.meet})
- **경주번호**: ${race.rcNo}경주
- **경주명**: ${race.rcName}
- **거리**: ${race.rcDist}m
- **등급**: ${race.rcGrade}
- **상금**: ${formatMoney(race.rcPrize)}원
- **날씨**: ${race.rcWeather}
- **주로 상태**: ${race.rcTrackCondition}
- **출전두수**: ${race.entries.length}두

---

# 출전마 상세 정보

${race.entries
  .map(
    (entry, idx) => `
## ${idx + 1}. ${entry.hrNo}번 ${entry.hrName}

### 기본 정보
- **나이**: ${entry.hrAge}세
- **성별**: ${entry.hrGender}
- **체중**: ${entry.hrWeight}kg
- **부담중량**: ${entry.jkWeight}kg
- **기수**: ${entry.jkName} (${entry.jkNo})
- **조교사**: ${entry.trName} (${entry.trNo})

### 최근 성적 (최근 5경주)
${formatRecentRaces(entry.recentRaces)}

### 거리별 성적
- **1600m**: ${entry.distance1600 || 'N/A'}
- **1800m**: ${entry.distance1800 || 'N/A'}
- **2000m**: ${entry.distance2000 || 'N/A'}

### 통산 성적
- **출전**: ${entry.totalStarts}회
- **승**: ${entry.totalWins}회 (승률 ${entry.winRate}%)
- **연대**: ${entry.totalPlaces}회 (연대율 ${entry.placeRate}%)
- **상금**: ${formatMoney(entry.totalPrize)}원

### 기수 성적
- **기수 승률**: ${entry.jockeyWinRate}%
- **기수 연대율**: ${entry.jockeyPlaceRate}%
- **이 말과의 조합**: ${entry.jockeyHorseCombo}

### 조교사 성적
- **조교사 승률**: ${entry.trainerWinRate}%
- **최근 10경주**: ${entry.trainerRecentForm}

### 배당률
- **단승식**: ${entry.winOdds}배
- **연승식**: ${entry.placeOdds}배

---
`
  )
  .join('\n')}

# 분석 요청

위 정보를 바탕으로 이 경주의 1-2-3위를 예측하고,
각 예측에 대한 근거를 명확히 설명해주세요.

특히 다음 사항을 고려해주세요:
- 최근 폼이 좋은 말
- 이 거리에서 강한 말
- 주로 상태에 적합한 말
- 기수-말 궁합이 좋은 조합
- 배당률이 저평가된 다크호스
  `;
}
```

---

## 💡 실제 구현 예시

### 1. 프롬프트 빌더 서비스

```typescript
// server/src/llm/services/prompt-builder.service.ts

@Injectable()
export class PromptBuilderService {
  /**
   * 경주 예측용 프롬프트 생성
   */
  async buildPredictionPrompt(raceId: string): Promise<{
    system: string;
    user: string;
  }> {
    // 1. 경주 데이터 수집
    const race = await this.racesService.findOne(raceId);
    const entries = await this.entriesService.findByRace(raceId);
    const weather = await this.weatherService.getByRace(raceId);

    // 2. 각 출전마의 과거 성적 조회
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => ({
        ...entry,
        recentRaces: await this.resultsService.getRecentRaces(entry.hrNo, 5),
        distancePerformance: await this.resultsService.getDistanceStats(entry.hrNo, race.rcDist),
        jockeyStats: await this.jockeysService.getStats(entry.jkNo),
        trainerStats: await this.trainersService.getStats(entry.trNo),
      }))
    );

    // 3. 프롬프트 생성
    return {
      system: this.getSystemPrompt(),
      user: this.buildUserPrompt(race, enrichedEntries, weather),
    };
  }

  /**
   * 시스템 프롬프트 (고정)
   */
  private getSystemPrompt(): string {
    return `당신은 30년 경력의 경마 전문가입니다...`;
  }

  /**
   * 사용자 프롬프트 (경주별로 동적 생성)
   */
  private buildUserPrompt(race: Race, entries: EnrichedEntry[], weather: Weather): string {
    return `
# 경주 정보
...
# 출전마 상세 정보
...
# 분석 요청
...
    `;
  }
}
```

### 2. LLM 서비스

```typescript
// server/src/llm/services/llm.service.ts

@Injectable()
export class LlmService {
  constructor(@InjectQueue('llm') private llmQueue: Queue, private configService: ConfigService) {}

  /**
   * GPT-4를 사용한 예측 생성
   */
  async generatePrediction(raceId: string): Promise<Prediction> {
    // 1. 프롬프트 생성
    const { system, user } = await this.promptBuilder.buildPredictionPrompt(raceId);

    // 2. GPT-4 API 호출
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7, // 적당한 창의성
      max_tokens: 1000,
      response_format: { type: 'json_object' }, // JSON 형식 강제
    });

    // 3. 응답 파싱
    const prediction = this.parseLLMResponse(response.choices[0].message.content);

    // 4. 비용 추적
    await this.trackCost(response.usage);

    return prediction;
  }

  /**
   * Claude를 사용한 예측 (백업)
   */
  async generatePredictionWithClaude(raceId: string): Promise<Prediction> {
    const { system, user } = await this.promptBuilder.buildPredictionPrompt(raceId);

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      system: system,
      messages: [{ role: 'user', content: user }],
    });

    return this.parseLLMResponse(response.content[0].text);
  }

  /**
   * LLM 응답 파싱
   */
  private parseLLMResponse(content: string): Prediction {
    try {
      const parsed = JSON.parse(content);

      // 유효성 검증
      if (
        !parsed.firstPlace ||
        !parsed.secondPlace ||
        !parsed.thirdPlace ||
        !parsed.confidence ||
        !parsed.analysis
      ) {
        throw new Error('Invalid prediction format');
      }

      return {
        firstPlace: parseInt(parsed.firstPlace),
        secondPlace: parseInt(parsed.secondPlace),
        thirdPlace: parseInt(parsed.thirdPlace),
        confidence: parsed.confidence,
        analysis: parsed.analysis,
        warnings: parsed.warnings || [],
        modelVersion: 'gpt-4-turbo',
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to parse LLM response:', error);
      throw new BadRequestException('AI 예측 생성 실패');
    }
  }

  /**
   * 비용 추적
   */
  private async trackCost(usage: any) {
    const cost = this.calculateCost(usage.total_tokens);
    await this.costsRepository.save({
      model: 'gpt-4-turbo',
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost: cost,
      createdAt: new Date(),
    });
  }

  /**
   * 비용 계산 (GPT-4 기준)
   */
  private calculateCost(totalTokens: number): number {
    // GPT-4 Turbo: $0.01 / 1K input tokens, $0.03 / 1K output tokens
    // 평균적으로 $0.02 / 1K tokens로 계산
    const costPer1KTokens = 0.02;
    return (totalTokens / 1000) * costPer1KTokens;
  }
}
```

### 3. 예측 API 컨트롤러

```typescript
// server/src/predictions/predictions.controller.ts

@Controller('api/predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(
    private predictionsService: PredictionsService,
    private ticketsService: PredictionTicketsService
  ) {}

  /**
   * AI 예측 생성
   */
  @Post()
  async createPrediction(
    @CurrentUser() user: User,
    @Body() createPredictionDto: CreatePredictionDto
  ): Promise<PredictionResponse> {
    const { raceId } = createPredictionDto;

    // 1. 예측권 확인
    const hasTicket = await this.ticketsService.hasAvailableTicket(user.id);
    if (!hasTicket) {
      throw new BadRequestException('사용 가능한 예측권이 없습니다');
    }

    // 2. 중복 예측 확인
    const existing = await this.predictionsService.findByUserAndRace(user.id, raceId);
    if (existing) {
      throw new BadRequestException('이미 예측한 경주입니다');
    }

    // 3. 캐시 확인
    const cached = await this.predictionsService.getCachedPrediction(raceId);
    if (cached) {
      // 캐시된 예측 반환 (예측권은 차감)
      await this.ticketsService.useTicket(user.id, raceId, cached.id);
      return cached;
    }

    // 4. AI 예측 생성
    const prediction = await this.predictionsService.generatePrediction(raceId);

    // 5. 예측 저장 및 예측권 차감
    await this.predictionsService.save(prediction);
    await this.ticketsService.useTicket(user.id, raceId, prediction.id);

    // 6. 캐시 저장 (1시간)
    await this.predictionsService.cachePrediction(raceId, prediction, 3600);

    return prediction;
  }

  /**
   * 내 예측 목록
   */
  @Get('/my')
  async getMyPredictions(@CurrentUser() user: User): Promise<Prediction[]> {
    return this.predictionsService.findByUser(user.id);
  }

  /**
   * 예측 정확도 통계
   */
  @Get('/accuracy')
  async getAccuracyStats(): Promise<AccuracyStats> {
    return this.predictionsService.getAccuracyStats();
  }
}
```

---

## 📊 예측 정확도 검증

### 자동 검증 시스템

```typescript
// server/src/predictions/services/accuracy-validator.service.ts

@Injectable()
export class AccuracyValidatorService {
  /**
   * 경주 종료 후 예측 정확도 자동 검증
   */
  @Cron('0 * * * *') // 매시간 실행
  async validatePredictions() {
    // 1. 결과가 나온 경주 조회
    const completedRaces = await this.resultsService.getCompletedRaces(
      new Date(Date.now() - 24 * 60 * 60 * 1000) // 최근 24시간
    );

    for (const race of completedRaces) {
      // 2. 해당 경주의 예측 조회
      const predictions = await this.predictionsService.findByRace(race.id);

      for (const prediction of predictions) {
        // 3. 정확도 계산
        const accuracy = this.calculateAccuracy(prediction, race.results);

        // 4. 예측 업데이트
        await this.predictionsService.update(prediction.id, {
          isAccurate: accuracy.isAccurate,
          accuracyScore: accuracy.score,
          actualFirstPlace: race.results[0].hrNo,
          actualSecondPlace: race.results[1].hrNo,
          actualThirdPlace: race.results[2].hrNo,
        });

        this.logger.log(`Prediction ${prediction.id} validated: ${accuracy.score}%`);
      }
    }
  }

  /**
   * 정확도 계산
   */
  private calculateAccuracy(
    prediction: Prediction,
    results: RaceResult[]
  ): { isAccurate: boolean; score: number } {
    let score = 0;

    // 1위 정확도 (40점)
    if (prediction.firstPlace === results[0].hrNo) {
      score += 40;
    }

    // 2위 정확도 (30점)
    if (prediction.secondPlace === results[1].hrNo) {
      score += 30;
    }

    // 3위 정확도 (20점)
    if (prediction.thirdPlace === results[2].hrNo) {
      score += 20;
    }

    // 순서 무관 3위 내 적중 (10점)
    const predictedTop3 = [prediction.firstPlace, prediction.secondPlace, prediction.thirdPlace];
    const actualTop3 = results.slice(0, 3).map((r) => r.hrNo);
    const matches = predictedTop3.filter((p) => actualTop3.includes(p)).length;
    score += matches * 3.33;

    return {
      isAccurate: score >= 40, // 1위 맞추거나 2-3위 모두 맞춤
      score: Math.round(score),
    };
  }
}
```

---

## 💰 비용 관리

### 예상 비용 (GPT-4 Turbo 기준)

| 항목                   | 토큰 수       | 비용(USD) | 비용(KRW) |
| ---------------------- | ------------- | --------- | --------- |
| System Prompt          | ~500 tokens   | $0.005    | ₩7        |
| User Prompt (경주당)   | ~2,000 tokens | $0.020    | ₩27       |
| AI Response            | ~500 tokens   | $0.015    | ₩20       |
| **경주 1건 예측 총합** | ~3,000 tokens | **$0.04** | **₩54**   |

### 월간 예상 비용 (예측권 기준)

- **구독자 1명** (월 30장) = 30건 × ₩54 = **₩1,620**
- **구독자 100명** = 3,000건 × ₩54 = **₩162,000**
- **구독자 1,000명** = 30,000건 × ₩54 = **₩1,620,000**

### 비용 최적화 전략

1. **캐싱 활용**

   - 같은 경주에 대한 중복 예측 방지
   - Redis 캐시 (TTL: 1시간)
   - 100명이 같은 경주 예측 시 비용 1/100

2. **배치 처리**

   - 인기 경주는 미리 예측 생성
   - 오전 6시 일괄 예측 (경주 시작 전)

3. **모델 선택**
   - GPT-4 Turbo (정확도 우선)
   - GPT-3.5 Turbo (비용 우선, 70% 저렴)
   - Claude 3 Haiku (가성비)

---

## 🎯 목표 정확도

### 단계별 목표

| 단계    | 기간    | 1위 정확도 | 3위 내 정확도 | 상태 |
| ------- | ------- | ---------- | ------------- | ---- |
| Phase 1 | 1-2개월 | 25%        | 50%           | 현재 |
| Phase 2 | 3-4개월 | 30%        | 60%           | 목표 |
| Phase 3 | 6개월   | 35%        | 70%           | 목표 |
| Phase 4 | 12개월  | 40%+       | 75%+          | 목표 |

> **참고**: 무작위 예측의 1위 정확도는 약 7-10% (출전두수에 따라 다름)

### 개선 방법

1. **프롬프트 최적화**

   - 다양한 프롬프트 A/B 테스트
   - 정확도 높은 프롬프트 패턴 발견
   - 지속적인 프롬프트 튜닝

2. **데이터 풍부화**

   - 기상 정보 추가
   - 기수-말 궁합 통계
   - 조교사 최근 폼

3. **앙상블 예측**
   - GPT-4 + Claude 결합
   - 여러 모델의 평균/가중 평균

---

## 📱 모바일 UI 구현

### AI 예측 화면

```typescript
// mobile/components/screens/prediction/AIPredictionScreen.tsx

export function AIPredictionScreen({ raceId }: { raceId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const { ticketBalance } = usePredictionTickets();

  const handleRequestPrediction = async () => {
    if (ticketBalance === 0) {
      showWarningMessage('사용 가능한 예측권이 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await predictionApi.createPrediction({ raceId });
      setPrediction(result);
      showSuccessMessage('AI 예측이 생성되었습니다!');
    } catch (error) {
      showErrorMessage('예측 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      {/* 예측권 잔액 */}
      <View style={styles.ticketInfo}>
        <Text>남은 예측권: {ticketBalance}장</Text>
      </View>

      {/* AI 예측 버튼 */}
      {!prediction && (
        <TouchableOpacity
          style={styles.predictButton}
          onPress={handleRequestPrediction}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color='#fff' /> : <Text>🤖 AI 예측 생성 (1장 사용)</Text>}
        </TouchableOpacity>
      )}

      {/* 예측 결과 */}
      {prediction && (
        <View style={styles.predictionResult}>
          <Text style={styles.title}>🏆 AI 예측 결과</Text>

          {/* Top 3 */}
          <View style={styles.top3}>
            <PredictionCard place={1} horseNo={prediction.firstPlace} />
            <PredictionCard place={2} horseNo={prediction.secondPlace} />
            <PredictionCard place={3} horseNo={prediction.thirdPlace} />
          </View>

          {/* 신뢰도 */}
          <View style={styles.confidence}>
            <Text>신뢰도: {prediction.confidence}%</Text>
            <ProgressBar progress={prediction.confidence / 100} />
          </View>

          {/* AI 분석 */}
          <View style={styles.analysis}>
            <Text style={styles.analysisTitle}>📝 AI 분석</Text>
            <Text style={styles.analysisContent}>{prediction.analysis}</Text>
          </View>

          {/* 주의사항 */}
          {prediction.warnings && prediction.warnings.length > 0 && (
            <View style={styles.warnings}>
              <Text style={styles.warningsTitle}>⚠️ 주의사항</Text>
              {prediction.warnings.map((warning, idx) => (
                <Text key={idx} style={styles.warningItem}>
                  • {warning}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </PageLayout>
  );
}
```

---

## ✅ 체크리스트

### 백엔드 구현

- [ ] LlmService 구현 (GPT-4 API 연동)
- [ ] PromptBuilder 구현 (프롬프트 생성)
- [ ] PredictionsService 구현 (예측 생성/저장)
- [ ] AccuracyValidator 구현 (자동 검증)
- [ ] Redis 캐싱 설정
- [ ] 비용 추적 시스템

### 프론트엔드 구현

- [ ] AI 예측 화면
- [ ] 예측권 표시
- [ ] 예측 결과 UI
- [ ] 정확도 통계 화면

### 테스트

- [ ] 프롬프트 A/B 테스트
- [ ] 예측 정확도 검증
- [ ] 비용 모니터링
- [ ] 사용자 피드백 수집

---

**작성일**: 2025년 10월 11일  
**버전**: 1.0.0  
**담당**: AI Development Team
