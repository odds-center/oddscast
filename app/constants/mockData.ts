
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
      { id: '1-1', horseName: '금빛질주', jockey: '김기수', trainer: '박조교', gateNumber: 1, predictionRate: 25.5 },
      { id: '1-2', horseName: '바람의아들', jockey: '이성현', trainer: '최트레', gateNumber: 2, predictionRate: 18.2 },
      { id: '1-3', horseName: '천리마', jockey: '박태종', trainer: '김영관', gateNumber: 3, predictionRate: 33.1 },
    ],
  },
  {
    id: '2',
    raceNumber: 2,
    raceName: '서울 5경주',
    date: '2025-07-06 14:20',
    venue: '서울',
    horses: [
        { id: '2-1', horseName: '돌콩', jockey: '문세영', trainer: '김호', gateNumber: 1, predictionRate: 40.8 },
        { id: '2-2', horseName: '클린업조이', jockey: '함완식', trainer: '송문길', gateNumber: 2, predictionRate: 15.3 },
        { id: '2-3', horseName: '실버울프', jockey: '유현명', trainer: '송문길', gateNumber: 3, predictionRate: 22.0 },
    ],
  },
];
