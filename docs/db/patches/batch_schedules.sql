-- Batch schedule table for KRA result fetch and future batch jobs.
-- Run once on existing DB: psql $DATABASE_URL -f docs/db/patches/batch_schedules.sql
SET search_path TO oddscast;

DO $$ BEGIN CREATE TYPE "BatchScheduleStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
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
CREATE INDEX IF NOT EXISTS "batch_schedules_status_scheduledAt_idx" ON "batch_schedules"("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "batch_schedules_jobType_targetRcDate_idx" ON "batch_schedules"("jobType", "targetRcDate");
