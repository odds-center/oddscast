import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove User.name column — nickname is the sole display name.
 * Existing name values are copied to nickname where nickname is NULL.
 */
export class RemoveUserName20260409000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill: copy name -> nickname where nickname is empty
    await queryRunner.query(`
      UPDATE oddscast.users
      SET nickname = name
      WHERE nickname IS NULL OR nickname = ''
    `);

    // Make nickname NOT NULL with fallback default
    await queryRunner.query(`
      ALTER TABLE oddscast.users
      ALTER COLUMN nickname SET NOT NULL,
      ALTER COLUMN nickname SET DEFAULT '사용자'
    `);

    // Drop name column
    await queryRunner.query(`
      ALTER TABLE oddscast.users DROP COLUMN IF EXISTS name
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add name column
    await queryRunner.query(`
      ALTER TABLE oddscast.users
      ADD COLUMN name text NOT NULL DEFAULT '사용자'
    `);

    // Copy nickname back to name
    await queryRunner.query(`
      UPDATE oddscast.users SET name = nickname
    `);

    // Make nickname nullable again
    await queryRunner.query(`
      ALTER TABLE oddscast.users
      ALTER COLUMN nickname DROP NOT NULL,
      ALTER COLUMN nickname DROP DEFAULT
    `);
  }
}
