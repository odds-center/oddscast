import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, execSync } from 'child_process';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { RaceAnalysisCache } from '../database/entities/race-analysis-cache.entity';

export interface AnalyzeJockeyResult {
  entriesWithScores: Array<{
    hrNo: string;
    hrName: string;
    chulNo: string | null;
    jkNo: string;
    jkName: string;
    horseScore: number;
    jockeyScore: number;
    combinedScore: number;
  }>;
  weightRatio: { horse: number; jockey: number };
  topPickByJockey: {
    hrNo: string;
    hrName: string;
    jkNo: string;
    jkName: string;
    jockeyScore: number;
  } | null;
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly scriptPath = path.join(
    process.cwd(),
    'scripts',
    'analysis.py',
  );

  private static readonly MEET_CODE_MAP: Record<string, string> = {
    서울: '1',
    제주: '2',
    부산경남: '3',
    부산: '3',
    부경: '3',
    Seoul: '1',
    Jeju: '2',
    Busan: '3',
    SEOUL: '1',
    JEJU: '2',
    BUSAN: '3',
  };

  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceEntry)
    private readonly entryRepo: Repository<RaceEntry>,
    @InjectRepository(RaceResult)
    private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(JockeyResult)
    private readonly jockeyResultRepo: Repository<JockeyResult>,
    @InjectRepository(TrainerResult)
    private readonly trainerResultRepo: Repository<TrainerResult>,
    @InjectRepository(RaceAnalysisCache)
    private readonly cacheRepo: Repository<RaceAnalysisCache>,
  ) {}

  /** Resolve python3 binary path: env var → well-known paths → PATH lookup */
  private static resolvePythonBin(): string {
    if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
    const candidates = ['/usr/bin/python3', '/usr/local/bin/python3'];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    try {
      return execSync('which python3', { encoding: 'utf8' }).trim();
    } catch {
      return 'python3';
    }
  }

  private runPythonScript(input: object): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const pythonBin = AnalysisService.resolvePythonBin();
      const pythonProcess = spawn(pythonBin, [this.scriptPath], {
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

      pythonProcess.on('error', (err) => {
        reject(
          new Error(
            `Python process spawn error: ${err.message} (code: ${(err as NodeJS.ErrnoException).code ?? 'unknown'})`,
          ),
        );
      });

      pythonProcess.on('close', (code, signal) => {
        if (code !== 0) {
          const detail = errorString || dataString || 'no output';
          const signalInfo = signal ? `, signal: ${signal}` : '';
          reject(
            new Error(
              `Python script failed (exit: ${code}${signalInfo}): ${detail}`,
            ),
          );
        } else {
          try {
            resolve(JSON.parse(dataString));
          } catch {
            reject(new Error(`Failed to parse Python output: ${dataString}`));
          }
        }
      });

      pythonProcess.stdin.write(JSON.stringify(input));
      pythonProcess.stdin.end();
    });
  }

  private computeDataHash(input: object): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(input))
      .digest('hex')
      .slice(0, 16);
  }

  async calculateScore(raceData: {
    entries: Array<{ hrNo?: string; rating?: number }>;
  }): Promise<unknown> {
    return this.runPythonScript(raceData);
  }

  /** Build the full input object for jockey analysis (no Python call) */
  private async buildJockeyAnalysisInput(raceId: number) {
    const race = await this.raceRepo.findOne({
      where: { id: raceId },
      select: [
        'id',
        'meet',
        'meetName',
        'rcDate',
        'rcNo',
        'rcDist',
        'weather',
        'track',
      ],
    });
    if (!race) throw new NotFoundException('Race not found');

    const entries = await this.entryRepo.find({
      where: { raceId, isScratched: false },
    });

    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .select(['rr.rcTime', 'rr.ord'])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC')
      .addOrderBy('rr.ord', 'ASC')
      .getMany();

    const meet =
      AnalysisService.MEET_CODE_MAP[String(race.meet)] ??
      (String(race.meet).replace(/[^123]/g, '') || '1');

    // Fetch jockey stats (meet-specific + career fallback)
    const jockeyNos = [
      ...new Set(entries.map((e) => e.jkNo).filter(Boolean)),
    ] as string[];
    const jockeyMap: Record<
      string,
      {
        winRateTsum: number;
        quRateTsum: number;
        rcCntT: number;
        isFallback: boolean;
      }
    > = {};

    if (jockeyNos.length > 0) {
      const meetRows = await this.jockeyResultRepo.find({
        where: { meet, jkNo: In(jockeyNos) },
        select: ['jkNo', 'rcCntT', 'winRateTsum', 'quRateTsum'],
      });
      for (const j of meetRows) {
        jockeyMap[j.jkNo] = {
          winRateTsum: j.winRateTsum,
          quRateTsum: j.quRateTsum,
          rcCntT: j.rcCntT,
          isFallback: false,
        };
      }

      const foundNos = new Set(meetRows.map((j) => j.jkNo));
      const missingNos = jockeyNos.filter((n) => !foundNos.has(n));
      if (missingNos.length > 0) {
        const careerRows = await this.jockeyResultRepo.find({
          where: { jkNo: In(missingNos) },
          select: ['jkNo', 'rcCntT', 'ord1CntT', 'ord2CntT', 'ord3CntT'],
        });
        const agg: Record<
          string,
          { rc: number; o1: number; o2: number; o3: number }
        > = {};
        for (const row of careerRows) {
          const a = (agg[row.jkNo] ??= { rc: 0, o1: 0, o2: 0, o3: 0 });
          a.rc += row.rcCntT ?? 0;
          a.o1 += row.ord1CntT ?? 0;
          a.o2 += row.ord2CntT ?? 0;
          a.o3 += row.ord3CntT ?? 0;
        }
        for (const [jkNo, a] of Object.entries(agg)) {
          if (a.rc > 0) {
            jockeyMap[jkNo] = {
              winRateTsum: (a.o1 / a.rc) * 100,
              quRateTsum: ((a.o1 + a.o2 + a.o3) / a.rc) * 100,
              rcCntT: a.rc,
              isFallback: true,
            };
          }
        }
      }
    }

    // Fetch trainer stats
    const trainerNos = [
      ...new Set(entries.map((e) => e.trNo).filter(Boolean)),
    ] as string[];
    const trainerMap: Record<
      string,
      { winRateTsum: number; quRateTsum: number }
    > = {};
    if (trainerNos.length > 0) {
      const trainerRows = await this.trainerResultRepo.find({
        where: { meet, trNo: In(trainerNos) },
        select: ['trNo', 'winRateTsum', 'quRateTsum'],
      });
      for (const t of trainerRows) {
        trainerMap[t.trNo] = {
          winRateTsum: t.winRateTsum,
          quRateTsum: t.quRateTsum,
        };
      }
    }

    return {
      command: 'analyze_jockey',
      race: {
        meet: race.meet,
        meetName: race.meetName,
        rcDate: race.rcDate,
        rcNo: race.rcNo,
        rcDist: race.rcDist,
        weather: race.weather,
        track: race.track ?? undefined,
      },
      entries: entries.map((e) => {
        const jk = e.jkNo ? jockeyMap[e.jkNo] : undefined;
        const tr = e.trNo ? trainerMap[e.trNo] : undefined;
        return {
          hrNo: e.hrNo,
          hrName: e.hrName,
          chulNo: e.chulNo,
          jkNo: e.jkNo,
          jkName: e.jkName,
          rating: e.rating,
          ratingHistory: e.ratingHistory,
          recentRanks: e.recentRanks,
          age: e.age,
          sex: e.sex,
          wgBudam: e.wgBudam,
          horseWeight: e.horseWeight,
          equipment: e.equipment,
          rcCntT: e.rcCntT,
          ord1CntT: e.ord1CntT,
          trainingData: e.trainingData,
          sectionalStats: e.sectionalStats,
          jockeyMeetWinRate: jk?.winRateTsum ?? null,
          jockeyMeetQuRate: jk?.quRateTsum ?? null,
          jockeyRcCntT: jk?.rcCntT ?? null,
          jockeyFallbackCareer: jk?.isFallback ?? false,
          trainerWinRate: tr?.winRateTsum ?? null,
          trainerQuRate: tr?.quRateTsum ?? null,
        };
      }),
      results: results.map((r) => ({ rcTime: r.rcTime, ord: r.ord })),
    };
  }

  async analyzeJockey(raceId: number): Promise<AnalyzeJockeyResult> {
    // Step 1: Build input
    const input = await this.buildJockeyAnalysisInput(raceId);

    // Step 2: Compute hash of input data
    const dataHash = this.computeDataHash(input);

    // Step 3: Check cache
    const cached = await this.cacheRepo.findOne({
      where: { raceId, analysisType: 'jockey' },
    });

    if (cached && cached.dataHash === dataHash) {
      this.logger.debug(`Analysis cache HIT for race ${raceId}`);
      return cached.result as unknown as AnalyzeJockeyResult;
    }

    // Step 4: Cache MISS or stale — run Python
    this.logger.log(
      `Analysis cache ${cached ? 'STALE' : 'MISS'} for race ${raceId}, running Python`,
    );
    const rawResult = (await this.runPythonScript(input)) as Record<
      string,
      unknown
    >;

    if (rawResult && typeof rawResult === 'object' && 'error' in rawResult) {
      throw new Error(`Analysis error: ${rawResult.error}`);
    }

    const result: AnalyzeJockeyResult = {
      entriesWithScores:
        (rawResult.entriesWithScores as AnalyzeJockeyResult['entriesWithScores']) ||
        [],
      weightRatio:
        (rawResult.weightRatio as AnalyzeJockeyResult['weightRatio']) || {
          horse: 0.7,
          jockey: 0.3,
        },
      topPickByJockey:
        (rawResult.topPickByJockey as AnalyzeJockeyResult['topPickByJockey']) ??
        null,
    };

    // Step 5: Upsert cache
    if (cached) {
      cached.dataHash = dataHash;
      cached.result = result as unknown as Record<string, unknown>;
      await this.cacheRepo.save(cached);
    } else {
      await this.cacheRepo.save(
        this.cacheRepo.create({
          raceId,
          analysisType: 'jockey',
          dataHash,
          result: result as unknown as Record<string, unknown>,
        }),
      );
    }

    return result;
  }
}
