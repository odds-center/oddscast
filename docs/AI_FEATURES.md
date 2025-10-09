# 🤖 AI 예측 기능 설계

## 개요

Golden Race의 핵심 기능은 **AI/ML 기반 경마 예측**입니다. 사용자가 실제 경마 결과를 예측하고, AI 예측과 비교하여 경쟁하는 게임입니다.

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

### 서버 구조

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
│  │   Feature Extraction Service         │  │
│  │  - Calculate ML features             │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                       │
                       ↓ (REST API)
┌─────────────────────────────────────────────┐
│      Python AI Service (FastAPI)            │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │   ML Model Pipeline                   │  │
│  │  - XGBoost, LightGBM, Neural Net     │  │
│  └──────────────────────────────────────┘  │
│           │                                  │
│           ↓                                  │
│  ┌──────────────────────────────────────┐  │
│  │   Prediction Engine                   │  │
│  │  - Ensemble predictions              │  │
│  │  - Confidence calculation            │  │
│  └──────────────────────────────────────┘  │
│           │                                  │
│           ↓                                  │
│  ┌──────────────────────────────────────┐  │
│  │   Model Storage (MLflow)              │  │
│  │  - Version control                   │  │
│  │  - A/B testing                       │  │
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
│  │  - Win probability chart             │  │
│  │  - Factor analysis                   │  │
│  │  - Confidence indicators             │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │   User Prediction Screen              │  │
│  │  - Make prediction                   │  │
│  │  - Compare with AI                   │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │   Performance Tracking                │  │
│  │  - User accuracy vs AI               │  │
│  │  - Leaderboard                       │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 🧮 특징 엔지니어링

### 경주마 특징 (30+ features)

```python
horse_features = {
    # 성적 특징
    'recent_win_rate': float,       # 최근 10경주 승률
    'career_win_rate': float,       # 전체 승률
    'distance_win_rate': float,     # 해당 거리 승률
    'track_win_rate': float,        # 해당 경주장 승률

    # 폼 특징
    'days_since_last_race': int,    # 마지막 경주 이후 일수
    'recent_rank_trend': float,     # 최근 순위 추세
    'weight_change': float,         # 체중 변화
    'rating': float,                # 레이팅

    # 환경 적응도
    'weather_performance': float,   # 날씨별 성적
    'track_condition_perf': float,  # 주로 상태별 성적
    'season_performance': float,    # 계절별 성적

    # 경력
    'total_starts': int,            # 총 출전 횟수
    'age': int,                     # 나이
    'experience_months': int,       # 경력 (개월)
}
```

### 기수 특징 (15+ features)

```python
jockey_features = {
    'win_rate': float,              # 승률
    'place_rate': float,            # 연대율
    'recent_form': float,           # 최근 폼
    'horse_compatibility': float,   # 해당 말과의 궁합
    'track_expertise': float,       # 경주장 전문성
    'distance_expertise': float,    # 거리별 전문성
}
```

### 조교사 특징 (10+ features)

```python
trainer_features = {
    'win_rate': float,
    'stable_form': float,           # 마방 전체 폼
    'preparation_quality': float,   # 조교 품질
}
```

### 경주 조건 (10+ features)

```python
race_features = {
    'field_size': int,              # 출전 두수
    'race_class': str,              # 경주 등급
    'distance': int,                # 거리
    'prize_money': int,             # 상금 (게임 내 가치)
    'weather': str,                 # 날씨
    'track_condition': str,         # 주로 상태
}
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
