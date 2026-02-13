-- ============================================
-- GOLDEN RACE 초기 데이터 (기본 상태)
-- 마이그레이션 없음. schema가 default state.
-- 실행: npm run db:init (prisma db push + seed.sql)
-- ============================================

-- pgcrypto (Admin 비밀번호 bcrypt 해싱용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PointConfig (승식별 포인트 배율)
INSERT INTO "point_configs" ("configKey", "configValue", "description", "createdAt", "updatedAt") VALUES
('BASE_POINTS', '100', '베이스 포인트', NOW(), NOW()),
('SINGLE_MULTIPLIER', '1', '단승식 배율', NOW(), NOW()),
('PLACE_MULTIPLIER', '0.5', '복승식 배율', NOW(), NOW()),
('QUINELLA_MULTIPLIER', '3', '연승식 배율', NOW(), NOW()),
('EXACTA_MULTIPLIER', '6', '쌍승식 배율', NOW(), NOW()),
('QUINELLA_PLACE_MULTIPLIER', '2', '복연승식 배율', NOW(), NOW()),
('TRIFECTA_MULTIPLIER', '10', '삼복승식 배율', NOW(), NOW()),
('TRIPLE_MULTIPLIER', '20', '삼쌍승식 배율', NOW(), NOW())
ON CONFLICT ("configKey") DO NOTHING;

-- PointTicketPrice (1장 = 1200pt)
INSERT INTO "point_ticket_prices" ("pointsPerTicket", "isActive", "effectiveFrom", "effectiveTo", "createdAt", "updatedAt")
SELECT 1200, true, NOW(), NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "point_ticket_prices" LIMIT 1);

-- SubscriptionPlan (LIGHT, PREMIUM)
INSERT INTO "subscription_plans" ("planName", "displayName", "description", "originalPrice", "vat", "totalPrice", "baseTickets", "bonusTickets", "totalTickets", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('LIGHT', '라이트', '주간 5장 예측권', 9900, 990, 10890, 5, 0, 5, true, 1, NOW(), NOW()),
('PREMIUM', '프리미엄', '주간 15장 예측권 (월 2만원)', 19900, 1990, 21890, 15, 3, 18, true, 2, NOW(), NOW())
ON CONFLICT ("planName") DO NOTHING;

-- GlobalConfig (기능 플래그)
INSERT INTO "global_config" ("key", "value", "updatedAt") VALUES
('show_google_login', 'true', NOW())
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW();

-- AdminUser (아이디: admin / 비밀번호: admin1234) — Node bcrypt 해시 사용
-- pgcrypto crypt()는 Node bcrypt와 호환되지 않음
INSERT INTO "admin_users" ("loginId", "password", "name", "isActive", "createdAt", "updatedAt")
VALUES (
  'admin',
  '$2b$10$exDcRqgJE3YbJQrVRUkXaecmtR1FqqG.w/s4A.ZxX7zF./CmgvLQ2',
  'Admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("loginId") DO UPDATE SET
  "password" = EXCLUDED."password",
  "name" = EXCLUDED."name",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();
