import { http, HttpResponse } from 'msw';
import { MOCK_RANKINGS_DATA } from '../data/rankings';

const BASE_URL = 'http://10.0.2.2:3002/api';

export const rankingsHandlers = [
  // 랭킹 조회 API
  http.get(`${BASE_URL}/rankings`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'overall';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const rankings =
      MOCK_RANKINGS_DATA[type as keyof typeof MOCK_RANKINGS_DATA] || MOCK_RANKINGS_DATA.overall;

    return HttpResponse.json({
      success: true,
      data: rankings.slice(0, limit),
      total: rankings.length,
      type,
    });
  }),

  // 내 랭킹 조회 API
  http.get(`${BASE_URL}/rankings/me`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'overall';

    return HttpResponse.json({
      success: true,
      data: {
        rank: 15,
        name: '나',
        avatar: '🎮',
        winRate: 45.2,
        totalBets: 12,
        totalWinnings: 180000,
        isCurrentUser: true,
        type,
      },
    });
  }),
];
