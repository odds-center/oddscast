-- AlterTable: add customerKey to subscriptions (Toss Payments billing)
ALTER TABLE "subscriptions" ADD COLUMN "customerKey" TEXT;
