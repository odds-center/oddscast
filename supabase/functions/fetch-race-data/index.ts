import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Horse {
  id: string;
  horseName: string;
  jockey: string;
  trainer: string;
  gateNumber: number;
  predictionRate: number;
}

interface Race {
  id: string;
  raceNumber: number;
  raceName: string;
  date: string;
  venue: string;
  horses: Horse[];
}

interface RaceResult {
  id: string;
  raceName: string;
  venue: string;
  date: string;
  winner: {
    horseName: string;
    jockey: string;
    gateNumber: number;
    odds: number;
  };
  results: {
    position: number;
    horseName: string;
    jockey: string;
    gateNumber: number;
    odds: number;
    time: string;
  }[];
}

// 한국마사회 API에서 경마 데이터를 가져오는 함수
async function fetchRaceDataFromAPI(): Promise<Race[]> {
  try {
    const apiKey = Deno.env.get('KRA_API_KEY');
    if (!apiKey) {
      throw new Error('KRA_API_KEY environment variable is not set');
    }

    // 오늘 날짜 기준으로 API 호출
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // 한국마사회 API URL
    const apiUrl = `https://apis.data.go.kr/B551015/API72_2/racePlan?serviceKey=${apiKey}&rc_year=${year}&rc_month=${month}&rc_day=${day}`;

    console.log('Fetching from KRA API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`KRA API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('KRA API response:', JSON.stringify(data, null, 2));

    // API 응답 구조에 따라 데이터 파싱
    if (data.response && data.response.body && data.response.body.items) {
      const items = Array.isArray(data.response.body.items.item)
        ? data.response.body.items.item
        : [data.response.body.items.item];

      const races: Race[] = [];

      for (const item of items) {
        if (!item) continue;

        const race: Race = {
          id: `${item.rc_year}${item.rc_month}${item.rc_day}_${item.rc_no}`,
          raceNumber: parseInt(item.rc_no) || 1,
          raceName: `${item.meet} ${item.rc_no}경주`,
          date: `${item.rc_year}-${item.rc_month}-${item.rc_day} 00:00`,
          venue: item.meet || '서울',
          horses: [], // 말 정보는 별도 API 호출 필요
        };

        races.push(race);
      }

      return races;
    }

    console.log('No race data found in API response, using mock data');
    return generateMockRaceData();
  } catch (error) {
    console.error('Error fetching race data from KRA API:', error);
    console.log('Falling back to mock data');
    return generateMockRaceData();
  }
}

// 공공데이터 API에서 경마 결과를 가져오는 함수
async function fetchRaceResultsFromAPI(): Promise<RaceResult[]> {
  try {
    const response = await fetch('https://api.example.com/race-results', {
      headers: {
        Authorization: `Bearer ${Deno.env.get('PUBLIC_DATA_API_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching race results from API:', error);

    // API 실패 시 기본 데이터 반환 (개발용)
    return generateMockRaceResults();
  }
}

// 개발용 모의 경마 데이터 생성
function generateMockRaceData(): Race[] {
  const venues = ['서울', '부산', '제주', '광주', '대구'];
  const races: Race[] = [];

  for (let i = 1; i <= 10; i++) {
    const venue = venues[Math.floor(Math.random() * venues.length)];
    const raceDate = new Date();
    raceDate.setDate(raceDate.getDate() + Math.floor(Math.random() * 7));

    const horses: Horse[] = [];
    for (let j = 1; j <= 8; j++) {
      horses.push({
        id: `${i}-${j}`,
        horseName: `말${i}-${j}`,
        jockey: `기수${j}`,
        trainer: `조교${j}`,
        gateNumber: j,
        predictionRate: Math.random() * 50 + 10,
      });
    }

    races.push({
      id: i.toString(),
      raceNumber: i,
      raceName: `${venue} ${i}경주`,
      date: raceDate.toISOString().slice(0, 16).replace('T', ' '),
      venue,
      horses,
    });
  }

  return races;
}

// 개발용 모의 경마 결과 데이터 생성
function generateMockRaceResults(): RaceResult[] {
  const venues = ['서울', '부산', '제주', '광주', '대구'];
  const results: RaceResult[] = [];

  for (let i = 1; i <= 5; i++) {
    const venue = venues[Math.floor(Math.random() * venues.length)];
    const raceDate = new Date();
    raceDate.setDate(raceDate.getDate() - Math.floor(Math.random() * 7));

    const raceResults = [];
    for (let j = 1; j <= 8; j++) {
      raceResults.push({
        position: j,
        horseName: `말${i}-${j}`,
        jockey: `기수${j}`,
        gateNumber: j,
        odds: Math.random() * 20 + 1,
        time: `${Math.floor(Math.random() * 2) + 1}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, '0')}.${Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, '0')}`,
      });
    }

    results.push({
      id: i.toString(),
      raceName: `${venue} ${i}경주`,
      venue,
      date: raceDate.toISOString().slice(0, 16).replace('T', ' '),
      winner: raceResults[0],
      results: raceResults,
    });
  }

  return results;
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];

    // 1. 경마 일정 데이터 가져오기
    console.log('Fetching race data...');
    const raceData = await fetchRaceDataFromAPI();

    // 기존 데이터 삭제 (오늘 날짜의 데이터만)
    await supabase
      .from('races')
      .delete()
      .gte('date', `${today} 00:00`)
      .lt('date', `${today} 23:59`);

    // 새로운 경마 데이터 삽입
    for (const race of raceData) {
      const { error: raceError } = await supabase.from('races').insert({
        id: race.id,
        race_number: race.raceNumber,
        race_name: race.raceName,
        date: race.date,
        venue: race.venue,
        created_at: new Date().toISOString(),
      });

      if (raceError) {
        console.error('Error inserting race:', raceError);
        continue;
      }

      // 말 데이터 삽입
      for (const horse of race.horses) {
        const { error: horseError } = await supabase.from('horses').insert({
          id: horse.id,
          race_id: race.id,
          horse_name: horse.horseName,
          jockey: horse.jockey,
          trainer: horse.trainer,
          gate_number: horse.gateNumber,
          prediction_rate: horse.predictionRate,
          created_at: new Date().toISOString(),
        });

        if (horseError) {
          console.error('Error inserting horse:', horseError);
        }
      }
    }

    // 2. 경마 결과 데이터 가져오기
    console.log('Fetching race results...');
    const raceResults = await fetchRaceResultsFromAPI();

    // 기존 결과 데이터 삭제 (최근 7일)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    await supabase.from('race_results').delete().gte('date', weekAgo.toISOString().split('T')[0]);

    // 새로운 결과 데이터 삽입
    for (const result of raceResults) {
      const { error: resultError } = await supabase.from('race_results').insert({
        id: result.id,
        race_name: result.raceName,
        venue: result.venue,
        date: result.date,
        winner_horse_name: result.winner.horseName,
        winner_jockey: result.winner.jockey,
        winner_gate_number: result.winner.gateNumber,
        winner_odds: result.winner.odds,
        created_at: new Date().toISOString(),
      });

      if (resultError) {
        console.error('Error inserting race result:', resultError);
        continue;
      }

      // 개별 말 결과 삽입
      for (const horseResult of result.results) {
        const { error: horseResultError } = await supabase.from('horse_results').insert({
          race_result_id: result.id,
          position: horseResult.position,
          horse_name: horseResult.horseName,
          jockey: horseResult.jockey,
          gate_number: horseResult.gateNumber,
          odds: horseResult.odds,
          time: horseResult.time,
          created_at: new Date().toISOString(),
        });

        if (horseResultError) {
          console.error('Error inserting horse result:', horseResultError);
        }
      }
    }

    console.log('Data fetch and save completed successfully');

    return new Response(
      JSON.stringify({
        message: 'Race data fetched and saved successfully',
        racesCount: raceData.length,
        resultsCount: raceResults.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in fetch-race-data function:', error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
