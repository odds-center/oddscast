-- AlterTable: add customerKey to subscriptions (Toss Payments billing)
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "customerKey" TEXT;
