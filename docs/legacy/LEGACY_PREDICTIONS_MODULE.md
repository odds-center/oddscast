# 🤖 AI 예측 모듈 (AI Caching Optimized)

## 📋 개요

AI 예측 비용을 99% 절감하기 위한 캐싱 최적화 시스템입니다.

---

## 🏗️ 아키텍처

```
배치 예측 (1일 1회)
   ↓
DB 저장 (ai_predictions)
   ↓
10분 업데이트 (조건부)
   ↓
사용자 요청 → DB 조회 (AI 호출 안 함!)
```

---

## 📊 Entity 구조

### 1. Prediction (ai_predictions)

- **목적**: AI 예측 결과 저장
- **특징**: race_id UNIQUE (중복 방지)
- **관계**: Race, PredictionUpdate, PredictionFailure

### 2. PredictionUpdate (ai_prediction_updates)

- **목적**: 예측 업데이트 이력
- **추적**: 변경 전후, 변경 이유, 비용

### 3. DailyPredictionStats (daily_prediction_stats)

- **목적**: 일일 통계 집계
- **지표**: 정확도, 비용, ROI

### 4. ModelPerformance (model_performance)

- **목적**: 모델 버전별 성과
- **비교**: GPT-4 vs GPT-3.5 vs Claude

### 5. PredictionFailure (prediction_failures)

- **목적**: 실패 원인 분석
- **분류**: 과신, 이변, 날씨, 주로 상태

---

## 🔧 Services

### AIBatchService

```typescript
// Cron 스케줄러
- 09:00 매일: 오늘 경주 배치 예측
- 10분마다: 임박 경주 업데이트
- 1분마다: 시작된 경주 finalize
- 00:00 매일: 어제 예측 검증
```

### AIAnalyticsService

```typescript
// 분석 기능
- calculateDailyStats(): 일일 통계
- analyzeFailures(): 실패 원인 분석
- updateModelPerformance(): 모델 성과 업데이트
- getAccuracyDashboard(): 대시보드 데이터
```

### SmartUpdateService

```typescript
// 스마트 업데이트
- shouldUpdate(): 업데이트 필요 여부
- calculateOddsChange(): 배당률 변화 감지
- getUpdatePriority(): 우선순위 결정
```

---

## 📡 API Endpoints

### 예측 생성/조회

```
POST   /api/predictions              # AI 예측 생성 (캐시 우선)
GET    /api/predictions/:id          # ID로 조회
GET    /api/predictions/race/:raceId # 경주별 조회
GET    /api/predictions              # 모든 예측 (페이징)
```

### 분석 API

```
GET    /api/predictions/analytics/dashboard       # 대시보드
POST   /api/predictions/analytics/daily-stats     # 일일 통계 계산
GET    /api/predictions/analytics/failures        # 실패 분석
GET    /api/predictions/stats/accuracy            # 평균 정확도
GET    /api/predictions/stats/cost                # 총 비용
```

---

## 💰 비용 절감 효과

### Before (캐싱 없음)

```
사용자 1,000명 × 12경주
= 월 ₩19,440,000 💸
```

### After (배치 + 캐싱)

```
하루 12경주 + 업데이트 72건
= 월 ₩30,240 ✅

절감: 99.7%! 🎉
```

---

## 🚀 사용 방법

### 1. 배치 예측 (자동)

```typescript
// 매일 09:00 자동 실행
// 수동 실행:
await aiBatchService.batchPredictTodayRaces();
```

### 2. 예측 조회 (사용자)

```typescript
// GET /api/predictions/race/:raceId
const prediction = await predictionsService.findByRaceId(raceId);
// → DB에서 조회, AI 호출 안 함!
```

### 3. 통계 확인

```typescript
// GET /api/predictions/analytics/dashboard
const dashboard = await analyticsService.getAccuracyDashboard();
```

---

## 📚 관련 문서

- [AI 캐싱 전략](../../../../docs/features/ai/AI_CACHING_STRATEGY.md)
- [AI 예측 분석](../../../../docs/features/ai/AI_PREDICTION_ANALYSIS.md)
- [AI 구현 가이드](../../../../docs/features/ai/AI_PREDICTION_IMPLEMENTATION.md)

---

**작성일**: 2025-10-12  
**버전**: 2.0.0 (캐싱 최적화)
