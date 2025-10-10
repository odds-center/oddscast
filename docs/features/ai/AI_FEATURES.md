# 🤖 AI 예측 기능 설계

## 개요

Golden Race의 핵심 기능은 **LLM 기반 경마 예측 정보 제공**입니다.

### AI 예측 방식

- 🤖 **LLM API 활용**: GPT-4, Claude 등의 AI 모델 사용
- 📊 **데이터 기반 프롬프트**: 과거 경주 데이터를 AI에게 제공
- 🎯 **맥락 기반 분석**: 경주마, 기수, 조교사, 경주 조건 등 종합 분석
- ✅ **빠른 구현**: 별도 ML 모델 학습 불필요

> **중요**: 초기에는 ML 모델을 직접 학습하지 않고, LLM API를 활용하여 예측 정보를 제공합니다.

## 🎯 AI 예측 기능

### 1. 실시간 경주 예측

```typescript
interface AIPrediction {
  raceId: string;
  predictions: HorsePrediction[];
  modelVersion: string;
  confidence: number;
  timestamp: Date;
}

interface HorsePrediction {
  horseNo: string;
  horseName: string;
  winProbability: number; // 1위 확률
  placeProbability: number; // 3위 내 확률
  predictedRank: number; // 예상 순위
  confidence: number; // 신뢰도 (0-100)
  factors: PredictionFactors; // 예측 근거
}

interface PredictionFactors {
  recentForm: number; // 최근 폼 (0-1)
  distanceAptitude: number; // 거리 적성 (0-1)
  trackCondition: number; // 주로 적응도 (0-1)
  jockeyCompatibility: number; // 기수 궁합 (0-1)
  weight: number; // 체중 상태 (0-1)
  weather: number; // 날씨 적응도 (0-1)
  odds: number; // 배당률 반영 (0-1)
}
```

### 2. AI 분석 리포트

```typescript
interface AIAnalysisReport {
  raceId: string;
  overallAnalysis: string; // 전체 분석
  topPicks: HorsePrediction[]; // 상위 추천
  sleepers: HorsePrediction[]; // 다크호스
  avoid: HorsePrediction[]; // 주의 필요
  keyFactors: string[]; // 주요 요인
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedROI: number;
}
```

### 3. 예측 정확도 추적

```typescript
interface PredictionAccuracy {
  modelVersion: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number; // 전체 정확도
  top3Accuracy: number; // 상위 3위 내 정확도
  averageConfidence: number;
  roi: number; // 시뮬레이션 ROI
  byRaceType: Record<string, AccuracyMetrics>;
  byTrackCondition: Record<string, AccuracyMetrics>;
}
```

## 🏗️ 시스템 아키텍처

### LLM 기반 예측 시스템

```
┌─────────────────────────────────────────────┐
│         NestJS Backend (Node.js)             │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │ KRA API      │─────→│ Data Collection │ │
│  │ Integration  │      │ Service         │ │
│  └──────────────┘      └─────────────────┘ │
│           │                      │          │
│           ↓                      ↓          │
│  ┌──────────────────────────────────────┐  │
│  │      MySQL Database                   │  │
│  │  - races, results, entries, etc.     │  │
│  └──────────────────────────────────────┘  │
│                      │                      │
│                      ↓                      │
│  ┌──────────────────────────────────────┐  │
│  │   Prompt Builder Service              │  │
│  │  - 경주 데이터 정리                   │  │
│  │  - 과거 성적 요약                     │  │
│  │  - 프롬프트 생성                      │  │
│  └──────────────────────────────────────┘  │
│                      │                      │
│                      ↓                      │
│  ┌──────────────────────────────────────┐  │
│  │   LLM Service                         │  │
│  │  - OpenAI GPT-4 API                  │  │
│  │  - Anthropic Claude API              │  │
│  │  - 예측 결과 파싱                    │  │
│  └──────────────────────────────────────┘  │
│                      │                      │
│                      ↓                      │
│  ┌──────────────────────────────────────┐  │
│  │   Prediction Cache                    │  │
│  │  - Redis (예측 결과 캐싱)            │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                       │
                       ↓ (JSON Response)
┌─────────────────────────────────────────────┐
│      React Native Mobile App                │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │   AI Prediction Screen                │  │
│  │  - LLM 예측 결과 표시                │  │
│  │  - 예측 근거 설명                    │  │
│  │  - 신뢰도 표시                       │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │   Prediction Ticket Management        │  │
│  │  - 예측권 사용                       │  │
│  │  - 남은 개수 표시                    │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 🤖 LLM 기반 예측 시스템

### AI 예측 생성 방식

**LLM API (GPT-4, Claude 등) 활용**

```typescript
class LLMPredictionService {
  /**
   * LLM을 사용한 경주 예측
   */
  async generatePrediction(raceId: string): Promise<AIPrediction> {
    // 1. 경주 데이터 수집
    const raceData = await this.getRaceData(raceId);

    // 2. 프롬프트 생성
    const prompt = this.buildPredictionPrompt(raceData);

    // 3. LLM API 호출 (GPT-4 또는 Claude)
    const llmResponse = await this.llmService.chat({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: PREDICTION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    // 4. 응답 파싱
    const prediction = this.parseLLMResponse(llmResponse);

    return prediction;
  }

  /**
   * 프롬프트 생성
   */
  private buildPredictionPrompt(race: RaceData): string {
    return `
다음 경주를 분석하여 1위부터 3위까지 예측해주세요:

경주 정보:
- 경마장: ${race.track} (${race.trackName})
- 거리: ${race.distance}m
- 등급: ${race.grade}
- 날씨: ${race.weather}
- 주로 상태: ${race.trackCondition}

출전마 정보:
${race.horses
  .map(
    (h) => `
  ${h.number}번 ${h.name}
  - 최근 5경주: ${h.recentRanks.join(', ')}
  - 승률: ${h.winRate}%
  - 기수: ${h.jockey} (승률 ${h.jockeyWinRate}%)
  - 조교사: ${h.trainer} (승률 ${h.trainerWinRate}%)
  - 이 거리 성적: ${h.distancePerformance}
`
  )
  .join('\n')}

다음 형식으로 답변해주세요:
{
  "winner": "말 번호",
  "top3": ["1위", "2위", "3위"],
  "confidence": 85,
  "reasoning": "예측 근거 설명"
}
    `;
  }

  /**
   * LLM 응답 파싱
   */
  private parseLLMResponse(response: string): AIPrediction {
    try {
      const parsed = JSON.parse(response);
      return {
        winner: parsed.winner,
        top3: parsed.top3,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error('AI 예측 파싱 실패');
    }
  }
}
```

### 프롬프트 엔지니어링

#### System Prompt

```
당신은 경마 전문가입니다.
과거 경주 데이터를 분석하여 정확한 예측을 제공합니다.

분석 시 고려사항:
1. 최근 경주 성적 (최근 5경주가 가장 중요)
2. 해당 거리에서의 성적
3. 해당 경마장에서의 성적
4. 기수 승률 및 말과의 궁합
5. 조교사의 최근 성적
6. 날씨 및 주로 상태
7. 경주 등급 및 상금

예측은 데이터에 기반하되,
불확실성이 높으면 신뢰도를 낮게 표시하세요.
```

## 🎨 UI/UX 설계

### AI 예측 화면

```
┌─────────────────────────────────────┐
│  🤖 AI 예측                          │
├─────────────────────────────────────┤
│                                      │
│  1위 예상: 천둥번개 (확률 28%)      │
│  ████████░░░░░░░░░░░░░░░░ 85% 신뢰도│
│                                      │
│  주요 요인:                          │
│  ⭐ 최근 폼: 우수 (90점)            │
│  ⭐ 거리 적성: 최적 (85점)          │
│  ⭐ 기수 궁합: 좋음 (80점)          │
│                                      │
│  [상위 3위 예상]                     │
│  1. 천둥번개 (28%)                  │
│  2. 바람의질주 (22%)                │
│  3. 황금마차 (18%)                  │
│                                      │
│  [AI 분석 전문 보기] (500P)         │
└─────────────────────────────────────┘
```

### 예측 비교 화면

```
┌─────────────────────────────────────┐
│  📊 예측 비교                        │
├─────────────────────────────────────┤
│                                      │
│  당신의 예측    vs    AI 예측       │
│                                      │
│  1위: 바람의질주  ↔  천둥번개       │
│  2위: 천둥번개    ↔  바람의질주     │
│  3위: 황금마차    ↔  황금마차 ✓    │
│                                      │
│  실제 결과:                          │
│  1위: 천둥번개 ✓ (AI 정답!)        │
│  2위: 바람의질주                    │
│  3위: 황금마차 ✓                   │
│                                      │
│  정확도:                             │
│  당신: 33% (1/3)                    │
│  AI: 66% (2/3)                      │
└─────────────────────────────────────┘
```

## 🎮 게임 기능

### 1. AI 도우미

- **포인트로 구매**: 500P = AI 예측 힌트
- **분석 리포트**: 1000P = 상세 분석
- **실시간 업데이트**: 경주 직전 최신 예측

### 2. 사용자 vs AI 챌린지

- AI보다 정확하게 예측하기
- 연속 정답 도전
- 주간/월간 랭킹

### 3. 학습 모드

- AI 예측 근거 학습
- 과거 예측 복기
- 데이터 분석 교육

## 📱 모바일 UI 구현 계획

### 새로운 화면 추가

1. **AI 예측 탭**: `/ai-predictions`
2. **예측 비교**: `/compare-predictions`
3. **AI 통계**: `/ai-statistics`
4. **학습 센터**: `/learning-center`

### 기존 화면 강화

- **홈**: AI 추천 경주 표시
- **경주 상세**: AI 예측 통합
- **마이페이지**: AI vs 사용자 통계

## 🔐 법적 안전장치

### 명확한 게임 포지셔닝

1. **게임임을 강조**

   - "경마 예측 게임"
   - "AI 학습 플랫폼"
   - "데이터 분석 교육"

2. **현금 가치 차단**

   - 포인트 ≠ 현금
   - 게임 내 가상 화폐
   - 환전/충전 불가

3. **교육적 가치**
   - AI/ML 학습
   - 데이터 분석 능력 향상
   - 의사결정 훈련

## 🚀 구현 우선순위

### Phase 1: 데이터 준비 (완료 ✅)

- [x] KRA API 통합
- [x] 데이터베이스 구축
- [x] 자동 수집 시스템

### Phase 2: 베이스라인 모델 (다음 단계)

- [ ] 특징 추출 파이프라인
- [ ] 간단한 ML 모델 (XGBoost)
- [ ] 기본 예측 API

### Phase 3: UI 통합 (이후 단계)

- [ ] AI 예측 화면
- [ ] 사용자 예측 입력
- [ ] 비교 및 점수 시스템

### Phase 4: 고도화 (장기 계획)

- [ ] 딥러닝 모델
- [ ] 앙상블 기법
- [ ] 실시간 학습

## 📊 성공 지표

### 기술 지표

- **모델 정확도**: 35%+ (무작위 10% 대비)
- **API 응답속도**: <500ms
- **예측 신뢰도**: 80%+

### 사용자 지표

- **일일 활성 사용자**: 1,000+
- **예측 참여율**: 60%+
- **사용자 만족도**: 4.0+/5.0

### 비즈니스 지표

- **사용자 유지율**: 40%+ (월간)
- **평균 세션 시간**: 15분+
- **프리미엄 전환율**: 5%+

## 🎓 교육 콘텐츠

### AI 학습 자료

- "AI는 어떻게 예측하나요?"
- "머신러닝 기초 이해하기"
- "데이터로 배우는 경마"
- "확률과 통계의 이해"

### 분석 도구

- 과거 예측 정확도 그래프
- 요인별 영향도 분석
- AI vs 전문가 비교
- 학습 곡선 추적

---

**업데이트**: 2025년 10월 9일

---

**마지막 업데이트**: 2025년 10월 10일
