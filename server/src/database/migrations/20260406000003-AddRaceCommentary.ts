import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRaceCommentary20260406000003 implements MigrationInterface {
  name = 'AddRaceCommentary20260406000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.races ADD COLUMN IF NOT EXISTS commentary JSONB;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE oddscast.races DROP COLUMN IF EXISTS commentary;
    `);
  }
}
