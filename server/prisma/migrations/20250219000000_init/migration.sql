-- Local dev: use schema "oddscast". Creates schema + all tables in one go.
-- DATABASE_URL must include ?schema=oddscast (see docs/guides/LOCAL_DB_SETUP.md).
CREATE SCHEMA IF NOT EXISTS oddscast;
SET search_path TO oddscast;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RaceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('AVAILABLE', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('RACE', 'MATRIX');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'RACE', 'PREDICTION', 'PROMOTION', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('GENERAL', 'URGENT', 'INFO', 'MARKETING');

-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('HORSE', 'JOCKEY', 'TRAINER', 'RACE', 'MEET');

-- CreateEnum
CREATE TYPE "FavoritePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM ('EARNED', 'SPENT', 'REFUNDED', 'BONUS', 'PROMOTION', 'ADMIN_ADJUSTMENT', 'EXPIRED', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "PointStatus" AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('SIGNUP_BONUS', 'REFERRAL_BONUS', 'DAILY_LOGIN', 'SPECIAL_EVENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BetType" AS ENUM ('WIN', 'PLACE', 'QUINELLA', 'QUINELLA_PLACE', 'EXACTA', 'TRIFECTA', 'TRIPLE');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "BetResult" AS ENUM ('PENDING', 'WIN', 'LOSE', 'PARTIAL_WIN', 'VOID');

-- CreateEnum
CREATE TYPE "BetSlipStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PickType" AS ENUM ('SINGLE', 'PLACE', 'QUINELLA', 'EXACTA', 'QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "favoriteMeet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_claims" (
    "id" SERIAL NOT NULL,
    "referralCodeId" INTEGER NOT NULL,
    "referredUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_previews" (
    "id" SERIAL NOT NULL,
    "weekLabel" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_fortunes" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_fortunes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "loginId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_entries" (
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

-- CreateTable
CREATE TABLE "trainings" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_results" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "race_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jockey_results" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jockey_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_results" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "scores" JSONB,
    "analysis" TEXT,
    "preview" TEXT,
    "previewApproved" BOOLEAN NOT NULL DEFAULT false,
    "accuracy" DOUBLE PRECISION,
    "postRaceSummary" TEXT,
    "status" "PredictionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_tickets" (
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

-- CreateTable
CREATE TABLE "subscription_plans" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "raceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "predictionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "systemEnabled" BOOLEAN NOT NULL DEFAULT true,
    "promotionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_histories" (
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

-- CreateTable
CREATE TABLE "single_purchases" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "pgTransactionId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "single_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_transactions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "transactionType" "PointTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PointStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "transactionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_promotions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "conditions" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "raceId" INTEGER NOT NULL,
    "betType" "BetType" NOT NULL,
    "betName" TEXT NOT NULL,
    "betDescription" TEXT,
    "betAmount" INTEGER NOT NULL,
    "potentialWin" INTEGER,
    "odds" DOUBLE PRECISION,
    "selections" JSONB NOT NULL,
    "betStatus" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "betResult" "BetResult" NOT NULL DEFAULT 'PENDING',
    "betTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raceTime" TIMESTAMP(3),
    "resultTime" TIMESTAMP(3),
    "actualWin" INTEGER,
    "actualOdds" DOUBLE PRECISION,
    "confidenceLevel" DOUBLE PRECISION,
    "betReason" TEXT,
    "analysisData" JSONB,
    "apiVersion" TEXT,
    "dataSource" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roi" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bet_slips" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "bets" JSONB NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "BetSlipStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bet_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_picks" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "raceId" INTEGER NOT NULL,
    "pickType" "PickType" NOT NULL DEFAULT 'SINGLE',
    "hrNos" TEXT[],
    "hrNames" TEXT[],
    "pointsAwarded" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_configs" (
    "id" SERIAL NOT NULL,
    "configKey" TEXT NOT NULL,
    "configValue" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_ticket_prices" (
    "id" SERIAL NOT NULL,
    "pointsPerTicket" INTEGER NOT NULL DEFAULT 1200,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_ticket_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kra_sync_logs" (
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

-- CreateTable
CREATE TABLE "admin_activity_logs" (
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

-- CreateTable
CREATE TABLE "user_activity_logs" (
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

-- CreateTable
CREATE TABLE "global_config" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referral_claims_referredUserId_key" ON "referral_claims"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_previews_weekLabel_key" ON "weekly_previews"("weekLabel");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_fortunes_userId_date_key" ON "user_daily_fortunes"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_loginId_key" ON "admin_users"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "races_meet_rcDate_rcNo_key" ON "races"("meet", "rcDate", "rcNo");

-- CreateIndex
CREATE INDEX "trainings_horseNo_idx" ON "trainings"("horseNo");

-- CreateIndex
CREATE INDEX "trainings_trDate_idx" ON "trainings"("trDate");

-- CreateIndex
CREATE UNIQUE INDEX "jockey_results_meet_jkNo_key" ON "jockey_results"("meet", "jkNo");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_results_meet_trNo_key" ON "trainer_results"("meet", "trNo");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_planName_key" ON "subscription_plans"("planName");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_userId_token_key" ON "push_tokens"("userId", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_userId_key" ON "user_notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_type_targetId_key" ON "favorites"("userId", "type", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "user_picks_userId_raceId_key" ON "user_picks"("userId", "raceId");

-- CreateIndex
CREATE UNIQUE INDEX "point_configs_configKey_key" ON "point_configs"("configKey");

-- CreateIndex
CREATE INDEX "kra_sync_logs_endpoint_rcDate_idx" ON "kra_sync_logs"("endpoint", "rcDate");

-- CreateIndex
CREATE INDEX "kra_sync_logs_createdAt_idx" ON "kra_sync_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_activity_logs_adminUserId_idx" ON "admin_activity_logs"("adminUserId");

-- CreateIndex
CREATE INDEX "admin_activity_logs_action_idx" ON "admin_activity_logs"("action");

-- CreateIndex
CREATE INDEX "admin_activity_logs_createdAt_idx" ON "admin_activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "user_activity_logs_userId_idx" ON "user_activity_logs"("userId");

-- CreateIndex
CREATE INDEX "user_activity_logs_event_idx" ON "user_activity_logs"("event");

-- CreateIndex
CREATE INDEX "user_activity_logs_createdAt_idx" ON "user_activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "global_config_key_key" ON "global_config"("key");

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_claims" ADD CONSTRAINT "referral_claims_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_fortunes" ADD CONSTRAINT "user_daily_fortunes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_entries" ADD CONSTRAINT "race_entries_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_raceEntryId_fkey" FOREIGN KEY ("raceEntryId") REFERENCES "race_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_tickets" ADD CONSTRAINT "prediction_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_tickets" ADD CONSTRAINT "prediction_tickets_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_tickets" ADD CONSTRAINT "prediction_tickets_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_histories" ADD CONSTRAINT "billing_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "single_purchases" ADD CONSTRAINT "single_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_slips" ADD CONSTRAINT "bet_slips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_slips" ADD CONSTRAINT "bet_slips_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_picks" ADD CONSTRAINT "user_picks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_picks" ADD CONSTRAINT "user_picks_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;
