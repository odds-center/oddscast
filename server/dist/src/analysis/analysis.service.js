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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
let AnalysisService = class AnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
        this.scriptPath = path.join(process.cwd(), 'scripts', 'analysis.py');
    }
    runPythonScript(input) {
        return new Promise((resolve, reject) => {
            const pythonProcess = (0, child_process_1.spawn)('python3', [this.scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            let dataString = '';
            let errorString = '';
            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });
            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script failed (${code}): ${errorString || dataString}`));
                }
                else {
                    try {
                        resolve(JSON.parse(dataString));
                    }
                    catch {
                        reject(new Error(`Failed to parse Python output: ${dataString}`));
                    }
                }
            });
            pythonProcess.stdin.write(JSON.stringify(input));
            pythonProcess.stdin.end();
        });
    }
    async calculateScore(raceData) {
        return this.runPythonScript(raceData);
    }
    async analyzeJockey(raceId) {
        const race = await this.prisma.race.findUnique({
            where: { id: raceId },
            include: {
                entries: true,
                results: { orderBy: [{ ordInt: 'asc' }, { ord: 'asc' }] },
            },
        });
        if (!race)
            throw new common_1.NotFoundException('경주를 찾을 수 없습니다');
        const meetMap = {
            서울: '1',
            제주: '2',
            부산경남: '3',
            부산: '3',
            부경: '3',
            Seoul: '1',
            Jeju: '2',
            Busan: '3',
        };
        const meet = meetMap[String(race.meet)] ??
            (String(race.meet).replace(/[^123]/g, '') || '1');
        const jockeyNos = [
            ...new Set(race.entries.map((e) => e.jkNo).filter(Boolean)),
        ];
        const jockeys = await this.prisma.jockeyResult.findMany({
            where: {
                meet,
                jkNo: { in: jockeyNos },
            },
        });
        const jockeyMap = {};
        for (const j of jockeys) {
            jockeyMap[`${j.meet}_${j.jkNo}`] = {
                winRateTsum: j.winRateTsum,
                quRateTsum: j.quRateTsum,
                rcCntT: j.rcCntT,
            };
        }
        const input = {
            command: 'analyze_jockey',
            race: {
                meet: race.meet,
                meetName: race.meetName,
                rcDate: race.rcDate,
                rcNo: race.rcNo,
                rcDist: race.rcDist,
                weather: race.weather,
            },
            entries: race.entries.map((e) => ({
                hrNo: e.hrNo,
                hrName: e.hrName,
                jkNo: e.jkNo,
                jkName: e.jkName,
                rating: e.rating,
            })),
            jockeyMap,
            results: race.results.map((r) => ({
                rcTime: r.rcTime,
                ord: r.ord,
            })),
        };
        const result = (await this.runPythonScript(input));
        if (result && typeof result === 'object' && 'error' in result) {
            throw new Error(`Analysis error: ${result.error}`);
        }
        return {
            entriesWithScores: result.entriesWithScores || [],
            weightRatio: result.weightRatio || { horse: 0.7, jockey: 0.3 },
            topPickByJockey: result.topPickByJockey ?? null,
        };
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalysisService);
//# sourceMappingURL=analysis.service.js.map