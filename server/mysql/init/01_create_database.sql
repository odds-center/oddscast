-- Golden Race 데이터베이스 초기화 스크립트
-- 모든 엔티티와 정확히 일치하는 스키마

-- 데이터베이스 생성 (이미 존재하는 경우 무시)
CREATE DATABASE IF NOT EXISTS goldenrace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 사용
USE goldenrace;

-- 외래키 체크 비활성화
SET FOREIGN_KEY_CHECKS = 0;

-- 사용자 테이블 (user.entity.ts 기반)
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    auth_provider VARCHAR(20) DEFAULT 'google',
    provider_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at DATETIME,
    role VARCHAR(20) DEFAULT 'user',
    preferences JSON,
    total_bets INT DEFAULT 0,
    won_bets INT DEFAULT 0,
    lost_bets INT DEFAULT 0,
    win_rate DECIMAL(10,2) DEFAULT 0,
    total_winnings DECIMAL(15,0) DEFAULT 0,
    total_losses DECIMAL(15,0) DEFAULT 0,
    roi DECIMAL(10,2) DEFAULT 0,
    betting_level VARCHAR(20) DEFAULT 'BEGINNER',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    profile_bio TEXT,
    achievements JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_provider_id (provider_id),
    INDEX idx_is_active (is_active),
    INDEX idx_auth_provider (auth_provider)
);

-- 사용자 소셜 인증 테이블 (user-social-auth.entity.ts 기반)
DROP TABLE IF EXISTS user_social_auth;
CREATE TABLE user_social_auth (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    name VARCHAR(100),
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    token_expires_at DATETIME,
    raw_data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_provider (user_id, provider),
    UNIQUE KEY idx_provider_id (provider, provider_id),
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- JWT 리프레시 토큰 테이블 (refresh-token.entity.ts 기반)
DROP TABLE IF EXISTS refresh_tokens;
CREATE TABLE refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_token (user_id, token(255)),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_revoked (is_revoked),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 경마 테이블 (race.entity.ts 기반)
DROP TABLE IF EXISTS races;
CREATE TABLE races (
    id VARCHAR(50) PRIMARY KEY,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    rc_name VARCHAR(255) NOT NULL,
    rc_dist VARCHAR(20),
    rc_grade VARCHAR(50),
    rc_condition VARCHAR(20),
    rc_prize DECIMAL(15,0),
    rc_rating_min VARCHAR(20),
    rc_rating_max VARCHAR(20),
    rc_age_condition VARCHAR(20),
    rc_sex_condition VARCHAR(20),
    rc_start_time VARCHAR(20),
    rc_end_time VARCHAR(20),
    rc_day VARCHAR(20),
    rc_weekday VARCHAR(20),
    rc_weather VARCHAR(20),
    rc_track VARCHAR(20),
    rc_track_condition VARCHAR(20),
    rc_prize_2 DECIMAL(15,0),
    rc_prize_3 DECIMAL(15,0),
    rc_prize_4 DECIMAL(15,0),
    rc_prize_5 DECIMAL(15,0),
    rc_prize_bonus1 DECIMAL(15,0),
    rc_prize_bonus2 DECIMAL(15,0),
    rc_prize_bonus3 DECIMAL(15,0),
    rc_remarks TEXT,
    api_version VARCHAR(20) DEFAULT 'API72_2',
    data_source VARCHAR(20) DEFAULT 'KRA',
    total_prize DECIMAL(15,0),
    total_entries INT,
    race_status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meet (meet),
    INDEX idx_rc_date (rc_date),
    INDEX idx_rc_no (rc_no),
    INDEX idx_race_status (race_status)
);

-- 마권 테이블 (bet.entity.ts 기반) - 수정된 필드명
DROP TABLE IF EXISTS bets;
CREATE TABLE bets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    race_id VARCHAR(50) NOT NULL,
    bet_type ENUM('WIN', 'PLACE', 'QUINELLA', 'QUINELLA_PLACE', 'EXACTA', 'TRIFECTA', 'TRIPLE') NOT NULL,
    bet_name VARCHAR(100) NOT NULL,
    bet_description TEXT,
    bet_amount DECIMAL(15,2) NOT NULL,
    potential_win DECIMAL(15,2),
    odds DECIMAL(10,2),
    selections JSON NOT NULL,
    bet_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'WON', 'LOST') DEFAULT 'PENDING',
    bet_result ENUM('PENDING', 'WIN', 'LOSE', 'PARTIAL_WIN', 'VOID') DEFAULT 'PENDING',
    bet_time DATETIME NOT NULL,
    race_time DATETIME,
    result_time DATETIME,
    race_result JSON,
    actual_win DECIMAL(15,2),
    actual_odds DECIMAL(10,2),
    confidence_level DECIMAL(10,2),
    bet_reason TEXT,
    analysis_data JSON,
    api_version VARCHAR(20) DEFAULT '1.0.0',
    data_source VARCHAR(20) DEFAULT 'INTERNAL',
    ip_address VARCHAR(100),
    user_agent VARCHAR(100),
    roi DECIMAL(10,2),
    risk_level VARCHAR(20),
    is_favorite BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_race_id (race_id),
    INDEX idx_bet_status (bet_status),
    INDEX idx_bet_result (bet_result),
    INDEX idx_bet_time (bet_time),
    INDEX idx_bet_type (bet_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
);

-- 경주 결과 테이블 (result.entity.ts 기반)
DROP TABLE IF EXISTS results;
CREATE TABLE results (
    result_id VARCHAR(100) PRIMARY KEY,
    race_id VARCHAR(50) NOT NULL,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    rc_name VARCHAR(255) NOT NULL,
    rc_dist VARCHAR(20) NOT NULL,
    rc_grade VARCHAR(50) NOT NULL,
    rc_condition VARCHAR(20) NOT NULL,
    ord VARCHAR(10) NOT NULL,
    hr_name VARCHAR(255) NOT NULL,
    hr_no VARCHAR(20) NOT NULL,
    hr_name_en VARCHAR(255),
    hr_nationality VARCHAR(20),
    hr_age VARCHAR(10),
    hr_gender VARCHAR(10),
    hr_weight VARCHAR(20),
    hr_rating VARCHAR(20),
    jk_name VARCHAR(255) NOT NULL,
    jk_no VARCHAR(20) NOT NULL,
    jk_name_en VARCHAR(255),
    tr_name VARCHAR(255) NOT NULL,
    tr_no VARCHAR(20) NOT NULL,
    tr_name_en VARCHAR(255),
    ow_name VARCHAR(255) NOT NULL,
    ow_no VARCHAR(20) NOT NULL,
    ow_name_en VARCHAR(255),
    rc_rank VARCHAR(10) NOT NULL,
    rc_time VARCHAR(20) NOT NULL,
    rc_prize DECIMAL(15,0),
    rc_prize_2 DECIMAL(15,0),
    rc_prize_3 DECIMAL(15,0),
    rc_prize_4 DECIMAL(15,0),
    rc_prize_5 DECIMAL(15,0),
    rc_day VARCHAR(20),
    rc_weekday VARCHAR(20),
    rc_age_condition VARCHAR(20),
    rc_sex_condition VARCHAR(20),
    rc_track_condition VARCHAR(20),
    rc_prize_bonus1 DECIMAL(15,0),
    rc_prize_bonus2 DECIMAL(15,0),
    rc_prize_bonus3 DECIMAL(15,0),
    rc_time_400 VARCHAR(20),
    rc_time_600 VARCHAR(20),
    rc_time_800 VARCHAR(20),
    rc_time_1000 VARCHAR(20),
    rc_time_1200 VARCHAR(20),
    rc_time_1400 VARCHAR(20),
    rc_time_1600 VARCHAR(20),
    rc_time_1800 VARCHAR(20),
    rc_time_2000 VARCHAR(20),
    rc_gap VARCHAR(20),
    rc_gap_400 VARCHAR(20),
    rc_gap_600 VARCHAR(20),
    rc_gap_800 VARCHAR(20),
    rc_gap_1000 VARCHAR(20),
    rc_gap_1200 VARCHAR(20),
    rc_gap_1400 VARCHAR(20),
    rc_gap_1600 VARCHAR(20),
    rc_gap_1800 VARCHAR(20),
    rc_gap_2000 VARCHAR(20),
    hr_weight_before VARCHAR(20),
    hr_weight_after VARCHAR(20),
    hr_weight_change VARCHAR(20),
    api_version VARCHAR(20) DEFAULT 'API4_3',
    data_source VARCHAR(20) DEFAULT 'KRA',
    speed_rating DECIMAL(10,2),
    performance_grade VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_race_id (race_id),
    INDEX idx_rc_date (rc_date),
    INDEX idx_hr_no (hr_no),
    INDEX idx_ord (ord),
    INDEX idx_rc_rank (rc_rank)
);

-- 경주계획표 테이블 (race-plan.entity.ts 기반)
DROP TABLE IF EXISTS race_plans;
CREATE TABLE race_plans (
    plan_id VARCHAR(50) PRIMARY KEY,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    rc_name VARCHAR(255) NOT NULL,
    rc_dist VARCHAR(20),
    rc_grade VARCHAR(50),
    rc_prize DECIMAL(15,0),
    rc_condition VARCHAR(100),
    rc_prize_2 DECIMAL(15,0),
    rc_prize_3 DECIMAL(15,0),
    rc_prize_4 DECIMAL(15,0),
    rc_prize_5 DECIMAL(15,0),
    rc_prize_bonus1 DECIMAL(15,0),
    rc_prize_bonus2 DECIMAL(15,0),
    rc_prize_bonus3 DECIMAL(15,0),
    rc_rating_min VARCHAR(20),
    rc_rating_max VARCHAR(20),
    rc_age_condition VARCHAR(20),
    rc_sex_condition VARCHAR(20),
    rc_start_time VARCHAR(20),
    rc_end_time VARCHAR(20),
    rc_day VARCHAR(20),
    rc_weekday VARCHAR(20),
    rc_weather VARCHAR(50),
    rc_track VARCHAR(50),
    rc_track_condition VARCHAR(50),
    rc_remarks TEXT,
    api_version VARCHAR(20) DEFAULT 'API72_2',
    data_source VARCHAR(20) DEFAULT 'KRA',
    total_prize DECIMAL(15,0),
    expected_entries INT,
    plan_status VARCHAR(20) DEFAULT 'DRAFT',
    race_category VARCHAR(20),
    surface_type VARCHAR(20),
    track_condition_forecast VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meet (meet),
    INDEX idx_rc_date (rc_date),
    INDEX idx_rc_no (rc_no)
);

-- 확정배당율 테이블 (dividend-rate.entity.ts 기반)
DROP TABLE IF EXISTS dividend_rates;
CREATE TABLE dividend_rates (
    dividend_id VARCHAR(100) PRIMARY KEY,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    pool VARCHAR(10) NOT NULL,
    pool_name VARCHAR(50) NOT NULL,
    odds DECIMAL(10,2),
    chul_no VARCHAR(20),
    chul_no2 VARCHAR(20),
    chul_no3 VARCHAR(20),
    race_name VARCHAR(100),
    race_distance VARCHAR(20),
    race_grade VARCHAR(50),
    race_condition VARCHAR(20),
    weather VARCHAR(20),
    track VARCHAR(20),
    track_condition VARCHAR(20),
    total_entries INT,
    winning_combinations INT,
    api_version VARCHAR(20) DEFAULT 'API160_1',
    data_source VARCHAR(20) DEFAULT 'KRA',
    race_id VARCHAR(50),
    implied_probability DECIMAL(10,2),
    profit_margin VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meet (meet),
    INDEX idx_rc_date (rc_date),
    INDEX idx_pool (pool),
    INDEX idx_race_id (race_id)
);

-- 출전표 상세정보 테이블 (entry-detail.entity.ts 기반)
DROP TABLE IF EXISTS entry_details;
CREATE TABLE entry_details (
    entry_id VARCHAR(100) PRIMARY KEY,
    race_id VARCHAR(50) NOT NULL,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    rc_name VARCHAR(255) NOT NULL,
    rc_day VARCHAR(20),
    rc_weekday VARCHAR(20),
    rc_dist VARCHAR(20),
    rc_grade VARCHAR(50),
    rc_prize DECIMAL(15,0),
    hr_no VARCHAR(20) NOT NULL,
    hr_name VARCHAR(255) NOT NULL,
    hr_name_en VARCHAR(255),
    hr_nationality VARCHAR(20),
    hr_age VARCHAR(10),
    hr_gender VARCHAR(10),
    hr_weight VARCHAR(20),
    hr_rating VARCHAR(20),
    hr_weight_before VARCHAR(20),
    hr_weight_after VARCHAR(20),
    hr_weight_change VARCHAR(20),
    jk_name VARCHAR(255) NOT NULL,
    jk_no VARCHAR(20) NOT NULL,
    jk_name_en VARCHAR(255),
    tr_name VARCHAR(255) NOT NULL,
    tr_no VARCHAR(20) NOT NULL,
    tr_name_en VARCHAR(255),
    ow_name VARCHAR(255) NOT NULL,
    ow_no VARCHAR(20) NOT NULL,
    ow_name_en VARCHAR(255),
    entry_number VARCHAR(10) NOT NULL,
    post_position VARCHAR(20),
    entry_status VARCHAR(20) DEFAULT 'CONFIRMED',
    entry_time VARCHAR(20),
    last_race_date VARCHAR(20),
    last_race_no VARCHAR(20),
    last_race_rank VARCHAR(20),
    last_race_time VARCHAR(20),
    last_race_rating VARCHAR(20),
    total_starts INT,
    total_wins INT,
    total_places INT,
    total_win_rate DECIMAL(5,2),
    total_place_rate DECIMAL(5,2),
    total_prize DECIMAL(15,0),
    year_starts INT,
    year_wins INT,
    year_places INT,
    year_win_rate DECIMAL(5,2),
    year_place_rate DECIMAL(5,2),
    year_prize DECIMAL(15,0),
    half_year_prize DECIMAL(15,0),
    api_version VARCHAR(20) DEFAULT 'API15_2',
    data_source VARCHAR(20) DEFAULT 'KRA',
    form_rating VARCHAR(20),
    speed_rating DECIMAL(10,2),
    class_rating VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_race_id (race_id),
    INDEX idx_rc_date (rc_date),
    INDEX idx_meet (meet),
    INDEX idx_hr_no (hr_no),
    INDEX idx_entry_number (entry_number)
);

-- 사용자 포인트 잔액 테이블 (user-point-balance.entity.ts 기반) - 수정된 필드들
DROP TABLE IF EXISTS user_point_balances;
CREATE TABLE user_point_balances (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    current_balance DECIMAL(15,2) DEFAULT 0,
    total_earned DECIMAL(15,2) DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    total_bonus DECIMAL(15,2) DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    api_version VARCHAR(20) DEFAULT '1.0.0',
    data_source VARCHAR(50) DEFAULT 'INTERNAL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 사용자 포인트 거래내역 테이블 (user-points.entity.ts 기반)
DROP TABLE IF EXISTS user_points;
CREATE TABLE user_points (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    transaction_type ENUM('EARN', 'SPEND', 'BONUS', 'REFUND', 'ADJUSTMENT', 'BET_PLACED', 'BET_WON', 'BET_LOST', 'SIGNUP_BONUS', 'DAILY_LOGIN', 'REFERRAL_BONUS', 'EVENT_BONUS', 'ADMIN_ADJUSTMENT', 'WITHDRAWAL', 'EXPIRY') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(36),
    reference_type VARCHAR(50),
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'ACTIVE', 'EXPIRED') DEFAULT 'PENDING',
    metadata JSON,
    transaction_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_transaction_time (transaction_time),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 경마 결과 (race-horse-result.entity.ts 기반)
DROP TABLE IF EXISTS race_horse_results;
CREATE TABLE race_horse_results (
    result_id VARCHAR(100) PRIMARY KEY,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    hr_name VARCHAR(255) NOT NULL,
    hr_number VARCHAR(20) NOT NULL,
    hr_origin VARCHAR(100),
    hr_sex VARCHAR(10),
    hr_age VARCHAR(10),
    hr_debut_date VARCHAR(20),
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    rc_rank VARCHAR(10) NOT NULL,
    rc_time VARCHAR(20) NOT NULL,
    rc_weight VARCHAR(20),
    rc_rating VARCHAR(20),
    rc_horse_weight VARCHAR(20),
    rc_name VARCHAR(255),
    rc_burden_type VARCHAR(20),
    rc_grade VARCHAR(50),
    rc_distance VARCHAR(20),
    total_starts INT,
    total_wins INT,
    total_places INT,
    total_win_rate DECIMAL(5,2),
    total_place_rate DECIMAL(5,2),
    total_prize DECIMAL(15,0),
    year_starts INT,
    year_wins INT,
    year_places INT,
    year_win_rate DECIMAL(5,2),
    year_place_rate DECIMAL(5,2),
    year_prize DECIMAL(15,0),
    half_year_prize DECIMAL(15,0),
    rc_jockey VARCHAR(255),
    rc_trainer VARCHAR(255),
    rc_owner VARCHAR(255),
    rc_weather VARCHAR(20),
    rc_track VARCHAR(20),
    rc_track_condition VARCHAR(20),
    api_version VARCHAR(20) DEFAULT 'API15_2',
    data_source VARCHAR(20) DEFAULT 'KRA',
    performance_grade VARCHAR(20),
    speed_rating DECIMAL(10,2),
    form_rating VARCHAR(20),
    class_rating VARCHAR(20),
    age_group VARCHAR(20),
    consistency_rating DECIMAL(10,2),
    improvement_trend VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meet (meet),
    INDEX idx_rc_date (rc_date),
    INDEX idx_hr_number (hr_number),
    INDEX idx_rc_rank (rc_rank)
);

-- AI 예측 테이블 (prediction.entity.ts 기반)
DROP TABLE IF EXISTS predictions;
CREATE TABLE predictions (
    id VARCHAR(36) PRIMARY KEY,
    race_id VARCHAR(36) NOT NULL,
    
    -- 예측 결과
    first_place INT NOT NULL COMMENT '1위 예측 마번',
    second_place INT NOT NULL COMMENT '2위 예측 마번',
    third_place INT NOT NULL COMMENT '3위 예측 마번',
    
    -- 분석 내용
    analysis TEXT NOT NULL COMMENT '예측 분석 내용',
    confidence DECIMAL(5,2) NOT NULL COMMENT '신뢰도 (0-100)',
    warnings JSON COMMENT '주의사항 목록',
    
    -- LLM 메타데이터
    llm_model VARCHAR(50) NOT NULL COMMENT 'LLM 모델명',
    input_tokens INT NOT NULL COMMENT '입력 토큰 수',
    output_tokens INT NOT NULL COMMENT '출력 토큰 수',
    total_tokens INT NOT NULL COMMENT '총 토큰 수',
    llm_cost DECIMAL(10,2) NOT NULL COMMENT '비용 (KRW)',
    response_time INT NOT NULL COMMENT '응답 시간 (ms)',
    
    -- 정확도 검증 (경주 종료 후)
    is_accurate BOOLEAN COMMENT '예측 정확 여부',
    accuracy_score DECIMAL(5,2) COMMENT '정확도 점수',
    
    -- 실제 결과 (검증용)
    actual_first_place INT COMMENT '실제 1위',
    actual_second_place INT COMMENT '실제 2위',
    actual_third_place INT COMMENT '실제 3위',
    
    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_race_id_created (race_id, created_at),
    INDEX idx_race_id (race_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_accurate (is_accurate),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
);

-- 구독 테이블 (subscription.entity.ts 기반)
DROP TABLE IF EXISTS subscriptions;
CREATE TABLE subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- 구독 정보
    plan_id ENUM('PREMIUM') DEFAULT 'PREMIUM' COMMENT '구독 플랜',
    price DECIMAL(10,2) DEFAULT 19800.00 COMMENT '구독료',
    
    -- 상태
    status ENUM('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED') DEFAULT 'PENDING',
    
    -- 결제 정보
    billing_key VARCHAR(100) COMMENT 'Toss Payments 빌링키',
    next_billing_date DATE COMMENT '다음 결제일',
    last_billed_at DATETIME COMMENT '마지막 결제일',
    
    -- 타임스탬프
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '구독 시작일',
    cancelled_at DATETIME COMMENT '구독 취소일',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_next_billing (next_billing_date, status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 예측권 테이블 (prediction-ticket.entity.ts 기반)
DROP TABLE IF EXISTS prediction_tickets;
CREATE TABLE prediction_tickets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    subscription_id VARCHAR(36) COMMENT '구독 ID (구독으로 발급된 경우)',
    
    -- 상태
    status ENUM('AVAILABLE', 'USED', 'EXPIRED') DEFAULT 'AVAILABLE',
    
    -- 사용 정보
    used_at DATETIME COMMENT '사용 시간',
    race_id VARCHAR(36) COMMENT '사용한 경주 ID',
    prediction_id VARCHAR(36) COMMENT '생성된 예측 ID',
    
    -- 유효 기간
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '발급 시간',
    expires_at DATETIME NOT NULL COMMENT '만료 시간',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_status (expires_at, status),
    INDEX idx_subscription_id (subscription_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE SET NULL
);

-- 개별 구매 테이블 (single-purchase.entity.ts 기반)
DROP TABLE IF EXISTS single_purchases;
CREATE TABLE single_purchases (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ticket_id VARCHAR(36) NOT NULL,
    
    -- 결제 정보
    amount DECIMAL(10,2) DEFAULT 1000.00 COMMENT '구매 금액',
    pg_transaction_id VARCHAR(100) COMMENT 'PG사 거래 ID',
    payment_method VARCHAR(20) COMMENT '결제 수단',
    
    -- 상태
    status ENUM('SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'SUCCESS',
    
    -- 타임스탬프
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_purchased (user_id, purchased_at),
    INDEX idx_user_id (user_id),
    INDEX idx_purchased_at (purchased_at),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES prediction_tickets(id) ON DELETE CASCADE
);

-- 결제 테이블 (payment.entity.ts 기반)
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- 주문 정보
    order_id VARCHAR(100) NOT NULL UNIQUE COMMENT '주문 ID',
    order_name VARCHAR(200) NOT NULL COMMENT '주문명',
    amount DECIMAL(10,2) NOT NULL COMMENT '결제 금액',
    payment_method ENUM('CARD', 'VIRTUAL_ACCOUNT', 'TRANSFER', 'MOBILE', 'KAKAOPAY', 'NAVERPAY', 'TOSSPAY') DEFAULT 'CARD',
    
    -- PG사 정보 (Toss)
    payment_key VARCHAR(200) COMMENT 'Toss 결제 키',
    pg_transaction_id VARCHAR(100) UNIQUE COMMENT 'PG사 거래 ID',
    receipt_url VARCHAR(100) COMMENT '영수증 URL',
    
    -- 상태
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
    
    -- 취소/환불 정보
    cancelled_amount DECIMAL(10,2) COMMENT '취소 금액',
    cancel_reason VARCHAR(255) COMMENT '취소 사유',
    cancelled_at DATETIME COMMENT '취소 시간',
    
    -- 메타데이터
    metadata JSON COMMENT '추가 정보',
    
    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_pg_transaction_id (pg_transaction_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 빌링키 테이블 (billing-key.entity.ts 기반)
DROP TABLE IF EXISTS billing_keys;
CREATE TABLE billing_keys (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- 빌링키 정보 (Toss)
    billing_key VARCHAR(200) NOT NULL UNIQUE COMMENT 'Toss 빌링키',
    customer_key VARCHAR(100) NOT NULL COMMENT '고객 키',
    
    -- 카드 정보
    card_number VARCHAR(50) COMMENT '카드 번호 (마스킹)',
    card_company VARCHAR(50) COMMENT '카드사',
    card_type VARCHAR(20) COMMENT '카드 타입',
    
    -- 상태
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_at DATETIME COMMENT '비활성화 시간',
    
    -- 타임스탬프
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_billing_key (billing_key),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 알림 테이블 (notifications 모듈용)
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('GENERAL', 'BETTING', 'SYSTEM', 'PROMOTION') DEFAULT 'GENERAL',
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
    status ENUM('UNREAD', 'READ', 'ARCHIVED', 'DELETED') DEFAULT 'UNREAD',
    category VARCHAR(50),
    data JSON,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 즐겨찾기 테이블 (favorite.entity.ts 기반)
DROP TABLE IF EXISTS favorites;
CREATE TABLE favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('RACE', 'HORSE', 'JOCKEY', 'TRAINER', 'MEET') NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    target_name VARCHAR(255) NOT NULL,
    target_data JSON,
    notes TEXT,
    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    tags JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_type_target (user_id, type, target_id),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_target_id (target_id),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 사용자 랭킹 테이블
DROP TABLE IF EXISTS user_rankings;
CREATE TABLE user_rankings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ranking_type ENUM('OVERALL', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    rank_position INT NOT NULL,
    score DECIMAL(15,2) NOT NULL,
    total_bets INT DEFAULT 0,
    won_bets INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_winnings DECIMAL(15,0) DEFAULT 0,
    roi DECIMAL(10,2) DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_type_period (user_id, ranking_type, period_start),
    INDEX idx_ranking_type (ranking_type),
    INDEX idx_rank_position (rank_position),
    INDEX idx_period (period_start, period_end),
    INDEX idx_score (score DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 공개 베팅 내역 테이블 (다른 사용자들이 볼 수 있는 베팅)
DROP TABLE IF EXISTS public_bets;
CREATE TABLE public_bets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    bet_id VARCHAR(36) NOT NULL,
    race_id VARCHAR(100) NOT NULL,
    race_name VARCHAR(200) NOT NULL,
    bet_type VARCHAR(50) NOT NULL,
    bet_amount DECIMAL(15,0) NOT NULL,
    selected_horses JSON NOT NULL,
    odds DECIMAL(8,2),
    result ENUM('PENDING', 'WIN', 'LOSE', 'PARTIAL_WIN', 'VOID') DEFAULT 'PENDING',
    winnings DECIMAL(15,0) DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    visibility ENUM('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE') DEFAULT 'PUBLIC',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_bet_id (bet_id),
    INDEX idx_race_id (race_id),
    INDEX idx_is_public (is_public),
    INDEX idx_visibility (visibility),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_result (result),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bet_id) REFERENCES bets(id) ON DELETE CASCADE
);

-- 베팅 좋아요 테이블
DROP TABLE IF EXISTS bet_likes;
CREATE TABLE bet_likes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    public_bet_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_bet (user_id, public_bet_id),
    INDEX idx_public_bet_id (public_bet_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (public_bet_id) REFERENCES public_bets(id) ON DELETE CASCADE
);

-- 베팅 댓글 테이블
DROP TABLE IF EXISTS bet_comments;
CREATE TABLE bet_comments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    public_bet_id VARCHAR(36) NOT NULL,
    parent_comment_id VARCHAR(36),
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_public_bet_id (public_bet_id),
    INDEX idx_parent_comment_id (parent_comment_id),
    INDEX idx_created_at (created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (public_bet_id) REFERENCES public_bets(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES bet_comments(id) ON DELETE CASCADE
);

-- 사용자 팔로우 테이블
DROP TABLE IF EXISTS user_follows;
CREATE TABLE user_follows (
    id VARCHAR(36) PRIMARY KEY,
    follower_id VARCHAR(36) NOT NULL,
    following_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_follower_following (follower_id, following_id),
    INDEX idx_follower_id (follower_id),
    INDEX idx_following_id (following_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 외래키 체크 다시 활성화
SET FOREIGN_KEY_CHECKS = 1;