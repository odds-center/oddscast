/**
 * Creates race_analysis_cache table for caching Python analysis results.
 * Avoids redundant Python spawns when underlying data has not changed (hash match).
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRaceAnalysisCache20260327000000 implements MigrationInterface {
  name = 'CreateRaceAnalysisCache20260327000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS oddscast."race_analysis_cache" (
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
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_race_analysis_cache_raceId_type"
        ON oddscast."race_analysis_cache" ("raceId", "analysisType");
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_namespace n ON c.connamespace = n.oid
          WHERE c.conname = 'race_analysis_cache_raceId_fkey'
            AND n.nspname = 'oddscast'
        ) THEN
          ALTER TABLE oddscast."race_analysis_cache"
            ADD CONSTRAINT "race_analysis_cache_raceId_fkey"
            FOREIGN KEY ("raceId") REFERENCES oddscast."races"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS oddscast."race_analysis_cache" CASCADE;`,
    );
  }
}
