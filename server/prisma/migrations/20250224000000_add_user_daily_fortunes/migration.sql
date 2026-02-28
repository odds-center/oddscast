-- CreateTable (IF NOT EXISTS for idempotency)
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_fortunes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_daily_fortunes_userId_date_key" ON "user_daily_fortunes"("userId", "date");

-- AddForeignKey (idempotent: skip if constraint exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_daily_fortunes_userId_fkey') THEN
    ALTER TABLE "user_daily_fortunes" ADD CONSTRAINT "user_daily_fortunes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
