import { axiosInstance } from '@/lib/api/axios';

export interface ReferralMyCode {
  code: string;
  usedCount: number;
  maxUses: number;
}

export interface ReferralClaimResult {
  message: string;
  referrerTickets: number;
  referredTickets: number;
}

export default class ReferralsApi {
  static async getMyCode(): Promise<ReferralMyCode> {
    const response = await axiosInstance.get<{ data?: ReferralMyCode } | ReferralMyCode>(
      '/referrals/me',
    );
    const d = response.data as { data?: ReferralMyCode } | ReferralMyCode;
    return (d as { data?: ReferralMyCode }).data ?? (d as ReferralMyCode);
  }

  static async claim(code: string): Promise<ReferralClaimResult> {
    const response = await axiosInstance.post<{ data?: ReferralClaimResult } | ReferralClaimResult>(
      '/referrals/claim',
      { code },
    );
    const d = response.data as { data?: ReferralClaimResult } | ReferralClaimResult;
    return (d as { data?: ReferralClaimResult }).data ?? (d as ReferralClaimResult);
  }
}
