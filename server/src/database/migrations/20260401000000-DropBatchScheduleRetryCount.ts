import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DropBatchScheduleRetryCount20260401000000
  implements MigrationInterface
{
  name = 'DropBatchScheduleRetryCount20260401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast."batch_schedules"
        DROP COLUMN IF EXISTS "retryCount";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast."batch_schedules"
        ADD COLUMN IF NOT EXISTS "retryCount" INTEGER NOT NULL DEFAULT 0;
    `);
  }
}
