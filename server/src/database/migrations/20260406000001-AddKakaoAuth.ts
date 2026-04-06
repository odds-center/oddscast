import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKakaoAuth20260406000001 implements MigrationInterface {
  name = 'AddKakaoAuth20260406000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oddscast"."users" ADD COLUMN IF NOT EXISTS "kakaoId" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "oddscast"."users" ADD COLUMN IF NOT EXISTS "provider" text NOT NULL DEFAULT 'email'`,
    );
    await queryRunner.query(
      `ALTER TABLE "oddscast"."users" ALTER COLUMN "password" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_kakaoId" ON "oddscast"."users" ("kakaoId") WHERE "kakaoId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "oddscast"."UQ_users_kakaoId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oddscast"."users" ALTER COLUMN "password" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "oddscast"."users" DROP COLUMN IF EXISTS "provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oddscast"."users" DROP COLUMN IF EXISTS "kakaoId"`,
    );
  }
}
