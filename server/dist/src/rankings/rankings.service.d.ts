import { PrismaService } from '../prisma/prisma.service';
import { PicksService } from '../picks/picks.service';
export declare class RankingsService {
    private prisma;
    private picksService;
    constructor(prisma: PrismaService, picksService: PicksService);
    getRankings(type?: string, limit?: number): Promise<{
        data: {
            rank: number;
            id: number;
            name: string;
            avatar: string;
            correctCount: number;
            isCurrentUser: boolean;
        }[];
        total: number;
        type: string;
    }>;
    getMyRanking(userId: number, _type?: string): Promise<{
        data: {
            id: number;
            rank: number;
            name: string;
            avatar: string;
            correctCount: number;
            isCurrentUser: boolean;
        };
    }>;
}
