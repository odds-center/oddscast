import { parseOrd, isEligibleForAccuracy } from './ord-parser';

describe('parseOrd', () => {
  describe('normal finishes', () => {
    it('should parse numeric finish positions', () => {
      expect(parseOrd('1')).toEqual({ ordInt: 1, ordType: null });
      expect(parseOrd('5')).toEqual({ ordInt: 5, ordType: null });
      expect(parseOrd('14')).toEqual({ ordInt: 14, ordType: null });
    });

    it('should parse numeric input as number', () => {
      expect(parseOrd(3)).toEqual({ ordInt: 3, ordType: null });
    });
  });

  describe('fall detection', () => {
    it('should detect 낙마', () => {
      expect(parseOrd('낙마')).toEqual({ ordInt: undefined, ordType: 'FALL' });
      expect(parseOrd('낙')).toEqual({ ordInt: undefined, ordType: 'FALL' });
      expect(parseOrd('낙마(기권)')).toEqual({
        ordInt: undefined,
        ordType: 'FALL',
      });
    });
  });

  describe('DQ detection', () => {
    it('should detect 실격', () => {
      expect(parseOrd('실격')).toEqual({ ordInt: undefined, ordType: 'DQ' });
      // '실격(낙마)' contains '낙' → matched as FALL first (ORD_TYPE_MAP order)
      expect(parseOrd('실격(낙마)')).toEqual({
        ordInt: undefined,
        ordType: 'FALL',
      });
      // '실격(기권)' → '실격' matches DQ pattern first (before WITHDRAWN '기권')
      expect(parseOrd('실격(기권)')).toEqual({
        ordInt: undefined,
        ordType: 'DQ',
      });
    });

    it('should treat 90+ as DQ', () => {
      expect(parseOrd('90')).toEqual({ ordInt: undefined, ordType: 'DQ' });
      expect(parseOrd('99')).toEqual({ ordInt: undefined, ordType: 'DQ' });
    });
  });

  describe('withdrawal detection', () => {
    it('should detect 기권/취소', () => {
      expect(parseOrd('기권')).toEqual({
        ordInt: undefined,
        ordType: 'WITHDRAWN',
      });
      expect(parseOrd('출전취소')).toEqual({
        ordInt: undefined,
        ordType: 'WITHDRAWN',
      });
      expect(parseOrd('취소')).toEqual({
        ordInt: undefined,
        ordType: 'WITHDRAWN',
      });
      expect(parseOrd('선제')).toEqual({
        ordInt: undefined,
        ordType: 'WITHDRAWN',
      });
    });
  });

  describe('edge cases', () => {
    it('should return undefined for empty/null', () => {
      expect(parseOrd(null)).toEqual({ ordInt: undefined, ordType: null });
      expect(parseOrd(undefined)).toEqual({ ordInt: undefined, ordType: null });
      expect(parseOrd('')).toEqual({ ordInt: undefined, ordType: null });
    });

    it('should handle whitespace', () => {
      expect(parseOrd('  3  ')).toEqual({ ordInt: 3, ordType: null });
    });

    it('should treat unmapped non-numeric as DQ', () => {
      expect(parseOrd('???')).toEqual({ ordInt: undefined, ordType: 'DQ' });
    });
  });
});

describe('isEligibleForAccuracy', () => {
  it('should include null ordType (normal finish)', () => {
    expect(isEligibleForAccuracy(null)).toBe(true);
    expect(isEligibleForAccuracy(undefined)).toBe(true);
  });

  it('should include NORMAL ordType', () => {
    expect(isEligibleForAccuracy('NORMAL')).toBe(true);
  });

  it('should exclude FALL', () => {
    expect(isEligibleForAccuracy('FALL')).toBe(false);
  });

  it('should exclude DQ', () => {
    expect(isEligibleForAccuracy('DQ')).toBe(false);
  });

  it('should exclude WITHDRAWN', () => {
    expect(isEligibleForAccuracy('WITHDRAWN')).toBe(false);
  });
});
