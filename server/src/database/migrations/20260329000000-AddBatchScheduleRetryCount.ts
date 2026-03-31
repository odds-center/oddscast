import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBatchScheduleRetryCount20260329000000 implements MigrationInterface {
  name = 'AddBatchScheduleRetryCount20260329000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.batch_schedules
        ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.batch_schedules DROP COLUMN IF EXISTS "retryCount";
    `);
  }
}
