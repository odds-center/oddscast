-- Run this once for local development.
-- 1) Create database (run as superuser, e.g. in DBeaver or psql connected to postgres):
--    CREATE DATABASE oddscast;
-- 2) Then connect to database "oddscast" and run the rest:

CREATE SCHEMA IF NOT EXISTS oddscast;
COMMENT ON SCHEMA oddscast IS 'OddsCast app schema for local dev';

-- Prisma will create tables in this schema when DATABASE_URL includes ?schema=oddscast
-- and you run: pnpm run db:migrate:deploy (or db:push for quick sync).
