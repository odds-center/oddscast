/**
 * Mock 데이터 — DB 없이 개발/데모용
 * NEXT_PUBLIC_USE_MOCK=true 시 사용
 */

const MOCK_PREFIX = 'mock-';

export const mockRaces = [
  {
    id: `${MOCK_PREFIX}race-1`,
    meet: '서울',
    meetName: '서울',
    rcDate: '2025-02-15',
    rcNo: '1',
    rcName: '3세 미만',
    raceName: '3세 미만',
    rcDist: '1200',
    rcGrade: 'G3',
    rcCondition: '잔디',
    rcPrize: 80000000,
    rcStartTime: '10:30',
    raceStatus: 'SCHEDULED',
    status: 'SCHEDULED',
    entries: [
      { id: 'e1', hrNo: '1', hrName: '다크호스', jkName: '박태희', trName: '김조교', weight: '57' },
      { id: 'e2', hrNo: '2', hrName: '골든스타', jkName: '이승만', trName: '박조교', weight: '56' },
      { id: 'e3', hrNo: '3', hrName: '썬더볼트', jkName: '최기수', trName: '이조교', weight: '55' },
      { id: 'e4', hrNo: '4', hrName: '실버문', jkName: '정민수', trName: '최조교', weight: '57' },
      { id: 'e5', hrNo: '5', hrName: '파이어스트', jkName: '배철수', trName: '정조교', weight: '56' },
    ],
    entryDetails: [
      { id: 'e1', hrNo: '1', hrName: '다크호스', jkName: '박태희', trName: '김조교', weight: '57' },
      { id: 'e2', hrNo: '2', hrName: '골든스타', jkName: '이승만', trName: '박조교', weight: '56' },
      { id: 'e3', hrNo: '3', hrName: '썬더볼트', jkName: '최기수', trName: '이조교', weight: '55' },
      { id: 'e4', hrNo: '4', hrName: '실버문', jkName: '정민수', trName: '최조교', weight: '57' },
      { id: 'e5', hrNo: '5', hrName: '파이어스트', jkName: '배철수', trName: '정조교', weight: '56' },
    ],
  },
  {
    id: `${MOCK_PREFIX}race-2`,
    meet: '부산',
    meetName: '부산',
    rcDate: '2025-02-15',
    rcNo: '2',
    rcName: '일반',
    raceName: '일반',
    rcDist: '1400',
    rcGrade: 'G2',
    rcCondition: '잔디',
    rcPrize: 120000000,
    rcStartTime: '11:00',
    raceStatus: 'COMPLETED',
    status: 'COMPLETED',
    entries: [
      { id: 'e6', hrNo: '1', hrName: '블루칩', jkName: '김준영', trName: '강조교', weight: '58' },
      { id: 'e7', hrNo: '2', hrName: '레드에이스', jkName: '윤서진', trName: '한조교', weight: '57' },
      { id: 'e8', hrNo: '3', hrName: '그린라이트', jkName: '한동훈', trName: '송조교', weight: '56' },
    ],
    entryDetails: [
      { id: 'e6', hrNo: '1', hrName: '블루칩', jkName: '김준영', trName: '강조교', weight: '58' },
      { id: 'e7', hrNo: '2', hrName: '레드에이스', jkName: '윤서진', trName: '한조교', weight: '57' },
      { id: 'e8', hrNo: '3', hrName: '그린라이트', jkName: '한동훈', trName: '송조교', weight: '56' },
    ],
  },
  {
    id: `${MOCK_PREFIX}race-3`,
    meet: '제주',
    meetName: '제주',
    rcDate: '2025-02-16',
    rcNo: '1',
    rcName: '마 Open',
    raceName: '마 Open',
    rcDist: '1600',
    rcGrade: 'G1',
    rcCondition: '더트',
    rcPrize: 200000000,
    rcStartTime: '14:00',
    raceStatus: 'SCHEDULED',
    status: 'SCHEDULED',
    entries: [
      { id: 'e9', hrNo: '1', hrName: '챔피언', jkName: '오승환', trName: '김마장', weight: '59' },
      { id: 'e10', hrNo: '2', hrName: '벨로시티', jkName: '이영호', trName: '박마장', weight: '58' },
    ],
    entryDetails: [
      { id: 'e9', hrNo: '1', hrName: '챔피언', jkName: '오승환', trName: '김마장', weight: '59' },
      { id: 'e10', hrNo: '2', hrName: '벨로시티', jkName: '이영호', trName: '박마장', weight: '58' },
    ],
  },
  {
    id: `${MOCK_PREFIX}race-4`,
    meet: '서울',
    meetName: '서울',
    rcDate: new Date().toISOString().slice(0, 10),
    rcNo: '4',
    rcName: '오늘의 경주',
    raceName: '오늘의 경주',
    rcDist: '1800',
    rcGrade: 'G2',
    rcCondition: '잔디',
    rcPrize: 150000000,
    rcStartTime: '15:30',
    raceStatus: 'SCHEDULED',
    status: 'SCHEDULED',
    entries: [
      { id: 'e11', hrNo: '1', hrName: '라이트닝', jkName: '김경주', trName: '최조교', weight: '57' },
      { id: 'e12', hrNo: '2', hrName: '실버윙', jkName: '박민수', trName: '이조교', weight: '56' },
    ],
    entryDetails: [
      { id: 'e11', hrNo: '1', hrName: '라이트닝', jkName: '김경주', trName: '최조교', weight: '57' },
      { id: 'e12', hrNo: '2', hrName: '실버윙', jkName: '박민수', trName: '이조교', weight: '56' },
    ],
  },
];

export const mockRaceResults: Record<string, any[]> = {
  [`${MOCK_PREFIX}race-2`]: [
    { id: 'r1', ord: '1', hrNo: '2', hrName: '레드에이스', jkName: '윤서진', rcRank: '1', rcTime: '1:24.5' },
    { id: 'r2', ord: '2', hrNo: '1', hrName: '블루칩', jkName: '김준영', rcRank: '2', rcTime: '1:24.8' },
    { id: 'r3', ord: '3', hrNo: '3', hrName: '그린라이트', jkName: '한동훈', rcRank: '3', rcTime: '1:25.1' },
  ],
};

export const mockDividends: Record<string, any[]> = {
  [`${MOCK_PREFIX}race-2`]: [
    { id: 'd1', poolName: '단승식', chulNo: '2', odds: 4500 },
    { id: 'd2', poolName: '복승식', chulNo: '2', chulNo2: '1', odds: 3200 },
    { id: 'd3', poolName: '연승식', chulNo: '2', chulNo2: '1', odds: 8500 },
  ],
};

export const mockPredictions = [
  {
    id: `${MOCK_PREFIX}pred-1`,
    raceId: `${MOCK_PREFIX}race-1`,
    analysis: '다크호스의 최근 성적이 우수하며, 1200m 거리에서 강점을 보입니다.',
    preview: '1번 다크호스 우선, 2번 골든스타·3번 썬더볼트 복승 추천.',
    previewApproved: true,
    accuracy: 72,
    status: 'COMPLETED',
    race: mockRaces[0],
    scores: {
      horseScores: [
        { hrNo: '1', hrName: '다크호스', horseName: '다크호스', score: 85 },
        { hrNo: '2', hrName: '골든스타', horseName: '골든스타', score: 72 },
        { hrNo: '3', hrName: '썬더볼트', horseName: '썬더볼트', score: 68 },
      ],
    },
  },
  {
    id: `${MOCK_PREFIX}pred-2`,
    raceId: `${MOCK_PREFIX}race-2`,
    analysis: '레드에이스가 코너 회전 능력이 뛰어나 1400m에 유리합니다.',
    preview: '2번 레드에이스 1착 예상, 1번 블루칩 복승 추천.',
    previewApproved: true,
    accuracy: 88,
    status: 'COMPLETED',
    race: mockRaces[1],
    scores: {
      horseScores: [
        { hrNo: '2', hrName: '레드에이스', horseName: '레드에이스', score: 92 },
        { hrNo: '1', hrName: '블루칩', horseName: '블루칩', score: 78 },
        { hrNo: '3', hrName: '그린라이트', horseName: '그린라이트', score: 65 },
      ],
    },
  },
  {
    id: `${MOCK_PREFIX}pred-3`,
    raceId: `${MOCK_PREFIX}race-3`,
    analysis: '챔피언의 G1 대회 경험이 풍부합니다.',
    preview: '1번 챔피언 우선, 2번 벨로시티 복승 추천.',
    previewApproved: false,
    accuracy: 0,
    status: 'PENDING',
    race: mockRaces[2],
    scores: {
      horseScores: [
        { hrNo: '1', hrName: '챔피언', horseName: '챔피언', score: 82 },
        { hrNo: '2', hrName: '벨로시티', horseName: '벨로시티', score: 75 },
      ],
    },
  },
];

export const mockResults = [
  { id: 'res1', raceId: `${MOCK_PREFIX}race-2`, race: mockRaces[1], rcNo: '2', meetName: '부산', rcDate: '2025-02-15' },
];

export const mockRankings = [
  { id: 'rk1', name: '경마왕', correctCount: 42, user: { name: '경마왕' } },
  { id: 'rk2', name: '럭키7', correctCount: 38, user: { name: '럭키7' } },
  { id: 'rk3', name: '다크호스', correctCount: 35, user: { name: '다크호스' } },
  { id: 'rk4', name: '실버문', correctCount: 32, user: { name: '실버문' } },
  { id: 'rk5', name: '골든스타', correctCount: 28, user: { name: '골든스타' } },
];

export const mockPointsBalance = {
  userId: 'mock-user-1',
  currentPoints: 5000,
  totalPointsEarned: 12000,
  totalPointsSpent: 7000,
  lastUpdated: new Date().toISOString(),
};

export const mockTicketPrice = { pointsPerTicket: 1200 };

export const mockTicketBalance = {
  userId: 'mock-user-1',
  availableTickets: 3,
  usedTickets: 5,
  expiredTickets: 0,
  totalTickets: 8,
};

export const mockSubscriptionPlans = [
  {
    id: 'mock-plan-1',
    planName: 'PREMIUM',
    displayName: '프리미엄 플랜',
    description: '매월 30장 예측권 + AI 분석',
    totalPrice: 9900,
    baseTickets: 25,
    bonusTickets: 5,
    totalTickets: 30,
  },
  {
    id: 'mock-plan-2',
    planName: 'LIGHT',
    displayName: '라이트 플랜',
    description: '매월 10장 예측권',
    totalPrice: 4900,
    baseTickets: 10,
    bonusTickets: 0,
    totalTickets: 10,
  },
];

export const mockSubscriptionStatus = null; // 또는 활성 구독 mock

export const mockNotifications = [
  { id: 'n1', title: '경주 결과', message: '부산 2경주 결과가 발표되었습니다.', isRead: false, createdAt: new Date().toISOString(), metadata: { raceId: `${MOCK_PREFIX}race-2` } },
  { id: 'n2', title: '포인트 적립', message: '예측 적중으로 100pt가 적립되었습니다.', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export const mockUser = {
  id: 'mock-user-1',
  email: 'demo@goldenrace.com',
  name: '데모유저',
  nickname: '경마덕후',
};

export const mockConfig = { show_google_login: 'true' };
