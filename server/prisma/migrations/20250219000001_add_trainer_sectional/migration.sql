-- CreateTable (IF NOT EXISTS for idempotency when init migration already created full schema)
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainer_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "trainer_results_meet_trNo_key" ON "trainer_results"("meet", "trNo");

-- AlterTable
ALTER TABLE "race_entries" ADD COLUMN IF NOT EXISTS "sectionalStats" JSONB;
