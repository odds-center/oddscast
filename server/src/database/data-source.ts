/**
 * TypeORM DataSource for CLI (migration:generate, migration:run).
 * Load DATABASE_URL from .env (server root). Run from server dir after build:
 *   node -r dotenv/config node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';

// Load .env from server root (parent of src)
config({ path: resolve(__dirname, '../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema: 'oddscast',
  entities: [resolve(__dirname, 'entities/**/*.entity{.ts,.js}')],
  migrations: [resolve(__dirname, 'migrations/*{.ts,.js}')],
  logging: process.env.NODE_ENV === 'development',
});
