-- User 테이블에 푸시 알림 토큰 관련 컬럼 추가
-- 작성일: 2025-10-11

ALTER TABLE `users` 
ADD COLUMN `device_token` TEXT NULL COMMENT 'Expo Push Token' AFTER `role`,
ADD COLUMN `device_platform` VARCHAR(20) NULL COMMENT 'Device Platform (ios/android)' AFTER `device_token`,
ADD COLUMN `token_updated_at` DATETIME NULL COMMENT 'Token 업데이트 시간' AFTER `device_platform`;

-- 인덱스 추가 (푸시 알림 전송 시 성능 향상)
CREATE INDEX `idx_users_device_token` ON `users` (`device_token`(255));
CREATE INDEX `idx_users_device_platform` ON `users` (`device_platform`);

