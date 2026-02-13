import { RankingsService } from './rankings.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class RankingsController {
    private rankingsService;
    constructor(rankingsService: RankingsService);
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
    getMyRanking(user: JwtPayload, type?: string): Promise<{
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
