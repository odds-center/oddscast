/**
 * 경주 관련 공통 타입
 * 서버(NestJS)와 모바일(React Native) 모두에서 사용
 */
/**
 * 경주 정보
 */
export interface Race {
    id: string;
    rcDate: string;
    rcNo: number;
    rcName?: string;
    rcDist?: string;
    rcTime?: string;
    meet?: string;
    chulNo?: string;
    grade?: string;
    divn?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * 출전마 정보
 */
export interface EntryDetail {
    id: string;
    raceId: string;
    hrNo: string;
    hrName: string;
    hrAge?: string;
    hrGender?: string;
    hrWeightBefore?: string;
    hrWeightAfter?: string;
    jkName?: string;
    jkWeight?: string;
    trName?: string;
    hrRating?: string;
    owName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * 경주 결과
 */
export interface RaceResult {
    id: string;
    raceId: string;
    hrNo: string;
    hrName: string;
    ord: number;
    jkName?: string;
    trName?: string;
    rcTime?: string;
    rank1?: string;
    rank2?: string;
    rank3?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * 배당률
 */
export interface DividendRate {
    id: string;
    raceId: string;
    betType: string;
    combination: string;
    dividend: number;
    createdAt?: Date;
}
/**
 * 경주 계획 (KRA API)
 */
export interface RacePlan {
    id: string;
    rcDate: string;
    rcNo: number;
    meet?: string;
    grade?: string;
    divn?: string;
    rcDist?: string;
    rcName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * 경주 리스트 응답 (모바일용)
 */
export interface RaceListResponse {
    races: Race[];
    total: number;
    page: number;
    limit: number;
}
/**
 * 경주 상세 응답 (모바일용)
 */
export interface RaceDetailResponse {
    race: Race;
    entries: EntryDetail[];
    results?: RaceResult[];
    dividends?: DividendRate[];
}
//# sourceMappingURL=race.types.d.ts.map