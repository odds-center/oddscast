# 🎯 기능 문서

Golden Race 프로젝트의 주요 기능 설계 및 계획 문서입니다.

---

## 📚 문서 목록

### AI 시스템 (계획 중)

| 문서                                                    | 설명                | 상태       |
| ------------------------------------------------------- | ------------------- | ---------- |
| [AI_FEATURES.md](ai/AI_FEATURES.md)                     | AI 예측 시스템 설계 | 📅 계획 중 |
| [AI_PREDICTION_ROADMAP.md](ai/AI_PREDICTION_ROADMAP.md) | AI 개발 로드맵      | 📅 계획 중 |

### 게임 시스템 (개발 중)

| 문서                                                      | 설명                   | 상태       |
| --------------------------------------------------------- | ---------------------- | ---------- |
| [BETTING_SYSTEM.md](game/BETTING_SYSTEM.md)               | 베팅(예측) 시스템 설계 | 🔄 개발 중 |
| [BETTING_VS_PREDICTION.md](game/BETTING_VS_PREDICTION.md) | 베팅 vs 예측 개념 비교 | ✅ 완료    |
| [PAYMENT_INTEGRATION.md](game/PAYMENT_INTEGRATION.md)     | 포인트/결제 시스템     | 🔄 개발 중 |

### 모바일 기능

| 문서                                                    | 설명                | 상태    |
| ------------------------------------------------------- | ------------------- | ------- |
| [HorseRacingApp.md](mobile/HorseRacingApp.md)           | 경마 앱 기능 상세   | ✅ 완료 |
| [IMPLEMENTATION_PLAN.md](mobile/IMPLEMENTATION_PLAN.md) | 구현 계획 및 로드맵 | ✅ 완료 |

---

## 🎯 기능별 개요

### 1. AI 예측 시스템 (📅 2026 Q1)

**목표**: 머신러닝 기반 경주 결과 예측

- 📊 과거 데이터 분석 (50,000+ 경주)
- 🤖 ML 모델 학습 (XGBoost, LightGBM)
- 🎯 실시간 예측 API
- 📈 정확도 추적 및 개선

**관련**: [ai/AI_FEATURES.md](ai/AI_FEATURES.md),
[ai/AI_PREDICTION_ROADMAP.md](ai/AI_PREDICTION_ROADMAP.md)

---

### 2. 베팅(예측) 게임 시스템 (🔄 개발 중)

**목표**: 가상 화폐를 이용한 예측 게임

- 🎯 7가지 승식 (단승, 복승, 연승 등)
- 💰 실시간 배당률 (KRA API)
- 🎁 포인트 시스템
- 📊 개인 통계 및 랭킹

**관련**: [game/BETTING_SYSTEM.md](game/BETTING_SYSTEM.md),
[game/BETTING_VS_PREDICTION.md](game/BETTING_VS_PREDICTION.md)

---

### 3. 포인트 시스템 (🔄 개발 중)

**목표**: 게임 내 가상 화폐 관리

- 🎁 무료 포인트 지급
- 📈 포인트 내역 추적
- 🏆 보상 시스템
- ❌ 현금 거래 금지

**관련**: [game/PAYMENT_INTEGRATION.md](game/PAYMENT_INTEGRATION.md)

---

### 4. 모바일 앱 기능 (✅ 완료)

**목표**: 사용자 친화적인 모바일 경험

- 🏇 실시간 경주 정보
- 🎯 예측 참여
- 📊 개인 통계
- ⭐ 즐겨찾기

**관련**: [mobile/HorseRacingApp.md](mobile/HorseRacingApp.md),
[mobile/IMPLEMENTATION_PLAN.md](mobile/IMPLEMENTATION_PLAN.md)

---

## 📊 개발 현황

### 완료 (40%)

| 기능                | 진행률 |
| ------------------- | ------ |
| ✅ KRA API 통합     | 100%   |
| ✅ 사용자 인증      | 100%   |
| ✅ 경주 정보 조회   | 100%   |
| ✅ 데이터 수집 배치 | 100%   |

### 개발 중 (40%)

| 기능             | 진행률 |
| ---------------- | ------ |
| 🔄 베팅 시스템   | 60%    |
| 🔄 포인트 시스템 | 50%    |
| 🔄 결과 정산     | 30%    |

### 계획 중 (20%)

| 기능              | 예정일  |
| ----------------- | ------- |
| 📅 AI 예측 시스템 | 2026 Q1 |
| 📅 랭킹 시스템    | 2025 Q4 |
| 📅 소셜 기능      | 2026 Q2 |

---

## 🔗 관련 문서

- [아키텍처](../architecture/) - 시스템 설계
- [가이드](../guides/) - 개발 가이드
- [API](../api/) - API 문서

---

**마지막 업데이트**: 2025년 10월 10일
