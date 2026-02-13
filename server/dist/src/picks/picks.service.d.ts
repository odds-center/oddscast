import { PrismaService } from '../prisma/prisma.service';
import { CreatePickDto } from './dto/pick.dto';
import { PickType } from '@prisma/client';
export declare class PicksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreatePickDto): Promise<{
        race: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            raceName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rcGrade: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            trackState: string | null;
            status: import(".prisma/client").$Enums.RaceStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        raceId: string;
        pickType: import(".prisma/client").$Enums.PickType;
        hrNos: string[];
        hrNames: string[];
        userId: string;
        pointsAwarded: number | null;
    }>;
    findByUser(userId: string, page?: number, limit?: number): Promise<{
        picks: ({
            race: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                raceName: string | null;
                meet: string;
                meetName: string | null;
                rcDate: string;
                rcNo: string;
                rcDist: string | null;
                rcGrade: string | null;
                rcCondition: string | null;
                rcPrize: number | null;
                weather: string | null;
                trackState: string | null;
                status: import(".prisma/client").$Enums.RaceStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            raceId: string;
            pickType: import(".prisma/client").$Enums.PickType;
            hrNos: string[];
            hrNames: string[];
            userId: string;
            pointsAwarded: number | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findByRace(raceId: string, userId?: string): Promise<({
        race: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            raceName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rcGrade: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            trackState: string | null;
            status: import(".prisma/client").$Enums.RaceStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        raceId: string;
        pickType: import(".prisma/client").$Enums.PickType;
        hrNos: string[];
        hrNames: string[];
        userId: string;
        pointsAwarded: number | null;
    }) | null>;
    delete(userId: string, raceId: string): Promise<{
        message: string;
    }>;
    getCorrectCount(userId: string): Promise<number>;
    getCorrectCountByUser(): Promise<Map<string, number>>;
    checkPickHit(pickType: PickType, hrNos: string[], results: {
        hrNo: string;
        rcRank: string | null;
    }[]): boolean;
}
