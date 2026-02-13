-- stTime 컬럼 추가 (races 테이블에 출발시각)
-- 실행: psql $DATABASE_URL -f prisma/add-stTime-column.sql
-- 또는 Supabase SQL Editor에서 실행

ALTER TABLE "races"
ADD COLUMN IF NOT EXISTS "stTime" VARCHAR(20);
