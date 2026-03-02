-- Remove Prisma leftover table (no longer used; project uses TypeORM).
-- Run once against your DB: psql $DATABASE_URL -f docs/db/patches/drop_prisma_migrations.sql
SET search_path TO oddscast;
DROP TABLE IF EXISTS _prisma_migrations;
