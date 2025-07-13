-- Supabase Cron Job 설정
-- 매일 오전 6시에 경마 데이터를 자동으로 가져오는 작업

-- cron 확장 활성화 (이미 활성화되어 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기존 cron job이 있다면 삭제
SELECT cron.unschedule('fetch-race-data-daily') WHERE cron.jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'fetch-race-data-daily'
);

-- 새로운 cron job 등록
-- 매일 오전 6시에 실행 (0 6 * * *)
SELECT cron.schedule(
  'fetch-race-data-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/fetch-race-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- cron job 상태 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  last_run,
  next_run
FROM cron.job 
WHERE jobname = 'fetch-race-data-daily';

-- 로그 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS fetch_race_data_logs (
  id SERIAL PRIMARY KEY,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT,
  message TEXT,
  response_data JSONB
);

-- 로그를 남기는 함수 생성
CREATE OR REPLACE FUNCTION log_fetch_race_data_execution(
  p_status TEXT,
  p_message TEXT DEFAULT NULL,
  p_response_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO fetch_race_data_logs (status, message, response_data)
  VALUES (p_status, p_message, p_response_data);
END;
$$ LANGUAGE plpgsql;

-- 수동 실행을 위한 함수 생성
CREATE OR REPLACE FUNCTION manual_fetch_race_data()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Edge Function 호출
  SELECT content INTO result
  FROM net.http_post(
    url := 'https://' || current_setting('app.settings.supabase_url') || '/functions/v1/fetch-race-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  
  -- 로그 기록
  PERFORM log_fetch_race_data_execution(
    'SUCCESS',
    'Manual execution completed',
    result
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로그 기록
    PERFORM log_fetch_race_data_execution(
      'ERROR',
      SQLERRM,
      NULL
    );
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- 권한 설정
GRANT EXECUTE ON FUNCTION manual_fetch_race_data() TO authenticated;
GRANT SELECT ON cron_job_status TO authenticated;
GRANT SELECT ON fetch_race_data_logs TO authenticated; 