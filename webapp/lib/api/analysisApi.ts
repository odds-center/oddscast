import { axiosInstance, handleApiResponse } from '@/lib/api/axios';

export interface JockeyAnalysisEntry {
  hrNo: string;
  hrName: string;
  jkNo: string;
  jkName: string;
  horseScore: number;
  jockeyScore: number;
  combinedScore: number;
}

export interface JockeyAnalysis {
  entriesWithScores: JockeyAnalysisEntry[];
  weightRatio: { horse: number; jockey: number };
  topPickByJockey: {
    hrNo: string;
    hrName: string;
    jkNo: string;
    jkName: string;
    jockeyScore: number;
  } | null;
}

/**
 * 경주별 기수·말 통합 분석 (마칠기삼)
 * GET /api/analysis/race/:raceId/jockey
 */
export default class AnalysisApi {
  static async getJockeyAnalysis(raceId: string): Promise<JockeyAnalysis> {
    const response = await axiosInstance.get(`/analysis/race/${raceId}/jockey`);
    return handleApiResponse(response);
  }
}
