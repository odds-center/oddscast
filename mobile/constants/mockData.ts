// 말 최근 실적
export interface HorseRecentRecord {
  date: string;
  venue: string;
  rank: number;
  totalHorses: number;
  jockey: string;
  time: string;
}

// 말 상세 정보
export interface Horse {
  id: string;
  horseName: string;
  jockey: string;
  trainer: string;
  gateNumber: number;
  predictionRate: number;
  age: number; // 마령
  weight: number; // 마체중 (kg)
  recentRecords: HorseRecentRecord[]; // 최근 3경주
  totalRaces: number; // 총 출전횟수
  wins: number; // 1착 횟수
  winRate: number; // 승률
  aiScore: number; // AI 예측 점수 (0-100)
  form: string; // 최근 컨디션 (1착=1, 2착=2, 3착=3, 그외=X)
  avgSpeed: number; // 평균 속도 (m/s)
  bettingStats: {
    // 마권 구매 통계
    totalBets: number; // 총 마권 구매 수
    totalAmount: number; // 총 구매 금액 (원)
    popularityRank: number; // 인기 순위 (1~5)
  };
}

// 경주장 컨디션
export interface TrackCondition {
  surface: 'fast' | 'good' | 'soft' | 'heavy'; // 마사
  weather: 'sunny' | 'cloudy' | 'rainy' | 'foggy'; // 날씨
  temperature: number; // 온도 (°C)
  humidity: number; // 습도 (%)
  windSpeed: number; // 풍속 (m/s)
}

// AI 분석 정보
export interface AIAnalysis {
  topPick: string; // AI 1순위 예측 (말 ID)
  confidence: number; // 신뢰도 (0-100%)
  factors: {
    name: string; // 요인명
    impact: number; // 영향도 (0-10)
    description: string; // 설명
  }[];
  recommendation: string; // 추천 전략
}

// 경주 정보
export interface Race {
  id: string;
  raceNumber: number;
  raceName: string;
  date: string;
  venue: string;
  horses: Horse[];
  distance: number; // 거리 (m)
  grade: string; // 등급 (G1, G2, G3 등)
  prize: number; // 상금 (원)
  trackCondition: TrackCondition;
  aiAnalysis: AIAnalysis;
}

export const RACES: Race[] = [
  {
    id: '1',
    raceNumber: 1,
    raceName: '제주 스프린트 챔피언십',
    date: '2025-10-11 10:45',
    venue: '제주',
    distance: 1200,
    grade: 'G3',
    prize: 50000000,
    trackCondition: {
      surface: 'fast',
      weather: 'sunny',
      temperature: 22,
      humidity: 55,
      windSpeed: 2.5,
    },
    aiAnalysis: {
      topPick: '1-3',
      confidence: 78,
      factors: [
        {
          name: '최근 실적',
          impact: 9,
          description: '천리마는 최근 3경주에서 2승 1착으로 뛰어난 폼을 유지하고 있습니다.',
        },
        {
          name: '기수 실력',
          impact: 8,
          description: '박태종 기수는 제주 트랙에서 승률 35%로 최상위권입니다.',
        },
        {
          name: '트랙 컨디션',
          impact: 7,
          description: '빠른 마사는 천리마의 주행 스타일과 완벽하게 맞습니다.',
        },
      ],
      recommendation:
        '천리마(3번)를 중심으로 단승 및 연승복식 추천. 금빛질주(1번)를 조합하여 안정성을 높이세요.',
    },
    horses: [
      {
        id: '1-1',
        horseName: '금빛질주',
        jockey: '김기수',
        trainer: '박조교',
        gateNumber: 1,
        predictionRate: 25.5,
        age: 4,
        weight: 485,
        totalRaces: 18,
        wins: 4,
        winRate: 22.2,
        aiScore: 72,
        form: '2-3-1-X-2',
        avgSpeed: 16.2,
        bettingStats: {
          totalBets: 1243,
          totalAmount: 12430000,
          popularityRank: 2,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '제주',
            rank: 2,
            totalHorses: 12,
            jockey: '김기수',
            time: '1:14.2',
          },
          {
            date: '2025-09-27',
            venue: '제주',
            rank: 3,
            totalHorses: 10,
            jockey: '김기수',
            time: '1:15.1',
          },
          {
            date: '2025-09-20',
            venue: '제주',
            rank: 1,
            totalHorses: 11,
            jockey: '김기수',
            time: '1:13.8',
          },
        ],
      },
      {
        id: '1-2',
        horseName: '바람의아들',
        jockey: '이성현',
        trainer: '최트레',
        gateNumber: 2,
        predictionRate: 18.2,
        age: 3,
        weight: 468,
        totalRaces: 12,
        wins: 2,
        winRate: 16.7,
        aiScore: 65,
        form: 'X-3-2-X-4',
        avgSpeed: 15.8,
        bettingStats: {
          totalBets: 687,
          totalAmount: 6870000,
          popularityRank: 3,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '제주',
            rank: 8,
            totalHorses: 12,
            jockey: '이성현',
            time: '1:16.5',
          },
          {
            date: '2025-09-27',
            venue: '부산',
            rank: 3,
            totalHorses: 10,
            jockey: '이성현',
            time: '1:15.3',
          },
          {
            date: '2025-09-20',
            venue: '부산',
            rank: 2,
            totalHorses: 9,
            jockey: '이성현',
            time: '1:14.9',
          },
        ],
      },
      {
        id: '1-3',
        horseName: '천리마',
        jockey: '박태종',
        trainer: '김영관',
        gateNumber: 3,
        predictionRate: 33.1,
        age: 5,
        weight: 492,
        totalRaces: 25,
        wins: 9,
        winRate: 36.0,
        aiScore: 88,
        form: '1-1-2-1-1',
        avgSpeed: 17.1,
        bettingStats: {
          totalBets: 2156,
          totalAmount: 21560000,
          popularityRank: 1,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '제주',
            rank: 1,
            totalHorses: 12,
            jockey: '박태종',
            time: '1:12.9',
          },
          {
            date: '2025-09-27',
            venue: '제주',
            rank: 1,
            totalHorses: 11,
            jockey: '박태종',
            time: '1:13.2',
          },
          {
            date: '2025-09-20',
            venue: '제주',
            rank: 2,
            totalHorses: 10,
            jockey: '박태종',
            time: '1:14.1',
          },
        ],
      },
      {
        id: '1-4',
        horseName: '청룡의힘',
        jockey: '최민호',
        trainer: '서진수',
        gateNumber: 4,
        predictionRate: 15.8,
        age: 4,
        weight: 478,
        totalRaces: 16,
        wins: 2,
        winRate: 12.5,
        aiScore: 58,
        form: 'X-X-3-2-X',
        avgSpeed: 15.5,
        bettingStats: {
          totalBets: 423,
          totalAmount: 4230000,
          popularityRank: 4,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '서울',
            rank: 9,
            totalHorses: 14,
            jockey: '최민호',
            time: '1:17.2',
          },
          {
            date: '2025-09-27',
            venue: '서울',
            rank: 7,
            totalHorses: 12,
            jockey: '최민호',
            time: '1:16.8',
          },
          {
            date: '2025-09-20',
            venue: '제주',
            rank: 3,
            totalHorses: 10,
            jockey: '최민호',
            time: '1:15.5',
          },
        ],
      },
      {
        id: '1-5',
        horseName: '스피드스타',
        jockey: '정우성',
        trainer: '한기호',
        gateNumber: 5,
        predictionRate: 7.4,
        age: 3,
        weight: 461,
        totalRaces: 8,
        wins: 0,
        winRate: 0.0,
        aiScore: 45,
        form: 'X-X-X-4-X',
        avgSpeed: 14.9,
        bettingStats: {
          totalBets: 189,
          totalAmount: 1890000,
          popularityRank: 5,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '제주',
            rank: 12,
            totalHorses: 12,
            jockey: '정우성',
            time: '1:19.1',
          },
          {
            date: '2025-09-27',
            venue: '제주',
            rank: 10,
            totalHorses: 11,
            jockey: '정우성',
            time: '1:17.9',
          },
          {
            date: '2025-09-20',
            venue: '제주',
            rank: 8,
            totalHorses: 10,
            jockey: '정우성',
            time: '1:16.7',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    raceNumber: 2,
    raceName: '서울 클래식 스테이크스',
    date: '2025-10-11 14:20',
    venue: '서울',
    distance: 1800,
    grade: 'G1',
    prize: 150000000,
    trackCondition: {
      surface: 'good',
      weather: 'cloudy',
      temperature: 19,
      humidity: 62,
      windSpeed: 3.2,
    },
    aiAnalysis: {
      topPick: '2-1',
      confidence: 82,
      factors: [
        {
          name: '압도적 실적',
          impact: 10,
          description: '돌콩은 최근 5경주 중 4승으로 현재 최상의 컨디션입니다.',
        },
        {
          name: '거리 적합성',
          impact: 9,
          description: '1800m는 돌콩이 가장 강력한 모습을 보이는 거리입니다.',
        },
        {
          name: '문세영 기수',
          impact: 8,
          description: '문세영 기수는 서울 트랙에서 승률 42%로 최고 수준입니다.',
        },
      ],
      recommendation:
        '돌콩(1번)이 압도적인 1순위. 단승 베팅 권장. 실버울프(3번)를 조합한 복승식도 고려해보세요.',
    },
    horses: [
      {
        id: '2-1',
        horseName: '돌콩',
        jockey: '문세영',
        trainer: '김호',
        gateNumber: 1,
        predictionRate: 42.8,
        age: 4,
        weight: 495,
        totalRaces: 22,
        wins: 11,
        winRate: 50.0,
        aiScore: 92,
        form: '1-1-1-2-1',
        avgSpeed: 18.5,
        bettingStats: {
          totalBets: 3842,
          totalAmount: 38420000,
          popularityRank: 1,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '서울',
            rank: 1,
            totalHorses: 14,
            jockey: '문세영',
            time: '1:50.3',
          },
          {
            date: '2025-09-27',
            venue: '서울',
            rank: 1,
            totalHorses: 12,
            jockey: '문세영',
            time: '1:51.1',
          },
          {
            date: '2025-09-20',
            venue: '서울',
            rank: 1,
            totalHorses: 13,
            jockey: '문세영',
            time: '1:50.8',
          },
        ],
      },
      {
        id: '2-2',
        horseName: '클린업조이',
        jockey: '함완식',
        trainer: '송문길',
        gateNumber: 2,
        predictionRate: 18.3,
        age: 5,
        weight: 488,
        totalRaces: 28,
        wins: 5,
        winRate: 17.9,
        aiScore: 68,
        form: 'X-3-2-X-3',
        avgSpeed: 17.2,
        bettingStats: {
          totalBets: 982,
          totalAmount: 9820000,
          popularityRank: 3,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '부산',
            rank: 7,
            totalHorses: 12,
            jockey: '함완식',
            time: '1:53.2',
          },
          {
            date: '2025-09-27',
            venue: '서울',
            rank: 3,
            totalHorses: 14,
            jockey: '함완식',
            time: '1:52.1',
          },
          {
            date: '2025-09-20',
            venue: '서울',
            rank: 2,
            totalHorses: 11,
            jockey: '함완식',
            time: '1:51.5',
          },
        ],
      },
      {
        id: '2-3',
        horseName: '실버울프',
        jockey: '유현명',
        trainer: '송문길',
        gateNumber: 3,
        predictionRate: 26.0,
        age: 4,
        weight: 491,
        totalRaces: 20,
        wins: 6,
        winRate: 30.0,
        aiScore: 78,
        form: '2-1-2-3-1',
        avgSpeed: 17.9,
        bettingStats: {
          totalBets: 1567,
          totalAmount: 15670000,
          popularityRank: 2,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '서울',
            rank: 2,
            totalHorses: 14,
            jockey: '유현명',
            time: '1:50.9',
          },
          {
            date: '2025-09-27',
            venue: '서울',
            rank: 1,
            totalHorses: 12,
            jockey: '유현명',
            time: '1:51.3',
          },
          {
            date: '2025-09-20',
            venue: '서울',
            rank: 2,
            totalHorses: 13,
            jockey: '유현명',
            time: '1:52.2',
          },
        ],
      },
      {
        id: '2-4',
        horseName: '황금빛날개',
        jockey: '김용근',
        trainer: '이관호',
        gateNumber: 4,
        predictionRate: 8.9,
        age: 3,
        weight: 472,
        totalRaces: 10,
        wins: 1,
        winRate: 10.0,
        aiScore: 54,
        form: 'X-X-4-3-X',
        avgSpeed: 16.5,
        bettingStats: {
          totalBets: 534,
          totalAmount: 5340000,
          popularityRank: 4,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '서울',
            rank: 9,
            totalHorses: 14,
            jockey: '김용근',
            time: '1:54.5',
          },
          {
            date: '2025-09-27',
            venue: '제주',
            rank: 8,
            totalHorses: 11,
            jockey: '김용근',
            time: '1:55.1',
          },
          {
            date: '2025-09-20',
            venue: '서울',
            rank: 4,
            totalHorses: 12,
            jockey: '김용근',
            time: '1:53.8',
          },
        ],
      },
      {
        id: '2-5',
        horseName: '로열프린스',
        jockey: '조인권',
        trainer: '서인석',
        gateNumber: 5,
        predictionRate: 4.0,
        age: 3,
        weight: 465,
        totalRaces: 8,
        wins: 0,
        winRate: 0.0,
        aiScore: 42,
        form: 'X-X-X-X-5',
        avgSpeed: 15.8,
        bettingStats: {
          totalBets: 287,
          totalAmount: 2870000,
          popularityRank: 5,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '부산',
            rank: 11,
            totalHorses: 14,
            jockey: '조인권',
            time: '1:56.2',
          },
          {
            date: '2025-09-27',
            venue: '부산',
            rank: 10,
            totalHorses: 12,
            jockey: '조인권',
            time: '1:55.8',
          },
          {
            date: '2025-09-20',
            venue: '서울',
            rank: 9,
            totalHorses: 13,
            jockey: '조인권',
            time: '1:55.5',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    raceNumber: 3,
    raceName: '부산 마일 챌린지',
    date: '2025-10-11 12:00',
    venue: '부산',
    distance: 1600,
    grade: 'G2',
    prize: 80000000,
    trackCondition: {
      surface: 'soft',
      weather: 'rainy',
      temperature: 17,
      humidity: 78,
      windSpeed: 4.5,
    },
    aiAnalysis: {
      topPick: '3-2',
      confidence: 74,
      factors: [
        {
          name: '우천 적응력',
          impact: 9,
          description: '골든파워는 습한 마사에서 뛰어난 성적을 보여왔습니다.',
        },
        {
          name: '후방 추입형',
          impact: 8,
          description: '우천 시 선행마들이 지치는 구간에서 강력한 추입이 가능합니다.',
        },
        {
          name: '거리 선호도',
          impact: 7,
          description: '1600m는 골든파워의 스태미나가 빛을 발하는 거리입니다.',
        },
      ],
      recommendation:
        '악천후 조건에서 골든파워(2번)가 유리합니다. 라이언스타(1번)와의 쌍승식을 추천합니다.',
    },
    horses: [
      {
        id: '3-1',
        horseName: '라이언스타',
        jockey: '김철호',
        trainer: '박재우',
        gateNumber: 1,
        predictionRate: 28.9,
        age: 4,
        weight: 482,
        totalRaces: 19,
        wins: 5,
        winRate: 26.3,
        aiScore: 75,
        form: '2-2-1-3-2',
        avgSpeed: 17.3,
        bettingStats: {
          totalBets: 1389,
          totalAmount: 13890000,
          popularityRank: 2,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '부산',
            rank: 2,
            totalHorses: 11,
            jockey: '김철호',
            time: '1:38.5',
          },
          {
            date: '2025-09-27',
            venue: '부산',
            rank: 2,
            totalHorses: 12,
            jockey: '김철호',
            time: '1:37.9',
          },
          {
            date: '2025-09-20',
            venue: '부산',
            rank: 1,
            totalHorses: 10,
            jockey: '김철호',
            time: '1:37.2',
          },
        ],
      },
      {
        id: '3-2',
        horseName: '골든파워',
        jockey: '이찬호',
        trainer: '김영민',
        gateNumber: 2,
        predictionRate: 32.1,
        age: 5,
        weight: 496,
        totalRaces: 26,
        wins: 9,
        winRate: 34.6,
        aiScore: 84,
        form: '1-2-1-1-3',
        avgSpeed: 17.8,
        bettingStats: {
          totalBets: 1876,
          totalAmount: 18760000,
          popularityRank: 1,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '부산',
            rank: 1,
            totalHorses: 13,
            jockey: '이찬호',
            time: '1:37.1',
          },
          {
            date: '2025-09-27',
            venue: '서울',
            rank: 2,
            totalHorses: 14,
            jockey: '이찬호',
            time: '1:38.2',
          },
          {
            date: '2025-09-20',
            venue: '부산',
            rank: 1,
            totalHorses: 11,
            jockey: '이찬호',
            time: '1:36.8',
          },
        ],
      },
      {
        id: '3-3',
        horseName: '블루치타',
        jockey: '정동철',
        trainer: '강환민',
        gateNumber: 3,
        predictionRate: 21.5,
        age: 4,
        weight: 476,
        totalRaces: 17,
        wins: 3,
        winRate: 17.6,
        aiScore: 66,
        form: '3-X-2-3-X',
        avgSpeed: 16.9,
        bettingStats: {
          totalBets: 845,
          totalAmount: 8450000,
          popularityRank: 3,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '제주',
            rank: 3,
            totalHorses: 10,
            jockey: '정동철',
            time: '1:39.3',
          },
          {
            date: '2025-09-27',
            venue: '부산',
            rank: 7,
            totalHorses: 12,
            jockey: '정동철',
            time: '1:40.1',
          },
          {
            date: '2025-09-20',
            venue: '부산',
            rank: 2,
            totalHorses: 11,
            jockey: '정동철',
            time: '1:38.5',
          },
        ],
      },
      {
        id: '3-4',
        horseName: '해운대킹',
        jockey: '서승운',
        trainer: '김영관',
        gateNumber: 4,
        predictionRate: 12.5,
        age: 3,
        weight: 470,
        totalRaces: 11,
        wins: 1,
        winRate: 9.1,
        aiScore: 56,
        form: 'X-3-X-2-X',
        avgSpeed: 16.4,
        bettingStats: {
          totalBets: 512,
          totalAmount: 5120000,
          popularityRank: 4,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '부산',
            rank: 6,
            totalHorses: 11,
            jockey: '서승운',
            time: '1:40.2',
          },
          {
            date: '2025-09-27',
            venue: '부산',
            rank: 3,
            totalHorses: 9,
            jockey: '서승운',
            time: '1:39.1',
          },
          {
            date: '2025-09-20',
            venue: '부산',
            rank: 8,
            totalHorses: 12,
            jockey: '서승운',
            time: '1:41.5',
          },
        ],
      },
      {
        id: '3-5',
        horseName: '용호상박',
        jockey: '다실바',
        trainer: '라이스',
        gateNumber: 5,
        predictionRate: 5.0,
        age: 3,
        weight: 463,
        totalRaces: 7,
        wins: 0,
        winRate: 0.0,
        aiScore: 38,
        form: 'X-X-X-X-6',
        avgSpeed: 15.2,
        bettingStats: {
          totalBets: 234,
          totalAmount: 2340000,
          popularityRank: 5,
        },
        recentRecords: [
          {
            date: '2025-10-04',
            venue: '부산',
            rank: 10,
            totalHorses: 11,
            jockey: '다실바',
            time: '1:42.8',
          },
          {
            date: '2025-09-27',
            venue: '서울',
            rank: 9,
            totalHorses: 12,
            jockey: '다실바',
            time: '1:43.2',
          },
          {
            date: '2025-09-20',
            venue: '부산',
            rank: 11,
            totalHorses: 13,
            jockey: '다실바',
            time: '1:44.1',
          },
        ],
      },
    ],
  },
];
