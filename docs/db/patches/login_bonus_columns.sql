-- Add columns for daily login bonus and consecutive login reward.
-- Run once on existing DB: psql $DATABASE_URL -f docs/db/patches/login_bonus_columns.sql
SET search_path TO oddscast;

ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastDailyBonusAt" TIMESTAMP(3);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastConsecutiveLoginDate" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "consecutiveLoginDays" INTEGER NOT NULL DEFAULT 0;
