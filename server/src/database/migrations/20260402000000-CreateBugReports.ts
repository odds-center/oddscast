import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBugReports20260402000000 implements MigrationInterface {
  name = 'CreateBugReports20260402000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS oddscast.bug_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" INT REFERENCES oddscast.users(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        "pageUrl" VARCHAR(500),
        "userAgent" VARCHAR(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON oddscast.bug_reports(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON oddscast.bug_reports("createdAt" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS oddscast.bug_reports`);
  }
}
