export declare class CreateResultDto {
    raceId: number;
    ord?: string;
    hrNo: string;
    hrName: string;
    jkName?: string;
    trName?: string;
    owName?: string;
    rcTime?: string;
    chaksun1?: number;
}
export declare class UpdateResultDto {
    ord?: string;
    rcTime?: string;
    chaksun1?: number;
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
