import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

interface MyReferralResponse {
  code: string;
  usedCount: number;
  maxUses: number;
  remainingUses: number;
}

interface ClaimReferralResponse {
  success: boolean;
  ticketsGranted: number;
}

export default class ReferralsApi {
  static async getMyReferral(): Promise<MyReferralResponse> {
    try {
      const response = await axiosInstance.get<{ data: MyReferralResponse }>('/referrals/me');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async claimCode(code: string): Promise<ClaimReferralResponse> {
    try {
      const response = await axiosInstance.post<{ data: ClaimReferralResponse }>('/referrals/claim', { code });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}
