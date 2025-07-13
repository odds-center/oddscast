-- 경마 일정 테이블
CREATE TABLE IF NOT EXISTS races (
  id TEXT PRIMARY KEY,
  race_number INTEGER NOT NULL,
  race_name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 말 정보 테이블
CREATE TABLE IF NOT EXISTS horses (
  id TEXT PRIMARY KEY,
  race_id TEXT NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  horse_name TEXT NOT NULL,
  jockey TEXT NOT NULL,
  trainer TEXT NOT NULL,
  gate_number INTEGER NOT NULL,
  prediction_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 경마 결과 테이블
CREATE TABLE IF NOT EXISTS race_results (
  id TEXT PRIMARY KEY,
  race_name TEXT NOT NULL,
  venue TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  winner_horse_name TEXT NOT NULL,
  winner_jockey TEXT NOT NULL,
  winner_gate_number INTEGER NOT NULL,
  winner_odds DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 개별 말 결과 테이블
CREATE TABLE IF NOT EXISTS horse_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_result_id TEXT NOT NULL REFERENCES race_results(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  horse_name TEXT NOT NULL,
  jockey TEXT NOT NULL,
  gate_number INTEGER NOT NULL,
  odds DECIMAL(5,2) NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_races_date ON races(date);
CREATE INDEX IF NOT EXISTS idx_races_venue ON races(venue);
CREATE INDEX IF NOT EXISTS idx_horses_race_id ON horses(race_id);
CREATE INDEX IF NOT EXISTS idx_race_results_date ON race_results(date);
CREATE INDEX IF NOT EXISTS idx_race_results_venue ON race_results(venue);
CREATE INDEX IF NOT EXISTS idx_horse_results_race_result_id ON horse_results(race_result_id);

-- RLS (Row Level Security) 설정
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_results ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 정책 설정
CREATE POLICY "Allow public read access to races" ON races
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to horses" ON horses
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to race_results" ON race_results
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to horse_results" ON horse_results
  FOR SELECT USING (true);

-- 서비스 롤만 쓰기 가능하도록 정책 설정
CREATE POLICY "Allow service role full access to races" ON races
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to horses" ON horses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to race_results" ON race_results
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to horse_results" ON horse_results
  FOR ALL USING (auth.role() = 'service_role');

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horses_updated_at BEFORE UPDATE ON horses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_race_results_updated_at BEFORE UPDATE ON race_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horse_results_updated_at BEFORE UPDATE ON horse_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 