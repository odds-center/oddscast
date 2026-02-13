import { KraService } from './kra.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class KraController {
    private readonly kraService;
    private readonly prisma;
    private readonly logger;
    constructor(kraService: KraService, prisma: PrismaService);
    getSyncLogs(endpoint?: string, rcDate?: string, limit?: number): Promise<{
        logs: {
            id: number;
            createdAt: Date;
            meet: string | null;
            rcDate: string | null;
            status: string;
            errorMessage: string | null;
            endpoint: string;
            recordCount: number;
            durationMs: number | null;
        }[];
        total: number;
    }>;
    syncSchedule(date: string): Promise<{
        message: string;
        races: number;
        entries: number;
    }>;
    syncResults(date: string): Promise<{
        message: string;
        totalResults?: number;
    }>;
    syncDetails(date: string): Promise<{
        message: string;
    }>;
    syncJockeys(meet?: string): Promise<{
        message: string;
    }>;
}
