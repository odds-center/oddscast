import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class KraService {
    private httpService;
    private configService;
    private prisma;
    private readonly logger;
    private readonly serviceKey;
    private readonly baseUrl;
    constructor(httpService: HttpService, configService: ConfigService, prisma: PrismaService);
    syncWeeklySchedule(): Promise<void>;
    syncRaceDayMorning(): Promise<void>;
    syncRealtimeResults(): Promise<void>;
    private getTodayDateString;
    private getUpcomingWeekendDates;
    private meetNameToCode;
    private logKraSync;
    syncEntrySheet(date: string): Promise<{
        message: string;
    }>;
    private processEntrySheetItem;
    syncHistoricalBackfill(dateFrom: string, dateTo: string): Promise<{
        message: string;
        processed: number;
        failed: string[];
        totalResults: number;
    }>;
    private getDateRange;
    private delay;
    fetchRaceResults(date: string, createRaceIfMissing?: boolean): Promise<{
        message: string;
        totalResults?: number;
    }>;
    fetchRaceEntries(meet: string, date: string, raceNo: string): Promise<{
        message: string;
    } | undefined>;
    fetchHorseDetails(meet: string, date: string, raceNo: string): Promise<{
        message: string;
    } | undefined>;
    fetchTrainingData(meet: string, date: string, raceNo: string): Promise<{
        message: string;
    } | undefined>;
    fetchJockeyTotalResults(meet?: string): Promise<{
        message: string;
    }>;
    fetchTrackInfo(date: string): Promise<void>;
    fetchHorseWeight(date: string): Promise<void>;
    fetchEquipmentBleeding(date: string): Promise<void>;
    fetchHorseCancel(date: string): Promise<void>;
    syncAnalysisData(date: string): Promise<{
        message: string;
    }>;
}
