import type { Cache } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class KraService {
    private httpService;
    private configService;
    private prisma;
    private cache;
    private readonly logger;
    private readonly serviceKey;
    private readonly baseUrl;
    constructor(httpService: HttpService, configService: ConfigService, prisma: PrismaService, cache: Cache);
    syncWeeklySchedule(): Promise<void>;
    syncRaceDayMorning(): Promise<void>;
    syncRealtimeResults(): Promise<void>;
    private formatYyyyMmDd;
    private normalizeToYyyyMmDd;
    private getTodayDateString;
    private getUpcomingWeekendDates;
    private meetNameToCode;
    private ensureServiceKey;
    private logKraSync;
    syncEntrySheet(date: string): Promise<{
        message: string;
        races: number;
        entries: number;
    }>;
    private processEntrySheetItem;
    syncAll(date: string): Promise<{
        message: string;
        entrySheet?: {
            races: number;
            entries: number;
        };
        results?: {
            totalResults: number;
        };
        details?: string;
        jockeys?: string;
    }>;
    syncHistoricalBackfill(dateFrom: string, dateTo: string): Promise<{
        message: string;
        processed: number;
        failed: string[];
        totalResults: number;
    } | undefined>;
    private getRaceDateRange;
    private delay;
    fetchRaceResults(date: string, createRaceIfMissing?: boolean): Promise<{
        message: string;
        totalResults?: number;
    }>;
    fetchRaceEntries(meet: string, date: string, raceNo: string): Promise<{
        message: string;
    }>;
    fetchHorseDetails(meet: string, date: string, raceNo: string): Promise<{
        message: string;
    }>;
    fetchTrainingData(meet: string, date: string, raceNo: string): Promise<{
        message: string;
    }>;
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
    seedSampleRaces(date?: string): Promise<{
        races: number;
        entries: number;
        rcDate: string;
    }>;
}
