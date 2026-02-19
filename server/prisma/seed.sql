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

-- SubscriptionPlan (라이트 / 스탠다드 / 프리미엄) — 1장=500원 기준
INSERT INTO "subscription_plans" ("planName", "displayName", "description", "originalPrice", "vat", "totalPrice", "baseTickets", "bonusTickets", "totalTickets", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('LIGHT', '라이트', '월 10장 예측권 (입문)', 4455, 445, 4900, 10, 0, 10, true, 1, NOW(), NOW()),
('STANDARD', '스탠다드', '월 20장 예측권 (일반)', 9000, 900, 9900, 20, 0, 20, true, 2, NOW(), NOW()),
('PREMIUM', '프리미엄', '월 30장 예측권 (27+3 보너스, 헤비)', 13545, 1355, 14900, 27, 3, 30, true, 3, NOW(), NOW())
ON CONFLICT ("planName") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "description" = EXCLUDED."description",
  "originalPrice" = EXCLUDED."originalPrice",
  "vat" = EXCLUDED."vat",
  "totalPrice" = EXCLUDED."totalPrice",
  "baseTickets" = EXCLUDED."baseTickets",
  "bonusTickets" = EXCLUDED."bonusTickets",
  "totalTickets" = EXCLUDED."totalTickets",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- GlobalConfig (기능 플래그, 개별 구매 설정)
INSERT INTO "global_config" ("key", "value", "updatedAt") VALUES
('show_google_login', 'true', NOW()),
('single_purchase_config', '{"id":"default","configName":"single_purchase","displayName":"예측권 개별 구매","description":"1장 단위 예측권 구매","originalPrice":500,"vat":50,"totalPrice":550,"isActive":true}', NOW())
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
