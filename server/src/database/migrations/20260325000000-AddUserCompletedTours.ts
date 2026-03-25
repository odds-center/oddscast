/**
 * Adds completedTours text[] column to users table for persisting
 * coach mark onboarding tour completion state per user (cross-device).
 *
 * Run from server dir: pnpm run migration:run
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCompletedTours20260325000000 implements MigrationInterface {
  name = 'AddUserCompletedTours20260325000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.users
        ADD COLUMN IF NOT EXISTS "completedTours" TEXT[] NOT NULL DEFAULT '{}';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.users DROP COLUMN IF EXISTS "completedTours";
    `);
  }
}
