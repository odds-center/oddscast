/**
 * Creates oddscast.batch_schedules and BatchScheduleStatus enum.
 * Run from server dir: pnpm run migration:run
 */
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBatchSchedulesTable20260224000000 implements MigrationInterface {
  name = 'CreateBatchSchedulesTable20260224000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE oddscast."BatchScheduleStatus" AS ENUM (
          'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS oddscast.batch_schedules (
        "id" SERIAL NOT NULL,
        "jobType" TEXT NOT NULL,
        "targetRcDate" TEXT NOT NULL,
        "scheduledAt" TIMESTAMP(3) NOT NULL,
        "status" oddscast."BatchScheduleStatus" NOT NULL DEFAULT 'PENDING',
        "startedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "errorMessage" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "batch_schedules_pkey" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "batch_schedules_status_scheduledAt_idx"
      ON oddscast.batch_schedules("status", "scheduledAt");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "batch_schedules_jobType_targetRcDate_idx"
      ON oddscast.batch_schedules("jobType", "targetRcDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS oddscast."batch_schedules_jobType_targetRcDate_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS oddscast."batch_schedules_status_scheduledAt_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS oddscast.batch_schedules;`);
    await queryRunner.query(`DROP TYPE IF EXISTS oddscast."BatchScheduleStatus";`);
  }
}
