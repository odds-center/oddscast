import { PrismaService } from '../prisma/prisma.service';
import { CreatePickDto } from './dto/pick.dto';
import { PickType } from '@prisma/client';
export declare class PicksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: number, dto: CreatePickDto): Promise<{
        race: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
            status: import("@prisma/client").$Enums.RaceStatus;
            rcDay: string | null;
            stTime: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        raceId: number;
        userId: number;
        pickType: import("@prisma/client").$Enums.PickType;
        hrNos: string[];
        hrNames: string[];
        pointsAwarded: number | null;
    }>;
    findByUser(userId: number, page?: number, limit?: number): Promise<{
        picks: ({
            race: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                rcName: string | null;
                meet: string;
                meetName: string | null;
                rcDate: string;
                rcNo: string;
                rcDist: string | null;
                rank: string | null;
                rcCondition: string | null;
                rcPrize: number | null;
                weather: string | null;
                track: string | null;
                status: import("@prisma/client").$Enums.RaceStatus;
                rcDay: string | null;
                stTime: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            raceId: number;
            userId: number;
            pickType: import("@prisma/client").$Enums.PickType;
            hrNos: string[];
            hrNames: string[];
            pointsAwarded: number | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findByRace(raceId: number, userId?: number): Promise<({
        race: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            rcName: string | null;
            meet: string;
            meetName: string | null;
            rcDate: string;
            rcNo: string;
            rcDist: string | null;
            rank: string | null;
            rcCondition: string | null;
            rcPrize: number | null;
            weather: string | null;
            track: string | null;
            status: import("@prisma/client").$Enums.RaceStatus;
            rcDay: string | null;
            stTime: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        raceId: number;
        userId: number;
        pickType: import("@prisma/client").$Enums.PickType;
        hrNos: string[];
        hrNames: string[];
        pointsAwarded: number | null;
    }) | null>;
    delete(userId: number, raceId: number): Promise<{
        message: string;
    }>;
    getCorrectCount(userId: number): Promise<number>;
    getCorrectCountByUser(): Promise<Map<number, number>>;
    checkPickHit(pickType: PickType, hrNos: string[], results: {
        hrNo: string;
        ord: string | null;
    }[]): boolean;
}
