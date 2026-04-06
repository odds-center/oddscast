import { axiosInstance, handleApiResponse } from '@/lib/api/axios';

// --- Response types ---

export type MeetCode = '서울' | '제주' | '부산경남';

export interface PostPositionStat {
  /** Gate number (chulNo), 1–16 */
  chulNo: number;
  totalStarts: number;
  wins: number;
  winRate: number;
}

export interface TrackConditionStat {
  /** KRA track condition code, e.g. '양', '다소양', '다소불량', '불량' */
  condition: string;
  conditionLabel: string;
  totalStarts: number;
  wins: number;
  winRate: number;
}

export interface JockeyTrainerCombo {
  jockeyName: string;
  trainerName: string;
  totalStarts: number;
  wins: number;
  winRate: number;
}

export interface PredictionAccuracyByMeet {
  meet: string;
  meetLabel: string;
  totalPredictions: number;
  hitCount: number;
  accuracy: number;
}

export interface DistanceWinRate {
  /** Distance range label, e.g. "1000–1200m" */
  rangeLabel: string;
  minDist: number;
  maxDist: number;
  totalStarts: number;
  wins: number;
  winRate: number;
}

export interface PostPositionResponse {
  meet: MeetCode;
  stats: PostPositionStat[];
}

export interface TrackConditionResponse {
  meet: MeetCode;
  stats: TrackConditionStat[];
}

export interface JockeyTrainerCombosResponse {
  meet: MeetCode;
  combos: JockeyTrainerCombo[];
}

export interface PredictionAccuracyResponse {
  meet: MeetCode;
  byMeet: PredictionAccuracyByMeet[];
}

export interface DistanceWinRateResponse {
  meet: MeetCode;
  stats: DistanceWinRate[];
}

/**
 * Analytics API — advanced stats endpoints
 * All endpoints: GET /api/analytics/{resource}?meet=서울
 */
export default class AnalyticsApi {
  /**
   * Post position (gate number) win rates — auth required
   * GET /api/analytics/post-position
   */
  static async getPostPosition(meet: MeetCode): Promise<PostPositionResponse> {
    const response = await axiosInstance.get<unknown>('/analytics/post-position', {
      params: { meet },
    });
    return handleApiResponse<PostPositionResponse>(response);
  }

  /**
   * Track condition win rates — public
   * GET /api/analytics/track-condition
   */
  static async getTrackCondition(meet: MeetCode): Promise<TrackConditionResponse> {
    const response = await axiosInstance.get<unknown>('/analytics/track-condition', {
      params: { meet },
    });
    return handleApiResponse<TrackConditionResponse>(response);
  }

  /**
   * Top jockey-trainer combos by win rate — auth required
   * GET /api/analytics/jockey-trainer-combos
   */
  static async getJockeyTrainerCombos(meet: MeetCode): Promise<JockeyTrainerCombosResponse> {
    const response = await axiosInstance.get<unknown>('/analytics/jockey-trainer-combos', {
      params: { meet },
    });
    return handleApiResponse<JockeyTrainerCombosResponse>(response);
  }

  /**
   * AI prediction accuracy by meet — public
   * GET /api/analytics/prediction-accuracy
   */
  static async getPredictionAccuracy(meet: MeetCode): Promise<PredictionAccuracyResponse> {
    const response = await axiosInstance.get<unknown>('/analytics/prediction-accuracy', {
      params: { meet },
    });
    return handleApiResponse<PredictionAccuracyResponse>(response);
  }

  /**
   * Distance win rates — auth required
   * GET /api/analytics/distance-win-rates
   */
  static async getDistanceWinRates(meet: MeetCode): Promise<DistanceWinRateResponse> {
    const response = await axiosInstance.get<unknown>('/analytics/distance-win-rates', {
      params: { meet },
    });
    return handleApiResponse<DistanceWinRateResponse>(response);
  }
}
