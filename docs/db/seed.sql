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
  ('LIGHT',   '라이트',   '개별 예측권 10장 + 종합 1장 (18% 할인)',            4455,  445,  4900,  10, 0, 10, 1, true, 1),
  ('STANDARD','스탠다드', '개별 예측권 15장 + 종합 5장 (21% 할인)',           9000,  900,  9900,  15, 0, 15, 5, true, 2),
  ('PREMIUM', '프리미엄', '개별 예측권 30장 + 종합 8장 (35% 할인, 최고 혜택)', 13545, 1355, 14900, 30, 0, 30, 8, true, 3)
ON CONFLICT ("planName") DO NOTHING;

-- ------------------------------------------------------------------
-- Global Config
-- kra_base_url_override: leave empty to use built-in KRA API URL
-- ------------------------------------------------------------------
INSERT INTO "global_config" ("key","value")
VALUES
  ('kra_base_url_override',       ''),
  ('signup_bonus_tickets',        '1'),
  ('signup_bonus_expires_days',   '30'),
  ('matrix_ticket_price',         '1000'),
  ('race_ticket_price',           '500')
ON CONFLICT ("key") DO NOTHING;
