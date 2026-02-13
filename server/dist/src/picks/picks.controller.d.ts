import { PicksService } from './picks.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreatePickDto } from './dto/pick.dto';
export declare class PicksController {
    private picksService;
    constructor(picksService: PicksService);
    create(user: JwtPayload, dto: CreatePickDto): Promise<{
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
    findByUser(user: JwtPayload, page?: number, limit?: number): Promise<{
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
    findByRace(raceId: number, user: JwtPayload): Promise<({
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
    delete(raceId: number, user: JwtPayload): Promise<{
        message: string;
    }>;
}
