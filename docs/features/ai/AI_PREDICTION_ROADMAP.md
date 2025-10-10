# 🤖 AI 기반 경마 예측 시스템 로드맵

## 📋 프로젝트 비전

**Golden Race**는 AI/ML 기술을 활용하여 한국 경마의 승부를 예측하는 혁신적인 플랫폼입니다.

## 🎯 최종 목표

### 핵심 목표

- **AI 예측 엔진**: 머신러닝 모델을 통한 정확한 경마 결과 예측
- **데이터 기반 인사이트**: 과거 경주 데이터 분석을 통한 패턴 학습
- **실시간 분석**: 경주 전 최신 정보를 반영한 예측 제공
- **사용자 참여**: AI 예측과 사용자 예측의 비교 및 학습

## 🔬 AI 예측 시스템 구성

### 1단계: 데이터 수집 및 정제 (완료 ✅)

- [x] 한국마사회(KRA) API 통합
- [x] 경주 기록 (API4_3)
- [x] 출전표 상세 (API26_2)
- [x] 확정 배당율 (API160)
- [x] 경주 계획표 (API72_2)
- [x] 데이터베이스 스키마 설계
- [x] 자동 데이터 수집 배치 작업

### 2단계: 데이터 분석 및 특징 추출 (진행 예정 🔄)

#### 경주마 특징 (Horse Features)

- [ ] 최근 성적 (승률, 연승, 등급별 성적)
- [ ] 거리별 적성 (단거리/중거리/장거리)
- [ ] 주로 상태별 성적 (양호/불량/습윤)
- [ ] 나이 및 경력 (출전 횟수, 경력 개월)
- [ ] 체중 변화 추이
- [ ] 부담 중량 적응도
- [ ] 휴식 기간 영향도

#### 기수 특징 (Jockey Features)

- [ ] 기수 승률 및 연대율
- [ ] 특정 경주마와의 궁합
- [ ] 경주장별 승률
- [ ] 최근 폼 (최근 10경주 성적)
- [ ] 거리별 적성

#### 조교사 특징 (Trainer Features)

- [ ] 조교사 승률
- [ ] 특정 기수와의 조합 성적
- [ ] 경주장별 승률
- [ ] 최근 관리 말들의 성적

#### 경주 환경 특징 (Race Conditions)

- [ ] 날씨 (맑음/흐림/비/눈)
- [ ] 주로 상태 (양호/불량/습윤)
- [ ] 경주 등급 (G1/G2/G3/일반)
- [ ] 출전 두수
- [ ] 경주 거리
- [ ] 부담 중량 체계

#### 베팅 시장 특징 (Market Features)

- [ ] 단승식 배당률
- [ ] 연승식 배당률
- [ ] 배당률 변동 추이
- [ ] 인기도 순위

### 3단계: ML 모델 개발 (설계 단계 📝)

#### 모델 아키텍처

```
Input Features (100+ dimensions)
    ↓
Feature Engineering & Normalization
    ↓
Ensemble Model:
├── XGBoost (Tree-based)
├── LightGBM (Gradient Boosting)
├── Random Forest (Ensemble)
├── Neural Network (Deep Learning)
│   ├── LSTM (Sequential Data)
│   └── Attention Mechanism
└── Logistic Regression (Baseline)
    ↓
Weighted Voting / Stacking
    ↓
Output: Win Probability (0-1) for each horse
```

#### 예측 타입

1. **승마 예측**: 1위 말 예측 (Classification)
2. **순위 예측**: 상위 3위 예측 (Multi-output)
3. **배당 예측**: 예상 배당률 (Regression)
4. **신뢰도**: 예측 확신도 (0-100%)

### 4단계: 모델 학습 및 검증 (계획 중 📅)

#### 데이터셋 구성

- **학습 데이터**: 2020-2023년 경주 데이터 (~10,000 경주)
- **검증 데이터**: 2024년 1-6월 (~1,500 경주)
- **테스트 데이터**: 2024년 7-12월 (~1,500 경주)

#### 평가 지표

- **정확도 (Accuracy)**: 승마 예측 정확도
- **F1 Score**: 정밀도와 재현율의 조화 평균
- **ROI**: 모델 기반 베팅 수익률
- **Hit Rate**: 상위 3위 내 예측 적중률
- **Sharpe Ratio**: 위험 대비 수익률

#### 목표 성능

- 승마 예측 정확도: **35%+** (무작위: ~10%)
- 상위 3위 예측: **60%+** (무작위: ~30%)
- 긍정적 ROI: **+5%** (장기적)

### 5단계: 시스템 통합 (개발 예정 🚀)

#### 백엔드 API

```typescript
POST /api/ai/predict
{
  "raceId": "SEOUL_20250110_01",
  "entries": [...],
  "conditions": {...}
}

Response:
{
  "predictions": [
    {
      "horseNo": "1",
      "horseName": "천둥번개",
      "winProbability": 0.28,
      "rank": 1,
      "confidence": 0.85,
      "factors": {
        "recentForm": 0.9,
        "distanceAptitude": 0.8,
        "jockeyCompatibility": 0.85,
        "trackCondition": 0.75
      }
    },
    ...
  ],
  "modelVersion": "v1.2.0",
  "timestamp": "2025-01-10T14:30:00Z"
}
```

#### 프론트엔드 UI

- [ ] AI 예측 결과 표시
- [ ] 예측 신뢰도 시각화
- [ ] 주요 영향 요인 분석
- [ ] 과거 예측 정확도 통계
- [ ] 실시간 예측 업데이트

### 6단계: 지속적 개선 (운영 단계 🔄)

- [ ] 실시간 모델 재학습
- [ ] A/B 테스트를 통한 모델 비교
- [ ] 사용자 피드백 수집
- [ ] 예측 정확도 모니터링
- [ ] 새로운 특징 추가 및 실험

## 🛠️ 기술 스택

### AI/ML 프레임워크

- **Python 3.10+**
- **scikit-learn**: 기본 ML 모델
- **XGBoost / LightGBM**: Gradient Boosting
- **TensorFlow / PyTorch**: 딥러닝
- **pandas / numpy**: 데이터 처리
- **matplotlib / seaborn**: 시각화

### 데이터 파이프라인

- **Apache Airflow**: 워크플로우 관리
- **Redis**: 캐싱 및 실시간 데이터
- **PostgreSQL**: 분석 데이터베이스
- **S3 / GCS**: 모델 저장소

### 서빙 인프라

- **FastAPI**: AI 예측 API 서버
- **Docker**: 컨테이너화
- **Kubernetes**: 오케스트레이션
- **MLflow**: 모델 버전 관리

## 📊 데이터 현황

### 수집 가능한 데이터

- **경주 기록**: ~50,000+ 경주
- **출전 기록**: ~500,000+ 출전
- **기수 정보**: ~200명
- **조교사 정보**: ~150명
- **경주마 정보**: ~3,000두
- **배당 정보**: 전 경주 배당률

### 데이터 품질

- ✅ 완전성: 95%+
- ✅ 정확성: 99%+
- ✅ 일관성: 98%+
- ✅ 최신성: 실시간 업데이트

## 🎮 게임 통합

### AI vs 사용자

- 사용자 예측 vs AI 예측 비교
- 예측 정확도 랭킹
- AI 예측 신뢰도 표시
- 학습 및 개선 피드백

### 게임 요소

- **AI 도움**: 포인트로 AI 예측 힌트 구매
- **랭킹 시스템**: AI 대비 사용자 정확도
- **도전 과제**: "AI보다 정확하게 예측하기"
- **보상 시스템**: 정확한 예측 시 포인트 획득

## 📈 비즈니스 모델

### 수익화 전략 (법적 준수)

1. **프리미엄 AI 분석**: 심층 분석 리포트 (구독)
2. **광고**: 비침해적 광고 게재
3. **데이터 인사이트**: 익명화된 통계 데이터 판매
4. **B2B 서비스**: 경마장/언론사 대상 예측 API

### 가치 제안

- **일반 사용자**: 재미있는 예측 게임 + 학습
- **전문가**: 데이터 기반 인사이트
- **산업**: 정확한 예측 및 분석 도구

## 🔒 윤리 및 책임

### AI 투명성

- 예측 근거 설명 제공 (Explainable AI)
- 모델 한계 명시
- 과적합 방지

### 법적 준수

- 도박 조장 금지
- 교육 및 엔터테인먼트 목적 강조
- 미성년자 접근 제한

### 책임 있는 AI

- 편향 제거 노력
- 공정성 검증
- 지속적인 모니터링

## 📅 타임라인

### 2025 Q1

- [x] 데이터 수집 시스템 구축
- [ ] 데이터 정제 및 특징 추출
- [ ] 베이스라인 모델 개발

### 2025 Q2

- [ ] 고급 ML 모델 개발
- [ ] 모델 학습 및 검증
- [ ] 예측 API 개발

### 2025 Q3

- [ ] 프론트엔드 AI 기능 통합
- [ ] 베타 테스트
- [ ] 성능 최적화

### 2025 Q4

- [ ] 정식 출시
- [ ] 지속적 개선
- [ ] 확장 기능 개발

## 📚 참고 자료

### 학술 논문

- "Horse Racing Prediction Using Machine Learning" (2020)
- "Ensemble Methods for Sports Prediction" (2021)
- "Time Series Analysis in Horse Racing" (2022)

### 오픈소스 프로젝트

- [horse-racing-prediction](https://github.com/example/horse-racing-ml)
- [sports-betting-ml](https://github.com/example/sports-ml)

### 데이터셋

- 한국마사회 공공데이터
- 경주 기록 히스토리
- 기상 데이터

## 🤝 기여

AI 모델 개선에 기여하고 싶으신 분은:

- 이메일: ai-team@goldenrace.com
- GitHub: github.com/goldenrace/ai-models

---

**마지막 업데이트**: 2025년 10월 9일 **버전**: 1.0.0 **담당**: AI Research Team
