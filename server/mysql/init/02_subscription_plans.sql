-- 구독 플랜 테이블 생성 및 초기 데이터 삽입

-- 구독 플랜 테이블 생성
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `plan_id` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `tickets_per_month` int NOT NULL,
  `price_per_ticket` decimal(8,2) NOT NULL,
  `discount_percentage` int DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `is_recommended` tinyint(1) DEFAULT 0,
  `features` json,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기존 데이터 삭제 (있다면)
DELETE FROM `subscription_plans`;

-- 라이트 플랜 데이터 삽입
INSERT INTO `subscription_plans` (
  `plan_id`,
  `name`,
  `description`,
  `price`,
  `tickets_per_month`,
  `price_per_ticket`,
  `discount_percentage`,
  `is_active`,
  `is_recommended`,
  `features`
) VALUES (
  'LIGHT',
  '라이트 구독',
  '가벼운 사용을 위한 기본 플랜',
  9900.00,
  15,
  660.00,
  34,
  1,
  0,
  JSON_ARRAY(
    '월 15장 AI 예측권',
    '장당 660원 (34% 할인)',
    '평균 70%+ 정확도 목표',
    '자동 갱신'
  )
);

-- 프리미엄 플랜 데이터 삽입
INSERT INTO `subscription_plans` (
  `plan_id`,
  `name`,
  `description`,
  `price`,
  `tickets_per_month`,
  `price_per_ticket`,
  `discount_percentage`,
  `is_active`,
  `is_recommended`,
  `features`
) VALUES (
  'PREMIUM',
  '프리미엄 구독',
  '전체 기능을 사용할 수 있는 최고 플랜',
  19800.00,
  35,
  566.00,
  43,
  1,
  1,
  JSON_ARRAY(
    '월 35장 AI 예측권',
    '장당 566원 (43% 할인)',
    '평균 70%+ 정확도 목표',
    '자동 갱신'
  )
);
