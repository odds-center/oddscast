export declare class CreateResultDto {
    raceId: string;
    ord?: string;
    hrNo: string;
    hrName: string;
    jkName?: string;
    trName?: string;
    owName?: string;
    rcRank?: string;
    rcTime?: string;
    rcPrize?: number;
}
export declare class UpdateResultDto {
    rcRank?: string;
    rcTime?: string;
    rcPrize?: number;
}
export declare class BulkCreateResultDto {
    results: CreateResultDto[];
}
export declare class ResultFilterDto {
    date?: string;
    meet?: string;
    page?: number;
    limit?: number;
}
export declare class ResultStatisticsFilterDto {
    dateFrom?: string;
    dateTo?: string;
    meet?: string;
}
