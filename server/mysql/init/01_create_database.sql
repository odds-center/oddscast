-- Golden Race 데이터베이스 초기화 스크립트

-- 데이터베이스 생성 (이미 존재하는 경우 무시)
CREATE DATABASE IF NOT EXISTS goldenrace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 사용
USE goldenrace;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    avatar VARCHAR(500),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    provider VARCHAR(50) DEFAULT 'google',
    google_id VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),
    last_login_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    locale VARCHAR(20) DEFAULT 'ko',
    timezone VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id),
    INDEX idx_is_active (is_active)
);

-- 경마 테이블
CREATE TABLE IF NOT EXISTS races (
    id VARCHAR(50) PRIMARY KEY,
    race_number INT NOT NULL,
    race_name VARCHAR(255) NOT NULL,
    date DATETIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_venue (venue),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 경마 결과 테이블
CREATE TABLE IF NOT EXISTS results (
    result_id VARCHAR(100) PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    INDEX idx_race_id (race_id),
    INDEX idx_date (rc_date),
    INDEX idx_hr_no (hr_no)
);

-- 경주계획표 테이블
CREATE TABLE IF NOT EXISTS race_plans (
    plan_id VARCHAR(50) PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (rc_date),
    INDEX idx_meet (meet)
);

-- 확정배당율 테이블
CREATE TABLE IF NOT EXISTS dividend_rates (
    dividend_id VARCHAR(100) PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (rc_date),
    INDEX idx_meet (meet),
    INDEX idx_win_type (win_type)
);

-- 출전표 상세정보 테이블
CREATE TABLE IF NOT EXISTS entry_details (
    entry_id VARCHAR(100) PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (rc_date),
    INDEX idx_meet (meet),
    INDEX idx_hr_no (hr_no)
);

-- API 상태 테이블
CREATE TABLE IF NOT EXISTS api_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    is_available BOOLEAN NOT NULL,
    last_check TIMESTAMP NOT NULL,
    response_time INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 샘플 사용자 데이터 삽입 (테스트용)
INSERT IGNORE INTO users (id, email, name, google_id, locale) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', '테스트 사용자', 'test_google_id_123', 'ko');

-- 샘플 경마 데이터 삽입
INSERT IGNORE INTO races (id, race_number, race_name, date, venue, created_by) VALUES
('1_20241201_1', 1, '3세 이상 1200m', '2024-12-01 14:00:00', '서울', '550e8400-e29b-41d4-a716-446655440000'),
('1_20241201_2', 2, '3세 이상 1400m', '2024-12-01 14:30:00', '서울', '550e8400-e29b-41d4-a716-446655440000'),
('1_20241201_3', 3, '3세 이상 1600m', '2024-12-01 15:00:00', '서울', '550e8400-e29b-41d4-a716-446655440000');

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON goldenrace.* TO 'goldenrace_user'@'%';
FLUSH PRIVILEGES; 