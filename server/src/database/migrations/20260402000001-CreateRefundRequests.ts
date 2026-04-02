import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefundRequests20260402000001 implements MigrationInterface {
  name = 'CreateRefundRequests20260402000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS oddscast.refund_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" INT NOT NULL REFERENCES oddscast.users(id) ON DELETE SET NULL,
        type VARCHAR(30) NOT NULL DEFAULT 'SUBSCRIPTION',
        "billingHistoryId" INT REFERENCES oddscast.billing_histories(id) ON DELETE SET NULL,
        "subscriptionId" INT REFERENCES oddscast.subscriptions(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "originalAmount" INT NOT NULL,
        "requestedAmount" INT NOT NULL,
        "approvedAmount" INT,
        "usedTickets" INT NOT NULL DEFAULT 0,
        "totalTickets" INT NOT NULL DEFAULT 0,
        "daysSincePayment" INT NOT NULL,
        "isEligible" BOOLEAN NOT NULL DEFAULT TRUE,
        "ineligibilityReason" TEXT,
        "userReason" TEXT NOT NULL,
        "adminNote" TEXT,
        "processedByAdminId" INT,
        "processedAt" TIMESTAMP,
        "pgTransactionId" VARCHAR(200),
        "pgRefundResponse" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON oddscast.refund_requests(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON oddscast.refund_requests("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_refund_requests_created ON oddscast.refund_requests("createdAt" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS oddscast.refund_requests`);
  }
}
