-- =============================================================================
-- OddsCast 전체 DB DDL — idempotent (여러 번 실행해도 테이블/타입 중복 생성 없음)
-- =============================================================================
-- 스키마: oddscast. 적용: ./scripts/setup.sh 또는 psql로 이 파일 실행.
-- 상세: docs/db/README.md
--
-- 구조: ENUM(타입) → 테이블(PK + UNIQUE 제약 포함) → 일반 인덱스 → FK
-- - ENUM은 PostgreSQL에서 테이블보다 먼저 정의해야 함.
-- - UNIQUE 인덱스는 테이블 정의의 CONSTRAINT ... UNIQUE 로 생성 (테이블 생성 시 함께 생성).
-- - 일반 인덱스(non-unique)는 PG 문법상 CREATE INDEX 로만 가능.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS oddscast;
SET search_path TO oddscast;

-- Enum types (must exist before tables that reference them)
DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RaceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TicketStatus" AS ENUM ('AVAILABLE', 'USED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TicketType" AS ENUM ('RACE', 'MATRIX'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'RACE', 'PREDICTION', 'PROMOTION', 'SUBSCRIPTION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "NotificationCategory" AS ENUM ('GENERAL', 'URGENT', 'INFO', 'MARKETING'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FavoriteType" AS ENUM ('HORSE', 'JOCKEY', 'TRAINER', 'RACE', 'MEET'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FavoritePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'FAILED', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PickType" AS ENUM ('SINGLE', 'PLACE', 'QUINELLA', 'EXACTA', 'QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BatchScheduleStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "kakaoId" TEXT,
    "nickname" TEXT NOT NULL DEFAULT '사용자',
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "favoriteMeet" TEXT,
    "hasSeenOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "completedTours" TEXT[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);
-- Migration helpers: add new columns if upgrading from older schema
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "completedTours" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kakaoId" TEXT;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_kakaoId" ON "users" ("kakaoId") WHERE "kakaoId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "weekly_previews" (
    "id" SERIAL NOT NULL,
    "weekLabel" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "weekly_previews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "weekly_previews_weekLabel_key" UNIQUE ("weekLabel")
);

CREATE TABLE IF NOT EXISTS "user_daily_fortunes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "messageOverall" TEXT NOT NULL,
    "messageRace" TEXT NOT NULL,
    "messageAdvice" TEXT NOT NULL,
    "luckyNumbers" JSONB NOT NULL,
    "luckyColor" TEXT NOT NULL,
    "luckyColorHex" TEXT,
    "keyword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_daily_fortunes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_daily_fortunes_userId_date_key" UNIQUE ("userId", "date")
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "password_reset_tokens_token_key" UNIQUE ("token")
);

CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "email_verification_tokens_token_key" UNIQUE ("token")
);

CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" SERIAL NOT NULL,
    "loginId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_users_loginId_key" UNIQUE ("loginId")
);

CREATE TABLE IF NOT EXISTS "races" (
    "id" SERIAL NOT NULL,
    "rcName" TEXT,
    "meet" TEXT NOT NULL,
    "meetName" TEXT,
    "rcDate" TEXT NOT NULL,
    "rcDay" TEXT,
    "rcNo" TEXT NOT NULL,
    "stTime" TEXT,
    "rcDist" TEXT,
    "rank" TEXT,
    "rcCondition" TEXT,
    "rcPrize" INTEGER,
    "weather" TEXT,
    "track" TEXT,
    "status" "RaceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "races_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "races_meet_rcDate_rcNo_key" UNIQUE ("meet", "rcDate", "rcNo")
);

CREATE TABLE IF NOT EXISTS "race_entries" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "hrNo" TEXT NOT NULL,
    "hrName" TEXT NOT NULL,
    "hrNameEn" TEXT,
    "jkNo" TEXT,
    "jkName" TEXT NOT NULL,
    "jkNameEn" TEXT,
    "trNo" TEXT,
    "trName" TEXT,
    "owNo" TEXT,
    "owName" TEXT,
    "wgBudam" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "chulNo" TEXT,
    "dusu" INTEGER,
    "sex" TEXT,
    "age" INTEGER,
    "prd" TEXT,
    "chaksun1" INTEGER,
    "chaksunT" BIGINT,
    "rcCntT" INTEGER,
    "ord1CntT" INTEGER,
    "budam" TEXT,
    "ratingHistory" JSONB,
    "recentRanks" JSONB,
    "trainingData" JSONB,
    "equipment" TEXT,
    "horseWeight" TEXT,
    "bleedingInfo" JSONB,
    "isScratched" BOOLEAN NOT NULL DEFAULT false,
    "sectionalStats" JSONB,
    CONSTRAINT "race_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "trainings" (
    "id" SERIAL NOT NULL,
    "raceEntryId" INTEGER,
    "horseNo" TEXT NOT NULL,
    "trDate" TEXT NOT NULL,
    "trTime" TEXT,
    "trEndTime" TEXT,
    "trDuration" TEXT,
    "trContent" TEXT,
    "trType" TEXT,
    "managerType" TEXT,
    "managerName" TEXT,
    "place" TEXT,
    "weather" TEXT,
    "trackCondition" TEXT,
    "course" TEXT,
    "intensity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "race_results" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "ord" TEXT,
    "ordInt" INTEGER,
    "ordType" TEXT,
    "hrNo" TEXT NOT NULL,
    "hrName" TEXT NOT NULL,
    "chulNo" TEXT,
    "age" TEXT,
    "sex" TEXT,
    "jkNo" TEXT,
    "jkName" TEXT,
    "trName" TEXT,
    "owName" TEXT,
    "wgBudam" DOUBLE PRECISION,
    "wgHr" TEXT,
    "hrTool" TEXT,
    "rcTime" TEXT,
    "diffUnit" TEXT,
    "winOdds" DOUBLE PRECISION,
    "plcOdds" DOUBLE PRECISION,
    "track" TEXT,
    "weather" TEXT,
    "chaksun1" INTEGER,
    "sectionalTimes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "race_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "race_dividends" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "pool" TEXT NOT NULL,
    "poolName" TEXT NOT NULL,
    "chulNo" TEXT NOT NULL,
    "chulNo2" TEXT NOT NULL DEFAULT '',
    "chulNo3" TEXT NOT NULL DEFAULT '',
    "odds" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "race_dividends_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "race_dividends_unique" UNIQUE ("raceId", "pool", "chulNo", "chulNo2", "chulNo3")
);

CREATE TABLE IF NOT EXISTS "jockey_results" (
    "id" SERIAL NOT NULL,
    "meet" TEXT NOT NULL,
    "jkNo" TEXT NOT NULL,
    "jkName" TEXT NOT NULL,
    "rcCntT" INTEGER NOT NULL,
    "ord1CntT" INTEGER NOT NULL,
    "ord2CntT" INTEGER NOT NULL,
    "ord3CntT" INTEGER NOT NULL,
    "winRateTsum" DOUBLE PRECISION NOT NULL,
    "quRateTsum" DOUBLE PRECISION NOT NULL,
    "chaksunT" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jockey_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "jockey_results_meet_jkNo_key" UNIQUE ("meet", "jkNo")
);

CREATE TABLE IF NOT EXISTS "trainer_results" (
    "id" SERIAL NOT NULL,
    "meet" TEXT NOT NULL,
    "trNo" TEXT NOT NULL,
    "trName" TEXT NOT NULL,
    "rcCntT" INTEGER NOT NULL,
    "ord1CntT" INTEGER NOT NULL,
    "ord2CntT" INTEGER NOT NULL,
    "ord3CntT" INTEGER NOT NULL,
    "winRateTsum" DOUBLE PRECISION NOT NULL,
    "quRateTsum" DOUBLE PRECISION NOT NULL,
    "plRateTsum" DOUBLE PRECISION,
    "rcCntY" INTEGER,
    "ord1CntY" INTEGER,
    "ord2CntY" INTEGER,
    "ord3CntY" INTEGER,
    "winRateY" DOUBLE PRECISION,
    "quRateY" DOUBLE PRECISION,
    "plRateY" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trainer_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "trainer_results_meet_trNo_key" UNIQUE ("meet", "trNo")
);

CREATE TABLE IF NOT EXISTS "predictions" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "scores" JSONB,
    "analysis" TEXT,
    "preview" TEXT,
    "previewApproved" BOOLEAN NOT NULL DEFAULT false,
    "accuracy" DOUBLE PRECISION,
    "postRaceSummary" TEXT,
    "entriesHash" TEXT,
    "status" "PredictionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- Index for prediction cache lookup: raceId + entriesHash
CREATE INDEX IF NOT EXISTS "idx_predictions_raceId_entriesHash"
    ON "predictions" ("raceId", "entriesHash")
    WHERE "status" = 'COMPLETED' AND "entriesHash" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "prediction_tickets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subscriptionId" INTEGER,
    "predictionId" INTEGER,
    "raceId" INTEGER,
    "type" "TicketType" NOT NULL DEFAULT 'RACE',
    "status" "TicketStatus" NOT NULL DEFAULT 'AVAILABLE',
    "usedAt" TIMESTAMP(3),
    "matrixDate" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prediction_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "subscription_plans" (
    "id" SERIAL NOT NULL,
    "planName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "originalPrice" INTEGER NOT NULL,
    "vat" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "baseTickets" INTEGER NOT NULL,
    "bonusTickets" INTEGER NOT NULL DEFAULT 0,
    "totalTickets" INTEGER NOT NULL,
    "matrixTickets" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_plans_planName_key" UNIQUE ("planName")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "customerKey" TEXT,
    "billingKey" TEXT,
    "nextBillingDate" TIMESTAMP(3),
    "lastBilledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "push_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "push_tokens_userId_token_key" UNIQUE ("userId", "token")
);

CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "raceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "predictionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "systemEnabled" BOOLEAN NOT NULL DEFAULT true,
    "promotionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_notification_preferences_userId_key" UNIQUE ("userId")
);

CREATE TABLE IF NOT EXISTS "favorites" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "FavoriteType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetData" JSONB,
    "memo" TEXT,
    "priority" "FavoritePriority" NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notificationsOn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "favorites_userId_type_targetId_key" UNIQUE ("userId", "type", "targetId")
);

CREATE TABLE IF NOT EXISTS "billing_histories" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "billingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCESS',
    "pgProvider" TEXT,
    "pgTransactionId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_histories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "single_purchases" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "pgTransactionId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "single_purchases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_picks" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "raceId" INTEGER NOT NULL,
    "pickType" "PickType" NOT NULL DEFAULT 'SINGLE',
    "hrNos" TEXT[],
    "hrNames" TEXT[],
    "pointsAwarded" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_picks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_picks_userId_raceId_key" UNIQUE ("userId", "raceId")
);

CREATE TABLE IF NOT EXISTS "kra_sync_logs" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT NOT NULL,
    "meet" TEXT,
    "rcDate" TEXT,
    "status" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kra_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "batch_schedules" (
    "id" SERIAL NOT NULL,
    "jobType" TEXT NOT NULL,
    "targetRcDate" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "BatchScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_activity_logs" (
    "id" SERIAL NOT NULL,
    "adminUserId" INTEGER,
    "adminEmail" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_activity_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "sessionId" TEXT,
    "event" TEXT NOT NULL,
    "page" TEXT,
    "target" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "global_config" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "global_config_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "global_config_key_key" UNIQUE ("key")
);

CREATE TABLE IF NOT EXISTS "race_analysis_cache" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "analysisType" TEXT NOT NULL,
    "dataHash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "race_analysis_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "race_analysis_cache_raceId_analysisType_key" UNIQUE ("raceId", "analysisType")
);

-- Non-unique indexes (PostgreSQL has no inline syntax for these in CREATE TABLE)
CREATE INDEX IF NOT EXISTS "idx_race_analysis_cache_raceId_type" ON "race_analysis_cache" ("raceId", "analysisType");
CREATE INDEX IF NOT EXISTS "trainings_horseNo_idx" ON "trainings"("horseNo");
CREATE INDEX IF NOT EXISTS "trainings_trDate_idx" ON "trainings"("trDate");
CREATE INDEX IF NOT EXISTS "kra_sync_logs_endpoint_rcDate_idx" ON "kra_sync_logs"("endpoint", "rcDate");
CREATE INDEX IF NOT EXISTS "kra_sync_logs_createdAt_idx" ON "kra_sync_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "batch_schedules_status_scheduledAt_idx" ON "batch_schedules"("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "batch_schedules_jobType_targetRcDate_idx" ON "batch_schedules"("jobType", "targetRcDate");
CREATE INDEX IF NOT EXISTS "admin_activity_logs_adminUserId_idx" ON "admin_activity_logs"("adminUserId");
CREATE INDEX IF NOT EXISTS "admin_activity_logs_action_idx" ON "admin_activity_logs"("action");
CREATE INDEX IF NOT EXISTS "admin_activity_logs_createdAt_idx" ON "admin_activity_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "user_activity_logs_userId_idx" ON "user_activity_logs"("userId");
CREATE INDEX IF NOT EXISTS "user_activity_logs_event_idx" ON "user_activity_logs"("event");
CREATE INDEX IF NOT EXISTS "user_activity_logs_createdAt_idx" ON "user_activity_logs"("createdAt");

-- AddForeignKey (idempotent: add only if constraint does not exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'user_daily_fortunes_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "user_daily_fortunes" ADD CONSTRAINT "user_daily_fortunes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'password_reset_tokens_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'email_verification_tokens_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'race_entries_raceId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "race_entries" ADD CONSTRAINT "race_entries_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'trainings_raceEntryId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "trainings" ADD CONSTRAINT "trainings_raceEntryId_fkey" FOREIGN KEY ("raceEntryId") REFERENCES "race_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'race_results_raceId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "race_results" ADD CONSTRAINT "race_results_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'race_dividends_raceId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "race_dividends" ADD CONSTRAINT "race_dividends_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'predictions_raceId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "predictions" ADD CONSTRAINT "predictions_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'prediction_tickets_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "prediction_tickets" ADD CONSTRAINT "prediction_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'prediction_tickets_subscriptionId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "prediction_tickets" ADD CONSTRAINT "prediction_tickets_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'prediction_tickets_predictionId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "prediction_tickets" ADD CONSTRAINT "prediction_tickets_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'subscriptions_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'subscriptions_planId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'notifications_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'push_tokens_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'user_notification_preferences_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'favorites_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'billing_histories_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "billing_histories" ADD CONSTRAINT "billing_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'single_purchases_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "single_purchases" ADD CONSTRAINT "single_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'user_picks_userId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "user_picks" ADD CONSTRAINT "user_picks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'user_picks_raceId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "user_picks" ADD CONSTRAINT "user_picks_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.conname = 'race_analysis_cache_raceId_fkey' AND n.nspname = 'oddscast') THEN
    ALTER TABLE "race_analysis_cache" ADD CONSTRAINT "race_analysis_cache_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF; END $$;
