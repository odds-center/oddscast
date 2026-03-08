/**
 * Adds entriesHash column to oddscast.predictions for Gemini API cost optimization.
 * When generatePrediction() is called for a race whose entry sheet has not changed
 * (same hash), the existing COMPLETED prediction is returned without re-calling Gemini.
 *
 * Run from server dir: pnpm run migration:run
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPredictionEntriesHash20260308000000 implements MigrationInterface {
  name = 'AddPredictionEntriesHash20260308000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.predictions
        ADD COLUMN IF NOT EXISTS "entriesHash" TEXT;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_predictions_raceId_entriesHash"
        ON oddscast.predictions ("raceId", "entriesHash")
        WHERE status = 'COMPLETED' AND "entriesHash" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS oddscast."idx_predictions_raceId_entriesHash";
    `);
    await queryRunner.query(`
      ALTER TABLE oddscast.predictions DROP COLUMN IF EXISTS "entriesHash";
    `);
  }
}
