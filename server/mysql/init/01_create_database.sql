-- Golden Race 데이터베이스 초기화 스크립트
-- 모든 엔티티와 정확히 일치하는 스키마

-- 데이터베이스 생성 (이미 존재하는 경우 무시)
CREATE DATABASE IF NOT EXISTS goldenrace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 사용
USE goldenrace;

-- 사용자 테이블 (user.entity.ts 기반)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    auth_provider VARCHAR(20) DEFAULT 'google',
    provider_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
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
CREATE TABLE IF NOT EXISTS user_social_auth (
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
CREATE TABLE IF NOT EXISTS refresh_tokens (
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
CREATE TABLE IF NOT EXISTS races (
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

-- 마권 테이블 (bet.entity.ts 기반)
CREATE TABLE IF NOT EXISTS bets (
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
CREATE TABLE IF NOT EXISTS results (
    id VARCHAR(36) PRIMARY KEY,
    race_id VARCHAR(50) NOT NULL,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    rc_name VARCHAR(255) NOT NULL,
    ord VARCHAR(10) NOT NULL,
    hr_name VARCHAR(255) NOT NULL,
    hr_no VARCHAR(20) NOT NULL,
    jk_name VARCHAR(255) NOT NULL,
    jk_no VARCHAR(20) NOT NULL,
    tr_name VARCHAR(255) NOT NULL,
    tr_no VARCHAR(20) NOT NULL,
    ow_name VARCHAR(255) NOT NULL,
    ow_no VARCHAR(20) NOT NULL,
    rc_time VARCHAR(20),
    rc_rank VARCHAR(10),
    rc_prize VARCHAR(20),
    rc_dist VARCHAR(20),
    rc_grade VARCHAR(50),
    rc_condition VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_race_id (race_id),
    INDEX idx_rc_date (rc_date),
    INDEX idx_hr_no (hr_no),
    INDEX idx_ord (ord),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
);

-- 경주계획표 테이블 (race-plan.entity.ts 기반)
CREATE TABLE IF NOT EXISTS race_plans (
    id VARCHAR(36) PRIMARY KEY,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    rc_name VARCHAR(255) NOT NULL,
    rc_dist VARCHAR(20),
    rc_grade VARCHAR(50),
    rc_prize VARCHAR(50),
    rc_condition VARCHAR(100),
    rc_weather VARCHAR(50),
    rc_track VARCHAR(50),
    rc_track_condition VARCHAR(50),
    rc_start_time VARCHAR(20),
    rc_end_time VARCHAR(20),
    rc_day VARCHAR(20),
    rc_weekday VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meet (meet),
    INDEX idx_rc_date (rc_date),
    INDEX idx_rc_no (rc_no)
);

-- 확정배당율 테이블 (dividend-rate.entity.ts 기반)
CREATE TABLE IF NOT EXISTS dividend_rates (
    id VARCHAR(36) PRIMARY KEY,
    race_id VARCHAR(50) NOT NULL,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    win_type VARCHAR(10) NOT NULL,
    win_type_name VARCHAR(50) NOT NULL,
    first_horse_no VARCHAR(20),
    second_horse_no VARCHAR(20),
    third_horse_no VARCHAR(20),
    dividend_rate DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_race_id (race_id),
    INDEX idx_rc_date (rc_date),
    INDEX idx_meet (meet),
    INDEX idx_win_type (win_type),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
);

-- 출전표 상세정보 테이블 (entry-detail.entity.ts 기반)
CREATE TABLE IF NOT EXISTS entry_details (
    id VARCHAR(36) PRIMARY KEY,
    race_id VARCHAR(50) NOT NULL,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    rc_name VARCHAR(255) NOT NULL,
    rc_day VARCHAR(20),
    rc_weekday VARCHAR(20),
    hr_no VARCHAR(20) NOT NULL,
    hr_name VARCHAR(255) NOT NULL,
    jk_name VARCHAR(255) NOT NULL,
    jk_no VARCHAR(20) NOT NULL,
    tr_name VARCHAR(255) NOT NULL,
    tr_no VARCHAR(20) NOT NULL,
    ow_name VARCHAR(255) NOT NULL,
    ow_no VARCHAR(20) NOT NULL,
    rc_dist VARCHAR(20),
    rc_grade VARCHAR(50),
    rc_prize VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_race_id (race_id),
    INDEX idx_rc_date (rc_date),
    INDEX idx_meet (meet),
    INDEX idx_hr_no (hr_no),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
);

-- 사용자 포인트 잔액 테이블 (user-point-balance.entity.ts 기반)
CREATE TABLE IF NOT EXISTS user_point_balances (
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
CREATE TABLE IF NOT EXISTS user_points (
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
CREATE TABLE IF NOT EXISTS race_horse_results (
    id VARCHAR(36) PRIMARY KEY,
    race_id VARCHAR(50) NOT NULL,
    meet VARCHAR(10) NOT NULL,
    meet_name VARCHAR(100) NOT NULL,
    rc_date VARCHAR(20) NOT NULL,
    rc_no VARCHAR(10) NOT NULL,
    ord VARCHAR(10) NOT NULL,
    hr_name VARCHAR(255) NOT NULL,
    hr_no VARCHAR(20) NOT NULL,
    jk_name VARCHAR(255) NOT NULL,
    jk_no VARCHAR(20) NOT NULL,
    tr_name VARCHAR(255) NOT NULL,
    tr_no VARCHAR(20) NOT NULL,
    ow_name VARCHAR(255) NOT NULL,
    ow_no VARCHAR(20) NOT NULL,
    rc_time VARCHAR(20),
    rc_rank VARCHAR(10),
    rc_prize VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_race_id (race_id),
    INDEX idx_rc_date (rc_date),
    INDEX idx_hr_no (hr_no),
    INDEX idx_ord (ord),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
);

-- 알림 테이블 (notifications 모듈용)
CREATE TABLE IF NOT EXISTS notifications (
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

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON goldenrace.* TO 'goldenrace_user'@'%';
FLUSH PRIVILEGES; 