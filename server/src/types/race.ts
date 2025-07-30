// 경마 관련 타입 정의

// 경마 기본 정보
export interface Race {
  id: string;
  raceName: string;
  venue: string;
  date: string;
  raceNumber: number;
  distance: number;
  grade: string;
  prize: number;
  condition: string;
  weather: string;
  track: string;
  trackCondition: string;
  startTime?: string;
  endTime?: string;
  horses: Horse[];
  createdAt: string;
  updatedAt: string;
}

// 말 정보
export interface Horse {
  id: string;
  horseName: string;
  horseNumber: string;
  jockey: string;
  jockeyNumber: string;
  trainer: string;
  trainerNumber: string;
  owner: string;
  ownerNumber: string;
  gateNumber: number;
  weight: number;
  odds: number;
  predictionRate: number;
  age: number;
  gender: 'male' | 'female';
  color: string;
  finishTime?: string;
  finishOrder?: number;
  margin?: string;
  prize?: number;
}

// 경마 결과
export interface RaceResult {
  id: string;
  raceId: string;
  finishOrder: number;
  horseId: string;
  horseName: string;
  horseNumber: string;
  jockey: string;
  jockeyNumber: string;
  trainer: string;
  trainerNumber: string;
  owner: string;
  ownerNumber: string;
  finishTime: string;
  margin: string;
  odds: number;
  prize: number;
  createdAt: string;
  updatedAt: string;
}

// 경주계획표
export interface RacePlan {
  id: string;
  meet: string;
  meetName: string;
  rcDate: string;
  rcNo: number;
  rcName: string;
  rcDist: number;
  rcGrade: string;
  rcPrize: number;
  rcCondition: string;
  rcWeather: string;
  rcTrack: string;
  rcTrackCondition: string;
  rcStartTime: string;
  rcEndTime: string;
  rcYear: string;
  rcMonth: string;
  rcDay: string;
  rcRound: number;
  createdAt: string;
  updatedAt: string;
}

// 경마장 정보
export interface Venue {
  code: string;
  name: string;
  location: string;
  description?: string;
}

// 경마장 코드 매핑
export const VENUE_CODES: Record<string, string> = {
  '1': '서울',
  '2': '부산',
  '3': '제주',
};

export const VENUE_NAMES: Record<string, string> = {
  서울: '1',
  부산: '2',
  제주: '3',
};
