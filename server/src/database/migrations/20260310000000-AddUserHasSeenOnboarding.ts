/**
 * Adds hasSeenOnboarding column to users table for persisting
 * onboarding tutorial completion state across devices/browsers.
 *
 * Run from server dir: pnpm run migration:run
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserHasSeenOnboarding20260310000000 implements MigrationInterface {
  name = 'AddUserHasSeenOnboarding20260310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.users
        ADD COLUMN IF NOT EXISTS "hasSeenOnboarding" BOOLEAN NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.users DROP COLUMN IF EXISTS "hasSeenOnboarding";
    `);
  }
}
