import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import CONFIG from '@/lib/config';

export const PICK_TYPE_LABELS: Record<string, string> = {
  SINGLE: '단승식',
  PLACE: '복승식',
  QUINELLA: '연승식',
  EXACTA: '쌍승식',
  QUINELLA_PLACE: '복연승식',
  TRIFECTA: '삼복승식',
  TRIPLE: '삼쌍승식',
};

/** 사용자가 쉽게 이해할 수 있는 승식 설명 */
export const PICK_TYPE_DESCRIPTIONS: Record<string, string> = {
  SINGLE: '1마리 골라서 1등 맞추기',
  PLACE: '1마리 골라서 1·2·3등 중 하나 맞추기',
  QUINELLA: '2마리 골라서 1등·2등 맞추기 (순서 상관없음)',
  EXACTA: '2마리 골라서 1등·2등 순서대로 맞추기',
  QUINELLA_PLACE: '2마리 골라서 3등 안에 들어오면 적중',
  TRIFECTA: '3마리 골라서 1·2·3등 맞추기 (순서 상관없음)',
  TRIPLE: '3마리 골라서 1등·2등·3등 순서대로 맞추기',
};

export const PICK_TYPE_HORSE_COUNTS: Record<string, number> = {
  SINGLE: 1,
  PLACE: 1,
  QUINELLA: 2,
  EXACTA: 2,
  QUINELLA_PLACE: 2,
  TRIFECTA: 3,
  TRIPLE: 3,
};

/** 승식 → 배당 pool명 (한국어) */
export const PICK_TYPE_POOL_NAMES: Record<string, string> = {
  SINGLE: '단승식',
  PLACE: '복승식',
  QUINELLA: '연승식',
  EXACTA: '쌍승식',
  QUINELLA_PLACE: '복연승식',
  TRIFECTA: '삼복승식',
  TRIPLE: '삼쌍승식',
};

/** 승식별 선택/조합 설명 (UI 표시용, HORSE_RACING_TERMINOLOGY) */
export const PICK_TYPE_COMBO_DESC: Record<string, string> = {
  SINGLE: '1마리 1등',
  PLACE: '1마리 1~3등',
  QUINELLA: '2마리 1·2등 (순서 무관)',
  EXACTA: '2마리 1→2등 (순서 유관)',
  QUINELLA_PLACE: '2마리 3등 이내',
  TRIFECTA: '3마리 1·2·3등 (순서 무관)',
  TRIPLE: '3마리 1→2→3등 (순서 유관)',
};

/** 선택 조합에 맞는 배당 찾기 */
export function findDividendForPick(
  dividends: { pool?: string; poolName?: string; chulNo?: string; chulNo2?: string; chulNo3?: string; odds?: number }[] | undefined,
  pickType: string,
  selectedHorses: { hrNo: string }[],
): number | null {
  if (!dividends?.length || selectedHorses.length === 0) return null;
  const poolName = PICK_TYPE_POOL_NAMES[pickType];
  const hrNos = selectedHorses.map((h) => h.hrNo);

  for (const d of dividends) {
    if ((d.poolName ?? d.pool) !== poolName) continue;
    const dNos = [d.chulNo, d.chulNo2, d.chulNo3].filter(Boolean) as string[];
    if (dNos.length !== hrNos.length) continue;

    const isOrdered = ['EXACTA', 'TRIPLE', 'SINGLE', 'PLACE'].includes(pickType);
    if (isOrdered) {
      if (dNos.every((n, i) => n === hrNos[i])) return d.odds ?? null;
    } else {
      if (dNos.sort().join('-') === [...hrNos].sort().join('-')) return d.odds ?? null;
    }
  }
  return null;
}

export interface CreatePickDto {
  raceId: number; // 서버: number (ParseIntPipe)
  pickType: string;
  hrNos: string[];
  hrNames?: string[];
}

export interface Pick {
  id: string;
  userId: string;
  raceId: string;
  pickType: string;
  hrNos: string[];
  hrNames: string[];
  pointsAwarded?: number | null;
  createdAt: string;
  race?: { meetName?: string; rcNo?: string; rcDate?: string };
}

export default class PicksApi {
  static async create(dto: CreatePickDto & { raceId?: number | string }): Promise<Pick> {
    const payload = {
      ...dto,
      raceId: typeof dto.raceId === 'string' ? parseInt(dto.raceId, 10) : dto.raceId,
    };
    if (CONFIG.useMock) {
      return {
        id: 'mock-pick',
        userId: 'mock-user',
        raceId: String(payload.raceId),
        pickType: payload.pickType,
        hrNos: payload.hrNos,
        hrNames: payload.hrNames ?? [],
        createdAt: new Date().toISOString(),
      } as Pick;
    }
    try {
      const response = await axiosInstance.post<ApiResponse<Pick>>('/picks', payload);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getMyPicks(page = 1, limit = 20): Promise<{
    picks: Pick[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (CONFIG.useMock) {
      return { picks: [], total: 0, page, totalPages: 1 };
    }
    try {
      const response = await axiosInstance.get<
        ApiResponse<{ picks: Pick[]; total: number; page: number; totalPages: number }>
      >('/picks', { params: { page, limit } });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getByRace(raceId: string): Promise<Pick | null> {
    if (CONFIG.useMock) return null;
    try {
      const response = await axiosInstance.get<ApiResponse<Pick>>(`/picks/race/${raceId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async delete(raceId: string): Promise<{ message: string }> {
    if (CONFIG.useMock) return { message: 'OK' };
    try {
      const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
        `/picks/race/${raceId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
