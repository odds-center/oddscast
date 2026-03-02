/**
 * Adds lastDailyBonusAt, lastConsecutiveLoginDate, consecutiveLoginDays to oddscast.users.
 * Run from server dir: pnpm run migration:run
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLoginBonusColumns20260302000000 implements MigrationInterface {
  name = 'AddUserLoginBonusColumns20260302000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.users ADD COLUMN IF NOT EXISTS "lastDailyBonusAt" TIMESTAMP(3);
    `);
    await queryRunner.query(`
      ALTER TABLE oddscast.users ADD COLUMN IF NOT EXISTS "lastConsecutiveLoginDate" TEXT;
    `);
    await queryRunner.query(`
      ALTER TABLE oddscast.users ADD COLUMN IF NOT EXISTS "consecutiveLoginDays" INTEGER NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.users DROP COLUMN IF EXISTS "consecutiveLoginDays";
    `);
    await queryRunner.query(`
      ALTER TABLE oddscast.users DROP COLUMN IF EXISTS "lastConsecutiveLoginDate";
    `);
    await queryRunner.query(`
      ALTER TABLE oddscast.users DROP COLUMN IF EXISTS "lastDailyBonusAt";
    `);
  }
}
