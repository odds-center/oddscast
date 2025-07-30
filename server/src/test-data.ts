import { createClient } from './config/supabase';

const supabase = createClient();

const testRaces = [
  {
    id: 'seoul_20240730_1',
    race_number: 1,
    race_name: '서울 1경주',
    date: '2024-07-30T10:00:00Z',
    venue: '서울',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seoul_20240730_2',
    race_number: 2,
    race_name: '서울 2경주',
    date: '2024-07-30T11:00:00Z',
    venue: '서울',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'busan_20240730_1',
    race_number: 1,
    race_name: '부산 1경주',
    date: '2024-07-30T10:30:00Z',
    venue: '부산',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'jeju_20240730_1',
    race_number: 1,
    race_name: '제주 1경주',
    date: '2024-07-30T09:00:00Z',
    venue: '제주',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const testHorses = [
  {
    id: 'horse_1',
    race_id: 'seoul_20240730_1',
    horse_name: '금빛질주',
    jockey: '김기수',
    trainer: '박조교',
    gate_number: 1,
    prediction_rate: 25.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'horse_2',
    race_id: 'seoul_20240730_1',
    horse_name: '바람의아들',
    jockey: '이성현',
    trainer: '최트레',
    gate_number: 2,
    prediction_rate: 18.2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'horse_3',
    race_id: 'seoul_20240730_1',
    horse_name: '천리마',
    jockey: '박태종',
    trainer: '김영관',
    gate_number: 3,
    prediction_rate: 33.1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const testResults = [
  {
    id: 'result_1',
    race_name: '서울 1경주',
    venue: '서울',
    date: '2024-07-30T10:00:00Z',
    winner_horse_name: '금빛질주',
    winner_jockey: '김기수',
    winner_gate_number: 1,
    winner_odds: 2.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

async function insertTestData() {
  try {
    console.log('테스트 데이터 삽입 시작...');

    // 기존 데이터 삭제
    await supabase.from('horses').delete().neq('id', '');
    await supabase.from('races').delete().neq('id', '');
    await supabase.from('race_results').delete().neq('id', '');

    // 경마 데이터 삽입
    const { data: racesData, error: racesError } = await supabase
      .from('races')
      .insert(testRaces)
      .select();

    if (racesError) {
      console.error('경마 데이터 삽입 실패:', racesError);
      return;
    }

    console.log('경마 데이터 삽입 완료:', racesData.length, '개');

    // 말 데이터 삽입
    const { data: horsesData, error: horsesError } = await supabase
      .from('horses')
      .insert(testHorses)
      .select();

    if (horsesError) {
      console.error('말 데이터 삽입 실패:', horsesError);
      return;
    }

    console.log('말 데이터 삽입 완료:', horsesData.length, '개');

    // 결과 데이터 삽입
    const { data: resultsData, error: resultsError } = await supabase
      .from('race_results')
      .insert(testResults)
      .select();

    if (resultsError) {
      console.error('결과 데이터 삽입 실패:', resultsError);
      return;
    }

    console.log('결과 데이터 삽입 완료:', resultsData.length, '개');

    console.log('모든 테스트 데이터 삽입 완료!');
  } catch (error) {
    console.error('테스트 데이터 삽입 중 오류:', error);
  }
}

// 스크립트 실행
insertTestData();
