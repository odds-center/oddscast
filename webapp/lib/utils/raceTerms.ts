/**
 * Race/entry terminology — readable labels and tooltips for KRA codes
 * @see docs/reference/HORSE_RACING_TERMINOLOGY.md
 */

export interface TermOption {
  label: string;
  tooltip: string;
}

/** 경주 등급 (rank) — 알아보기 쉬운 라벨 + 설명 */
export function getRankTerm(rank: string | null | undefined): TermOption | null {
  if (!rank || !rank.trim()) return null;
  const r = rank.trim();
  // 국6등급 → 국가 6등급, 국1등급 → 국가 1등급
  if (/^국\d등급$/.test(r)) {
    const n = r.replace(/\D/g, '');
    return {
      label: `국가 ${n}등급`,
      tooltip: '경주의 등급 조건. 숫자가 낮을수록 상위 등급 경주입니다.',
    };
  }
  if (/^지방\d등급$/.test(r)) {
    const n = r.replace(/\D/g, '');
    return {
      label: `지방 ${n}등급`,
      tooltip: '지방 등급제에 따른 경주 조건입니다.',
    };
  }
  return { label: r, tooltip: '경주 등급·조건입니다.' };
}

/** 경주 조건 (rcCondition) — 일반, 마령, 특별, 별정A 등 */
export function getRcConditionTerm(rcCondition: string | null | undefined): TermOption | null {
  if (!rcCondition || !rcCondition.trim()) return null;
  const c = rcCondition.trim();
  // 부담구분이 rcCondition으로 올 수 있음 (별정A 등)
  const budam = getBudamTerm(c);
  if (budam) return budam;
  const map: Record<string, TermOption> = {
    일반: { label: '일반', tooltip: '일반적인 경주 조건입니다.' },
    마령: {
      label: '마령',
      tooltip: '말의 나이와 성별에 따라 부담중량이 정해지는 경주입니다.',
    },
    특별: {
      label: '특별',
      tooltip: '등록료가 1·2·3착 상금에 포함되는 특별 경주입니다.',
    },
    핸디캡: {
      label: '핸디캡',
      tooltip: '능력별로 차등 부담중량을 부여하는 경주입니다.',
    },
  };
  return map[c] ?? { label: c, tooltip: '경주 조건입니다.' };
}

/** 부담구분 (budam) — 별정A, 별정B, 마령 등 */
export function getBudamTerm(budam: string | null | undefined): TermOption | null {
  if (!budam || !budam.trim()) return null;
  const b = budam.trim();
  const map: Record<string, TermOption> = {
    별정A: {
      label: '별정 A형',
      tooltip: '상금을 많이 번 말일수록 무거운 부담중량을 짊어집니다. (증량)',
    },
    별정B: {
      label: '별정 B형',
      tooltip: '상금이 적은 말일수록 무거운 부담중량을 짊어집니다. (감량)',
    },
    별정C: {
      label: '별정 C형',
      tooltip: '우승 확률이 높은 말은 무겁게, 부진한 말은 가볍게 부담중량이 정해집니다.',
    },
    마령: {
      label: '마령',
      tooltip: '말의 나이·성별에 따라 부담중량이 규정대로 정해집니다.',
    },
    핸디캡: {
      label: '핸디캡',
      tooltip: '전문위원이 말의 능력별로 차등 부담중량을 부여합니다.',
    },
  };
  return map[b] ?? { label: b, tooltip: '부담중량 결정 방식입니다.' };
}

/** 날씨 — 약어가 있으면 풀어쓰기 */
export function getWeatherTerm(weather: string | null | undefined): TermOption | null {
  if (!weather || !weather.trim()) return null;
  const w = weather.trim();
  const map: Record<string, TermOption> = {
    맑음: { label: '맑음', tooltip: '날씨: 맑음' },
    흐림: { label: '흐림', tooltip: '날씨: 흐림' },
    비: { label: '비', tooltip: '날씨: 비' },
    눈: { label: '눈', tooltip: '날씨: 눈' },
  };
  return map[w] ?? { label: w, tooltip: `날씨: ${w}` };
}

/** 주로 상태 (track) — 건조, 양호 등
 * Raw DB values: "양호 (7%)", "건조 (moisture -%)", "- (moisture -%)", " (%)" etc.
 * Extracts Korean condition label and moisture percentage separately.
 */
export function getTrackTerm(track: string | null | undefined): TermOption | null {
  if (!track || !track.trim()) return null;
  const raw = track.trim();

  // Skip meaningless values
  if (raw === '(%)' || raw === '- (moisture -%)' || raw === '-') return null;

  // Extract condition name (Korean part before parentheses)
  const condMatch = raw.match(/^([가-힣]+)/);
  const condition = condMatch?.[1] ?? '';

  // Extract moisture percentage if present (e.g., "7%" from "(7%)")
  const moistMatch = raw.match(/\((\d+)%\)/);
  const moisture = moistMatch?.[1] ? `${moistMatch[1]}%` : null;

  const conditionMap: Record<string, { label: string; desc: string }> = {
    건조: { label: '건조', desc: '건조 (수분 적음)' },
    양호: { label: '양호', desc: '양호 (적당한 수분)' },
    다습: { label: '다습', desc: '다습 (수분 많음)' },
    포화: { label: '포화', desc: '포화 (젖은 주로)' },
    불량: { label: '불량', desc: '불량 (매우 젖음)' },
  };

  const info = condition ? conditionMap[condition] : null;
  if (!info) return null;

  const label = moisture ? `${info.label} (${moisture})` : info.label;
  const tooltip = moisture
    ? `주로 상태: ${info.desc} — 함수율 ${moisture}`
    : `주로 상태: ${info.desc}`;

  return { label, tooltip };
}
