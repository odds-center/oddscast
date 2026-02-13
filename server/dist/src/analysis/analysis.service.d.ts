import { PrismaService } from '../prisma/prisma.service';
export declare class AnalysisService {
    private prisma;
    private readonly scriptPath;
    constructor(prisma: PrismaService);
    private runPythonScript;
    calculateScore(raceData: {
        entries: Array<{
            hrNo?: string;
            rating?: number;
        }>;
    }): Promise<unknown>;
    analyzeJockey(raceId: number): Promise<{
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
