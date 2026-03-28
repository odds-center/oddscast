/**
 * Yongsan comprehensive style — comprehensive prediction matrix API
 * GET /api/predictions/matrix, /api/predictions/commentary, /api/predictions/hit-record
 */

import { axiosInstance, handleApiResponse } from '@/lib/api/axios';
import RaceApi from './raceApi';
import PredictionApi from './predictionApi';
import type { PredictionHorseScore } from '@/lib/types/predictions';

/** Prediction matrix row per race */
export interface MatrixRowDto {
  raceId: string;
  meet: string;
  meetName?: string;
  rcNo: string;
  stTime?: string;
  rcDist?: string;
  rank?: string;
  entryCount?: number;
  entries?: Array<{ hrNo: string; hrName: string; chulNo?: string }>;
  predictions: Record<string, string[] | string>;
  horseNames?: Record<string, string>;
  aiConsensus: string;
  consensusLabel?: string;
  /** Full ranked horse scores — used for bet type derivation when unlocked */
  horseScores?: PredictionHorseScore[];
  /** AI analysis text for this race */
  analysis?: string;
}

/** Matrix response */
export interface MatrixResponseDto {
  raceMatrix: MatrixRowDto[];
  experts: { id: string; name: string }[];
}

/** Expert commentary */
export interface CommentaryDto {
  id: string;
  expertId: string;
  expertName: string;
  raceId: string;
  meet: string;
  rcNo: string;
  chulNo?: string;
  hrNo: string;
  hrName: string;
  comment: string;
  keywords?: string[];
}

/** Commentary response */
export interface CommentaryResponseDto {
  comments: CommentaryDto[];
  total: number;
}

/** Hit records */
export interface HitRecordDto {
  id: string;
  raceId?: number;
  hitDate: string;
  meet?: string;
  rcNo?: string;
  accuracy?: number;
  description: string;
  details?: string;
  /** Bet type name (e.g. 단승식, 복승식) when dividend matched */
  betType?: string | null;
  /** Bet type code (WIN, PLC, QNL, etc.) */
  betTypeCode?: string | null;
  /** Matched dividend odds multiplier */
  dividendOdds?: number | null;
}

export default class PredictionMatrixApi {
  /**
   * Get comprehensive prediction matrix
   * date: YYYY-MM-DD, meet: Seoul|Jeju|BusanGyeongnam
   * unlocked: true when user has matrix access — fetches full analysis per race
   */
  static async getMatrix(date?: string, meet?: string, unlocked = false): Promise<MatrixResponseDto> {
    try {
      const response = await axiosInstance.get<{ data?: MatrixResponseDto } | MatrixResponseDto>(
        '/predictions/matrix',
        { params: { date, meet } },
      );
      return handleApiResponse(response) as MatrixResponseDto;
    } catch {
      return this.buildMatrixFromRaces(date, meet, unlocked);
    }
  }

  /**
   * Build matrix on client side using races + preview when API is not implemented
   * unlocked=true: also fetch full prediction analysis per race (for unlocked matrix)
   */
  private static async buildMatrixFromRaces(
    date?: string,
    meet?: string,
    unlocked = false,
  ): Promise<MatrixResponseDto> {
    const useToday = !date || date === 'today';
    const list = useToday
      ? await RaceApi.getTodayRaces()
      : (await RaceApi.getRaces({ date, meet, limit: 100 })).races;

    const rows: MatrixRowDto[] = [];
    for (const race of list) {
      const rid = String(race.id);
      let preview;
      try {
        preview = await PredictionApi.getPreview(rid);
      } catch {
        preview = null;
      }

      // When unlocked, also fetch full prediction for analysis text and better scores
      type FullPrediction = { analysis?: string; scores?: { horseScores?: { hrNo?: string; hrName?: string; score?: number; chulNo?: string }[] } };
      let fullPrediction: FullPrediction | null = null;
      if (unlocked) {
        try {
          fullPrediction = await PredictionApi.getByRaceId(rid) as unknown as FullPrediction;
        } catch {
          fullPrediction = null;
        }
      }

      const previewScores = (preview as { scores?: { horseScores?: { hrNo?: string; hrName?: string }[] } })?.scores?.horseScores ?? [];
      const fullScores = fullPrediction?.scores?.horseScores ?? [];
      const scores = fullScores.length > 0 ? fullScores : previewScores;
      const top1 = scores[0]?.hrNo;
      const top2 = scores[1]?.hrNo;
      const consensus = top1 ?? '-';
      const consensusArr = top1 && top2 ? [top1, top2] : top1 ? [top1] : [];

      const raceAny = race as unknown as Record<string, unknown>;
      const entryRaw = (raceAny.entries ?? raceAny.entryDetails ?? []) as Array<{ hrNo?: string; hrName?: string; chulNo?: string }>;

      // Build chulNo lookup from scores (prediction scores often carry chulNo even when entry sheet is missing)
      const chulNoByHrNo: Record<string, string> = {};
      for (const s of scores) {
        if (s.hrNo && (s as { chulNo?: string }).chulNo) {
          chulNoByHrNo[s.hrNo] = (s as { chulNo?: string }).chulNo!;
        }
      }

      const horseNames: Record<string, string> = {};
      for (const e of entryRaw) {
        if (e.hrNo && e.hrName) horseNames[e.hrNo] = e.hrName;
      }
      for (const s of scores) {
        if (s.hrNo && s.hrName && !horseNames[s.hrNo]) horseNames[s.hrNo] = s.hrName;
      }

      // Enrich entries: fill chulNo from scores when entry sheet chulNo is missing
      const enrichedEntries = entryRaw.map((e) => ({
        hrNo: e.hrNo ?? '',
        hrName: e.hrName ?? '',
        chulNo: e.chulNo ?? (e.hrNo ? chulNoByHrNo[e.hrNo] : undefined),
      }));

      rows.push({
        raceId: rid,
        meet: race.meet ?? '',
        meetName: race.meetName,
        rcNo: race.rcNo ?? '',
        stTime: race.stTime,
        rcDist: (raceAny.rcDist as string) ?? undefined,
        rank: (raceAny.rank as string) ?? undefined,
        entryCount: enrichedEntries.length > 0 ? enrichedEntries.length : undefined,
        entries: enrichedEntries,
        predictions: {
          ai_consensus: consensusArr.length > 0 ? consensusArr : consensus,
          expert_1: top1 && top2 ? [top1, top2] : top1 ? [top1] : [],
        },
        horseNames,
        aiConsensus: consensus,
        consensusLabel: top1 ? '축' : undefined,
        horseScores: scores.length > 0 ? scores : undefined,
        analysis: (fullPrediction as { analysis?: string } | null)?.analysis
          || (preview as { analysis?: string })?.analysis
          || (preview as { preview?: string })?.preview
          || undefined,
      });
    }

    return {
      raceMatrix: rows,
      experts: [{ id: 'ai_consensus', name: 'AI 종합' }],
    };
  }

  /**
   * Expert commentary feed
   */
  static async getCommentary(
    date?: string,
    limit = 20,
    offset = 0,
    meet?: string,
  ): Promise<CommentaryResponseDto> {
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
   * Hit records (for banner)
   */
  static async getHitRecords(limit = 5): Promise<HitRecordDto[]> {
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
