import { AnalysisService } from './analysis.service';
export declare class AnalysisController {
    private readonly analysisService;
    constructor(analysisService: AnalysisService);
    getJockeyAnalysis(raceId: string): Promise<{
        entriesWithScores: Array<{
            hrNo: string;
            hrName: string;
            jkNo: string;
            jkName: string;
            horseScore: number;
            jockeyScore: number;
            combinedScore: number;
        }>;
        weightRatio: {
            horse: number;
            jockey: number;
        };
        topPickByJockey: {
            hrNo: string;
            hrName: string;
            jkNo: string;
            jkName: string;
            jockeyScore: number;
        } | null;
    }>;
}
