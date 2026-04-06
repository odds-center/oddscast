/**
 * Gemini prompt templates for KRA horse racing predictions.
 *
 * Design principles:
 * - Chain-of-Thought (CoT): explicit step-by-step reasoning before final prediction
 * - Few-shot examples: 2 embedded examples teach the model the desired output format and reasoning depth
 * - Explicit JSON schema: strict output contract prevents hallucinated fields
 * - Separation: race prediction, post-race analysis, real-time mode each have dedicated helpers
 *
 * NOTE: weights in the Python analysis script (analysis.py) are heuristic starting points.
 * They should be validated against historical KRA results via logistic regression or
 * importance scores from a trained LightGBM model. Until then, treat W_HORSE values as
 * educated estimates rather than statistically-derived coefficients.
 */

// ---------------------------------------------------------------------------
// Type definitions for template parameters
// ---------------------------------------------------------------------------

export interface RaceContextParams {
  meet: string;
  rcDate: string;
  rcNo: string;
  rcDist?: string | number | null;
  rank?: string | null;
  weather?: string | null;
  track?: string | null;
  cascadeFallRisk?: number;
}

export interface HorseCompactEntry {
  n: string; // chulNo (gate number)
  h: string; // hrName
  j: string; // jkName
  fs: number; // final combined score
  wp: number; // win probability (%)
  hs: number; // horse score
  js: number; // jockey score
  sub?: number[]; // [rat,frm,cnd,exp,trn,suit,jky,rest,dist,cls,trng,sdf,gate,fsz,pace]
  r?: number; // KRA rating
  wg?: string; // horse weight
  rk?: number[]; // recent 5 ranks
  risk?: number; // fall risk
  t?: string[]; // compact tags
}

export interface PromptBuildParams {
  raceCtx: RaceContextParams;
  compactEntries: HorseCompactEntry[];
  weightH: number; // horse weight ratio (e.g. 70)
  weightJ: number; // jockey weight ratio (e.g. 30)
  topJockey?: { hrName: string; jkName: string; jockeyScore: number } | null;
  realtime?: boolean;
}

// ---------------------------------------------------------------------------
// Few-shot examples (embedded in system prompt to guide output quality)
// ---------------------------------------------------------------------------

/**
 * Two high-quality few-shot examples.
 * Example A: clear favorite, short distance, good data
 * Example B: competitive field, upset scenario, value pick
 *
 * These examples are intentionally abstracted (not tied to real race IDs) to avoid
 * the model memorizing historical outcomes.
 */
export const FEW_SHOT_EXAMPLES = `
## 예시 A — 단거리 명확한 우세마 (서울 1200m, 양호주로)
입력 (출전마 4마리 요약):
  n=3 h=번개호 fs=78 wp=42 sub=[87,80,72,65,70,68,76,65,80,55,60,50,62,50,55] rk=[1,2,1,3] t=["R상위87","기세↑","거리적합◎"]
  n=7 h=질풍마 fs=64 wp=28 sub=[75,65,60,55,60,55,58,70,65,50,55,50,55,50,48] rk=[2,3,2,4] t=["R중상75","기세↑"]
  n=1 h=천리마 fs=58 wp=18 sub=[65,55,70,60,55,62,50,55,58,50,50,50,68,50,55] t=["내측유리"]
  n=9 h=폭풍마 fs=42 wp=12 sub=[50,45,55,45,50,40,45,40,40,25,45,50,38,50,35] rk=[5,6,4] t=["등급↑불리","외측불리"]

사고 과정:
[경주 구조] 1200m 단거리, 양호주로. 선행마(n=1, 내측유리 태그)와 중간각질 혼재.
선행마 비율 25%로 오버페이스 위험 낮음. 내측 gate(1번)은 단거리에서 유리.
[말별 분석] 번개호(n=3): fs78 wp42% — 레이팅 87 최상위, 최근 4경주 [1,2,1,3] 안정적 상승세.
거리적합◎ + 기세↑ + 조교사 점수 70 양호. 약점: 6번 내측 gate인 천리마에 포위될 수 있음.
질풍마(n=7): fs64 — 레이팅 75, 최근 [2,3,2,4] 준수, 휴식 65(최적구간) 유리.
천리마(n=1): 내측gate 이점. 선행각질, 단거리 유리. 하지만 fs58, 레이팅 65 — 경쟁력 한 단계 낮음.
폭풍마(n=9): 등급 올라와 첫 출전, 외측 gate 불리. fs42 최하위.
[가치마 분석] 배당 미제공 — 생략.
[승부 예측] 번개호(3번) 압도적 우세. 단승 확실, 2착 싸움은 질풍마 vs 천리마.
[confidence] 번개호: wp42% + sub 대부분 65+ → "높음". 질풍마: wp28%, 변동성 → "보통". 나머지 "낮음".

출력 JSON:
{"scores":{"horseScores":[
  {"hrNo":"3","hrName":"번개호","score":78,"reason":"레이팅 87 최고, 최근 4경주 1·2위 안정, 거리 적합성 최상","strengths":["레이팅 87 출전마 최고","최근 4경주 평균 착순 1.75위"],"weaknesses":["내측 천리마의 선행 포위 가능성"],"confidence":"높음","keyFactors":["레이팅 최상위","최근 연속 입상","거리 적합◎"],"confidenceExplanation":"레이팅과 최근 폼 모두 출전마 중 최상위이며 거리 적합성도 탁월합니다."},
  {"hrNo":"7","hrName":"질풍마","score":64,"reason":"레이팅 75, 준수한 최근 성적, 최적 휴식기 후 출전","strengths":["최근 4경주 2위 2회","최적 휴식기(42일) 컨디션 양호"],"weaknesses":["레이팅 번개호 대비 12점 열세"],"confidence":"보통","keyFactors":["안정적 최근 성적","최적 휴식"],"confidenceExplanation":"2위 안착 가능성이 높습니다."},
  {"hrNo":"1","hrName":"천리마","score":58,"reason":"내측 gate 이점 있으나 레이팅 65로 상위마 대비 열세","strengths":["1번 gate 단거리 유리"],"weaknesses":["레이팅 65 중하위권"],"confidence":"낮음","keyFactors":["내측 게이트 이점"],"confidenceExplanation":"이변 요소가 있으나 전반적 경쟁력 부족입니다."},
  {"hrNo":"9","hrName":"폭풍마","score":42,"reason":"등급 상향 첫 출전, 외측 gate, fs 최하위","strengths":[],"weaknesses":["등급 상향 불리","9번 gate 외측 핸디캡"],"confidence":"낮음","keyFactors":["등급 불리","외측 gate"],"confidenceExplanation":"현 경쟁 조건에서 입상이 어렵습니다."}
]},
"betTypePredictions":{"SINGLE":{"hrNo":"3","reason":"wp42%, 레이팅·폼·거리 모두 최상위"},"PLACE":{"hrNo":"7","reason":"준수한 폼, 3위 내 안착 가능성 높음"},"QUINELLA":{"hrNos":["3","7"],"reason":"1·2위 조합. 번개호 우세, 질풍마 2착 안정"},"EXACTA":{"first":"3","second":"7","reason":"번개호 선두, 질풍마 추격 시나리오"},"QUINELLA_PLACE":{"hrNos":["3","1"],"reason":"천리마 내측 이점 활용, 3위 이내 가능성"},"TRIFECTA":{"hrNos":["3","7","1"],"reason":"안정권 3마리"},"TRIPLE":{"first":"3","second":"7","third":"1","reason":"번개호→질풍마→천리마 순 가장 유력"}},
"analysis":"1200m 단거리에서 레이팅 87의 번개호가 압도적 우세입니다. 최근 4경주 평균 착순 1.75로 상승세이며 거리 적합성도 최상입니다. 천리마(1번)의 내측 게이트 선행이 변수이나, 레이팅 격차(87 vs 65)가 크므로 중반 이후 번개호가 따라잡을 가능성이 높습니다. 2착 싸움은 질풍마(7번)와 천리마(1번) 사이에서 결정될 것으로 보입니다. 양호 주로 조건은 스피드형 번개호에 추가 유리합니다.",
"preview":"번개호(3번)의 단승이 가장 유력합니다. 레이팅과 최근 성적 모두 출전마 최고 수준이며 거리 적합성도 탁월합니다."}

---

## 예시 B — 박빙의 승부, 이변 가능성 높음 (부산경남 1200m, 약간 습주로)
입력 (5마리 요약, 상위 3마리 fs 차이 4점):
  n=2 h=강풍마 fs=70 wp=28 sub=[78,72,65,65,68,70,65,60,72,60,55,50,70,48,60] t=["R중상78","내측유리","기세↑"]
  n=5 h=폭우마 fs=68 wp=24 sub=[72,70,68,60,65,65,70,65,70,65,60,50,62,50,65] t=["R중상72","전개유리"]
  n=4 h=번개호 fs=66 wp=22 sub=[70,65,62,62,60,62,68,60,65,55,55,50,60,50,62] t=["등급↓유리"]
  n=7 h=질풍마 fs=52 wp=15 sub=[58,55,58,50,55,52,55,55,58,50,50,50,42,50,48] t=["외측불리"]
  n=1 h=선두마 fs=48 wp=11 sub=[55,50,55,45,48,45,50,50,50,50,45,50,68,48,35] t=["낙마위험35"]

사고 과정:
[경주 구조] 부산경남 1200m, 약간 습주로. 강풍마(2번)가 내측 선행 예상. 부산은 직선 짧아 선행 유리.
습주로: 선행 미끄러짐 위험, 추입마 상대적 유리. 폭우마(5번) "전개유리" 태그 → 추입 각질로 습주로 이득.
[말별 분석] 강풍마 fs70 wp28% — 내측유리+기세↑ 좋으나 습주로 선행 리스크.
폭우마 fs68 wp24% — 전개유리(추입), 습주로 이점, 거리 70 우수.
번개호 fs66 wp22% — 등급 하향, 경쟁력 상승. 3마리 fs 차이 4p → 이변 가능성 높음.
선두마 risk35: 낙마 위험, 습주로 선행 — 포함 시 연쇄위험 고려.
[가치마 분석] 배당 미제공. 폭우마(5번)가 wp24%이나 습주로+추입 이점 → model이 저평가했을 가능성.
[승부 예측] 상위 3마리 박빙. 습주로 특성 반영 시 추입 폭우마 또는 등급↓ 번개호 이변 가능성.
[confidence] 강풍마·폭우마·번개호 모두 "보통". 승부 미정 구간.

출력 JSON:
{"scores":{"horseScores":[
  {"hrNo":"2","hrName":"강풍마","score":70,"reason":"내측gate+기세↑ 유리하나 습주로 선행 리스크 내포","strengths":["레이팅 78 최고","1·2번 내측gate 부산 이점"],"weaknesses":["습주로 선행마 미끄러짐 위험"],"confidence":"보통","keyFactors":["내측 게이트","기세 상승"],"confidenceExplanation":"내측 유리하지만 습주로 변수로 결과가 열려 있습니다."},
  {"hrNo":"5","hrName":"폭우마","score":68,"reason":"추입각질·전개유리, 습주로에서 강점 극대화","strengths":["추입 각질 습주로 이점","거리 적합도 70 우수"],"weaknesses":["직선 짧은 부산에서 추입 늦으면 불리"],"confidence":"보통","keyFactors":["습주로 추입 이점","전개 유리"],"confidenceExplanation":"오늘 주로 조건에서 기대 이상 활약이 기대됩니다."},
  {"hrNo":"4","hrName":"번개호","score":66,"reason":"등급 하향으로 경쟁력 우위, 박빙 이변 후보","strengths":["등급↓유리 — 현 클래스 우위","fs 3위권 안정"],"weaknesses":["fs 상위마 대비 소폭 열세"],"confidence":"보통","keyFactors":["클래스 하향 이점"],"confidenceExplanation":"등급 하향 이점이 이변을 만들 수 있습니다."},
  {"hrNo":"7","hrName":"질풍마","score":52,"reason":"외측 gate 부산 불리, 상위마와 격차","strengths":["레이팅 중위권 안정"],"weaknesses":["7번 외측 gate 부산 핸디캡"],"confidence":"낮음","keyFactors":["외측 게이트 불리"],"confidenceExplanation":"외측 gate와 격차로 입상이 어렵습니다."},
  {"hrNo":"1","hrName":"선두마","score":48,"reason":"낙마위험 35 — 습주로 선행 리스크 가장 높음","strengths":["1번 내측 gate"],"weaknesses":["낙마위험 35, 습주로 선행 이중 리스크"],"confidence":"낮음","keyFactors":["낙마 위험"],"confidenceExplanation":"낙마 위험과 습주로 선행이 겹쳐 리스크가 높습니다."}
]},
"betTypePredictions":{"SINGLE":{"hrNo":"2","reason":"레이팅+내측 이점 소폭 우세, 단 선행 리스크 감안"},"PLACE":{"hrNo":"5","reason":"습주로 추입 이점, 3위 내 안착 가능성 높음"},"QUINELLA":{"hrNos":["2","5"],"reason":"박빙 1·2위 조합, 주로 조건이 결정"},"EXACTA":{"first":"5","second":"2","reason":"습주로 역전 시나리오: 폭우마 선두→강풍마 추격"},"QUINELLA_PLACE":{"hrNos":["2","4"],"reason":"등급↓ 번개호 이변 포함"},"TRIFECTA":{"hrNos":["2","5","4"],"reason":"박빙 상위 3마리"},"TRIPLE":{"first":"2","second":"5","third":"4","reason":"강풍마 선두, 폭우마 추격, 번개호 3착 안착 시나리오"}},
"analysis":"부산경남 1200m 약간 습주로에서 상위 3마리가 fs 4점 이내로 박빙입니다. 강풍마(2번)가 내측 게이트와 상승세로 유력하나, 습주로에서 선행마의 미끄러짐 위험이 변수입니다. 폭우마(5번)는 추입 각질로 오히려 습주로 이점을 누릴 수 있어 이변 가능성이 있습니다. 선두마(1번)는 낙마위험 35로 내측 gate 이점에도 불구하고 리스크 마크가 필요합니다. 직선이 짧은 부산 특성상 추입이 늦으면 폭우마도 불리해질 수 있어 최후 직선에서의 타이밍이 핵심입니다.",
"preview":"강풍마(2번)가 내측 게이트 이점으로 소폭 우세하나, 습주로 조건에서 추입 폭우마(5번)의 이변도 충분히 가능합니다."}
`;

// ---------------------------------------------------------------------------
// Sub-score field legend for the prompt
// ---------------------------------------------------------------------------
export const SUB_SCORE_LEGEND =
  'sub=[rat레이팅, frm폼/기세, cnd컨디션, exp경험, trn조교사, suit적합도, jky기수, rest휴식, dist거리적성, cls등급변동, trng조교상태, sdf당일피로, gate게이트, fsz출전두수, pace전개]';

// ---------------------------------------------------------------------------
// Distance context helper
// ---------------------------------------------------------------------------
export function distanceContext(
  rcDist: string | number | null | undefined,
): string {
  const d = Number(rcDist ?? 0);
  if (d <= 1200) return '단거리(스피드·게이트 반응 중시)';
  if (d <= 1600) return '마일(스피드+지구력 균형)';
  if (d >= 1800) return '중장거리(지구력·페이스배분·추입각질 유리)';
  return '중거리(밸런스)';
}

// ---------------------------------------------------------------------------
// Track context helper
// ---------------------------------------------------------------------------
export function trackContext(track: string | null | undefined): string {
  const t = track ?? '';
  if (t === '불' || t === '습')
    return '불량/습주로 — 선행마 미끄러짐 위험, 중위·후방 추입마에게 유리. 발잡음 좋은 마필 선호';
  if (t === '중')
    return '약간 습한 주로 — 선행마 소폭 불리, 경험 많은 마필 유리';
  return '양호 주로 — 정상 조건';
}

// ---------------------------------------------------------------------------
// Meet context helper
// ---------------------------------------------------------------------------
export function meetContext(
  meetName?: string | null,
  meet?: string | null,
): string {
  if (meetName === '서울' || meet === 'SEOUL') {
    return '서울(좌회전, 잔디 1800m 주로) — 코너워크 능력 중요, 내측 주로 유불리 있음';
  }
  if (meetName === '부산경남' || meet === 'BUSAN') {
    return '부산(좌회전, 모래 1500m 주로) — 직선 짧아 선행마 유리 경향, 게이트 반응 중요';
  }
  return '제주(좌회전, 모래 1200m 주로) — 소규모 경마장, 선행마 압도적 유리';
}

// ---------------------------------------------------------------------------
// Core race prediction prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds the full Gemini prompt for race-day prediction.
 * Uses Chain-of-Thought structure with embedded few-shot examples.
 *
 * The model is instructed to:
 * 1. Reason step-by-step (5 analysis stages)
 * 2. Produce structured JSON with explicit keyFactors and confidenceExplanation fields
 * 3. Not merely repeat numeric scores but integrate expert qualitative judgment
 */
export function buildRacePredictionPrompt(params: PromptBuildParams): string {
  const { raceCtx, compactEntries, weightH, weightJ, topJockey, realtime } =
    params;

  const realtimeSection = realtime
    ? `
## 실시간 분석 모드 (개별예측)
이 분석은 경주 직전 최신 KRA 데이터를 반영한 실시간 개별예측입니다.
- wg 필드는 당일 마체중(kg, 증감 포함). 체중 급변(-10kg이상 감소 또는 +8kg이상 증가)은 컨디션 이상 신호.
- 날씨·주로상태는 당일 실시간 기상 반영. 우천시 습주로 경험마 우선 평가.
- 배당률이 있으면 시장 평가와 모델 평가의 괴리를 분석해 저평가마(가치마) 발굴.
- 종합예측보다 더 깊고 구체적인 분석을 제공할 것. analysis는 8~12문장으로 상세하게.
`
    : '';

  const analysisLength = realtime ? '8~12' : '6~10';

  return `# 역할
당신은 30년 경력의 한국경마 전문 예측분석가입니다. 한국마사회(KRA) 서울·부산·제주 3개 경마장의 경주 패턴, 기수 성향, 마필 혈통·기질, 주로 특성을 모두 숙지하고 있습니다.
Python 통계모델(15요소 정규화 0~100)의 수치 분석을 기반으로, 데이터만으로는 포착할 수 없는 전문가적 통찰을 더해 최종 예측을 완성합니다.

**중요 — 사고 방식:**
최종 JSON 출력 전에 아래 1~5단계를 **반드시 순서대로 내부적으로 완료**하십시오.
단계별 추론이 충분해야 high-quality 예측이 나옵니다. 점수만 복사하는 예측은 금지합니다.

# 학습 예시 (Few-shot)
아래 두 예시는 우수한 예측 추론과 출력 형식의 기준입니다.
${FEW_SHOT_EXAMPLES}

# 실제 예측 요청

## 입력 데이터
가중치: 말${weightH}% / 기수${weightJ}%${topJockey ? ` | 기수 최고점: ${topJockey.hrName}(${topJockey.jkName}, ${Math.round(topJockey.jockeyScore)}점)` : ''}

### 경주 정보
${JSON.stringify(raceCtx)}

### 출전마 데이터
필드 설명: n=출전번호, h=마명, j=기수, fs=통합점수(말+기수+배당), wp=승률확률%, hs=말점수, js=기수점수
${SUB_SCORE_LEGEND}
r=KRA레이팅, wg=마체중(증감), rk=최근5경주착순, risk=낙마리스크(0~100), t=특이사항태그
${JSON.stringify(compactEntries)}
${realtimeSection}

# 분석 체계 (이 순서로 추론할 것)

## 1단계: 경주 구조 분석
- **페이스 판단**: 선행마(t에 "선행" 포함) 비율 → 3마리 이상이면 오버페이스 가능성 → 추입마 유리
- **거리 적합성**: ${distanceContext(raceCtx.rcDist)}
- **주로·날씨**: ${trackContext(raceCtx.track)}
- **경마장 특성**: ${meetContext(undefined, raceCtx.meet)}${raceCtx.cascadeFallRisk != null && raceCtx.cascadeFallRisk >= 10 ? `\n- **연쇄낙마 위험**: cascade=${raceCtx.cascadeFallRisk} — 낙마 위험 마필이 집중된 위험 구역 파악` : ''}

## 2단계: 말별 정밀 분석 (fs·sub·rk·risk 종합)
각 말에 대해:
- **레이팅(rat)+폼(frm)** 조합: 고레이팅+상승폼 = 핵심 우승후보, 고레이팅+하락폼 = 슬럼프 주의
- **최근착순(rk)**: [1,2,3...]이면 상승세. 최근 1경주가 가장 중요
- **컨디션(cnd)+마체중(wg)**: 체중 ±2kg 이내 = 안정. 급감(-5kg↓) = 컨디션 이상 의심
- **기수(jky)+기수점수(js)**: 해당 경마장 실적이 핵심
- **휴식(rest)**: 21~42일 최적. 14일 미만 = 피로, 90일+ = 실전감각 부족
- **등급(cls)**: "등급↓유리" 태그 = 하위 클래스로 내려가 경쟁력 우위
- **낙마(risk)**: 30 이상이면 반드시 약점에 언급. 50+ = 심각한 리스크
- **게이트(gate)+전개(pace)**: 내측 게이트 + 전개유리 조합 = 각질과 코스 궁합 최적

## 3단계: 가치마(value) 식별
배당률이 있으면 model wp(%)와 시장 내재 확률(1/배당)을 비교.
- **model wp > 시장 내재 확률**: 저평가마 → 가치마
- 가치마가 존재하면 SINGLE·QUINELLA·TRIFECTA 예측에서 우선 고려.
- 배당률 미제공 시 이 단계 생략.

## 4단계: 승부 예측
- **단승(SINGLE)**: 1위 최유력 후보
- **연승(PLACE)**: 3위 이내 안정적 후보
- **쌍승(QUINELLA)**: 1·2위 조합 (순서 무관)
- **복승(EXACTA)**: 1위→2위 순서
- **복연(QUINELLA_PLACE)**: 상위 3마리 중 2마리
- **삼복(TRIFECTA)**: 1·2·3위 (순서 무관)
- **삼쌍(TRIPLE)**: 1→2→3위 순서
★ 점수 순위 그대로 나열하지 말 것. 페이스·이변·가치마·역전 가능성을 반영해 전략적 조합 추천.
★ 상위 3마리 fs 차이 <5p인 경우, 이변 가능성을 높게 보고 분석할 것.

## 5단계: confidence + keyFactors + confidenceExplanation 판정
- "높음": wp 30%+ 이고 sub 대부분 60+ 이고 risk<20
- "보통": wp 15~30% 또는 강점과 약점 혼재
- "낮음": wp <15% 또는 risk 30+ 또는 핵심 요소 하위권
- keyFactors: 이 말의 예측에 가장 결정적인 요소 2~3개 (간결한 한국어 문구)
- confidenceExplanation: 사용자용 한 문장 (숫자 없이, 직관적으로)

# 출력 규칙
- reason: 해당 말의 핵심 포인트 1문장 (데이터 근거 + 전문가 판단). 말마다 다른 표현 사용.
- strengths: 강점 1~2개. 구체적 수치 포함 (예: "레이팅 82로 출전마 중 최고")
- weaknesses: 약점/리스크 1개. risk 30+ → 반드시 낙마위험 언급.
- keyFactors: 예측에 결정적인 요소 2~3개 배열 (문구 형태)
- confidenceExplanation: 사용자가 이해할 수 있는 한 문장 신뢰도 해설
- analysis: 경주 전체 흐름 서사 분석. ${analysisLength}문장. 숫자 나열 금지.
  ★ 필수: ①페이스전개 시나리오 ②핵심변수 ③승부포인트 ④이변가능성${raceCtx.cascadeFallRisk != null && raceCtx.cascadeFallRisk >= 20 ? ` ⑤연쇄낙마 위험(cascade=${raceCtx.cascadeFallRisk})` : ''}
- preview: 단승식 1위 예상마 중심 2~3문장. 다른 승식 언급 금지.
- 7승식 모두 출력. hrNo에는 출전번호(n값)를 사용.
- score: fs값 기반, 전문가 판단으로 ±5점 이내 조정 가능 (조정 이유를 reason에 명시)
- reasoning: 당신이 이 예측을 내린 핵심 근거 2~3문장 (CoT 요약). 모든 horseScores와 무관, 전체 경주 레벨 분석.

# 출력 형식 (JSON만, 다른 텍스트 없이)
{"scores":{"horseScores":[{"hrNo":"","hrName":"","score":0,"reason":"","strengths":[""],"weaknesses":[""],"confidence":"높음|보통|낮음","keyFactors":["",""],"confidenceExplanation":""}]},"betTypePredictions":{"SINGLE":{"hrNo":"","reason":""},"PLACE":{"hrNo":"","reason":""},"QUINELLA":{"hrNos":["",""],"reason":""},"EXACTA":{"first":"","second":"","reason":""},"QUINELLA_PLACE":{"hrNos":["",""],"reason":""},"TRIFECTA":{"hrNos":["","",""],"reason":""},"TRIPLE":{"first":"","second":"","third":"","reason":""}},"analysis":"","preview":"","reasoning":""}`;
}

// ---------------------------------------------------------------------------
// Post-race analysis prompt builder
// ---------------------------------------------------------------------------

export interface PostRacePromptParams {
  meet: string;
  rcDate: string;
  rcNo: string;
  topResults: string; // "1위: 번개호 (70.2초), 2위: 질풍마, 3위: ..."
  predictedTop: string; // "1위: 번개호, 2위: 질풍마, 3위: ..."
  accuracy: number; // 0–100
}

/**
 * Builds prompt for post-race analysis (after results arrive).
 * Factual and concise — no gambling/betting angle.
 */
export function buildPostRacePrompt(params: PostRacePromptParams): string {
  const { meet, rcDate, rcNo, topResults, predictedTop, accuracy } = params;
  return `다음 경주 결과와 AI 예측을 바탕으로 2~3문장의 경주 후 분석 요약을 한국어로 작성해 주세요.
감탄사나 과장 없이 사실 위주로. 예측이 맞은 이유 또는 빗나간 이유를 간결하게 설명할 것.

경주: ${meet} ${rcDate} ${rcNo}경주
실제 결과(상위3): ${topResults || '-'}
AI 예측 순위: ${predictedTop || '-'}
예측 적중률: ${accuracy}%

요약:`;
}
