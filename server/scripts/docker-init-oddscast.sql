-- Create oddscast schema for local dev (Docker Postgres init).
-- Tables: run ./scripts/setup.sh or docs/db/schema.sql (see docs/db/README.md).
-- Without tables, Admin 회원 조회 fails (relation "users" does not exist).
CREATE SCHEMA IF NOT EXISTS oddscast;
