-- OddsCast Seed Data
-- Apply AFTER schema.sql: psql "$DATABASE_URL" -f docs/db/seed.sql
-- All statements use ON CONFLICT DO NOTHING so re-running is safe.
--
-- NOTE: admin_users password is NOT seeded here.
--       Run setup.sh step [5] or create the admin manually:
--         cd server && node -e "require('bcrypt').hash('admin1234',10).then(h=>{
--           console.log(\"INSERT INTO oddscast.admin_users (\\\"loginId\\\",password,name) VALUES ('admin','\" + h + \"','Administrator') ON CONFLICT DO NOTHING;\")
--         })" | psql "$DATABASE_URL"

SET search_path TO oddscast;

-- ------------------------------------------------------------------
-- Subscription Plans  (LIGHT / STANDARD / PREMIUM)
-- Prices include VAT (부가세 10%). Change via Admin > Plans page.
-- ------------------------------------------------------------------
INSERT INTO "subscription_plans"
  ("planName","displayName","description","originalPrice","vat","totalPrice",
   "baseTickets","bonusTickets","totalTickets","matrixTickets","isActive","sortOrder")
VALUES
  ('LIGHT',   '라이트',   '입문자용 기본 플랜',     4455,  445,  4900,   3, 0,  3, 0, true, 1),
  ('STANDARD','스탠다드', '가장 인기 있는 플랜',    9000,  900,  9900,   7, 0,  7, 1, true, 2),
  ('PREMIUM', '프리미엄', '전문가를 위한 최상위 플랜', 13545, 1355, 14900, 12, 0, 12, 2, true, 3)
ON CONFLICT ("planName") DO NOTHING;

-- ------------------------------------------------------------------
-- Point Configuration
-- BASE_POINTS: base analysis points earned per correct prediction
-- DAILY_LOGIN_BONUS_POINTS: points granted on each daily login
-- ------------------------------------------------------------------
INSERT INTO "point_configs" ("configKey","configValue","description")
VALUES
  ('BASE_POINTS',              '100', 'Base points per correct prediction'),
  ('DAILY_LOGIN_BONUS_POINTS', '10',  'Points awarded on daily login (1/day KST)')
ON CONFLICT ("configKey") DO NOTHING;

-- ------------------------------------------------------------------
-- Point Ticket Price
-- 1200 points = 1 RACE prediction ticket
-- ------------------------------------------------------------------
INSERT INTO "point_ticket_prices" ("pointsPerTicket","isActive","effectiveFrom")
SELECT 1200, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "point_ticket_prices" WHERE "isActive" = true);

-- ------------------------------------------------------------------
-- Global Config
-- kra_base_url_override: leave empty to use built-in KRA API URL
-- ------------------------------------------------------------------
INSERT INTO "global_config" ("key","value")
VALUES
  ('kra_base_url_override',       ''),
  ('signup_bonus_tickets',        '1'),
  ('signup_bonus_expires_days',   '30'),
  ('consecutive_streak_days',     '7'),
  ('consecutive_streak_tickets',  '1'),
  ('consecutive_expires_days',    '30'),
  ('matrix_ticket_price',         '1000')
ON CONFLICT ("key") DO NOTHING;
