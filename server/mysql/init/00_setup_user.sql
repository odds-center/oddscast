-- Golden Race MySQL 사용자 설정 스크립트
-- root 권한으로 실행해야 합니다

-- 사용자 생성 및 권한 설정
CREATE USER IF NOT EXISTS 'goldenrace_user'@'%' IDENTIFIED BY 'goldenrace_password';
GRANT ALL PRIVILEGES ON goldenrace.* TO 'goldenrace_user'@'%';
FLUSH PRIVILEGES;
