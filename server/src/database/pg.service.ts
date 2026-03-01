import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

/**
 * Raw PostgreSQL pool. Use query() for SQL; replace former Prisma calls with raw queries.
 * DATABASE_URL must be set (e.g. postgresql://user:pass@host:5432/dbname).
 */
@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('DATABASE_URL');
    if (url) {
      this.pool = new Pool({ connectionString: url });
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  getPool(): Pool | null {
    return this.pool;
  }

  async query<T = unknown>(text: string, values?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.pool) {
      return { rows: [], rowCount: 0 };
    }
    const result = await this.pool.query(text, values);
    return { rows: (result.rows as T[]) ?? [], rowCount: result.rowCount ?? 0 };
  }

  async getClient(): Promise<PoolClient | null> {
    return this.pool ? this.pool.connect() : null;
  }
}
