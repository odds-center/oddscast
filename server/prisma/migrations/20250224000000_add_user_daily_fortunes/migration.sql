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

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_fortunes_userId_date_key" ON "user_daily_fortunes"("userId", "date");

-- AddForeignKey
ALTER TABLE "user_daily_fortunes" ADD CONSTRAINT "user_daily_fortunes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
