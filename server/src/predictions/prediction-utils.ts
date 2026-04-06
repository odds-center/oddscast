/**
 * Extracted utility functions from PredictionsService for testability.
 * These are pure functions with no DI dependencies.
 */
import * as crypto from 'crypto';

/** Gemini response JSON shape (minimal for parsing) */
export interface ParsedGeminiJson {
  horseScores?: unknown[];
  betTypePredictions?: Record<string, unknown>;
  analysis?: string;
  preview?: string;
  [key: string]: unknown;
}

/**
 * Parse Gemini API response text into JSON.
 * Handles: think blocks, markdown fences, trailing commas, jsonrepair fallback.
 */
export function parseGeminiResponseText(text: string): ParsedGeminiJson {
  let cleanText = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleanText = jsonMatch[0];

  try {
    return JSON.parse(cleanText) as ParsedGeminiJson;
  } catch {
    try {
      const fixed = cleanText.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(fixed) as ParsedGeminiJson;
    } catch {
      try {
        const { jsonrepair } = require('jsonrepair');
        const repaired = jsonrepair(cleanText) as string;
        return JSON.parse(repaired) as ParsedGeminiJson;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(
          `Gemini response JSON parse failed: ${msg}. First 300 chars: ${cleanText.slice(0, 300)}...`,
        );
      }
    }
  }
}

/**
 * Compute SHA-256 hash of entry fields for prediction cache deduplication.
 * Returns first 16 hex characters of the hash.
 */
export function computeEntriesHash(
  entries: Array<{
    hrNo?: string | null;
    jkNo?: string | null;
    chulNo?: string | number | null;
    wgBudam?: number | null;
    rating?: number | null;
  }>,
): string {
  const normalized = [...entries]
    .sort((a, b) => String(a.hrNo ?? '').localeCompare(String(b.hrNo ?? '')))
    .map((e) => ({
      hrNo: e.hrNo ?? '',
      jkNo: e.jkNo ?? '',
      chulNo: e.chulNo ?? '',
      wgBudam: e.wgBudam ?? 0,
      rating: e.rating ?? 0,
    }));
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Compute softmax win probabilities from composite scores.
 *
 * Adaptive temperature: when score spread is narrow (close race),
 * use lower T to amplify differences so top horse still shows
 * meaningfully higher probability. When spread is wide, use moderate T.
 *
 * Also applies score stretching: maps [min, max] → [0, 100] before
 * softmax to ensure even tight races produce differentiated probabilities.
 */
export function computeWinProbabilities(scores: number[]): number[] {
  if (!scores.length) return [];
  const n = scores.length;
  if (n === 1) return [100];

  const maxS = Math.max(...scores);
  const minS = Math.min(...scores);
  const spread = maxS - minS;

  // Stretch scores to [0, 100] range to amplify differences
  const stretched =
    spread > 0.01
      ? scores.map((s) => ((s - minS) / spread) * 100)
      : scores.map(() => 50);

  // Adaptive temperature: narrow spread → lower T (more decisive)
  // Wide spread → moderate T (avoid over-confidence)
  const T = spread > 15 ? 10 : spread > 8 ? 7 : 5;

  const stretchedMax = Math.max(...stretched);
  const exps = stretched.map((s) => Math.exp((s - stretchedMax) / T));
  const total = exps.reduce((a, b) => a + b, 0);
  if (total === 0) return scores.map(() => Math.round((100 / n) * 10) / 10);
  // Ensure minimum 0.1% per horse so no horse shows exactly 0%
  const raw = exps.map((e) => (e / total) * 100);
  const MIN_PROB = 0.1;
  const clamped = raw.map((p) => Math.max(MIN_PROB, p));
  const clampedTotal = clamped.reduce((a, b) => a + b, 0);
  return clamped.map((p) => Math.round((p / clampedTotal) * 1000) / 10);
}

export interface HorseScoreItem {
  hrNo?: string;
  hrName?: string;
  score?: number;
  winProb?: number;
  oddsImplied?: number;
  [key: string]: unknown;
}

/**
 * Apply horse+jockey score combination and optional market-odds blending.
 * Blend formula: adjustedScore = 0.8 × (hScore×wH + jScore×wJ) + 0.2 × oddsImplied×100
 */
export function applyOddsBlend(
  horseScores: HorseScoreItem[],
  jockeyAnalysis: {
    entriesWithScores?: Array<{
      hrNo?: string;
      hrName: string;
      jockeyScore: number;
    }>;
    weightRatio?: { horse: number; jockey: number };
  } | null,
  oddsByHrNo?: Record<string, number>,
): HorseScoreItem[] {
  if (!horseScores.length) return horseScores;

  const wH = jockeyAnalysis?.weightRatio?.horse ?? 0.7;
  const wJ = jockeyAnalysis?.weightRatio?.jockey ?? 0.3;
  const jockeyMap = new Map<string, number>();
  for (const x of jockeyAnalysis?.entriesWithScores ?? []) {
    const key = x.hrNo ?? x.hrName;
    if (key) jockeyMap.set(key, x.jockeyScore);
  }

  const combinedScores = horseScores.map((hs) => {
    const hrNo = String(hs.hrNo ?? '');
    const jScore = jockeyMap.get(hrNo) ?? jockeyMap.get(hs.hrName ?? '') ?? 0;
    return Math.round(((hs.score ?? 50) * wH + jScore * wJ) * 100) / 100;
  });

  const hasOdds = oddsByHrNo && Object.keys(oddsByHrNo).length > 0;
  const ODDS_WEIGHT = 0.2;
  let blendedScores = combinedScores;
  const oddsImpliedByIdx: number[] = horseScores.map(() => 0);

  if (hasOdds) {
    const invOdds = horseScores.map((hs) => {
      const w = oddsByHrNo![String(hs.hrNo ?? '')];
      return w != null && w > 0 ? 1 / w : 0;
    });
    const sumInv = invOdds.reduce((s, v) => s + v, 0);
    if (sumInv > 0) {
      blendedScores = combinedScores.map((cs, i) => {
        if (invOdds[i]! <= 0) return cs;
        const impliedPct = (invOdds[i]! / sumInv) * 100;
        oddsImpliedByIdx[i] = Math.round(impliedPct * 100) / 100;
        return (
          Math.round(
            ((1 - ODDS_WEIGHT) * cs + ODDS_WEIGHT * impliedPct) * 100,
          ) / 100
        );
      });
    }
  }

  const probs = computeWinProbabilities(blendedScores);

  return horseScores.map((hs, i) => {
    const patched: HorseScoreItem = {
      ...hs,
      winProb: probs[i] ?? hs.winProb,
    };
    if (hasOdds && oddsImpliedByIdx[i]! > 0) {
      patched.oddsImplied = oddsImpliedByIdx[i];
    }
    return patched;
  });
}
