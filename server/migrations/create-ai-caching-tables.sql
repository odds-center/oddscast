-- =====================================================
-- AI 예측 캐싱 시스템 테이블
-- 작성일: 2025-10-12
-- 목적: AI 예측 비용 99% 절감을 위한 캐싱 시스템
-- =====================================================

-- 1. ai_predictions 테이블 개선
-- 기존 predictions 테이블을 ai_predictions로 변경 및 확장
DROP TABLE IF EXISTS ai_predictions;
CREATE TABLE ai_predictions (
  id VARCHAR(36) PRIMARY KEY,
  race_id VARCHAR(36) NOT NULL UNIQUE,
  
  -- 예측 결과
  predicted_first INT NOT NULL COMMENT '1위 예측 마번',
  predicted_second INT NOT NULL COMMENT '2위 예측 마번',
  predicted_third INT NOT NULL COMMENT '3위 예측 마번',
  confidence DECIMAL(5,2) NOT NULL COMMENT '신뢰도 (0-100)',
  
  -- 예측 근거
  analysis TEXT COMMENT 'AI 분석 내용',
  factors JSON COMMENT '예측 요인 점수 {"recentForm": 0.9, "distanceAptitude": 0.85, ...}',
  warnings JSON COMMENT '주의사항 목록',
  
  -- LLM 메타데이터
  model_version VARCHAR(20) COMMENT 'gpt-4-turbo, claude-3-opus, etc.',
  llm_provider VARCHAR(20) COMMENT 'openai, anthropic',
  prompt_version VARCHAR(20) DEFAULT 'v1.0' COMMENT '프롬프트 버전',
  input_tokens INT COMMENT '입력 토큰 수',
  output_tokens INT COMMENT '출력 토큰 수',
  total_tokens INT COMMENT '총 토큰 수',
  cost DECIMAL(10,4) COMMENT '비용 (원)',
  response_time INT COMMENT '응답 시간 (ms)',
  
  -- 타임스탬프
  predicted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최초 예측 시각',
  updated_at TIMESTAMP NULL COMMENT '마지막 업데이트 시각',
  
  -- 실제 결과 (경주 후)
  actual_first INT COMMENT '실제 1위',
  actual_second INT COMMENT '실제 2위',
  actual_third INT COMMENT '실제 3위',
  first_correct BOOLEAN COMMENT '1위 예측 정확',
  in_top3 BOOLEAN COMMENT '예측한 말이 3위 안에 있는지',
  exact_order BOOLEAN COMMENT '순서까지 정확',
  accuracy_score DECIMAL(5,2) COMMENT '정확도 점수 (0-100)',
  verified_at TIMESTAMP NULL COMMENT '검증 완료 시각',
  
  -- 상태
  is_finalized BOOLEAN DEFAULT FALSE COMMENT '경주 시작 여부 (시작 후 업데이트 중단)',
  
  -- 인덱스
  INDEX idx_race_id (race_id),
  INDEX idx_predicted_at (predicted_at),
  INDEX idx_model_version (model_version),
  INDEX idx_llm_provider (llm_provider),
  INDEX idx_verified (verified_at),
  
  CONSTRAINT fk_ai_predictions_race FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI 예측 결과 저장';

-- 2. ai_prediction_updates 테이블
-- 예측 업데이트 이력 추적
CREATE TABLE ai_prediction_updates (
  id VARCHAR(36) PRIMARY KEY,
  prediction_id VARCHAR(36) NOT NULL,
  
  -- 변경 내용
  old_first INT COMMENT '이전 1위 예측',
  new_first INT COMMENT '새 1위 예측',
  old_second INT COMMENT '이전 2위 예측',
  new_second INT COMMENT '새 2위 예측',
  old_third INT COMMENT '이전 3위 예측',
  new_third INT COMMENT '새 3위 예측',
  old_confidence DECIMAL(5,2) COMMENT '이전 신뢰도',
  new_confidence DECIMAL(5,2) COMMENT '새 신뢰도',
  
  -- 변경 이유
  update_reason VARCHAR(50) COMMENT 'scheduled, odds_change, weather_change, horse_withdrawn',
  reason_details JSON COMMENT '변경 이유 상세 정보',
  
  -- 비용
  cost DECIMAL(10,4) COMMENT '업데이트 비용',
  
  -- 타임스탬프
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- 인덱스
  INDEX idx_prediction_id (prediction_id),
  INDEX idx_updated_at (updated_at),
  INDEX idx_update_reason (update_reason),
  
  CONSTRAINT fk_updates_prediction FOREIGN KEY (prediction_id) REFERENCES ai_predictions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI 예측 업데이트 이력';

-- 3. daily_prediction_stats 테이블
-- 일일 예측 통계
CREATE TABLE daily_prediction_stats (
  date DATE PRIMARY KEY,
  
  -- 예측 통계
  total_predictions INT DEFAULT 0 COMMENT '총 예측 수',
  first_correct INT DEFAULT 0 COMMENT '1위 정확 수',
  top3_correct INT DEFAULT 0 COMMENT '3위 내 정확 수',
  exact_order_correct INT DEFAULT 0 COMMENT '순서까지 정확 수',
  
  -- 정확도
  accuracy DECIMAL(5,2) COMMENT '1위 정확도 (%)',
  top3_accuracy DECIMAL(5,2) COMMENT '3위 내 정확도 (%)',
  exact_order_accuracy DECIMAL(5,2) COMMENT '순서 정확도 (%)',
  avg_confidence DECIMAL(5,2) COMMENT '평균 신뢰도',
  avg_accuracy_score DECIMAL(5,2) COMMENT '평균 정확도 점수',
  
  -- 비용
  total_cost DECIMAL(10,2) COMMENT '총 AI 비용',
  total_updates INT DEFAULT 0 COMMENT '총 업데이트 수',
  update_cost DECIMAL(10,2) COMMENT '업데이트 비용',
  
  -- ROI 시뮬레이션
  simulated_stake DECIMAL(12,2) COMMENT '시뮬레이션 베팅 금액',
  simulated_return DECIMAL(12,2) COMMENT '시뮬레이션 환급 금액',
  simulated_roi DECIMAL(10,2) COMMENT 'ROI (%)',
  
  -- 타임스탬프
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 인덱스
  INDEX idx_date (date),
  INDEX idx_accuracy (accuracy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='일일 AI 예측 통계';

-- 4. model_performance 테이블
-- 모델 버전별 성과
CREATE TABLE model_performance (
  model_version VARCHAR(20) PRIMARY KEY,
  llm_provider VARCHAR(20) COMMENT 'openai, anthropic',
  
  -- 예측 통계
  total_predictions INT DEFAULT 0,
  first_correct INT DEFAULT 0,
  top3_correct INT DEFAULT 0,
  
  -- 정확도
  accuracy DECIMAL(5,2) COMMENT '1위 정확도 (%)',
  top3_accuracy DECIMAL(5,2) COMMENT '3위 내 정확도 (%)',
  avg_confidence DECIMAL(5,2) COMMENT '평균 신뢰도',
  
  -- 비용
  total_cost DECIMAL(12,2) COMMENT '총 비용',
  avg_cost_per_prediction DECIMAL(10,2) COMMENT '예측당 평균 비용',
  
  -- ROI
  simulated_roi DECIMAL(10,2) COMMENT '시뮬레이션 ROI (%)',
  
  -- 상태
  is_active BOOLEAN DEFAULT TRUE COMMENT '현재 사용 중 여부',
  
  -- 타임스탬프
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 인덱스
  INDEX idx_llm_provider (llm_provider),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='모델 버전별 성과';

-- 5. prediction_cache_stats 테이블
-- 캐시 효율성 통계
CREATE TABLE prediction_cache_stats (
  id VARCHAR(36) PRIMARY KEY,
  date DATE NOT NULL,
  hour INT NOT NULL COMMENT '시간 (0-23)',
  
  -- 요청 통계
  total_requests INT DEFAULT 0,
  cache_hits INT DEFAULT 0 COMMENT 'Redis 캐시 적중',
  db_hits INT DEFAULT 0 COMMENT 'DB 조회',
  ai_calls INT DEFAULT 0 COMMENT 'AI 신규 생성',
  
  -- 캐시 효율성
  cache_hit_rate DECIMAL(5,2) COMMENT '캐시 적중률 (%)',
  
  -- 비용 절감
  saved_cost DECIMAL(10,2) COMMENT '캐싱으로 절감한 비용',
  actual_cost DECIMAL(10,2) COMMENT '실제 발생 비용',
  would_be_cost DECIMAL(10,2) COMMENT '캐싱 없었으면 비용',
  
  -- 성능
  avg_response_time INT COMMENT '평균 응답 시간 (ms)',
  cache_response_time INT COMMENT '캐시 응답 시간 (ms)',
  db_response_time INT COMMENT 'DB 응답 시간 (ms)',
  ai_response_time INT COMMENT 'AI 응답 시간 (ms)',
  
  -- 타임스탬프
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 인덱스
  UNIQUE KEY uk_date_hour (date, hour),
  INDEX idx_date (date),
  INDEX idx_cache_hit_rate (cache_hit_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='캐시 효율성 통계';

-- 6. prediction_failures 테이블
-- 예측 실패 원인 분석
CREATE TABLE prediction_failures (
  id VARCHAR(36) PRIMARY KEY,
  prediction_id VARCHAR(36) NOT NULL,
  race_id VARCHAR(36) NOT NULL,
  
  -- 실패 정보
  predicted_first INT,
  actual_first INT,
  prediction_confidence DECIMAL(5,2),
  
  -- 실패 분류
  failure_type VARCHAR(50) COMMENT 'overconfidence, upset, weather, track_condition',
  failure_reason TEXT COMMENT '실패 원인 상세',
  
  -- 컨텍스트
  race_grade INT COMMENT '경주 등급',
  race_distance INT COMMENT '경주 거리',
  track_condition VARCHAR(20) COMMENT '주로 상태',
  weather VARCHAR(20) COMMENT '날씨',
  actual_winner_popularity INT COMMENT '실제 우승마 인기 순위',
  
  -- 타임스탬프
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 인덱스
  INDEX idx_prediction_id (prediction_id),
  INDEX idx_race_id (race_id),
  INDEX idx_failure_type (failure_type),
  INDEX idx_analyzed_at (analyzed_at),
  
  CONSTRAINT fk_failures_prediction FOREIGN KEY (prediction_id) REFERENCES ai_predictions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI 예측 실패 원인 분석';

-- 초기 데이터: 기본 모델 버전 등록
INSERT INTO model_performance (model_version, llm_provider, is_active) VALUES
('gpt-4-turbo', 'openai', TRUE),
('gpt-3.5-turbo', 'openai', TRUE),
('claude-3-opus', 'anthropic', FALSE);

