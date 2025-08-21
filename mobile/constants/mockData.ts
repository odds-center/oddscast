export interface Horse {
  id: string;
  horseName: string;
  jockey: string;
  trainer: string;
  gateNumber: number;
  predictionRate: number;
}

export interface Race {
  id: string;
  raceNumber: number;
  raceName: string;
  date: string;
  venue: string;
  horses: Horse[];
}

export const RACES: Race[] = [
  {
    id: '1',
    raceNumber: 1,
    raceName: '제주 1경주',
    date: '2025-07-06 10:45',
    venue: '제주',
    horses: [
      {
        id: '1-1',
        horseName: '금빛질주',
        jockey: '김기수',
        trainer: '박조교',
        gateNumber: 1,
        predictionRate: 25.5,
      },
      {
        id: '1-2',
        horseName: '바람의아들',
        jockey: '이성현',
        trainer: '최트레',
        gateNumber: 2,
        predictionRate: 18.2,
      },
      {
        id: '1-3',
        horseName: '천리마',
        jockey: '박태종',
        trainer: '김영관',
        gateNumber: 3,
        predictionRate: 33.1,
      },
    ],
  },
  {
    id: '2',
    raceNumber: 2,
    raceName: '서울 5경주',
    date: '2025-07-06 14:20',
    venue: '서울',
    horses: [
      {
        id: '2-1',
        horseName: '돌콩',
        jockey: '문세영',
        trainer: '김호',
        gateNumber: 1,
        predictionRate: 40.8,
      },
      {
        id: '2-2',
        horseName: '클린업조이',
        jockey: '함완식',
        trainer: '송문길',
        gateNumber: 2,
        predictionRate: 15.3,
      },
      {
        id: '2-3',
        horseName: '실버울프',
        jockey: '유현명',
        trainer: '송문길',
        gateNumber: 3,
        predictionRate: 22.0,
      },
    ],
  },
  {
    id: '3',
    raceNumber: 3,
    raceName: '부산 3경주',
    date: '2025-07-06 12:00',
    venue: '부산',
    horses: [
      {
        id: '3-1',
        horseName: '라이언스타',
        jockey: '김철호',
        trainer: '박재우',
        gateNumber: 1,
        predictionRate: 28.9,
      },
      {
        id: '3-2',
        horseName: '골든파워',
        jockey: '이찬호',
        trainer: '김영민',
        gateNumber: 2,
        predictionRate: 24.1,
      },
      {
        id: '3-3',
        horseName: '블루치타',
        jockey: '정동철',
        trainer: '강환민',
        gateNumber: 3,
        predictionRate: 19.5,
      },
    ],
  },
  {
    id: '4',
    raceNumber: 4,
    raceName: '광주 2경주',
    date: '2025-07-06 11:30',
    venue: '광주',
    horses: [
      {
        id: '4-1',
        horseName: '빛의전사',
        jockey: '김용근',
        trainer: '이관호',
        gateNumber: 1,
        predictionRate: 35.2,
      },
      {
        id: '4-2',
        horseName: '스피드킹',
        jockey: '조인권',
        trainer: '서인석',
        gateNumber: 2,
        predictionRate: 20.7,
      },
      {
        id: '4-3',
        horseName: '위너스맨',
        jockey: '최시대',
        trainer: '최기홍',
        gateNumber: 3,
        predictionRate: 26.3,
      },
    ],
  },
  {
    id: '5',
    raceNumber: 5,
    raceName: '서울 8경주',
    date: '2025-07-06 16:50',
    venue: '서울',
    horses: [
      {
        id: '5-1',
        horseName: '라온더파이터',
        jockey: '임기원',
        trainer: '박종곤',
        gateNumber: 1,
        predictionRate: 55.5,
      },
      {
        id: '5-2',
        horseName: '어마어마',
        jockey: '김태희',
        trainer: '송문길',
        gateNumber: 2,
        predictionRate: 12.8,
      },
      {
        id: '5-3',
        horseName: '심장의고동',
        jockey: '이동하',
        trainer: '지용철',
        gateNumber: 3,
        predictionRate: 18.9,
      },
    ],
  },
  {
    id: '6',
    raceNumber: 6,
    raceName: '제주 4경주',
    date: '2025-07-06 13:10',
    venue: '제주',
    horses: [
      {
        id: '6-1',
        horseName: '황금세대',
        jockey: '전현준',
        trainer: '강성오',
        gateNumber: 1,
        predictionRate: 29.8,
      },
      {
        id: '6-2',
        horseName: '백록장군',
        jockey: '김준호',
        trainer: '박병진',
        gateNumber: 2,
        predictionRate: 21.4,
      },
      {
        id: '6-3',
        horseName: '탐라황제',
        jockey: '문성호',
        trainer: '김길홍',
        gateNumber: 3,
        predictionRate: 23.6,
      },
    ],
  },
  {
    id: '7',
    raceNumber: 7,
    raceName: '부산 6경주',
    date: '2025-07-06 15:40',
    venue: '부산',
    horses: [
      {
        id: '7-1',
        horseName: '캡틴양키',
        jockey: '다실바',
        trainer: '김영관',
        gateNumber: 1,
        predictionRate: 38.2,
      },
      {
        id: '7-2',
        horseName: '킹오브더매치',
        jockey: '서승운',
        trainer: '김영관',
        gateNumber: 2,
        predictionRate: 25.1,
      },
      {
        id: '7-3',
        horseName: '투혼의반석',
        jockey: '페로비치',
        trainer: '라이스',
        gateNumber: 3,
        predictionRate: 17.4,
      },
    ],
  },
  {
    id: '8',
    raceNumber: 8,
    raceName: '서울 10경주',
    date: '2025-07-06 18:00',
    venue: '서울',
    horses: [
      {
        id: '8-1',
        horseName: '글로벌히트',
        jockey: '김혜선',
        trainer: '방동석',
        gateNumber: 1,
        predictionRate: 31.5,
      },
      {
        id: '8-2',
        horseName: '컴플리트밸류',
        jockey: '송재철',
        trainer: '김동균',
        gateNumber: 2,
        predictionRate: 28.3,
      },
      {
        id: '8-3',
        horseName: '행복왕자',
        jockey: '김상수',
        trainer: '박윤규',
        gateNumber: 3,
        predictionRate: 16.9,
      },
    ],
  },
  {
    id: '9',
    raceNumber: 9,
    raceName: '광주 4경주',
    date: '2025-07-06 13:45',
    venue: '광주',
    horses: [
      {
        id: '9-1',
        horseName: '광주의함성',
        jockey: '박현우',
        trainer: '김점오',
        gateNumber: 1,
        predictionRate: 30.1,
      },
      {
        id: '9-2',
        horseName: '무등산맥',
        jockey: '김동수',
        trainer: '안병학',
        gateNumber: 2,
        predictionRate: 22.8,
      },
      {
        id: '9-3',
        horseName: '빛고을신화',
        jockey: '이동국',
        trainer: '서홍수',
        gateNumber: 3,
        predictionRate: 24.7,
      },
    ],
  },
  {
    id: '10',
    raceNumber: 10,
    raceName: '제주 6경주',
    date: '2025-07-06 15:00',
    venue: '제주',
    horses: [
      {
        id: '10-1',
        horseName: '한라의꿈',
        jockey: '김대연',
        trainer: '김성현',
        gateNumber: 1,
        predictionRate: 27.6,
      },
      {
        id: '10-2',
        horseName: '오름의전설',
        jockey: '장우성',
        trainer: '고성동',
        gateNumber: 2,
        predictionRate: 26.2,
      },
      {
        id: '10-3',
        horseName: '용두암',
        jockey: '정평수',
        trainer: '백광열',
        gateNumber: 3,
        predictionRate: 19.9,
      },
    ],
  },
];
