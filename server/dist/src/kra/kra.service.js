"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KraService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KraService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const rxjs_1 = require("rxjs");
const xml2js = __importStar(require("xml2js"));
let KraService = KraService_1 = class KraService {
    constructor(httpService, configService, prisma) {
        this.httpService = httpService;
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(KraService_1.name);
        this.baseUrl = 'http://apis.data.go.kr/B551015';
        this.serviceKey = this.configService.get('KRA_SERVICE_KEY', '');
    }
    async syncWeeklySchedule() {
        this.logger.log('Running Weekly Schedule Sync (Pre-fetch)');
        const dates = this.getUpcomingWeekendDates();
        for (const date of dates) {
            await this.syncEntrySheet(date);
        }
    }
    async syncRaceDayMorning() {
        this.logger.log('Running Race Day Morning Sync (Finalization)');
        const today = this.getTodayDateString();
        await this.syncEntrySheet(today);
        await this.syncAnalysisData(today);
    }
    async syncRealtimeResults() {
        this.logger.log('Running Real-time Result Sync');
        const today = this.getTodayDateString();
        await this.fetchRaceResults(today);
        await this.syncAnalysisData(today);
    }
    getTodayDateString() {
        return new Date().toISOString().split('T')[0].replace(/-/g, '');
    }
    getUpcomingWeekendDates() {
        const today = new Date();
        const day = today.getDay();
        const dates = [];
        const diffToFri = 5 - day;
        for (let i = 0; i < 3; i++) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + diffToFri + i);
            dates.push(nextDate.toISOString().split('T')[0].replace(/-/g, ''));
        }
        return dates;
    }
    meetNameToCode(name) {
        if (name === 'Seoul')
            return '1';
        if (name === 'Jeju')
            return '2';
        if (name === 'Busan')
            return '3';
        return '1';
    }
    async logKraSync(endpoint, opts) {
        await this.prisma.kraSyncLog.create({
            data: {
                endpoint,
                meet: opts.meet,
                rcDate: opts.rcDate,
                status: opts.status,
                recordCount: opts.recordCount ?? 0,
                errorMessage: opts.errorMessage,
                durationMs: opts.durationMs,
            },
        });
    }
    async syncEntrySheet(date) {
        this.logger.log(`Syncing Entry Sheet for date: ${date}`);
        const endpoint = 'entrySheet';
        const meets = [
            { code: '1', name: 'Seoul' },
            { code: '2', name: 'Jeju' },
            { code: '3', name: 'Busan' },
        ];
        let totalRaces = 0;
        let totalEntries = 0;
        for (const meet of meets) {
            const start = Date.now();
            try {
                const url = `${this.baseUrl}/API26_2/entrySheet_2`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meet.code,
                    rc_date: date,
                    numOfRows: 1000,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                if (response.data?.response?.body?.items?.item) {
                    const rawItems = response.data.response.body.items.item;
                    items = Array.isArray(rawItems) ? rawItems : [rawItems];
                }
                else if (typeof response.data === 'string' &&
                    response.data.includes('<')) {
                    const parser = new xml2js.Parser({ explicitArray: false });
                    const result = await parser.parseStringPromise(response.data);
                    if (result?.response?.body?.items?.item) {
                        const rawItems = result.response.body.items.item;
                        items = Array.isArray(rawItems) ? rawItems : [rawItems];
                    }
                }
                if (items.length === 0) {
                    this.logger.warn(`No entries found for meet ${meet.name} on ${date}`);
                    continue;
                }
                for (const item of items) {
                    await this.processEntrySheetItem(item, meet.name, date);
                    totalEntries++;
                }
                const uniqueRaces = new Set(items.map((i) => i.rcNo));
                totalRaces += uniqueRaces.size;
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error(`Failed to fetch entry sheet for ${meet.name}`, error);
            }
        }
        return {
            message: `Synced ${totalRaces} races and ${totalEntries} entries for ${date}`,
        };
    }
    async processEntrySheetItem(item, meetName, date) {
        const prize = parseInt(item.chaksun1?.replace(/,/g, '') || '0', 10) || 0;
        const race = await this.prisma.race.upsert({
            where: {
                meet_rcDate_rcNo: {
                    meet: meetName,
                    rcDate: date,
                    rcNo: item.rcNo,
                },
            },
            update: {
                rcDist: item.rcDist,
                raceName: item.rcName,
                rcGrade: item.rank,
                rcPrize: prize,
            },
            create: {
                meet: meetName,
                rcDate: date,
                rcNo: item.rcNo,
                rcDist: item.rcDist,
                raceName: item.rcName,
                rcGrade: item.rank,
                rcPrize: prize,
            },
        });
        const existingEntry = await this.prisma.raceEntry.findFirst({
            where: {
                raceId: race.id,
                hrNo: item.hrNo,
            },
        });
        const weight = parseFloat(item.wgBudam) || 0;
        const rating = parseFloat(item.rating) || 0;
        const age = parseInt(item.age, 10) || 0;
        const prize1 = parseInt(item.chaksun1?.replace(/,/g, '') || '0', 10) || 0;
        const prizeT = BigInt(parseInt(item.chaksunT?.replace(/,/g, '') || '0', 10));
        const totalRuns = parseInt(item.rcCntT, 10) || 0;
        const totalWins = parseInt(item.ord1CntT, 10) || 0;
        const dusu = parseInt(item.dusu, 10) || 0;
        const chulNo = parseInt(item.chulNo, 10) || 0;
        const entryData = {
            raceId: race.id,
            hrNo: item.hrNo,
            hrName: item.hrName,
            hrNameEn: item.hrNameEn,
            jkNo: item.jkNo,
            jkName: item.jkName,
            jkNameEn: item.jkNameEn,
            trNo: item.trNo,
            trName: item.trName,
            owNo: item.owNo,
            owName: item.owName,
            weight: weight,
            rating: rating,
            chulNo: chulNo,
            dusu: dusu,
            sex: item.sex,
            age: age,
            origin: item.prd,
            prize1: prize1,
            prizeT: prizeT,
            totalRuns: totalRuns,
            totalWins: totalWins,
        };
        if (existingEntry) {
            await this.prisma.raceEntry.update({
                where: { id: existingEntry.id },
                data: entryData,
            });
        }
        else {
            await this.prisma.raceEntry.create({
                data: entryData,
            });
        }
    }
    async syncHistoricalBackfill(dateFrom, dateTo) {
        this.logger.log(`Starting historical backfill from ${dateFrom} to ${dateTo}`);
        const start = dateFrom.replace(/-/g, '');
        const end = dateTo.replace(/-/g, '');
        const dates = this.getDateRange(start, end);
        const summary = { processed: 0, failed: [], totalResults: 0 };
        for (const date of dates) {
            try {
                const result = await this.fetchRaceResults(date, true);
                summary.processed++;
                summary.totalResults += typeof result === 'object' && result && 'totalResults' in result
                    ? result.totalResults
                    : 0;
                await this.delay(500);
            }
            catch (err) {
                summary.failed.push(date);
                this.logger.warn(`Historical backfill failed for ${date}`, err);
            }
        }
        return {
            message: `과거 데이터 적재 완료`,
            processed: summary.processed,
            failed: summary.failed,
            totalResults: summary.totalResults,
        };
    }
    getDateRange(from, to) {
        const dates = [];
        const start = new Date(parseInt(from.slice(0, 4), 10), parseInt(from.slice(4, 6), 10) - 1, parseInt(from.slice(6, 8), 10));
        const end = new Date(parseInt(to.slice(0, 4), 10), parseInt(to.slice(4, 6), 10) - 1, parseInt(to.slice(6, 8), 10));
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
        }
        return dates;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async fetchRaceResults(date, createRaceIfMissing = false) {
        this.logger.log(`Fetching race results for date: ${date}`);
        const endpoint = 'raceResult';
        const meets = [
            { code: '1', name: 'Seoul' },
            { code: '2', name: 'Jeju' },
            { code: '3', name: 'Busan' },
        ];
        let totalResults = 0;
        for (const meet of meets) {
            const start = Date.now();
            try {
                const url = `${this.baseUrl}/getRaceResult`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meet.code,
                    rc_date: date,
                    numOfRows: 300,
                    pageNo: 1,
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                const parser = new xml2js.Parser({ explicitArray: false });
                const result = await parser.parseStringPromise(response.data);
                if (!result?.response?.body?.items?.item) {
                    continue;
                }
                const items = Array.isArray(result.response.body.items.item)
                    ? result.response.body.items.item
                    : [result.response.body.items.item];
                const racesToUpdate = new Set();
                for (const item of items) {
                    let race = await this.prisma.race.findUnique({
                        where: {
                            meet_rcDate_rcNo: {
                                meet: meet.name,
                                rcDate: date,
                                rcNo: item.rcNo,
                            },
                        },
                    });
                    if (!race && createRaceIfMissing) {
                        race = await this.prisma.race.upsert({
                            where: {
                                meet_rcDate_rcNo: {
                                    meet: meet.name,
                                    rcDate: date,
                                    rcNo: item.rcNo,
                                },
                            },
                            create: {
                                meet: meet.name,
                                rcDate: date,
                                rcNo: item.rcNo,
                                rcDist: item.rcDist ?? null,
                                weather: item.weather ?? null,
                                trackState: item.trackState ?? null,
                                status: 'COMPLETED',
                            },
                            update: {},
                        });
                    }
                    if (!race)
                        continue;
                    const existingResult = await this.prisma.raceResult.findFirst({
                        where: {
                            raceId: race.id,
                            hrNo: item.hrNo,
                        },
                    });
                    const s1f = item.seS1fAccTime ?? item.buS1fAccTime ?? item.jeS1fAccTime;
                    const g3f = item.seG3fAccTime ?? item.buG3fAccTime ?? item.jeG3fAccTime;
                    const g1f = item.seG1fAccTime ?? item.buG1fAccTime ?? item.jeG1fAccTime;
                    const hasSectional = s1f != null || g3f != null || g1f != null;
                    const sectionalTimes = hasSectional
                        ? JSON.parse(JSON.stringify({ s1f, g3f, g1f }))
                        : undefined;
                    const resultData = {
                        raceId: race.id,
                        hrNo: item.hrNo,
                        hrName: item.hrName,
                        ord: item.ord,
                        rcTime: item.rcTime,
                        rcRank: item.ord ?? item.rank,
                        rcDist: item.rcDist,
                        rcWeather: item.weather,
                        rcTrack: item.track,
                        rcTrackCondition: item.track ?? item.trackState,
                        chulNo: item.chulNo,
                        age: item.age,
                        sex: item.sex,
                        jkNo: item.jkNo,
                        jkName: item.jkName,
                        trName: item.trName,
                        owName: item.owName,
                        wgBudam: item.wgBudam != null ? parseFloat(String(item.wgBudam)) : undefined,
                        wgHr: item.wgHr ?? item.wg_hr,
                        hrTool: item.hrTool ?? item.hr_tool,
                        diffUnit: item.diffUnit ?? item.diff_unit,
                        winOdds: item.winOdds != null ? parseFloat(String(item.winOdds)) : undefined,
                        plcOdds: item.plcOdds != null ? parseFloat(String(item.plcOdds)) : undefined,
                    };
                    if (item.rcPrize != null)
                        resultData.rcPrize = parseInt(String(item.rcPrize), 10);
                    if (sectionalTimes)
                        resultData.sectionalTimes = sectionalTimes;
                    const data = { ...resultData };
                    if (existingResult) {
                        await this.prisma.raceResult.update({
                            where: { id: existingResult.id },
                            data,
                        });
                    }
                    else {
                        await this.prisma.raceResult.create({ data });
                    }
                    racesToUpdate.add(race.id);
                    totalResults++;
                }
                for (const raceId of racesToUpdate) {
                    await this.prisma.race.update({
                        where: { id: raceId },
                        data: { status: 'COMPLETED' },
                    });
                }
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error(`Failed to fetch results for ${meet.name}`, error);
            }
        }
        return { message: `Synced ${totalResults} results for ${date}`, totalResults };
    }
    async fetchRaceEntries(meet, date, raceNo) {
        const endpoint = '/getRaceEntry';
        const meetCode = meet === 'Seoul' ? '1' : meet === 'Jeju' ? '2' : '3';
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const params = {
                serviceKey: decodeURIComponent(this.serviceKey),
                meet: meetCode,
                rc_date: date,
                rc_no: raceNo,
                numOfRows: 100,
                pageNo: 1,
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(response.data);
            if (!result?.response?.body?.items?.item) {
                return;
            }
            const items = Array.isArray(result.response.body.items.item)
                ? result.response.body.items.item
                : [result.response.body.items.item];
            const race = await this.prisma.race.findUnique({
                where: {
                    meet_rcDate_rcNo: {
                        meet: meet,
                        rcDate: date,
                        rcNo: raceNo,
                    },
                },
            });
            if (!race) {
                this.logger.warn(`Race not found for entry sync: ${meet} ${date} R${raceNo}`);
                return;
            }
            for (const item of items) {
                const existingEntry = await this.prisma.raceEntry.findFirst({
                    where: {
                        raceId: race.id,
                        hrNo: item.hrNo,
                    },
                });
                const entryData = {
                    raceId: race.id,
                    hrNo: item.hrNo,
                    hrName: item.hrName,
                    jkName: item.jkName,
                    trName: item.trName,
                    owName: item.owName,
                    weight: parseFloat(item.wgBudam) || 0,
                };
                if (existingEntry) {
                    await this.prisma.raceEntry.update({
                        where: { id: existingEntry.id },
                        data: entryData,
                    });
                }
                else {
                    await this.prisma.raceEntry.create({
                        data: entryData,
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to fetch entries for ${meet} R${raceNo}`, error);
        }
        return { message: 'Fetched entries' };
    }
    async fetchHorseDetails(meet, date, raceNo) {
        const race = await this.prisma.race.findUnique({
            where: {
                meet_rcDate_rcNo: { meet, rcDate: date, rcNo: raceNo },
            },
            include: { entries: true },
        });
        if (!race)
            return;
        for (const entry of race.entries) {
            await this.prisma.raceEntry.update({
                where: { id: entry.id },
                data: {
                    rating: 0,
                    equipment: 'None',
                },
            });
        }
        return { message: 'Fetched details (stub)' };
    }
    async fetchTrainingData(meet, date, raceNo) {
        this.logger.log(`Fetching training data for ${meet} ${date} R${raceNo}`);
        const race = await this.prisma.race.findUnique({
            where: {
                meet_rcDate_rcNo: { meet, rcDate: date, rcNo: raceNo },
            },
            include: { entries: true },
        });
        if (!race)
            return;
        for (const entry of race.entries) {
            if (!entry.hrNo)
                continue;
            try {
                const mockTraining = [
                    {
                        date: '20231020',
                        place: 'Seoul',
                        course: 'Outer',
                        time: '50.2',
                        intensity: 'High',
                    },
                    {
                        date: '20231021',
                        place: 'Seoul',
                        course: 'Inner',
                        time: '15.5',
                        intensity: 'Medium',
                    },
                ];
                for (const trn of mockTraining) {
                    await this.prisma.training.create({
                        data: {
                            raceEntryId: entry.id,
                            horseNo: entry.hrNo,
                            date: trn.date,
                            place: trn.place,
                            course: trn.course,
                            time: trn.time,
                            intensity: trn.intensity,
                        },
                    });
                }
            }
            catch (e) {
                this.logger.error(`Failed to fetch training for horse ${entry.hrNo}`, e);
            }
        }
        return { message: 'Fetched training data' };
    }
    async fetchJockeyTotalResults(meet) {
        this.logger.log(`Fetching jockey total results${meet ? ` for meet ${meet}` : ''}`);
        const endpoint = 'jockeyResult';
        const meetsToFetch = meet
            ? [
                {
                    code: meet === 'Seoul' ? '1' : meet === 'Jeju' ? '2' : '3',
                    name: meet,
                },
            ]
            : [
                { code: '1', name: 'Seoul' },
                { code: '2', name: 'Jeju' },
                { code: '3', name: 'Busan' },
            ];
        let totalJockeys = 0;
        for (const m of meetsToFetch) {
            const start = Date.now();
            try {
                const url = `${this.baseUrl}/jktresult/getjktresult`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: m.code,
                    numOfRows: 1000,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                if (response.data?.response?.body?.items?.item) {
                    const rawItems = response.data.response.body.items.item;
                    items = Array.isArray(rawItems) ? rawItems : [rawItems];
                }
                else if (typeof response.data === 'string' &&
                    response.data.includes('<')) {
                    const parser = new xml2js.Parser({ explicitArray: false });
                    const result = await parser.parseStringPromise(response.data);
                    if (result?.response?.body?.items?.item) {
                        const rawItems = result.response.body.items.item;
                        items = Array.isArray(rawItems) ? rawItems : [rawItems];
                    }
                }
                if (items.length === 0) {
                    this.logger.warn(`No jockeys found for meet ${m.name}`);
                    continue;
                }
                for (const item of items) {
                    await this.prisma.jockeyResult.upsert({
                        where: {
                            meet_jkNo: {
                                meet: m.code,
                                jkNo: item.jkNo,
                            },
                        },
                        update: {
                            jkName: item.jkName,
                            rcCntT: parseInt(item.rcCntT, 10) || 0,
                            ord1CntT: parseInt(item.ord1CntT, 10) || 0,
                            ord2CntT: parseInt(item.ord2CntT, 10) || 0,
                            ord3CntT: parseInt(item.ord3CntT, 10) || 0,
                            winRateTsum: parseFloat(item.winRateTsum) || 0.0,
                            quRateTsum: parseFloat(item.quRateTsum) || 0.0,
                            chaksunT: BigInt(parseInt(item.chaksunT?.replace(/,/g, ''), 10) || 0),
                        },
                        create: {
                            meet: m.code,
                            jkNo: item.jkNo,
                            jkName: item.jkName,
                            rcCntT: parseInt(item.rcCntT, 10) || 0,
                            ord1CntT: parseInt(item.ord1CntT, 10) || 0,
                            ord2CntT: parseInt(item.ord2CntT, 10) || 0,
                            ord3CntT: parseInt(item.ord3CntT, 10) || 0,
                            winRateTsum: parseFloat(item.winRateTsum) || 0.0,
                            quRateTsum: parseFloat(item.quRateTsum) || 0.0,
                            chaksunT: BigInt(parseInt(item.chaksunT?.replace(/,/g, ''), 10) || 0),
                        },
                    });
                    totalJockeys++;
                }
                await this.logKraSync(endpoint, {
                    meet: m.code,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    meet: m.code,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error(`Failed to fetch jockey results for ${m.name}`, error);
            }
        }
        return { message: `Synced ${totalJockeys} jockey records` };
    }
    async fetchTrackInfo(date) {
        const endpoint = 'trackInfo';
        const meets = [
            { code: '1', name: 'Seoul' },
            { code: '2', name: 'Jeju' },
            { code: '3', name: 'Busan' },
        ];
        for (const meet of meets) {
            const start = Date.now();
            try {
                const url = `${this.baseUrl}/API189_1/Track_1`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meet.code,
                    rc_date_fr: date,
                    rc_date_to: date,
                    numOfRows: 100,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                if (response.data?.response?.body?.items?.item) {
                    const raw = response.data.response.body.items.item;
                    items = Array.isArray(raw) ? raw : [raw];
                }
                for (const item of items) {
                    const race = await this.prisma.race.findUnique({
                        where: {
                            meet_rcDate_rcNo: {
                                meet: meet.name,
                                rcDate: date,
                                rcNo: String(item.rcNo ?? item.rc_no ?? ''),
                            },
                        },
                    });
                    if (race) {
                        await this.prisma.race.update({
                            where: { id: race.id },
                            data: {
                                weather: item.weather ?? race.weather,
                                trackState: item.track ?? item.moisture
                                    ? `${item.track ?? ''} (함수율 ${item.moisture ?? '-'}%)`
                                    : race.trackState,
                            },
                        });
                    }
                }
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error(`Failed to fetch track info for ${meet.name}`, error);
            }
        }
    }
    async fetchHorseWeight(date) {
        const endpoint = 'horseWeight';
        const meets = [
            { code: '1', name: 'Seoul' },
            { code: '2', name: 'Jeju' },
            { code: '3', name: 'Busan' },
        ];
        for (const meet of meets) {
            const start = Date.now();
            try {
                const url = `${this.baseUrl}/API25_1/entryHorseWeightInfo_1`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meet.code,
                    rc_date: date,
                    numOfRows: 200,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                if (response.data?.response?.body?.items?.item) {
                    const raw = response.data.response.body.items.item;
                    items = Array.isArray(raw) ? raw : [raw];
                }
                for (const item of items) {
                    const race = await this.prisma.race.findUnique({
                        where: {
                            meet_rcDate_rcNo: {
                                meet: meet.name,
                                rcDate: date,
                                rcNo: String(item.rcNo ?? item.rc_no ?? ''),
                            },
                        },
                        include: { entries: true },
                    });
                    if (!race)
                        continue;
                    const entry = race.entries.find((e) => e.hrNo === String(item.hrNo ?? item.hr_no ?? ''));
                    if (entry) {
                        await this.prisma.raceEntry.update({
                            where: { id: entry.id },
                            data: { horseWeight: item.wgHr ?? item.wg_hr ?? null },
                        });
                    }
                }
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error(`Failed to fetch horse weight for ${meet.name}`, error);
            }
        }
    }
    async fetchEquipmentBleeding(date) {
        const endpoint = 'equipmentBleeding';
        const meets = [
            { code: '1', name: 'Seoul' },
            { code: '2', name: 'Jeju' },
            { code: '3', name: 'Busan' },
        ];
        for (const meet of meets) {
            const start = Date.now();
            try {
                const url = `${this.baseUrl}/API24_1/horseMedicalAndEquipment_1`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meet.code,
                    rc_date: date,
                    numOfRows: 200,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                if (response.data?.response?.body?.items?.item) {
                    const raw = response.data.response.body.items.item;
                    items = Array.isArray(raw) ? raw : [raw];
                }
                for (const item of items) {
                    const race = await this.prisma.race.findUnique({
                        where: {
                            meet_rcDate_rcNo: {
                                meet: meet.name,
                                rcDate: date,
                                rcNo: String(item.rcNo ?? item.rc_no ?? ''),
                            },
                        },
                        include: { entries: true },
                    });
                    if (!race)
                        continue;
                    const entry = race.entries.find((e) => e.hrNo === String(item.hrNo ?? item.hr_no ?? ''));
                    if (entry) {
                        await this.prisma.raceEntry.update({
                            where: { id: entry.id },
                            data: {
                                equipment: item.hrTool ?? item.equipment ?? item.equipChange ?? null,
                                bleedingInfo: item.bleCnt != null ||
                                    item.bleDate != null ||
                                    item.medicalInfo != null
                                    ? {
                                        bleCnt: item.bleCnt,
                                        bleDate: item.bleDate,
                                        medicalInfo: item.medicalInfo,
                                    }
                                    : client_1.Prisma.DbNull,
                            },
                        });
                    }
                }
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error(`Failed to fetch equipment/bleeding for ${meet.name}`, error);
            }
        }
    }
    async fetchHorseCancel(date) {
        const endpoint = 'horseCancel';
        const meets = [
            { code: '1', name: 'Seoul' },
            { code: '2', name: 'Jeju' },
            { code: '3', name: 'Busan' },
        ];
        for (const meet of meets) {
            const start = Date.now();
            try {
                const url = `${this.baseUrl}/API9_1/raceHorseCancelInfo_1`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meet.code,
                    rc_date: date,
                    numOfRows: 50,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                if (response.data?.response?.body?.items?.item) {
                    const raw = response.data.response.body.items.item;
                    items = Array.isArray(raw) ? raw : [raw];
                }
                for (const item of items) {
                    const hrNo = String(item.hrNo ?? item.hr_no ?? '');
                    const race = await this.prisma.race.findUnique({
                        where: {
                            meet_rcDate_rcNo: {
                                meet: meet.name,
                                rcDate: date,
                                rcNo: String(item.rcNo ?? item.rc_no ?? ''),
                            },
                        },
                        include: { entries: true },
                    });
                    if (!race)
                        continue;
                    const entry = race.entries.find((e) => e.hrNo === hrNo);
                    if (entry) {
                        await this.prisma.raceEntry.update({
                            where: { id: entry.id },
                            data: { isScratched: true },
                        });
                    }
                }
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error(`Failed to fetch horse cancel for ${meet.name}`, error);
            }
        }
    }
    async syncAnalysisData(date) {
        this.logger.log(`Syncing analysis data (Training, Equipment, etc.) for date: ${date}`);
        const races = await this.prisma.race.findMany({
            where: { rcDate: date },
        });
        if (races.length === 0) {
            return { message: `No races found for ${date}` };
        }
        await this.fetchTrackInfo(date);
        await this.fetchHorseWeight(date);
        await this.fetchEquipmentBleeding(date);
        await this.fetchHorseCancel(date);
        let processedCount = 0;
        for (const race of races) {
            await this.fetchTrainingData(race.meet, race.rcDate, race.rcNo);
            await this.fetchHorseDetails(race.meet, race.rcDate, race.rcNo);
            processedCount++;
        }
        return { message: `Synced analysis data for ${processedCount} races` };
    }
};
exports.KraService = KraService;
__decorate([
    (0, schedule_1.Cron)('0 18 * * 3,4'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KraService.prototype, "syncWeeklySchedule", null);
__decorate([
    (0, schedule_1.Cron)('0 8 * * 5,6,0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KraService.prototype, "syncRaceDayMorning", null);
__decorate([
    (0, schedule_1.Cron)('0,30 10-18 * * 5,6,0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KraService.prototype, "syncRealtimeResults", null);
exports.KraService = KraService = KraService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], KraService);
//# sourceMappingURL=kra.service.js.map