import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunityPredictions20260406000002 implements MigrationInterface {
  name = 'CreateCommunityPredictions20260406000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE oddscast.community_predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES oddscast.users(id) ON DELETE CASCADE,
        race_id INTEGER NOT NULL REFERENCES oddscast.races(id) ON DELETE CASCADE,
        predicted_hr_nos TEXT[] NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        scored_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, race_id)
      );

      CREATE INDEX idx_community_predictions_race_id ON oddscast.community_predictions(race_id);
      CREATE INDEX idx_community_predictions_user_id ON oddscast.community_predictions(user_id);
      CREATE INDEX idx_community_predictions_score ON oddscast.community_predictions(score DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS oddscast.community_predictions`);
  }
}
