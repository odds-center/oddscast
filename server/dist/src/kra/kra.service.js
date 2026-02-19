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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var KraService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KraService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const config_service_1 = require("../config/config.service");
const schedule_1 = require("@nestjs/schedule");
const rxjs_1 = require("rxjs");
const xml2js = __importStar(require("xml2js"));
const dayjs_1 = __importDefault(require("dayjs"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
const constants_1 = require("./constants");
const ord_parser_1 = require("./ord-parser");
const DEFAULT_KRA_BASE_URL = 'http://apis.data.go.kr/B551015';
let KraService = KraService_1 = class KraService {
    constructor(httpService, configService, globalConfigService, prisma, cache) {
        this.httpService = httpService;
        this.configService = configService;
        this.globalConfigService = globalConfigService;
        this.prisma = prisma;
        this.cache = cache;
        this.logger = new common_1.Logger(KraService_1.name);
        dayjs_1.default.extend(customParseFormat_1.default);
        this.serviceKey = this.configService.get('KRA_SERVICE_KEY', '');
    }
    async resolveBaseUrl() {
        const override = await this.globalConfigService.get('kra_base_url_override');
        return (override?.trim() && override.length > 0) ? override.trim() : DEFAULT_KRA_BASE_URL;
    }
    async getKraStatus() {
        const baseUrlInUse = await this.resolveBaseUrl();
        return {
            baseUrlInUse,
            serviceKeyConfigured: this.ensureServiceKey(),
        };
    }
    async syncWeeklySchedule() {
        if (!this.ensureServiceKey())
            return;
        this.logger.log('Running Weekly Schedule Sync (Pre-fetch)');
        const dates = this.getUpcomingWeekendDates();
        for (const date of dates) {
            await this.syncEntrySheet(date);
        }
    }
    async syncRaceDayMorning() {
        if (!this.ensureServiceKey())
            return;
        this.logger.log('Running Race Day Morning Sync (Finalization)');
        const today = this.getTodayDateString();
        await this.syncEntrySheet(today);
        await this.syncAnalysisData(today);
    }
    async syncRealtimeResults() {
        if (!this.ensureServiceKey())
            return;
        this.logger.log('Running Real-time Result Sync');
        const today = this.getTodayDateString();
        await this.fetchRaceResults(today);
        await this.syncAnalysisData(today);
    }
    async syncPreviousDayResults() {
        if (!this.ensureServiceKey())
            return;
        const yesterday = (0, dayjs_1.default)().subtract(1, 'day');
        const day = yesterday.day();
        if (day !== 0 && day !== 5 && day !== 6)
            return;
        const dateStr = this.formatYyyyMmDd(yesterday);
        this.logger.log(`Running Previous Day Result Sync: ${dateStr}`);
        await this.fetchRaceResults(dateStr);
    }
    formatYyyyMmDd(d) {
        return d.format('YYYYMMDD');
    }
    normalizeToYyyyMmDd(date) {
        const d = date.includes('-') ? (0, dayjs_1.default)(date) : (0, dayjs_1.default)(date, 'YYYYMMDD');
        return d.format('YYYYMMDD');
    }
    getTodayDateString() {
        return this.formatYyyyMmDd((0, dayjs_1.default)());
    }
    getUpcomingWeekendDates() {
        const today = (0, dayjs_1.default)();
        const day = today.day();
        const dates = [];
        const diffToFri = 5 - day;
        for (let i = 0; i < 3; i++) {
            dates.push(this.formatYyyyMmDd(today.add(diffToFri + i, 'day')));
        }
        return dates;
    }
    meetNameToCode(name) {
        return (0, constants_1.meetToCode)(name);
    }
    ensureServiceKey() {
        if (!this.serviceKey?.trim()) {
            this.logger.warn('[KraSync] KRA_SERVICE_KEY가 비어있어 KRA API 호출을 스킵합니다. .env에 인코딩된 API 키를 설정하세요.');
            return false;
        }
        return true;
    }
    async logKraSync(endpoint, opts) {
        try {
            await this.prisma.kraSyncLog.create({
                data: {
                    endpoint,
                    meet: opts.meet ?? null,
                    rcDate: opts.rcDate ?? null,
                    status: opts.status,
                    recordCount: opts.recordCount ?? 0,
                    errorMessage: opts.errorMessage ?? null,
                    durationMs: opts.durationMs ?? null,
                },
            });
        }
        catch {
        }
    }
    async syncEntrySheet(date) {
        if (!this.ensureServiceKey()) {
            return {
                message: 'KRA_SERVICE_KEY 미설정. .env에 API 키를 추가하세요.',
                races: 0,
                entries: 0,
            };
        }
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        this.logger.log(`Syncing Entry Sheet for date: ${normalizedDate}`);
        const endpoint = 'entrySheet';
        const baseUrl = await this.resolveBaseUrl();
        let totalRaces = 0;
        let totalEntries = 0;
        for (const meet of constants_1.KRA_MEETS) {
            const start = Date.now();
            try {
                const url = `${baseUrl}/API26_2/entrySheet_2`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meet.code,
                    rc_date: normalizedDate,
                    rc_month: normalizedDate.slice(0, 6),
                    numOfRows: 1000,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                let body;
                if (response.data?.response?.body?.items?.item) {
                    body = response.data.response.body;
                    const rawItems = response.data.response.body.items.item;
                    items = Array.isArray(rawItems) ? rawItems : [rawItems];
                }
                else if (typeof response.data === 'string' &&
                    response.data.includes('<')) {
                    const parser = new xml2js.Parser({ explicitArray: false });
                    const result = await parser.parseStringPromise(response.data);
                    if (result?.response?.body?.items?.item) {
                        body = result.response.body;
                        const rawItems = result.response.body.items.item;
                        items = Array.isArray(rawItems) ? rawItems : [rawItems];
                    }
                }
                const numOfRows = 1000;
                const totalCount = body?.totalCount != null ? Number(body.totalCount) : null;
                let pageNo = 2;
                for (;;) {
                    const shouldFetchMore = totalCount != null
                        ? totalCount > items.length && totalCount > 0
                        : items.length >= numOfRows;
                    if (!shouldFetchMore)
                        break;
                    const nextRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                        params: { ...params, pageNo, numOfRows },
                    }));
                    const nextBody = nextRes?.data?.response?.body;
                    const raw = nextBody?.items?.item;
                    if (!raw)
                        break;
                    const arr = Array.isArray(raw) ? raw : [raw];
                    items.push(...arr);
                    pageNo++;
                    if (arr.length < numOfRows)
                        break;
                }
                if (items.length === 0) {
                    this.logger.warn(`No entries found for meet ${meet.name} on ${date}`);
                    continue;
                }
                for (const item of items) {
                    await this.processEntrySheetItem(item, meet.name, normalizedDate);
                    totalEntries++;
                }
                const uniqueRaces = new Set(items.map((i) => i?.rcNo ?? i?.rc_no ?? ''));
                totalRaces += uniqueRaces.size;
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: normalizedDate,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: normalizedDate,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error(`Failed to fetch entry sheet for ${meet.name}`, error);
            }
        }
        return {
            message: `Synced ${totalRaces} races and ${totalEntries} entries for ${normalizedDate}`,
            races: totalRaces,
            entries: totalEntries,
        };
    }
    async processEntrySheetItem(item, meetName, date) {
        const v = (key) => item[key] ?? item[key.replace(/([A-Z])/g, '_$1').toLowerCase()];
        const vs = (key) => {
            const x = v(key);
            return x != null ? String(x) : null;
        };
        const rcNo = vs('rcNo') || vs('rc_no') || '';
        if (!rcNo)
            return;
        const chaksun1 = vs('chaksun1') || vs('chaksun_1') || '0';
        const prize = parseInt(chaksun1.replace(/,/g, ''), 10) || undefined;
        const stTime = vs('stTime') ?? vs('st_time') ?? null;
        const meetFromApi = vs('meet');
        const meetForRace = meetFromApi && ['서울', '제주', '부산경남'].includes(meetFromApi)
            ? meetFromApi
            : meetName;
        const rcNameRaw = vs('rcName') ?? vs('rc_name') ?? vs('raceName');
        const rcName = rcNameRaw && rcNameRaw.trim() ? rcNameRaw.trim() : `경주 ${rcNo}R`;
        const race = await this.prisma.race.upsert({
            where: {
                meet_rcDate_rcNo: { meet: meetForRace, rcDate: date, rcNo },
            },
            update: {
                rcDist: vs('rcDist') ?? vs('rc_dist'),
                rcName,
                rcDay: vs('rcDay') ?? vs('rc_day'),
                rank: vs('rank'),
                rcPrize: prize,
                meetName: meetFromApi ?? meetName,
                stTime: stTime ?? undefined,
            },
            create: {
                meet: meetForRace,
                rcDate: date,
                rcNo,
                rcDist: vs('rcDist') ?? vs('rc_dist'),
                rcName,
                rcDay: vs('rcDay') ?? vs('rc_day'),
                rank: vs('rank'),
                rcPrize: prize,
                meetName: meetFromApi ?? meetName,
                stTime: stTime ?? undefined,
            },
        });
        const hrNo = vs('hrNo') || vs('hr_no') || '';
        const existingEntry = await this.prisma.raceEntry.findFirst({
            where: { raceId: race.id, hrNo },
        });
        const wgBudamRaw = v('wgBudam') ?? v('wg_budam');
        const weight = wgBudamRaw != null ? parseFloat(String(wgBudamRaw)) : undefined;
        const ratingVal = v('rating');
        const rating = ratingVal != null ? parseFloat(String(ratingVal)) : undefined;
        const ageVal = v('age');
        const age = ageVal != null ? parseInt(String(ageVal), 10) : undefined;
        const chaksun1Raw = v('chaksun1') ?? v('chaksun_1');
        const prize1 = chaksun1Raw != null
            ? parseInt(String(chaksun1Raw).replace(/,/g, ''), 10)
            : undefined;
        const chaksunTRaw = v('chaksunT') ?? v('chaksun_t');
        const prizeT = chaksunTRaw != null
            ? BigInt(parseInt(String(chaksunTRaw).replace(/,/g, ''), 10) || 0)
            : undefined;
        const rcCntTRaw = v('rcCntT') ?? v('rc_cnt_t');
        const totalRuns = rcCntTRaw != null ? parseInt(String(rcCntTRaw), 10) : undefined;
        const ord1CntTRaw = v('ord1CntT') ?? v('ord1_cnt_t');
        const totalWins = ord1CntTRaw != null ? parseInt(String(ord1CntTRaw), 10) : undefined;
        const dusuVal = v('dusu');
        const dusu = dusuVal != null ? parseInt(String(dusuVal), 10) : undefined;
        const chulNoVal = v('chulNo') ?? v('chul_no');
        const chulNo = chulNoVal != null ? String(chulNoVal) : undefined;
        const budam = vs('budam');
        const entryData = {
            raceId: race.id,
            hrNo,
            hrName: vs('hrName') || vs('hr_name') || '',
            hrNameEn: vs('hrNameEn') || vs('hr_name_en'),
            jkNo: vs('jkNo') || vs('jk_no'),
            jkName: vs('jkName') || vs('jk_name') || '',
            jkNameEn: vs('jkNameEn') || vs('jk_name_en'),
            trNo: vs('trNo') || vs('tr_no'),
            trName: vs('trName') || vs('tr_name'),
            owNo: vs('owNo') || vs('ow_no'),
            owName: vs('owName') || vs('ow_name'),
            wgBudam: weight,
            rating,
            chulNo,
            dusu,
            sex: vs('sex'),
            age,
            prd: vs('prd'),
            chaksun1: prize1,
            chaksunT: prizeT,
            rcCntT: totalRuns,
            ord1CntT: totalWins,
            budam: budam ?? undefined,
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
        await this.cache.del(`race:${race.id}`);
    }
    async syncAll(date) {
        if (!this.ensureServiceKey()) {
            return { message: 'KRA_SERVICE_KEY 미설정.' };
        }
        const d = this.normalizeToYyyyMmDd(date);
        this.logger.log(`[syncAll] Starting full sync for ${d}`);
        const out = {
            message: '',
        };
        try {
            const entryRes = await this.syncEntrySheet(d);
            out.entrySheet = { races: entryRes.races, entries: entryRes.entries };
            await this.delay(300);
            const resultRes = await this.fetchRaceResults(d);
            out.results = { totalResults: resultRes.totalResults ?? 0 };
            await this.delay(300);
            const detailRes = await this.syncAnalysisData(d);
            out.details = detailRes.message;
            const jockeyRes = await this.fetchJockeyTotalResults();
            out.jockeys = jockeyRes.message;
            out.message = `전체 적재 완료: ${out.entrySheet?.races ?? 0}경주, ${out.entrySheet?.entries ?? 0}출마, ${out.results?.totalResults ?? 0}결과`;
        }
        catch (err) {
            this.logger.error('[syncAll] Failed', err);
            throw err;
        }
        return out;
    }
    async syncHistoricalBackfill(dateFrom, dateTo) {
        if (!this.ensureServiceKey())
            return;
        this.logger.log(`Starting historical backfill (race days only) from ${dateFrom} to ${dateTo}`);
        const start = this.normalizeToYyyyMmDd(dateFrom);
        const end = this.normalizeToYyyyMmDd(dateTo);
        const dates = this.getRaceDateRange(start, end);
        const summary = { processed: 0, failed: [], totalResults: 0 };
        for (const date of dates) {
            try {
                const result = await this.fetchRaceResults(date, true);
                summary.processed++;
                summary.totalResults +=
                    typeof result === 'object' && result && 'totalResults' in result
                        ? result.totalResults
                        : 0;
                await this.fetchTrackInfo(date);
                await this.delay(500);
            }
            catch (err) {
                summary.failed.push(date);
                this.logger.warn(`Historical backfill failed for ${date}`, err);
            }
        }
        try {
            await this.fetchJockeyTotalResults();
        }
        catch (e) {
            this.logger.warn('Jockey sync after historical failed', e);
        }
        return {
            message: `과거 데이터 적재 완료`,
            processed: summary.processed,
            failed: summary.failed,
            totalResults: summary.totalResults,
        };
    }
    getRaceDateRange(from, to) {
        const dates = [];
        const start = (0, dayjs_1.default)(from, 'YYYYMMDD');
        const end = (0, dayjs_1.default)(to, 'YYYYMMDD');
        for (let d = start; !d.isAfter(end); d = d.add(1, 'day')) {
            const day = d.day();
            if (day === 0 || day === 5 || day === 6) {
                dates.push(this.formatYyyyMmDd(d));
            }
        }
        return dates;
    }
    async syncUpcomingSchedules() {
        if (!this.ensureServiceKey()) {
            return {
                message: 'KRA_SERVICE_KEY 미설정.',
                races: 0,
                entries: 0,
                datesProcessed: 0,
            };
        }
        const today = this.formatYyyyMmDd((0, dayjs_1.default)());
        const oneYearLater = this.formatYyyyMmDd((0, dayjs_1.default)().add(1, 'year'));
        const dates = this.getRaceDateRange(today, oneYearLater);
        this.logger.log(`[syncUpcomingSchedules] ${dates.length}일(금·토·일) 출전표 적재: ${today} ~ ${oneYearLater}`);
        let totalRaces = 0;
        let totalEntries = 0;
        for (const d of dates) {
            try {
                const res = await this.syncEntrySheet(d);
                totalRaces += res.races ?? 0;
                totalEntries += res.entries ?? 0;
                await this.delay(300);
            }
            catch (err) {
                this.logger.warn(`[syncUpcomingSchedules] ${d} 실패`, err);
            }
        }
        return {
            message: `미래 스케줄 적재 완료: ${dates.length}일, ${totalRaces}경주, ${totalEntries}출마`,
            races: totalRaces,
            entries: totalEntries,
            datesProcessed: dates.length,
        };
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async fetchRaceResults(date, createRaceIfMissing = false) {
        if (!this.ensureServiceKey()) {
            return { message: 'KRA_SERVICE_KEY 미설정.', totalResults: 0 };
        }
        this.logger.log(`Fetching race results for date: ${date}`);
        const endpoint = 'raceResult';
        const baseUrl = await this.resolveBaseUrl();
        let totalResults = 0;
        const failed500Meets = [];
        for (const meet of constants_1.KRA_MEETS) {
            const start = Date.now();
            try {
                const normalizedDate = this.normalizeToYyyyMmDd(date);
                const url = `${baseUrl}/API4_3/raceResult_3`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meet.code,
                    rc_date: normalizedDate,
                    numOfRows: 300,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let result;
                if (typeof response.data === 'object' &&
                    response.data?.response?.body?.items?.item) {
                    result = response.data;
                }
                else if (typeof response.data === 'string' &&
                    response.data.includes('<')) {
                    const parser = new xml2js.Parser({ explicitArray: false });
                    result = await parser.parseStringPromise(response.data);
                }
                else {
                    result = {};
                }
                if (!result?.response?.body?.items?.item) {
                    continue;
                }
                let items = Array.isArray(result.response.body.items.item)
                    ? result.response.body.items.item
                    : [result.response.body.items.item];
                const body = result.response?.body;
                const totalCount = body?.totalCount != null ? Number(body.totalCount) : items.length;
                if (totalCount > items.length && totalCount > 0) {
                    const allItems = [...items];
                    for (let pageNo = 2; allItems.length < totalCount; pageNo++) {
                        const nextRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                            params: { ...params, pageNo, numOfRows: 300 },
                        }));
                        const nextResult = nextRes?.data;
                        const nextItems = nextResult?.response?.body?.items?.item;
                        if (!nextItems)
                            break;
                        const arr = Array.isArray(nextItems) ? nextItems : [nextItems];
                        allItems.push(...arr);
                        if (arr.length < 300)
                            break;
                    }
                    items = allItems;
                }
                const racesToUpdate = new Set();
                const getRcName = (it) => {
                    const v = it.rcName ?? it.rc_name ?? it.raceName ?? it.race_name;
                    if (v != null && String(v).trim())
                        return String(v).trim();
                    return null;
                };
                const rcNameFallback = (rcNoStr) => `경주 ${rcNoStr}R`;
                for (const item of items) {
                    const rcNo = String(item.rcNo ?? item.rc_no ?? '');
                    let race = await this.prisma.race.findUnique({
                        where: {
                            meet_rcDate_rcNo: {
                                meet: meet.name,
                                rcDate: normalizedDate,
                                rcNo,
                            },
                        },
                    });
                    const rcNameVal = getRcName(item);
                    const rcNameToSave = rcNameVal ?? rcNameFallback(rcNo);
                    const rcDistVal = item.rcDist ?? item.rc_dist;
                    const rcDayVal = item.rcDay ?? item.rc_day;
                    const rankVal = item.rank;
                    const weatherVal = item.weather;
                    const trackVal = item.track ?? item.trackState ?? item.track;
                    if (!race && createRaceIfMissing) {
                        const meetName = item.meet &&
                            ['서울', '제주', '부산경남'].includes(String(item.meet))
                            ? String(item.meet)
                            : meet.name;
                        race = await this.prisma.race.upsert({
                            where: {
                                meet_rcDate_rcNo: {
                                    meet: meetName,
                                    rcDate: normalizedDate,
                                    rcNo,
                                },
                            },
                            create: {
                                meet: meetName,
                                rcDate: normalizedDate,
                                rcNo,
                                rcDist: rcDistVal != null ? String(rcDistVal) : null,
                                rcName: rcNameToSave,
                                rcDay: rcDayVal != null ? String(rcDayVal) : null,
                                rank: rankVal != null ? String(rankVal) : null,
                                weather: weatherVal != null ? String(weatherVal) : null,
                                track: trackVal != null ? String(trackVal) : null,
                                status: 'COMPLETED',
                            },
                            update: {
                                rcName: rcNameToSave,
                                rcDist: rcDistVal != null ? String(rcDistVal) : undefined,
                                rcDay: rcDayVal != null ? String(rcDayVal) : undefined,
                                rank: rankVal != null ? String(rankVal) : undefined,
                                weather: weatherVal != null ? String(weatherVal) : undefined,
                                track: trackVal != null ? String(trackVal) : undefined,
                            },
                        });
                    }
                    else if (race) {
                        const patch = { rcName: rcNameToSave };
                        if (rcDistVal != null)
                            patch.rcDist = String(rcDistVal);
                        if (rcDayVal != null)
                            patch.rcDay = String(rcDayVal);
                        if (rankVal != null)
                            patch.rank = String(rankVal);
                        if (weatherVal != null)
                            patch.weather = String(weatherVal);
                        if (trackVal != null)
                            patch.track = String(trackVal);
                        await this.prisma.race.update({
                            where: { id: race.id },
                            data: patch,
                        });
                    }
                    if (!race)
                        continue;
                    const hrNoStr = item.hrNo != null
                        ? String(item.hrNo)
                        : item.hr_no != null
                            ? String(item.hr_no)
                            : '';
                    if (hrNoStr) {
                        const existingEntry = await this.prisma.raceEntry.findFirst({
                            where: { raceId: race.id, hrNo: hrNoStr },
                        });
                        if (!existingEntry) {
                            const sv = (val) => val != null ? String(val) : undefined;
                            await this.prisma.raceEntry.create({
                                data: {
                                    raceId: race.id,
                                    hrNo: hrNoStr,
                                    hrName: sv(item.hrName ?? item.hr_name) ?? '',
                                    jkNo: sv(item.jkNo ?? item.jk_no),
                                    jkName: sv(item.jkName ?? item.jk_name) ?? '',
                                    trName: sv(item.trName ?? item.tr_name),
                                    owName: sv(item.owName ?? item.ow_name),
                                    wgBudam: item.wgBudam != null
                                        ? parseFloat(String(item.wgBudam))
                                        : item.wg_budam != null
                                            ? parseFloat(String(item.wg_budam))
                                            : undefined,
                                    chulNo: sv(item.chulNo ?? item.chul_no),
                                    age: item.age != null
                                        ? parseInt(String(item.age), 10)
                                        : undefined,
                                    sex: sv(item.sex),
                                },
                            });
                            await this.cache.del(`race:${race.id}`);
                        }
                    }
                    const existingResult = await this.prisma.raceResult.findFirst({
                        where: {
                            raceId: race.id,
                            hrNo: hrNoStr,
                        },
                    });
                    const s1f = item.seS1fAccTime ?? item.buS1fAccTime ?? item.jeS1fAccTime;
                    const g3f = item.seG3fAccTime ?? item.buG3fAccTime ?? item.jeG3fAccTime;
                    const g1f = item.seG1fAccTime ?? item.buG1fAccTime ?? item.jeG1fAccTime;
                    const hasSectional = s1f != null || g3f != null || g1f != null;
                    const sectionalTimes = hasSectional
                        ? JSON.parse(JSON.stringify({ s1f, g3f, g1f }))
                        : undefined;
                    const sv = (val) => (val != null ? String(val) : undefined);
                    const ordStr = sv(item.ord);
                    const { ordInt: ordIntVal, ordType: ordTypeVal } = (0, ord_parser_1.parseOrd)(ordStr);
                    const resultData = {
                        raceId: race.id,
                        hrNo: sv(item.hrNo ?? item.hr_no) ?? '',
                        hrName: sv(item.hrName ?? item.hr_name) ?? '',
                        ord: ordStr,
                        ordInt: ordIntVal,
                        ordType: ordTypeVal,
                        rcTime: sv(item.rcTime),
                        chulNo: sv(item.chulNo ?? item.chul_no),
                        age: sv(item.age),
                        sex: sv(item.sex),
                        jkNo: sv(item.jkNo ?? item.jk_no),
                        jkName: sv(item.jkName ?? item.jk_name),
                        trName: sv(item.trName ?? item.tr_name),
                        owName: sv(item.owName ?? item.ow_name),
                        wgBudam: item.wgBudam != null
                            ? parseFloat(String(item.wgBudam))
                            : item.wg_budam != null
                                ? parseFloat(String(item.wg_budam))
                                : undefined,
                        wgHr: sv(item.wgHr ?? item.wg_hr),
                        hrTool: sv(item.hrTool ?? item.hr_tool),
                        diffUnit: sv(item.diffUnit ?? item.diff_unit),
                        winOdds: item.winOdds != null
                            ? parseFloat(String(item.winOdds))
                            : undefined,
                        plcOdds: item.plcOdds != null
                            ? parseFloat(String(item.plcOdds))
                            : undefined,
                        track: sv(item.track ?? item.trackState),
                        weather: sv(item.weather),
                        chaksun1: item.rcPrize != null || item.chaksun1 != null
                            ? parseInt(String(item.rcPrize ?? item.chaksun1), 10)
                            : undefined,
                    };
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
                const msg = error instanceof Error ? error.message : String(error);
                const errResp = error && typeof error === 'object' && 'response' in error
                    ? error.response?.status
                    : undefined;
                const is500 = typeof errResp === 'number' && errResp === 500;
                await this.logKraSync(endpoint, {
                    meet: meet.code,
                    rcDate: date,
                    status: 'FAILED',
                    errorMessage: msg.slice(0, 500),
                    durationMs: Date.now() - start,
                });
                if (is500) {
                    failed500Meets.push(meet.name);
                }
                else {
                    this.logger.error(`Failed to fetch results for ${meet.name}`, error);
                }
            }
        }
        if (failed500Meets.length > 0) {
            this.logger.warn(`KRA API 500 for ${date} (${failed500Meets.join(', ')}) - 해당 날짜 경주 없을 수 있음`);
        }
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        const today = (0, dayjs_1.default)().format('YYYYMMDD');
        if (normalizedDate < today) {
            const updated = await this.prisma.race.updateMany({
                where: {
                    rcDate: normalizedDate,
                    status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                },
                data: { status: 'COMPLETED' },
            });
            if (updated.count > 0) {
                this.logger.log(`날짜 지난 경주 ${updated.count}건 COMPLETED 처리 (rcDate=${normalizedDate})`);
                for (const r of await this.prisma.race.findMany({
                    where: { rcDate: normalizedDate },
                    select: { id: true },
                })) {
                    await this.cache.del(`race:${r.id}`);
                }
            }
        }
        return {
            message: `Synced ${totalResults} results for ${date}`,
            totalResults,
        };
    }
    async fetchRaceEntries(meet, date, raceNo) {
        if (!this.ensureServiceKey())
            return { message: 'KRA_SERVICE_KEY 미설정' };
        const meetCode = this.meetNameToCode(meet);
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        const baseUrl = await this.resolveBaseUrl();
        try {
            const url = `${baseUrl}/API26_2/entrySheet_2`;
            const params = {
                serviceKey: decodeURIComponent(this.serviceKey),
                meet: meetCode,
                rc_date: normalizedDate,
                rc_month: normalizedDate.slice(0, 6),
                numOfRows: 500,
                pageNo: 1,
                _type: 'json',
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
            let items = [];
            if (response.data?.response?.body?.items?.item) {
                const raw = response.data.response.body.items.item;
                items = (Array.isArray(raw) ? raw : [raw]);
            }
            else if (typeof response.data === 'string' &&
                response.data.includes('<')) {
                const parser = new xml2js.Parser({ explicitArray: false });
                const result = await parser.parseStringPromise(response.data);
                if (result?.response?.body?.items?.item) {
                    const raw = result.response.body.items.item;
                    items = (Array.isArray(raw) ? raw : [raw]);
                }
            }
            const filtered = items.filter((i) => String(i.rcNo ?? i.rc_no ?? '') === String(raceNo));
            if (filtered.length === 0)
                return { message: 'No entries for race' };
            const race = await this.prisma.race.findUnique({
                where: {
                    meet_rcDate_rcNo: { meet, rcDate: normalizedDate, rcNo: raceNo },
                },
            });
            if (!race) {
                this.logger.warn(`Race not found: ${meet} ${date} R${raceNo}`);
                return { message: 'Race not found' };
            }
            for (const item of filtered) {
                const v = (k) => item[k] ?? item[k.replace(/([A-Z])/g, '_$1').toLowerCase()];
                const vs = (k) => (v(k) != null ? String(v(k)) : null);
                const hrNo = vs('hrNo') || vs('hr_no') || '';
                if (!hrNo)
                    continue;
                const existingEntry = await this.prisma.raceEntry.findFirst({
                    where: { raceId: race.id, hrNo },
                });
                const wgBudam = v('wgBudam') ?? v('wg_budam');
                const entryData = {
                    raceId: race.id,
                    hrNo,
                    hrName: vs('hrName') || vs('hr_name') || '',
                    hrNameEn: vs('hrNameEn') || vs('hr_name_en'),
                    jkNo: vs('jkNo') || vs('jk_no'),
                    jkName: vs('jkName') || vs('jk_name') || '',
                    jkNameEn: vs('jkNameEn') || vs('jk_name_en'),
                    trNo: vs('trNo') || vs('tr_no'),
                    trName: vs('trName') || vs('tr_name'),
                    owNo: vs('owNo') || vs('ow_no'),
                    owName: vs('owName') || vs('ow_name'),
                    wgBudam: wgBudam != null ? parseFloat(String(wgBudam)) : undefined,
                };
                if (existingEntry) {
                    await this.prisma.raceEntry.update({
                        where: { id: existingEntry.id },
                        data: entryData,
                    });
                }
                else {
                    await this.prisma.raceEntry.create({ data: entryData });
                }
            }
            return { message: `Fetched ${filtered.length} entries` };
        }
        catch (error) {
            this.logger.error(`Failed to fetch entries for ${meet} R${raceNo}`, error);
            return { message: 'Fetch failed' };
        }
    }
    async fetchHorseDetails(meet, date, raceNo) {
        if (!this.ensureServiceKey())
            return { message: 'KRA_SERVICE_KEY 미설정' };
        const baseUrl = await this.resolveBaseUrl();
        const race = await this.prisma.race.findUnique({
            where: {
                meet_rcDate_rcNo: { meet, rcDate: date, rcNo: raceNo },
            },
            include: { entries: true },
        });
        if (!race || race.entries.length === 0)
            return { message: 'No entries' };
        const meetCode = this.meetNameToCode(meet);
        for (const entry of race.entries) {
            if (!entry.hrNo)
                continue;
            try {
                const url = `${baseUrl}/API8_2/raceHorseInfo_2`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    meet: meetCode,
                    hr_no: entry.hrNo,
                    act_gubun: 'y',
                    numOfRows: 1,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let item = null;
                const body = response.data?.response?.body ?? response.data?.body;
                if (body?.items?.item) {
                    const raw = body.items.item;
                    item = Array.isArray(raw) ? raw[0] : raw;
                }
                if (!item)
                    continue;
                const v = (k) => item[k] ?? item[k.replace(/([A-Z])/g, '_$1').toLowerCase()];
                const vi = (k) => {
                    const x = v(k);
                    return x != null ? parseInt(String(x), 10) : undefined;
                };
                const vf = (k) => {
                    const x = v(k);
                    return x != null ? parseFloat(String(x)) : undefined;
                };
                const vs = (k) => (v(k) != null ? String(v(k)) : undefined);
                const rating = vf('rating') ?? vi('rating');
                const rcCntT = vi('rcCntT') ?? vi('rc_cnt_t');
                const ord1CntT = vi('ord1CntT') ?? vi('ord1_cnt_t');
                const chaksunT = v('chaksunT') ?? v('chaksun_t');
                const prizeT = chaksunT != null
                    ? BigInt(parseInt(String(chaksunT).replace(/,/g, ''), 10) || 0)
                    : undefined;
                await this.prisma.raceEntry.update({
                    where: { id: entry.id },
                    data: {
                        rating: rating ?? undefined,
                        rcCntT: rcCntT ?? undefined,
                        ord1CntT: ord1CntT ?? undefined,
                        chaksunT: prizeT ?? undefined,
                        sex: vs('sex') ?? undefined,
                        age: vi('age') ?? undefined,
                        prd: vs('prd') ?? vs('name') ?? undefined,
                    },
                });
                await this.delay(150);
            }
            catch (e) {
                this.logger.warn(`Horse details fetch failed for ${entry.hrNo}`, e);
            }
        }
        return { message: 'Fetched horse details' };
    }
    async fetchTrainingData(meet, date, raceNo) {
        if (!this.ensureServiceKey())
            return { message: 'KRA_SERVICE_KEY 미설정' };
        const baseUrl = await this.resolveBaseUrl();
        const race = await this.prisma.race.findUnique({
            where: {
                meet_rcDate_rcNo: { meet, rcDate: date, rcNo: raceNo },
            },
            include: { entries: true },
        });
        if (!race || race.entries.length === 0)
            return { message: 'No entries' };
        const trDateTo = this.normalizeToYyyyMmDd(date);
        const trDateFrom = (0, dayjs_1.default)(date, 'YYYYMMDD')
            .subtract(14, 'day')
            .format('YYYYMMDD');
        for (const entry of race.entries) {
            if (!entry.hrNo)
                continue;
            try {
                const url = `${baseUrl}/trcontihi/gettrcontihi`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    hrno: entry.hrNo,
                    tr_date_fr: trDateFrom,
                    tr_date_to: trDateTo,
                    numOfRows: 50,
                    pageNo: 1,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                if (response.data?.response?.body?.items?.item) {
                    const raw = response.data.response.body.items.item;
                    items = (Array.isArray(raw) ? raw : [raw]);
                }
                await this.prisma.training.deleteMany({
                    where: { raceEntryId: entry.id },
                });
                const trainingSummaries = [];
                for (const item of items) {
                    const trDate = String(item.trDate ?? item.tr_date ?? '');
                    const trTime = String(item.trTime ?? item.tr_time ?? '');
                    const trType = String(item.trType ?? item.tr_type ?? '');
                    const trContent = String(item.trContent ?? item.tr_content ?? '');
                    const place = String(item.place ?? '');
                    const intensity = trType || trContent || '';
                    await this.prisma.training.create({
                        data: {
                            raceEntryId: entry.id,
                            horseNo: entry.hrNo,
                            trDate,
                            trTime: trTime || undefined,
                            trEndTime: String(item.trEndTime ?? item.tr_end_time ?? '') || undefined,
                            trDuration: String(item.trDuration ?? item.tr_duration ?? '') || undefined,
                            trContent: trContent || undefined,
                            trType: trType || undefined,
                            managerType: String(item.managerType ?? item.manager_type ?? '') ||
                                undefined,
                            managerName: String(item.managerName ?? item.manager_name ?? '') ||
                                undefined,
                            place: place || undefined,
                            weather: String(item.weather ?? '') || undefined,
                            trackCondition: String(item.trackCondition ?? item.track_condition ?? '') ||
                                undefined,
                            intensity: intensity || undefined,
                        },
                    });
                    trainingSummaries.push(`${trDate} ${trType || trContent}`);
                }
                if (trainingSummaries.length > 0) {
                    await this.prisma.raceEntry.update({
                        where: { id: entry.id },
                        data: {
                            trainingData: {
                                count: items.length,
                                summary: trainingSummaries.slice(-7),
                            },
                        },
                    });
                }
                await this.delay(200);
            }
            catch (e) {
                this.logger.warn(`Training fetch failed for horse ${entry.hrNo}`, e);
            }
        }
        return { message: 'Fetched training data' };
    }
    async fetchJockeyTotalResults(meet) {
        this.logger.log(`Fetching jockey total results${meet ? ` for meet ${meet}` : ''}`);
        const endpoint = 'jockeyResult';
        const baseUrl = await this.resolveBaseUrl();
        const meetsToFetch = meet
            ? [{ code: (0, constants_1.meetToCode)(meet), name: meet }]
            : constants_1.KRA_MEETS;
        let totalJockeys = 0;
        for (const m of meetsToFetch) {
            const start = Date.now();
            try {
                const url = `${baseUrl}/jktresult/getjktresult`;
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
                    items = (Array.isArray(rawItems) ? rawItems : [rawItems]);
                }
                else if (typeof response.data === 'string' &&
                    response.data.includes('<')) {
                    const parser = new xml2js.Parser({ explicitArray: false });
                    const result = await parser.parseStringPromise(response.data);
                    if (result?.response?.body?.items?.item) {
                        const rawItems = result.response.body.items.item;
                        items = (Array.isArray(rawItems) ? rawItems : [rawItems]);
                    }
                }
                if (items.length === 0) {
                    this.logger.warn(`No jockeys found for meet ${m.name}`);
                    continue;
                }
                for (const item of items) {
                    const jkNo = String(item.jkNo ?? item.jk_no ?? '').trim();
                    if (!jkNo)
                        continue;
                    const jkName = String(item.jkName ?? item.jk_name ?? '');
                    const rcCntT = parseInt(String(item.rcCntT ?? item.rc_cnt_t ?? ''), 10) || 0;
                    const ord1CntT = parseInt(String(item.ord1CntT ?? item.ord1_cnt_t ?? ''), 10) || 0;
                    const ord2CntT = parseInt(String(item.ord2CntT ?? item.ord2_cnt_t ?? ''), 10) || 0;
                    const ord3CntT = parseInt(String(item.ord3CntT ?? item.ord3_cnt_t ?? ''), 10) || 0;
                    const winRateTsum = parseFloat(String(item.winRateTsum ?? item.win_rate_tsum ?? '')) ||
                        0.0;
                    const quRateTsum = parseFloat(String(item.quRateTsum ?? item.qu_rate_tsum ?? '')) ||
                        0.0;
                    const chaksunStr = String(item.chaksunT ?? item.chaksun_t ?? '').replace(/,/g, '');
                    const chaksunT = BigInt(parseInt(chaksunStr, 10) || 0);
                    await this.prisma.jockeyResult.upsert({
                        where: {
                            meet_jkNo: {
                                meet: m.code,
                                jkNo,
                            },
                        },
                        update: {
                            jkName,
                            rcCntT,
                            ord1CntT,
                            ord2CntT,
                            ord3CntT,
                            winRateTsum,
                            quRateTsum,
                            chaksunT,
                        },
                        create: {
                            meet: m.code,
                            jkNo,
                            jkName,
                            rcCntT,
                            ord1CntT,
                            ord2CntT,
                            ord3CntT,
                            winRateTsum,
                            quRateTsum,
                            chaksunT,
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
    async fetchTrainerInfo(meet) {
        this.logger.log(`Fetching trainer info${meet ? ` for meet ${meet}` : ''}`);
        const endpoint = 'trainerInfo';
        const baseUrl = await this.resolveBaseUrl();
        const meetsToFetch = meet
            ? [{ code: (0, constants_1.meetToCode)(meet), name: meet }]
            : constants_1.KRA_MEETS;
        let totalTrainers = 0;
        for (const m of meetsToFetch) {
            let pageNo = 1;
            const numOfRows = 500;
            let hasMore = true;
            while (hasMore) {
                const start = Date.now();
                try {
                    const url = `${baseUrl}/API19_1/trainerInfo_1`;
                    const params = {
                        serviceKey: decodeURIComponent(this.serviceKey),
                        meet: m.code,
                        numOfRows,
                        pageNo,
                        _type: 'json',
                    };
                    const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                    let items = [];
                    if (response.data?.response?.body?.items?.item) {
                        const raw = response.data.response.body.items.item;
                        items = Array.isArray(raw) ? raw : [raw];
                    }
                    const totalCount = response.data?.response?.body?.totalCount ??
                        response.data?.response?.body?.totalcount ??
                        0;
                    for (const item of items) {
                        const trNo = String(item.trNo ?? item['tr_no'] ?? '').trim();
                        if (!trNo)
                            continue;
                        const trName = String(item.trName ?? item['tr_name'] ?? '');
                        const rcCntT = parseInt(String(item.rcCntT ?? item['rc_cnt_t'] ?? ''), 10) || 0;
                        const ord1CntT = parseInt(String(item.ord1CntT ?? item['ord1_cnt_t'] ?? ''), 10) ||
                            0;
                        const ord2CntT = parseInt(String(item.ord2CntT ?? item['ord2_cnt_t'] ?? ''), 10) ||
                            0;
                        const ord3CntT = parseInt(String(item.ord3CntT ?? item['ord3_cnt_t'] ?? ''), 10) ||
                            0;
                        const winRateTsum = parseFloat(String(item.winRateTsum ?? item['win_rate_tsum'] ?? '')) || 0.0;
                        const quRateTsum = parseFloat(String(item.quRateTsum ?? item['qu_rate_tsum'] ?? '')) || 0.0;
                        const plRateTsumRaw = item.plRateTsum ?? item['pl_rate_tsum'];
                        const plRateTsum = plRateTsumRaw != null
                            ? parseFloat(String(plRateTsumRaw))
                            : undefined;
                        const rcCntY = item.rcCntY != null || item['rc_cnt_y'] != null
                            ? parseInt(String(item.rcCntY ?? item['rc_cnt_y'] ?? ''), 10) ||
                                0
                            : undefined;
                        const ord1CntY = item.ord1CntY != null || item['ord1_cnt_y'] != null
                            ? parseInt(String(item.ord1CntY ?? item['ord1_cnt_y'] ?? ''), 10) || 0
                            : undefined;
                        const ord2CntY = item.ord2CntY != null || item['ord2_cnt_y'] != null
                            ? parseInt(String(item.ord2CntY ?? item['ord2_cnt_y'] ?? ''), 10) || 0
                            : undefined;
                        const ord3CntY = item.ord3CntY != null || item['ord3_cnt_y'] != null
                            ? parseInt(String(item.ord3CntY ?? item['ord3_cnt_y'] ?? ''), 10) || 0
                            : undefined;
                        const winRateY = item.winRateY != null || item['win_rate_y'] != null
                            ? parseFloat(String(item.winRateY ?? item['win_rate_y'] ?? '')) || undefined
                            : undefined;
                        const quRateY = item.quRateY != null || item['qu_rate_y'] != null
                            ? parseFloat(String(item.quRateY ?? item['qu_rate_y'] ?? '')) ||
                                undefined
                            : undefined;
                        const plRateY = item.plRateY != null || item['pl_rate_y'] != null
                            ? parseFloat(String(item.plRateY ?? item['pl_rate_y'] ?? '')) ||
                                undefined
                            : undefined;
                        await this.prisma.trainerResult.upsert({
                            where: {
                                meet_trNo: { meet: m.code, trNo },
                            },
                            update: {
                                trName,
                                rcCntT,
                                ord1CntT,
                                ord2CntT,
                                ord3CntT,
                                winRateTsum,
                                quRateTsum,
                                plRateTsum: plRateTsum ?? undefined,
                                rcCntY,
                                ord1CntY,
                                ord2CntY,
                                ord3CntY,
                                winRateY,
                                quRateY,
                                plRateY,
                            },
                            create: {
                                meet: m.code,
                                trNo,
                                trName,
                                rcCntT,
                                ord1CntT,
                                ord2CntT,
                                ord3CntT,
                                winRateTsum,
                                quRateTsum,
                                plRateTsum: plRateTsum ?? undefined,
                                rcCntY,
                                ord1CntY,
                                ord2CntY,
                                ord3CntY,
                                winRateY,
                                quRateY,
                                plRateY,
                            },
                        });
                        totalTrainers++;
                    }
                    const total = typeof totalCount === 'number'
                        ? totalCount
                        : parseInt(String(totalCount), 10) || 0;
                    hasMore = items.length >= numOfRows && total > pageNo * numOfRows;
                    pageNo++;
                    await this.logKraSync(endpoint, {
                        meet: m.code,
                        status: 'SUCCESS',
                        recordCount: items.length,
                        durationMs: Date.now() - start,
                    });
                }
                catch (error) {
                    hasMore = false;
                    await this.logKraSync(endpoint, {
                        meet: m.code,
                        status: 'FAILED',
                        errorMessage: error instanceof Error ? error.message : String(error),
                        durationMs: Date.now() - start,
                    });
                    this.logger.error(`Failed to fetch trainer info for ${m.name}`, error);
                }
            }
        }
        return { updated: totalTrainers };
    }
    async fetchTrackInfo(date) {
        const endpoint = 'trackInfo';
        const baseUrl = await this.resolveBaseUrl();
        for (const meet of constants_1.KRA_MEETS) {
            const start = Date.now();
            try {
                const url = `${baseUrl}/API189_1/Track_1`;
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
                    items = (Array.isArray(raw) ? raw : [raw]);
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
                                track: (item.track ?? item.moisture)
                                    ? `${item.track ?? ''} (함수율 ${item.moisture ?? '-'}%)`
                                    : race.track,
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
    async fetchRaceHorseRatings(date) {
        const endpoint = 'raceHorseRating';
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        const baseUrl = await this.resolveBaseUrl();
        const entries = await this.prisma.raceEntry.findMany({
            where: { race: { rcDate: normalizedDate } },
            select: { id: true, hrNo: true, race: { select: { meet: true } } },
        });
        if (entries.length === 0)
            return { updated: 0 };
        const needKeys = new Set(entries.map((e) => `${e.race?.meet ?? ''}:${e.hrNo}`));
        const entryByKey = new Map(entries.map((e) => [`${e.race?.meet ?? ''}:${e.hrNo}`, e]));
        let updated = 0;
        let pageNo = 1;
        const numOfRows = 500;
        let hasMore = true;
        while (hasMore && needKeys.size > 0) {
            const start = Date.now();
            try {
                const url = `${baseUrl}/API77/raceHorseRating`;
                const params = {
                    serviceKey: decodeURIComponent(this.serviceKey),
                    numOfRows,
                    pageNo,
                    _type: 'json',
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                let items = [];
                const body = response.data?.response?.body;
                if (body?.items?.item) {
                    const raw = body.items.item;
                    items = Array.isArray(raw) ? raw : [raw];
                }
                for (const item of items) {
                    const meetRaw = String(item.meet ?? '');
                    const meetStr = ['서울', '제주', '부산경남'].includes(meetRaw)
                        ? meetRaw
                        : meetRaw === '1'
                            ? '서울'
                            : meetRaw === '2'
                                ? '제주'
                                : meetRaw === '3'
                                    ? '부산경남'
                                    : null;
                    const hrNo = item.hrNo != null ? String(item.hrNo) : '';
                    if (!meetStr || !hrNo)
                        continue;
                    const key = `${meetStr}:${hrNo}`;
                    if (!needKeys.has(key))
                        continue;
                    const entry = entryByKey.get(key);
                    if (!entry)
                        continue;
                    const r1 = item.rating1;
                    const rating1 = r1 != null ? parseFloat(String(r1)) : undefined;
                    const ratingHistory = [];
                    for (const r of [item.rating2, item.rating3, item.rating4]) {
                        if (r != null) {
                            const v = parseFloat(String(r));
                            if (!Number.isNaN(v))
                                ratingHistory.push(v);
                        }
                    }
                    await this.prisma.raceEntry.update({
                        where: { id: entry.id },
                        data: {
                            rating: rating1 ?? undefined,
                            ratingHistory: ratingHistory.length > 0 ? ratingHistory : undefined,
                        },
                    });
                    needKeys.delete(key);
                    updated++;
                }
                hasMore = items.length >= numOfRows;
                pageNo++;
                if (items.length === 0)
                    hasMore = false;
                await this.logKraSync(endpoint, {
                    rcDate: normalizedDate,
                    status: 'SUCCESS',
                    recordCount: items.length,
                    durationMs: Date.now() - start,
                });
                await this.delay(200);
            }
            catch (error) {
                await this.logKraSync(endpoint, {
                    rcDate: normalizedDate,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    durationMs: Date.now() - start,
                });
                this.logger.error('Failed to fetch race horse ratings', error);
                break;
            }
        }
        return { updated };
    }
    async fetchHorseSectionalRecords(date) {
        const endpoint = 'horseSectional';
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        const baseUrl = await this.resolveBaseUrl();
        const entries = await this.prisma.raceEntry.findMany({
            where: { race: { rcDate: normalizedDate } },
            select: { id: true, hrNo: true, race: { select: { meet: true } } },
        });
        if (entries.length === 0)
            return { updated: 0 };
        const needKeys = new Set(entries.map((e) => `${e.race?.meet ?? ''}:${e.hrNo}`));
        const entryByKey = new Map(entries.map((e) => [`${e.race?.meet ?? ''}:${e.hrNo}`, e]));
        let updated = 0;
        for (const meet of constants_1.KRA_MEETS) {
            let pageNo = 1;
            const numOfRows = 100;
            let hasMore = true;
            while (hasMore) {
                const start = Date.now();
                try {
                    const url = `${baseUrl}/API37_1/sectionRecord_1`;
                    const params = {
                        serviceKey: decodeURIComponent(this.serviceKey),
                        meet: meet.code,
                        rc_date: normalizedDate,
                        numOfRows,
                        pageNo,
                        _type: 'json',
                    };
                    const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, { params }));
                    const body = response.data?.response?.body;
                    let items = [];
                    if (body?.items?.item) {
                        const raw = body.items.item;
                        items = Array.isArray(raw) ? raw : [raw];
                    }
                    for (const item of items) {
                        const meetStr = meet.name;
                        const hrNo = String(item.hrNo ?? item['hr_no'] ?? '').trim();
                        if (!hrNo)
                            continue;
                        const key = `${meetStr}:${hrNo}`;
                        if (!needKeys.has(key))
                            continue;
                        const entry = entryByKey.get(key);
                        if (!entry)
                            continue;
                        const s1fAvg = this.parseSectionalVal(item.s1fAvg ??
                            item['s1f_avg'] ??
                            item.S1F_AVG ??
                            item['S1F'] ??
                            item.seS1fAccTime);
                        const g1fAvg = this.parseSectionalVal(item.g1fAvg ??
                            item['g1f_avg'] ??
                            item.G1F_AVG ??
                            item['G1F'] ??
                            item.seG1fAccTime);
                        const s1fMin = this.parseSectionalVal(item.s1fMin ?? item['s1f_min'] ?? item.S1F_MIN);
                        const s1fMax = this.parseSectionalVal(item.s1fMax ?? item['s1f_max'] ?? item.S1F_MAX);
                        const g1fMin = this.parseSectionalVal(item.g1fMin ?? item['g1f_min'] ?? item.G1F_MIN);
                        const g1fMax = this.parseSectionalVal(item.g1fMax ?? item['g1f_max'] ?? item.G1F_MAX);
                        const stats = {};
                        if (s1fAvg != null)
                            stats.s1fAvg = s1fAvg;
                        if (g1fAvg != null)
                            stats.g1fAvg = g1fAvg;
                        if (s1fMin != null)
                            stats.s1fMin = s1fMin;
                        if (s1fMax != null)
                            stats.s1fMax = s1fMax;
                        if (g1fMin != null)
                            stats.g1fMin = g1fMin;
                        if (g1fMax != null)
                            stats.g1fMax = g1fMax;
                        const sectionalStats = Object.keys(stats).length > 0 ? stats : undefined;
                        if (sectionalStats) {
                            await this.prisma.raceEntry.update({
                                where: { id: entry.id },
                                data: { sectionalStats },
                            });
                            needKeys.delete(key);
                            updated++;
                        }
                    }
                    hasMore = items.length >= numOfRows;
                    pageNo++;
                    await this.logKraSync(endpoint, {
                        meet: meet.code,
                        rcDate: normalizedDate,
                        status: 'SUCCESS',
                        recordCount: items.length,
                        durationMs: Date.now() - start,
                    });
                    await this.delay(200);
                }
                catch (error) {
                    hasMore = false;
                    await this.logKraSync(endpoint, {
                        meet: meet.code,
                        rcDate: normalizedDate,
                        status: 'FAILED',
                        errorMessage: error instanceof Error ? error.message : String(error),
                        durationMs: Date.now() - start,
                    });
                    this.logger.error(`Failed to fetch horse sectional for ${meet.name}`, error);
                }
            }
        }
        return { updated };
    }
    parseSectionalVal(val) {
        if (val == null)
            return null;
        const n = Number(val);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    async fetchHorseWeight(date) {
        const endpoint = 'horseWeight';
        const baseUrl = await this.resolveBaseUrl();
        for (const meet of constants_1.KRA_MEETS) {
            const start = Date.now();
            try {
                const url = `${baseUrl}/API25_1/entryHorseWeightInfo_1`;
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
                    items = (Array.isArray(raw) ? raw : [raw]);
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
        const baseUrl = await this.resolveBaseUrl();
        for (const meet of constants_1.KRA_MEETS) {
            const start = Date.now();
            try {
                const url = `${baseUrl}/API24_1/horseMedicalAndEquipment_1`;
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
                    items = (Array.isArray(raw) ? raw : [raw]);
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
        const baseUrl = await this.resolveBaseUrl();
        for (const meet of constants_1.KRA_MEETS) {
            const start = Date.now();
            try {
                const url = `${baseUrl}/API9_1/raceHorseCancelInfo_1`;
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
                    items = (Array.isArray(raw) ? raw : [raw]);
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
        if (!this.ensureServiceKey()) {
            return { message: 'KRA_SERVICE_KEY 미설정.' };
        }
        this.logger.log(`Syncing analysis data (Training, Equipment, etc.) for date: ${date}`);
        const normalizedDate = this.normalizeToYyyyMmDd(date);
        const races = await this.prisma.race.findMany({
            where: { rcDate: normalizedDate },
            select: { meet: true, rcDate: true, rcNo: true },
        });
        if (races.length === 0) {
            return { message: `No races found for ${date}` };
        }
        await this.fetchTrackInfo(date);
        await this.fetchHorseWeight(date);
        await this.fetchEquipmentBleeding(date);
        await this.fetchHorseCancel(date);
        await this.fetchTrainerInfo();
        await this.fetchRaceHorseRatings(date);
        await this.fetchHorseSectionalRecords(date);
        let processedCount = 0;
        for (const race of races) {
            await this.fetchTrainingData(race.meet, race.rcDate, race.rcNo);
            await this.fetchHorseDetails(race.meet, race.rcDate, race.rcNo);
            processedCount++;
        }
        return { message: `Synced analysis data for ${processedCount} races` };
    }
    async seedSampleRaces(date) {
        const rcDate = date
            ? this.normalizeToYyyyMmDd(date)
            : this.getTodayDateString();
        const MEETS = [constants_1.KRA_MEETS[0], constants_1.KRA_MEETS[2]];
        const ENTRIES = [
            {
                hrNo: '001',
                hrName: '다크호스',
                jkName: '김기수',
                trName: '이조교',
                wgBudam: 56,
            },
            {
                hrNo: '002',
                hrName: '썬더볼트',
                jkName: '박기수',
                trName: '최조교',
                wgBudam: 55,
            },
            {
                hrNo: '003',
                hrName: '스타더스트',
                jkName: '정기수',
                trName: '김조교',
                wgBudam: 57,
            },
            {
                hrNo: '004',
                hrName: '라이팅킹',
                jkName: '강기수',
                trName: '박조교',
                wgBudam: 56,
            },
            {
                hrNo: '005',
                hrName: '실버문',
                jkName: '조기수',
                trName: '정조교',
                wgBudam: 54,
            },
        ];
        let raceCount = 0;
        let entryCount = 0;
        for (const meet of MEETS) {
            for (let r = 1; r <= 4; r++) {
                const rcNo = String(r).padStart(2, '0');
                const rcName = `${r}장 경주`;
                const rcDist = [1000, 1200, 1400, 1600][r % 4].toString();
                let race = await this.prisma.race.findFirst({
                    where: { meet: meet.name, rcDate, rcNo },
                });
                if (!race) {
                    race = await this.prisma.race.create({
                        data: {
                            meet: meet.name,
                            meetName: meet.name,
                            rcDate,
                            rcNo,
                            rcDist,
                            rcName,
                            rank: '일반',
                            rcPrize: 5000000,
                        },
                    });
                }
                raceCount++;
                for (const e of ENTRIES) {
                    const existing = await this.prisma.raceEntry.findFirst({
                        where: { raceId: race.id, hrNo: e.hrNo },
                    });
                    const data = {
                        raceId: race.id,
                        hrNo: e.hrNo,
                        hrName: e.hrName,
                        jkName: e.jkName,
                        trName: e.trName,
                        wgBudam: e.wgBudam,
                        chulNo: e.hrNo,
                        dusu: ENTRIES.length,
                        age: 4,
                        sex: '거',
                        prd: '국산',
                        chaksun1: 3000000,
                        chaksunT: BigInt(50000000),
                        rcCntT: 20,
                        ord1CntT: 3,
                    };
                    if (existing) {
                        await this.prisma.raceEntry.update({
                            where: { id: existing.id },
                            data,
                        });
                    }
                    else {
                        await this.prisma.raceEntry.create({ data });
                    }
                    entryCount++;
                }
            }
        }
        this.logger.log(`Sample races seeded: ${raceCount} races, ${entryCount} entries for ${rcDate}`);
        return { races: raceCount, entries: entryCount, rcDate };
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
    (0, schedule_1.Cron)('0,30 10-19 * * 5,6,0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KraService.prototype, "syncRealtimeResults", null);
__decorate([
    (0, schedule_1.Cron)('0 6 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KraService.prototype, "syncPreviousDayResults", null);
exports.KraService = KraService = KraService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        config_service_1.GlobalConfigService,
        prisma_service_1.PrismaService, Function])
], KraService);
//# sourceMappingURL=kra.service.js.map