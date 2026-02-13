import { PrismaService } from '../prisma/prisma.service';
import { PicksService } from '../picks/picks.service';
export declare class RankingsService {
    private prisma;
    private picksService;
    constructor(prisma: PrismaService, picksService: PicksService);
    getRankings(type?: string, limit?: number): Promise<{
        data: {
            rank: number;
            id: string;
            name: string;
            avatar: string;
            correctCount: number;
            isCurrentUser: boolean;
        }[];
        total: number;
        type: string;
    }>;
    getMyRanking(userId: string, _type?: string): Promise<{
        data: {
            id: string;
            rank: number;
            name: string;
            avatar: string;
            correctCount: number;
            isCurrentUser: boolean;
        };
    }>;
}
