-- ============================================
-- GOLDEN RACE 초기 데이터 (기본 상태)
-- 마이그레이션 없음. schema가 default state.
-- 실행: npm run db:init (prisma db push + seed.sql)
-- ============================================

-- PointConfig (승식별 포인트 배율)
INSERT INTO "point_configs" ("id", "configKey", "configValue", "description", "createdAt", "updatedAt") VALUES
(gen_random_uuid()::text, 'BASE_POINTS', '100', '베이스 포인트', NOW(), NOW()),
(gen_random_uuid()::text, 'SINGLE_MULTIPLIER', '1', '단승식 배율', NOW(), NOW()),
(gen_random_uuid()::text, 'PLACE_MULTIPLIER', '0.5', '복승식 배율', NOW(), NOW()),
(gen_random_uuid()::text, 'QUINELLA_MULTIPLIER', '3', '연승식 배율', NOW(), NOW()),
(gen_random_uuid()::text, 'EXACTA_MULTIPLIER', '6', '쌍승식 배율', NOW(), NOW()),
(gen_random_uuid()::text, 'QUINELLA_PLACE_MULTIPLIER', '2', '복연승식 배율', NOW(), NOW()),
(gen_random_uuid()::text, 'TRIFECTA_MULTIPLIER', '10', '삼복승식 배율', NOW(), NOW()),
(gen_random_uuid()::text, 'TRIPLE_MULTIPLIER', '20', '삼쌍승식 배율', NOW(), NOW())
ON CONFLICT ("configKey") DO NOTHING;

-- PointTicketPrice (1장 = 1200pt)
INSERT INTO "point_ticket_prices" ("id", "pointsPerTicket", "isActive", "effectiveFrom", "effectiveTo", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 1200, true, NOW(), NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "point_ticket_prices" LIMIT 1);

-- SubscriptionPlan (LIGHT, PREMIUM)
INSERT INTO "subscription_plans" ("id", "planName", "displayName", "description", "originalPrice", "vat", "totalPrice", "baseTickets", "bonusTickets", "totalTickets", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
(gen_random_uuid()::text, 'LIGHT', '라이트', '주간 5장 예측권', 9900, 990, 10890, 5, 0, 5, true, 1, NOW(), NOW()),
(gen_random_uuid()::text, 'PREMIUM', '프리미엄', '주간 15장 예측권 (월 2만원)', 19900, 1990, 21890, 15, 3, 18, true, 2, NOW(), NOW())
ON CONFLICT ("planName") DO NOTHING;

-- GlobalConfig (기능 플래그)
INSERT INTO "global_config" ("id", "key", "value", "updatedAt") VALUES
(gen_random_uuid()::text, 'show_google_login', 'true', NOW())
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW();
