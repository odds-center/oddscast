/**
 * 용산종합지 스타일 - 매트릭스/코멘트/적중 목업
 */

import type { MatrixResponseDto, CommentaryDto, HitRecordDto } from '@/lib/api/predictionMatrixApi';

const MOCK_PREFIX = 'mock-';

export const mockMatrixData: MatrixResponseDto = {
  experts: [{ id: 'ai_consensus', name: 'AI 종합' }],
  raceMatrix: [
    {
      raceId: `${MOCK_PREFIX}race-1`,
      meet: '서울',
      meetName: '서울',
      rcNo: '1',
      stTime: '10:35',
      predictions: { ai_consensus: '8' },
      aiConsensus: '8',
      consensusLabel: '축',
    },
    {
      raceId: `${MOCK_PREFIX}race-2`,
      meet: '서울',
      meetName: '서울',
      rcNo: '2',
      stTime: '11:00',
      predictions: { ai_consensus: '1' },
      aiConsensus: '1',
      consensusLabel: '축',
    },
    {
      raceId: `${MOCK_PREFIX}race-3`,
      meet: '서울',
      meetName: '서울',
      rcNo: '3',
      stTime: '12:05',
      predictions: { ai_consensus: '4' },
      aiConsensus: '4',
      consensusLabel: '축',
    },
    {
      raceId: `${MOCK_PREFIX}race-4`,
      meet: '서울',
      meetName: '서울',
      rcNo: '4',
      stTime: '13:20',
      predictions: { ai_consensus: '1' },
      aiConsensus: '1',
      consensusLabel: '축',
    },
  ],
};

export const mockCommentaryData: { comments: CommentaryDto[] } = {
  comments: [
    {
      id: 'c1',
      expertId: 'cha',
      expertName: '차민수의 히든카드',
      raceId: `${MOCK_PREFIX}race-1`,
      meet: '서울',
      rcNo: '1R',
      hrNo: '8',
      hrName: '콜미스카이',
      comment: '조교 강도 대폭 올려 승부 의지 강력함.',
      keywords: ['조교 강도', '승부 의지'],
    },
    {
      id: 'c2',
      expertId: 'park',
      expertName: '박건우 (신마뉴스)',
      raceId: `${MOCK_PREFIX}race-2`,
      meet: '서울',
      rcNo: '2R',
      hrNo: '6',
      hrName: '비트코드',
      comment: '막판 근성 보일 수 있는 선추입형. 전력 상승세 뚜렷.',
      keywords: ['선추입형', '전력 상승세'],
    },
    {
      id: 'c3',
      expertId: 'kang',
      expertName: '강병준 (정보력 1위)',
      raceId: `${MOCK_PREFIX}race-4`,
      meet: '서울',
      rcNo: '10R',
      hrNo: '9',
      hrName: '매직포션',
      comment: '부담중량 적절하고 최근 걸음이 가벼움. 강력 추천.',
      keywords: ['부담중량', '걸음'],
    },
  ],
};

/** Mock: 적중 내역 없음 (실제 데이터 있을 때만 배너 표시) */
export const mockHitRecords: HitRecordDto[] = [];
