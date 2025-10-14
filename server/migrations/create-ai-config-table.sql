-- AI 설정 테이블 생성
-- Admin에서 AI 모델, 비용 전략 등을 관리

USE goldenrace;

-- AI 설정 테이블
DROP TABLE IF EXISTS ai_config;
CREATE TABLE ai_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(50) NOT NULL UNIQUE COMMENT '설정 키 (보통 DEFAULT)',
    
    -- LLM Provider 설정
    llm_provider VARCHAR(20) NOT NULL DEFAULT 'openai' COMMENT 'openai 또는 claude',
    
    -- 모델 설정
    primary_model VARCHAR(50) NOT NULL DEFAULT 'gpt-4-turbo' COMMENT '주 모델',
    fallback_models JSON COMMENT '폴백 모델 리스트 ["gpt-4o", "gpt-4"]',
    
    -- 비용 최적화 전략
    cost_strategy VARCHAR(20) NOT NULL DEFAULT 'balanced' COMMENT 'premium, balanced, budget, hybrid',
    
    -- 모델 파라미터
    temperature DECIMAL(3,2) DEFAULT 0.70 COMMENT '0.0 ~ 1.0',
    max_tokens INT DEFAULT 1000 COMMENT '최대 토큰 수',
    
    -- 캐싱 설정
    enable_caching BOOLEAN DEFAULT TRUE COMMENT '캐싱 활성화 (99% 비용 절감)',
    cache_ttl INT DEFAULT 3600 COMMENT '캐시 TTL (초)',
    
    -- 배치 예측 설정
    enable_batch_prediction BOOLEAN DEFAULT TRUE COMMENT '배치 예측 활성화',
    batch_cron_schedule VARCHAR(50) DEFAULT '0 9 * * *' COMMENT 'Cron 스케줄',
    
    -- 자동 업데이트 설정
    enable_auto_update BOOLEAN DEFAULT TRUE COMMENT '자동 업데이트 활성화',
    update_interval_minutes INT DEFAULT 10 COMMENT '업데이트 간격 (분)',
    odds_change_threshold DECIMAL(5,2) DEFAULT 10.00 COMMENT '배당률 변화 임계값 (%)',
    
    -- 비용 한도
    daily_cost_limit DECIMAL(10,2) DEFAULT 5000.00 COMMENT '일일 비용 한도 (원)',
    monthly_cost_limit DECIMAL(10,2) DEFAULT 100000.00 COMMENT '월간 비용 한도 (원)',
    
    -- 프롬프트 설정
    prompt_version VARCHAR(20) DEFAULT 'v1.0.0' COMMENT '프롬프트 버전',
    system_prompt_template TEXT COMMENT '시스템 프롬프트 템플릿',
    
    -- 관리 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    updated_by VARCHAR(36) COMMENT '수정한 관리자 ID',
    
    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_key (config_key),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 시스템 설정';

-- 기본 설정 삽입
INSERT INTO ai_config (
    config_key,
    llm_provider,
    primary_model,
    fallback_models,
    cost_strategy,
    temperature,
    max_tokens,
    enable_caching,
    cache_ttl,
    enable_batch_prediction,
    batch_cron_schedule,
    enable_auto_update,
    update_interval_minutes,
    odds_change_threshold,
    daily_cost_limit,
    monthly_cost_limit,
    prompt_version
) VALUES (
    'DEFAULT',
    'openai',
    'gpt-4-turbo',
    '["gpt-4o", "gpt-4", "gpt-3.5-turbo"]',
    'balanced',
    0.70,
    1000,
    TRUE,
    3600,
    TRUE,
    '0 9 * * *',
    TRUE,
    10,
    10.00,
    5000.00,
    100000.00,
    'v1.0.0'
);

-- 확인
SELECT * FROM ai_config;

