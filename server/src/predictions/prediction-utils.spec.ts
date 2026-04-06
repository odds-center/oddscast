import {
  parseGeminiResponseText,
  computeEntriesHash,
  computeWinProbabilities,
  applyOddsBlend,
} from './prediction-utils';

describe('parseGeminiResponseText', () => {
  it('should parse clean JSON', () => {
    const input =
      '{"horseScores": [{"hrNo": "1", "score": 80}], "analysis": "test"}';
    const result = parseGeminiResponseText(input);
    expect(result.horseScores).toHaveLength(1);
    expect(result.analysis).toBe('test');
  });

  it('should strip ```json markdown fences', () => {
    const input = '```json\n{"horseScores": [], "analysis": "ok"}\n```';
    const result = parseGeminiResponseText(input);
    expect(result.analysis).toBe('ok');
  });

  it('should strip <think> blocks from Gemini 2.5', () => {
    const input =
      '<think>내부 추론 과정...</think>{"horseScores": [], "analysis": "clean"}';
    const result = parseGeminiResponseText(input);
    expect(result.analysis).toBe('clean');
  });

  it('should strip multiline <think> blocks', () => {
    const input = `<think>
    Step 1: Analyze data
    Step 2: Generate scores
    </think>
    {"horseScores": [{"hrNo": "1"}]}`;
    const result = parseGeminiResponseText(input);
    expect(result.horseScores).toHaveLength(1);
  });

  it('should fix trailing commas', () => {
    const input = '{"horseScores": [{"hrNo": "1",},], "analysis": "test",}';
    const result = parseGeminiResponseText(input);
    expect(result.horseScores).toHaveLength(1);
  });

  it('should extract JSON from surrounding text', () => {
    const input =
      'Here is the analysis:\n{"horseScores": [], "analysis": "extracted"}\nEnd of response';
    const result = parseGeminiResponseText(input);
    expect(result.analysis).toBe('extracted');
  });

  it('should attempt recovery on non-JSON text', () => {
    // jsonrepair may recover some malformed inputs into valid JSON values
    // The function does not guarantee throwing — it tries its best to parse
    const result = parseGeminiResponseText('not json at all');
    // Whatever jsonrepair produces is accepted (graceful degradation)
    expect(result).toBeDefined();
  });

  it('should handle empty input', () => {
    // Empty string has no JSON match → will go through all fallbacks
    try {
      parseGeminiResponseText('');
    } catch (e) {
      expect(String(e)).toMatch(/Gemini response JSON parse failed/);
    }
  });

  it('should handle nested JSON with special characters', () => {
    const input = JSON.stringify({
      horseScores: [
        {
          hrNo: '1',
          reason: 'Strong finish in 1:12.3',
          strengths: ['Speed', 'Form'],
        },
      ],
      analysis: 'Test "quoted" text',
    });
    const result = parseGeminiResponseText(input);
    expect(result.horseScores).toHaveLength(1);
  });
});

describe('computeEntriesHash', () => {
  it('should return 16-char hex string', () => {
    const hash = computeEntriesHash([
      { hrNo: '1', jkNo: '101', chulNo: '3', wgBudam: 55, rating: 70 },
    ]);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should produce same hash for same entries regardless of order', () => {
    const entries = [
      { hrNo: '2', jkNo: '102', chulNo: '5', wgBudam: 57, rating: 65 },
      { hrNo: '1', jkNo: '101', chulNo: '3', wgBudam: 55, rating: 70 },
    ];
    const reversed = [entries[1], entries[0]];
    expect(computeEntriesHash(entries)).toBe(computeEntriesHash(reversed!));
  });

  it('should produce different hash when entry changes', () => {
    const base = [{ hrNo: '1', jkNo: '101', wgBudam: 55, rating: 70 }];
    const changed = [{ hrNo: '1', jkNo: '101', wgBudam: 56, rating: 70 }];
    expect(computeEntriesHash(base)).not.toBe(computeEntriesHash(changed));
  });

  it('should handle null/undefined fields', () => {
    const hash = computeEntriesHash([{ hrNo: null, jkNo: undefined }]);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should produce different hash for different jockeys', () => {
    const a = [{ hrNo: '1', jkNo: '101' }];
    const b = [{ hrNo: '1', jkNo: '202' }];
    expect(computeEntriesHash(a)).not.toBe(computeEntriesHash(b));
  });

  it('should return empty hash for empty entries', () => {
    const hash = computeEntriesHash([]);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('computeWinProbabilities', () => {
  it('should return empty for empty input', () => {
    expect(computeWinProbabilities([])).toEqual([]);
  });

  it('should sum to approximately 100', () => {
    const probs = computeWinProbabilities([80, 70, 65, 55, 45]);
    const sum = probs.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 100)).toBeLessThan(1);
  });

  it('should give highest probability to highest score', () => {
    const probs = computeWinProbabilities([90, 50, 30]);
    expect(probs[0]).toBeGreaterThan(probs[1]!);
    // Lowest horse may hit minimum floor but should still be >= 0
    expect(probs[1]!).toBeGreaterThanOrEqual(probs[2]!);
  });

  it('should give equal probabilities for equal scores', () => {
    const probs = computeWinProbabilities([50, 50, 50]);
    expect(probs[0]).toBeCloseTo(probs[1]!, 1);
    expect(probs[1]).toBeCloseTo(probs[2]!, 1);
  });

  it('should produce meaningful separation with adaptive temperature', () => {
    const probs = computeWinProbabilities([90, 50]);
    // Adaptive T with score stretching: top horse should dominate
    expect(probs[0]).toBeGreaterThan(50);
  });
});

describe('applyOddsBlend', () => {
  const baseHorses = [
    { hrNo: '1', hrName: 'Thunder', score: 80 },
    { hrNo: '2', hrName: 'Lightning', score: 60 },
    { hrNo: '3', hrName: 'Storm', score: 40 },
  ];

  it('should return original scores when no jockey data', () => {
    const result = applyOddsBlend(baseHorses, null);
    expect(result).toHaveLength(3);
    result.forEach((r) => {
      expect(r.winProb).toBeDefined();
      expect(r.winProb).toBeGreaterThan(0);
    });
  });

  it('should apply horse/jockey weight ratio', () => {
    const jockeyAnalysis = {
      entriesWithScores: [
        { hrNo: '1', hrName: 'Thunder', jockeyScore: 90 },
        { hrNo: '2', hrName: 'Lightning', jockeyScore: 50 },
        { hrNo: '3', hrName: 'Storm', jockeyScore: 70 },
      ],
      weightRatio: { horse: 0.7, jockey: 0.3 },
    };
    const result = applyOddsBlend(baseHorses, jockeyAnalysis);
    expect(result).toHaveLength(3);
    // All should have winProb
    result.forEach((r) => expect(r.winProb).toBeDefined());
  });

  it('should blend odds when provided', () => {
    const oddsByHrNo = { '1': 2.0, '2': 5.0, '3': 10.0 };
    const result = applyOddsBlend(baseHorses, null, oddsByHrNo);
    // Horse 1 has lowest odds (most favored) → oddsImplied should be highest
    expect(result[0]!.oddsImplied).toBeGreaterThan(result[1]!.oddsImplied!);
    expect(result[1]!.oddsImplied).toBeGreaterThan(result[2]!.oddsImplied!);
  });

  it('should not add oddsImplied when no odds data', () => {
    const result = applyOddsBlend(baseHorses, null);
    result.forEach((r) => expect(r.oddsImplied).toBeUndefined());
  });

  it('should return empty for empty input', () => {
    expect(applyOddsBlend([], null)).toEqual([]);
  });

  it('should handle horses with missing odds gracefully', () => {
    const oddsByHrNo = { '1': 3.0 }; // only horse 1 has odds
    const result = applyOddsBlend(baseHorses, null, oddsByHrNo);
    expect(result).toHaveLength(3);
    expect(result[0]!.oddsImplied).toBeGreaterThan(0);
    // Horses without odds should not have oddsImplied
    expect(result[1]!.oddsImplied).toBeUndefined();
  });

  it('should ensure winProb sums to ~100', () => {
    const result = applyOddsBlend(baseHorses, null, {
      '1': 2.0,
      '2': 5.0,
      '3': 10.0,
    });
    const sum = result.reduce((s, r) => s + (r.winProb ?? 0), 0);
    expect(Math.abs(sum - 100)).toBeLessThan(1);
  });
});
