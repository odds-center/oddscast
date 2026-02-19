/**
 * 용산종합지 스타일 - 종합 예상 매트릭스 API
 * GET /api/predictions/matrix, /api/predictions/commentary, /api/predictions/hit-record
 */

import { axiosInstance, handleApiResponse } from '@/lib/api/axios';
import RaceApi from './raceApi';
import PredictionApi from './predictionApi';
import CONFIG from '@/lib/config';
import { mockMatrixData, mockCommentaryData, mockHitRecords } from '@/lib/mocks/matrixData';

/** 경주별 예상 매트릭스 행 */
export interface MatrixRowDto {
  raceId: string;
  meet: string;
  meetName?: string;
  rcNo: string;
  stTime?: string;
  predictions: Record<string, string[] | string>; // expertId: ["8","1"] or "8"
  aiConsensus: string;
  consensusLabel?: string; // "축"
}

/** 매트릭스 응답 */
export interface MatrixResponseDto {
  raceMatrix: MatrixRowDto[];
  experts: { id: string; name: string }[];
}

/** 전문가 코멘트 */
export interface CommentaryDto {
  id: string;
  expertId: string;
  expertName: string;
  raceId: string;
  meet: string;
  rcNo: string;
  hrNo: string;
  hrName: string;
  comment: string;
  keywords?: string[];
}

/** 코멘트 응답 */
export interface CommentaryResponseDto {
  comments: CommentaryDto[];
  total: number;
}

/** 적중 내역 */
export interface HitRecordDto {
  id: string;
  hitDate: string;
  description: string;
  details?: string;
}

export default class PredictionMatrixApi {
  /**
   * 종합 예상 매트릭스 조회
   * date: YYYY-MM-DD, meet: 서울|제주|부산경남
   */
  static async getMatrix(date?: string, meet?: string): Promise<MatrixResponseDto> {
    if (CONFIG.useMock) {
      return mockMatrixData;
    }
    try {
      const response = await axiosInstance.get<{ data?: MatrixResponseDto } | MatrixResponseDto>(
        '/predictions/matrix',
        { params: { date, meet } },
      );
      return handleApiResponse(response) as MatrixResponseDto;
    } catch {
      return this.buildMatrixFromRaces(date, meet);
    }
  }

  /**
   * API 미구현 시 races + preview로 클라이언트에서 매트릭스 구축
   */
  private static async buildMatrixFromRaces(
    date?: string,
    meet?: string,
  ): Promise<MatrixResponseDto> {
    const useToday = !date || date === 'today';
    const list = useToday
      ? await RaceApi.getTodayRaces()
      : (await RaceApi.getRaces({ date, meet, limit: 20 })).races;

    const rows: MatrixRowDto[] = [];
    for (const race of list.slice(0, 12)) {
      const rid = String(race.id);
      let preview;
      try {
        preview = await PredictionApi.getPreview(rid);
      } catch {
        preview = null;
      }

      const scores =
        (preview as { scores?: { horseScores?: { hrNo?: string }[] } })?.scores?.horseScores ?? [];
      const top1 = scores[0]?.hrNo;
      const top2 = scores[1]?.hrNo;
      const consensus = top1 ?? '-';
      const consensusArr = top1 && top2 ? [top1, top2] : top1 ? [top1] : [];

      rows.push({
        raceId: rid,
        meet: race.meet ?? '',
        meetName: race.meetName,
        rcNo: race.rcNo ?? '',
        stTime: race.stTime,
        predictions: {
          ai_consensus: consensusArr.length > 0 ? consensusArr : consensus,
          expert_1: top1 && top2 ? [top1, top2] : top1 ? [top1] : [],
        },
        aiConsensus: consensus,
        consensusLabel: top1 ? '축' : undefined,
      });
    }

    return {
      raceMatrix: rows,
      experts: [{ id: 'ai_consensus', name: 'AI 종합' }],
    };
  }

  /**
   * 전문가 코멘트 피드
   */
  static async getCommentary(
    date?: string,
    limit = 20,
    offset = 0,
    meet?: string,
  ): Promise<CommentaryResponseDto> {
    if (CONFIG.useMock) {
      const comments = mockCommentaryData.comments.slice(offset, offset + limit);
      return { comments, total: mockCommentaryData.comments.length };
    }
    try {
      const response = await axiosInstance.get<{ data?: CommentaryResponseDto } | CommentaryResponseDto>(
        '/predictions/commentary',
        { params: { date, meet, limit, offset } },
      );
      return handleApiResponse(response) as CommentaryResponseDto;
    } catch {
      return { comments: [], total: 0 };
    }
  }

  /**
   * 적중 내역 (배너용)
   */
  static async getHitRecords(limit = 5): Promise<HitRecordDto[]> {
    if (CONFIG.useMock) {
      return mockHitRecords.slice(0, limit);
    }
    try {
      const response = await axiosInstance.get<{ data?: HitRecordDto[] } | HitRecordDto[]>(
        '/predictions/hit-record',
        { params: { limit } },
      );
      const data = handleApiResponse(response);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
}
