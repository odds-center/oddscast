/**
 * AI 경마 예측 프롬프트 템플릿
 */

export interface RaceData {
  // 경주 기본 정보
  raceName: string;
  raceDate: string;
  trackName: string;
  distance: number;
  trackCondition: string;
  weather: string;

  // 출전마 정보
  horses: HorseData[];
}

export interface HorseData {
  number: number;
  name: string;
  age: number;
  sex: string;
  weight: number;
  jockey: string;
  trainer: string;

  // 최근 성적
  recentRanks: number[];
  recentTimes: string[];

  // 통계
  wins: number;
  places: number;
  shows: number;
  totalRaces: number;
  winRate: number;

  // 거리별 성적
  distancePerformance: string;

  // 주로 상태별 성적
  trackConditionPerformance: string;

  // 기수/조교사 승률
  jockeyWinRate: number;
  trainerWinRate: number;
}

/**
 * 시스템 프롬프트
 */
export const SYSTEM_PROMPT = `당신은 경마 전문 분석가입니다.
과거 경주 데이터, 출전마 정보, 기수/조교사 통계 등을 종합적으로 분석하여 정확한 예측을 제공합니다.

분석 시 고려해야 할 요소:
1. 최근 경주 성적 (최근 5경주 중요도 높음)
2. 거리 적성 (오늘 경주 거리와 과거 성적 비교)
3. 주로 상태 적성 (양호/다습/불량)
4. 기수 능력 (승률, 해당 말과의 호흡)
5. 조교사 능력 (승률, 조교 방식)
6. 마체중 변화
7. 출전 간격

예측은 데이터에 기반하되, 불확실성이 높으면 신뢰도를 낮게 표시하세요.`;

/**
 * 예측 프롬프트 생성
 */
export function buildPredictionPrompt(raceData: RaceData): string {
  const {
    raceName,
    raceDate,
    trackName,
    distance,
    trackCondition,
    weather,
    horses,
  } = raceData;

  return `
# 경주 정보

**경주명**: ${raceName}
**날짜**: ${raceDate}
**경마장**: ${trackName}
**거리**: ${distance}m
**주로 상태**: ${trackCondition}
**날씨**: ${weather}

# 출전마 정보

${horses
  .map(
    h => `
## ${h.number}번 ${h.name}

**기본 정보**:
- 나이/성별: ${h.age}세 ${h.sex}
- 마체중: ${h.weight}kg
- 기수: ${h.jockey} (승률 ${h.jockeyWinRate}%)
- 조교사: ${h.trainer} (승률 ${h.trainerWinRate}%)

**최근 성적** (최근 5경주):
- 순위: ${h.recentRanks.join('위 → ')}위
- 기록: ${h.recentTimes.join(' → ')}

**통계**:
- 전체 전적: ${h.wins}승 ${h.places}번 ${h.shows}번 / ${h.totalRaces}전
- 승률: ${h.winRate}%

**적성**:
- 이 거리 성적: ${h.distancePerformance}
- ${trackCondition} 주로 성적: ${h.trackConditionPerformance}
`
  )
  .join('\n')}

# 예측 요청

위 정보를 바탕으로 1-3위를 예측하고, 다음 형식으로 정확하게 답변해주세요:

\`\`\`json
{
  "firstPlace": 마번,
  "secondPlace": 마번,
  "thirdPlace": 마번,
  "confidence": 신뢰도(0-100),
  "analysis": "상세 분석 내용 (200자 이내)",
  "warnings": ["주의사항1", "주의사항2"]
}
\`\`\`

**중요**: 반드시 위 JSON 형식으로만 답변하세요. 다른 텍스트는 포함하지 마세요.
`;
}
