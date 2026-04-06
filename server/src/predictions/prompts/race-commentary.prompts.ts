/**
 * Gemini prompt templates for AI race commentary.
 *
 * Generates two types of commentary:
 * - pre-race: "오늘의 관전 포인트" — key matchups, horses to watch, expected pace
 * - post-race: Exciting narrative of the race after results arrive, winner analysis, surprises
 *
 * Output contract: strict JSON with headline, commentary, keyPoints[], mood enum.
 * Tone: sports broadcaster — engaging, vivid, factual Korean.
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface RaceCommentaryEntry {
  hrName: string;
  hrNo: string;
  jkName: string;
  rating: number;
  winProb?: number;
}

export interface RaceCommentaryResult {
  hrName: string;
  hrNo: string;
  ordInt: number;
  recTime?: string;
}

export interface RaceCommentaryData {
  raceName: string;
  meet: string;
  distance: number;
  entries: RaceCommentaryEntry[];
  results?: RaceCommentaryResult[];
  type: 'pre-race' | 'post-race';
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds the Gemini prompt for AI race commentary.
 *
 * Pre-race mode:  previews key matchups and watch points before the race.
 * Post-race mode: narrates the race outcome with excitement and analysis.
 *
 * Output JSON schema:
 * {
 *   "headline": "한 줄 헤드라인",
 *   "commentary": "2-4문장 생동감 있는 중계 텍스트",
 *   "keyPoints": ["포인트1", "포인트2", "포인트3"],
 *   "mood": "exciting | normal | upset"
 * }
 * "upset" = surprising result (lower-rated horse won, or heavy favorite failed).
 */
export function buildRaceCommentaryPrompt(data: RaceCommentaryData): string {
  const { raceName, meet, distance, entries, results, type } = data;

  const entryLines = entries
    .map(
      (e) =>
        `  - ${e.hrName}(${e.hrNo}번) 기수:${e.jkName} 레이팅:${e.rating}${e.winProb != null ? ` 승률:${e.winProb.toFixed(1)}%` : ''}`,
    )
    .join('\n');

  const outputSchema = `{
  "headline": "한 줄 헤드라인 (20자 이내)",
  "commentary": "2~4문장 생동감 있는 중계 텍스트",
  "keyPoints": ["핵심 포인트1", "핵심 포인트2", "핵심 포인트3"],
  "mood": "exciting | normal | upset"
}`;

  if (type === 'pre-race') {
    return `# 역할
당신은 한국경마 전문 스포츠 캐스터입니다. 경주 시작 전 팬들이 주목해야 할 관전 포인트를 생동감 있게 소개합니다.

# 경주 정보
경주명: ${raceName}
경마장: ${meet}
거리: ${distance}m

# 출전마 목록
${entryLines}

# 작성 지침
- 헤드라인: 이 경주를 한 문장으로 압축하는 매력적인 제목 (예: "레이팅 1위 마필의 독주냐, 이변이냐")
- commentary: 주목해야 할 말, 기수, 예상 페이스 전개, 핵심 대결 구도를 스포츠 중계 톤으로 서술 (2~4문장)
- keyPoints: 팬들이 반드시 주목해야 할 관전 포인트 3가지 (간결한 한국어)
- mood:
  - "exciting" — 상위 마필 간 점수 차이가 작거나 대역전 가능성이 높을 때
  - "normal" — 명확한 우위 마필이 있고 이변 가능성이 낮을 때
  - "upset" — 하위 마필이나 비인기마가 유력한 경우

# 출력 형식 (JSON만, 다른 텍스트 없이)
${outputSchema}`;
  }

  // post-race
  const resultLines =
    results && results.length > 0
      ? results
          .slice(0, 5)
          .map(
            (r) =>
              `  ${r.ordInt}위: ${r.hrName}(${r.hrNo}번)${r.recTime ? ` — ${r.recTime}초` : ''}`,
          )
          .join('\n')
      : '  결과 없음';

  // Detect upset: winner is not the highest-rated entry
  const sortedByRating = [...entries].sort((a, b) => b.rating - a.rating);
  const favoriteHrNo = sortedByRating[0]?.hrNo;
  const winnerHrNo = results?.[0]?.hrNo;
  const isUpset =
    winnerHrNo != null && favoriteHrNo != null && winnerHrNo !== favoriteHrNo;

  return `# 역할
당신은 한국경마 전문 스포츠 캐스터입니다. 방금 완료된 경주 결과를 바탕으로 팬들에게 생생한 경주 후기를 전달합니다.

# 경주 정보
경주명: ${raceName}
경마장: ${meet}
거리: ${distance}m

# 출전마 정보 (사전 데이터)
${entryLines}

# 최종 결과
${resultLines}

# 작성 지침
- 헤드라인: 결과를 한 문장으로 압축하는 드라마틱한 제목 (예: "비인기마의 역전극, 팬들 충격")
- commentary: 경주 흐름, 우승마의 활약, 놀라운 결과나 이변 요소를 생동감 있게 서술 (2~4문장). 사실 기반.
- keyPoints: 이 경주에서 주목할 만한 포인트 3가지 (우승 요인, 이변 여부, 다음 경주 시사점 등)
- mood:
  - "exciting" — 치열한 접전이었거나 드라마틱한 역전이 있었을 때
  - "normal" — 예상대로 진행된 경주
  - "upset" — 비인기마 우승 또는 강력한 우승 후보가 탈락한 경우${isUpset ? '\n\n⚠️ 참고: 레이팅 최상위 마필이 우승하지 못했습니다. upset 가능성이 높습니다.' : ''}

# 출력 형식 (JSON만, 다른 텍스트 없이)
${outputSchema}`;
}
