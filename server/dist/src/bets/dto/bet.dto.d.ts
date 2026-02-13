import { BetType, BetStatus, BetResult } from '@prisma/client';
export declare class SelectionsDto {
    horses: string[];
    positions?: number[];
    combinations?: string[][];
}
export declare class CreateBetDto {
    raceId: number;
    betType: BetType;
    betName: string;
    betDescription?: string;
    betAmount: number;
    selections: SelectionsDto;
    betReason?: string;
    confidenceLevel?: number;
    analysisData?: any;
}
export declare class UpdateBetDto {
    betName?: string;
    betDescription?: string;
    betAmount?: number;
    betReason?: string;
    betStatus?: BetStatus;
    notes?: string;
}
export declare class BetFilterDto {
    raceId?: number;
    betType?: BetType;
    betStatus?: BetStatus;
    betResult?: BetResult;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}
export declare class CreateBetSlipDto {
    raceId: number;
    bets: any[];
}
