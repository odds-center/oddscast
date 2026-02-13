import { PicksService } from './picks.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreatePickDto } from './dto/pick.dto';
export declare class PicksController {
    private picksService;
    constructor(picksService: PicksService);
    create(user: JwtPayload, dto: CreatePickDto): Promise<{
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
    findByUser(user: JwtPayload, page?: number, limit?: number): Promise<{
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
    findByRace(raceId: string, user: JwtPayload): Promise<({
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
    delete(raceId: string, user: JwtPayload): Promise<{
        message: string;
    }>;
}
