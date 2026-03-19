import { buildRaceUpsertPayload } from './kra-utils';

describe('buildRaceUpsertPayload', () => {
  const now = new Date('2026-03-19T00:00:00Z');

  const baseParams = {
    meet: '서울',
    meetName: 'Seoul',
    rcDate: '20260319',
    rcNo: '1',
    rcName: 'Test Race',
    createdAt: now,
    updatedAt: now,
  };

  it('should always include required fields', () => {
    const result = buildRaceUpsertPayload(baseParams);
    expect(result.meet).toBe('서울');
    expect(result.meetName).toBe('Seoul');
    expect(result.rcDate).toBe('20260319');
    expect(result.rcNo).toBe('1');
    expect(result.rcName).toBe('Test Race');
    expect(result.createdAt).toBe(now);
    expect(result.updatedAt).toBe(now);
  });

  it('should include nullable fields when they have values', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      rcDist: '1400',
      rank: '국3',
      stTime: '14:30',
      weather: '맑음',
      track: '양',
    });
    expect(result.rcDist).toBe('1400');
    expect(result.rank).toBe('국3');
    expect(result.stTime).toBe('14:30');
    expect(result.weather).toBe('맑음');
    expect(result.track).toBe('양');
  });

  it('should EXCLUDE nullable fields when null — prevents overwriting existing data', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      rcDist: null,
      rank: null,
      stTime: null,
      weather: null,
      track: null,
    });
    expect(result).not.toHaveProperty('rcDist');
    expect(result).not.toHaveProperty('rank');
    expect(result).not.toHaveProperty('stTime');
    expect(result).not.toHaveProperty('weather');
    expect(result).not.toHaveProperty('track');
  });

  it('should EXCLUDE nullable fields when undefined', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      rcDist: undefined,
      rank: undefined,
    });
    expect(result).not.toHaveProperty('rcDist');
    expect(result).not.toHaveProperty('rank');
  });

  it('should preserve rcDist from source A when source B has null', () => {
    // Source A provides rcDist
    const fromSourceA = buildRaceUpsertPayload({
      ...baseParams,
      rcDist: '1400',
      weather: '맑음',
    });
    expect(fromSourceA.rcDist).toBe('1400');
    expect(fromSourceA.weather).toBe('맑음');

    // Source B does not have rcDist or weather
    const fromSourceB = buildRaceUpsertPayload({
      ...baseParams,
      rcDist: null,
      weather: null,
    });
    // These fields should NOT be in the payload, so DB upsert won't touch them
    expect(fromSourceB).not.toHaveProperty('rcDist');
    expect(fromSourceB).not.toHaveProperty('weather');
  });

  it('should include status when provided', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      status: 'COMPLETED',
    });
    expect(result.status).toBe('COMPLETED');
  });

  it('should exclude status when null', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      status: undefined,
    });
    expect(result).not.toHaveProperty('status');
  });

  it('should set meetName to null when explicitly null', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      meetName: null,
    });
    expect(result.meetName).toBeNull();
  });

  it('should include rcPrize when > 0', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      rcPrize: 50000,
    });
    expect(result.rcPrize).toBe(50000);
  });

  it('should exclude rcPrize when null', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      rcPrize: null,
    });
    expect(result).not.toHaveProperty('rcPrize');
  });

  it('should include all conditional fields simultaneously', () => {
    const result = buildRaceUpsertPayload({
      ...baseParams,
      rcDist: '1600',
      rcDay: '금',
      rank: '국1',
      rcPrize: 100000,
      stTime: '15:00',
      rcCondition: '양호',
      weather: '흐림',
      track: '중',
      status: 'SCHEDULED',
    });
    expect(Object.keys(result)).toContain('rcDist');
    expect(Object.keys(result)).toContain('rcDay');
    expect(Object.keys(result)).toContain('rank');
    expect(Object.keys(result)).toContain('rcPrize');
    expect(Object.keys(result)).toContain('stTime');
    expect(Object.keys(result)).toContain('rcCondition');
    expect(Object.keys(result)).toContain('weather');
    expect(Object.keys(result)).toContain('track');
    expect(Object.keys(result)).toContain('status');
  });
});
