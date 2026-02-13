import { PickType } from '@prisma/client';
export declare const PICK_TYPE_HORSE_COUNTS: Record<PickType, number>;
export declare class CreatePickDto {
    raceId: number;
    pickType: PickType;
    hrNos: string[];
    hrNames?: string[];
}
