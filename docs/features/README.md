# 🎯 기능 문서

Golden Race 프로젝트의 주요 기능 설계 및 계획 문서입니다.

---

## 📚 문서 목록

### AI 시스템 (12개) ⭐ 확장됨

| 문서                                                                    | 설명              | 상태    |
| ----------------------------------------------------------------------- | ----------------- | ------- |
| [README.md](ai/README.md)                                               | AI 문서 허브      | ✅ 완료 |
| [AI_PREDICTION_IMPLEMENTATION.md](ai/AI_PREDICTION_IMPLEMENTATION.md)   | 구현 가이드       | ✅ 완료 |
| [AI_FEATURES.md](ai/AI_FEATURES.md)                                     | 기능 설계         | ✅ 완료 |
| [AI_PREDICTION_ROADMAP.md](ai/AI_PREDICTION_ROADMAP.md)                 | 로드맵            | ✅ 완료 |
| [AI_PREDICTION_COST_MODEL.md](ai/AI_PREDICTION_COST_MODEL.md)           | 비용 모델         | ✅ 완료 |
| [AI_PREDICTION_ANALYSIS.md](ai/AI_PREDICTION_ANALYSIS.md)               | 성과 분석         | ✅ 완료 |
| [AI_CACHING_STRATEGY.md](ai/AI_CACHING_STRATEGY.md) ⭐⭐⭐              | 캐싱 전략 (필수!) | ✅ 완료 |
| [MODEL_STRATEGY_FINAL.md](ai/MODEL_STRATEGY_FINAL.md) ⭐ 신규           | 모델 전략 최종안  | ✅ 완료 |
| [AI_CACHING_IMPLEMENTATION.md](ai/AI_CACHING_IMPLEMENTATION.md) ⭐ 신규 | 캐싱 구현 가이드  | ✅ 완료 |
| [MODEL_COMPARISON.md](ai/MODEL_COMPARISON.md) ⭐ 신규                   | 모델 비교         | ✅ 완료 |
| [AI_IMPROVEMENT_STRATEGY.md](ai/AI_IMPROVEMENT_STRATEGY.md) ⭐ 신규     | 개선 전략         | ✅ 완료 |
| [SINGLE_MODEL_STRATEGY.md](ai/SINGLE_MODEL_STRATEGY.md) ⭐ 신규         | 단일 모델 전략    | ✅ 완료 |

### 게임 시스템 (개발 중)

| 문서                                                        | 설명                     | 상태       |
| ----------------------------------------------------------- | ------------------------ | ---------- |
| [AI_SUBSCRIPTION_MODEL.md](game/AI_SUBSCRIPTION_MODEL.md)   | AI 예측권 구독 서비스    | 🔄 개발 중 |
| [SINGLE_TICKET_PURCHASE.md](game/SINGLE_TICKET_PURCHASE.md) | AI 예측권 개별 구매      | 🔄 개발 중 |
| [PAYMENT_INTEGRATION.md](game/PAYMENT_INTEGRATION.md)       | 구독 결제 시스템         | 🔄 개발 중 |
| [BETTING_SYSTEM.md](game/BETTING_SYSTEM.md)                 | 베팅 기록 및 예측권 사용 | 🔄 개발 중 |
| [BETTING_VS_PREDICTION.md](game/BETTING_VS_PREDICTION.md)   | 베팅 vs 예측 개념 구분   | ✅ 완료    |

### 모바일 기능

| 문서                                                    | 설명                | 상태    |
| ------------------------------------------------------- | ------------------- | ------- |
| [HorseRacingApp.md](mobile/HorseRacingApp.md)           | 경마 앱 기능 상세   | ✅ 완료 |
| [IMPLEMENTATION_PLAN.md](mobile/IMPLEMENTATION_PLAN.md) | 구현 계획 및 로드맵 | ✅ 완료 |

---

## 🎯 비즈니스 모델

### AI 예측권 구독 서비스

**핵심 모델**: 정보 제공 서비스 (합법)

#### 프리미엄 플랜 (추천)

| 항목         | 내용                           |
| ------------ | ------------------------------ |
| 💎 구독료    | 월 19,800원                    |
| 🎫 제공 내용 | 월 24장 AI 예측권 (보너스 4장) |
| 💰 장당 가격 | 825원 (25% 할인)               |
| 🤖 AI 정확도 | 평균 70%+ 목표                 |
| 🔄 결제 방식 | 카드 정기 결제                 |
| ✅ 법적 근거 | 정보 서비스 (주식 정보와 동일) |

#### 라이트 플랜

| 항목         | 내용                           |
| ------------ | ------------------------------ |
| 💎 구독료    | 월 9,900원                     |
| 🎫 제공 내용 | 월 11장 AI 예측권 (보너스 1장) |
| 💰 장당 가격 | 900원 (18% 할인)               |

#### 개별 구매

| 항목         | 내용          |
| ------------ | ------------- |
| 💎 가격      | 1,000원/장    |
| 🎫 제공 내용 | AI 예측권 1장 |

**자세한 내용**: [AI_SUBSCRIPTION_MODEL.md](game/AI_SUBSCRIPTION_MODEL.md)

---

## 🎯 기능별 상세

### 1. AI 예측 시스템 (📅 2026 Q1)

**목표**: 머신러닝 기반 경주 결과 예측

- 📊 과거 데이터 분석 (50,000+ 경주)
- 🤖 ML 모델 학습 (XGBoost, LightGBM)
- 🎯 실시간 예측 API
- 📈 정확도 추적 (목표 70%+)

**관련**: [ai/AI_FEATURES.md](ai/AI_FEATURES.md),
[ai/AI_PREDICTION_ROADMAP.md](ai/AI_PREDICTION_ROADMAP.md)

---

### 2. AI 예측권 구독 서비스 (✅ 부분 완료)

**목표**: AI 예측 정보 제공 구독 서비스

- 💳 2개 구독 플랜 (Light: 9,900원, Premium: 19,800원)
- 🎫 월 15~35장 예측권 발급
- 🤖 AI 예측 정보 제공
- 📊 정확도 추적
- ✅ 데이터베이스 스키마 완료
- ✅ 구독 플랜 UI 완료
- 🔄 결제 연동 진행 중

**관련**: [game/AI_SUBSCRIPTION_MODEL.md](game/AI_SUBSCRIPTION_MODEL.md),
[game/PAYMENT_INTEGRATION.md](game/PAYMENT_INTEGRATION.md)

---

### 3. 베팅 기록 관리 (🔄 개발 중)

**목표**: 외부 구매 마권 기록 및 통계

- 📝 7가지 승식 기록
- 🏇 한국마사회 구매 마권 추적
- 📊 자동 결과 확인
- 📈 개인 통계 분석

**관련**: [game/BETTING_SYSTEM.md](game/BETTING_SYSTEM.md),
[game/BETTING_VS_PREDICTION.md](game/BETTING_VS_PREDICTION.md)

---

### 4. 모바일 앱 기능 (✅ 완료)

**목표**: 사용자 친화적인 모바일 경험

- 🏇 실시간 경주 정보
- 🎯 AI 예측권 사용
- 📝 베팅 기록 관리
- 📊 개인 통계
- ⭐ 즐겨찾기

**관련**: [mobile/HorseRacingApp.md](mobile/HorseRacingApp.md),
[mobile/IMPLEMENTATION_PLAN.md](mobile/IMPLEMENTATION_PLAN.md)

---

## 📊 개발 현황

### 완료 (50%)

| 기능                | 진행률 |
| ------------------- | ------ |
| ✅ KRA API 통합     | 100%   |
| ✅ 사용자 인증      | 100%   |
| ✅ 경주 정보 조회   | 100%   |
| ✅ 데이터 수집 배치 | 100%   |
| ✅ 구독 플랜 시스템 | 100%   |
| ✅ 인증 가드 시스템 | 100%   |
| ✅ UI/UX 최적화     | 100%   |

### 개발 중 (35%)

| 기능              | 진행률 |
| ----------------- | ------ |
| 🔄 구독 결제 연동 | 60%    |
| 🔄 베팅 기록 관리 | 50%    |
| 🔄 결과 자동 확인 | 40%    |

### 계획 중 (20%)

| 기능              | 예정일  |
| ----------------- | ------- |
| 📅 AI 예측 시스템 | 2026 Q1 |
| 📅 랭킹 시스템    | 2025 Q4 |
| 📅 소셜 기능      | 2026 Q2 |

---

## ⚖️ 법적 준수

### 서비스 모델

**본 서비스는 정보 제공 서비스입니다**

| 제공하는 것         | 제공하지 않는 것   |
| ------------------- | ------------------ |
| ✅ AI 예측 정보     | ❌ 앱 내 마권 구매 |
| ✅ 베팅 기록 도구   | ❌ 베팅 중개       |
| ✅ 정보 구독 서비스 | ❌ 현금 송금       |
| ✅ 결과 확인        | ❌ 배당금 지급     |

**자세한 내용**: [법적 고지](../../../LEGAL_NOTICE.md)

---

## 🔗 관련 문서

- [아키텍처](../../architecture/) - 시스템 설계
- [가이드](../../guides/) - 개발 가이드
- [API](../../api/) - API 문서

---

**마지막 업데이트**: 2025년 10월 11일
