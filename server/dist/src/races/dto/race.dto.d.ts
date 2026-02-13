export declare class CreateRaceDto {
    rcName?: string;
    meet: string;
    meetName?: string;
    rcDate: string;
    rcNo: string;
    rcDist?: string;
    rank?: string;
    rcCondition?: string;
    rcPrize?: number;
    weather?: string;
    track?: string;
}
declare const UpdateRaceDto_base: import("@nestjs/common").Type<Partial<CreateRaceDto>>;
export declare class UpdateRaceDto extends UpdateRaceDto_base {
}
export declare class CreateRaceEntryDto {
    hrNo: string;
    hrName: string;
    jkName: string;
    trName?: string;
    owName?: string;
    wgBudam?: number;
}
export declare class RaceFilterDto {
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    meet?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export {};
