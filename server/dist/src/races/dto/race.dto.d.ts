export declare class CreateRaceDto {
    raceName?: string;
    meet: string;
    meetName?: string;
    rcDate: string;
    rcNo: string;
    rcDist?: string;
    rcGrade?: string;
    rcCondition?: string;
    rcPrize?: number;
    weather?: string;
    trackState?: string;
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
    weight?: number;
}
export declare class RaceFilterDto {
    date?: string;
    meet?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export {};
