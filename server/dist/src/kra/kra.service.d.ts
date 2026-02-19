import type { Cache } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalConfigService } from '../config/config.service';
export declare class KraService {
    private httpService;
    private configService;
    private globalConfigService;
    private prisma;
    private cache;
    private readonly logger;
    private readonly serviceKey;
    constructor(httpService: HttpService, configService: ConfigService, globalConfigService: GlobalConfigService, prisma: PrismaService, cache: Cache);
    private resolveBaseUrl;
    getKraStatus(): Promise<{
        baseUrlInUse: string;
        serviceKeyConfigured: boolean;
    }>;
    syncWeeklySchedule(): Promise<void>;
    syncRaceDayMorning(): Promise<void>;
    syncRealtimeResults(): Promise<void>;
    syncPreviousDayResults(): Promise<void>;
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
    syncUpcomingSchedules(): Promise<{
        message: string;
        races: number;
        entries: number;
        datesProcessed: number;
    }>;
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
    fetchTrainerInfo(meet?: string): Promise<{
        updated: number;
    }>;
    fetchTrackInfo(date: string): Promise<void>;
    fetchRaceHorseRatings(date: string): Promise<{
        updated: number;
    }>;
    fetchHorseSectionalRecords(date: string): Promise<{
        updated: number;
    }>;
    private parseSectionalVal;
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
